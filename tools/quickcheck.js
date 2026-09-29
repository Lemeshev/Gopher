#!/usr/bin/env node
/* Быстрая проверка логики без браузера (для разработки).
   Грузит JS игры в vm-песочницу с заглушкой canvas и проверяет механику:
   комнаты, энергию, офлайн-сон, короткие коды друзей, перекраску, персонажей.
   Запуск: node tools/quickcheck.js                                        */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'www', 'js');
// Полный порядок загрузки — как в index.html (сцены проверяются на кадрах)
const FILES = [
  'helpers.js', 'gopher.js', 'characters.js', 'system.js', 'game_content.js',
  'game_room.js', 'game_scenery.js', 'audio.js',
  'game_menu.js', 'game_map.js', 'game_home.js', 'game_shop.js',
  'game_minigames.js', 'game_quiet.js', 'game_aerial.js', 'game_stats.js',
  'game_clinic.js', 'game_visit.js', 'game_friends.js', 'game.js'
];

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✅ ' + name + (detail ? '  [' + detail + ']' : '')); }
  else { fail++; console.log('  ❌ ' + name + (detail ? '  [' + detail + ']' : '')); }
}

function makeSandbox() {
  const gradient = { addColorStop() {} };
  const ctxStub = new Proxy({
    canvas: { width: 360, height: 640 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    getImageData: () => ({ data: [] })
  }, {
    get(t, p) { return p in t ? t[p] : function () {}; },
    set(t, p, v) { t[p] = v; return true; }
  });
  const canvas = {
    width: 360, height: 640, style: {},
    getContext: () => ctxStub,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 360, height: 640 }),
    addEventListener() {}, removeEventListener() {}, focus() {}
  };
  const store = new Map();
  const doc = {
    getElementById: id => (id === 'gameCanvas' ? canvas : null),
    createElement: () => ({
      id: '', style: {}, innerHTML: '', textContent: '', value: '', readOnly: false,
      classList: { add() {}, remove() {}, contains: () => false },
      querySelector: () => null, appendChild() {}, setAttribute() {},
      focus() {}, setSelectionRange() {}, select() {}
    }),
    addEventListener() {}, removeEventListener() {},
    body: { appendChild() {} }, documentElement: {},
    execCommand: () => true
  };
  const sandbox = {
    console,
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0; },
    clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    Date: Date,
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: k => { store.delete(k); }
    },
    document: doc,
    innerWidth: 360, innerHeight: 640,
    addEventListener() {}, removeEventListener() {},
    navigator: { userAgent: 'quickcheck' },
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    escape: global.escape, unescape: global.unescape
  };
  sandbox.window = sandbox;
  sandbox.__ctx = ctxStub;
  vm.createContext(sandbox);
  return sandbox;
}

const sandbox = makeSandbox();
for (const f of FILES) {
  vm.runInContext(fs.readFileSync(path.join(WWW, f), 'utf8'), sandbox, { filename: f });
}
const S = sandbox.System;

console.log('\n🔎 БЫСТРАЯ ПРОВЕРКА ЛОГИКИ\n');

/* ---------- Контент ---------- */
ok('Каталог мебели: не меньше 45 предметов', sandbox.FURNITURE.length >= 45, 'их ' + sandbox.FURNITURE.length);
ok('Комнат в доме 4', sandbox.HOME_ROOMS.length === 4, sandbox.HOME_ROOMS.map(r => r.name).join(', '));
const roomsWithItems = sandbox.HOME_ROOMS.filter(r => sandbox.furnitureForRoom(r.id).length >= 6);
ok('В каждой комнате есть что поставить (>= 6 предметов)', roomsWithItems.length === 4,
  sandbox.HOME_ROOMS.map(r => r.name + ':' + sandbox.furnitureForRoom(r.id).length).join(' '));
const luxury = sandbox.FURNITURE.filter(f => f.cost >= 900);
ok('Есть очень дорогая мебель (>= 900 монет)', luxury.length >= 5, luxury.map(f => f.name + ' ' + f.cost).join(', '));
ok('У каждого предмета есть палитра для перекраски', sandbox.FURNITURE.every(f => f.palette && f.palette.length >= 4));
ok('Обои и пол можно купить (есть цена)', sandbox.WALLS.some(w => w.cost > 0) && sandbox.FLOORS.some(f => f.cost > 0));
ok('Процедур в поликлинике 8', sandbox.CLINIC_PROCEDURES.length === 8);
ok('Тихих игр 3', sandbox.QUIET_GAMES.length === 3);
ok('Персонажей 5 (гофер + 4 игрушки)', sandbox.CHARACTERS.length === 5, sandbox.CHARACTERS.map(c => c.name).join(', '));

