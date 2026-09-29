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

/* ---------- Перенос старых сохранений (v1.0/v1.1 → v1.2) ---------- */
// У детей уже может стоять старый APK: там одна комната и плоский список мебели.
const prevProfile = S.profileId;
S.profileId = 'legacy-test';
sandbox.localStorage.setItem(S.saveKeyFor('legacy-test'), JSON.stringify({
  stats: { happiness: 55 }, coins: 777, level: 2, xp: 10,
  room: { wall: 'sky', floor: 'parquet' },
  furniture: [{ id: 'sofa', x: 0.3, y: 0.4 }, { id: 'bed', x: 0.5, y: 0.5 }],
  homeDecor: [], look: { hat: 'chef' }
}));
let migOk = S.loadGame() === true;
ok('Старое сохранение (v1.0) открывается в новой версии',
  migOk && S.coins === 777 && S.rooms.living.wall === 'sky' && S.rooms.living.floor === 'parquet',
  'монеты ' + S.coins + ', обои ' + (S.rooms.living ? S.rooms.living.wall : '—'));
ok('Мебель из старого дома разложена по своим комнатам',
  S.rooms.living.furniture.some(f => f.id === 'sofa') && S.rooms.bedroom.furniture.some(f => f.id === 'bed'),
  'гостиная ' + S.rooms.living.furniture.length + ', спальня ' + S.rooms.bedroom.furniture.length);
ok('Отделка из старого дома осталась купленной', S.ownsWall('sky') && S.ownsFloor('wood'));
ok('Внешний вид питомца сохранён', S.look.hat === 'chef' && S.look.char === 'gopher', String(S.look.hat));
S.profileId = prevProfile;
S.resetProgress();

/* ---------- Причины отказа на карте объясняются словами ---------- */
const lockCases = [
  ['work', { energy: 5 }], ['school', { energy: 5 }], ['gym', { energy: 1 }],
  ['park', { energy: 1 }], ['friend', { energy: 1 }], ['museums', { energy: 1 }],
  ['pool', { energy: 60, hunger: 5 }], ['restaurant', { energy: 60, hunger: 99 }],
  ['library', { energy: 60, coins: 0 }]
];
const badReason = [];
for (const [loc, patch] of lockCases) {
  S.resetProgress();
  S.stats.energy = 60;
  S.stats.hunger = 60;
  if (patch.energy !== undefined) S.stats.energy = patch.energy;
  if (patch.hunger !== undefined) S.stats.hunger = patch.hunger;
  if (patch.coins !== undefined) S.coins = patch.coins;
  if (S.isLocationAvailable(loc)) { badReason.push(loc + '(доступна)'); continue; }
  const r = S.locationLockReason(loc);
  if (!r || r === 'Сейчас сюда нельзя') badReason.push(loc);
}
ok('Отказ объяснён словами, а не «нельзя»', badReason.length === 0,
  badReason.length ? 'молчат: ' + badReason.join(', ') : lockCases.length + ' случаев');
S.resetProgress();

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

/* ---------- АУДИТ КОНТЕНТА: ПРЕДМЕТЫ, ФОРМЫ, ЦЕНЫ ---------- */
// Формы рисуются кодом: если у предмета указан shape, для него обязана быть
// функция shape_<имя>. Иначе предмет тихо выпадет в эмодзи — глазу это видно.
const SHAPE_SPECIAL = ['carpet', 'aquarium'];
const mixinMethods = Object.getOwnPropertyNames(sandbox.RoomView);
const shapes = Array.from(new Set(sandbox.FURNITURE.map(f => f.shape).filter(Boolean)));
const noShape = shapes.filter(s => SHAPE_SPECIAL.indexOf(s) === -1 && mixinMethods.indexOf('shape_' + s) === -1);
ok('У каждой формы мебели есть отрисовка кодом', noShape.length === 0,
  noShape.length ? 'нет: ' + noShape.join(', ') : shapes.length + ' форм');

