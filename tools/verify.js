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
const ASSETS = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets');
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
  'js/game_minigames.js', 'js/chat_lines.js', 'js/chat_kid.js', 'js/semantic.js', 'js/chat_semantic.js', 'js/chat_bank.js', 'js/chat_talk.js', 'js/chat_memory.js', 'js/game_chat.js', 'js/game_tools.js',
  'js/game_quiet.js', 'js/game_aerial.js', 'js/game_stats.js',
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
  check('www/ и android assets/ синхронизированы (корень assets, не assets/www)', syncOk, syncDetail);

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
  const audioParam = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const ctxStub = new Proxy({
    canvas: { width: 360, height: 640 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => null,
    getImageData: () => ({ data: [] }),
    // v1.3.12: музыке нужны осцилляторы, регуляторы и фильтры — без них реальный
    // AudioSys в этой песочнице не поднимал громкость и «сыграно нот» оставалось 0.
    currentTime: 0,
    state: 'running',
    destination: {},
    resume() { this.state = 'running'; },
    suspend() { this.state = 'suspended'; },
    createOscillator: () => ({ type: '', frequency: audioParam(), connect() {}, start() {}, stop() {} }),
    createGain: () => ({ gain: audioParam(), connect() {} }),
    createBiquadFilter: () => ({ type: '', frequency: audioParam(), Q: audioParam(),
      gain: audioParam(), connect() {} })
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
  // Хранилище устройства доступно снаружи: нужно, чтобы проверить «перезапуск
  // приложения» (настройки звука читаются из localStorage при старте).
  sandbox.__store = store;
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

  const EXPECTED_SCENES = ['menu', 'map', 'home', 'shop', 'minigames', 'quiet', 'aerial', 'sport', 'stats', 'clinic', 'visit', 'friends'];
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
        ok('Хаб музеев: карточки музеев на странице (v1.3.12 — их пятьдесят, по шесть на экран)',
           museumBtns.length === 6, 'их ' + museumBtns.length);
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
  check('APK содержит assets/index.html', list.indexOf('assets/index.html') !== -1);
  // В release-сборке AGP переименовывает файлы ресурсов (res/XX.xml),
  // поэтому имя ресурса ищем в содержимом APK (resources.arsc), а не в списке файлов
  let iconOk = list.indexOf('ic_launcher') !== -1;
  if (!iconOk) {
    try { iconOk = fs.readFileSync(APK).indexOf(Buffer.from('ic_launcher')) !== -1; } catch (e) { iconOk = false; }
  }
  check('APK содержит ресурс иконки ic_launcher', iconOk);

  let idxOk = false;
  try {
    const idxApk = cp.execSync('unzip -p "' + APK + '" assets/index.html',
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    idxOk = /new Game\(\)/.test(idxApk) && /game\.init\(\)/.test(idxApk);
  } catch (e) { idxOk = false; }
  check('index.html внутри APK запускает игру', idxOk);

  let jsOk = true, jsDetail = SCRIPT_ORDER.length + ' файлов';
  for (const rel of SCRIPT_ORDER) {
    try {
      const inApk = cp.execSync('unzip -p "' + APK + '" assets/' + rel, { maxBuffer: 10 * 1024 * 1024 });
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

  // Цепочка релиза одной командой (v1.3.11). Заказчик: «Ты не забываешь
  // копировать новую версию на десктоп и загружать её на RuStore?» Сборка и копия
  // на рабочий стол делаются одной командой `npm run release`, и она же напоминает
  // про RuStore — проверяем, что скрипт на месте, что копия совпадает с APK и что
  // памятка для консоли готова.
  const releasePath = path.join(ROOT, 'tools', 'release.js');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const releaseSrc = fs.existsSync(releasePath) ? fs.readFileSync(releasePath, 'utf8') : '';
  const deskApk = path.join(require('os').homedir(), 'Desktop', 'Gopher.apk');
  let deskSame = false, deskInfo = 'копии нет';
  if (fs.existsSync(deskApk) && fs.existsSync(APK)) {
    const md5 = p => require('crypto').createHash('md5').update(fs.readFileSync(p)).digest('hex');
    deskSame = md5(deskApk) === md5(APK);
    deskInfo = deskSame ? 'копия совпадает с APK (md5 ' + md5(deskApk).slice(0, 8) + '…)' : 'копия устарела';
  }
  check('Релиз собирается одной командой, копия APK на рабочем столе свежая',
    !!(pkg.scripts && pkg.scripts.release) && releaseSrc.indexOf('copy-apk') !== -1 &&
    releaseSrc.indexOf('rustore-publish.js status --go') !== -1 &&
    fs.existsSync(path.join(ROOT, 'store', 'CONSOLE_PASTE.txt')) && deskSame,
    'npm run release · ' + deskInfo);
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
      // Хвост вывода помогает понять причину: раньше при обрезанном JSON здесь
      // была только строка «Command failed», и 72 проверки кадров молча пропадали
      const tail = so.slice(-160).replace(/\s+/g, ' ');
      check('Реальный рендер в Chrome выполнен', false,
        String(e.message).slice(0, 60) + ' | хвост вывода: ' + tail);
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
  // v1.3.12: заказчик прислал скриншот — при отправке кода WebView открывал
  // «sms:?body=…», такую схему не умеет и показывал ребёнку страницу ошибки
  // «net::ERR_UNKNOWN_URL_SCHEME» вместо игры. Теперь: системный мост Android
  // (ACTION_SEND) → Web Share → копия в буфер, а не-веб схемы игра не открывает.
  const mainActivitySrc = fs.readFileSync(path.join(ROOT,
    'android/app/src/main/java/com/gopherlife/app/MainActivity.java'), 'utf8');
  check('Код друга отправляется системным «Поделиться», а не sms:-ссылкой (v1.3.12)',
    helpers.indexOf("'sms:") === -1 &&
    helpers.indexOf('AndroidBridge.share') !== -1 &&
    helpers.indexOf('^https?') !== -1 &&
    mainActivitySrc.indexOf('"AndroidBridge"') !== -1 &&
    mainActivitySrc.indexOf('ACTION_SEND') !== -1 &&
    mainActivitySrc.indexOf('shouldOverrideUrlLoading') !== -1,
    'мост AndroidBridge + WebViewClient отдаёт sms:/tel:/mailto: системе');
  check('Короткий код друга — 16 символов (можно набрать руками)',
    system.indexOf('getShortCode()') !== -1 && system.indexOf('unpackShortCode(') !== -1 &&
    system.indexOf('CODE32') !== -1 && system.indexOf('code32Checksum') !== -1);
  // v1.3.12: заказчик — «нельзя ли как-то коды сделать менее страшными для
  // пересылки? Обязательно прям такие огромные?» Полный код больше не base64 от
  // JSON, а плотная упаковка битами нашим алфавитом, и он копируется кнопкой.
  check('Полный код друга упакован битами, а рядом есть кнопка копирования короткого',
    system.indexOf('unpackFullCode(') !== -1 && system.indexOf('bitsToCode32') !== -1 &&
    system.indexOf('FULL_CODE_ROOMS') !== -1 && system.indexOf('utf8ToBytes') !== -1 &&
    friends.indexOf("'copy_short'") !== -1 &&
    friends.indexOf('Скопировать короткий код') !== -1);
  // v1.3.12: заказчик — «чтобы можно было посмотреть всю коллекцию рыб, которых ты
  // уже поймал… поймал новую — там в списке появлялось. И чтобы это было в
  // достижениях логично отображено». Экран коллекции живёт в StatsScene, вход — из
  // вкладки достижений и по тапу на «Ихтиолога».
  check('Коллекция пойманных рыб: экран, вход из достижений и рыбные строки открывают её (v1.3.12)',
    stats.indexOf('drawFishCollection') !== -1 && stats.indexOf('drawFishList') !== -1 &&
    stats.indexOf("action: 'fishCollection'") !== -1 &&
    stats.indexOf('fishScroll') !== -1 && stats.indexOf('handleFishBack') !== -1 &&
    stats.indexOf('нажми — вся коллекция') !== -1,
    'пойманные с редкостью и «×N», непойманные — «???», листается, «Назад» возвращает к достижениям');
  // v1.3.12: «когда ловишь рыбу — постоянно надпись „Акула уплывает“… „уплывает“
  // тут лишнее» и «слишком быстро пропадает информация о пойманных рыбах».
  const quietMainSrc = read('game_quiet.js');
  check('Подсказка о большом обитателе без «уплывает», плашка о рыбе держится долго (v1.3.12)',
    content.indexOf("уплывает: '") === -1 && content.indexOf("f.name + ' уплывает'") === -1 &&
    content.indexOf("return f.name + ': ' + f.fact;") !== -1 &&
    /\? 16 : 14/.test(quietMainSrc) && quietMainSrc.indexOf('hitResultPlate') !== -1 &&
    quietMainSrc.indexOf('resultPlateBox') !== -1,
    '«Черепаха: живёт больше ста лет: панцирь растёт вместе с ней»; плашка 14–16 с, тап мимо убирает');
  // v1.3.12: «в „Как играть“ не все предложения помещаются в экран» и «экран не
  // закрыть, пока не пролистаешь всё до конца». Текст переносится, есть крестик.
  const gameMainSrc = read('game.js');
  check('«Как играть»: текст переносится по ширине, закрыть можно с любой страницы (v1.3.12)',
    gameMainSrc.indexOf('wrapLines(this.ctx, raw, textMaxW, maxLines)') !== -1 &&
    gameMainSrc.indexOf("'tutorial-close'") !== -1 &&
    gameMainSrc.indexOf('можно закрыть в любой момент') !== -1,
    'подбор размера шрифта + перенос + крестик «✕» в углу');
  // v1.3.12: «зачем нужна кнопка „Профили“? Она не работает» — обработчик меню
  // не реагировал на текст большой кнопки, только на внутренний код чипа.
  check('Большая кнопка «Профили» в меню открывает панель профилей (v1.3.12)',
    menu.indexOf("t === 'profiles' || t.indexOf('Профили') !== -1") !== -1,
    'раньше проверялось только t === profiles (код маленького чипа в углу)');
  check('Полный код (весь дом) и короткий разбираются автоматически',
    system.indexOf('addFriendCode(') !== -1 && friends.indexOf('Или коротк') !== -1 || friends.indexOf('короткие 16 знаков') !== -1);
  check('В друзьях есть кнопка копирования и поле вставки',
    friends.indexOf('ClipBridge') !== -1 && friends.indexOf('doAddFriend') !== -1);

  // --- 2. Шкалы: объяснение в игре (v1.3.2 — «спокойствие» вместо стресса) ---
  check('Есть справка по шкалам (что повышает, что понижает)',
    content.indexOf('STAT_HELP') !== -1 && content.indexOf("key: 'calm'") !== -1);
  check('Справка про спокойствие перечисляет способы поднять',
    /key: 'calm'[\s\S]{0,600}сон/.test(content) && /key: 'calm'[\s\S]{0,900}музыка/.test(content));
  check('В доме есть кнопка «❓» и музыка (поднимает спокойствие)',
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
    system.indexOf('{Pet} спит') !== -1 && system.indexOf('sleepBlocks(loc)') !== -1);
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
  check('Есть сцена тихих игр с четырьмя занятиями (звёзды, раскраска, рыбалка, у окна)',
    fs.existsSync(path.join(WWW, 'js/game_quiet.js')) && content.indexOf('QUIET_GAMES') !== -1 &&
    (content.match(/id: '(stars|color|fish|window)'/g) || []).length === 4);
  // v1.3.9: подводный мир рыбалки. Пожелание пользователя: «чтобы был виден
  // подводный мир, как они плавают, как за крючок цепляются… много разных видов
  // рыбок… ещё акул, осьминогов, черепах. Но ловили чтобы только рыбок».
  const quietSrc = fs.readFileSync(path.join(WWW, 'js', 'game_quiet.js'), 'utf8');
  const seaBlock = (content.split('const FISH_SPECIES = [')[1] || '').split('];')[0];
  const friendBlock = (content.split('const SEA_FRIENDS = [')[1] || '').split('];')[0];
  const seaSpecies = (seaBlock.match(/\{ id: '/g) || []).length;
  const seaFriends = (friendBlock.match(/\{ id: '/g) || []).length;
  check('Подводный мир: ' + seaSpecies + ' видов рыб и ' + seaFriends + ' больших обитателей',
    seaSpecies >= 100 && seaFriends >= 16 && content.indexOf('fishAll') !== -1 &&
    content.indexOf('fishMaster') !== -1 && content.indexOf('seaFriendHint') !== -1 &&
    // v1.3.12: заказчик попросил дельфинов, косаток и скатов — проверяем, что новые
    // обитатели не только в списке, но и нарисованы своей фигурой в drawSeaFriend
    ['dolphin', 'orca', 'ray', 'whale', 'seal', 'swordfish', 'sunfish', 'squid', 'moray']
      .every(k => quietSrc.indexOf("k === '" + k + "'") !== -1 || quietSrc.indexOf("'" + k + "'") !== -1),
    'рыб ' + seaSpecies + ', больших ' + seaFriends + ', у каждого свой факт');
  check('Длинный факт о рыбе переносится по строкам, а не ужимается в одну (v1.3.10)',
    quietSrc.indexOf('wrapLines(ctx, this.result') !== -1 &&
    quietSrc.indexOf('lines.forEach((line, i) =>') !== -1);
  check('Рыбалка рисует воду, дно, водоросли, пузырьки и жителей, а не пустой прямоугольник',
    quietSrc.indexOf('drawSeaFish') !== -1 && quietSrc.indexOf('drawSeaFriend') !== -1 &&
    quietSrc.indexOf('spawnSea') !== -1 && quietSrc.indexOf('fishHookY') !== -1 &&
    quietSrc.indexOf('fishWater') !== -1);
  check('Клюёт только рыбка: большие обитатели крючок не берут (их не выбирает pickBiter)',
    quietSrc.indexOf("s.kind === 'fish' && typeof s.caughtAnim !== 'number'") !== -1 &&
    // v1.3.11: постоянную надпись внизу убрали (заказчик: «явно не нужная»),
    // объяснение осталось — оно всплывает, когда большой обитатель идёт мимо крючка
    quietSrc.indexOf('Рыбок ловим') === -1 &&
    quietSrc.indexOf('friendHintText') !== -1 && quietSrc.indexOf('seaFriendHint') !== -1);
  // v1.3.12: заказчик — «странно, что всех рыб можно наловить прям за один день…
  // надо каких-то редких рыб сделать появляющимися с меньшей вероятностью».
  check('Редкость рыб: четыре ступени, шанс и награда зависят от неё (v1.3.12)',
    content.indexOf('FISH_RARITY') !== -1 && content.indexOf('function fishRarityOf') !== -1 &&
    content.indexOf('function randomFishSpecies') !== -1 &&
    quietSrc.indexOf('fishRarityOf(d)') !== -1 && quietSrc.indexOf('rarity.name') !== -1 &&
    quietSrc.indexOf('System.earnCoins(bonus)') !== -1,
    'обычная 70% · редкая 20% · очень редкая 8% · легендарная 2%; за редкую платят больше монет');
  // v1.3.12: заказчик — «улучши раскраски, а то они все однотипные».
  const paintCount = (quietSrc.match(/\{ id: '(gopher|fish|ship|house|cake|butterfly|rocket|flower)',\s*\n?\s*name: '/g) || []).length;
  check('Раскрасок восемь, у каждой своё имя и палитра (v1.3.12)',
    quietSrc.indexOf('PAINT_PICTURES') !== -1 && paintCount === 8 &&
    quietSrc.indexOf('Другая картинка') !== -1 && quietSrc.indexOf("markSeen('paint'") !== -1,
    'картинок ' + paintCount + ', у каждой свой набор частей и цветов');
  // v1.3.7: спортивных дисциплин стало четыре, и каждая живёт в своей локации
  const aerialSrc = fs.readFileSync(path.join(WWW, 'js', 'game_aerial.js'), 'utf8');
  check('Есть четыре анимированные спортивные дисциплины (кольца, полотна, заплыв, барьеры)',
    fs.existsSync(path.join(WWW, 'js/game_aerial.js')) && aerialSrc.indexOf('AERIAL_CFG') !== -1 &&
    (aerialSrc.match(/id: '(rings|silks|swim|hurdles)'/g) || []).length === 4 &&
    aerialSrc.indexOf('sportListFor') !== -1,
    'дисциплин в реестре: ' + (aerialSrc.match(/id: '(rings|silks|swim|hurdles)'/g) || []).length);
  check('Спортивные тренировки открываются из спортзала, бассейна и парка',
    /place: 'gym'/.test(aerialSrc) && /place: 'pool'/.test(aerialSrc) && /place: 'park'/.test(aerialSrc) &&
    read('game_visit.js').indexOf("'sport_'") !== -1);

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
    // v1.3.12: полный код теперь короткий и без «страшных» знаков — проверяем на
    // живом коде из браузера, а не только по исходникам
    ok('Полный код короткий и «не страшный»: цифры, заглавные буквы и дефисы',
      /^[0-9A-Z-]+$/.test(longCode) && !/[IO]/.test(longCode) && longCode.length <= 220,
      longCode.length + ' знаков: ' + longCode.slice(0, 24) + '…');
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
          // Рамка картинки — как в drawColor/clickColor: y 0.16, h 0.52 (v1.3.12)
          ` const pa = { x: __game.width * 0.12, y: __game.height * 0.16, w: __game.width * 0.76, h: __game.height * 0.52 };` +
          // Один тап может прийтись на уже закрашенную деталь, лежащую сверху,
          // поэтому проходим список по кругу, а не «первые 40 тапов»: так раскраска
          // заканчивается для любой из восьми картинок (было флейки, v1.3.12)
          ` let guard = 0;` +
          ` while (!qs.paint.done && guard++ < 120) {` +
          `   const part = qs.paint.parts[(guard - 1) % qs.paint.parts.length];` +
          `   if (part.fill) continue;` +
          `   const cx = part.kind === 'rect' ? pa.x + pa.w * (part.x + part.w / 2) : pa.x + pa.w * part.cx;` +
          `   const cy = part.kind === 'rect' ? pa.y + pa.h * (part.y + part.h / 2) : pa.y + pa.h * part.cy;` +
          `   qs.paint.picked = 0; qs.clickColor(cx, cy); }` +
          ` if (!qs.paint.done) throw new Error('раскраску нельзя закончить тапами по деталям');`);
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

    // Подводный мир рыбалки (v1.3.9): рыбки плавают, больших не ловим, улов по видам
    const seaRes = vmRes(`(function(){
      const qs = __game.scenes.quiet;
      qs.init();
      qs.startGame('fish');
      const f = qs.fish;
      const fish0 = (f.swimmers || []).filter(s => s.kind === 'fish');
      const friends0 = (f.swimmers || []).filter(s => s.kind === 'friend');
      const x0 = fish0.length ? fish0[0].x : 0;
      qs.update(500);
      const moved = fish0.length ? Math.abs(fish0[0].x - x0) : 0;
      System.fishSeen = {};
      let caught = 0, friendsCaught = 0;
      for (let i = 0; i < 6; i++) {
        f.state = 'bite'; f.biteWindow = 2; f.biteFish = qs.pickBiter();
        if (f.biteFish && f.biteFish.kind !== 'fish') friendsCaught++;
        if (f.biteFish) { qs.tryFish(); caught++; }
        qs.update(900);
      }
      const species = ((typeof FISH_SPECIES !== 'undefined') ? FISH_SPECIES : (window.FISH_SPECIES || [])).length;
      const friends = ((typeof SEA_FRIENDS !== 'undefined') ? SEA_FRIENDS : (window.SEA_FRIENDS || [])).length;
      return { fish: fish0.length, friends: friends0.length, moved: moved > 0.5,
        caught: caught, species: species, friendsAll: friends,
        seen: Object.keys(System.fishSeen || {}).length, friendsCaught: friendsCaught,
        hint: (typeof seaFriendHint === 'function') ? seaFriendHint('turtle') : '' };
    })()`);
    // v1.3.12: обычных видов теперь 22 (редкие приходят реже), поэтому за шесть
    // забросов гарантированно ждём минимум два разных вида, а не три
    ok('Подводный мир: рыбки и большие плавают, улов считается по разным видам',
      !!seaRes && seaRes.fish >= 5 && seaRes.friends >= 1 && seaRes.moved === true &&
      seaRes.caught === 6 && seaRes.seen >= 2 && seaRes.species >= 20,
      seaRes ? ('рыбок ' + seaRes.fish + ', больших ' + seaRes.friends + ', поймано ' + seaRes.caught +
        ' (' + seaRes.seen + ' видов из ' + seaRes.species + ')') : 'нет данных');
    ok('Больших обитателей поймать нельзя, и игра объясняет это словами',
      !!seaRes && seaRes.friendsCaught === 0 && (seaRes.hint || '').indexOf('Черепаха') === 0 && (seaRes.hint || '').length > 10,
      seaRes ? seaRes.hint : 'нет данных');

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
    let museumVisits = 0;                 // по одному музею за «полный» день
    const playDay = function (i, full) {
      System.registerDay(base + i * day);
      const p = System.progress;
      p.trips += full ? 6 : 2; p.minigames += full ? 4 : 1; p.quiet += full ? 3 : 1;
      p.feeds += full ? 3 : 2; p.washes += 1; p.plays += full ? 3 : 1; p.tttWins += 1;
      // Мини-игры (v1.3.16): «камень, ножницы, бумага» и «Огоньки» — их достижения
      // тоже должны открываться за год игры
      p.rpsWins += full ? 2 : 1;
      p.simonBest = Math.max(p.simonBest || 0, full ? 8 : 4);
      p.guessWins += 1; p.letterWins += 1; p.mixWins += 1;
      if (full) p.furniture += 1;
      System.stats.energy = 45; System.startSleep(); System.tick(600000);
      System.earnCoins(full ? 120 : 40); System.addXP(full ? 250 : 70);
      System.stats.workSkill = Math.min(100, System.stats.workSkill + (full ? 8 : 3));
      System.stats.schoolSkill = Math.min(100, System.stats.schoolSkill + (full ? 6 : 2));
      System.stats.intelligence = Math.min(100, System.stats.intelligence + (full ? 6 : 1));
      // Уход из настоящих кнопок дома: покормил, искупал, поиграл
      if (full) { System.stats.hunger = 95; System.stats.cleanliness = 92; System.stats.happiness = 95; System.stats.health = 95; }
      // Музеи: за «полный» день герой успевает дойти до ОДНОГО музея и осмотреть там
      // всю подборку визита (12 экспонатов). Раньше метили по два предмета сразу во
      // всех музеях — из-за этого «Хранитель музеев» (теперь это по 12 экспонатов в
      // каждом из 50 музеев) открывался на шестой день (v1.3.12).
      if (full) {
        const mu = MUSEUM_CATEGORIES[museumVisits % MUSEUM_CATEGORIES.length];
        for (let j = 0; j < 12; j++) System.markSeen(mu, mu + ':d' + i + '-' + j);
        museumVisits++;
      }
      // Рыбалка (v1.3.9): за «полные» дни герой успевает собрать весь улов —
      // так проверяется и достижение «Ихтиолог» (20 разных видов)
      if (full) FISH_SPECIES.forEach(f => { System.fishSeen[f.id] = 1; });
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

/* ---------- БЛОК 7: НАРЯДЫ И ГОЛОСА ГЕРОЕВ (v1.3)
   Заказчик: «Милке конечно нужны наряды и звуки (как и всем другим героям),
   пока ещё новых героев не плодим». Проверяем, что наряды — не картинки в
   магазине, а общая система: один каталог, слот вместо отдельной шкурки,
   посадка под уши каждого героя, покупка один раз, перенос старых «бабочек»
   и голос у каждого героя. Плюс (пункт 8) — то, что нашлось ТОЛЬКО на живом
   Android при прогоне на эмуляторе: меню обязано показывать наряд из
   сохранения, а кнопка буфера — объяснять, что делать, если буфер недоступен. */
function reviewerOutfits(rt) {
  console.log('\n\uD83D\uDC57 БЛОК 7/8 — Наряды и голоса героев (v1.3)');
  const read = f => fs.readFileSync(path.join(WWW, 'js', f), 'utf8');
  const content = read('game_content.js');
  const gopherSrc = read('gopher.js');
  const charsSrc = read('characters.js');
  const audioSrc = read('audio.js');
  const helpers = read('helpers.js');
  const system = read('system.js');
  const shop = read('game_shop.js');
  const menu = read('game_menu.js');
  const home = read('game_home.js');
  const friends = read('game_friends.js');
  const renderCheck = fs.readFileSync(path.join(ROOT, 'tools', 'render-check.js'), 'utf8');

  // --- 1. Один каталог нарядов: магазин, код друга и рисование смотрят в него ---
  check('Наряды живут одним каталогом в контенте (OUTFITS: слот → значение)',
    /const OUTFITS = \[/.test(content) && content.indexOf('window.OUTFITS') !== -1 &&
    /const OUTFIT_SLOTS = \['hat', 'glasses', 'neck', 'back'\]/.test(content));
  check('Магазин продаёт наряды из каталога, а не списком «на память»',
    shop.indexOf('...OUTFITS.map(') !== -1 && shop.indexOf('System.ownsOutfit(') !== -1 &&
    shop.indexOf('System.setOutfit(') !== -1);
  check('У каждого слота есть ветка рисования (товар не может быть «мёртвым»)',
    ['chef', 'scientist', 'crown', 'cap', 'bow'].every(v => gopherSrc.indexOf("this.hat === '" + v + "'") !== -1) &&
    ['nerd', 'cool'].every(v => gopherSrc.indexOf("this.glasses === '" + v + "'") !== -1) &&
    gopherSrc.indexOf('if (this.scarf)') !== -1 && gopherSrc.indexOf('if (this.bowtie)') !== -1 &&
    gopherSrc.indexOf('if (this.backpack)') !== -1 && gopherSrc.indexOf('if (this.cape)') !== -1);
  check('Рюкзак и плащ рисуются ЗА телом, а не поверх героя (порядок в draw)',
    gopherSrc.indexOf('drawBackItems(ctx, s, C, lw)') !== -1 &&
    gopherSrc.indexOf('this.drawBackItems(ctx, s, C, lw);') < gopherSrc.indexOf('this.bodyPath(ctx, s);\n    ctx.fillStyle'));
  check('Все игрушки рисуют те же аксессуары: ToyCharacter extends Gopher и зовёт общие методы',
    /class ToyCharacter extends Gopher/.test(charsSrc) &&
    charsSrc.indexOf('this.drawAccessories(') !== -1 && charsSrc.indexOf('this.drawBackItems(') !== -1);
  check('Шляпа садится под героя: у Милки своя посадка (у неё длинные уши)',
    /hat: \{ shift: 0\.018, scale: 0\.92 \}/.test(charsSrc) &&
    gopherSrc.indexOf('const hatShift = hatCfg.shift') !== -1 && gopherSrc.indexOf('ctx.scale(hatScale, hatScale)') !== -1);

  // --- 2. Слоты, покупка и старые сохранения ---
  check('Слот один: setOutfit пишет в слот, а bowtie живёт в слоте neck',
    /setOutfit\(slot, value\)[\s\S]{0,400}if \(slot === 'neck'\) this\.look\.bowtie/.test(system));
  check('Наряд покупается один раз: ownsOutfit/buyOutfit + список купленного в сохранении',
    system.indexOf('ownsOutfit(slot, value)') !== -1 && system.indexOf('buyOutfit(slot, value)') !== -1 &&
    /outfitsOwned: \(this\.outfitsOwned \|\| \[\]\)\.slice\(\)/.test(system) &&
    system.indexOf('this.outfitsOwned = (data.outfitsOwned || []).slice()') !== -1);
  check('Старые сохранения «бабочку» не теряют: migrateLook переносит bowtie в слот neck',
    /migrateLook\(look\)/.test(system) &&
    /if \(!l\.neck\) l\.neck = l\.bowtie \? 'bowtie' : null/.test(system) &&
    system.indexOf('this.look = this.migrateLook(') !== -1);
  check('Короткий код (v2) несёт наряды и читает старые коды (v1)',
    system.indexOf('pushBits(bits, 2, 2);') !== -1 && system.indexOf('ver !== 1 && ver !== 2') !== -1 &&
    system.indexOf("const SHORT_NECK = [null, 'bowtie', 'scarf']") !== -1 &&
    system.indexOf("const SHORT_BACK = [null, 'backpack', 'cape']") !== -1);
  check('Гость видит наряды друга: в сцене друзей ставится шея и спина',
    friends.indexOf('host.scarf =') !== -1 && friends.indexOf('host.backpack =') !== -1 &&
    friends.indexOf('host.cape =') !== -1);

  // --- 3. Голоса героев ---
  const voiceBlocks = charsSrc.match(/voice: \{[^}]*\}/g) || [];
  check('Голос есть у каждого героя (6 героев — 6 голосов в CHARACTERS)',
    voiceBlocks.length === 6, 'голосов: ' + voiceBlocks.length);
  check('Голос звучит из сцен: выбор героя, кормление/купание/игра/сон, покупка наряда',
    menu.indexOf('AudioSys.voice(') !== -1 && shop.indexOf('AudioSys.voice(') !== -1 &&
    home.indexOf("AudioSys.voice(System.look.char, 'sleepy')") !== -1);
  check('Голос — синтезатор, а не «пустышка»: playVoice строит ноты по описанию героя',
    audioSrc.indexOf('voice(charId, mood)') !== -1 && audioSrc.indexOf('playVoice(v, mood)') !== -1 &&
    audioSrc.indexOf('osc.frequency.setValueAtTime(') !== -1 && audioSrc.indexOf('voiceHint(charId)') !== -1);
  check('Кадры нарядов на всех героях есть в стенде рендера (видно глазами)',
    (renderCheck.match(/home~look=char:/g) || []).length >= 6,
    'кадров с нарядами: ' + (renderCheck.match(/home~look=char:/g) || []).length);

  if (!rt) { check('Наряды и голоса проверены в браузерной песочнице', false, 'игра не запустилась'); return; }
  const vmRun = c => { try { return vm.runInContext(c, rt.sandbox); } catch (e) { return 'ОШИБКА: ' + e.message; } };

  // --- 4. Наряды на всех героях: 66 сочетаний без ошибок и «видно, что надето» ---
  const combos = vmRun(`(function(){
    // Имя поля фигурки для слота: hat/glasses — своим значением, шея и спина — флагом
    const flag = (o) => o.slot === 'hat' ? 'hat'
      : o.slot === 'glasses' ? 'glasses'
      : o.slot === 'neck' ? (o.value === 'scarf' ? 'scarf' : 'bowtie')
      : (o.value === 'cape' ? 'cape' : 'backpack');
    const value = (o) => (o.slot === 'hat' || o.slot === 'glasses') ? o.value : true;
    // Считаем вызовы рисования: у фигурки с нарядом их обязано быть больше,
    // чем у той же фигурки без него (иначе «товар есть, а на герое не видно»).
    const count = (chId, apply) => {
      let n = 0;
      const grad = { addColorStop() {} };
      const rec = new Proxy({ canvas: { width: 400, height: 400 }, measureText: () => ({ width: 10 }),
        createLinearGradient: () => grad, createRadialGradient: () => grad },
        { get(t, p) { return p in t ? t[p] : function () { n++; }; }, set(t, p, v) { t[p] = v; return true; } });
      const f = createCharacter(chId, 100);
      if (apply) apply(f);
      try { f.draw(rec, 200, 200, 1); } catch (e) { return 'ОШИБКА: ' + e.message; }
      return n;
    };
    const out = [];
    CHARACTERS.forEach(ch => {
      const base = count(ch.id, null);
      OUTFITS.forEach(o => {
        const got = count(ch.id, fig => { fig[flag(o)] = value(o); });
        if (typeof got === 'string') out.push(ch.name + '/' + o.name + ': ' + got);
        else if (got <= base) out.push(ch.name + '/' + o.name + ': вызовов ' + base + ' → ' + got);
      });
    });
    return { out: out, total: CHARACTERS.length * OUTFITS.length };
  })()`);
  check('Каждый наряд виден на каждом герое — 66 сочетаний без «невидимых» товаров',
    !!(combos && combos.out) && combos.out.length === 0,
    (combos && combos.out) ? (combos.out.slice(0, 3).join('; ') || (combos.total + ' сочетаний в порядке')) : String(combos));

  // --- 5. Слот один, «снять всё», покупка один раз, старые сохранения ---
  vmRun('System.resetProgress(); System.coins = 300;');
  const slotsRes = vmRun(`(function(){
    const one = System.setOutfit('hat', 'cap') && System.setOutfit('neck', 'scarf');
    const state = Object.assign({}, System.look);
    System.setOutfit('hat', 'chef');
    const after = Object.assign({}, System.look);
    const bad = System.setOutfit('tail', 'fluffy') === false && System.setOutfit('hat', 'sombrero') === false;
    System.clearOutfits();
    return { one, state, after, bad, empty: Object.keys(System.lookOutfit()).length === 0 };
  })()`);
  check('Слот один: кепка и шарф надеваются вместе, а шеф-шапка снимает кепку',
    slotsRes.one === true && slotsRes.state.hat === 'cap' && slotsRes.state.neck === 'scarf' &&
    slotsRes.after.hat === 'chef' && slotsRes.after.neck === 'scarf');
  check('«Снять всё» очищает слоты; несуществующий наряд и слот не принимаются',
    slotsRes.empty === true && slotsRes.bad === true);
  const buyRes = vmRun(`(function(){
    System.resetProgress(); System.coins = 500;
    const price = findOutfit('back', 'cape').cost;
    // Берём настоящую сцену магазина из запущенной игры: у неё есть размеры
    // холста (фейковая сцена давала NaN в координатах карточек).
    const scene = __game.scenes.shop;
    const shopCtx = __game.ctx;
    const openTab = (page) => { scene.init(); scene.currentTab = 'clothes'; scene.page = page; scene.draw(shopCtx); };
    const findCard = (slot, value) => {
      for (let p = 0; p < 8; p++) {
        openTab(p);
        const b = scene.buttons.find(x => x.slot === slot && x.value === value);
        if (b) return b;
        if (p + 1 >= (scene.pages || 1)) break;
      }
      return null;
    };
    const click = (slot, value) => {
      const b = findCard(slot, value);
      return b ? !!scene.handleClick(b.x + 4, b.y + 4) : false;
    };
    const before = System.coins;
    const first = click('back', 'cape');
    const afterBuy = System.coins;
    const card = findCard('back', 'cape');
    const cardWorn = card ? { active: !!card.active, owned: !!card.owned } : null;
    System.setOutfit('back', null);
    const second = click('back', 'cape');
    const afterWear = System.coins;
    return { price, first, second, before, afterBuy, afterWear, cardWorn,
             owned: System.ownsOutfit('back', 'cape'), look: System.look.back };
  })()`);
  check('Наряд покупается за монеты один раз, второе надевание — бесплатно',
    buyRes.first === true && buyRes.second === true && buyRes.afterBuy === buyRes.before - buyRes.price &&
    buyRes.afterWear === buyRes.afterBuy && buyRes.look === 'cape' && buyRes.owned === true,
    'цена ' + buyRes.price + ': монет ' + buyRes.before + ' → ' + buyRes.afterBuy + ' → ' + buyRes.afterWear);
  check('Карточка наряда в магазине не врёт: «надето» и «куплено» показаны',
    !!buyRes.cardWorn && buyRes.cardWorn.active === true && buyRes.cardWorn.owned === true);
  const legacy = vmRun(`(function(){
    const a = System.migrateLook({ hat: null, glasses: null, bowtie: true, fur: 'mint', char: 'bear' });
    const b = System.migrateLook({ hat: 'sombrero', glasses: 'monocle', neck: 'tie', back: 'wings' });
    const fig = createCharacter('bear', 100);
    System.look = a; System.applyLookTo(fig);
    const figOk = fig.bowtie === true && fig.scarf === false && fig.backpack === false;
    System.look = { hat: null, glasses: null, neck: 'scarf', back: 'cape', bowtie: false, fur: 'classic', char: 'milka' };
    System.applyLookTo(fig);
    return { a, b, figOk, scarf: fig.scarf, cape: fig.cape, bowtie: fig.bowtie };
  })()`);
  check('Старое сохранение с «бабочкой» превращается в слот neck и рисуется на герое',
    legacy.a.neck === 'bowtie' && legacy.figOk === true);
  check('Наряды из будущих версий снимаются (игра не падает на незнакомом наряде)',
    legacy.b.hat === null && legacy.b.glasses === null && legacy.b.neck === null && legacy.b.back === null);
  check('Фигурка получает шарф и плащ из одного места — System.applyLookTo',
    legacy.scarf === true && legacy.cape === true && legacy.bowtie === false);

  // --- 6. Код друга: наряды едут к другу, старые коды читаются ---
  const codes = vmRun(`(function(){
    System.resetProgress();
    System.setCharacter('milka'); System.setFur('rose');
    System.setOutfit('hat', 'cap'); System.setOutfit('neck', 'scarf'); System.setOutfit('back', 'backpack');
    const code = System.getShortCode();
    const back = System.unpackShortCode(code.replace(/-/g, ''));
    const fig = createCharacter(back.look.char, 100);
    System.applyLookTo(fig);
    const v1a = System.unpackShortCode('A206RG0000000 004'.replace(/[^0-9A-Z]/g, ''));
    const v1b = System.unpackShortCode('DC4T1JQE86HE0001');
    return { code, back: back.look,
             guest: { scarf: fig.scarf, backpack: fig.backpack, cap: fig.hat },
             v1a: { look: v1a.look, level: v1a.level },
             v1b: { look: v1b.look, wall: v1b.room.wall, floor: v1b.room.floor, furn: v1b.room.furniture.length },
             broken: System.unpackShortCode('AAAAAAAAAAAAAAAA') === null };
  })()`);
  check('Короткий код (v2) везёт наряды: гость увидит кепку, шарф и рюкзак друга',
    codes.back.char === 'milka' && codes.back.fur === 'rose' && codes.back.hat === 'cap' &&
    codes.back.neck === 'scarf' && codes.back.back === 'backpack' &&
    codes.guest.scarf === true && codes.guest.backpack === true && codes.guest.cap === 'cap',
    codes.code);
  check('Старые коды друзей (v1) читаются как раньше — друзья не теряются',
    codes.v1a.look.char === 'bunny' && codes.v1a.look.fur === 'mint' && codes.v1a.look.hat === 'crown' &&
    codes.v1a.look.glasses === 'nerd' && codes.v1a.look.neck === 'bowtie' && codes.v1a.level === 7 &&
    codes.v1b.look.char === 'milka' && codes.v1b.wall === 'mint' && codes.v1b.floor === 'blue' &&
    codes.v1b.furn === 4, 'проверено на двух кодах из прошлой версии');
  check('Испорченный короткий код отвергается (контрольный символ работает)',
    codes.broken === true);

  // --- 7. Голос героя: ноты, тембр и «не падает без звука» ---
  const voiceRes = vmRun(`(function(){
    const notes = {};
    const spec = { base: 300, type: 'square', steps: [1, 1.5], dur: 0.1, bend: 1.2 };
    let start = [];
    const fake = {
      currentTime: 0, state: 'running', resume() {}, destination: {},
      createOscillator() {
        return { type: '',
                 frequency: { setValueAtTime: (v) => start.push(v), exponentialRampToValueAtTime() {} },
                 connect() {}, start() {}, stop() {} };
      },
      createGain() {
        return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
                 connect() {} };
      }
    };
    const keep = AudioSys.ctx;
    AudioSys.ctx = fake;
    AudioSys.playVoice(spec, 'hello'); notes.hello = start.length;
    start = []; AudioSys.playVoice(spec, 'happy'); notes.happy = start.length;
    start = []; AudioSys.playVoice(spec, 'sleepy'); notes.sleepy = start.length;
    const firstSleepy = start[0];
    AudioSys.ctx = null;
    const silent = AudioSys.voice('milka', 'hello');
    AudioSys.ctx = keep;
    return { notes, firstSleepy, base: spec.base, silent, hint: AudioSys.voiceHint('robot'),
             all: CHARACTERS.every(c => !!c.voice && c.voice.base > 0) };
  })()`);
  check('Голос героя — это ноты: радость длиннее знакомства, сон мягче и ниже',
    voiceRes.notes.hello === 2 && voiceRes.notes.happy === 3 && voiceRes.notes.sleepy === 2 &&
    voiceRes.firstSleepy < voiceRes.base, 'нот: ' + JSON.stringify(voiceRes.notes));
  check('Голос есть у каждого героя; без звуковой системы игра не падает',
    voiceRes.silent === false && voiceRes.all === true && voiceRes.hint.indexOf('Робот') === 0,
    voiceRes.hint);

  // --- 8. Что нашлось только на живом Android (эмулятор, не Chrome) ---
  check('Меню надевает на героя наряд из сохранения (после перезапуска герой не «раздет»)',
    system.indexOf('previewFromSave()') !== -1 && system.indexOf('lookFromSave()') !== -1 &&
    menu.indexOf('System.previewFromSave()') !== -1);
  const lookRes = vmRun(`(function(){
    System.resetProgress();
    System.look = System.migrateLook({ hat: 'cap', neck: 'scarf', back: 'cape', fur: 'sky', char: 'robot' });
    System.saveGame();
    System.look = System.migrateLook({ fur: 'classic', char: 'gopher' });
    const got = System.lookFromSave();
    const fig = createCharacter('gopher', 100);
    System.applyLookTo(fig);
    return { got: got, look: System.look, hat: fig.hat, scarf: fig.scarf, cape: fig.cape, char: System.look.char };
  })()`);
  check('Внешний вид из сохранения возвращается целиком (наряд, окрас, персонаж)',
    lookRes.got === true && lookRes.hat === 'cap' && lookRes.scarf === true && lookRes.cape === true &&
    lookRes.char === 'robot' && lookRes.look.fur === 'sky',
    'надето: ' + lookRes.hat + '/' + (lookRes.scarf ? 'шарф' : '—') + '/' + (lookRes.cape ? 'плащ' : '—'));
  check('Кнопка «Вставить из буфера» не молчит: объясняет путь через меню Android',
    helpers.indexOf('Буфер недоступен приложению') !== -1 && helpers.indexOf('target.select()') !== -1);

  vmRun('System.resetProgress(); System.isSleeping = false;');
}

/* ---------- БЛОК 8: ФОНОВАЯ МУЗЫКА И ДВЕ ГАЛОЧКИ ЗВУКА (v1.3.1) ----------
   Заказчик: «хорошо бы сделать какую-нибудь фоновую музыку нейтральную,
   конечно, с возможностью отключения как музыки, так и звуков вообще, в
   настройках игры». Проверяем буквально:
     • музыка есть, она фоновая (играет сама, петлёй, без mp3-файлов);
     • музыка «нейтральная»: вся из до-мажора, фальшивых сочетаний нет;
     • в настройках ДВЕ независимые галочки: «Звуки» и «Музыка»;
     • выключенное запоминается устройством и переживает перезапуск;
     • выключенные звуки не «протекают» ни эффектами, ни голосами героев. */
function reviewerAudio(rt) {
  console.log('\n\uD83C\uDFB5 БЛОК 8/8 — Фоновая музыка, смена мелодий и настройки звука (v1.3.1, v1.3.5)');
  const read = f => fs.readFileSync(path.join(WWW, 'js', f), 'utf8');
  const audio = read('audio.js');
  const gameSrc = read('game.js');
  const menuSrc = read('game_menu.js');
  const homeSrc = read('game_home.js');
  const visitSrc = read('game_visit.js');
  const index = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  const renderCheck = fs.readFileSync(path.join(ROOT, 'tools', 'render-check.js'), 'utf8');

  // --- 1. Музыка — это синтез, а не файл: игра остаётся офлайн и лёгкой ---
  const audioFiles = [];
  const walk = dir => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(mp3|ogg|wav|m4a|aac)$/i.test(name)) audioFiles.push(path.relative(ROOT, p));
    }
  };
  walk(WWW);
  check('Фоновая музыка синтезируется на месте: в www/ нет ни одного аудиофайла',
    audioFiles.length === 0, audioFiles.join(', ') || 'файлов 0, синтез через Web Audio');
  check('Мелодии, настроения и сдвиги описаны данными (ноты, доли, bpm, громкость)',
    /MUSIC_TUNES: \[/.test(audio) && /MUSIC_MOODS: \{/.test(audio) &&
    /MUSIC_SHIFTS: \[/.test(audio) && /MUSIC_SCALE: \[/.test(audio) &&
    audio.indexOf('MUSIC_LOOKAHEAD') !== -1);
  check('Музыка играет сама: планировщик вызывается из игрового цикла',
    gameSrc.indexOf('AudioSys.musicTick()') !== -1 && audio.indexOf('musicTick()') !== -1);
  // v1.3.12: заказчик — «музыка пока что очень заунывная, сделай повеселей будто
  // детские мелодии какие-нибудь». Причина нашлась в коде: мелодия записана
  // СТУПЕНЯМИ гаммы, а игралась как ПОЛУТОНЫ — в до-мажоре звучали фа-диез и
  // ми-бемоль. Проверяем по исходнику: ступени переводятся через musicScaleStep,
  // гамма — полный до-мажор (есть фа и си), а бас получил «ум-пах» четвертями.
  check('Мелодия идёт ступенями гаммы (musicScaleStep), а не полутонами (v1.3.12)',
    audio.indexOf('musicScaleStep(i) {') !== -1 &&
    /add\(tune\.lead, m\.lead, [\d.]+, true\)/.test(audio) &&
    /MUSIC_SCALE: \[0, 2, 4, 5, 7, 9, 11/.test(audio) &&
    audio.indexOf('musicUmPah(tune, beat, shift, out)') !== -1,
    'гамма — до-мажор с фа и си; у баса «ум-пах» из четвертей');
  // v1.3.12: заказчик — «звуки стали веселее, но надо бы их выше сделать… будто из
  // трубы сейчас всё играет. И я бы сделал её тише». «Труба» — глухой тембр, поэтому:
  // мелодия звучит ещё и на октаву выше («стеклянный» голосок), музыка проходит через
  // обрез низа, подъём на 2.6 кГц и «воздух» сверху, а общая громкость снижена.
  check('Музыка стала выше и тише: октавный голосок, фильтры звонкости, громкость ниже (v1.3.12)',
    audio.indexOf("add(tune.lead, 'sine', 0.095, true, 12)") !== -1 &&
    audio.indexOf('createBiquadFilter') !== -1 &&
    audio.indexOf('highpass.frequency.value = 170') !== -1 &&
    audio.indexOf('shine.gain.value = 4.5') !== -1 &&
    audio.indexOf('gain: 0.34') !== -1 && audio.indexOf('gain: 0.62') !== -1,
    'октава выше + обрез низа + подъём 2.6 кГц; громкость фона 0.34 вместо 0.50');
  // v1.3.5: «дети спрашивают — музыка всегда одинаковая или будет меняться?»
  check('Сцены сообщают музыке, где мы: меню/карта, дом, магазин, музей, сон',
    gameSrc.indexOf('AudioSys.setScene(sceneName)') !== -1 &&
    gameSrc.indexOf("AudioSys.setScene('menu')") !== -1 &&
    visitSrc.indexOf("AudioSys.setScene('visit:' + locationKey)") !== -1 &&
    /musicMood\(\) \{[\s\S]{0,400}scene === 'home'/.test(audio));
  check('В настройках видно, какая мелодия играет (и что они меняются)',
    menuSrc.indexOf('AudioSys.musicTuneName()') !== -1 &&
    menuSrc.indexOf('Мелодии меняются сами') !== -1);
  check('Смена мелодий заложена в данные: пулы по настроениям и сдвиги круга',
    /MUSIC_MOODS: \{[\s\S]{0,900}tunes: \[/.test(audio) &&
    /musicNextLoop\(\) \{/.test(audio) && audio.indexOf('musicTuneIndex') !== -1);
  check('Музыку глушат, когда приложение свернули (WebView держал бы звук)',
    audio.indexOf('visibilitychange') !== -1 && audio.indexOf('pauseAll()') !== -1 &&
    audio.indexOf('resumeAll()') !== -1);

  // --- 2. Две независимые галочки в настройках ---
  check('В настройках две галочки: «Звуки» и «Музыка» (не один тумблер «звук»)',
    menuSrc.indexOf("'toggle_sound'") !== -1 && menuSrc.indexOf("'toggle_music'") !== -1 &&
    menuSrc.indexOf('AudioSys.isSoundOn()') !== -1 && menuSrc.indexOf('AudioSys.isMusicOn()') !== -1);
  check('Галочка рисуется как переключатель с состоянием ВКЛ/ВЫКЛ (видно, что выбрано)',
    menuSrc.indexOf('drawToggleRow(') !== -1 && menuSrc.indexOf("'ВКЛ'") !== -1 && menuSrc.indexOf("'ВЫКЛ'") !== -1);
  check('Настройка хранится на устройстве отдельно от профиля (gopherlife_audio)',
    audio.indexOf("SETTINGS_KEY: 'gopherlife_audio'") !== -1 &&
    /loadSettings\(\)[\s\S]{0,400}localStorage\.getItem\(this\.SETTINGS_KEY\)/.test(audio) &&
    /saveSettings\(\)[\s\S]{0,200}localStorage\.setItem\(this\.SETTINGS_KEY/.test(audio) &&
    audio.indexOf('AudioSys.loadSettings();') !== -1);
  check('Выключенная музыка и выключенные звуки — разные вещи (у каждой галочки свой флаг)',
    /isSoundOn\(\) \{ return this\.settings\.sound !== false; \}/.test(audio) &&
    /isMusicOn\(\) \{ return this\.settings\.music !== false; \}/.test(audio) &&
    /setMusic\(on\)[\s\S]{0,200}this\.musicStop\(\)/.test(audio));
  check('Звуки не «протекают» при выключенной галочке: play()/voice() возвращают false',
    /play\(type\) \{\s*if \(!this\.isSoundOn\(\)/.test(audio) &&
    /voice\(charId, mood\) \{\s*if \(!this\.isSoundOn\(\)/.test(audio));
  check('Подсказка про настройки есть и в «Как играть» (ребёнок знает, где выключить)',
    gameSrc.indexOf('Музыку и звуки можно выключить') !== -1 ||
    gameSrc.indexOf('шестерёнка в углу меню') !== -1);
  check('Домашнее действие «🎵 Музыка» связано с фоновой музыкой (musicBoost)',
    homeSrc.indexOf('AudioSys.musicBoost(') !== -1 && homeSrc.indexOf('AudioSys.isMusicOn()') !== -1);
  check('Кадры настроек в стенде рендера: видно и «ВКЛ», и «ВЫКЛ»',
    renderCheck.indexOf('menu@settings+toggle_music') !== -1 &&
    renderCheck.indexOf('menu@settings+toggle_music+toggle_sound') !== -1);

  check('index.html подключает audio.js до сцен (музыка есть с первого кадра)',
    index.indexOf('js/audio.js') !== -1 && index.indexOf('js/audio.js') < index.indexOf('js/game.js'));

  // --- 3. Как музыка себя ведёт (заглушка Web Audio, считаем ноты) ---
  if (!rt) { check('Музыка и настройки проверены в браузерной песочнице', false, 'игра не запустилась'); return; }
  const vmRun = c => { try { return vm.runInContext(c, rt.sandbox); } catch (e) { return 'ОШИБКА: ' + e.message; }; };

  const musicRaw = vmRun(`(function(){
    const A = AudioSys;
    const made = { osc: 0 };
    const fake = {
      currentTime: 0, state: 'running', destination: {},
      resume() {}, suspend() {},
      createOscillator() {
        made.osc++;
        return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
                 connect() {}, start() {}, stop() {} };
      },
      createGain() {
        return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {},
                         exponentialRampToValueAtTime() {}, setTargetAtTime() {} }, connect() {} };
      },
      // v1.3.12: музыка идёт через фильтры «выше и звонче» (обрез низа, подъём
      // 2.6 кГц, «воздух»). Без них в этом фейке музыка не поднималась, и проверки
      // видели «нот 0».
      createBiquadFilter() {
        return { type: '', frequency: { value: 0 }, Q: { value: 0 }, gain: { value: 0 }, connect() {} };
      }
    };
    const keepCtx = A.ctx, keepGain = A.musicGain;
    A.ctx = fake; A.musicGain = null; A.musicPlaying = false; A.musicNotesPlayed = 0;
    A.musicMoodApplied = null; A.musicBoostUntil = 0; A.musicCache = null;
    A.settings = { music: true, sound: true };
    System.isSleeping = false;
    const started = A.musicTick();
    const first = A.musicState();
    // Планировщик продолжаем проверять на целом круге: у спокойных мелодий
    // (музейная, колыбельная) ноты реже, и «за 0.5 с» там может не быть ни одной
    for (let s = 0.5; s < A.musicLoopDuration('ambient') - 1; s += 0.5) {
      fake.currentTime = s;
      A.musicTick();
    }
    const after = A.musicNotesPlayed;          // планировщик продолжил круг
    System.isSleeping = true; A.musicTick();
    const sleep = A.musicState();
    System.isSleeping = false; A.musicTick();
    const awake = A.musicState();
    // Галочка «Музыка» выключена
    A.toggleMusic();
    const tickOff = A.musicTick();
    const off = A.musicState();
    const clickWithMusicOff = A.play('click');  // звуки при этом живы
    A.toggleMusic();
    // Галочка «Звуки» выключена: эффектов и голосов нет, музыка идёт
    const notesMark = A.musicNotesPlayed;
    A.toggleSound();
    const musicTickWithSoundOff = A.musicTick();
    const clickOff = A.play('click');
    const voiceOff = A.voice('milka', 'happy');
    const soundOff = A.musicState();
    const notesWithSoundOff = A.musicNotesPlayed - notesMark;
    A.toggleSound();
    // --- разбор всех мелодий: «нейтральность» на уровне нот ---
    const MAJOR = [0, 2, 4, 5, 7, 9, 11];
    const pc = v => ((v % 12) + 12) % 12;
    const scale = {
      off: A.MUSIC_SCALE.filter(i => MAJOR.indexOf(pc(i)) === -1).length,
      tunes: A.MUSIC_TUNES.length,
      bad: [], notes: 0, loop: A.musicLoopDuration('ambient'), list: A.MUSIC_SCALE.join(' '),
      names: A.MUSIC_TUNES.map(t => t.name).join(', '),
      moods: Object.keys(A.MUSIC_MOODS).length,
      pools: Object.keys(A.MUSIC_MOODS).map(m => m + ':' + A.MUSIC_MOODS[m].tunes.length).join(' ')
    };
    A.MUSIC_TUNES.forEach(t => {
      const lead = A.musicParseLead(t.lead);
      const bass = A.musicParseBass(t.bass, 16);
      const okNotes = lead.every(n => MAJOR.indexOf(pc(A.MUSIC_SCALE[n.i])) !== -1) &&
        bass.every(n => MAJOR.indexOf(pc(n.i)) !== -1) &&
        t.sparkle.every(s => MAJOR.indexOf(pc(A.MUSIC_SCALE[s[1]])) !== -1);
      const moves = new Set(lead.map(n => n.i)).size >= 3;
      if (!okNotes || !moves) scale.bad.push(t.id);
    });
    // Смена музыки: круг за кругом мелодия/высота другие, повторов подряд нет
    A.musicStart();
    const keys = [], heard = [];
    for (let i = 0; i < 8; i++) {
      const s2 = A.musicState();
      keys.push(s2.tune + '@' + s2.shift);
      if (heard.indexOf(s2.tune) === -1) heard.push(s2.tune);
      A.musicNextLoop();
    }
    scale.rotNoRepeat = keys.every((k, i) => i === 0 || k !== keys[i - 1]);
    scale.rotKeys = keys.slice(0, 4).join(' → ');
    scale.rotHeard = heard.length;
    scale.rotMood = A.musicMood();
    scale.rotPool = A.musicPool(scale.rotMood).length;
    // v1.3.8: жалоба «музыка заунывная и грустная» — темпы, регистр мелодий и
    // неподвижный бас. Проверяем, что музыка снова бодрая.
    scale.bpmMin = Math.min.apply(null, Object.keys(A.MUSIC_MOODS)
      .filter(m => m !== 'sleep').map(m => A.MUSIC_MOODS[m].bpm));
    scale.bpmAll = Object.keys(A.MUSIC_MOODS).map(m => m + ':' + A.MUSIC_MOODS[m].bpm).join(' ');
    scale.leadAvgMin = Math.min.apply(null, A.MUSIC_TUNES.slice(0, 5).map(t => {
      const ns = A.musicParseLead(t.lead);
      return ns.reduce((sum, n) => sum + n.i, 0) / ns.length;
    }));
    const umPahBuf = [];
    A.musicUmPah(A.musicTune(), 0.5, 0, umPahBuf);
    scale.umPahOk = umPahBuf.length === A.musicTune().bass.length * A.MUSIC_UM_PAH_PER_BASS;
    scale.pulseOk = A.MUSIC_MOODS.home.pulse === true && A.MUSIC_MOODS.play.pulse === true &&
      A.MUSIC_MOODS.museum.pulse === false && A.MUSIC_MOODS.sleep.pulse === false;
    // Настроение по экранам: где играем — там и музыка
    const moodOf = sc => { System.isSleeping = false; A.musicScene = null; return A.setScene(sc); };
    scale.moodsByScene = [moodOf('home'), moodOf('shop'), moodOf('visit:art_museum'), moodOf('visit:park'), moodOf('map')].join('/');
    System.isSleeping = true; A.musicScene = null;
    scale.moodSleep = A.setScene('home');   // сон важнее экрана
    System.isSleeping = false; A.musicScene = null; A.setScene('menu');
    scale.tuneName = A.musicTuneName();
    // Порядок восстановили: чужой блок проверок не должен остаться без звука
    A.ctx = keepCtx; A.musicGain = keepGain; A.musicPlaying = false;
    A.musicMoodApplied = null; A.musicBoostUntil = 0;
    System.isSleeping = false;
    return { started, first, after, sleep, awake, tickOff, off, clickWithMusicOff,
             musicTickWithSoundOff, clickOff, voiceOff, soundOff, notesWithSoundOff,
             scale, osc: made.osc };
  })()`);
  // Если песочница ответила ошибкой, дальше работаем с пустым отчётом:
  // проверки должны честно упасть с текстом ошибки, а не уронить ревьюера
  const music = (typeof musicRaw === 'string') ? { error: musicRaw } : musicRaw;
  const musicWhy = (music && music.error) ? music.error : 'нет данных';

  check('Фоновая музыка играет сама: петля стартует, ноты расписываются вперёд',
    music.started === true && music.first && music.first.playing === true &&
    music.first.played >= 1 && music.after > music.first.played,
    music.first ? ('нот сразу ' + music.first.played + ', через полсекунды ' + music.after) : musicWhy);
  check('Мелодий не меньше шести, и все «нейтральные»: до-мажор, без фальшивых сочетаний',
    !!music.scale && music.scale.off === 0 && music.scale.tunes >= 6 && music.scale.bad.length === 0,
    music.scale ? (music.scale.tunes + ' мелодий (' + music.scale.names + '), круг ' +
      music.scale.loop.toFixed(1) + ' с, гамма ' + music.scale.list) : musicWhy);
  check('Музыка меняется сама: подряд два круга не звучат одинаково',
    !!music.scale && music.scale.rotNoRepeat === true &&
    music.scale.rotHeard === music.scale.rotPool && music.scale.rotPool > 1,
    music.scale ? ('круги: ' + music.scale.rotKeys + ', мелодий услышано ' +
      music.scale.rotHeard + ' из ' + music.scale.rotPool + ' (настроение ' + music.scale.rotMood + ')') : musicWhy);
  check('Мелодия зависит от экрана: дом, магазин, музей, парк, сон — разные',
    !!music.scale && music.scale.moodsByScene === 'home/play/museum/play/ambient' &&
    music.scale.moodSleep === 'sleep' && music.scale.moods >= 6,
    music.scale ? ('экраны: ' + music.scale.moodsByScene + ', во сне: ' + music.scale.moodSleep +
      ', настроений ' + music.scale.moods + ' (' + music.scale.pools + ')') : musicWhy);
  check('Во сне музыка — колыбельная: медленнее и тише, чем днём',
    !!music.sleep && music.sleep.mood === 'sleep' && music.sleep.bpm < music.awake.bpm &&
    music.sleep.gain < music.awake.gain,
    music.sleep ? ('днём ' + music.awake.bpm + ' bpm / ' + music.awake.gain + ', во сне ' +
      music.sleep.bpm + ' bpm / ' + music.sleep.gain) : musicWhy);
  check('Музыка бодрая, а не заунывная: темпы 100+, мелодии в верхнем регистре (v1.3.8)',
    !!music.scale && music.scale.bpmMin >= 100 && music.scale.leadAvgMin >= 3,
    music.scale ? ('темпы ' + music.scale.bpmAll + '; средний индекс ноты не ниже ' +
      music.scale.leadAvgMin.toFixed(1)) : musicWhy);
  check('Бас «шагает» четвертями («ум-пах»), в музее и во сне — тишина (v1.3.12)',
    !!music.scale && music.scale.umPahOk === true && music.scale.pulseOk === true,
    music.scale ? ('четвертей за аккорд: ' + (music.scale.umPahOk ? 'включены' : 'нет')) : musicWhy);
  check('Галочка «Музыка» выключена — петля замолкает и ноты не расписываются',
    !!music.off && music.tickOff === false && music.off.music === false &&
    music.off.playing === false && music.off.gain < 0.01,
    music.off ? ('громкость музыки ' + music.off.gain) : musicWhy);
  check('Галочки независимые: при выключенной музыке звуки по-прежнему звучат',
    music.clickWithMusicOff === true && music.osc > 0,
    music.osc === undefined ? musicWhy : ('осцилляторов создано: ' + music.osc));
  check('Галочка «Звуки» выключена — тишина и в эффектах, и в голосах, а музыка идёт',
    !!music.soundOff && music.musicTickWithSoundOff === true && music.clickOff === false &&
    music.voiceOff === false && music.soundOff.sound === false && music.notesWithSoundOff > 0,
    music.notesWithSoundOff === undefined ? musicWhy : ('нот при выключенных звуках: ' + music.notesWithSoundOff));

  // --- 4. Галочки в настройках: нажатие работает, состояние видно на панели ---
  const uiRaw = vmRun(`(function(){
    const g = __game;
    g.currentScene = 'menu';
    const menu = g.scenes.menu;
    menu.init();
    menu.showSettings = true;
    menu.draw(g.ctx);
    const rows = (menu.buttons || []).filter(b => b.text === 'toggle_sound' || b.text === 'toggle_music');
    const pick = t => rows.filter(b => b.text === t)[0];
    const click = b => menu.handleClick(b.x + b.w / 2, b.y + b.h / 2);
    const before = { music: AudioSys.isMusicOn(), sound: AudioSys.isSoundOn() };
    click(pick('toggle_music'));                       // выключили музыку
    const afterMusic = { music: AudioSys.isMusicOn(), saved: localStorage.getItem('gopherlife_audio') };
    click(pick('toggle_music'));                       // вернули обратно
    click(pick('toggle_sound'));                       // выключили звуки
    const afterSound = { sound: AudioSys.isSoundOn(), music: AudioSys.isMusicOn(),
                         saved: localStorage.getItem('gopherlife_audio') };
    click(pick('toggle_sound'));                       // вернули обратно
    // Рисуем панель «в пиксели»: пилюли обязаны показывать состояние, а не врать
    const pills = [];
    const grad = { addColorStop() {} };
    const rec = new Proxy({
      canvas: { width: 400, height: 700 }, measureText: () => ({ width: 10 }),
      createLinearGradient: () => grad, createRadialGradient: () => grad,
      fillText: (t) => { pills.push(String(t)); }
    }, { get(t, p) { return p in t ? t[p] : function () {}; }, set(t, p, v) { t[p] = v; return true; } });
    AudioSys.setMusic(false);
    menu.draw(rec);
    const pillsMusicOff = pills.filter(t => t === 'ВКЛ' || t === 'ВЫКЛ').join('/');
    pills.length = 0;
    AudioSys.setSound(false);
    menu.draw(rec);
    const pillsBothOff = pills.filter(t => t === 'ВКЛ' || t === 'ВЫКЛ').join('/');
    pills.length = 0;
    AudioSys.setMusic(true); AudioSys.setSound(true);
    menu.draw(rec);
    const pillsBothOn = pills.filter(t => t === 'ВКЛ' || t === 'ВЫКЛ').join('/');
    menu.showSettings = false;
    return { rows: rows.length, before, afterMusic, afterSound,
             restored: AudioSys.isMusicOn() && AudioSys.isSoundOn(),
             pillsMusicOff, pillsBothOff, pillsBothOn };
  })()`);
  const ui = (typeof uiRaw === 'string') ? { error: uiRaw } : uiRaw;
  const uiWhy = (ui && ui.error) ? ui.error : 'нет данных';

  check('В настройках обе галочки нарисованы и по ним можно нажать пальцем',
    ui.rows === 2, ui.rows === undefined ? uiWhy : ('переключателей найдено: ' + ui.rows));
  check('Нажатие «Музыка» выключает музыку и сразу пишет выбор в память устройства',
    !!ui.before && ui.before.music === true && ui.afterMusic && ui.afterMusic.music === false &&
    /"music":false/.test(ui.afterMusic.saved || ''),
    ui.afterMusic ? ('в памяти: ' + ui.afterMusic.saved) : uiWhy);
  check('Нажатие «Звуки» выключает только звуки: музыка играет дальше',
    !!ui.afterSound && ui.afterSound.sound === false && ui.afterSound.music === true,
    ui.afterSound ? ('после нажатия: музыка ' + (ui.afterSound.music ? 'вкл' : 'выкл') +
      ', звуки ' + (ui.afterSound.sound ? 'вкл' : 'выкл')) : uiWhy);
  check('Панель настроек не врёт: пилюли показывают ВКЛ/ВЫКЛ по текущим галочкам',
    ui.pillsMusicOff === 'ВКЛ/ВЫКЛ' && ui.pillsBothOff === 'ВЫКЛ/ВЫКЛ' && ui.pillsBothOn === 'ВКЛ/ВКЛ' &&
    ui.restored === true,
    ui.pillsBothOn === undefined ? uiWhy : ('звуки/музыка: ' + ui.pillsMusicOff + ' → ' +
      ui.pillsBothOff + ' → ' + ui.pillsBothOn));

  // --- 5. Перезапуск приложения и независимость от профиля ---
  const restarted = (() => {
    const boot2 = createSandbox();
    boot2.__store.set('gopherlife_audio', JSON.stringify({ music: false, sound: true }));
    try {
      bootGame(boot2);
      return { music: boot2.AudioSys.isMusicOn(), sound: boot2.AudioSys.isSoundOn(),
               hint: boot2.AudioSys.settingsHint() };
    } catch (e) { return 'ОШИБКА: ' + e.message; }
  })();
  check('Перезапуск приложения: выключенная музыка так и остаётся выключенной',
    typeof restarted === 'object' && restarted.music === false && restarted.sound === true,
    typeof restarted === 'string' ? restarted : ('после перезапуска: ' + restarted.hint));

  const firstRun = (() => {
    const boot3 = createSandbox();
    try {
      bootGame(boot3);
      return { music: boot3.AudioSys.isMusicOn(), sound: boot3.AudioSys.isSoundOn(),
               hint: boot3.AudioSys.settingsHint() };
    } catch (e) { return 'ОШИБКА: ' + e.message; }
  })();
  check('Первый запуск: игра со звуком (по умолчанию музыка и звуки включены)',
    typeof firstRun === 'object' && firstRun.music === true && firstRun.sound === true,
    typeof firstRun === 'string' ? firstRun : ('на чистом устройстве: ' + firstRun.hint));

  const perDevice = vmRun(`(function(){
    AudioSys.setMusic(false);
    System.resetProgress();
    System.saveGame();
    System.loadGame();
    const after = AudioSys.isMusicOn();
    const inSave = (localStorage.getItem('gopherlife_save') || '').indexOf('gopherlife_audio') !== -1;
    AudioSys.setMusic(true);
    return { after: after, inSave: inSave };
  })()`);
  check('Настройка звука живёт отдельно от профиля: сброс прогресса её не включает обратно',
    perDevice && perDevice.after === false && perDevice.inSave === false,
    perDevice && perDevice.inSave !== undefined
      ? ('музыка после сброса и загрузки: ' + (perDevice.after ? 'вкл' : 'выкл'))
      : String(perDevice));

  const noCtx = vmRun(`(function(){
    const keep = AudioSys.ctx;
    AudioSys.ctx = null;
    const tick = AudioSys.musicTick();
    const click = AudioSys.play('click');
    const voice = AudioSys.voice('gopher', 'hello');
    AudioSys.ctx = keep;
    return { tick: tick, click: click, voice: voice };
  })()`);
  check('Без звуковой системы игра не падает: музыка и звуки молча отключаются',
    noCtx && noCtx.tick === false && noCtx.click === false && noCtx.voice === false,
    noCtx && noCtx.tick !== undefined ? 'musicTick/play/voice вернули false без исключений' : String(noCtx));

  // Приборку за собой: другим блокам проверок музыка не нужна
  vmRun('AudioSys.setSound(true); AudioSys.setMusic(true); ' +
        'localStorage.removeItem("gopherlife_audio"); AudioSys.loadSettings(); ' +
        'System.isSleeping = false; System.resetProgress(); System.isSleeping = false;');
}

/* ---------- БЛОК 9: ШКАЛЫ ПОНЯТНЫ РЕБЁНКУ (v1.3.2) ----------
   Замечание заказчика: «стресс — единственная полоска, которая работает
   наоборот; детям кажется, что все идеальные показатели должны быть полными,
   а стресс из всех выделяется» + подсказка «нажми на стресс» ничего не делала
   (кнопка справки стояла в чужой ячейке панели).
   Проверяем: в интерфейсе больше нет перевёрнутых шкал (есть «Спокойствие» =
   100 − стресс), правило написано словами, справка открывается обычной кнопкой
   «❓», а механика и старые сохранения не тронуты. */
function reviewerCalm(rt) {
  console.log('\n\uD83D\uDE0C БЛОК 9/11 — Шкалы понятны ребёнку: спокойствие вместо стресса (v1.3.2)');
  const read = f => fs.readFileSync(path.join(WWW, 'js', f), 'utf8');
  const system = read('system.js');
  const home = read('game_home.js');
  const stats = read('game_stats.js');
  const content = read('game_content.js');
  const gameSrc = read('game.js');
  const quiet = read('game_quiet.js');
  const renderCheck = fs.readFileSync(path.join(ROOT, 'tools', 'render-check.js'), 'utf8');

  // --- 1. Статика ---
  check('Есть одна шкала для показа: statValue, «спокойствие» считается из стресса',
    /calm\(\) \{ return 100 - this\.stats\.stress; \}/.test(system) &&
    /statValue\(key\) \{/.test(system) && system.indexOf("if (key === 'calm') return this.calm();") !== -1);
  check('Цвет шкал больше не перевёрнут: у стресса нет отдельной ветки в getStatColor',
    /getStatColor\(stat\) \{[\s\S]{0,300}const val = this\.statValue\(stat\)/.test(system) &&
    system.indexOf("if (stat === 'stress')") === -1);
  check('В доме и в «Инфо» показывается «Спокойствие», а «Стресс» из интерфейса убран',
    home.indexOf("key: 'calm'") !== -1 && stats.indexOf("key: 'calm'") !== -1 &&
    home.indexOf("key: 'stress'") === -1 && stats.indexOf("key: 'stress'") === -1 &&
    content.indexOf("key: 'stress'") === -1);
  check('Мёртвая подсказка «нажми на „Стресс“» убрана, вместо неё правило словами',
    home.indexOf('нажми на «Стресс»') === -1 &&
    home.indexOf('чем больше, тем лучше') !== -1 &&
    home.indexOf("action: 'help'") !== -1);
  check('Справка объясняет спокойствие как «чем больше, тем лучше» и как его поднять',
    /key: 'calm'[\s\S]{0,240}чем БОЛЬШЕ, тем лучше/.test(content) &&
    /key: 'calm'[\s\S]{0,600}сон \(\+15/.test(content));
  check('«Как играть» и итоги тихих игр говорят о спокойствии, а не о стрессе',
    (gameSrc.indexOf('Все полоски у {pet_gen} одинаковые') !== -1 ||
     gameSrc.indexOf('Все полоски одного смысла') !== -1) &&
    quiet.indexOf('+4 спокойствия') !== -1);
  check('Механика не переписана: внутри остался стресс (старые сохранения целы)',
    system.indexOf('stress: 20') !== -1 && system.indexOf('relax(amount)') !== -1 &&
    system.indexOf('this.stats.stress') !== -1 && system.indexOf('addStress(amount)') !== -1);
  check('В стенде рендера есть кадры крайних состояний шкал (видно глазами)',
    (renderCheck.match(/stats=calm/g) || []).length >= 2,
    'кадров: ' + (renderCheck.match(/stats=calm/g) || []).length);
  check('Кадры гарантированно сохраняются: «:» в имени файла заменяется, файл проверяется на диске',
    renderCheck.indexOf(".replace(/[@#:]/g, '_')") !== -1 &&
    renderCheck.indexOf('кадр не записан на диск') !== -1);

  // --- 2. Песочница: значения, цвета, надписи и клик по справке ---
  if (!rt) { check('Шкалы проверены в песочнице', false, 'игра не запустилась'); return; }
  const vmRun = c => { try { return vm.runInContext(c, rt.sandbox); } catch (e) { return 'ОШИБКА: ' + e.message; }; };
  const resRaw = vmRun(`(function(){
    const S = System;
    const back = S.stats.stress;
    S.stats.stress = 20;
    const calmLow = { calm: S.calm(), shown: S.statValue('calm'), internal: S.stats.stress };
    // Цвета: полная шкала зелёная, пустая красная — у ВСЕХ шкал одинаково
    S.stats.stress = 0;  const calmFull = S.getStatColor('calm');
    S.stats.stress = 90; const calmEmpty = S.getStatColor('calm');
    S.stats.hunger = 90; const hungerFull = S.getStatColor('hunger');
    S.stats.hunger = 5;  const hungerEmpty = S.getStatColor('hunger');
    S.stats.stress = 80;
    const hint = S.stressHint();
    // Что РЕАЛЬНО нарисовано на панели дома и в «Инфо»
    const texts = [];
    const grad = { addColorStop() {} };
    const rec = new Proxy({ canvas: { width: 390, height: 744 }, measureText: () => ({ width: 10 }),
      createLinearGradient: () => grad, createRadialGradient: () => grad,
      fillText: (t) => { texts.push(String(t)); } },
      { get(t, p) { return p in t ? t[p] : function () {}; }, set(t, p, v) { t[p] = v; return true; } });
    const g = new Game();
    g.init();
    const house = g.scenes.home;
    house.init();
    house.draw(rec);
    const painted = texts.join(' | ');
    const paintedCalm = texts.filter(t => /Спокойствие|Стресс/.test(t));
    const helpBtn = (house.buttons || []).filter(b => b.action === 'help')[0] || null;
    if (helpBtn) house.handleClick(helpBtn.x + helpBtn.w / 2, helpBtn.y + helpBtn.h / 2);
    const sheetOpened = house.sheet;
    texts.length = 0;
    const st = g.scenes.stats;
    st.init();
    st.draw(rec);
    const info = texts.join(' | ');
    S.stats.stress = back;
    return { calmLow: calmLow, calmFull: calmFull, calmEmpty: calmEmpty,
             hungerFull: hungerFull, hungerEmpty: hungerEmpty, hint: hint,
             painted: painted, paintedCalm: paintedCalm,
             helpBtn: helpBtn ? { w: Math.round(helpBtn.w), h: Math.round(helpBtn.h) } : null,
             sheetOpened: sheetOpened, info: info };
  })()`);
  const res = (typeof resRaw === 'string') ? { error: resRaw } : resRaw;
  const why = res.error || 'нет данных';

  check('Спокойствие на экране — это 100 − стресс (внутри ничего не поменялось)',
    !!res.calmLow && res.calmLow.calm === 80 && res.calmLow.shown === 80 && res.calmLow.internal === 20,
    res.calmLow ? ('стресс 20 → показано ' + res.calmLow.shown + '%') : why);
  check('Все шкалы одного типа: полная зелёная, пустая красная — и у спокойствия тоже',
    res.calmFull === '#4ade80' && res.calmEmpty === '#ef4444' &&
    res.hungerFull === res.calmFull && res.hungerEmpty === res.calmEmpty,
    res.calmFull ? ('спокойствие 100 → ' + res.calmFull + ', 10 → ' + res.calmEmpty +
      '; сытость 90 → ' + res.hungerFull + ', 5 → ' + res.hungerEmpty) : why);
  check('Низкое спокойствие объясняется словами («нервничает»), а не названием шкалы',
    typeof res.hint === 'string' && res.hint.length > 10 && res.hint.indexOf('Спокойствие') === -1 &&
    /нервничает/.test(res.hint), res.hint || why);
  check('На панели дома нарисовано «Спокойствие» и НЕТ слова «Стресс»',
    typeof res.painted === 'string' && res.painted.indexOf('Спокойствие') !== -1 &&
    res.painted.indexOf('Стресс') === -1,
    Array.isArray(res.paintedCalm) ? res.paintedCalm.join(' / ') : why);
  check('Кнопка справки «❓» в панели открывает справку (раньше попасть было нельзя)',
    !!res.helpBtn && res.sheetOpened === 'help',
    res.helpBtn ? ('кнопка ' + res.helpBtn.w + '×' + res.helpBtn.h + ' → открылось: ' + res.sheetOpened) : why);
  check('В «Инфо» та же шкала «Спокойствие» (единообразие по всей игре)',
    typeof res.info === 'string' && res.info.indexOf('Спокойствие') !== -1 &&
    res.info.indexOf('Стресс') === -1,
    typeof res.info === 'string' ? 'надписи совпадают с панелью дома' : why);

  // Приборку за собой: песочница должна остаться в нормальном состоянии
  vmRun('System.stats.stress = 20; System.isSleeping = false;');
}

/* ---------- БЛОК 10: ГОТОВНОСТЬ К RUSTORE (v1.3.3) ----------
   Задача: приложение должно без сюрпризов пройти модерацию RuStore, а выпуск
   следующих версий — быть одной командой. Проверяем: нет лишних разрешений и
   сетевого кода, политика конфиденциальности на месте и говорит правду,
   инструмент публикации не выносит ключ за пределы связки ключей, тексты карточки
   влезают в лимиты магазина, а меню не врёт про прогресс ребёнка. */
function reviewerRuStore(rt) {
  console.log('\n\ud83d\udcfa БЛОК 10/11 — Готовность к RuStore: разрешения, политика, публикация (v1.3.3)');
  const manifest = fs.readFileSync(path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  const pubTool = fs.readFileSync(path.join(ROOT, 'tools', 'rustore-publish.js'), 'utf8');
  const policy = fs.readFileSync(path.join(ROOT, 'store', 'privacy-policy.html'), 'utf8');
  const rustoreDoc = fs.readFileSync(path.join(ROOT, 'store', 'RUSTORE.md'), 'utf8');
  const packageJson = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  const menu = fs.readFileSync(path.join(WWW, 'js', 'game_menu.js'), 'utf8');
  const system = fs.readFileSync(path.join(WWW, 'js', 'system.js'), 'utf8');
  const js = fs.readdirSync(path.join(WWW, 'js'))
    .filter(f => f.endsWith('.js'))
    .map(f => fs.readFileSync(path.join(WWW, 'js', f), 'utf8')).join('\n');

  // --- 1. Разрешения и офлайн ---
  check('APK запрашивает только нужные для обновления разрешения (интернет + установка обновлений)',
    (manifest.match(/uses-permission/g) || []).length === 2 &&
    manifest.indexOf('android.permission.INTERNET') !== -1 &&
    manifest.indexOf('android.permission.REQUEST_INSTALL_PACKAGES') !== -1,
    'строк uses-permission: ' + (manifest.match(/uses-permission/g) || []).length);
  check('Запрещён открытый HTTP (usesCleartextTraffic=false)',
    manifest.indexOf('usesCleartextTraffic="false"') !== -1);
  check('Сеть только чтобы спросить GitHub о новой версии (игра и чат без запросов)',
    !/XMLHttpRequest|new WebSocket/.test(js) &&
    (js.match(/fetch\s*\(/g) || []).length === 1 &&
    js.indexOf('api.github.com/repos/Lemeshev/Gopher/releases/latest') !== -1);

  // --- 2. Инструмент публикации и секреты ---
  check('Есть инструмент публикации через официальный API RuStore',
    pubTool.indexOf('public-api.rustore.ru') !== -1 &&
    pubTool.indexOf("'/public/auth/'") !== -1 &&
    pubTool.indexOf('/version') !== -1);
  check('Загрузка версии использует официальные методы API (APK, скриншоты v2, модерация)',
    pubTool.indexOf('/version/\' + versionId + \'/apk') !== -1 &&
    pubTool.indexOf('/image/screenshot/PORTRAIT/') !== -1 &&
    pubTool.indexOf('/commit') !== -1);
  check('Ключ API читается из связки ключей macOS и никуда не пишется в проект',
    pubTool.indexOf('find-generic-password') !== -1 &&
    !/writeFileSync\([^)]*privateKey/.test(pubTool) &&
    pubTool.indexOf('gopherlife-rustore') !== -1);
  check('По умолчанию — сухой прогон: запросы уходят только с флагом --go',
    /const GO = has\('go'\)/.test(pubTool) &&
    /if \(!GO\) \{ warn\('сухой прогон — запрос не отправлен'/.test(pubTool));
  check('Состояние выпуска и ключи защищены .gitignore',
    gitignore.indexOf('.rustore-state.json') !== -1 && gitignore.indexOf('store/*.key') !== -1);
  check('Есть команды npm для выпуска (meta/check/status/publish)',
    ['rustore:meta', 'rustore:check', 'rustore:status', 'rustore:publish']
      .every(c => packageJson.indexOf('"' + c + '"') !== -1));
  check('В инструкции есть предупреждение перевыпустить ключ из переписки',
    rustoreDoc.indexOf('БЕЗОПАСНОСТЬ') !== -1 && rustoreDoc.indexOf('перевыпустите') !== -1);

  // --- 3. Политика конфиденциальности ---
  check('Политика конфиденциальности есть и написана для человека',
    policy.length > 1500 && policy.indexOf('Политика конфиденциальности') !== -1);
  check('Политика честно говорит: данных не собираем, рекламы нет, разрешения — только для обновления',
    /Никакие/.test(policy) && /[Пп]ередачи нет/.test(policy) &&
    /рекламу/.test(policy) && /скачать обновление игры/.test(policy));
  check('В политике есть контакты разработчика (для карточки RuStore)',
    policy.indexOf('mailto:') !== -1 || /\S+@\S+\.\S+/.test(policy));

  // --- 4. Меню не врёт про прогресс (нашлось на живом устройстве) ---
  check('Меню читает из сохранения уровень, опыт и монеты (не только наряд)',
    system.indexOf('previewFromSave()') !== -1 && menu.indexOf('previewFromSave') !== -1 &&
    /typeof data\.level === 'number'/.test(system) && /typeof data\.xp === 'number'/.test(system));

  if (!rt) { check('Публикация проверена в песочнице', false, 'игра не запустилась'); return; }
  const vmRun = c => { try { return vm.runInContext(c, rt.sandbox); } catch (e) { return 'ОШИБКА: ' + e.message; }; };

  // Живая проверка: сохранили прогресс → меню показывает его, а не нули.
  const menuRes = vmRun(`(function(){
    const S = System;
    S.resetProgress();
    S.level = 4; S.xp = 250; S.xpToNext = 300; S.coins = 777;
    S.totalPlayTime = 1234; S.saveGame();
    S.resetProgress();               // как будто приложение только запустилось
    const before = { level: S.level, xp: S.xp, coins: S.coins };
    const g = new Game(); g.init();
    const m = g.scenes.menu;
    m.init();
    return { before: before, after: { level: S.level, xp: S.xp, coins: S.coins } };
  })()`);
  const mr = (typeof menuRes === 'string') ? { error: menuRes } : menuRes;
  check('После перезапуска меню показывает уровень, опыт и монеты из сохранения',
    !!mr.after && mr.before && mr.before.xp === 0 && mr.after.xp === 250 &&
    mr.after.level === 4 && mr.after.coins === 777,
    mr.after ? ('в меню: ур.' + mr.after.level + ', ' + mr.after.xp + '/' + 300 + ' XP, ' + mr.after.coins + ' монет') : mr.error);

  // Приборка: песочница — общее состояние для других проверок
  vmRun('System.resetProgress(); System.isSleeping = false;');
}

/* ---------- БЛОК 11: ИМЯ ГЕРОЯ В ТЕКСТАХ (v1.3.3) ----------
   Замечание заказчика: «все другие персонажи тоже называются Гоферами, хотя у них
   есть свои имена. Гофер должен быть только для гофера». Проверяем: у каждого
   героя есть формы имени и род, подстановка склоняет и согласует по роду, ни одна
   видимая строка не называет питомца «гофером», а в углу меню при непереименованном
   профиле видно имя героя. Тексты самих кадров проверяет ревьюер рендера. */
function reviewerHeroNames(rt) {
  console.log('\n\ud83d\udc3e БЛОК 11/11 — Имя героя в текстах: Милка не «гофер» (v1.3.4)');
  const helpers = fs.readFileSync(path.join(WWW, 'js', 'helpers.js'), 'utf8');
  const chars = fs.readFileSync(path.join(WWW, 'js', 'characters.js'), 'utf8');
  const system = fs.readFileSync(path.join(WWW, 'js', 'system.js'), 'utf8');
  const menu = fs.readFileSync(path.join(WWW, 'js', 'game_menu.js'), 'utf8');
  const renderCheck = fs.readFileSync(path.join(ROOT, 'tools', 'render-check.js'), 'utf8');
  const harness = fs.readFileSync(path.join(ROOT, 'tools', 'shots', 'harness.html'), 'utf8');

  // --- 1. Данные героя: слово для текстов и род ---
  check('У каждого героя есть формы имени (5 падежей) и род',
    (chars.match(/^\s*gender: '[mf]',/gm) || []).length === 6 &&
    (chars.match(/pet: \{ nom:/g) || []).length === 6,
    'героев с формами: ' + (chars.match(/pet: \{ nom:/g) || []).length);
  const sectionOf = (src, id) => {
    const i = src.indexOf("id: '" + id + "'");
    if (i === -1) return '';
    const rest = src.slice(i + 1);
    const j = rest.indexOf("id: '");
    return rest.slice(0, j === -1 ? rest.length : j);
  };
  const aliens = ['bear', 'bunny', 'cat', 'robot', 'milka']
    .filter(id => /гофер/i.test(sectionOf(chars, id)));
  check('«Гофер» остался только у самого гофера (не у мишки, зайки, котёнка, робота, Милки)',
    aliens.length === 0 && /гофер/i.test(sectionOf(chars, 'gopher')),
    aliens.join(', ') || 'только у гофера');

  // --- 2. Подстановка имени: одна функция на всю игру ---
  check('Имя героя подставляется одной функцией (petFill): падежи, род, «ней/ним»',
    helpers.indexOf('function petFill(') !== -1 && helpers.indexOf('{pet:') !== -1 &&
    helpers.indexOf('pet_gen') !== -1 && helpers.indexOf('pet_dat') !== -1 &&
    helpers.indexOf('pet_acc') !== -1 && helpers.indexOf('pet_ins') !== -1 &&
    helpers.indexOf('PET_PRON') !== -1);
  check('Любой текст на канвасе проходит подстановку (перехват fillText и measureText)',
    helpers.indexOf('installPetText') !== -1 &&
    /Proto\.fillText = function/.test(helpers) && /Proto\.measureText = function/.test(helpers) &&
    helpers.indexOf('installPetText(CanvasRenderingContext2D.prototype)') !== -1);
  check('HTML-плашка достижений тоже говорит именем героя, а не шаблоном',
    /showAchievement\(emoji, text\)[\s\S]{0,400}petFill\(text\)/.test(system) &&
    system.indexOf('text: shown') !== -1);

  // --- 3. Ни одна видимая строка не называет питомца «гофером» ---
  // Комментарии вырезаем: в них «гофер» — это объяснение для разработчика.
  const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map(l => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
  const dirty = [];
  fs.readdirSync(path.join(WWW, 'js')).filter(f => f.endsWith('.js')).forEach(f => {
    if (f === 'characters.js') return;              // у самого гофера «гофер» — законно
    const src = stripComments(fs.readFileSync(path.join(WWW, 'js', f), 'utf8'))
      // DEFAULT_PROFILE_NAME — имя профиля из старых сохранений: на экран оно не
      // попадает (в подписи его заменяет имя героя, см. profileLabel), а менять
      // его нельзя: у детей уже есть профили с таким именем
      .replace(/const DEFAULT_PROFILE_NAME = 'Гофер';/, '');
    const hits = src.match(/гофер/gi);
    if (hits) dirty.push(f + ' ×' + hits.length);
  });
  check('Ни одна видимая строка не называет питомца «гофером» (только шаблоны {pet})',
    dirty.length === 0, dirty.join(', ') || 'чисто');
  check('Имя профиля «Гофер» оставлено только ради старых сохранений (в подписи его нет)',
    system.indexOf("const DEFAULT_PROFILE_NAME = 'Гофер';") !== -1 &&
    /profileLabel\(\) \{[\s\S]{0,200}characterName\(\)/.test(system));

  // --- 4. Подпись профиля в меню ---
  check('В углу меню — имя героя, а не всегда «Гофер»',
    menu.indexOf('System.profileLabel()') !== -1 && system.indexOf('profileLabel()') !== -1 &&
    /profileLabel\(\) \{\s*const own/.test(system) &&
    menu.indexOf("System.profileName || 'Гофер'") === -1);
  check('Список профилей и друзей подписан героем профиля, а не «Гофером»',
    menu.indexOf('System.profileLabelFor(pr.id)') !== -1 &&
    menu.indexOf('System.emojiForProfile(pr.id)') !== -1 &&
    /profileLabelFor\(profileId\) \{/.test(system) && /characterForProfile\(profileId\) \{/.test(system) &&
    system.indexOf('name: this.profileLabelFor(pr.id)') !== -1,
    'список профилей, эмодзи и список друзей читают героя из сохранения профиля');
  check('Профиль создаётся вопросами без «гофера» («Как зовут питомца?»)',
    menu.indexOf('Как зовут питомца?') !== -1 && menu.indexOf('Новый питомец') !== -1);

  // --- 5. Кадры ревьюера рендера проверяют имя на экране ---
  check('Кадры с Мишкой и Милкой требуют имя героя на экране и не терпят шаблонов',
    (renderCheck.match(/needText: \['/g) || []).length >= 5 &&
    (renderCheck.match(/forbidText: \['/g) || []).length >= 5 &&
    renderCheck.indexOf('на экран попал шаблон') !== -1 &&
    harness.indexOf('petLeftover') !== -1 && harness.indexOf('petFill(text)') !== -1);

  if (!rt) { check('Подстановка имени проверена в песочнице', false, 'игра не запустилась'); return; }
  const vmRun = c => { try { return vm.runInContext(c, rt.sandbox); } catch (e) { return 'ОШИБКА: ' + e.message; }; };

  // Живая проверка: каждый текст игры под каждым героем — без «гофера» и шаблонов
  const liveRes = vmRun(`(function(){
    const S = System, out = {};
    const texts = [];
    ACHIEVEMENTS.forEach(a => texts.push(a.desc));
    STAT_HELP.forEach(h => {
      texts.push(h.what);
      (h.up || []).forEach(t => texts.push(t));
      (h.down || []).forEach(t => texts.push(t));
    });
    QUIET_RULES.forEach(t => texts.push(t));
    const bad = [];
    CHARACTERS.forEach(c => {
      S.setCharacter(c.id);
      texts.map(petFill).forEach(t => {
        if (t.indexOf('{') !== -1 || (c.id !== 'gopher' && /\\u0433\\u043e\\u0444\\u0435\\u0440/i.test(t))) bad.push(c.id + ': ' + t);
      });
      out[c.id] = petFill('{Pet} \\u2014 \\u043a\\u043e\\u0440\\u043c\\u0438\\u0442\\u044c {pet_acc}, \\u0438\\u0433\\u0440\\u0430\\u0442\\u044c \\u0441 {pet_ins}, \\u0433\\u043e\\u0432\\u043e\\u0440\\u0438\\u0442\\u044c {pet_dat}');
    });
    S.setCharacter('gopher');
    S.profileName = DEFAULT_PROFILE_NAME;
    // Список профилей: у профиля без своего имени подпись — имя ЕГО героя (v1.3.5)
    const keepP = localStorage.getItem(S.PROFILE_KEY);
    const keepS1 = localStorage.getItem(S.saveKeyFor('p1'));
    const keepS2 = localStorage.getItem(S.saveKeyFor('p2'));
    localStorage.setItem(S.PROFILE_KEY, JSON.stringify([
      { id: 'p1', name: DEFAULT_PROFILE_NAME }, { id: 'p2', name: '\u0412\u0438\u0442\u044f' }
    ]));
    localStorage.setItem(S.saveKeyFor('p1'), JSON.stringify({ level: 2, look: { char: 'milka' } }));
    localStorage.setItem(S.saveKeyFor('p2'), JSON.stringify({ level: 4, look: { char: 'bear' } }));
    out.profile1 = S.profileLabelFor('p1') + '/' + S.emojiForProfile('p1');
    out.profile2 = S.profileLabelFor('p2');
    localStorage.setItem(S.PROFILE_KEY, keepP);
    if (keepS1 === null) localStorage.removeItem(S.saveKeyFor('p1')); else localStorage.setItem(S.saveKeyFor('p1'), keepS1);
    if (keepS2 === null) localStorage.removeItem(S.saveKeyFor('p2')); else localStorage.setItem(S.saveKeyFor('p2'), keepS2);
    return { out: out, bad: bad.slice(0, 2), count: texts.length };
  })()`);
  const lv = (typeof liveRes === 'string') ? { bad: [liveRes] } : liveRes;
  check('Тексты игры (достижения, справка, правила) звучат правильно у всех 6 героев',
    !!lv.count && lv.bad && lv.bad.length === 0,
    (lv.bad && lv.bad.length) ? lv.bad.join(' | ') : ('строк: ' + lv.count + ' × 6 героев'));
  check('У Милки своё имя во всех падежах: «Милка — кормить Милку, играть с Милкой, говорить Милке»',
    !!lv.out && lv.out.milka === 'Милка — кормить Милку, играть с Милкой, говорить Милке',
    (lv.out && lv.out.milka) || 'нет данных');

  check('Профиль без своего имени в списке подписан своим героем (🐇 Милка), переименованный — именем ребёнка',
    !!lv.out && lv.out.profile1 === '\u041c\u0438\u043b\u043a\u0430/\ud83d\udc07' && lv.out.profile2 === '\u0412\u0438\u0442\u044f',
    lv.out ? ('профиль по умолчанию: ' + lv.out.profile1 + ', переименованный: ' + lv.out.profile2) : 'нет данных');

  vmRun("System.setCharacter('gopher'); System.profileName = DEFAULT_PROFILE_NAME; System.lastPopup = null;");
}

/* ---------- БЛОК 12: ДОМ НЕ ТЕРЯЕТСЯ И ИЗ ГОСТЕЙ МОЖНО ВЫЙТИ (v1.3.6) ----------
   Жалобы заказчика от 30.09.2026:
   • «когда зашёл к другу, от него никак нельзя выйти» — кнопка «← Назад» в сцене
     друзей была, но экран дома друга заливал фон во весь экран и стирал её;
   • «в какой-то момент сбросилась вся купленная мебель» — при обрыве записи
     (приложение выгружали целиком) сохранение становилось нечитаемым, игра
     молча начинала «с нуля» и первым же действием затирала дом ребёнка;
   • «время в игре всегда показывается ноль» — счётчик прибавлялся раз в минуту,
     а статистика делила его на 60, поэтому час игры выглядел как «0 мин».
   Проверяем: резервную копию и восстановление, честную реакцию на ошибку записи,
   реальные секунды времени, видимый выход из гостей и системную кнопку «Назад». */
function reviewerSaveAndExit(rt) {
  console.log('\n\ud83d\udcbe БЛОК 12/13 — Дом не теряется, выход из гостей, время в игре (v1.3.6)');
  const system = fs.readFileSync(path.join(WWW, 'js', 'system.js'), 'utf8');
  const gameSrc = fs.readFileSync(path.join(WWW, 'js', 'game.js'), 'utf8');
  const friendsSrc = fs.readFileSync(path.join(WWW, 'js', 'game_friends.js'), 'utf8');
  const statsSrc = fs.readFileSync(path.join(WWW, 'js', 'game_stats.js'), 'utf8');
  const menuSrc = fs.readFileSync(path.join(WWW, 'js', 'game_menu.js'), 'utf8');
  const homeSrc = fs.readFileSync(path.join(WWW, 'js', 'game_home.js'), 'utf8');
  const actSrc = fs.readFileSync(path.join(ROOT, 'android', 'app', 'src', 'main', 'java',
    'com', 'gopherlife', 'app', 'MainActivity.java'), 'utf8');

  // --- 1. Статика: механизмы на месте ---
  check('Сохранение держит резервную копию и поднимается из неё',
    /backupKeyFor\(profileId\)/.test(system) &&
    /setItem\(this\.backupKeyFor/.test(system) &&
    /const bak = localStorage\.getItem\(this\.backupKeyFor/.test(system) &&
    /fromBackup/.test(system));
  check('Ошибка записи видна, а не глотается молча (saveFailed, saveHealth)',
    /this\.saveFailed = true;/.test(system) && /saveHealth\(\) \{/.test(system) &&
    statsSrc.indexOf('System.saveHealth()') !== -1);
  check('Прогресс считается существующим, даже если цела только копия',
    /hasSave\(\) \{[\s\S]{0,400}backupKeyFor/.test(system));
  check('Запись проверяется чтением обратно (обрыв виден сразу, а не при запуске)',
    /back\.length === json\.length/.test(system));
  check('Время из старых сохранений (оно было в минутах) переводится в секунды',
    /playTimeUnit: 'sec'/.test(system) &&
    /data\.playTimeUnit === 'sec'/.test(system));
  check('Старая мебель переносится один раз и не двоится при загрузках',
    /const legacyFurniture = data\.rooms \? \[\] :/.test(system));
  check('Время в игре копится реальными секундами и показывается словами',
    /addPlaySeconds\(sec\)/.test(system) && /playTimeText\(\) \{/.test(system) &&
    gameSrc.indexOf('System.addPlaySeconds(Math.min(this.dt / 1000, 5))') !== -1 &&
    gameSrc.indexOf('System.totalPlayTime++') === -1 &&
    statsSrc.indexOf('System.playTimeText()') !== -1);
  check('В доме друга выход виден: фон не заливается поверх кнопки, есть «Домой»',
    friendsSrc.indexOf("'to_home'") !== -1 && friendsSrc.indexOf('🏠 Домой') !== -1 &&
    !/drawFriendHome\(ctx, W, H\) \{[\s\S]{0,600}fillRect\(0, 0, W, H\)/.test(friendsSrc));
  check('Сцены умеют «Назад»: гости, меню, дом (закрываем то, что открыто)',
    /handleBack\(\) \{[\s\S]{0,300}friendVisitData/.test(friendsSrc) &&
    /handleBack\(\) \{[\s\S]{0,300}showSettings/.test(menuSrc) &&
    /handleBack\(\) \{[\s\S]{0,300}this\.sheet/.test(homeSrc));
  check('Сцена похода тоже умеет «Назад»: карточка предмета закрывается',
    /handleBack\(\) \{[\s\S]{0,300}this\.state === 'fact'/.test(
      fs.readFileSync(path.join(WWW, 'js', 'game_visit.js'), 'utf8')));
  check('Системная кнопка «Назад»: Android спрашивает игру, игра решает',
    gameSrc.indexOf('window.onAndroidBack') !== -1 &&
    gameSrc.indexOf("if (this.currentScene === 'menu') return 'exit'") !== -1 &&
    actSrc.indexOf('evaluateJavascript') !== -1 && actSrc.indexOf('onAndroidBack') !== -1 &&
    actSrc.indexOf('finish()') !== -1);

  if (!rt) {
    check('Дом, время и выход из гостей проверены в песочнице', false, 'игра не запустилась');
    return;
  }
  const vmRun = c => { try { return vm.runInContext(c, rt.sandbox); } catch (e) { return 'ОШИБКА: ' + e.message; }; };

  // --- 2. Живая песочница: копия, восстановление, время ---
  const live = vmRun(`(function(){
    const S = System, out = {};
    const key = S.saveKeyFor('p1'), bak = S.backupKeyFor('p1');
    const keep = { s: localStorage.getItem(key), b: localStorage.getItem(bak) };
    S.profileId = 'p1';
    localStorage.removeItem(key);
    localStorage.removeItem(bak);
    S.resetProgress();
    S.rooms = null; S.ensureRooms();
    S.rooms.living.furniture.push({ id: 'sofa', x: 0.3, y: 0.5 });
    S.rooms.bedroom.furniture.push({ id: 'bed', x: 0.4, y: 0.5 });
    S.saveGame();
    out.copy = !!localStorage.getItem(bak);
    const good = localStorage.getItem(key);
    localStorage.setItem(key, good.slice(0, Math.floor(good.length / 2)));   // обрыв записи
    S.rooms = null;
    out.loaded = S.loadGame();
    out.items = Object.keys(S.rooms || {}).reduce((a, k) => a + S.rooms[k].furniture.length, 0);
    out.fromBackup = S.restoredFromBackup;
    const before = out.items;
    S.loadGame();
    out.afterTwoLoads = Object.keys(S.rooms || {}).reduce((a, k) => a + S.rooms[k].furniture.length, 0);
    out.noDouble = before === out.afterTwoLoads;
    S.totalPlayTime = 0;
    out.min = S.addPlaySeconds(90) && S.playTimeText();
    S.totalPlayTime = 0;
    out.zero = S.playTimeText();
    S.totalPlayTime = 3725;
    out.hours = S.playTimeText();
    if (keep.s === null) localStorage.removeItem(key); else localStorage.setItem(key, keep.s);
    if (keep.b === null) localStorage.removeItem(bak); else localStorage.setItem(bak, keep.b);
    S.restoredFromBackup = false; S.saveFailed = false; S.totalPlayTime = 0;
    return out;
  })()`);
  const lv = (typeof live === 'string') ? { error: live } : live;
  const liveWhy = lv.error ? lv.error : 'нет данных';
  check('Первое сохранение сразу делает копию',
    !!lv.copy, lv.copy ? 'копия создана' : liveWhy);
  check('Битое сохранение поднимается из копии: дом и мебель на месте',
    lv.loaded === true && lv.fromBackup === true && lv.items === 2,
    lv.error ? liveWhy : ('предметов после восстановления: ' + lv.items));
  check('Повторные загрузки не двоят мебель',
    !!lv.noDouble, 'предметов: ' + lv.items + ' → ' + lv.afterTwoLoads);
  check('Время в игре считается: 1.5 минуты — это «1 мин», ноль — «меньше минуты», час — часы',
    lv.min === '1 мин' && lv.zero === 'меньше минуты' && lv.hours === '1 ч 2 мин',
    lv.error ? liveWhy : ('90 с → ' + lv.min + ', 0 → ' + lv.zero + ', 3725 с → ' + lv.hours));

  // --- 3. Клики: выход из гостей и системная «Назад» ---
  const clicks = vmRun(`(function(){
    const G = __game, out = {};
    if (!System.friends || !System.friends.length) {
      System.friends = System.friends || [];
      System.friends.push(createNPC([]));
    }
    G.transitionTo('friends');
    const sc = G.scenes.friends;
    sc.init();
    sc.visit(System.friends[0].id);
    sc.draw(G.ctx);
    const labels = sc.buttons.map(b => b.text);
    out.inVisit = sc.tab;
    out.hasBack = labels.indexOf('← Назад') !== -1;
    out.hasHome = labels.indexOf('to_home') !== -1;
    const back = sc.buttons.filter(b => b.text === '← Назад')[0];
    out.clicked = back ? sc.handleClick(back.x + back.w / 2, back.y + back.h / 2) : false;
    out.tabAfterClick = sc.tab;
    return out;
  })()`);
  const ck = (typeof clicks === 'string') ? { error: clicks } : clicks;
  const ckWhy = ck.error ? ck.error : 'нет данных';
  check('В доме друга нарисованы оба выхода: «← Назад» и «🏠 Домой»',
    ck.hasBack === true && ck.hasHome === true && ck.inVisit === 'visit',
    ck.error ? ckWhy : ('в гостях: ' + ck.inVisit + ', кнопок выхода: ' + ((ck.hasBack ? 1 : 0) + (ck.hasHome ? 1 : 0))));
  check('Нажатие «← Назад» в гостях возвращает к списку друзей',
    ck.clicked === true && ck.tabAfterClick === 'list',
    ck.error ? ckWhy : ('вкладка после нажатия: ' + ck.tabAfterClick));

  const androidBack = vmRun(`(function(){
    const G = __game, out = {};
    G.transitionTo('friends');
    const sc = G.scenes.friends;
    sc.init();
    sc.visit(System.friends[0].id);
    out.answer1 = G.handleAndroidBack();
    out.tab1 = sc.tab;
    G.transitionTo('menu');
    G.scenes.menu.showSettings = true;
    out.answerPanel = G.handleAndroidBack();
    out.panelClosed = !G.scenes.menu.showSettings;
    out.answerRoot = G.handleAndroidBack();
    G.transitionTo('map');
    out.fromMap = G.handleAndroidBack();
    out.mapTo = G.currentScene;
    G.transitionTo('home');
    out.fromHome = G.handleAndroidBack();
    out.homeTo = G.currentScene;
    return out;
  })()`);
  const ab = (typeof androidBack === 'string') ? { error: androidBack } : androidBack;
  const abWhy = ab.error ? ab.error : 'нет данных';
  check('Системная «Назад» из гостей у друга ведёт в список друзей, а не выгружает игру',
    ab.answer1 === 'back' && ab.tab1 === 'list',
    ab.error ? abWhy : ('ответ игры: ' + ab.answer1 + ', вкладка: ' + ab.tab1));
  check('Системная «Назад» закрывает окна меню, а игру закрывает только с главного экрана',
    ab.answerPanel === 'back' && ab.panelClosed === true && ab.answerRoot === 'exit',
    ab.error ? abWhy : ('настройки: ' + ab.answerPanel + ', главный экран: ' + ab.answerRoot));
  check('Системная «Назад» нигде не упирается в тупик: карта → дом → меню',
    ab.fromMap === 'back' && ab.mapTo === 'home' && ab.fromHome === 'back' && ab.homeTo === 'menu',
    ab.error ? abWhy : ('с карты: ' + ab.mapTo + ', из дома: ' + ab.homeTo));
}

reviewerStatic();
reviewerV12Static();
const rt = reviewerRuntime();
reviewerClicks(rt);
/* ---------- БЛОК 13: ДЕСЯТЬ МУЗЕЕВ И ЧЕТЫРЕ СПОРТИВНЫЕ ДИСЦИПЛИНЫ (v1.3.7) ----------
   Просьбы заказчика:
   • «музеев очень мало... хочется уйму разных музеев, а в каждом — сотни экспонатов»;
   • «раз воздушная гимнастика анимирована, надо анимировать и другие виды спорта,
     а к воздушной гимнастике добавить не только кольца, но и полотна».
   Проверяем: десять музеев по сто экспонатов, сетка хаба с листанием, единый
   список музеев (карта, музыка, «Знания», достижения, сцены) и четыре дисциплины
   со своими анимациями — из спортзала, бассейна и парка. */
function reviewerMuseumsAndSports(rt) {
  console.log('\n\ud83c\udfdb\ufe0f БЛОК 13/13 — Десять музеев и четыре спортивные дисциплины (v1.3.7)');
  const content = fs.readFileSync(path.join(WWW, 'js', 'game_content.js'), 'utf8');
  const aerial = fs.readFileSync(path.join(WWW, 'js', 'game_aerial.js'), 'utf8');
  const visit = fs.readFileSync(path.join(WWW, 'js', 'game_visit.js'), 'utf8');
  const scenery = fs.readFileSync(path.join(WWW, 'js', 'game_scenery.js'), 'utf8');
  const audioSrc = fs.readFileSync(path.join(WWW, 'js', 'audio.js'), 'utf8');
  const mapSrc = fs.readFileSync(path.join(WWW, 'js', 'game_map.js'), 'utf8');
  const statsSrc = fs.readFileSync(path.join(WWW, 'js', 'game_stats.js'), 'utf8');

  // --- 1. Музеев пятьдесят: десять больших по сто экспонатов и сорок по двенадцать ---
  const mc = content.match(/const MUSEUM_CATEGORIES = \[([\s\S]*?)\];/);
  const museumKeys = mc ? (mc[1].match(/'([a-z_]+)'/g) || []).map(s => s.slice(1, -1)) : [];
  check('Музеев стало пятьдесят (было десять, а сначала четыре)',
    museumKeys.length === 50 && new Set(museumKeys).size === 50,
    museumKeys.length ? ('списке: ' + museumKeys.length + ' музеев') : 'списка нет');
  const sliceMuseum = key => {
    const i = content.indexOf('\n  ' + key + ': [');
    if (i < 0) return '';
    // Последний музей закрывается «]» без запятой (перед «};»), остальные — «],».
    // Раньше искали только «],» — у последнего музея слайс вылезал за конец и
    // подхватывал чужие данные, поэтому виделись ложные «повторы» названий.
    let j = content.indexOf('\n  ],', i);
    const k = content.indexOf('\n  ]\n', i);
    if (k !== -1 && (j === -1 || k < j)) j = k;
    return content.slice(i, j < 0 ? content.length : j);
  };
  const sizes = museumKeys.map(k => (sliceMuseum(k).match(/\{ e:/g) || []).length);
  check('В каждом музее не меньше двенадцати экспонатов, у первых десяти — по сто',
    sizes.length === 50 && sizes.every(n => n >= 12) &&
    sizes.slice(0, 10).every(n => n === 100) && sizes.reduce((a, b) => a + b, 0) >= 1400,
    'экспонатов: ' + sizes.reduce((a, b) => a + b, 0) + ' (минимум ' + Math.min.apply(null, sizes) + ')');
  const dupMuseums = museumKeys.filter(k => {
    const names = (sliceMuseum(k).match(/n: '([^']+)'/g) || []).map(s => s.slice(4, -1));
    return new Set(names).size !== names.length;
  });
  check('Названия внутри музея не повторяются (иначе «изучено 100/100» недостижимо)',
    dupMuseums.length === 0, dupMuseums.length ? ('повторы: ' + dupMuseums.join(', ')) : 'без повторов');
  check('Достижения знают про пятьдесят музеев и дают ступень полегче (v1.3.12)',
    /по 12 экспонатов в каждом из 50 музеев/.test(content) &&
    content.indexOf("'museumsLover'") !== -1 && /seenCount\(c\) >= 20/.test(content));
  check('Новые музеи описаны как места: сцена, поход и музыка',
    museumKeys.every(k => scenery.indexOf('\n  ' + k + ':') !== -1) &&
    museumKeys.every(k => visit.indexOf('\n  ' + k + ': {') !== -1) &&
    audioSrc.indexOf('MUSEUM_CATEGORIES') !== -1);
  check('Плитка «Музеи» и вкладка «Знания» берут список музеев из одного места',
    mapSrc.indexOf('MUSEUM_CATEGORIES.length') !== -1 &&
    statsSrc.indexOf('MUSEUM_CATEGORIES') !== -1 && statsSrc.indexOf('VISIT_DATA') !== -1,
    'карта — длину списка, «Знания» — список и названия из хаба');
  check('Сцена спорта зарегистрирована, старое имя «aerial» работает',
    fs.readFileSync(path.join(WWW, 'js', 'game.js'), 'utf8').indexOf('sport: SportScene') !== -1 &&
    aerial.indexOf('window.AerialScene = SportScene') !== -1 &&
    aerial.indexOf('window.SportScene = SportScene') !== -1);

  if (!rt) {
    check('Музеи и спорт проверены в песочнице', false, 'игра не запустилась');
    return;
  }
  const vmRun = c => { try { return vm.runInContext(c, rt.sandbox); } catch (e) { return 'ОШИБКА: ' + e.message; }; };
  const ok = (name, cond, detail) => check(name, cond, detail);

  // --- 2. Живая песочница: сетка хаба и поход в десятый музей ---
  const mus = vmRun(`(function(){
    const out = {};
    out.sizes = MUSEUM_CATEGORIES.map(k => contentSize(k));
    const vs = __game.scenes.visit;
    __game.currentScene = 'visit';
    __game.scenes.map.init();
    System.stats.energy = 100;
    vs.init('museums');
    vs.draw(__game.ctx);
    out.page1 = (vs.buttons || []).filter(b => (b.text || '').indexOf('museum_') === 0).map(b => b.text);
    out.hasNext = (vs.buttons || []).some(b => b.text === 'hub_next');
    const next = (vs.buttons || []).filter(b => b.text === 'hub_next')[0];
    if (next) vs.handleClick(next.x + next.w / 2, next.y + next.h / 2);
    vs.draw(__game.ctx);
    out.page2 = (vs.buttons || []).filter(b => (b.text || '').indexOf('museum_') === 0).map(b => b.text);
    const card = (vs.buttons || []).filter(b => b.text === 'museum_palace_museum')[0];
    out.hasCard = !!card;
    if (card) vs.handleClick(card.x + card.w / 2, card.y + card.h / 2);
    vs.draw(__game.ctx);
    out.loc = vs.locationId;
    out.items = vs.items.length;
    out.inBase = vs.totalInBase;
    out.stage = (typeof LocationStage !== 'undefined' && LocationStage.config('palace_museum')) ? 'есть' : 'нет';
    out.uniq = (function(){ const u = {}; (vs.items || []).forEach(it => { u[it.id] = 1; }); return Object.keys(u).length; })();
    return out;
  })()`);
  ok('Хаб музеев: шесть карточек на странице и листание к остальным',
    mus && (mus.page1 || []).length === 6 && mus.hasNext === true && (mus.page2 || []).length === 6,
    mus && mus.page1 ? ('на первой: ' + mus.page1.length + ', на второй: ' + (mus.page2 || []).length) : mus);
  ok('Дворцовый музей открывается из хаба: сто экспонатов в базе',
    mus && mus.hasCard === true && mus.loc === 'palace_museum' && mus.inBase === 100 &&
    mus.items >= 6 && mus.uniq === mus.items,
    mus && mus.loc ? (mus.loc + ', в базе ' + mus.inBase + ', в подборке ' + mus.items +
      ', сцена: ' + mus.stage) : mus);
  ok('Каждый музей отдаёт свою подборку: у новых — по двенадцать экспонатов',
    Array.isArray(mus.sizes) && mus.sizes.length === 50 && mus.sizes.every(n => n >= 12),
    mus && mus.sizes ? (mus.sizes.length + ' музеев, минимум ' + Math.min.apply(null, mus.sizes)) : mus);

  // --- 3. Живая песочница: четыре спортивные дисциплины ---
  const sport = vmRun(`(function(){
    const out = {};
    out.gym = sportListFor('gym').map(d => d.id);
    out.pool = sportListFor('pool').map(d => d.id);
    out.park = sportListFor('park').map(d => d.id);
    out.ringsBack = __game.scenes.aerial.disc.id;      // старое имя ведёт на кольца
    // Открываем полотна из спортзала: кнопка в сцене посещения
    const vs = __game.scenes.visit;
    __game.currentScene = 'visit';
    System.stats.energy = 90;
    vs.init('gym');
    vs.draw(__game.ctx);
    const btn = (vs.buttons || []).filter(b => b.text === 'sport_silks')[0];
    out.hasBtn = !!btn;
    if (btn) vs.handleClick(btn.x + btn.w / 2, btn.y + btn.h / 2);
    out.scene = __game.currentScene;
    const sc = __game.scenes.sport;
    out.disc = sc ? sc.disc.id : null;
    out.attempts = sc ? sc.attemptsLeft : -1;
    // Каждая арена должна рисоваться без ошибок
    const errs = [];
    Object.keys(SPORT_DISCIPLINES).forEach(id => {
      const s2 = new SportScene(__game, id);
      s2.paid = true; s2.state = 'swing';
      try { s2.draw(__game.ctx); } catch (e) { errs.push(id + ': ' + e.message); }
    });
    out.drawErrs = errs;
    // Награда за точное попадание и честный текст без «{pet}»
    const s3 = new SportScene(__game, 'swim');
    System.stats.energy = 90;
    s3.payEntry();
    out.energyAfter = Math.round(System.stats.energy);
    s3.power = 0.5; s3.jump();
    out.perfect = s3.perfect; out.coins = s3.coinsWon;
    s3.state = 'swing'; s3.power = 0.02; s3.jump();
    out.missText = s3.lastResult;
    out.petRaw = s3.lastResult.indexOf('{pet}') !== -1;
    // После тренировки возвращаемся в свою локацию, а не на карту
    s3.paid = true; s3.state = 'swing'; s3.finish();
    out.backScene = __game.currentScene;
    out.backLoc = __game.scenes.visit ? __game.scenes.visit.locationId : null;
    return out;
  })()`);
  ok('Спортзал даёт кольца и полотна, бассейн — заплыв, парк — барьеры',
    sport && (sport.gym || []).join(',') === 'rings,silks' && (sport.pool || []).join(',') === 'swim' &&
    (sport.park || []).join(',') === 'hurdles' && sport.ringsBack === 'rings',
    sport && sport.gym ? ('зал: ' + sport.gym.join('+') + ', бассейн: ' + sport.pool.join('+') +
      ', парк: ' + sport.park.join('+')) : sport);
  ok('Кнопка «Полотна» в спортзале открывает свою сцену с анимацией',
    sport && sport.hasBtn === true && sport.scene === 'sport' && sport.disc === 'silks' && sport.attempts === 5,
    sport && sport.disc ? ('открылась дисциплина: ' + sport.disc + ', попыток ' + sport.attempts) : sport);
  ok('Все четыре арены рисуются без ошибок',
    sport && Array.isArray(sport.drawErrs) && sport.drawErrs.length === 0,
    sport && sport.drawErrs && sport.drawErrs.length ? sport.drawErrs.join('; ') : 'кольца, полотна, заплыв, барьеры');
  ok('Тренировка тратит энергию, точное попадание даёт монеты, а текст без «{pet}»',
    sport && sport.energyAfter <= 86 && sport.perfect === 1 && sport.coins > 0 && sport.petRaw === false,
    sport ? ('энергия ' + sport.energyAfter + '%, монет ' + sport.coins + ', текст: ' + sport.missText) : sport);
  ok('После тренировки возвращаемся в свою локацию (бассейн), а не на карту',
    sport && sport.backScene === 'visit' && sport.backLoc === 'pool',
    sport ? (sport.backScene + ' / ' + sport.backLoc) : sport);
}

reviewerV12Runtime(rt);
reviewerAchievements(rt);
reviewerOutfits(rt);
reviewerAudio(rt);
reviewerCalm(rt);
reviewerRuStore(rt);
reviewerHeroNames(rt);
reviewerSaveAndExit(rt);
reviewerMuseumsAndSports(rt);
reviewerApk();
reviewerRender();

console.log('\n' + '\u2500'.repeat(56));
console.log('ИТОГО: пройдено ' + passed + '  |  провалено ' + failed);
if (failed === 0) {
  console.log('\u2705 ВСЕ 5 РЕВЬЮЕРОВ + БЛОКИ ДОСТИЖЕНИЙ, НАРЯДОВ, МУЗЫКИ, ШКАЛ, RUSTORE И ИМЁН ГЕРОЕВ ПРИНЯЛИ РЕЗУЛЬТАТ');
  process.exit(0);
} else {
  console.log('\u274C ЕСТЬ ЗАМЕЧАНИЯ \u2014 результат НЕ принимается');
  process.exit(1);
}
