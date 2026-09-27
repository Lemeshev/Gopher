#!/usr/bin/env node
/* ============================================================
   ИНСТРУМЕНТ ПРОВЕРКИ КАЧЕСТВА — 4 независимых ревьюера
   1) Статический анализ  2) Запуск в эмуляторе браузера
   3) Функциональные клики 4) Целостность собранного APK
   Запуск: node tools/verify.js   (код выхода 0 = всё принято)
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const ASSETS = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'www');
const ICON_FG = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable', 'ic_launcher_foreground.xml');
const ICON_BG = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable', 'ic_launcher_background.xml');
const ICON_ADAPTIVE = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', 'ic_launcher.xml');
const RES_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const MIPMAP_DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const MANIFEST = path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const APK_DEBUG = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const APK_RELEASE = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const APK = fs.existsSync(APK_RELEASE) ? APK_RELEASE : APK_DEBUG;

const SCRIPT_ORDER = [
  'js/helpers.js', 'js/gopher.js', 'js/system.js', 'js/audio.js',
  'js/game_menu.js', 'js/game_map.js', 'js/game_home.js', 'js/game_shop.js',
  'js/game_minigames.js', 'js/game_stats.js', 'js/game_clinic.js', 'js/game.js'
];

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('  \u2705 ' + name + (detail ? '  [' + detail + ']' : '')); }
  else { failed++; console.log('  \u274C ' + name + (detail ? '  [' + detail + ']' : '')); }
  return ok;
}

/* Тело блока {...} по индексу открывающей скобки (с учётом вложенности) */
function blockAt(src, openIdx) {
  if (openIdx < 0 || src[openIdx] !== '{') return null;
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(openIdx + 1, i); }
  }
  return null;
}