/* ---------- Комнаты ---------- */
S.resetProgress();
S.rooms = null;
S.ensureRooms();
ok('Дом создаётся сразу с 4 комнатами', Object.keys(S.rooms).length === 4);
S.buyFurniture('sofa');
S.buyFurniture('bed');
S.buyFurniture('fridge');
S.buyFurniture('bath');
ok('Диван встал в гостиную', S.roomOfItem('sofa') === 'living', String(S.roomOfItem('sofa')));
ok('Кровать встала в спальню', S.roomOfItem('bed') === 'bedroom', String(S.roomOfItem('bed')));
ok('Холодильник встал на кухню', S.roomOfItem('fridge') === 'kitchen', String(S.roomOfItem('fridge')));
ok('Ванна встала в ванную', S.roomOfItem('bath') === 'bathroom', String(S.roomOfItem('bath')));
ok('В гостиной только своя мебель', S.rooms.living.furniture.length === 1, 'предметов ' + S.rooms.living.furniture.length);
S.setActiveRoom('bedroom');
ok('Переключение комнаты работает', S.activeRoom === 'bedroom');
ok('Активная комната отдаёт свою мебель', S.furniture.length === 1 && S.furniture[0].id === 'bed');

/* ---------- Перекраска и отделка ---------- */
S.coins = 2000;
const beforePaint = S.coins;
const painted = S.paintFurniture('bed', 2);
ok('Перекраска мебели стоит денег', painted.ok && S.coins < beforePaint, '−' + (beforePaint - S.coins) + ' монет');
ok('Цвет предмета изменился', S.colorOf('bed') === sandbox.findFurniture('bed').palette[2], String(S.colorOf('bed')));
const wallRes = S.setWall('marble');
ok('Дорогие обои покупаются за деньги', wallRes === true && S.coins <= beforePaint - 1500, 'монет стало ' + S.coins);
ok('Обои применены к комнате', S.rooms.bedroom.wall === 'marble', S.rooms.bedroom.wall);
S.coins = 0;
ok('Без денег новые обои не купить', S.setWall('space') === false && S.rooms.bedroom.wall === 'marble');
ok('Купленные обои применяются бесплатно', (S.coins = 0, S.setWall('warm') === true));

/* ---------- Энергия ---------- */
S.resetProgress();
S.stats.energy = 100;
const visits = ['museum_any', 'library', 'pool', 'gym', 'park', 'cinema', 'restaurant'];
let spent = 0;
for (const v of visits) { const c = S.visitCost(v); spent += c; S.spendEnergy(c); S.advanceTime(0.5); }
ok('7 походов тратят меньше 40 энергии', spent < 40, 'потрачено ' + spent + ' → осталось ' + Math.round(S.stats.energy));
ok('После 7 походов ещё можно играть (энергия > 50)', S.stats.energy > 50, Math.round(S.stats.energy) + '%');
S.stats.energy = 100;
S.advanceTime(1);
ok('Час безделья стоит всего 1.5 энергии', Math.abs(S.stats.energy - 98.5) < 0.01, S.stats.energy + '%');

/* ---------- Сон и офлайн ---------- */
S.stats.energy = 20;
S.startSleep();
S.tick(60000);
ok('За минуту сна +10% энергии', Math.abs(S.stats.energy - 30) < 0.01, S.stats.energy + '%');
S.stats.energy = 20;
S.isSleeping = true;
const report = S.applyOfflineProgress(Date.now() - 10 * 60000);
ok('С закрытым приложением энергия копится до 100%', S.stats.energy >= 99.5, Math.round(S.stats.energy) + '%');
ok('После полного сна гофер просыпается сам', report.wokeUp === true && S.isSleeping === false);
ok('Есть понятный текст «пока тебя не было»', S.offlineMessage().length > 10, S.offlineMessage());
S.isSleeping = false;
S.stats.energy = 100; S.stats.hunger = 100; S.stats.cleanliness = 100; S.stats.stress = 0;
S.applyOfflineProgress(Date.now() - 48 * 3600000);
ok('Долгое отсутствие не убивает питомца (есть «пол»)',
  S.stats.energy >= 25 && S.stats.hunger >= 25 && S.stats.stress <= 25,
  'энергия ' + Math.round(S.stats.energy) + ', сытость ' + Math.round(S.stats.hunger) + ', стресс ' + Math.round(S.stats.stress));

