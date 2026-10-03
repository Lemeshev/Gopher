#!/usr/bin/env node
/* Выкладывает собранный release-APK в GitHub Releases, чтобы кнопка
   «Обновить приложение» (https://github.com/Lemeshev/Gopher/releases/latest/download/Gopher.apk)
   отдавала актуальную версию. Раньше это делалось руками, и релиз забывали — в
   игре кнопка обновления продолжала качать старую версию.

   Токен берётся из git credential helper (osxkeychain) — тот же, которым git push
   ходит на GitHub. Никуда не пишется и не печатается.

   Запуск: node tools/gh-release.js      (создать релиз под текущий тег + APK)
   Повторный запуск безопасен: релиз найдётся, старый APK перезапишется. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OWNER = 'Lemeshev';
const REPO = 'Gopher';

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }

const version = (read('www/js/helpers.js').match(/GAME_VERSION = '([^']+)'/) || [])[1] || '?';
const tag = 'v' + version;
const apk = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

if (!fs.existsSync(apk)) {
  console.error('❌ Нет собранного release-APK: ' + path.relative(ROOT, apk));
  console.error('   Сначала: npm run build');
  process.exit(1);
}

function getToken() {
  const r = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8'
  });
  const m = (r.stdout || '').match(/^password=(.*)$/m);
  return m ? m[1].trim() : '';
}

const token = getToken();
if (!token) {
  console.error('❌ Не удалось взять GitHub-токен из git credential helper.');
  console.error('   Проверьте, что git push по HTTPS работает (credential.helper=osxkeychain).');
  process.exit(1);
}

// Текст релиза — из раздела «Что нового в <версия>» store/card.txt, если есть.
function bodyFor() {
  const card = read('store/card.txt');
  const head = 'Что нового в ' + version + ':';
  const i = card.indexOf(head);
  if (i === -1) return 'Версия ' + version + ' (Gopher Life).';
  const from = i + head.length;
  const j = card.indexOf('\nЧто нового в ', from);
  const rest = j === -1 ? card.slice(from) : card.slice(from, j);
  return rest.split('\n').filter(l => l.trim()).map(l => l.trim().replace(/^•\s*/, '- ')).join('\n').trim();
}

function api(method, url, body, contentType) {
  const headers = {
    Authorization: 'token ' + token,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gopher-life-release'
  };
  if (contentType) headers['Content-Type'] = contentType;
  return fetch(url, { method, headers, body }).then(async r => {
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { json = { raw: text.slice(0, 200) }; }
    return { status: r.status, json };
  });
}

(async () => {
  console.log('🚀 Gopher Life — GitHub Release ' + version + ' (' + tag + ')');

  // 1) Найти существующий релиз по тегу или создать новый
  let release = null;
  const got = await api('GET', `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${tag}`);
  if (got.status === 200 && got.json && got.json.id) {
    release = got.json;
    console.log('   релиз уже есть: ' + release.html_url);
  } else {
    const body = bodyFor();
    const created = await api('POST', `https://api.github.com/repos/${OWNER}/${REPO}/releases`,
      JSON.stringify({ tag_name: tag, name: version, body, draft: false, prerelease: false }),
      'application/json');
    if (created.status !== 201 || !created.json.id) {
      console.error('❌ Не удалось создать релиз: ' + JSON.stringify(created.json));
      process.exit(1);
    }
    release = created.json;
    console.log('   релиз создан: ' + release.html_url);
  }

  // 2) Старый APK в этом релизе убрать (иначе имя Gopher.apk уже занято)
  for (const a of (release.assets || [])) {
    if (a.name === 'Gopher.apk') {
      await api('DELETE', `https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${a.id}`);
    }
  }

  // 3) Загрузить свежий APK
  const buf = fs.readFileSync(apk);
  const up = await api('POST',
    `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${release.id}/assets?name=Gopher.apk`,
    buf, 'application/octet-stream');
  if (up.status !== 201 || !up.json.id) {
    console.error('❌ Не удалось загрузить APK: ' + JSON.stringify(up.json));
    process.exit(1);
  }
  const kb = Math.round(buf.length / 1024);
  const md5 = require('crypto').createHash('md5').update(buf).digest('hex');
  console.log('✅ APK выложен: ' + up.json.browser_download_url);
  console.log('   размер ' + kb + ' КБ, md5 ' + md5);
  console.log('   кнопка «Обновить приложение» теперь качает:');
  console.log('   https://github.com/' + OWNER + '/' + REPO + '/releases/latest/download/Gopher.apk');
})().catch(e => {
  console.error('❌ Ошибка: ' + (e && e.message ? e.message : e));
  process.exit(1);
});