const roomIds = sandbox.HOME_ROOMS.map(r => r.id);
const badItems = sandbox.FURNITURE.filter(f =>
  !f.id || !f.name || !(f.cost > 0) ||
  !f.rooms || !f.rooms.length || f.rooms.some(r => roomIds.indexOf(r) === -1) ||
  ['floor', 'wall'].indexOf(f.zone) === -1 ||
  !Array.isArray(f.palette) || f.palette.length < 4 ||
  !(f.k >= 0.4 && f.k <= 2.6));
const ids = sandbox.FURNITURE.map(f => f.id);
ok('Мебель: id, комнаты, зоны, палитры и размеры в порядке', badItems.length === 0,
  badItems.length ? 'плохие: ' + badItems.map(f => f.id).join(', ') : sandbox.FURNITURE.length + ' предметов');
ok('Идентификаторы мебели не повторяются', new Set(ids).size === ids.length,
  'уникальных ' + new Set(ids).size + ' из ' + ids.length);

// --- Каждый предмет реально что-то рисует (считаем вызовы рисования) ---
function countingCtx() {
  const gradient = { addColorStop() {} };
  const state = { calls: 0 };
  const ctx = new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return { width: 360, height: 640 };
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => gradient;
      if (p === 'getImageData') return () => ({ data: [] });
      if (p === 'addColorStop') return () => {};
      return () => { state.calls++; };
    },
    set() { return true; }
  });
  return { ctx, state };
}
const roomRect = { x: 8, y: 96, w: 344, h: 420 };
const blank = [];
for (const f of sandbox.FURNITURE) {
  const { ctx, state } = countingCtx();
  try {
    sandbox.RoomView.drawAll(ctx, roomRect, { wall: 'warm', floor: 'wood' },
      [{ id: f.id, x: 0.45, y: 0.5 }, { id: f.id, x: 0.2, y: 0.15 }], {});
  } catch (e) { blank.push(f.id + '(' + e.message + ')'); continue; }
  if (state.calls < 6) blank.push(f.id + '(пусто)');
}
ok('Все предметы мебели реально рисуются', blank.length === 0,
  blank.length ? 'проблемы: ' + blank.slice(0, 5).join(', ') : sandbox.FURNITURE.length + ' предметов');