/* ---------- Стресс ---------- */
S.stats.stress = 80;
S.relax(15);
ok('Стресс снимается (сон/музыка/игры)', S.stats.stress === 65, 'стало ' + S.stats.stress);
ok('Подсказка про стресс есть', S.stressHint().length > 0, S.stressHint());
ok('Справка объясняет, как снизить стресс', sandbox.STAT_HELP.some(h => h.key === 'stress' && h.down.length >= 5));

/* ---------- Коды друзей ---------- */
S.resetProgress();
S.rooms = null;
S.ensureRooms();
S.coins = 5000;
['sofa', 'carpet', 'tv', 'painting', 'plant', 'clock', 'bed', 'wardrobe'].forEach(id => S.buyFurniture(id));
S.look.char = 'bunny';
S.look.fur = 'rose';
S.look.hat = 'crown';
S.look.bowtie = true;
S.setActiveRoom('living');
const short = S.getShortCode();
ok('Короткий код — 16 символов в четырёх группах',
  /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(short), short);
const parsed = S.unpackShortCode(short.replace(/-/g, ''));
ok('Короткий код разбирается обратно', !!parsed);
ok('Персонаж из кода совпадает', parsed.look.char === 'bunny', parsed.look.char);
ok('Окрас из кода совпадает', parsed.look.fur === 'rose', parsed.look.fur);
ok('Обои и пол из кода совпадают',
  parsed.room.wall === S.rooms.living.wall && parsed.room.floor === S.rooms.living.floor,
  parsed.room.wall + '/' + parsed.room.floor);
ok('Предметы из кода доехали (6 штук)', parsed.furniture.length === 6, parsed.furniture.map(f => f.id).join(', '));
ok('Испорченный код не принимается', S.unpackShortCode('AAAAAAAAAAAAAAAA') === null);
S.friends = [];
const added = S.addFriendCode(short, 'Нюша');
ok('Друг добавляется по короткому коду', added.ok === true, JSON.stringify(added));
ok('У друга есть комната с мебелью', S.friends[0].furniture.length === 6 && !!S.friends[0].room.wall);
ok('У друга сохранён персонаж', S.friends[0].char === 'bunny', S.friends[0].char);
ok('Второй раз тот же друг не добавляется', S.addFriendCode(short, 'Нюша').ok === false);
const long = S.getMyCode(null);
S.friends = [];
const addedLong = S.addFriendCode(long, 'Длинный');
ok('Друг добавляется по полному коду', addedLong.ok === true);
ok('Полный код приносит все комнаты', !!S.friends[0].rooms && Object.keys(S.friends[0].rooms).length === 4);
ok('Друг по короткому коду принимается повторно (другое имя)', S.addFriendCode(short, 'Второй друг').ok === true);

/* ---------- Персонажи ---------- */
S.look.char = 'bunny';
const g = S.makeCharacter(100);
ok('Фигурка создаётся по выбранному персонажу', g && g.charId === 'bunny', g ? g.charId : 'нет');
ok('У игрушки своя палитра (не голубая)', g.COLORS.body !== '#7FDBE8', g.COLORS.body);
const robot = sandbox.createCharacter('robot', 100);
ok('Робот тоже создаётся', robot && robot.charId === 'robot');
let drawOk = true;
try {
  const ctx = sandbox.__ctx;
  ['gopher', 'bear', 'bunny', 'cat', 'robot'].forEach(id => {
    const c = sandbox.createCharacter(id, 120);
    ['happy', 'sleeping', 'excited', 'sad', 'sick', 'eating', 'neutral'].forEach(e => {
      c.setExpression(e, 5);
      c.outfit = 'trunks';
      c.heldEmoji = '🍕';
      c.draw(ctx, 100, 100, 1);
    });
  });
} catch (e) { drawOk = false; console.log('   ошибка отрисовки: ' + e.message); }
ok('Все 5 персонажей рисуются во всех выражениях без ошибок', drawOk);

/* ---------- Перспектива (соразмерность) ---------- */
const rect = { x: 0, y: 0, w: 400, h: 300 };
const farSize = sandbox.RoomView.sizeFor('bed', rect, 0.0);
const nearSize = sandbox.RoomView.sizeFor('bed', rect, 1.0);
ok('Мебель на переднем плане крупнее, чем в глубине', nearSize > farSize * 1.5,
  Math.round(farSize) + 'px сзади → ' + Math.round(nearSize) + 'px впереди');