/* ---------- РЕВЬЮЕР 1: статический анализ ---------- */
function reviewerStatic() {
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 1/4 — Статический анализ исходников');

  let syntaxOk = true;
  for (const f of fs.readdirSync(path.join(WWW, 'js'))) {
    if (!f.endsWith('.js')) continue;
    try { new vm.Script(fs.readFileSync(path.join(WWW, 'js', f), 'utf8'), { filename: f }); }
    catch (e) { syntaxOk = false; check('Синтаксис ' + f, false, e.message); }
  }
  check('Синтаксис всех JS-файлов корректен', syntaxOk);

  const junk = fs.readdirSync(path.join(WWW, 'js')).filter(f => /\.(bak|orig|tmp|swp)$/.test(f));
  check('Нет мусорных файлов (.bak/.orig) в проекте', junk.length === 0, junk.join(', ') || 'чисто');

  const rootJunk = fs.readdirSync(ROOT).filter(f => /^(temp_|final_).*\.html$/.test(f) || /\.(bak|orig|tmp|swp)$/.test(f));
  check('Нет временных файлов в корне проекта', rootJunk.length === 0, rootJunk.join(', ') || 'чисто');

  const jsFiles = fs.readdirSync(path.join(WWW, 'js')).filter(f => f.endsWith('.js'));
  const rels = ['index.html', 'css/style.css'].concat(jsFiles.map(f => 'js/' + f));
  let syncOk = true, syncDetail = rels.length + ' файлов';
  for (const rel of rels) {
    const a = path.join(WWW, rel), b = path.join(ASSETS, rel);
    if (!fs.existsSync(b)) { syncOk = false; syncDetail = 'нет ' + rel; break; }
    if (!fs.readFileSync(a).equals(fs.readFileSync(b))) { syncOk = false; syncDetail = 'расходится ' + rel; break; }
  }
  check('www/ и android assets/www/ синхронизированы', syncOk, syncDetail);

  const idx = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  check('index.html вызывает new Game().init()', /new Game\(\)/.test(idx) && /game\.init\(\)/.test(idx));
  check('index.html подключает все ' + SCRIPT_ORDER.length + ' скриптов', SCRIPT_ORDER.every(s => idx.indexOf(s) !== -1));
  const styleStart = idx.indexOf('<style>'), styleEnd = idx.indexOf('</style>');
  const styleSrc = (styleStart !== -1 && styleEnd !== -1) ? idx.slice(styleStart, styleEnd) : '';
  const hbIdx = styleSrc.indexOf('html, body');
  const hbBody = blockAt(styleSrc, hbIdx === -1 ? -1 : styleSrc.indexOf('{', hbIdx));
  check('CSS в index.html без вложенных правил', hbBody !== null && hbBody.indexOf('{') === -1,
        hbBody === null ? 'правило html, body не разобрано' : 'правило html, body корректно');
  check('В разметке есть элемент #achievement-popup', /id="achievement-popup"/.test(idx));

  const iconFg = fs.readFileSync(ICON_FG, 'utf8');
  const iconBg = fs.readFileSync(ICON_BG, 'utf8');
  const adaptive = fs.readFileSync(ICON_ADAPTIVE, 'utf8');
  const manifest = fs.readFileSync(MANIFEST, 'utf8');

  check('Adaptive icon для Android 8+ (API 26)', adaptive.indexOf('<adaptive-icon') !== -1 &&
        adaptive.indexOf('@drawable/ic_launcher_foreground') !== -1 &&
        adaptive.indexOf('@drawable/ic_launcher_background') !== -1);
  check('Иконка: foreground — vector drawable с гофером', iconFg.indexOf('<vector') !== -1 && /#BFE6F2/i.test(iconFg));
  check('Иконка: background — фирменный Go-синий', iconBg.indexOf('#00ADD8') !== -1);
  check('Иконка без чёрного "жукоподобного" тела',
        iconFg.indexOf('#2C3E50') === -1 && iconBg.indexOf('#2C3E50') === -1);

  const pngMissing = MIPMAP_DENSITIES.filter(d => !fs.existsSync(path.join(RES_DIR, 'mipmap-' + d, 'ic_launcher.png')));
  check('PNG-иконки для Android 5–7 (все 5 плотностей)', pngMissing.length === 0,
        pngMissing.length ? 'нет: ' + pngMissing.join(', ') : MIPMAP_DENSITIES.length + ' плотности');
  check('Manifest: иконка через @mipmap (vector-иконки не работают на API<26)',
        /android:icon="@mipmap\/ic_launcher"/.test(manifest) && !/android:icon="@drawable\//.test(manifest));

  const gopherSrc = fs.readFileSync(path.join(WWW, 'js/gopher.js'), 'utf8');
  check('Маскот в игре — светлая палитра гофера (не "жук")',
        gopherSrc.indexOf('#7EC8E3') !== -1 && gopherSrc.indexOf('#2C3E50') === -1);
  check('Маскот: убраны кольца-обводки и "бивни"-скважина',
        gopherSrc.indexOf('ОГРОМНЫЕ БИВНИ') === -1 && gopherSrc.indexOf('-s*0.35, s*0.38') === -1);

  const menu = fs.readFileSync(path.join(WWW, 'js/game_menu.js'), 'utf8');
  check('В главном меню нет кнопки "Об авторе"', menu.indexOf('Об авторе') === -1 && menu.indexOf('showAbout') === -1);
  check('createButton() возвращает поле text (корень бага с кнопками)',
        fs.readFileSync(path.join(WWW, 'js/helpers.js'), 'utf8').indexOf('return { x, y, w, h, text }') !== -1);
  let drawOk = true, drawDetail = 'все сцены с кнопками';
  for (const f of jsFiles) {
    const src = fs.readFileSync(path.join(WWW, 'js', f), 'utf8');
    const di = src.indexOf('draw(ctx)');
    if (di === -1) continue;
    const body = blockAt(src, src.indexOf('{', di));
    if (body === null) { drawOk = false; drawDetail = 'не разобран draw() в ' + f; break; }
    if (body.indexOf('this.buttons.push') !== -1 && body.indexOf('this.buttons = []') === -1) {
      drawOk = false; drawDetail = 'нет сброса buttons в ' + f; break;
    }
  }
  check('Сцены сбрасывают buttons в draw() (нет утечки)', drawOk, drawDetail);
}

/* ---------- Эмулятор браузера ---------- */
function createSandbox() {
  const gradient = { addColorStop() {} };
  const ctxStub = new Proxy({
    canvas: { width: 360, height: 640 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => null,
    getImageData: () => ({ data: [] })
  }, {
    get(t, p) { return p in t ? t[p] : function () {}; },
    set(t, p, v) { t[p] = v; return true; }
  });

  const canvas = {
    width: 360, height: 640, style: {},
    getContext: () => ctxStub,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 360, height: 640, right: 360, bottom: 640 }),
    addEventListener() {}, removeEventListener() {}, focus() {}
  };

  const store = new Map();
  const doc = {
    getElementById: id => (id === 'gameCanvas' ? canvas : null),
    createElement: () => ({
      id: '', style: {}, innerHTML: '', textContent: '',
      classList: { add() {}, remove() {}, contains: () => false },
      querySelector: () => null, appendChild() {}, setAttribute() {}
    }),
    addEventListener() {}, removeEventListener() {},
    body: { appendChild() {} },
    documentElement: {}
  };

  const sandbox = {
    console,
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => 0,
    setTimeout: () => 0, clearTimeout: () => {},
    setInterval: () => 0, clearInterval: () => {},
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: k => { store.delete(k); }
    },
    document: doc,
    innerWidth: 360,
    innerHeight: 640,
    addEventListener() {}, removeEventListener() {},
    navigator: { userAgent: 'verify-harness' }
  };
  sandbox.window = sandbox;
  sandbox.__ctxStub = ctxStub;
  vm.createContext(sandbox);
  return sandbox;
}

