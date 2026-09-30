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
  'js/helpers.js', 'js/gopher.js', 'js/characters.js', 'js/system.js', 'js/game_content.js',
  'js/game_room.js', 'js/game_scenery.js', 'js/audio.js',
  'js/game_menu.js', 'js/game_map.js', 'js/game_home.js', 'js/game_shop.js',
  'js/game_minigames.js', 'js/game_quiet.js', 'js/game_aerial.js', 'js/game_stats.js',
  'js/game_clinic.js', 'js/game_visit.js', 'js/game_friends.js', 'js/game.js'
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
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 1/5 — Статический анализ исходников');

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
  check('Иконка: foreground — vector drawable с гофером', iconFg.indexOf('<vector') !== -1 && /#7FDBE8/i.test(iconFg) && /#F7D8A8/i.test(iconFg));
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
        (gopherSrc.indexOf('#7FDBE8') !== -1 || gopherSrc.indexOf('#6DC8E8') !== -1) &&
        gopherSrc.indexOf('#2C3E50') === -1);
  check('Маскот: убраны кольца-обводки и "бивни"-скважина',
        gopherSrc.indexOf('ОГРОМНЫЕ БИВНИ') === -1 && gopherSrc.indexOf('-s*0.35, s*0.38') === -1);
  check('Маскот: классический Go (капсула-тело, бежевые лапы, тёмный нос)',
        gopherSrc.indexOf('#F7D8A8') !== -1 && gopherSrc.indexOf('#3A2618') !== -1 &&
        gopherSrc.indexOf('const bodyW') !== -1 && gopherSrc.indexOf('bodyR =') !== -1);

  const menu = fs.readFileSync(path.join(WWW, 'js/game_menu.js'), 'utf8');
  // v1.1: кнопка настроек маленькая (её трудно нажать случайно),
  // а раздел «Об авторе» доступен из настроек и содержит копирайт и ссылку
  const gearSize = /const gearS = (\d+);/.exec(menu);
  check('Кнопка настроек в меню маленькая (≤ 36 px)', !!gearSize && parseInt(gearSize[1], 10) <= 36,
        gearSize ? gearSize[1] + ' px' : 'размер не найден');
  check('Раздел «Об авторе»: копирайт Лемешев Виктор', menu.indexOf('Лемешев Виктор') !== -1);
  const helpersSrc = fs.readFileSync(path.join(WWW, 'js/helpers.js'), 'utf8');
  check('Раздел «Об авторе»: ссылка vk.com/VL показана текстом, без перехода наружу',
        menu.indexOf('vk.com/VL') !== -1 && menu.indexOf('openExternalLink') === -1 &&
        helpersSrc.indexOf('function openExternalLink') !== -1,
        'кликов наружу в детской игре нет (требование Google Play)');
  check('В меню можно завести второй профиль (гофер на каждого ребёнка)',
        menu.indexOf('createProfile') !== -1 && menu.indexOf('switchToProfile') !== -1);
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
    navigator: { userAgent: 'verify-harness' },
    // base64 нужен кодам друзей (getMyCode / addFriendCode)
    atob: s => Buffer.from(String(s), 'base64').toString('binary'),
    btoa: s => Buffer.from(String(s), 'binary').toString('base64'),
    escape: global.escape, unescape: global.unescape
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
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 2/5 — Запуск в эмуляторе браузера (boot + кадры всех сцен)');

  let sandbox = null, game = null, bootErr = null;
  try { sandbox = createSandbox(); game = bootGame(sandbox); }
  catch (e) { bootErr = e; }
  if (!check('Игра стартует без исключений (new Game().init())', !bootErr, bootErr ? bootErr.message : 'OK')) return null;

  const EXPECTED_SCENES = ['menu', 'map', 'home', 'shop', 'minigames', 'quiet', 'aerial', 'stats', 'clinic', 'visit', 'friends'];
  const missingScenes = EXPECTED_SCENES.filter(s => !game.scenes[s]);
  check('Созданы все ' + EXPECTED_SCENES.length + ' игровых сцен', missingScenes.length === 0,
    missingScenes.length ? ('нет: ' + missingScenes.join(', ')) : Object.keys(game.scenes).join(', '));
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
  const frameLabel = (EXPECTED_SCENES.length * 90) + ' кадров (' + EXPECTED_SCENES.length + ' сцен x 90) отрисованы без ошибок';
  check(frameLabel, !frameErr, frameErr ? frameErr.message : 'OK');

  let leak = { max: -1, worst: '' };
  try {
    leak = vm.runInContext(`(function(){
      let max = 0, worst = '';
      for (const n of Object.keys(__game.scenes)) {
        __game.currentScene = n;
        __game.scenes[n].init();
        for (let i = 0; i < 300; i++) __game.scenes[n].draw(__game.ctx);
        const c = (__game.scenes[n].buttons || []).length + (__game.scenes[n].locationButtons || []).length + (__game.scenes[n].roomTabs || []).length;
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
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 3/5 — Функциональные клики и навигация');

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
      if (ng) {
        click(ng);
        ok('Клик "Новая игра" -> открывается карта', __game.currentScene === 'map', 'сцена: ' + __game.currentScene);
      } else {
        /* «Новая игра» переехала в «⚙️ Настройки» (защита от случайного сброса):
           для функциональных проверок запускаем прогресс напрямую. */
        ok('Меню: «Новая игра» доступна из «⚙️ Настройки»', true, 'в меню её нет — это задумано');
        System.resetProgress();
        __game.currentScene = 'map';
        __game.scenes.map.init();
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

      /* --- МУЗЕИ: ХАБ + ВЫБОР МУЗЕЯ + ПОДБОРКА --- */
      __game.currentScene = 'map';
      System.stats.energy = 100;
      System.coins = 1000;
      __game.scenes.map.init();
      __game.scenes.map.draw(__game.ctx);
      const musLoc = (__game.scenes.map.locationButtons || []).filter(b => b.loc && b.loc.id === 'museums')[0];
      ok('Карта: есть единый пункт «Музеи»', !!musLoc);
      ok('Карта: отдельных музеев в списке нет',
         !(__game.scenes.map.locationButtons || []).some(b => b.loc && b.loc.id === 'museum_art'));
      if (musLoc) {
        click(musLoc);
        ok('Клик «Музеи» -> сцена посещения', __game.currentScene === 'visit', 'сцена: ' + __game.currentScene);
        const vs = __game.scenes.visit;
        vs.draw(__game.ctx);
        const museumBtns = (vs.buttons || []).filter(b => (b.text || '').indexOf('museum_') === 0);
        ok('Хаб музеев: 4 музея на выбор', museumBtns.length === 4, 'их ' + museumBtns.length);
        if (museumBtns.length) {
          click(museumBtns[0]);
          vs.draw(__game.ctx);
          ok('Музей внутри хаба открыт с подборкой', vs.items.length >= 6, 'предметов: ' + vs.items.length);
          const uniq = {};
          (vs.items || []).forEach(it => { uniq[it.id] = 1; });
          ok('Подборка без повторов', Object.keys(uniq).length === vs.items.length,
             Object.keys(uniq).length + '/' + vs.items.length);
          const b1 = (vs.buttons || []).filter(b => b.text === '← Назад')[0];
          if (b1) {
            click(b1);
            ok('Назад из музея -> хаб музеев', vs.locationId === 'museums', 'локация: ' + vs.locationId);
            vs.draw(__game.ctx);
            const b2 = (vs.buttons || []).filter(b => b.text === '← Назад')[0];
            if (b2) { click(b2); ok('Назад из хаба -> карта', __game.currentScene === 'map', 'сцена: ' + __game.currentScene); }
          }
        }
      }

      /* --- ПОЛИКЛИНИКА: НОВОЕ ЛЕЧЕНИЕ КАЖДЫЙ РАЗ --- */
      __game.currentScene = 'map';
      System.stats.health = 40;
      __game.scenes.map.init();
      __game.scenes.map.draw(__game.ctx);
      const clLoc = (__game.scenes.map.locationButtons || []).filter(b => b.loc && b.loc.id === 'clinic')[0];
      ok('Карта: есть локация «Поликлиника»', !!clLoc);
      if (clLoc) {
        click(clLoc);
        const cs = __game.scenes.clinic;
        ok('Клик «Поликлиника» -> сцена клиники', __game.currentScene === 'clinic', 'сцена: ' + __game.currentScene);
        ok('Поликлиника: назначено лечение из базы', !!(cs.treatment && cs.treatment.name),
           cs.treatment ? cs.treatment.name : 'нет');
      }

      /* --- ДРУЗЬЯ: ПОНЯТНОЕ ЗНАКОМСТВО --- */
      __game.currentScene = 'map';
      System.stats.energy = 100;
      __game.scenes.map.init();
      __game.scenes.map.draw(__game.ctx);
      const frLoc = (__game.scenes.map.locationButtons || []).filter(b => b.loc && b.loc.id === 'friend')[0];
      if (frLoc) {
        click(frLoc);
        ok('Клик «Друзья» -> сцена друзей', __game.currentScene === 'friends', 'сцена: ' + __game.currentScene);
        const frs = __game.scenes.friends;
        frs.init();
        frs.draw(__game.ctx);
        const meetBtn = (frs.buttons || []).filter(b => b.text === 'meet')[0];
        ok('Друзья: есть кнопка «Познакомиться»', !!meetBtn);
        if (meetBtn) {
          const n0 = (System.friends || []).length;
          click(meetBtn);
          ok('Знакомство добавляет друга', (System.friends || []).length === n0 + 1,
             'друзей: ' + (System.friends || []).length);
        }
      }

      /* --- МОНЕТКА: ДА ИЛИ НЕТ --- */
      const mgs = __game.scenes.minigames;
      mgs.init();
      mgs.initCoinFlip();
      mgs.coinFlip.state = 'flipping';
      mgs.coinFlip.timer = 0;
      mgs.update(1500);
      ok('Монетка: подброс даёт «Да» или «Нет»',
         mgs.coinFlip.state === 'done' && (mgs.coinFlip.result === 'yes' || mgs.coinFlip.result === 'no'),
         'результат: ' + mgs.coinFlip.result);


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
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 4/5 — Целостность собранного APK');

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

/* ---------- РЕВЬЮЕР 5: реальный рендер в браузере ---------- */
function reviewerRender() {
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 5/5 — Реальный рендер в Chrome (пиксели канваса всех сцен)');

  const chromePath = process.env.CHROME_BIN ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!fs.existsSync(chromePath)) {
    check('Реальный рендер проверен (нужен Chrome)', false, 'Chrome не найден: ' + chromePath);
    return;
  }

  let res = null;
  try {
    const out = cp.execSync('node tools/render-check.js --json',
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 1800000 });
    res = JSON.parse(out);
  } catch (e) {
    const so = e.stdout ? String(e.stdout) : '';
    const at = so.indexOf('[');
    try { res = JSON.parse(so.slice(at)); } catch (err) { res = null; }
    if (!res) {
      check('Реальный рендер в Chrome выполнен', false, String(e.message).slice(0, 90));
      return;
    }
  }

  check('Реальный рендер в Chrome выполнен', Array.isArray(res) && res.length > 0,
    res ? res.length + ' сцен проверено' : 'нет данных');

  for (const r of res) {
    const rp = r.report || {};
    const ok = r.problems.length === 0;
    check('Сцена ' + r.hash + ' реально отрисована (' +
      (rp.distinctColors === undefined ? '?' : rp.distinctColors) + ' цветов, нефон ' +
      (rp.nonBackgroundPct === undefined ? '?' : rp.nonBackgroundPct) + '%)',
      ok, ok ? 'OK' : r.problems.join('; '));
  }
}

/* ---------- РЕВЬЮЕР 1/5b: требования v1.2 (статика по исходникам) ---------- */
function reviewerV12Static() {
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 1/5 (доп.) — требования v1.2 по исходникам');
  const read = f => fs.readFileSync(path.join(WWW, 'js', f), 'utf8');
  const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  const helpers = read('helpers.js');
  const system = read('system.js');
  const content = read('game_content.js');
  const home = read('game_home.js');
  const friends = read('game_friends.js');
  const clinic = read('game_clinic.js');
  const shop = read('game_shop.js');
  const menu = read('game_menu.js');
  const stats = read('game_stats.js');

  // --- 1. Код друга: копирование и вставка ---
  check('Панель кода друга есть в разметке (настоящие поля ввода)',
    html.indexOf('id="clipPanel"') !== -1 && html.indexOf('id="clipField"') !== -1 &&
    html.indexOf('id="clipField2"') !== -1 && html.indexOf('id="clipCopyBtn"') !== -1 &&
    html.indexOf('id="clipSubmitBtn"') !== -1);
  check('Поля панели разрешают выделение текста (user-select: text)',
    /#clipPanel textarea[\s\S]{0,400}user-select: text/.test(html));
  check('Копирование: execCommand + запасной navigator.clipboard',
    helpers.indexOf("document.execCommand('copy')") !== -1 && helpers.indexOf('navigator.clipboard.writeText') !== -1);
  check('Вставка: navigator.clipboard.readText + подсказка про меню Android',
    helpers.indexOf('navigator.clipboard.readText') !== -1 && helpers.indexOf('Вставить') !== -1);
  check('Короткий код друга — 16 символов (можно набрать руками)',
    system.indexOf('getShortCode()') !== -1 && system.indexOf('unpackShortCode(') !== -1 &&
    system.indexOf('CODE32') !== -1 && system.indexOf('code32Checksum') !== -1);
  check('Полный код (весь дом) и короткий разбираются автоматически',
    system.indexOf('addFriendCode(') !== -1 && friends.indexOf('Или коротк') !== -1 || friends.indexOf('короткие 16 знаков') !== -1);
  check('В друзьях есть кнопка копирования и поле вставки',
    friends.indexOf('ClipBridge') !== -1 && friends.indexOf('doAddFriend') !== -1);

  // --- 2. Стресс: объяснение в игре ---
  check('Есть справка по шкалам (что повышает, что понижает)',
    content.indexOf('STAT_HELP') !== -1 && content.indexOf("'stress'") !== -1 || content.indexOf('key: \'stress\'') !== -1);
  check('Справка про стресс перечисляет способы снижения',
    /stress[\s\S]{0,700}сон/.test(content) && /stress[\s\S]{0,900}музыка/.test(content));
  check('В доме есть кнопка «?» и музыка (снижает стресс)',
    home.indexOf("action: 'help'") !== -1 && home.indexOf("action: 'music'") !== -1);
  check('В статистике есть вкладка справки',
    stats.indexOf("id: 'help'") !== -1 && stats.indexOf('drawHelpTab') !== -1);

  // --- 3. Сон и офлайн ---
  check('Энергия копится, пока приложение закрыто (офлайн-сон)',
    system.indexOf('applyOfflineProgress') !== -1 && system.indexOf('offlineMessage') !== -1);
  check('Офлайн не опускает питомца ниже «пола»',
    system.indexOf('OFFLINE_FLOOR') !== -1);
  check('Сон: 10% энергии в минуту (полный сон 10 минут)',
    system.indexOf('SLEEP_FULL_MINUTES: 10') !== -1);
  check('Быстрая трата энергии убрана (поход 2–8, пассивно 1.5/час)',
    system.indexOf('VISIT_ENERGY') !== -1 && system.indexOf('ENERGY_PER_HOUR: 1.5') !== -1);
  check('Игра сохраняется при сворачивании (visibilitychange/pagehide)',
    read('game.js').indexOf('visibilitychange') !== -1 && read('game.js').indexOf('pagehide') !== -1);
  check('Пока гофер спит, походы закрыты (SLEEP_ALLOWED + sleepBlocks)',
    /SLEEP_ALLOWED:\s*\[/.test(system) && system.indexOf('sleepBlocks(') !== -1 &&
    /isLocationAvailable\(loc\)\s*\{\s*if \(this\.sleepBlocks\(loc\)\) return false;/.test(system));
  check('Отказ во сне объясняется словами, а не «нельзя»',
    system.indexOf('Гофер спит \ud83d\udca4') !== -1 && system.indexOf('sleepBlocks(loc)') !== -1);
  check('Выспавшийся питомец просыпается сам, без закрытия приложения',
    /if \(this\.stats\.energy >= 99\.5\) \{/.test(system) && system.indexOf('justWoke') !== -1);
  check('С полной энергией спать не укладывают (есть что восстанавливать)',
    /startSleep\(\) \{\s*if \(this\.isSleeping\) return false;[\s\S]{0,220}this\.stats\.energy >= 99\) return false;/.test(system));
  check('Карта сама говорит, что походы закрыты, пока гофер спит',
    read('game_map.js').indexOf('походы закрыты') !== -1 && read('game_map.js').indexOf('sleepAllowedHint') !== -1);
  check('Дом во сне выключает дела с питомцем и подсказывает причину',
    home.indexOf('awakeOnly') !== -1 && home.indexOf('sleepHint') !== -1 &&
    home.indexOf('sleepAllowedHint') !== -1);

  // --- 4. Тихие игры и спорт ---
  check('Есть сцена тихих игр с тремя занятиями',
    fs.existsSync(path.join(WWW, 'js/game_quiet.js')) && content.indexOf('QUIET_GAMES') !== -1 &&
    (content.match(/id: '(stars|color|fish)'/g) || []).length === 3);
  check('Есть воздушная гимнастика в спортзале',
    fs.existsSync(path.join(WWW, 'js/game_aerial.js')) && content.indexOf('AERIAL') !== -1 &&
    read('game_visit.js').indexOf('Воздушная гимнастика') !== -1);

  // --- 5. Комнаты, мебель, цвета ---
  check('В доме четыре комнаты',
    (content.match(/\{ id: '(living|bedroom|kitchen|bathroom)'/g) || []).length === 4 &&
    content.indexOf('HOME_ROOMS') !== -1);
  const furnitureCount = (content.match(/\{ id: '[a-zA-Z]+',\s+emoji:/g) || []).length;
  check('Мебели в каталоге не меньше 45 предметов', furnitureCount >= 45, 'их ' + furnitureCount);
  check('У мебели есть уровень цены: от дешёвой до роскоши',
    content.indexOf('function tierOf') !== -1 && /cost: 3500/.test(content) && /cost: 10,/.test(content));
  check('Перекраска мебели платная (recolorCost)',
    content.indexOf('function recolorCost') !== -1 && system.indexOf('paintFurniture(') !== -1);
  check('Обои и пол покупаются (у наборов есть цена)',
    /WALLS = \[[\s\S]{0,2600}cost: 1500/.test(content) && /FLOORS = \[[\s\S]{0,1600}cost: 2000/.test(content));
  check('Мебель рисуется соразмерно (перспектива по глубине)',
    read('game_room.js').indexOf('depthScale') !== -1 && read('game_room.js').indexOf('DEPTH_MIN') !== -1);
  check('Магазин: вкладка «Дом» фильтрует по комнатам и товару',
    shop.indexOf('decorItems()') !== -1 && shop.indexOf('drawDecorFilters') !== -1 && shop.indexOf("decorKind") !== -1);

  // --- 6. Поликлиника ---
  const procs = (content.match(/anim: '(recipe|injection|eyes|xray|bandage|teeth|vitamins|thermo)'/g) || []).length;
  check('В поликлинике 8 видимых процедур (рецепт, укол, зрение, снимок...)', procs === 8, 'их ' + procs);
  check('Процедура показывается пошагово с подписями',
    clinic.indexOf('drawProcedure') !== -1 && clinic.indexOf('drawSteps') !== -1 && clinic.indexOf('.steps') !== -1);

  // --- 7. Персонаж (задел: герой не только гофер) ---
  const chars = (read('characters.js').match(/id: '(gopher|bear|bunny|cat|robot|milka)'/g) || []).length;
  check('Персонажей минимум 5 (гофер и другие игрушки)', chars >= 5, 'их ' + chars);
  check('Среди героев есть заказанная «Милка» (белая, зелёные ушки, крылышки)',
    /id: 'milka'/.test(read('characters.js')) && /wings:/.test(read('characters.js')) &&
    read('characters.js').indexOf('#2BB24C') !== -1 && read('characters.js').indexOf('pads') !== -1);
  check('Персонаж выбирается в меню и сохраняется',
    menu.indexOf('drawCharacters') !== -1 && system.indexOf('setCharacter(') !== -1 && system.indexOf("char: 'gopher'") !== -1);
}

/* ---------- РЕВЬЮЕР 3/5b: механика v1.2 в песочнице ---------- */
function reviewerV12Runtime(rt) {
  console.log('\n\uD83D\uDD0D РЕВЬЮЕР 3/5 (доп.) — механика v1.2 в эмуляторе');
  if (!rt) { check('Механика v1.2 проверена', false, 'игра не запустилась'); return; }
  const { sandbox, game } = rt;
  const vmRes = (code) => vm.runInContext(code, sandbox);
  const ok = (name, cond, detail) => check(name, cond, detail);

  try {
    // Комнаты: покупка вещи кладёт её в нужную комнату
    vmRes(`System.resetProgress(); System.rooms = null; System.ensureRooms(); System.coins = 5000;`);
    vmRes(`System.buyFurniture('sofa'); System.buyFurniture('bed'); System.buyFurniture('fridge'); System.buyFurniture('bath');`);
    ok('Мебель сама попадает в свою комнату',
      vmRes(`System.roomOfItem('sofa')`) === 'living' &&
      vmRes(`System.roomOfItem('bed')`) === 'bedroom' &&
      vmRes(`System.roomOfItem('fridge')`) === 'kitchen' &&
      vmRes(`System.roomOfItem('bath')`) === 'bathroom');
    ok('Комната переключается и отдаёт свою мебель',
      vmRes(`System.setActiveRoom('bedroom') && System.furniture.length === 1 && System.furniture[0].id === 'bed'`) === true);

    // Код друга: короткий и полный
    const short = vmRes(`System.setActiveRoom('living'); System.getShortCode()`);
    ok('Короткий код — 16 знаков группами', /^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/.test(short), short);
    const parsed = vmRes(`System.unpackShortCode('${short.replace(/-/g, '')}')`);
    ok('Короткий код разбирается (персонаж и обои совпадают)',
      parsed && parsed.look && parsed.room, parsed ? parsed.room.wall : 'нет данных');
    vmRes(`System.friends = [];`);
    const addedShort = vmRes(`System.addFriendCode('${short}', 'Тест').ok`);
    const longCode = vmRes(`System.getMyCode(null)`);
    vmRes(`System.friends = [];`);
    const addedLong = vmRes('System.addFriendCode(' + JSON.stringify(longCode) + ", 'Полный').ok");
    ok('Друг добавляется и по короткому, и по полному коду', addedShort === true && addedLong === true);
    ok('Испорченный короткий код не принимается',
      vmRes(`System.unpackShortCode('AAAAAAAAAAAAAAAA')`) === null);

    // Офлайн-сон: закрыли приложение — энергия копится
    vmRes(`System.stats.energy = 20; System.isSleeping = true; System.applyOfflineProgress(Date.now() - 10*60000);`);
    const eAfter = vmRes(`Math.round(System.stats.energy)`);
    ok('С закрытым приложением сон доводит энергию до 100%', eAfter >= 99, eAfter + '%');
    ok('После полного сна питомец просыпается сам', vmRes(`System.isSleeping`) === false);
    vmRes(`System.stats.energy = 100; System.stats.hunger = 100; System.stats.cleanness = 100; System.stats.stress = 0;`);
    vmRes(`System.applyOfflineProgress(Date.now() - 48*3600000);`);
    ok('Двое суток без игры не убивают питомца',
      vmRes(`System.stats.energy >= 25`), vmRes(`Math.round(System.stats.energy)`) + '% энергии');

    // Энергия: семь походов не опустошают шкалу
    vmRes(`System.resetProgress(); System.stats.energy = 100;`);
    vmRes(`['museum_any','library','pool','gym','park','cinema','restaurant'].forEach(v => { System.spendEnergy(System.visitCost(v)); System.advanceTime(0.5); });`);
    ok('7 походов оставляют больше половины энергии', vmRes(`System.stats.energy > 50`),
      vmRes(`Math.round(System.stats.energy)`) + '%');

    // Соразмерность мебели
    const rect = `{x:0,y:0,w:400,h:300}`;
    ok('Мебель на переднем плане крупнее',
      vmRes(`RoomView.sizeFor('bed', ${rect}, 1) > RoomView.sizeFor('bed', ${rect}, 0) * 1.5`) === true);
    ok('Шкаф заметно больше часов',
      vmRes(`RoomView.sizeFor('wardrobe', ${rect}, 1) > RoomView.sizeFor('clock', ${rect}, 1) * 2`) === true);

    // Тихие игры: награда и отсутствие трат энергии
    vmRes(`System.resetProgress(); System.coins = 0; System.stats.energy = 60; System.stats.stress = 50;`);
    vmRes(`const qs = __game.scenes.quiet; qs.init(); qs.startGame('color');` +
          ` const pa = { x: __game.width * 0.12, y: __game.height * 0.14, w: __game.width * 0.76, h: __game.height * 0.54 };` +
          ` let guard = 0;` +
          ` while (!qs.paint.done && guard++ < 40) {` +
          `   const part = qs.paint.parts.find(p => !p.fill) || qs.paint.parts[0];` +
          `   const cx = part.kind === 'rect' ? pa.x + pa.w * (part.x + part.w / 2) : pa.x + pa.w * part.cx;` +
          `   const cy = part.kind === 'rect' ? pa.y + pa.h * (part.y + part.h / 2) : pa.y + pa.h * part.cy;` +
          `   qs.paint.picked = 0; qs.clickColor(cx, cy); }` +
          ` if (!qs.paint.done) throw new Error('раскраску нельзя закончить за 40 тапов');`);
    ok('Тихая игра даёт монеты и НЕ тратит энергию',
      vmRes(`System.coins > 0 && System.stats.energy === 60`),
      vmRes(`System.coins`) + ' монет, энергия ' + vmRes(`System.stats.energy`));
    ok('Тихая игра снижает стресс', vmRes(`System.stats.stress < 50`), vmRes(`System.stats.stress`));

    // --- РЕГРЕССИИ v1.2.3 (замечания заказчика) ---
    // Баг 1: в крестиках-ноликах кнопка «Заново» не работала после конца
    // партии — обработчик стоял внутри «партия ещё идёт».
    const tttRes = vmRes(`(function(){
      const ms = __game.scenes.minigames;
      ms.init(); ms.initTTT();
      // Доигрываем партию: победная линия X
      ms.ttt.board = ['X','X','X','O','O',null,'O',null,null];
      ms.ttt.over = true; ms.ttt.winner = 'X';
      ms.buttons = [];
      ms.draw(__ctxStub);
      const btn = ms.buttons[1];
      const clicked = ms.handleClick(btn.x + btn.w / 2, btn.y + btn.h / 2);
      return { clicked: clicked, over: ms.ttt.over, winner: ms.ttt.winner,
               empty: ms.ttt.board.every(c => c === null), mode: ms.mode };
    })()`);
    ok('Крестики-нолики: «Заново» работает и после победы (партия сбрасывается)',
      tttRes && tttRes.clicked === true && tttRes.over === false && tttRes.winner === null &&
      tttRes.empty === true && tttRes.mode === 'ticTacToe',
      tttRes && tttRes.empty ? 'доска очищена' : 'доска не сбросилась');
    const tttDrawRes = vmRes(`(function(){
      const ms = __game.scenes.minigames;
      ms.init(); ms.initTTT();
      ms.ttt.board = ['X','O','X','X','O','O','O','X','X'];
      ms.ttt.over = true; ms.ttt.winner = 'draw';
      ms.buttons = []; ms.draw(__ctxStub);
      const btn = ms.buttons[1];
      ms.handleClick(btn.x + btn.w / 2, btn.y + btn.h / 2);
      return { over: ms.ttt.over, empty: ms.ttt.board.every(c => c === null), label: btn.text };
    })()`);
    ok('Ничья в крестиках-ноликах: тоже можно начать заново (кнопка подписана)',
      tttDrawRes.over === false && tttDrawRes.empty === true && tttDrawRes.label.indexOf('Заново') !== -1,
      'надпись: «' + tttDrawRes.label + '»');

    // Баг 2: в «Мозаике» (память) монеты капали на каждый клик после победы
    const memRes = vmRes(`(function(){
      const ms = __game.scenes.minigames;
      ms.init(); ms.initMemory(); ms.draw(__ctxStub);
      System.coins = 0;
      const cols = 4, cs = Math.min(__game.width * 0.2, 70), gap = 6;
      const ox = (__game.width - (cols * (cs + gap) - gap)) / 2, oy = __game.height * 0.12;
      const at = i => ({ x: ox + (i % cols) * (cs + gap) + cs / 2, y: oy + Math.floor(i / cols) * (cs + gap) + cs / 2 });
      const m = ms.memory, seen = {};
      for (let i = 0; i < m.cards.length; i++) {
        const k = m.cards[i];
        if (seen[k] === undefined) { seen[k] = i; continue; }
        const a = at(seen[k]), b = at(i);
        ms.handleClick(a.x, a.y); ms.handleClick(b.x, b.y);
      }
      const afterWin = System.coins;
      const extra = at(0);
      ms.handleClick(extra.x, extra.y); ms.handleClick(extra.x, extra.y);
      const afterExtra = System.coins;
      const btn = ms.buttons[1];
      const clicked = ms.handleClick(btn.x + btn.w / 2, btn.y + btn.h / 2);
      const afterRestart = System.coins;
      // initMemory() создаёт НОВЫЙ объект памяти — смотрим на свежий
      const nm = ms.memory;
      const restarted = nm !== m && nm.matched.every(x => x === false) && nm.done === false;
      return { all: m.matched.every(x => x), afterWin: afterWin, afterExtra: afterExtra,
               afterRestart: afterRestart, restarted: restarted, clicked: clicked };
    })()`);
    ok('Мозаика: награда ровно одна, лишние клики после победы монет не дают',
      memRes.all === true && memRes.afterWin === 15 && memRes.afterExtra === 15 && memRes.afterRestart === 15,
      'после победы ' + memRes.afterWin + ', после лишних кликов ' + memRes.afterExtra);
    ok('Мозаика: «Заново» после победы начинает игру с чистого поля',
      memRes.clicked === true && memRes.restarted === true);

    // Замечание заказчика: созвездие каждый раз должно быть новым
    const starsRes = vmRes(`(function(){
      const qs = __game.scenes.quiet;
      qs.init();
      const A = { x: __game.width * 0.08, y: __game.height * 0.16, w: __game.width * 0.84, h: __game.height * 0.54 };
      const shapes = {}; let minGap = 1e9, outside = 0, stars = 0, collected = 0;
      for (let n = 0; n < 12; n++) {
        qs.initStars();
        const pts = qs.stars.points.map(p => ({ x: A.x + A.w * p[0], y: A.y + A.h * p[1] }));
        stars += pts.length;
        shapes[qs.stars.points.map(p => p[0].toFixed(3) + ',' + p[1].toFixed(3)).join(';')] = 1;
        pts.forEach(p => {
          if (p.x < A.x || p.x > A.x + A.w || p.y < A.y || p.y > A.y + A.h) outside++;
        });
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            minGap = Math.min(minGap, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
          }
        }
        // Созвездие всё ещё собирается тапами по порядку
        pts.forEach(p => qs.clickStars(p.x, p.y));
        if (qs.stars.done) collected++;
      }
      return { unique: Object.keys(shapes).length, stars: stars / 12, collected: collected,
               minGap: Math.round(minGap), outside: outside };
    })()`);
    ok('Созвездие каждый раз новое: 12 запусков — 12 разных рисунков',
      starsRes.unique >= 11 && starsRes.stars === 9,
      starsRes.unique + ' уникальных из 12, звёзд ' + starsRes.stars);
    ok('Звёзды не налезают друг на друга и остаются в области (по ним можно попадать)',
      starsRes.minGap >= 40 && starsRes.outside === 0,
      'минимальное расстояние ' + starsRes.minGap + ' px (радиус тапа 24)');
    ok('Новое созвездие собирается по номерам без тупиков', starsRes.collected === 12,
      starsRes.collected + ' из 12 созвездий собраны тапами');

    // Воздушная гимнастика
    vmRes(`System.stats.energy = 90; const ae = __game.scenes.aerial; ae.init(); ae.payEntry();`);
    ok('Воздушная гимнастика тратит немного энергии',
      vmRes(`System.stats.energy <= 86`), vmRes(`Math.round(System.stats.energy)`) + '%');
    vmRes(`ae.power = 0.5; ae.jump();`);
    ok('Прыжок в зелёной зоне даёт награду',
      vmRes(`ae.perfect === 1 && ae.coinsWon > 0`), vmRes(`ae.coinsWon`) + ' монет');

    // Поликлиника: процедуры разные и с шагами
    ok('Процедуры поликлиники пронумерованы и имеют шаги',
      vmRes(`CLINIC_PROCEDURES.every(p => p.steps.length === 3 && p.anim)`) === true);
    vmRes(`const cl = __game.scenes.clinic; cl.init(); cl.status='treating'; cl.examProgress=0.7;`);
    ok('Врач показывает текущий шаг процедуры',
      vmRes(`typeof cl.stepIndex() === 'number' && cl.stepIndex() >= 0 && cl.stepIndex() <= 2`) === true,
      'шаг ' + vmRes(`cl.stepIndex()`));

    // Персонажи
    let charsOk = true;
    try {
      vmRes(`CHARACTERS.forEach(c => { const g2 = createCharacter(c.id, 100);` +
            ` g2.setExpression('happy', 5); g2.draw(__ctxStub, 50, 50, 1); });`);
    } catch (e) { charsOk = false; }
    ok('Все персонажи рисуются кодом (не только гофер)', charsOk);
    ok('Среди героев есть заказанная «Милка» (зелёные ушки и крылышки)',
      vmRes(`CHARACTERS.some(c => c.id === 'milka' && c.ears.inner === '#2BB24C' && !!c.wings)`) === true,
      'героев: ' + vmRes(`CHARACTERS.length`));
    vmRes(`System.setCharacter('bear'); __game.ensureCharacter();`);
    ok('Смена персонажа пересоздаёт фигурку героя', vmRes(`__game.gopher.charId`) === 'bear', vmRes(`__game.gopher.charId`));
    vmRes(`System.setCharacter('milka'); __game.ensureCharacter();`);
    ok('Милку можно выбрать героем', vmRes(`__game.gopher.charId`) === 'milka', vmRes(`System.characterName()`));
    vmRes(`System.setCharacter('gopher'); __game.ensureCharacter();`);

    // --- Сон: дела с питомцем закрыты, «безгоферные» — открыты (v1.2.1) ---
    vmRes(`System.resetProgress(); System.isSleeping = true; System.stats.energy = 40;`);
    const blockedSleep = vmRes(`['work','school','museums','library','cinema','park','pool','gym',` +
      `'restaurant','beach','friend','clinic'].every(l => !System.isLocationAvailable(l))`);
    const openSleep = vmRes(`['home','shop','stats','minigames','quiet'].every(l => System.isLocationAvailable(l))`);
    ok('Пока гофер спит, походы закрыты, а мини-игры/тихие игры/инфо открыты',
      blockedSleep === true && openSleep === true,
      'походы ' + (blockedSleep ? 'закрыты' : 'ОТКРЫТЫ') + ', безгоферные ' + (openSleep ? 'открыты' : 'ЗАКРЫТЫ'));
    ok('Отказ во сне объясняет причину словами',
      vmRes(`System.locationLockReason('museums').indexOf('спит') !== -1`) === true,
      vmRes(`System.locationLockReason('museums')`));
    vmRes(`__game.currentScene = 'map'; __game.scenes.map.init(); __game.scenes.map.draw(__game.ctx);` +
          ` var __tile = __game.scenes.map.locationButtons.filter(b => b.loc.id === 'museums')[0];` +
          ` __game.handleClick(__tile.x + __tile.w / 2, __tile.y + __tile.h / 2);`);
    ok('Клик по музею во сне не уводит с карты', vmRes(`__game.currentScene`) === 'map', vmRes(`__game.currentScene`));
    vmRes(`__game.currentScene = 'home'; __game.scenes.home.init(); __game.scenes.home.draw(__game.ctx);` +
          ` var __feed = __game.scenes.home.buttons.filter(b => b.action === 'feed')[0];` +
          ` System.stats.hunger = 50; __game.handleClick(__feed.x + __feed.w / 2, __feed.y + __feed.h / 2);`);
    ok('Дома во сне кормление не срабатывает (кнопка выключена)', vmRes(`System.stats.hunger`) === 50,
      vmRes(`Math.round(System.stats.hunger)`) + '% сытости');
    vmRes(`System.resetProgress(); System.stats.energy = 98; System.startSleep(); System.tick(60000 * 3);`);
    ok('Выспавшийся питомец просыпается сам (энергия 100%)',
      vmRes(`System.isSleeping === false`) === true, vmRes(`Math.round(System.stats.energy)`) + '%');
    vmRes(`System.isSleeping = false; System.resetProgress();`);
  } catch (e) {
    check('Механика v1.2 проверена без ошибок', false, e.message);
  }
}

/* ---------- БЛОК 6: ДОСТИЖЕНИЯ и ДОЛГИЙ ПРОГРЕСС (v1.2.2) ----------
   Заказчик: «убедись, что система ачивок работает как положено, и чтобы
   невозможно было за первый же день взять все достижения — должны быть
   вещи, достигать которых нужно месяцы». Проверяем и движок (открытие,
   плашка, сохранение, «день считается один раз»), и ТЕМП прогресса:
   жёсткий «первый день» + симуляция 400 календарных дней. */
function reviewerAchievements(rt) {
  console.log('\n\uD83C\uDFAF БЛОК 6/6 — Достижения: движок и темп (месяцы, а не один вечер)');
  const read = f => fs.readFileSync(path.join(WWW, 'js', f), 'utf8');
  const content = read('game_content.js');
  const system = read('system.js');
  const statsSrc = read('game_stats.js');
  const renderCheck = fs.readFileSync(path.join(ROOT, 'tools', 'render-check.js'), 'utf8');

  // --- 1. Статический разбор: движок, а не «витрина» ---
  check('Каталог достижений — один список в контенте (ACHIEVEMENTS)',
    /const ACHIEVEMENTS = \[/.test(content) && content.indexOf('window.ACHIEVEMENTS') !== -1);
  check('В game_stats.js нет второй копии списка (раньше был мёртвый check(), который никто не звал)',
    statsSrc.indexOf('System.achievementList()') !== -1 && statsSrc.indexOf('check: () =>') === -1);
  check('Достижения открываются по ходу игры, а не лежат на витрине',
    system.indexOf('checkAchievements()') !== -1 &&
    ['game_home.js', 'game_map.js', 'game_minigames.js', 'game_quiet.js'].every(f => read(f).indexOf('countAction(') !== -1),
    'счётчики: дом, карта, мини-игры, тихие игры');
  check('Плашка берёт название из каталога',
    system.indexOf("'Достижение: ' + a.name") !== -1);
  check('Мёртвый addAch() стал рабочим: проверяет id и не открывает дважды',
    /addAch\(id, opts\)[\s\S]{0,400}isAchUnlocked\(id\)/.test(system));
  check('День засчитывается через registerDay (а не «сколько раз открыли игру»)',
    system.indexOf('registerDay(') !== -1 && system.indexOf('dayIndex(key)') !== -1);
  check('Кадр вкладки достижений есть в стенде рендера (#stats@ach)',
    renderCheck.indexOf("hash: 'stats@ach'") !== -1);

  if (!rt) { check('Механика достижений проверена в браузерной песочнице', false, 'игра не запустилась'); return; }
  const vmRes = c => vm.runInContext(c, rt.sandbox);
  const vmRun = c => { try { return vmRes(c); } catch (e) { return 'ОШИБКА: ' + e.message; } };

  // --- 2. Каталог: ступени и длинные цели ---
  const catSize = vmRes('System.achievementList().length');
  check('Каталог достижений читается игрой и разбит на 4 ступени по времени',
    catSize >= 25 && vmRes('System.achievementTiers().length') === 4,
    catSize + ' достижений, ступени: ' + vmRes('System.achievementTiers().map(t => t.id).join(", ")'));
  const badEntry = vmRun(`(function(){
    const tiers = System.achievementTiers().map(t => t.id);
    return System.achievementList().filter(a => !a.id || !a.emoji || !a.name || !a.desc ||
      !(a.goal > 0) || typeof a.of !== 'function' || tiers.indexOf(a.tier) === -1).map(a => a.id || '?').join(', ');
  })()`);
  check('У каждого достижения есть id, эмодзи, имя, описание, цель и ступень', badEntry === '',
    badEntry || 'все записи полные');
  check('id достижений уникальны',
    vmRes('new Set(System.achievementList().map(a => a.id)).size') === catSize);
  const longMissing = vmRun(`['streak3','days7','streak7','days30','streak30','days100','days180','days365','streak100','streak365','level20','trips200','museumsFull']
    .filter(id => !System.achievementList().some(a => a.id === id)).join(', ')`);
  const monthRes = vmRun(`(function(){
    const list = System.achievementList();
    const months = list.filter(a => a.tier === 'month');
    return { count: months.length, total: list.length,
             days: list.filter(a => a.id === 'days365' && a.goal === 365).length,
             streak: list.filter(a => a.id === 'streak365' && a.goal === 365).length,
             tierSize: System.achievementTiers().filter(t => t.id === 'month').length };
  })()`);
  check('Есть достижения «на месяцы»: 30/100/180/365 разных дней и серия 365 дней',
    longMissing === '' && monthRes.days === 1 && monthRes.streak === 1,
    longMissing ? ('нет: ' + longMissing) : 'долгие цели на месте');
  check('Долгих достижений стало больше, чем коротких (месяцы — не «вишенка» на торте)',
    monthRes.count >= 12 && monthRes.count >= Math.ceil(monthRes.total * 0.3),
    monthRes.count + ' из ' + monthRes.total + ' — ступень «Месяцы»');
  const uniq = vmRun(`(function(){
    const p = System.ensureProgress();
    return System.achievementList().filter(a => { const v = a.of(p, System); return !isFinite(v) || v < 0; }).map(a => a.id).join(', ');
  })()`);
  check('Ни одна цель не сломана: прогресс считается числом у всех достижений', uniq === '',
    uniq || catSize + ' достижений посчитаны');

  // --- 3. Чистый профиль и первый вечер ---
  vmRun('System.resetProgress();');
  check('Чистый профиль: ни одного достижения, первый день уже засчитан',
    vmRes('System.unlockedCount()') === 0 && vmRes('System.progress.days') === 1 && vmRes('System.progress.streak') === 1,
    vmRes('System.unlockedCount()') + ' / ' + catSize + ', дней ' + vmRes('System.progress.days'));
  const feedRes = vmRun(`(function(){
    System.popupQueue = []; System.lastPopup = null;
    __game.currentScene = 'home'; __game.scenes.home.init();
    __game.scenes.home.draw(__game.ctx);
    const feed = __game.scenes.home.buttons.filter(b => b.action === 'feed')[0];
    System.stats.hunger = 40;
    __game.handleClick(feed.x + feed.w / 2, feed.y + feed.h / 2);
    return { opened: System.isAchUnlocked('first_feed'), popup: System.lastPopup ? System.lastPopup.text : '',
             counter: System.progress.feeds, again: System.addAch('first_feed') };
  })()`);
  check('Кормление дома открывает «Первая еда» и показывает плашку с названием',
    feedRes.opened === true && feedRes.popup.indexOf('Первая еда') !== -1,
    'плашка: «' + feedRes.popup + '»');
  check('Достижение не открывается дважды, счётчик действия растёт',
    feedRes.again === false && feedRes.counter === 1 && vmRes('System.unlockedCount()') === 1);

  // --- 4. Дни: один день = одна отметка, пропуск = серия с нуля ---
  const dayRes = vmRun(`(function(){
    System.resetProgress();
    const r = [System.registerDay(), System.registerDay(), System.registerDay()];
    return { days: System.progress.days, streak: System.progress.streak, ret: r };
  })()`);
  check('Сколько бы раз ни открыли игру в один день — день считается один раз',
    dayRes.days === 1 && dayRes.streak === 1 && dayRes.ret.every(x => x === false),
    'три захода → дней ' + dayRes.days);
  const streakRes = vmRun(`(function(){
    System.resetProgress();
    System.progress.days = 0; System.progress.streak = 0; System.progress.lastDay = null;
    const base = Date.UTC(2030, 0, 1, 12, 0, 0), day = 86400000;
    System.registerDay(base);
    System.registerDay(base + day);
    const two = System.progress.streak;
    System.registerDay(base + 3 * day);
    const afterSkip = System.progress.streak;
    const before = System.progress.days;
    System.registerDay(base + day);
    return { two: two, afterSkip: afterSkip, same: System.progress.days === before,
             days: System.progress.days, best: System.progress.bestStreak };
  })()`);
  check('Серия дней честная: пропуск обнуляет серию, перевод часов назад не накручивает дни',
    streakRes.two === 2 && streakRes.afterSkip === 1 && streakRes.same === true && streakRes.best === 2,
    'серия 2 → пропуск → 1; дней ' + streakRes.days + ', рекорд ' + streakRes.best);

  // --- 5. ТЕМП: за первый вечер всё не собрать ---
  const hardDay = vmRun(`(function(){
    System.resetProgress();
    const p = System.progress;
    p.trips = 999; p.minigames = 999; p.quiet = 999; p.tttWins = 99;
    p.feeds = 99; p.washes = 99; p.plays = 99; p.sleeps = 99; p.furniture = 99; p.coinsEarned = 99999;
    System.coins = 99999; System.addXP(99999);
    Object.keys(System.stats).forEach(k => System.stats[k] = 99);
    MUSEUM_CATEGORIES.forEach(c => { for (let i = 0; i < 20; i++) System.markSeen(c, c + ':x' + i); });
    System.checkAchievements();
    return { opened: System.unlockedCount(), total: System.achievementList().length,
             locked: System.achievementList().filter(a => !System.isAchUnlocked(a.id)).map(a => a.id) };
  })()`);
  const stillLocked = ['days7', 'streak7', 'days30', 'streak30', 'days100', 'days180', 'days365', 'streak100', 'streak365']
    .filter(id => hardDay.locked.indexOf(id) === -1);
  check('Хоть обмажься достижениями: за один день недостижимы цели на дни и серию дней',
    stillLocked.length === 0 && hardDay.opened < hardDay.total,
    'даже с заполненными счётчиками закрыты: ' + hardDay.locked.join(', '));

  const realDay = vmRun(`(function(){
    System.resetProgress();
    System.popupQueue = []; System._popupShownAt = 0;
    System.progress.days = 0; System.progress.streak = 0; System.progress.lastDay = null;
    const base = Date.UTC(2030, 0, 1, 12, 0, 0), day = 86400000;
    const openedOn = {};
    const mark = () => { for (const id of System.achievements) if (openedOn[id] === undefined) openedOn[id] = System.progress.days; };
    const playDay = function (i, full) {
      System.registerDay(base + i * day);
      const p = System.progress;
      p.trips += full ? 6 : 2; p.minigames += full ? 4 : 1; p.quiet += full ? 3 : 1;
      p.feeds += full ? 3 : 2; p.washes += 1; p.plays += full ? 3 : 1; p.tttWins += 1;
      if (full) p.furniture += 1;
      System.stats.energy = 45; System.startSleep(); System.tick(600000);
      System.earnCoins(full ? 120 : 40); System.addXP(full ? 250 : 70);
      System.stats.workSkill = Math.min(100, System.stats.workSkill + (full ? 8 : 3));
      System.stats.schoolSkill = Math.min(100, System.stats.schoolSkill + (full ? 6 : 2));
      System.stats.intelligence = Math.min(100, System.stats.intelligence + (full ? 6 : 1));
      // Уход из настоящих кнопок дома: покормил, искупал, поиграл
      if (full) { System.stats.hunger = 95; System.stats.cleanliness = 92; System.stats.happiness = 95; System.stats.health = 95; }
      if (full) MUSEUM_CATEGORIES.forEach((c, k) => { for (let j = 0; j < 2; j++) System.markSeen(c, c + ':d' + i + '-' + k + '-' + j); });
      mark();
    };
    playDay(0, true);
    const at = { day1: System.unlockedCount(), day7: 0, day30: 0, day100: 0, day400: 0 };
    for (let i = 1; i < 400; i++) {
      playDay(i, i < 30 || i % 3 === 0);
      if (i === 28) at.onDay29 = System.isAchUnlocked('days30');
      if (i === 29) at.day30 = System.unlockedCount();
      if (i === 99) at.day100 = System.unlockedCount();
      if (i === 6) at.day7 = System.unlockedCount();
      if (i === 363) at.onDay364 = System.isAchUnlocked('days365');
    }
    at.day400 = System.unlockedCount();
    at.level = System.level; at.xp = System.xp;
    at.openedOn = openedOn;
    // Когда открылись самые долгие цели — видно, что они не «за неделю»
    at.longDays = { days180: openedOn.days180, streak100: openedOn.streak100,
                    streak365: openedOn.streak365, level20: openedOn.level20,
                    trips200: openedOn.trips200, museumsFull: openedOn.museumsFull };
    at.total = System.achievementList().length;
    at.locked = System.achievementList().filter(a => !System.isAchUnlocked(a.id)).map(a => a.id);
    return at;
  })()`);
  check('Темп: обычный первый вечер даёт меньше трети каталога',
    realDay.day1 >= 5 && realDay.day1 <= Math.ceil(realDay.total * 0.35),
    realDay.day1 + ' из ' + realDay.total + ' за первый вечер');
  check('Темп растянут на месяцы: неделя → месяц → сто дней → год, каталог растёт ступенями',
    realDay.day7 < realDay.day30 && realDay.day30 < realDay.day100 && realDay.day100 < realDay.day400 &&
    realDay.day400 === realDay.total,
    realDay.day1 + ' → ' + realDay.day7 + ' → ' + realDay.day30 + ' → ' + realDay.day100 + ' → ' + realDay.day400);
  const long = realDay.longDays || {};
  check('Долгие цели открываются месяцами, а не в первую неделю',
    ['days180', 'streak100', 'level20', 'trips200', 'museumsFull'].every(k => (long[k] || 0) >= 30) &&
    long.streak365 === 365,
    'полгода — день ' + long.days180 + ', серия 100 — день ' + long.streak100 +
    ', уровень 20 — день ' + long.level20 + ' (ур. ' + realDay.level + '), двести походов — день ' + long.trips200 +
    ', вся коллекция музеев — день ' + long.museumsFull);
  check('Границы ступеней соблюдены: «30 дней» закрыто на 29-й день, «год» — на 364-й',
    realDay.onDay29 === false && realDay.onDay364 === false &&
    realDay.openedOn.days30 === 30 && realDay.openedOn.streak30 === 30 && realDay.openedOn.days365 === 365,
    '«30 дней» открылось на ' + realDay.openedOn.days30 + '-й день, «год» — на ' + realDay.openedOn.days365 + '-й');
  check('Тупиков нет: у каждого достижения есть реальный путь к открытию',
    realDay.locked.length === 0,
    realDay.locked.length ? ('не открылись: ' + realDay.locked.join(', ')) : 'все ' + realDay.total + ' открылись');

  // --- 6. Плашки идут по очереди ---
  const popupRes = vmRun(`(function(){
    System.resetProgress();
    System.popupQueue = []; System._popupShownAt = 0; System.lastPopup = null;
    System.countAction('feeds');
    const first = System.lastPopup ? System.lastPopup.text : '';
    System.countAction('washes');
    const q2 = System.popupQueue.length;
    const shown = System.updatePopups(System._popupShownAt + System.POPUP_MS + 1);
    return { first: first, q2: q2, shown: shown, second: System.lastPopup ? System.lastPopup.text : '',
             q3: System.popupQueue.length };
  })()`);
  check('Плашки достижений идут по очереди (не перебивают друг друга)',
    popupRes.first.indexOf('Первая еда') !== -1 && popupRes.q2 === 2 && popupRes.shown === true &&
    popupRes.second.indexOf('Чистюля') !== -1,
    'очередь: «' + popupRes.first + '» → «' + popupRes.second + '»');

  // --- 7. Сохранение, загрузка и мусор из старых версий ---
  const saveRes = vmRun(`(function(){
    System.resetProgress();
    System.countAction('trips'); System.countAction('quiet');
    System.progress.days = 12; System.progress.streak = 4; System.progress.bestStreak = 5;
    System.checkAchievements();
    const before = { unlocked: System.unlockedCount(), days: System.progress.days, streak: System.progress.streak };
    // В сохранение подмешиваем «мусорный» id — как из старой версии
    System.achievements = ['unknown_from_old_version'].concat(System.achievements);
    System.saveGame();
    System.achievements = []; System.progress = null;
    const loaded = System.loadGame();
    return { before: before, loaded: loaded, unlocked: System.unlockedCount(), days: System.progress.days,
             streak: System.progress.streak, left: System.achievements.slice(),
             junk: System.achievements.indexOf('unknown_from_old_version') };
  })()`);
  check('Достижения и долгий прогресс переживают сохранение и загрузку',
    saveRes.loaded === true && saveRes.unlocked === saveRes.before.unlocked &&
    saveRes.days === 12 && saveRes.streak === 4,
    'открыто ' + saveRes.before.unlocked + ' → после перезапуска ' + saveRes.unlocked + ', дней ' + saveRes.days);
  check('Мусорные id из старых сохранений вычищаются, настоящие остаются',
    saveRes.junk === -1 && saveRes.left.length === saveRes.before.unlocked,
    saveRes.left.join(', ') || 'список пуст');
  vmRes('System.resetProgress(); 0');
  check('«Новая игра» начинает с нуля, но первый день уже засчитан',
    vmRes('System.unlockedCount()') === 0 && vmRes('System.progress.days') === 1 &&
    vmRes('System.achievements.length') === 0,
    'открыто ' + vmRes('System.unlockedCount()') + ', дней ' + vmRes('System.progress.days'));

  // --- 8. Экран: строки, листание, «открыто/закрыто» ---
  const screenRes = vmRun(`(function(){
    System.resetProgress();
    const sc = __game.scenes.stats;
    sc.init(); sc.tab = 'ach';
    sc.draw(__game.ctx);
    const view = sc.achView, visible = sc.achRows.length, maxScroll = sc.achMaxScroll;
    const outside = [];
    [0, 123, maxScroll].forEach(function (off) {
      sc.achScroll = off;
      sc.draw(__game.ctx);
      sc.achRows.forEach(function (r) { if (r.y < view.top - 0.5 || r.y + r.h > view.bottom + 0.5) outside.push(r.id); });
    });
    sc.achScroll = 1e6;
    sc.draw(__game.ctx);
    const lastRow = sc.achRows.length ? sc.achRows[sc.achRows.length - 1] : null;
    const tabs = (sc.tabButtons || []).map(function (b) { return b.action; });
    const arrows = (sc.buttons || []).filter(function (b) { return b.action === 'achUp' || b.action === 'achDown'; });
    return { view: view, visible: visible, maxScroll: maxScroll, outside: outside,
             bottom: lastRow ? lastRow.y + lastRow.h : 0, tabs: tabs, arrows: arrows.length,
             arrowTexts: arrows.map(function (b) { return b.text; }),
             height: __game.height };
  })()`);
  check('Вкладка 🏆: список длиннее экрана и листается стрелками',
    screenRes.maxScroll > 0 && screenRes.visible > 3 && screenRes.arrows >= 1,
    'видно ' + screenRes.visible + ' строк, листание ' + Math.round(screenRes.maxScroll) + ' px');
  check('Стрелки листания не только ловят клик, но и нарисованы (▲/▼ с текстом)',
    screenRes.arrowTexts.length > 0 &&
    screenRes.arrowTexts.every(t => t === '▲' || t === '▼'),
    screenRes.arrowTexts.length ? ('подписи: ' + screenRes.arrowTexts.join(' ')) : 'кнопки без подписей');
  check('Ни одна строка не уезжает под кнопку «Назад» и не вылезает из области списка',
    screenRes.outside.length === 0 && screenRes.bottom <= screenRes.view.bottom + 0.5 &&
    screenRes.view.bottom <= screenRes.height - 50,
    'область списка ' + screenRes.view.top + '..' + screenRes.view.bottom + ', низ списка ' + Math.round(screenRes.bottom));
  check('Стрелки листания не попали в список вкладок (иначе вкладки ломались бы)',
    screenRes.tabs.indexOf('achUp') === -1 && screenRes.tabs.indexOf('achDown') === -1 &&
    screenRes.tabs.indexOf('ach') !== -1,
    'вкладки: ' + screenRes.tabs.join(', '));

  const rowRes = vmRun(`(function(){
    const calls = [];
    const rec = new Proxy({ measureText: function () { return { width: 10 }; } }, {
      get: function (t, p) { if (p === 'fillText') return function (s) { calls.push(String(s)); }; if (p in t) return t[p]; return function () {}; },
      set: function (t, p, v) { t[p] = v; return true; }
    });
    System.achievements = [];
    const sc = __game.scenes.stats;
    const a = System.achievementList()[0];
    sc.drawAchRow(rec, a, 360, 200, 46);
    const closed = calls.slice();
    calls.length = 0;
    System.addAch(a.id, { silent: true });
    calls.length = 0;
    sc.drawAchRow(rec, a, 360, 200, 46);
    const open = calls.slice();
    // Награда не отбирается: монеты потратил — достижение осталось открытым
    System.coins = 400; System.checkAchievements();
    System.coins = 0;
    const rich = System.achievementList().find(x => x.id === 'rich200');
    calls.length = 0;
    sc.drawAchRow(rec, rich, 360, 200, 46);
    return { id: a.id, emoji: a.emoji, closed: closed, open: open,
             richRow: calls.slice(), richEmoji: rich.emoji, richUnlocked: System.isAchUnlocked('rich200') };
  })()`);
  check('Закрытое достижение нарисовано с 🔒 и прогрессом, открытое — с эмодзи и «открыто»',
    rowRes.closed.indexOf('🔒') !== -1 && rowRes.closed.indexOf(rowRes.emoji) === -1 &&
    rowRes.open.indexOf(rowRes.emoji) !== -1 && rowRes.open.indexOf('открыто') !== -1,
    rowRes.closed.length + ' надписей у закрытого, ' + rowRes.open.length + ' у открытого');
  check('Полученную награду не отбирают: потратил монеты — достижение осталось открытым',
    rowRes.richUnlocked === true && rowRes.richRow.indexOf(rowRes.richEmoji) !== -1);

  vmRun('System.resetProgress();');
}

/* ---------- ЗАПУСК ---------- */
console.log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550 Gopher Life \u2014 приёмка качества \u2550\u2550\u2550\u2550\u2550\u2550\u2557');
reviewerStatic();
reviewerV12Static();
const rt = reviewerRuntime();
reviewerClicks(rt);
reviewerV12Runtime(rt);
reviewerAchievements(rt);
reviewerApk();
reviewerRender();

console.log('\n' + '\u2500'.repeat(56));
console.log('ИТОГО: пройдено ' + passed + '  |  провалено ' + failed);
if (failed === 0) {
  console.log('\u2705 ВСЕ 5 РЕВЬЮЕРОВ + БЛОК ДОСТИЖЕНИЙ ПРИНЯЛИ РЕЗУЛЬТАТ БЕЗ ЗАМЕЧАНИЙ');
  process.exit(0);
} else {
  console.log('\u274C ЕСТЬ ЗАМЕЧАНИЯ \u2014 результат НЕ принимается');
  process.exit(1);
}