const cotDeep = sandbox.RoomView.sizeFor('cot', rect, 0.0);
ok('Раскладушка в глубине комнаты выглядит далёкой', cotDeep < nearSize * 0.35,
  Math.round(cotDeep) + 'px против ' + Math.round(nearSize) + 'px впереди');
ok('Двуспальная кровать больше раскладушки на той же глубине',
  sandbox.RoomView.sizeFor('bedBig', rect, 0.9) > sandbox.RoomView.sizeFor('cot', rect, 0.9) * 1.5);
ok('Шкаф крупнее часов (соразмерность предметов)',
  sandbox.RoomView.sizeFor('wardrobe', rect, 1.0) > sandbox.RoomView.sizeFor('clock', rect, 1.0) * 2);
ok('Кровать впереди достаточно большая для гофера',
  sandbox.RoomView.sizeFor('bedBig', rect, 0.9) > rect.w * 0.25,
  Math.round(sandbox.RoomView.sizeFor('bedBig', rect, 0.9)) + 'px при комнате ' + rect.w + 'px');

/* ---------- Отрисовка комнат ---------- */
let baseOk = true;
try {
  const ctx = sandbox.__ctx;
  sandbox.HOME_ROOMS.forEach(r => {
    const room = { wall: r.free.wall, floor: r.free.floor };
    sandbox.RoomView.drawBase(ctx, rect, room);
    sandbox.RoomView.drawAll(ctx, rect, room, sandbox.FURNITURE.slice(0, 8).map((f, i) => ({ id: f.id, x: 0.2 + (i % 4) * 0.2, y: 0.2 + Math.floor(i / 4) * 0.4 })), {});
  });
} catch (e) { baseOk = false; console.log('   ошибка: ' + e.message); }
ok('Комнаты и мебель рисуются без ошибок', baseOk);

/* ---------- ЗАПУСК ИГРЫ И КАДРЫ ВСЕХ СЦЕН ---------- */
let boot = null, bootErr = null;
try {
  boot = vm.runInContext('(function(){ var g = new Game(); g.init(); return g; })()', sandbox);
} catch (e) { bootErr = e; }
ok('Игра запускается без исключений', !bootErr, bootErr ? bootErr.message : 'OK');

if (boot) {
  ok('Сцены созданы (дом, магазин, тихие игры, гимнастика и др.)',
    ['menu', 'map', 'home', 'shop', 'minigames', 'quiet', 'aerial', 'stats', 'clinic', 'visit', 'friends']
      .every(n => boot.scenes[n]), Object.keys(boot.scenes).join(', '));

  const scenes = Object.keys(boot.scenes);
  let frameErr = null;
  try {
    sandbox.__game = boot;
    vm.runInContext(`(function(){
      for (const n of Object.keys(__game.scenes)) {
        __game.currentScene = n;
        __game.scenes[n].init();
        for (let i = 0; i < 60; i++) {
          __game.scenes[n].update(16);
          __game.ctx.clearRect(0, 0, __game.width, __game.height);
          __game.scenes[n].draw(__game.ctx);
        }
      }
    })();`, sandbox);
  } catch (e) { frameErr = e; }
  ok('Все ' + scenes.length + ' сцен рисуются 60 кадров без ошибок', !frameErr,
    frameErr ? frameErr.message : scenes.join(', '));

  if (process.env.DBG) {
    const sc = boot.scenes.home;
    sc.init();
    for (let i = 0; i < 5; i++) {
      sc.draw(sandbox.__ctx);
      console.log('   draw ' + i + ': buttons=' + sc.buttons.length + ' tabs=' + sc.roomTabs.length);
    }
  }

  // Кнопок не должно становиться больше от кадра к кадру
  let maxBtns = 0, worst = '';
  Object.keys(boot.scenes).forEach(n => {
    const sc = boot.scenes[n];
    sc.init();
    for (let i = 0; i < 120; i++) sc.draw(sandbox.__ctx);
    const c = (sc.buttons || []).length + (sc.locationButtons || []).length + (sc.roomTabs || []).length;
    if (c > maxBtns) { maxBtns = c; worst = n; }
  });
  ok('Число кнопок не растёт от кадра к кадру', maxBtns > 0 && maxBtns <= 40,
    'макс ' + maxBtns + ' в сцене ' + worst);
}

console.log('\n' + '─'.repeat(50));
console.log('ИТОГО: пройдено ' + pass + ' | провалено ' + fail);
process.exit(fail ? 1 : 0);