function bootGame(sandbox) {
  for (const rel of SCRIPT_ORDER) {
    vm.runInContext(fs.readFileSync(path.join(WWW, rel), 'utf8'), sandbox, { filename: rel });
  }
  vm.runInContext('var __game = new Game(); __game.init();', sandbox, { filename: 'boot' });
  return sandbox.__game;
}

/* ---------- РЕВЬЮЕР 2: запуск и кадры ---------- */
function reviewerRuntime() {
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 2/4 — Запуск в эмуляторе браузера (boot + кадры всех сцен)');

  let sandbox = null, game = null, bootErr = null;
  try { sandbox = createSandbox(); game = bootGame(sandbox); }
  catch (e) { bootErr = e; }
  if (!check('Игра стартует без исключений (new Game().init())', !bootErr, bootErr ? bootErr.message : 'OK')) return null;

  check('Создано 7 игровых сцен', Object.keys(game.scenes).length === 7, Object.keys(game.scenes).join(', '));
  check('Стартовая сцена — menu', game.currentScene === 'menu');
  check('Canvas получил размеры окна', game.width === 360 && game.height === 640, game.width + 'x' + game.height);

  let frameErr = null;
  try {
    vm.runInContext(`(function(){
      for (const n of Object.keys(__game.scenes)) {
        __game.currentScene = n;
        __game.scenes[n].init();
        for (let i = 0; i < 90; i++) {
          __game.scenes[n].update(16);
          __game.ctx.clearRect(0, 0, __game.width, __game.height);
          __game.scenes[n].draw(__game.ctx);
        }
      }
    })();`, sandbox);
  } catch (e) { frameErr = e; }
  check('630 кадров (7 сцен x 90) отрисованы без ошибок', !frameErr, frameErr ? frameErr.message : 'OK');

  let leak = { max: -1, worst: '' };
  try {
    leak = vm.runInContext(`(function(){
      let max = 0, worst = '';
      for (const n of Object.keys(__game.scenes)) {
        __game.currentScene = n;
        __game.scenes[n].init();
        for (let i = 0; i < 300; i++) __game.scenes[n].draw(__game.ctx);
        const c = (__game.scenes[n].buttons || []).length + (__game.scenes[n].locationButtons || []).length;
        if (c > max) { max = c; worst = n; }
      }
      return { max: max, worst: worst };
    })();`, sandbox);
  } catch (e) { leak = { max: 9999, worst: e.message }; }
  check('Число кнопок не растёт от кадров к кадру (нет утечки)', leak.max > 0 && leak.max <= 30,
        'макс ' + leak.max + ' в сцене "' + leak.worst + '"');

  return { sandbox, game };
}

