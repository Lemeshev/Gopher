#!/usr/bin/env node
/* Публикация версий Gopher Life в RuStore через официальный Public API.
   Документация: https://www.rustore.ru/help/work-with-rustore-api/api-upload-publication-app

   ЗАЧЕМ: чтобы выпуск новой версии был одной командой, а не «зайди в консоль и
   загрузи файлы руками». Скриншоты, тексты карточки и APK уже собраны
   (store/, android/app/build/outputs/apk/release/app-release.apk).

   КАК УСТРОЕН ДОСТУП (важно для безопасности)
     Приватный ключ RuStore НЕ хранится в проекте и НЕ попадает в git.
     Он лежит в связке ключей macOS:
         node tools/rustore-publish.js save-key <keyId> <приватный ключ base64>
     Остальное читается оттуда же; можно переопределить окружением
     (RUSTORE_KEY_ID, RUSTORE_PRIVATE_KEY — для CI) или --key-id/--key-file.

   КОМАНДЫ (по умолчанию всё — сухой прогон; запросы уходят только с --go)
     check                доступ: токен + наличие приложения в аккаунте
     status               версии приложения и их статусы
     draft                создать черновик версии (метаданные из store/card.txt)
     apk --version-id N   загрузить APK (главный файл, isMainApk=true)
     images --version-id N иконка и 10 скриншотов 9:16
     commit --version-id N отправить черновик на модерацию
     all                  draft → apk → images → commit
     save-key / forget    положить/удалить ключ в связке ключей macOS

   ЧЕГО ПРОГРАММА НЕ ДЕЛАЕТ (и почему)
     • Не публикует ПЕРВУЮ версию: RuStore не даёт создать черновик через API,
       пока у приложения нет активной версии. Первую версию загружают в
       веб-консоли — чек-лист в store/RUSTORE.md.
     • Не меняет поля карточки, которых нет в API (ссылка на политику
       конфиденциальности, страна публикации) — разовые настройки в консоли.
     • Не удаляет и не архивирует версии.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const API = 'https://public-api.rustore.ru';
const PACKAGE = 'com.gopherlife.app';
const KEYCHAIN_SERVICE = 'gopherlife-rustore';
const KEYCHAIN_ACCOUNT = 'rustore-api';

const args = process.argv.slice(2);
const cmd = args[0] || 'check';
const flag = (name, def = null) => {
  const i = args.indexOf('--' + name);
  return i === -1 ? def : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true);
};
const has = name => args.includes('--' + name);
const GO = has('go');
const JSON_OUT = has('json');

const log = (...a) => { if (!JSON_OUT) console.log(...a); };
// ---------- секреты ----------
function keychainGet() {
  try {
    const raw = execFileSync('security',
      ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w'],
      { encoding: 'utf8' }).trim();
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function credentials() {
  const fromKeychain = keychainGet() || {};
  const keyId = flag('key-id') || process.env.RUSTORE_KEY_ID || fromKeychain.keyId;
  let privateKey = process.env.RUSTORE_PRIVATE_KEY || fromKeychain.privateKey;
  const keyFile = flag('key-file');
  if (!privateKey && keyFile && keyFile !== true) privateKey = fs.readFileSync(keyFile, 'utf8').trim();
  return { keyId, privateKey };
}

// ---------- авторизация ----------
// signature = base64(RSA-SHA512(keyId + timestamp)); ключ — PKCS#8 DER в base64.
// timestamp должен отличаться от серверного не больше чем на 60 секунд.
function makeSignature(keyId, privateKeyBase64) {
  const timestamp = new Date().toISOString();
  const key = crypto.createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'), format: 'der', type: 'pkcs8'
  });
  const sign = crypto.createSign('RSA-SHA512');
  sign.update(keyId + timestamp);
  sign.end();
  return { timestamp, signature: sign.sign(key).toString('base64') };
}

async function getToken() {
  const { keyId, privateKey } = credentials();
  if (!keyId || !privateKey) {
    bad('Нет доступа к RuStore API: ключ не найден',
      'сначала: node tools/rustore-publish.js save-key <keyId> <приватный ключ base64>');
    process.exit(2);
  }
  const body = Object.assign({ keyId: String(keyId) }, makeSignature(String(keyId), privateKey));
  if (!GO) {
    warn('сухой прогон — подпись собрана, но запрос токена не отправлен',
      'keyId ' + String(keyId).slice(0, 3) + '…, timestamp ' + body.timestamp);
    return 'DRY-RUN';
  }
  const res = await fetch(API + '/public/auth/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (data.code !== 'OK' || !data.body || !data.body.jwe) {
    bad('Токен не получен', JSON.stringify(data).slice(0, 300));
    log('     Проверьте: (1) часы системы (timestamp ±60 с), (2) что ключ и keyId от одного набора,');
    log('     (3) что ключ не перевыпущен в консоли после сохранения в связку.');
    process.exit(1);
  }
  ok('Токен получен', 'действует ' + data.body.ttl + ' с');
  return data.body.jwe;
}

// ---------- HTTP ----------
async function api(method, urlPath, { token, body, form, query } = {}) {
  const url = API + urlPath + (query ? '?' + new URLSearchParams(query) : '');
  const headers = { 'Public-Token': token };
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  if (!GO) { warn('сухой прогон — запрос не отправлен', method + ' ' + urlPath); return { code: 'DRY-RUN' }; }
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (e) { data = { raw: text.slice(0, 300) }; }
  if (res.status >= 400 || (data.code && data.code !== 'OK')) {
    bad(method + ' ' + urlPath + ' → HTTP ' + res.status,
      (data.message || data.raw || '').toString().slice(0, 200));
  } else {
    ok(method + ' ' + urlPath);
  }
  return data;
}

const ok = (m, d) => log('  ✅ ' + m + (d ? '  [' + d + ']' : ''));
const warn = (m, d) => log('  ⚠️  ' + m + (d ? '  [' + d + ']' : ''));

// ---------- метаданные карточки ----------
// Тексты не дублируем: берём из store/card.txt (его готовит store-assets.js),
// чтобы карточка в магазине и файлы в проекте говорили одно и то же.
function cardText() {
  const src = fs.readFileSync(path.join(ROOT, 'store', 'card.txt'), 'utf8');
  // Разбираем «=== ЗАГОЛОВОК ===» без регулярок: так не бывает сюрпризов
  // с экранированием, а формат файла всё равно задаёт store-assets.js.
  const blocks = {};
  src.split(/^=== /m).forEach(part => {
    const end = part.indexOf(' ===');
    if (end === -1) return;
    blocks[part.slice(0, end)] = part.slice(end + 4).trim();
  });
  const firstLine = name => ((blocks[name] || '').split('\n')[0] || '').trim();
  // «Что нового» — это отдельный блок card.txt; строку-заголовок «Что нового в 1.3.2:»
  // отрезаем, иначе в карточку уедет служебный текст.
  const whatsKey = Object.keys(blocks).filter(k => k.indexOf('ЧТО НОВОГО') === 0)[0];
  let whatsNew = whatsKey ? blocks[whatsKey] : '';
  if (whatsNew.indexOf('Что нового') === 0) {
    const nl = whatsNew.indexOf('\n');
    if (nl !== -1) whatsNew = whatsNew.slice(nl + 1).trim();
  }
  return {
    title: firstLine('НАЗВАНИЕ'),
    short: firstLine('КРАТКОЕ ОПИСАНИЕ'),
    full: (blocks['ПОЛНОЕ ОПИСАНИЕ'] || '').split('\n=== ')[0].trim(),
    whatsNew: whatsNew
  };
}

function appVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const gradle = fs.readFileSync(path.join(ROOT, 'android', 'app', 'build.gradle'), 'utf8');
  return {
    versionName: (gradle.match(/versionName\s+"([^"]+)"/) || [])[1] || pkg.version,
    versionCode: Number((gradle.match(/versionCode\s+(\d+)/) || [])[1] || 0)
  };
}

function draftBody() {
  const c = cardText(), v = appVersion();
  return {
    appName: c.title,
    appType: 'GAMES',
    categories: ['children', 'simulator'],  // id: «Дети» + «Симуляторы» (полный список — команда categories)
    ageLegal: '0+',                  // RuStore принимает только 0+/6+/12+/16+/18+ (0+ = без насилия и бранных слов)
    shortDescription: c.short,
    fullDescription: c.full,
    whatsNew: c.whatsNew || ('Версия ' + v.versionName),
    moderInfo: 'Детская офлайн-игра про питомца: ничего не собирает, интернета не требует.',
    publishType: 'INSTANTLY',        // опубликовать сразу после модерации
    minAndroidVersion: 5,            // соответствует minSdk 21
    developerContacts: [{ email: flag('email', 'v.lemeshev@corp.mail.ru') }]
  };
}

function apkPath() {
  const p = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  return fs.existsSync(p) ? p : null;
}

function shotFiles() {
  const dir = path.join(ROOT, 'store', 'screens-9x16');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png)$/i.test(f)).sort()
    .map(f => path.join(dir, f));
}

const bad = (m, d) => log('  ❌ ' + m + (d ? '  [' + d + ']' : ''));


// ---------- команды ----------
async function main() {
  log('🎯 RuStore: ' + PACKAGE + ' · команда «' + cmd + '»' + (GO ? ' · РЕАЛЬНЫЕ ЗАПРОСЫ' : ' · сухой прогон'));

  if (cmd === 'save-key') {
    const keyId = args[1];
    let privateKey = args[2];
    if (!keyId) { bad('нужно: save-key <keyId> [приватный ключ | --clipboard]'); process.exit(2); }
    if (!privateKey || privateKey === '--clipboard') {
      // Ключ берём из буфера обмена: он не попадёт ни в историю команд,
      // ни в переписку, ни в файлы проекта.
      try { privateKey = execFileSync('pbpaste', { encoding: 'utf8' }).trim(); } catch (e) { privateKey = ''; }
      if (privateKey.indexOf('MII') !== 0) {
        bad('в буфере обмена нет приватного ключа: скопируйте его из консоли RuStore и повторите');
        process.exit(2);
      }
      log('  ключ прочитан из буфера обмена (pbpaste)');
    }
    if (privateKey.indexOf('MII') !== 0) warn('ключ не похож на base64 PKCS#8 (обычно начинается с «MII…»)');
    execFileSync('security', ['add-generic-password', '-U', '-s', KEYCHAIN_SERVICE,
      '-a', KEYCHAIN_ACCOUNT, '-w', JSON.stringify({ keyId: String(keyId), privateKey: privateKey.trim() })]);
    ok('Ключ сохранён в связке ключей macOS', 'сервис ' + KEYCHAIN_SERVICE + ', в файлы проекта не попадает');
    log('     Совет: ключ, отправленный в переписке текстом, перевыпустите в консоли RuStore.');
    return;
  }
  if (cmd === 'forget') {
    try { execFileSync('security', ['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT]); } catch (e) {}
    ok('Ключ удалён из связки ключей');
    return;
  }

  // Проверка метаданных без обращения к API: что именно уйдёт в карточку.
  // Выполняется ДО авторизации — работает и без сохранённого ключа.
  if (cmd === 'meta') {
    const c = cardText(), v = appVersion(), b = draftBody();
    ok('название', '"' + c.title + '" (' + c.title.length + ' симв., лимит RuStore 50)');
    ok('краткое описание', '"' + c.short + '" (' + c.short.length + ' симв., лимит 80)');
    ok('полное описание', c.full.length + ' симв. (лимит 4000)');
    ok('что нового', (c.whatsNew || '').split('\n')[0] + ' … (' + c.whatsNew.length + ' симв.)');
    ok('версия', v.versionName + ' (versionCode ' + v.versionCode + ')');
    ok('тип и возраст', b.appType + ', ' + b.ageLegal + ', категории ' + b.categories.join(' + '));
    ok('контакты', ((b.developerContacts[0] || {}).email || '') + (b.developerContacts[0].email === 'TODO@example.com' ? '  ← заглушка, нужен реальный e-mail' : ''));
    ok('файлы', 'APK ' + (apkPath() ? 'есть' : 'нет') + ', скриншотов ' + shotFiles().length);
    return;
  }

  const token = await getToken();

  if (['check', 'status', 'categories', 'tags'].indexOf(cmd) !== -1) {
    if (cmd === 'check') {
      const apps = await api('GET', '/public/v1/application', { token, query: { packageName: PACKAGE } });
      const list = (apps.body && (apps.body.content || apps.body)) || [];
      const mine = Array.isArray(list) ? list.filter(a => a.packageName === PACKAGE)[0] : null;
      if (mine) ok('Приложение найдено в аккаунте', 'appId ' + (mine.appId || '?') + ', ' + (mine.appName || ''));
      else if (GO) warn('Приложение с таким packageName в списке не найдено', PACKAGE);
    }
    if (cmd === 'status') {
      const vs = await api('GET', '/public/v1/application/' + PACKAGE + '/version', { token });
      const list = (vs.body && vs.body.content) || [];
      if (!list.length) log('  версий пока нет (для самой первой это ожидаемо — её грузят в консоли)');
      list.forEach(v => log('  · ' + v.versionCode + ' (' + v.versionName + ') — ' + v.versionStatus +
        (v.moderationComment ? ' · ' + v.moderationComment : '')));
    }
    if (cmd === 'categories') await api('GET', '/public/v1/application/category', { token });
    if (cmd === 'tags') await api('GET', '/public/v1/application/tag', { token });
    return;
  }

  // ---------- выпуск версии ----------
  const stateFile = path.join(ROOT, '.rustore-state.json');
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
  let versionId = flag('version-id') || state.versionId;

  if (cmd === 'draft' || cmd === 'all') {
    const body = draftBody(), v = appVersion();
    log('  черновик: ' + v.versionName + ' (' + v.versionCode + '), ' + body.ageLegal +
      ', категории ' + body.categories.join(', ') + ', APK: ' + (apkPath() ? 'найден' : 'НЕТ'));
    log('  краткое описание: ' + body.shortDescription);
    const res = await api('POST', '/public/v1/application/' + PACKAGE + '/version', { token, body });
    versionId = res.body || versionId;
    if (GO && versionId) {
      fs.writeFileSync(stateFile, JSON.stringify({ versionId, at: new Date().toISOString(),
        versionName: v.versionName, versionCode: v.versionCode }, null, 2));
      ok('Черновик создан', 'versionId ' + versionId + ' (записан в .rustore-state.json)');
    }
  }

  if ((cmd === 'apk' || cmd === 'all') && versionId) {
    const file = apkPath();
    if (!file) { bad('APK не найден', 'сначала npm run apk:desktop'); return; }
    log('  APK: ' + path.basename(file) + ', ' + Math.round(fs.statSync(file).size / 1024) + ' КБ');
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(file)],
      { type: 'application/vnd.android.package-archive' }), path.basename(file));
    await api('POST', '/public/v1/application/' + PACKAGE + '/version/' + versionId + '/apk',
      { token, form, query: { servicesType: 'Unknown', isMainApk: 'true' } });
  }

  if ((cmd === 'images' || cmd === 'all') && versionId) {
    const shots = shotFiles();
    log('  скриншотов к загрузке: ' + shots.length + ' (RuStore: минимум 3, максимум 10)');
    for (let i = 0; i < Math.min(shots.length, 10); i++) {
      const file = shots[i];
      const form = new FormData();
      form.append('file', new Blob([fs.readFileSync(file)], { type: 'image/jpeg' }), path.basename(file));
      await api('POST', '/public/v2/application/' + PACKAGE + '/version/' + versionId +
        '/image/screenshot/PORTRAIT/' + i + '/SCREENSHOT', { token, form });
    }
    log('  иконка (store/icon-512.png) заливается в консоли один раз — если API её не примет, это не блокер');
  }

  if ((cmd === 'commit' || cmd === 'all') && versionId) {
    await api('POST', '/public/v1/application/' + PACKAGE + '/version/' + versionId + '/commit',
      { token, query: { priorityUpdate: 0 } });
    log('  дальше модерация RuStore; статус: node tools/rustore-publish.js status --go');
  }

  if (!GO) log('\n  Это сухой прогон: ни один запрос не отправлен. Повторите с --go, когда всё верно.');
}

main().catch(e => { bad('Сбой: ' + e.message); process.exit(1); });