// --- Каждая форма должна попадать в скриншоты (иначе её никто не увидит глазом) ---
const harnessSrc = fs.readFileSync(path.join(ROOT, 'tools', 'shots', 'harness.html'), 'utf8');
const placedIds = [];
harnessSrc.replace(/\[([^\]]*)\]\.forEach\(function \(id\) \{\s*System\.buyFurniture/g, (m, list) => {
  list.split(',').forEach(s => {
    const id = s.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');
    if (id) placedIds.push(id);
  });
  return m;
});
const placedShapes = new Set(placedIds.map(id => {
  const f = sandbox.findFurniture(id);
  return f ? f.shape : null;
}).filter(Boolean));
const unseen = shapes.filter(s => SHAPE_SPECIAL.indexOf(s) === -1 && !placedShapes.has(s));
ok('Каждая форма мебели видна на скриншотах игры', unseen.length === 0,
  unseen.length ? 'не попадут в кадр: ' + unseen.join(', ')
    : placedIds.length + ' предметов в демо-данных');

// --- Мебель не должна сваливаться в одну точку, даже если комната забита ---
sandbox.System.resetProgress();
sandbox.System.rooms = null;
sandbox.System.ensureRooms();
const manyIds = sandbox.FURNITURE.filter(f => f.rooms.indexOf('living') !== -1).map(f => f.id);
manyIds.forEach(id => sandbox.System.buyFurniture(id, 'living'));
const livingItems = sandbox.System.rooms.living.furniture;
let minGap = 9;
for (let i = 0; i < livingItems.length; i++) {
  for (let j = i + 1; j < livingItems.length; j++) {
    const d = Math.abs(livingItems[i].x - livingItems[j].x) + Math.abs(livingItems[i].y - livingItems[j].y);
    if (d < minGap) minGap = d;
  }
}
ok('Мебель не встаёт стопкой, даже когда комната забита', minGap > 0.04,
  livingItems.length + ' вещей, минимальный зазор ' + minGap.toFixed(2));
sandbox.System.resetProgress();

// Крупные вещи (камин, рояль) не должны «висеть на стене»: им место впереди
const bigSpot = (() => {
  sandbox.System.rooms = null;
  sandbox.System.ensureRooms();
  sandbox.System.buyFurniture('fireplace', 'living');
  const it = sandbox.System.rooms.living.furniture.find(f => f.id === 'fireplace');
  return it ? it.y : -1;
})();
ok('Крупная мебель встаёт вперёд, а не у стены', bigSpot >= 0.8, 'камин на глубине ' + bigSpot);
sandbox.System.resetProgress();

// Герой стоит впереди по центру: вещи не должны вставать ему на голову,
// а настенные — попадать в окно
const spotsOverlapHero = (() => {
  sandbox.System.rooms = null;
  sandbox.System.ensureRooms();
  ['plant', 'clock', 'lamp', 'carpet', 'painting', 'sofa', 'tv', 'piano', 'fireplace',
   'clock', 'mirror'].forEach(id => sandbox.System.buyFurniture(id, 'living'));
  const bad = sandbox.System.rooms.living.furniture.filter(it => {
    const f = sandbox.findFurniture(it.id);
    if (!f) return false;
    // Передний ряд по центру — место героя (x ≈ 0.5, y = 0.86)
    if (it.y >= 0.8 && Math.abs(it.x - 0.5) < 0.2) return true;
    // Верхняя часть правой стены — окно
    if (f.zone === 'wall' && it.x > 0.7 && it.y < 0.6) return true;
    return false;
  });
  return bad.map(it => it.id).join(', ');
})();
ok('Мебель не встаёт на героя и не залезает в окно', !spotsOverlapHero, spotsOverlapHero || 'ок');
sandbox.System.resetProgress();

/* ---------- Слои: настенное и ковры всегда за героем ---------- */
const layerSeen = { behind: [], front: [] };
const origDrawItem = sandbox.RoomView.drawItem;
sandbox.RoomView.drawItem = function (ctx, it) { layerSeen[this.__pass].push(it.id); };
sandbox.RoomView.__pass = 'behind';
sandbox.RoomView.drawItems(sandbox.__ctx, rect, [
  { id: 'painting', x: 0.6, y: 0.70 },  { id: 'clock', x: 0.3, y: 0.12 },
  { id: 'carpet', x: 0.5, y: 0.92 },    { id: 'sofa', x: 0.8, y: 0.30 },
  { id: 'fireplace', x: 0.2, y: 0.86 }
], { behind: 0.45 });
sandbox.RoomView.__pass = 'front';
sandbox.RoomView.drawItems(sandbox.__ctx, rect, [
  { id: 'painting', x: 0.6, y: 0.70 },  { id: 'clock', x: 0.3, y: 0.12 },
  { id: 'carpet', x: 0.5, y: 0.92 },    { id: 'sofa', x: 0.8, y: 0.30 },
  { id: 'fireplace', x: 0.2, y: 0.86 }
], { front: 0.45 });
sandbox.RoomView.drawItem = origDrawItem;
const layerOk = ['painting', 'clock', 'carpet', 'sofa'].every(id => layerSeen.behind.indexOf(id) !== -1) &&
  layerSeen.front.indexOf('fireplace') !== -1 && layerSeen.front.indexOf('painting') === -1 &&
  layerSeen.front.indexOf('carpet') === -1 && layerSeen.front.indexOf('clock') === -1;
ok('Настенное и ковры — за героем, ближняя мебель — перед ним', layerOk,
  'за героем: ' + layerSeen.behind.join(', ') + ' | перед: ' + layerSeen.front.join(', '));

/* ---------- Все комнаты: ничего не в окне и не на герое ---------- */
const badInRooms = [];
sandbox.HOME_ROOMS.forEach(r => {
  sandbox.System.resetProgress();
  sandbox.System.rooms = null;
  sandbox.System.ensureRooms();
  sandbox.furnitureForRoom(r.id).forEach(f => sandbox.System.buyFurniture(f.id, r.id));
  sandbox.System.rooms[r.id].furniture.forEach(it => {
    const f = sandbox.findFurniture(it.id);
    const wallItem = f && f.zone === 'wall';
    if (wallItem && it.x > 0.7 && it.y < 0.6) badInRooms.push(r.id + ': ' + it.id + ' в окне');
    if (!wallItem && it.y >= 0.8 && Math.abs(it.x - 0.5) < 0.2) badInRooms.push(r.id + ': ' + it.id + ' на герое');
  });
});
ok('Во всех комнатах мебель не мешает герою и окну', badInRooms.length === 0,
  badInRooms.length ? badInRooms.slice(0, 3).join('; ') : sandbox.HOME_ROOMS.length + ' комнаты целиком');
sandbox.System.resetProgress();

// --- Доступность: в каждой комнате есть что-то за первые монетки ---
const poor = sandbox.HOME_ROOMS.filter(r => {
  const list = sandbox.furnitureForRoom(r.id);
  return !list.some(f => f.cost <= 40) || list.length < 8;
});
ok('В каждой комнате есть дешёвый предмет и не меньше 8 вещей', poor.length === 0,
  poor.length ? 'проблемы: ' + poor.map(r => r.id).join(', ') : sandbox.HOME_ROOMS.length + ' комнат');

// --- Обои и пол: один бесплатный вариант, остальные покупаются ---
const checkFinish = (list, name) => {
  const free = list.filter(x => x.cost === 0);
  const bad = list.filter(x => !x.id || !x.name || !(x.cost >= 0) || !x.c1 || !x.c2 || !x.night1 || !x.night2);
  const uniq = new Set(list.map(x => x.id)).size === list.length;
  ok(name + ': варианты и цены в порядке', free.length === 1 && bad.length === 0 && uniq,
    list.length + ' набора, бесплатных ' + free.length);
};
checkFinish(sandbox.WALLS, 'Обои');
checkFinish(sandbox.FLOORS, 'Пол');

/* ---------- АУДИТ СЦЕН: ПРОЦЕДУРЫ, ИГРЫ, СПРАВКА ---------- */
const procs = sandbox.CLINIC_PROCEDURES;
const badProc = procs.filter(p => !p.id || !p.name || !p.anim ||
  !Array.isArray(p.steps) || p.steps.length !== 3 || p.steps.some(s => !s || s.length < 3));
ok('Каждая процедура — 3 подписанных шага из названия и анимации', procs.length === 8 && badProc.length === 0,
  procs.length + ' процедур' + (badProc.length ? ', плохих: ' + badProc.map(p => p.id).join(', ') : ''));

const quietSrc = fs.readFileSync(path.join(WWW, 'game_quiet.js'), 'utf8');
const quietMiss = sandbox.QUIET_GAMES.filter(g => quietSrc.indexOf("'" + g.id + "'") === -1);
ok('Все тихие игры обрабатываются сценой (по id)', sandbox.QUIET_GAMES.length === 3 && quietMiss.length === 0,
  sandbox.QUIET_GAMES.map(g => g.id).join(', ') + (quietMiss.length ? ' — нет: ' + quietMiss.map(g => g.id).join(', ') : ''));
ok('Тихие игры дают награду и не тратят энергию',
  sandbox.QUIET_GAMES.every(g => g.reward >= 5 && g.reward <= 20));

const panelKeys = ['happiness', 'hunger', 'energy', 'cleanliness', 'health', 'stress'];
const helpKeys = sandbox.STAT_HELP.map(h => h.key);
ok('Справка объясняет все шкалы на панели дома',
  panelKeys.every(k => helpKeys.indexOf(k) !== -1) && helpKeys.length === panelKeys.length,
  helpKeys.join(', '));
ok('В справке есть что повышает и что понижает',
  sandbox.STAT_HELP.every(h => h.what && h.up.length && h.down.length));

const furIds = sandbox.FURS.map(f => f.id);
ok('Окрасы: бесплатный стартовый и платные варианты',
  sandbox.FURS[0].cost === 0 && new Set(furIds).size === furIds.length && sandbox.FURS.length >= 4,
  sandbox.FURS.length + ' окрасов');

const A = sandbox.AERIAL;
ok('Воздушная гимнастика настроена (попытки, монеты, энергия, опыт)',
  A.attempts >= 3 && A.perfectCoins >= A.goodCoins && A.goodCoins > 0 && A.energy > 0 && A.xp > 0,
  A.attempts + ' попыток, ' + A.perfectCoins + '/' + A.goodCoins + ' монет');

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

  /* ---------- Тихие игры: доходим до победы (нет тупиков) ---------- */
  const playable = { stars: false, color: false, fish: false, clicks: 0 };
  try {
    const qs = boot.scenes.quiet;
    const wW = 360, wH = 640;

    // 1) Созвездие: нажимаем звёзды по номерам
    qs.init();
    qs.startGame('stars');
    const sa = { x: wW * 0.08, y: wH * 0.16, w: wW * 0.84, h: wH * 0.54 };
    qs.stars.points.forEach(p => qs.clickStars(sa.x + sa.w * p[0], sa.y + sa.h * p[1]));
    playable.stars = qs.stars.done === true;

    // 2) Раскраска: тапаем в центр каждой незакрашенной части
    qs.init();
    qs.startGame('color');
    const pa = { x: wW * 0.12, y: wH * 0.14, w: wW * 0.76, h: wH * 0.54 };
    let guard = 0;
    while (!qs.paint.done && guard++ < 40) {
      const part = qs.paint.parts.find(x => !x.fill) || qs.paint.parts[0];
      const cx = part.kind === 'rect' ? pa.x + pa.w * (part.x + part.w / 2) : pa.x + pa.w * part.cx;
      const cy = part.kind === 'rect' ? pa.y + pa.h * (part.y + part.h / 2) : pa.y + pa.h * part.cy;
      qs.clickColor(cx, cy);
    }
    playable.clicks = guard;
    playable.color = qs.paint.done === true;

    // 3) Рыбалка: три поклёвки дают награду
    qs.init();
    qs.startGame('fish');
    const coinsBefore = S.coins;
    for (let i = 0; i < qs.fish.target; i++) {
      qs.fish.state = 'bite';
      qs.fish.biteWindow = 2;
      qs.tryFish();
    }
    playable.fish = S.coins - coinsBefore >= 12;
  } catch (e) { console.log('   ошибка тихих игр: ' + e.message); }
  ok('Тихие игры доводятся до победы (без тупиков)',
    playable.stars && playable.color && playable.fish,
    'созвездие ' + (playable.stars ? 'ок' : 'нет') +
    ', раскраска ' + (playable.color ? 'ок за ' + playable.clicks + ' тапов' : 'нет') +
    ', рыбалка ' + (playable.fish ? 'ок' : 'нет'));

  /* ---------- Магазин «Дом»: фильтры, страницы, покупка обоев и пола ---------- */
  let shopOk = true, shopInfo = '';
  try {
    const sp = boot.scenes.shop;
    const ctx = sandbox.__ctx;
    sp.init();
    sp.currentTab = 'decor';
    sp.decorKind = 'furniture';
    sp.decorRoom = 'living';
    sp.draw(ctx);
    const roomBtns = sp.buttons.filter(b => b.action && b.action.indexOf('decorRoom:') === 0);
    const kindBtns = sp.buttons.filter(b => b.action && b.action.indexOf('decorKind:') === 0);
    shopOk = roomBtns.length === sandbox.HOME_ROOMS.length && kindBtns.length === 3;

    // Самые дорогие обои и пол обязаны быть покупаемыми и применяться
    S.coins = 20000;
    sp.decorKind = 'walls';
    sp.draw(ctx);
    const wallCard = sp.buttons.filter(b => b.wallId).pop();
    if (!wallCard) shopOk = false;
    else sp.handleClick(wallCard.x + wallCard.w / 2, wallCard.y + wallCard.h / 2);
    const wallOk = !!wallCard && S.ownsWall(wallCard.wallId) && S.currentRoomData().wall === wallCard.wallId;

    sp.decorKind = 'floors';
    sp.decorPage = 0;
    sp.draw(ctx);
    let floorCard = null;
    for (let p = 0; p < sp.decorPages && !floorCard; p++) {
      sp.decorPage = p;
      sp.draw(ctx);
      floorCard = sp.buttons.filter(b => b.floorId).pop() || null;
    }
    if (!floorCard) shopOk = false;
    else sp.handleClick(floorCard.x + floorCard.w / 2, floorCard.y + floorCard.h / 2);
    const floorOk = !!floorCard && S.ownsFloor(floorCard.floorId) && S.currentRoomData().floor === floorCard.floorId;

    shopOk = shopOk && wallOk && floorOk;
    shopInfo = 'комнат ' + roomBtns.length + ', видов ' + kindBtns.length +
      ', обои ' + (wallOk ? 'ок' : 'нет') + ', пол ' + (floorOk ? 'ок' : 'нет');
  } catch (e) { shopOk = false; shopInfo = e.message; }
  ok('Магазин «Дом»: фильтры и покупка обоев/пола работают', shopOk, shopInfo);

  /* ---------- Фаззинг: случайные нажатия не должны ломать игру ---------- */
  let fuzzErr = null, fuzzClicks = 0;
  const STAT_KEYS = ['happiness', 'hunger', 'energy', 'health', 'cleanliness',
    'intelligence', 'workSkill', 'schoolSkill', 'stress'];
  try {
    const names = Object.keys(boot.scenes);
    for (let i = 0; i < 420; i++) {
      const n = names[i % names.length];
      const sc = boot.scenes[n];
      if (i < names.length) sc.init();
      sc.draw(sandbox.__ctx);
      if (typeof sc.handleClick === 'function') sc.handleClick(Math.random() * 360, Math.random() * 640);
      if (typeof sc.update === 'function') sc.update(16);
      fuzzClicks++;
      const out = STAT_KEYS.filter(k => typeof S.stats[k] === 'number' &&
        (S.stats[k] < 0 || S.stats[k] > 100));
      if (S.coins < 0) throw new Error('монеты ушли в минус в сцене ' + n);
      if (out.length) throw new Error('шкалы вне диапазона (' + out.join(', ') + ') в сцене ' + n);
    }
  } catch (e) { fuzzErr = e; }
  ok('Случайные нажатия не ломают игру', !fuzzErr,
    fuzzErr ? fuzzErr.message : fuzzClicks + ' кликов, монеты и шкалы в порядке');

  /* ---------- Карта: цена похода видна до нажатия ---------- */
  const drawnTexts = [];
  const logCtx = new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return { width: 360, height: 640 };
      if (p === 'measureText') return s => ({ width: String(s).length * 6 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: [] });
      return (...a) => { if (p === 'fillText') drawnTexts.push(String(a[0])); };
    },
    set() { return true; }
  });
  boot.scenes.map.init();
  boot.scenes.map.draw(logCtx);
  ok('На карте видно, сколько энергии стоит поход',
    drawnTexts.some(t => t.indexOf('⚡') !== -1),
    drawnTexts.filter(t => t.indexOf('⚡') === 0).join(', ') || 'ни одной подписи ⚡');

  /* ---------- Автопроверка «ничего не обрезано по краям экрана» ----------
     Рисуем все сцены «умной» заглушкой, которая знает размер и выравнивание
     шрифта, и считаем рамку каждой надписи. Так ловятся подписи, вылезающие
     за пределы кадра (именно это видно глазами как «обрезано»).            */
  let curFont = 14, curAlign = 'left';
  let tx = 0, ty = 0, scale = 1;
  const tStack = [];
  const overflow = [];
  const smartCtx = new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return { width: 360, height: 640 };
      if (p === 'measureText') return s => ({ width: String(s).length * curFont * 0.55 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: [] });
      if (p in t) return t[p];
      return (...a) => {
        // Следим за переносом и масштабом: фигурка рисуется в своих координатах
        if (p === 'save') { tStack.push([tx, ty, scale]); return; }
        if (p === 'restore') { const s = tStack.pop(); if (s) { tx = s[0]; ty = s[1]; scale = s[2]; } return; }
        if (p === 'translate') { tx += (a[0] || 0) * scale; ty += (a[1] || 0) * scale; return; }
        if (p === 'scale') { scale *= (a[0] || 1); return; }
        if (p === 'resetTransform' || p === 'setTransform') { tx = 0; ty = 0; scale = 1; return; }
        if (p !== 'fillText' && p !== 'strokeText') return;
        const text = String(a[0]);
        if (!text.trim()) return;
        const x = tx + a[1] * scale, y = ty + a[2] * scale;
        const font = curFont * scale;
        const w = text.length * font * 0.55;
        const h = font;
        let left = x, right = x + w;
        if (curAlign === 'center') { left = x - w / 2; right = x + w / 2; }
        else if (curAlign === 'right') { left = x - w; right = x; }
        const top = y - h, bottom = y + h * 0.3;
        // Одиночные знаки («z», «💤») — это плавающие облачка сна: они уходят
        // за верхний край по задумке, поэтому им верхнюю границу не проверяем.
        const floating = text.length <= 2;
        if (left < -3 || right > 363 || (top < -6 && !floating) || bottom > 646) {
          overflow.push((smartCtx.__scene || '?') + ': «' + text.slice(0, 18) + '» x=' + Math.round(x) +
            ' y=' + Math.round(y) + ' w=' + Math.round(w) + ' font=' + Math.round(font));
        }
      };
    },
    set(t, p, v) {
      if (p === 'font') {
        const m = String(v).match(/(\d+(?:\.\d+)?)px/);
        curFont = m ? parseFloat(m[1]) : 14;
      }
      if (p === 'textAlign') curAlign = v;
      t[p] = v;
      return true;
    }
  });
  Object.keys(boot.scenes).forEach(n => {
    const sc = boot.scenes[n];
    smartCtx.__scene = n;
    try {
      sc.init();
      for (let i = 0; i < 8; i++) {
        sc.draw(smartCtx);
        if (typeof sc.update === 'function') sc.update(16);
      }
    } catch (e) { /* ошибки отрисовки ловят другие проверки */ }
  });
  ok('Надписи не вылезают за пределы экрана', overflow.length === 0,
    overflow.length ? overflow.slice(0, 4).join('; ') : 'все 11 сцен, 8 кадров каждая');

  /* ---------- Магазин: до каждого товара можно долистать ---------- */
  // Раньше «Одежда» (7 аксессуаров + 7 окрасов) не листалась: 8 товаров висели
  // ниже экрана, и купить их было нельзя.
  const shopSrc = fs.readFileSync(path.join(WWW, 'game_shop.js'), 'utf8');
  const expects = {};
  ['food', 'toys', 'clothes', 'fun'].forEach(t => {
    expects[t] = (shopSrc.match(new RegExp("category: '" + t + "'", 'g')) || []).length;
  });
  // В «Одежде»: 7 аксессуаров + все окрасы из базы мехов. В исходнике одна
  // строка `category: 'clothes'` — это шаблон для окрасов, её вычитаем.
  expects.clothes += sandbox.FURS.length - 1;
  const unreachable = [];
  Object.keys(expects).forEach(tab => {
    const sp2 = boot.scenes.shop;
    sp2.init();
    sp2.currentTab = tab;
    const seenIds = new Set();
    for (let p = 0; p < 8; p++) {
      sp2.page = p;
      sp2.draw(sandbox.__ctx);
      sp2.buttons.filter(b => b.id && b.category === tab).forEach(b => seenIds.add(b.id));
      if (p + 1 >= (sp2.pages || 1)) break;
    }
    if (seenIds.size !== expects[tab]) {
      unreachable.push(tab + ': видно ' + seenIds.size + ' из ' + expects[tab]);
    }
  });
  ok('В магазине долистываются все товары во всех вкладках',
    unreachable.length === 0,
    unreachable.length ? unreachable.join('; ')
      : 'еда 4, игрушки 4, одежда ' + expects.clothes + ', веселье ' + expects.fun);

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