/* ---------- РЕВЬЮЕР 3: клики и навигация ---------- */
function reviewerClicks(runtime) {
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 3/4 — Функциональные клики и навигация');

  if (!runtime) {
    check('Сценарий кликов выполнен', false, 'пропущен: игра не запустилась');
    return;
  }
  const sandbox = runtime.sandbox;

  let log = null, err = null;
  try {
    log = vm.runInContext(`(function(){
      const L = [];
      const ok = (n, v, d) => L.push([n, !!v, d || '']);
      const click = b => __game.handleClick(b.x + b.w / 2, b.y + b.h / 2);

      try { localStorage.removeItem('gopherlife_save'); } catch (e) {}

      /* --- ГЛАВНОЕ МЕНЮ --- */
      __game.currentScene = 'menu';
      __game.scenes.menu.init();
      __game.scenes.menu.draw(__game.ctx);
      const mb = __game.scenes.menu.buttons || [];
      ok('Меню: кнопки отрисованы', mb.length >= 2, 'их ' + mb.length);
      ok('createButton() вернул поле text', mb.length > 0 && mb.every(b => typeof b.text === 'string'));
      const ng = mb.filter(b => (b.text || '').indexOf('Новая игра') !== -1)[0];
      ok('Меню: есть кнопка "Новая игра"', !!ng);
      if (ng) {
        click(ng);
        ok('Клик "Новая игра" -> открывается карта', __game.currentScene === 'map', 'сцена: ' + __game.currentScene);
      }

      /* --- КАРТА МИРА --- */
      __game.scenes.map.draw(__game.ctx);
      const locs = __game.scenes.map.locationButtons || [];
      ok('Карта: локации отрисованы', locs.length >= 5, 'их ' + locs.length);
      const homeLoc = locs.filter(b => b.loc && b.loc.id === 'home')[0];
      ok('Карта: есть локация "Дом"', !!homeLoc);
      if (homeLoc) {
        click(homeLoc);
        ok('Клик "Дом" -> сцена дома', __game.currentScene === 'home', 'сцена: ' + __game.currentScene);
      }

      /* --- ДОМ: функциональные действия --- */
      __game.scenes.home.draw(__game.ctx);
      const hb = __game.scenes.home.buttons || [];
      ok('Дом: панель действий отрисована', hb.length >= 5, 'кнопок ' + hb.length);
      const feed = hb.filter(b => b.action === 'feed')[0];
      ok('Дом: найдена кнопка "Покормить"', !!feed);
      if (feed) {
        const before = System.stats.hunger;
        click(feed);
        ok('Дом: "Покормить" повышает сытость', System.stats.hunger > before,
           before + ' -> ' + System.stats.hunger);
      }
      const toMap = hb.filter(b => b.action === 'map')[0];
      ok('Дом: найдена кнопка "Карта"', !!toMap);
      if (toMap) {
        click(toMap);
        ok('Дом: возврат на карту работает', __game.currentScene === 'map', 'сцена: ' + __game.currentScene);
      }

      /* --- МАГАЗИН --- */
      __game.currentScene = 'map';
      __game.scenes.map.draw(__game.ctx);
      const shopLoc = (__game.scenes.map.locationButtons || []).filter(b => b.loc && b.loc.id === 'shop')[0];
      ok('Карта: есть локация "Магазин"', !!shopLoc);
      if (shopLoc) {
        click(shopLoc);
        ok('Клик "Магазин" -> сцена магазина', __game.currentScene === 'shop', 'сцена: ' + __game.currentScene);
      }

      /* --- СТАТИСТИКА --- */
      __game.currentScene = 'map';
      __game.scenes.map.draw(__game.ctx);
      const stLoc = (__game.scenes.map.locationButtons || []).filter(b => b.loc && b.loc.id === 'stats')[0];
      ok('Карта: есть локация "Инфо/Статистика"', !!stLoc);
      if (stLoc) {
        click(stLoc);
        ok('Клик "Инфо" -> сцена статистики', __game.currentScene === 'stats', 'сцена: ' + __game.currentScene);
      }

      /* --- КНОПКА "ВЕРНУТЬСЯ" НА КАРТЕ --- */
      __game.currentScene = 'map';
      __game.scenes.map.init();
      __game.scenes.map.draw(__game.ctx);
      const back = (__game.scenes.map.buttons || [])[0];
      ok('Карта: есть кнопка "Вернуться"', !!back);
      if (back) {
        click(back);
        ok('Клик "Вернуться" -> главное меню', __game.currentScene === 'menu', 'сцена: ' + __game.currentScene);
      }

      /* --- ТУТОРИАЛ --- */
      __game.currentScene = 'menu';
      __game.scenes.menu.init();
      __game.showTutorial();
      ok('Туториал открывается', __game.tutorialVisible === true);
      let steps = 0;
      while (__game.tutorialVisible && steps < 12) {
        __game.drawTutorial();
        const next = (__game.buttons || []).filter(b => b.action === 'tutorial-next')[0];
        if (!next) break;
        click(next);
        steps++;
      }
      ok('Туториал листается и закрывается', __game.tutorialVisible === false, 'шагов: ' + steps);

      return L;
    })();`, sandbox);
  } catch (e) { err = e; }

  if (err) { check('Сценарий кликов выполнен без исключений', false, err.message); return; }
  for (const row of log) check(row[0], row[1], row[2]);
  check('Все функциональные проверки пройдены', log.every(r => r[1]));
}

/* ---------- РЕВЬЮЕР 4: целостность APK ---------- */
function reviewerApk() {
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 4/4 — Целостность собранного APK');

  if (!check('APK собран', fs.existsSync(APK), path.relative(ROOT, APK))) return;

  let list = '';
  try { list = cp.execSync('unzip -l "' + APK + '"', { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
  catch (e) { check('APK читается как zip', false, e.message); return; }
  check('APK содержит assets/www/index.html', list.indexOf('assets/www/index.html') !== -1);
  // В release-сборке AGP переименовывает файлы ресурсов (res/XX.xml),
  // поэтому имя ресурса ищем в содержимом APK (resources.arsc), а не в списке файлов
  let iconOk = list.indexOf('ic_launcher') !== -1;
  if (!iconOk) {
    try { iconOk = fs.readFileSync(APK).indexOf(Buffer.from('ic_launcher')) !== -1; } catch (e) { iconOk = false; }
  }
  check('APK содержит ресурс иконки ic_launcher', iconOk);

  let idxOk = false;
  try {
    const idxApk = cp.execSync('unzip -p "' + APK + '" assets/www/index.html',
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    idxOk = /new Game\(\)/.test(idxApk) && /game\.init\(\)/.test(idxApk);
  } catch (e) { idxOk = false; }
  check('index.html внутри APK запускает игру', idxOk);

  let jsOk = true, jsDetail = SCRIPT_ORDER.length + ' файлов';
  for (const rel of SCRIPT_ORDER) {
    try {
      const inApk = cp.execSync('unzip -p "' + APK + '" assets/www/' + rel, { maxBuffer: 10 * 1024 * 1024 });
      if (!inApk.equals(fs.readFileSync(path.join(WWW, rel)))) { jsOk = false; jsDetail = 'устарел ' + rel; break; }
    } catch (e) { jsOk = false; jsDetail = 'отсутствует ' + rel; break; }
  }
  check('JS внутри APK идентичны исходникам (не устарели)', jsOk, jsDetail);

  const junk = list.split('\n').filter(l => /ic_gopher.*\.png/.test(l));
  check('В APK нет мусорных PNG-заглушек', junk.length === 0);

  check('Собран именно release-APK (не debug)', APK === APK_RELEASE, path.basename(APK));

  let certOk = false, certInfo = '';
  try {
    const os = require('os');
    const sig = cp.execSync('unzip -p "' + APK + '" "META-INF/*.RSA"', { maxBuffer: 4 * 1024 * 1024 });
    const tmp = path.join(os.tmpdir(), 'gopher_sig.rsa');
    fs.writeFileSync(tmp, sig);
    const out = cp.execSync('keytool -printcert -file "' + tmp + '" 2>&1', { encoding: 'utf8' });
    const m = out.match(/CN=[^,\n]*/);
    certInfo = m ? m[0] : 'сертификат прочитан';
    certOk = out.indexOf('Gopher Life') !== -1;
  } catch (e) { certOk = false; certInfo = String(e.message).slice(0, 70); }
  check('APK подписан релизным ключом проекта', certOk, certInfo);
}

/* ---------- ЗАПУСК ---------- */
console.log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550 Gopher Life \u2014 приёмка качества \u2550\u2550\u2550\u2550\u2550\u2550\u2557');
reviewerStatic();
const rt = reviewerRuntime();
reviewerClicks(rt);
reviewerApk();

console.log('\n' + '\u2500'.repeat(56));
console.log('ИТОГО: пройдено ' + passed + '  |  провалено ' + failed);
if (failed === 0) {
  console.log('\u2705 ВСЕ 4 РЕВЬЮЕРА ПРИНЯЛИ РЕЗУЛЬТАТ БЕЗ ЗАМЕЧАНИЙ');
  process.exit(0);
} else {
  console.log('\u274C ЕСТЬ ЗАМЕЧАНИЯ \u2014 результат НЕ принимается');
  process.exit(1);
}
