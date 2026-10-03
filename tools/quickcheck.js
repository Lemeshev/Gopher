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
  'game_minigames.js', 'chat_lines.js', 'chat_kid.js', 'semantic.js', 'chat_semantic.js', 'chat_bank.js', 'chat_talk.js', 'chat_memory.js', 'game_chat.js', 'game_tools.js',
  'game_quiet.js', 'game_aerial.js', 'game_stats.js',
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
ok('Тихих игр 4 (звёзды, раскраска, рыбалка, у окна)', sandbox.QUIET_GAMES.length === 4,
  sandbox.QUIET_GAMES.map(g => g.id).join(', '));
ok('Персонажей 6 (гофер + 5 игрушек)', sandbox.CHARACTERS.length === 6, sandbox.CHARACTERS.map(c => c.name).join(', '));
const milka = sandbox.findCharacter('milka');
ok('Среди героев есть «Милка» — плюшевая, как на фотографиях заказчика',
  milka.id === 'milka' && milka.ears.inner === '#2BB24C' && !!milka.eyeColor,
  milka.name + ': ' + milka.desc);
ok('У Милки крылышки с зелёными подушечками, румянец и лапки-подушечки',
  !!milka.wings && milka.wings.pad === '#2FA84F' && !!milka.cheeks && !!milka.pads,
  'крылья ' + milka.wings.spread + ', подушечки ' + milka.pads);

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

/* ---------- Сон: во сне дела с питомцем закрыты (v1.2.1) ---------- */
S.resetProgress();
S.stats.energy = 95;
ok('Спать укладывают, когда есть что восстанавливать', S.startSleep() === true && S.isSleeping === true);
S.tick(60000 * 3);                     // +30% -> 100%
ok('Выспавшийся питомец просыпается сам и без закрытия приложения',
  S.isSleeping === false && S.justWoke === true, Math.round(S.stats.energy) + '%');
S.justWoke = false;
S.stats.energy = 100;
ok('С полной энергией «Уложить спать» не работает (нечего восстанавливать)', S.startSleep() === false);
S.isSleeping = true;
S.stats.energy = 40;
const sleepBlocked = ['work', 'school', 'museums', 'museum_art', 'museum_nature', 'library',
  'cinema', 'park', 'pool', 'gym', 'restaurant', 'beach', 'friend', 'clinic'];
const sleepOpen = ['home', 'shop', 'stats', 'minigames', 'tools', 'quiet'];
const wronglyOpen = sleepBlocked.filter(l => S.isLocationAvailable(l));
const wronglyClosed = sleepOpen.filter(l => !S.isLocationAvailable(l));
ok('Пока гофер спит, походы закрыты (музеи, работа, спорт, гости, поликлиника)',
  wronglyOpen.length === 0, wronglyOpen.length ? 'открыто: ' + wronglyOpen.join(', ') : sleepBlocked.length + ' локаций');
ok('Пока гофер спит, открыто только «безгоферное»: дом, магазин, мини-игры, тихие игры, инфо',
  wronglyClosed.length === 0, wronglyClosed.length ? 'закрыто: ' + wronglyClosed.join(', ') : sleepOpen.join(', '));
const sleepReasons = sleepBlocked.map(l => S.locationLockReason(l));
ok('Отказ во сне объясняется словами, а не «нельзя»',
  sleepReasons.every(r => r.indexOf('спит') !== -1),
  sleepReasons[0]);
S.isSleeping = false;
ok('Проснувшись, можно снова идти в музей', S.isLocationAvailable('museums') === true);
S.resetProgress();

/* ---------- Спокойствие вместо стресса (v1.3.2) ---------- */
// Замечание заказчика: «стресс — единственная полоска, которая работает
// наоборот; детям кажется, что все идеальные показатели должны быть полными».
// Теперь в интерфейсе «Спокойствие» = 100 − стресс, все шкалы одинаковые,
// подсказки «нажми на стресс» нет, а справка открывается обычной кнопкой «❓».
S.stats.stress = 80;
S.relax(15);
ok('Механика не изменилась: стресс по-прежнему снимается (сон/музыка/игры)',
  S.stats.stress === 65, 'стало ' + S.stats.stress);
ok('Ребёнку показывается обратная шкала: спокойствие = 100 − стресс',
  S.calm() === 35 && S.statValue('calm') === 35 && S.statValue('hunger') === S.stats.hunger,
  'стресс ' + S.stats.stress + ' → спокойствие ' + S.calm());

const calmColor = (stress) => { S.stats.stress = stress; return S.getStatColor('calm'); };
ok('Все шкалы одного типа: полная — зелёная, пустая — красная (перевёрнутых нет)',
  calmColor(0) === '#4ade80' && calmColor(90) === '#ef4444' && S.getStatColor('energy') === S.getStatColor('energy'),
  'спокойствие 100 → ' + calmColor(0) + ', спокойствие 10 → ' + calmColor(90));

S.stats.stress = 65;
ok('Подсказка «гофер нервничает» осталась и говорит словами, без названий шкал',
  S.stressHint().length > 0, S.stressHint());
ok('Справка объясняет спокойствие: и что это, и как поднять',
  sandbox.STAT_HELP.some(h => h.key === 'calm' && h.up.length >= 5 && /БОЛЬШЕ/.test(h.what)),
  'способов поднять: ' + ((sandbox.STAT_HELP.filter(h => h.key === 'calm')[0] || {}).up || []).length);
ok('Из справки убраны шкала «Стресс» и правило «чем меньше, тем лучше»',
  sandbox.STAT_HELP.every(h => h.key !== 'stress') &&
  sandbox.STAT_HELP.every(h => !/МЕНЬШЕ, тем лучше/.test(h.what || '')));

/* Что РЕАЛЬНО нарисовано в панели дома (поддельный контекст записывает надписи) */
{
  const texts = [];
  const grad = { addColorStop() {} };
  const rec = new Proxy({
    canvas: { width: 390, height: 744 }, measureText: () => ({ width: 10 }),
    createLinearGradient: () => grad, createRadialGradient: () => grad,
    fillText: (t) => { texts.push(String(t)); }
  }, { get(t, p) { return p in t ? t[p] : function () {}; }, set(t, p, v) { t[p] = v; return true; } });

  const g2 = vm.runInContext('(function(){ var g = new Game(); g.init(); return g; })()', sandbox);
  const home = g2.scenes.home;
  home.init();
  home.draw(rec);
  const painted = texts.join(' | ');

  ok('В панели дома больше нет шкалы «Стресс» — все полоски одинаковые',
    painted.indexOf('Стресс') === -1 && painted.indexOf('Спокойствие') !== -1,
    texts.filter(t => /Спокойствие|Стресс/.test(t)).join(' / '));
  ok('Вместо «нажми на стресс» — правило одной строкой, без призывов нажимать',
    painted.indexOf('чем больше, тем лучше') !== -1 && painted.toLowerCase().indexOf('нажми на «стресс»') === -1);

  const helpBtn = (home.buttons || []).filter(b => b.action === 'help')[0];
  ok('Кнопка справки — обычная кнопка «❓» в панели (её видно и легко попасть)',
    !!helpBtn && helpBtn.w <= 40 && helpBtn.h <= 24,
    helpBtn ? ('размер ' + Math.round(helpBtn.w) + '×' + Math.round(helpBtn.h)) : 'кнопки нет');
  if (helpBtn) home.handleClick(helpBtn.x + helpBtn.w / 2, helpBtn.y + helpBtn.h / 2);
  ok('Нажатие на «❓» открывает справку (раньше область стояла в чужой ячейке)',
    home.sheet === 'help', 'открылось: ' + String(home.sheet));

  texts.length = 0;
  const statsScene = g2.scenes.stats;
  statsScene.init();
  statsScene.draw(rec);
  const statsText = texts.join(' | ');
  ok('В «Инфо» та же шкала «Спокойствие» (единообразие по всей игре)',
    statsText.indexOf('Спокойствие') !== -1 && statsText.indexOf('Стресс') === -1);

  const quietSrc = fs.readFileSync(path.join(WWW, 'game_quiet.js'), 'utf8');
  ok('Тихая игра хвалит ребёнка «+4 спокойствия», а не «−4 стресса»',
    quietSrc.indexOf('+4 спокойствия') !== -1 && quietSrc.indexOf('−4 стресса') === -1);
}

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

/* ---------- Код друга стал коротким и «не страшным» (v1.3.12) ---------- */
// Заказчик 01.10.2026: «нельзя ли как-то коды сделать менее страшными для
// пересылки? Обязательно прям такие огромные?» Полный код упакован битами нашим
// алфавитом: проверяем длину, алфавит и что весь дом доезжает без потерь.
const codeG = (n) => (typeof sandbox[n] !== 'undefined') ? sandbox[n]
  : (sandbox.window && typeof sandbox.window[n] !== 'undefined') ? sandbox.window[n] : undefined;
const roomKeys = ['living', 'bedroom', 'kitchen', 'bathroom'];
const houseSize = (function () {
  const furn = codeG('FURNITURE') || [];
  const walls = codeG('WALLS') || [];
  const floors = codeG('FLOORS') || [];
  S.profileName = 'Мила-Гофер';
  S.level = 42;
  S.coins = 12345;
  S.look = { char: 'bunny', fur: 'rose', hat: 'crown', glasses: 'cool', neck: 'scarf', back: 'cape' };
  roomKeys.forEach((k, i) => {
    S.rooms[k].wall = (walls[(i * 2 + 1) % walls.length] || {}).id;
    S.rooms[k].floor = (floors[i % floors.length] || {}).id;
    const items = [];
    for (let j = 0; j < 8; j++) {
      const f = furn[(i * 7 + j) % furn.length];
      if (f) items.push({ id: f.id, x: j / 8 + 0.05, y: (j % 3) / 3 + 0.2 });
    }
    S.rooms[k].furniture = items;
  });
  return roomKeys.reduce((n, k) => n + (S.rooms[k].furniture || []).length, 0);
})();
const packedCode = S.getMyCode();
S.friends = [];
const packedBack = S.addFriendCode(packedCode, 'Проверка');
const pf = S.friends[0] || {};
const packedItems = roomKeys.reduce((n, k) => n + ((((pf.rooms || {})[k] || {}).furniture || []).length), 0);
ok('Полный код с заставленным домом короткий и без «страшных» знаков',
  packedCode.length >= 20 && packedCode.length <= 220 &&
  /^[0-9A-Z-]+$/.test(packedCode) && !/[IO]/.test(packedCode),
  packedCode.length + ' знаков на ' + houseSize + ' предметов, только цифры и заглавные буквы');
ok('Полный код доезжает без потерь: имя, обои, все комнаты, мебель и наряды',
  packedBack.ok === true && pf.name === 'Мила-Гофер' &&
  pf.room.wall === S.rooms.living.wall && pf.room.floor === S.rooms.living.floor &&
  packedItems === houseSize && pf.hat === 'crown' && pf.neck === 'scarf' && pf.back === 'cape' &&
  pf.char === 'bunny',
  'предметов ' + packedItems + ' из ' + houseSize + ', гостиная ' + pf.room.wall + '/' + pf.room.floor);
// Совместимость: коды старых версий (base64) по-прежнему принимаются, а испорченный
// полный код — нет (контрольная сумма не сойдётся).
// Собираем старый код тем же способом, каким его делала прежняя версия:
// base64 от UTF-8 (btoa(unescape(encodeURIComponent(json))) — иначе кириллица
// в имени не прочитается).
let v3raw = JSON.stringify({
  v: 3, name: 'Старый друг', level: 5, coins: 10,
  rooms: { living: { wall: 'warm', floor: 'wood', furniture: [{ id: 'sofa', x: 0.5, y: 0.5 }] } },
  room: { wall: 'warm', floor: 'wood' },
  furniture: [{ id: 'sofa', x: 0.5, y: 0.5 }], look: { char: 'gopher', fur: 'classic' }
});
let v3code = '';
try { v3code = sandbox.btoa(unescape(encodeURIComponent(v3raw))); }
catch (e) { v3code = sandbox.btoa(v3raw); }
S.friends = [];
const oldOk = S.addFriendCode(v3code).ok;
S.friends = [];
const brokenFull = S.addFriendCode(packedCode[0] === 'A' ? 'B' + packedCode.slice(1) : 'A' + packedCode.slice(1)).ok;
ok('Старый длинный код (base64) ещё принимается, а испорченный — нет',
  oldOk === true && brokenFull === false,
  'старый код: ' + (oldOk ? 'принят' : 'НЕТ') + ', испорченный: ' + (brokenFull ? 'принят (плохо)' : 'отвергнут'));

// Заказчик прислал скриншот: при нажатии «Отправить» WebView открывал «sms:?body=…»,
// не умеет такую схему и показывал ребёнку страницу ошибки
// «Не удалось открыть веб-страницу: net::ERR_UNKNOWN_URL_SCHEME» вместо игры.
// Проверяем порядок отправки: мост Android → копия в буфер, и что не-веб схемы
// игра вообще не открывает (их обрабатывает сама оболочка).
const shareProbe = (function () {
  const CB = sandbox.ClipBridge;
  if (!CB || typeof CB.share !== 'function') return { ok: false, why: 'нет ClipBridge' };
  const realCopy = CB.copy;
  let copied = null;
  CB.copy = (v) => { copied = v; return true; };
  let bridged = null;
  sandbox.AndroidBridge = { share(t) { bridged = t; } };
  const okBridge = CB.share('ABC-123') === true && bridged === 'ABC-123' && copied === null;
  delete sandbox.AndroidBridge;
  const ret = CB.share('ABC-123');
  const okCopy = ret === false && copied === 'ABC-123';
  CB.copy = realCopy;
  const link = (typeof sandbox.openExternalLink === 'function') ? sandbox.openExternalLink : null;
  const okLinks = !!link && link('sms:?body=hi') === false && link('tel:+79990000000') === false &&
    link('whatsapp://send?text=hi') === false;
  return { ok: okBridge && okCopy && okLinks, copy: copied, bridge: !!bridged };
})();
ok('Код друга уходит системным «Поделиться» (мост Android), а не sms:-ссылкой',
  shareProbe.ok === true,
  'мост: ' + (shareProbe.bridge ? 'вызван' : 'нет') + ', копия в буфер: ' +
  (shareProbe.copy ? 'есть' : 'нет') + ', sms:/tel:/whatsapp: не открываются');

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
  sandbox.CHARACTERS.map(c => c.id).forEach(id => {
    const c = sandbox.createCharacter(id, 120);
    ['happy', 'sleeping', 'excited', 'sad', 'sick', 'eating', 'neutral'].forEach(e => {
      c.setExpression(e, 5);
      c.outfit = 'trunks';
      c.heldEmoji = '🍕';
      c.draw(ctx, 100, 100, 1);
    });
  });
} catch (e) { drawOk = false; console.log('   ошибка отрисовки: ' + e.message); }
ok('Все ' + sandbox.CHARACTERS.length + ' персонажей рисуются во всех выражениях без ошибок', drawOk);

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
// а настенные — попадать в окно (окно начинается на 0.64 ширины комнаты,
// поэтому важна не только середина вещи, но и её край)
const windowHalf = (id, y) => sandbox.RoomView.sizeFor(id, rect, y) * 0.5 / rect.w;
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
    // Верхняя полоса стены — окно: вещь не должна залезать даже краем
    if (f.zone === 'wall' && it.y < 0.6 && it.x + windowHalf(it.id, it.y) > 0.64) return true;
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
    // Окно начинается на 0.64 ширины комнаты: проверяем правый край вещи,
    // а не только её середину — так нашлось зеркало, «разрезанное» рамой.
    if (wallItem && it.y < 0.6 && it.x + windowHalf(it.id, it.y) > 0.64) {
      badInRooms.push(r.id + ': ' + it.id + ' краем в окне');
    }
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
ok('Все тихие игры обрабатываются сценой (по id)', sandbox.QUIET_GAMES.length === 4 && quietMiss.length === 0,
  sandbox.QUIET_GAMES.map(g => g.id).join(', ') + (quietMiss.length ? ' — нет: ' + quietMiss.map(g => g.id).join(', ') : ''));
ok('Тихие игры дают награду и не тратят энергию',
  sandbox.QUIET_GAMES.every(g => g.reward >= 5 && g.reward <= 20));

// Панель дома показывает «спокойствие» (v1.3.2), внутри это 100 − стресс:
// справка обязана объяснять ровно те шкалы, которые ребёнок видит.
const panelKeys = ['happiness', 'hunger', 'energy', 'cleanliness', 'health', 'calm'];
const helpKeys = sandbox.STAT_HELP.map(h => h.key);
ok('Справка объясняет все шкалы на панели дома (и ничего лишнего)',
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
  let paintInfo = null;   // что удалось узнать про раскраски (v1.3.12)
  try {
    const qs = boot.scenes.quiet;
    const wW = boot.width, wH = boot.height;

    // 1) Созвездие: нажимаем звёзды по номерам
    qs.init();
    qs.startGame('stars');
    const sa = { x: wW * 0.08, y: wH * 0.16, w: wW * 0.84, h: wH * 0.54 };
    qs.stars.points.forEach(p => qs.clickStars(sa.x + sa.w * p[0], sa.y + sa.h * p[1]));
    playable.stars = qs.stars.done === true;

    // 2) Раскраска: картинок восемь, палитра у каждой своя. Проходим ВСЕ восемь
    // (не случайную): тапаем по деталям по кругу и проверяем, что каждая доводится
    // до конца. Рамка — как в drawColor/clickColor (v1.3.12: y 0.16, h 0.52).
    qs.init();
    qs.startGame('color');
    const pa = { x: wW * 0.12, y: wH * 0.16, w: wW * 0.76, h: wH * 0.52 };
    const paintRun = (id) => {
      if (id) qs.initColor(id);
      let guard = 0;
      while (!qs.paint.done && guard++ < 120) {
        const part = qs.paint.parts[(guard - 1) % qs.paint.parts.length];
        if (part.fill) continue;             // тап по центру закрашенной детали не нужен
        const cx = part.kind === 'rect' ? pa.x + pa.w * (part.x + part.w / 2) : pa.x + pa.w * part.cx;
        const cy = part.kind === 'rect' ? pa.y + pa.h * (part.y + part.h / 2) : pa.y + pa.h * part.cy;
        qs.clickColor(cx, cy);
      }
      return { done: qs.paint.done === true, taps: guard, name: qs.paint.name };
    };
    const paintAll = (sandbox.PAINT_PICTURES || []).map(p => paintRun(p.id));
    const firstPaint = paintAll[0] || { done: false, taps: 0 };
    playable.clicks = firstPaint.taps;
    playable.color = paintAll.length >= 8 && paintAll.every(r => r.done);
    playable.paintTaps = paintAll.map(r => r.taps);
    playable.paintNames = paintAll.map(r => r.name);
    playable.paintHard = paintAll.filter(r => !r.done).map(r => r.name);
    playable.pictures = (function () {
      // Проверяем, что картинки разные: запускаем раскраску восемь раз подряд и
      // смотрим, сколько разных картинок и палитр встретилось
      const names = {}, colors = {};
      const total = qs.paintTotal || 8;
      let first = null;
      for (let i = 0; i < total * 3; i++) {
        qs.initColor();
        names[qs.paint.name] = 1;
        colors[qs.paint.colors.join(',')] = 1;
        if (!first) first = qs.paint.name;
        // подряд одна и та же картинка не должна выпадать дважды
        const again = qs.paint.name;
        qs.initColor();
        if (qs.paint.name === again) return { repeat: true, names: Object.keys(names).length, colors: Object.keys(colors).length };
      }
      return { repeat: false, names: Object.keys(names).length, colors: Object.keys(colors).length,
        first: first, allDone: playable.paintHard.length === 0 };
    })();
    paintInfo = { total: qs.paintTotal, names: playable.pictures.names,
      colors: playable.pictures.colors, repeat: playable.pictures.repeat };

    // 3) Рыбалка: три поклёвки дают награду.
    // v1.3.9: клюёт конкретная рыбка (biteFish) — без неё подсечка не считается.
    qs.init();
    qs.startGame('fish');
    const coinsBefore = S.coins;
    for (let i = 0; i < qs.fish.target; i++) {
      qs.fish.state = 'bite';
      qs.fish.biteWindow = 2;
      qs.fish.biteFish = qs.pickBiter();
      qs.tryFish();
    }
    playable.fish = S.coins - coinsBefore >= 12;
  } catch (e) { console.log('   ошибка тихих игр: ' + e.message); }
  ok('Тихие игры доводятся до победы (без тупиков)',
    playable.stars && playable.color && playable.fish,
    'созвездие ' + (playable.stars ? 'ок' : 'нет') +
    ', раскраска ' + (playable.color ? 'ок — все 8 картинок (' + (playable.paintTaps || []).join('/') + ' тапов)' : 'нет') +
    ', рыбалка ' + (playable.fish ? 'ок' : 'нет'));

  // Раскраски (v1.3.12): заказчик — «улучши раскраски, а то они все однотипные».
  // Их стало восемь, у каждой своя палитра, и подряд одна и та же не выпадает.
  ok('Раскраски разные: восемь картинок, у каждой своя палитра, подряд не повторяются',
    !!paintInfo && paintInfo.total === 8 && paintInfo.names >= 6 &&
    paintInfo.colors >= 6 && paintInfo.repeat === false && playable.pictures &&
    playable.pictures.allDone === true,
    'картинок всего ' + (paintInfo ? paintInfo.total : '?') + ', за проверку встретилось ' +
    (paintInfo ? paintInfo.names : 0) + ' картинок и ' + (paintInfo ? paintInfo.colors : 0) +
    ' палитр, повторов подряд: ' + (paintInfo && paintInfo.repeat ? 'есть' : 'нет') +
    ', каждая доводится до конца: ' + (playable.pictures && playable.pictures.allDone ? 'да' : 'НЕТ') +
    (playable.paintHard && playable.paintHard.length ? ' (сложные: ' + playable.paintHard.join(', ') + ')' : ''));

  // Редкость рыб (v1.3.12): заказчик — «странно, что всех рыб можно наловить прям за
  // один день… надо каких-то редких рыб сделать появляющимися с меньшей
  // вероятностью». Проверяем на выборке: ступени идут по убыванию, и легендарная
  // рыба действительно редкая, а не «ещё одна из ста».
  const rarityStats = (function () {
    const pick = codeG('randomFishSpecies');
    const rarityOf = codeG('fishRarityOf');
    if (typeof pick !== 'function' || typeof rarityOf !== 'function') return { ok: false };
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    const seen = {};
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const sp = pick();
      if (!sp) return { ok: false };
      const r = rarityOf(sp);
      counts[r.id] = (counts[r.id] || 0) + 1;
      seen[sp.id] = 1;
    }
    const pct = k => Math.round((counts[k] || 0) / N * 1000) / 10;
    return { ok: true, pct: pct, species: Object.keys(seen).length };
  })();
  ok('Редкие рыбы попадаются заметно реже обычных, легендарные — совсем редко',
    rarityStats.ok &&
    rarityStats.pct('common') > rarityStats.pct('rare') &&
    rarityStats.pct('rare') > rarityStats.pct('epic') &&
    rarityStats.pct('epic') >= rarityStats.pct('legendary') &&
    rarityStats.pct('common') >= 55 && rarityStats.pct('legendary') <= 6,
    'из 4000 забросов: обычных ' + rarityStats.pct('common') + '%, редких ' +
    rarityStats.pct('rare') + '%, очень редких ' + rarityStats.pct('epic') +
    '%, легендарных ' + rarityStats.pct('legendary') + '%');

  /* ---------- Подводный мир рыбалки (v1.3.9) ---------- */
  // Пожелание пользователя: «чтобы был виден подводный мир, как они плавают, как
  // за крючок цепляются… много разных видов рыбок… ещё акул, осьминогов, черепах.
  // Но ловили чтобы только рыбок, чтоб черепашкам не навредить».
  const sea = (function () {
    const qs = boot.scenes.quiet;
    qs.init();
    qs.startGame('fish');
    const f = qs.fish;
    const swimmers = f.swimmers || [];
    const fishList = swimmers.filter(s => s.kind === 'fish');
    const friendList = swimmers.filter(s => s.kind === 'friend');
    const first = fishList[0];
    const x0 = first ? first.x : 0;
    qs.update(500);
    const moved = first ? Math.abs(first.x - x0) > 0.5 : false;

    // Данные лежат в песочнице игры: const-объявления не становятся свойствами
    // её глобального объекта, поэтому берём их через sandbox/window (v1.3.9)
    const G = (n) => (typeof sandbox[n] !== 'undefined') ? sandbox[n]
      : (sandbox.window && typeof sandbox.window[n] !== 'undefined') ? sandbox.window[n] : undefined;
    const speciesList = G('FISH_SPECIES') || [];
    const friendListAll = G('SEA_FRIENDS') || [];

    // Улов: ловим шесть раз, улов должен считаться по РАЗНЫМ видам
    S.fishSeen = {};
    let caught = 0, friendCaught = false;
    for (let i = 0; i < 6; i++) {
      f.state = 'bite';
      f.biteWindow = 2;
      f.biteFish = qs.pickBiter();
      if (f.biteFish && f.biteFish.kind !== 'fish') friendCaught = true;
      if (f.biteFish) { qs.tryFish(); caught++; }
      qs.update(900);                     // рыбка уплывает, её место занимает новая
    }
    const seen = Object.keys(S.fishSeen || {});

    // Состав больших обитателей обязан реально меняться (v1.3.11): ставим «пора»
    // и прокручиваем время, пока кто-то не дойдёт до края экрана
    f.friendSwap = 0.01;
    for (let i = 0; i < 4 && !f.friendSwapWanted; i++) qs.update(50);
    const friendsBefore = (f.swimmers || []).filter(x => x.kind === 'friend').map(x => x.id).join(',');
    for (let i = 0; i < 800; i++) qs.update(50);
    const friendsAfterList = (f.swimmers || []).filter(x => x.kind === 'friend').map(x => x.id);

    return {
      species: speciesList.length,
      uniqNames: new Set(speciesList.map(x => x.name)).size,
      facts: speciesList.length > 0 && speciesList.every(x => x.fact && x.fact.length > 15),
      friendsAll: friendListAll.length,
      friendsFacts: friendListAll.length > 0 && friendListAll.every(x => x.fact && x.fact.length > 15),
      overlap: speciesList.filter(x => friendListAll.some(y => y.id === x.id)).length,
      swim: fishList.length,
      friends: friendList.length,
      friendsUniq: new Set(friendList.map(x => x.id)).size,
      // Случайный порядок (v1.3.25): обитатели приплывают не по кругу, а случайно.
      // Проверяем, что за много вызовов выпадает каждый из них (не «одни медузы»).
      friendsCycle: (function () {
        const seen = {};
        for (let i = 0; i < 1000; i++) {
          const sp = qs.nextFriendSpecies([]);
          if (sp) seen[sp.id] = 1;
        }
        return Object.keys(seen).length;
      })(),
      moved: moved,
      caught: caught,
      seen: seen.length,
      friendCaught: friendCaught || friendListAll.some(y => (S.fishSeen || {})[y.id]),
      hint: (typeof G('seaFriendHint') === 'function' && friendListAll[0]) ? G('seaFriendHint')(friendListAll[0].id) : '',
      friendsBefore: friendsBefore,
      friendsAfter: friendsAfterList.join(','),
      friendsAfterN: friendsAfterList.length,
      friendsAfterUniq: new Set(friendsAfterList).size,
      ach: (G('ACHIEVEMENTS') || []).filter(a => ['fishAll', 'fishExpert', 'fishMaster'].indexOf(a.id) !== -1).length
    };
  })();
  ok('Под водой сто видов рыб — у каждого имя, цвет и факт',
    sea.species >= 100 && sea.uniqNames === sea.species && sea.facts,
    'видов ' + sea.species + ', уникальных имён ' + sea.uniqNames);
  ok('Рядом плавают большие обитатели (черепаха, акула, дельфин, косатка, скат…) — и они вне улова',
    sea.friendsAll >= 16 && sea.friendsFacts && sea.overlap === 0,
    'обитателей ' + sea.friendsAll + ', совпадений с рыбами ' + sea.overlap);
  ok('В воде действительно кто-то плавает: рыбки и большие, и они двигаются',
    sea.swim >= 5 && sea.friends >= 3 && sea.moved === true,
    'рыбок ' + sea.swim + ', больших ' + sea.friends);
  // v1.3.11: заказчик видел одних медуз — теперь обитатели разные и сменяются.
  // v1.3.12: заказчик попросил «больше разных морских существ… периодически
  // проплывали дельфины, косатки, скаты и т. д.» — стало больше двадцати.
  // v1.3.25: приплывают в случайном порядке, поэтому проверяем не очередь, а то,
  // что выпадает каждый вид и трое в воде всегда разные.
  ok('Большие обитатели все разные, и любой из них может приплыть (не одни медузы)',
    sea.friendsUniq === sea.friends && sea.friendsCycle === sea.friendsAll && sea.friendsAll >= 20,
    'в воде ' + sea.friends + ' разных из ' + sea.friendsAll +
    ', случайно выпадает ' + sea.friendsCycle);
  // Состав должен не просто существовать, а меняться по ходу игры
  ok('Состав больших обитателей сменяется: один уплыл к краю — другой приплыл',
    sea.friendsAfter !== sea.friendsBefore &&
    sea.friendsAfterN === 3 && sea.friendsAfterUniq === 3,
    'было ' + sea.friendsBefore + ' → стало ' + sea.friendsAfter);

  // Заказчик v1.3.11: «в ачивки конечно нужно добавить, когда поймана половина рыб
  // и когда пойманы все виды рыб, у нас же игровая механика». Такие достижения есть
  // (20 / 50 / 100), но проверяем не наличие записи, а саму механику: открываются
  // они ровно на своих порогах и показывают прогресс «сколько из скольки».
  const milestones = (function () {
    // Данные берём из песочницы: const-объявления игры не становятся свойствами
    // её глобального объекта (тот же приём, что и в блоке подводного мира)
    const G = (n) => (typeof sandbox[n] !== 'undefined') ? sandbox[n]
      : (sandbox.window && typeof sandbox.window[n] !== 'undefined') ? sandbox.window[n] : undefined;
    const list = G('ACHIEVEMENTS') || [];
    const byId = {};
    list.forEach(a => { byId[a.id] = a; });
    const ids = (G('FISH_SPECIES') || []).map(x => x.id);
    const fishIds = ['fishAll', 'fishExpert', 'fishMaster'];

    const savedSeen = S.fishSeen;
    const savedAch = (S.achievements || []).slice();

    const at = (n) => {
      // Сбрасываем только «рыбные» достижения, чтобы увидеть, что откроется именно сейчас
      S.achievements = (S.achievements || []).filter(id => fishIds.indexOf(id) === -1);
      S.fishSeen = {};
      for (let i = 0; i < n && i < ids.length; i++) S.fishSeen[ids[i]] = 1;
      return S.checkAchievements().map(a => a.id).filter(id => fishIds.indexOf(id) !== -1).join(',');
    };
    const at19 = at(19);
    const at20 = at(20);
    const at50 = at(50);
    const at100 = at(100);
    const prog = byId.fishExpert ? S.achievementProgress(byId.fishExpert) : { value: 0, goal: 0 };

    S.fishSeen = savedSeen;
    S.achievements = savedAch;
    return {
      defs: !!(byId.fishAll && byId.fishExpert && byId.fishMaster),
      goals: [byId.fishAll && byId.fishAll.goal, byId.fishExpert && byId.fishExpert.goal,
        byId.fishMaster && byId.fishMaster.goal].join('/'),
      at19: at19, at20: at20, at50: at50, at100: at100,
      prog: prog.value + '/' + prog.goal
    };
  })();
  ok('Половина улова и все сто видов — достижения с настоящими порогами 20 / 50 / 100',
    milestones.defs && milestones.goals === '20/50/100' &&
    // На 19 видах — ещё ничего; дальше каждый порог добавляет ровно свою ступень
    // (на 50 в списке есть и «Ихтиолог» — он открылся раньше и остаётся открытым)
    milestones.at19 === '' &&
    milestones.at20.indexOf('fishAll') !== -1 && milestones.at20.indexOf('fishExpert') === -1 &&
    milestones.at50.indexOf('fishExpert') !== -1 && milestones.at50.indexOf('fishMaster') === -1 &&
    milestones.at100.indexOf('fishMaster') !== -1 &&
    milestones.prog === '100/50',
    'пороги ' + milestones.goals + '; 19 видов → ' + (milestones.at19 || 'ничего') +
    '; 20 → ' + milestones.at20 + '; 50 → ' + milestones.at50 +
    '; 100 → ' + milestones.at100 + '; прогресс «' + milestones.prog + '»');
  ok('Клюёт только рыбка: больших обитателей поймать нельзя',
    sea.friendCaught === false && sea.hint.length > 0 && sea.hint.indexOf('Черепаха') === 0,
    'подсказка: ' + sea.hint.slice(0, 70));
  ok('Улов рыбалки копится по разным видам и сохраняется в профиле',
    sea.caught === 6 && sea.seen >= 2 && sea.ach === 3,
    'поймано ' + sea.caught + ', разных видов в улове ' + sea.seen + ', ступеней коллекции ' + sea.ach);

  // Замечание заказчика v1.3.12: «когда ловишь рыбу — постоянно надпись „Акула
  // уплывает“… думаю, „уплывает“ тут лишнее». Проверяем текст подсказки: осталось
  // имя и факт об обитателе, слово «уплывает» и приписка «не ловим» убраны.
  const hintNoFloat = sea.hint.indexOf('уплывает') === -1 && sea.hint.indexOf('не ловим') === -1 &&
    sea.hint.indexOf('Черепаха') === 0 && sea.hint.indexOf('Живёт больше ста лет') !== -1;
  ok('В подсказке о большом обитателе нет слов «уплывает» и «не ловим» — только имя и факт', hintNoFloat,
    'подсказка: ' + sea.hint.slice(0, 80));

  // Замечание заказчика v1.3.12: «слишком быстро пропадает информация о пойманных
  // рыбах… детям это сложно прочитать». Проверяем реальные таймеры: пойманная рыба
  // держится на экране не меньше 12 секунд, у нового вида — ещё дольше.
  const catchTimers = (function () {
    const qs2 = boot.scenes.quiet;
    qs2.init();
    qs2.startGame('fish');
    const f = qs2.fish;
    f.state = 'bite'; f.biteWindow = 2; f.biteFish = qs2.pickBiter();
    qs2.tryFish();
    const first = qs2.resultTimer;
    let longest = first;
    for (let i = 0; i < 12; i++) {
      f.state = 'bite'; f.biteWindow = 2; f.biteFish = qs2.pickBiter();
      qs2.tryFish();
      if (qs2.resultTimer > longest) longest = qs2.resultTimer;
    }
    return { first: first, longest: longest };
  })();
  ok('Плашка о пойманной рыбе держится долго — ребёнку хватает времени прочитать',
    catchTimers.first >= 12 && catchTimers.longest >= 12,
    'первая ' + catchTimers.first + ' с, максимум ' + catchTimers.longest + ' с (было 5–6 с)');

  // Плашку можно убрать тапом мимо неё, и этот тап не считается неудачной
  // подсечкой; тап по самой плашке её не закрывает (ребёнок дочитывает факт).
  const tapAway = (function () {
    const qs2 = boot.scenes.quiet;
    qs2.init();
    qs2.startGame('fish');
    const f = qs2.fish;
    f.state = 'bite'; f.biteWindow = 2; f.biteFish = qs2.pickBiter();
    qs2.tryFish();
    const before = qs2.resultTimer;
    const box = qs2.resultPlateBox();
    // по плашке — читаем дальше (таймер не сбросился)
    qs2.handleClick(box.x + box.w / 2, box.y + box.h / 2);
    const onPlate = qs2.resultTimer;
    // мимо плашки — убираем, и это не «Рано!»
    const hit = qs2.handleClick(box.x + box.w + 8, box.y + 8);
    const after = qs2.resultTimer;
    return { before: before, onPlate: onPlate, hit: hit, after: after };
  })();
  ok('Тап мимо плашки убирает её и не считается промахом (по плашке — читаем дальше)',
    tapAway.before > 0 && tapAway.onPlate === tapAway.before && tapAway.hit === true && tapAway.after === 0,
    'было ' + tapAway.before + ' с → на плашке ' + tapAway.onPlate + ' с → мимо ' + tapAway.after + ' с');

  // Замечание заказчика v1.3.12: «чтобы можно было посмотреть всю коллекцию рыб,
  // которых ты уже поймал… поймал новую — там в списке появлялось. И чтобы это было
  // в достижениях логично отображено». Коллекция — экран внутри «Информации»
  // (вкладка достижений): проверяем, что он рисуется, что пойманный вид попадает
  // в список по имени, что «не пойманные» скрыты под «???» и что кнопка перехода
  // есть и в достижениях, и в строке «Ихтиолога».
  const collection = (function () {
    const st = boot.scenes.stats;
    const fish = (typeof sandbox.FISH_SPECIES !== 'undefined') ? sandbox.FISH_SPECIES : [];
    S.fishSeen = {};
    // ловим три разных вида и смотрим, что они появились в коллекции
    const caught = [fish[0], fish[10], fish[40]];
    caught.forEach((sp, i) => {
      for (let k = 0; k <= i; k++) S.markFishCaught(sp.id);
    });
    st.init();
    st.tab = 'ach';
    st.draw(boot.ctx);
    const entryBtn = (st.buttons || []).filter(b => b.action === 'fishCollection').length;
    st.fishMode = true;
    st.draw(boot.ctx);
    const drawn = [];
    const orig = boot.ctx.fillText;
    boot.ctx.fillText = function (txt, x, y) {
      drawn.push(String(txt));
      return orig ? orig.call(this, txt, x, y) : undefined;
    };
    st.draw(boot.ctx);
    boot.ctx.fillText = orig;
    const text = drawn.join(' | ');
    const back = (st.buttons || []).filter(b => (b.text || '').indexOf('Назад') !== -1).length;
    const arrows = (st.buttons || []).filter(b => b.action === 'fishUp' || b.action === 'fishDown').length;
    // тап «Назад» возвращает к достижениям, а не на карту
    st.handleClick(60, boot.height - 30);
    return {
      entryBtn: entryBtn, back: back, arrows: arrows,
      sawNames: caught.every(sp => text.indexOf(sp.name) !== -1),
      sawCaption: text.indexOf('Коллекция рыб') !== -1,
      sawProgress: text.indexOf('Поймано 3 из ') !== -1,
      sawHidden: text.indexOf('???') !== -1,
      sawGoal: text.indexOf('Следующая цель') !== -1,
      closed: st.fishMode === false
    };
  })();
  ok('Коллекция рыб: вход из достижений, пойманные виды по именам, есть прогресс и цель',
    collection.entryBtn >= 1 && collection.sawNames && collection.sawCaption &&
    collection.sawProgress && collection.sawHidden && collection.sawGoal && collection.closed,
    'кнопок входа ' + collection.entryBtn + ', имена пойманных видны: ' + (collection.sawNames ? 'да' : 'нет') +
    ', прогресс: ' + (collection.sawProgress ? 'да' : 'нет') + ', скрытые «???»: ' + (collection.sawHidden ? 'да' : 'нет') +
    ', цель видна: ' + (collection.sawGoal ? 'да' : 'нет') + ', «Назад» закрывает: ' + (collection.closed ? 'да' : 'нет'));
  ok('Коллекция рыб: есть «Назад» и листание длинного списка',
    collection.back >= 1 && collection.arrows >= 1,
    'кнопок «Назад» ' + collection.back + ', стрелок листания ' + collection.arrows);

  // Замечание заказчика v1.3.10: «информация о рыбах не влезает в экран» —
  // длинный факт должен переноситься по словам, а не ужиматься в одну строку
  const bannerSrc = fs.readFileSync(path.join(ROOT, 'www', 'js', 'game_quiet.js'), 'utf8');
  ok('Факт о рыбе показывается в несколько строк, а не в одну обрезанную',
    bannerSrc.indexOf('wrapLines(ctx, this.result') !== -1 &&
    bannerSrc.indexOf('lines.forEach((line, i) =>') !== -1 &&
    bannerSrc.indexOf('const bh = Math.max(42, lines.length * lh + pad + 4)') !== -1);

  // Замечание заказчика v1.3.11: «информация внизу „Рыбок ловим, а черепах, акул и
  // осьминогов — только разглядываем“ — явно не нужная». Постоянной надписи нет,
  // а объяснение осталось: оно появляется, когда большой обитатель идёт мимо крючка.
  ok('Ненужной надписи внизу нет, а объяснение «не ловим» всплывает по делу',
    bannerSrc.indexOf('Рыбок ловим') === -1 &&
    bannerSrc.indexOf('friendHintText') !== -1 &&
    bannerSrc.indexOf('friendHint > 0') !== -1);

  // Замечание заказчика v1.3.12: «музыка пока что очень заунывная, сделай повеселей
  // будто детские мелодии какие-нибудь». Причина нашлась в коде: мелодия была
  // записана СТУПЕНЯМИ гаммы, а игралась как полутоны — поэтому в до-мажорной
  // песенке звучали фа-диез и ми-бемоль. Проверяем четыре вещи: нет низкого гула,
  // все ноты идут по гамме (без фальши), у мелодий живой ритм (есть восьмые и
  // половинные), и фраза кончается на тонике — как в детской песенке.
  // Внимание: имя A в этом файле занято конфигом гимнастики, поэтому AudioSys
  // берём из песочницы под своим именем.
  const AU = sandbox.AudioSys || {};
  const moodBass = (AU.MUSIC_TUNES || []).every(t =>
    AU.musicParseBass(t.bass, 16).every(n => n.i >= -12));
  const umPahCheck = (function () {
    const buf = [];
    if (!AU.musicUmPah) return { ivs: 0, count: 0 };
    AU.musicUmPah(AU.musicTune(), 0.5, 0, buf);
    const ivs = {};
    buf.forEach(e => { ivs[Math.round(12 * Math.log2(e.freq / 261.63))] = 1; });
    return { ivs: Object.keys(ivs).length, count: buf.length };
  })();
  const kidSong = (function () {
    const MAJOR = [0, 2, 4, 5, 7, 9, 11];
    const pc = v => ((Math.round(v) % 12) + 12) % 12;
    const scale = AU.MUSIC_SCALE || [];
    const scaleOk = scale.length >= 11 && scale.every(v => MAJOR.indexOf(pc(v)) !== -1);
    const bad = (AU.MUSIC_TUNES || []).filter(t => {
      const lead = AU.musicParseLead(t.lead);
      const stepsOk = lead.every(n => MAJOR.indexOf(pc(AU.musicScaleStep(n.i))) !== -1);
      const rhythm = lead.some(n => n.d < 1);   // есть восьмые — рисунок не «ровный шаг»
      const endOk = [0, 7].indexOf(lead[lead.length - 1].i) !== -1;   // фраза — на тонику
      const beats = AU.musicParseLead(t.lead).reduce((mx, n) => Math.max(mx, n.b + n.d), 0);
      return !(stepsOk && rhythm && endOk && lead.length >= 12 && beats <= 16);
    });
    return { scaleOk: scaleOk, bad: bad.length, steps: scale.length };
  })();
  ok('Музыка весёлая и детская: без гула, вся по гамме, с ритмом и концом на тонике',
    moodBass && umPahCheck.ivs >= 2 && umPahCheck.count === 16 && kidSong.scaleOk &&
    kidSong.bad === 0 && AU.MUSIC_MOODS.home.bpm >= 130,
    'ступеней в гамме ' + kidSong.steps + ', нот «ум-пах» ' + umPahCheck.count +
    ', интервалов ' + umPahCheck.ivs + ', темп дома ' + AU.MUSIC_MOODS.home.bpm +
    ', песенок с огрехами ' + kidSong.bad);

  /* ---------- Созвездие каждый раз новое (замечание заказчика) ---------- */
  const starsUniq = (function () {
    const qs = boot.scenes.quiet;
    const wW = boot.width, wH = boot.height;
    const A = { x: wW * 0.08, y: wH * 0.16, w: wW * 0.84, h: wH * 0.54 };
    const shapes = {}; let minGap = 1e9, outside = 0, collected = 0, count = 0;
    qs.init();
    for (let n = 0; n < 12; n++) {
      qs.initStars();
      const pts = qs.stars.points.map(p => ({ x: A.x + A.w * p[0], y: A.y + A.h * p[1] }));
      count += pts.length;
      shapes[qs.stars.points.map(p => p[0].toFixed(3) + ',' + p[1].toFixed(3)).join(';')] = 1;
      pts.forEach(p => { if (p.x < A.x || p.x > A.x + A.w || p.y < A.y || p.y > A.y + A.h) outside++; });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          minGap = Math.min(minGap, Math.sqrt(Math.pow(pts[i].x - pts[j].x, 2) + Math.pow(pts[i].y - pts[j].y, 2)));
        }
      }
      pts.forEach(p => qs.clickStars(p.x, p.y));
      if (qs.stars.done) collected++;
    }
    return { unique: Object.keys(shapes).length, stars: count / 12,
             minGap: Math.round(minGap), outside: outside, collected: collected };
  })();
  ok('Созвездие каждый раз новое (12 запусков — 12 разных рисунков)',
    starsUniq.unique >= 11 && starsUniq.stars === 9,
    starsUniq.unique + ' уникальных из 12, звёзд по 9');
  ok('Звёзды не налезают друг на друга, но созвездие собирается тапами',
    starsUniq.minGap >= 40 && starsUniq.outside === 0 && starsUniq.collected === 12,
    'зазор ' + starsUniq.minGap + ' px, собрано ' + starsUniq.collected + ' из 12');

  /* ---------- Мини-игры: «Заново» и награда за партию (баги v1.2.3) ---------- */
  const mini = (function () {
    const ms = boot.scenes.minigames;
    const out = {};
    // 1. Крестики-нолики: доигранная партия сбрасывается кнопкой «Заново»
    ms.init(); ms.initTTT();
    ms.ttt.board = ['X', 'X', 'X', 'O', 'O', null, 'O', null, null];
    ms.ttt.over = true; ms.ttt.winner = 'X';
    ms.buttons = []; ms.draw(sandbox.__ctx);
    const tb = ms.buttons[1];
    out.tttClicked = ms.handleClick(tb.x + tb.w / 2, tb.y + tb.h / 2);
    out.tttCleared = ms.ttt.over === false && ms.ttt.winner === null && ms.ttt.board.every(c => c === null);
    // 2. Мозаика: награда ровно одна, и «Заново» работает после победы
    ms.init(); ms.initMemory(); ms.draw(sandbox.__ctx);
    S.coins = 0;
    const cols = 4, cs = Math.min(boot.width * 0.2, 70), gap = 6;
    const ox = (boot.width - (cols * (cs + gap) - gap)) / 2, oy = boot.height * 0.12;
    const at = i => ({ x: ox + (i % cols) * (cs + gap) + cs / 2, y: oy + Math.floor(i / cols) * (cs + gap) + cs / 2 });
    const m = ms.memory, seen = {};
    for (let i = 0; i < m.cards.length; i++) {
      const k = m.cards[i];
      if (seen[k] === undefined) { seen[k] = i; continue; }
      const a = at(seen[k]), b = at(i);
      ms.handleClick(a.x, a.y); ms.handleClick(b.x, b.y);
    }
    out.memAll = m.matched.every(x => x);
    out.afterWin = S.coins;
    const extra = at(0);
    ms.handleClick(extra.x, extra.y); ms.handleClick(extra.x, extra.y);
    out.afterExtra = S.coins;
    const mb = ms.buttons[1];
    out.memClicked = ms.handleClick(mb.x + mb.w / 2, mb.y + mb.h / 2);
    out.afterRestart = S.coins;
    out.memRestarted = ms.memory !== m && ms.memory.matched.every(x => x === false) && ms.memory.done === false;
    return out;
  })();
  ok('Крестики-нолики: «Заново» работает и после победы',
    mini.tttClicked === true && mini.tttCleared === true);
  ok('Мозаика: награда одна за партию, лишние клики монет не дают',
    mini.memAll === true && mini.afterWin === 15 && mini.afterExtra === 15 && mini.afterRestart === 15,
    'после победы ' + mini.afterWin + ', после лишних кликов ' + mini.afterExtra);
  ok('Мозаика: «Заново» после победы начинает партию с чистого поля',
    mini.memClicked === true && mini.memRestarted === true);

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

  /* ---------- Сон: карта и дом закрывают «дела с питомцем» (v1.2.1) ---------- */
  // Раньше спящего питомца можно было увести в музей, на работу и в спортзал:
  // проверки смотрели на доступность локации, а не на состояние сна.
  let sleepUi = { ok: true, info: '' };
  try {
    const map = boot.scenes.map, home = boot.scenes.home;
    S.resetProgress();
    S.isSleeping = true;
    S.stats.energy = 40;
    boot.currentScene = 'map';
    map.init();
    map.draw(sandbox.__ctx);
    const tile = map.locationButtons.find(b => b.loc.id === 'museums');
    boot.handleClick(tile.x + tile.w / 2, tile.y + tile.h / 2);
    const stayedOnMap = boot.currentScene === 'map';
    const tileClosed = !S.isLocationAvailable('museums');
    const acts = home.actionsList();
    const off = acts.filter(a => a.off).map(a => a.action);
    const awakeOnlyOff = ['feed', 'bathe', 'play', 'music'].every(a => off.indexOf(a) !== -1);
    const freeOpen = ['sleep', 'quiet', 'decorToggle', 'map'].every(a => off.indexOf(a) === -1);
    S.stats.hunger = 50;
    home.doAction('feed');
    const notFed = S.stats.hunger === 50;
    sleepUi.ok = stayedOnMap && tileClosed && awakeOnlyOff && freeOpen && notFed;
    sleepUi.info = 'карта ' + (stayedOnMap ? 'держит' : 'уводит') +
      ', плитка ' + (tileClosed ? 'закрыта' : 'открыта') +
      ', закрыто дома: ' + off.join(', ') +
      ', кормление ' + (notFed ? 'заблокировано' : 'сработало');
  } catch (e) { sleepUi.ok = false; sleepUi.info = e.message; }
  ok('Пока гофер спит, карта и дом не дают заниматься делами', sleepUi.ok, sleepUi.info);
  S.isSleeping = false;
  S.resetProgress();

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
  // Фаззинг мог случайно уложить питомца спать или открыть туториал (случайный
  // клик по «❓» в меню) — состояние стенда возвращаем сами, иначе следующие
  // проверки видят «сон» или туториал и валятся на пустом месте: именно это
  // делало проверку похода по карте «мигающей».
  S.isSleeping = false;
  boot.tutorialVisible = false;
  boot.currentScene = 'map';
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
  // Фаззинг мог потратить энергию и монеты — приводим состояние к обычному
  // старту, иначе значки ⚡ просто негде рисовать (проверка была «плавающей»).
  S.resetProgress();
  S.isSleeping = false;
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
  // Раньше «Одежда» не листалась: товары висели ниже экрана, и купить их
  // было нельзя. Еда/игрушки/веселье объявлены строками в исходнике магазина,
  // а «Одежда» (v1.3) собирается из каталогов: 1 «Без нарядов» + все наряды
  // OUTFITS + все окрасы FURS — поэтому её считаем по каталогам, а не по строкам.
  const shopSrc = fs.readFileSync(path.join(WWW, 'game_shop.js'), 'utf8');
  const expects = {};
  ['food', 'toys', 'fun'].forEach(t => {
    expects[t] = (shopSrc.match(new RegExp("category: '" + t + "'", 'g')) || []).length;
  });
  expects.clothes = 1 + sandbox.OUTFITS.length + sandbox.FURS.length;
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
  /* ---------- ДОСТИЖЕНИЯ: движок и темп прогресса (v1.2.2) ---------- */
  // Заказчик: «ачивки должны работать, и нельзя за первый же день взять все —
  // должны быть вещи, на которые нужны месяцы».
  const cat = S.achievementList();
  ok('Каталог достижений читается игрой и разбит на ступени',
    cat.length >= 25 && S.achievementTiers().length === 4,
    cat.length + ' достижений, ' + S.achievementTiers().map(t => t.name).join(' → '));
  const broken = cat.filter(a => !a.id || !a.emoji || !a.name || !a.desc || !(a.goal > 0) || typeof a.of !== 'function');
  ok('У каждого достижения есть цель и описание, id не повторяются',
    broken.length === 0 && new Set(cat.map(a => a.id)).size === cat.length,
    broken.length ? ('сломаны: ' + broken.map(a => a.id).join(', ')) : cat.length + ' записей');
  const longTerm = ['days7', 'streak7', 'days30', 'streak30', 'days100', 'days180', 'days365',
    'streak100', 'streak365', 'level20', 'trips200', 'museumsFull'].filter(id => cat.some(a => a.id === id));
  ok('Есть достижения «на месяцы»: 30/100/180/365 дней, серии 100/365 и вся коллекция музеев',
    longTerm.length === 12 && cat.find(a => a.id === 'days365').goal === 365 &&
    cat.filter(a => a.tier === 'month').length >= 12,
    'долгих целей ' + longTerm.length + ', «месячных» ' + cat.filter(a => a.tier === 'month').length +
    ' из ' + cat.length);

  S.resetProgress();
  const feedAch = (function () {
    S.popupQueue = []; S.lastPopup = null;
    const home2 = boot.scenes.home;
    home2.init(); home2.draw(sandbox.__ctx);
    home2.doAction('feed');
    return { open: S.isAchUnlocked('first_feed'), popup: S.lastPopup ? S.lastPopup.text : '',
             again: S.addAch('first_feed') };
  })();
  ok('Кормление открывает «Первая еда» и показывает плашку с названием',
    feedAch.open === true && feedAch.popup.indexOf('Первая еда') !== -1, 'плашка: «' + feedAch.popup + '»');
  ok('Достижение не открывается дважды', feedAch.again === false && S.unlockedCount() === 1);

  // Достижения подключены к настоящим действиям: поход по карте и покупка вещей
  const tripAch = (function () {
    S.resetProgress();
    const map = boot.scenes.map;
    // Клик уходит в активную сцену: ставим карту явно (до этого активной
    // оставалась «тихая игра» из соседнего блока — проверка была хрупкой)
    boot.currentScene = 'map';
    map.init(); map.draw(sandbox.__ctx);
    const tile = (map.locationButtons || []).filter(b => b.loc && b.loc.id === 'park')[0];
    boot.handleClick(tile.x + tile.w / 2, tile.y + tile.h / 2);
    return { open: S.isAchUnlocked('first_trip'), counter: S.progress.trips };
  })();
  ok('Поход по карте открывает «Первый поход»', tripAch.open === true && tripAch.counter === 1,
    'походов ' + tripAch.counter);
  const homeAch = (function () {
    S.resetProgress();
    S.coins = 9000;
    ['plant', 'clock', 'lamp', 'carpet', 'painting'].forEach(id => S.buyFurniture(id, 'living'));
    return { open: S.isAchUnlocked('home5'), counter: S.progress.furniture };
  })();
  ok('Покупка вещей в дом открывает «Уютный дом» (счётчик покупок работает)',
    homeAch.open === true && homeAch.counter === 5, 'куплено ' + homeAch.counter + ' вещей');

  S.resetProgress();
  const sameDay = [S.registerDay(), S.registerDay(), S.registerDay()];
  ok('День считается один раз, сколько бы раз ни открыли игру',
    S.progress.days === 1 && S.progress.streak === 1 && sameDay.every(x => x === false),
    'три захода → дней ' + S.progress.days);
  const streak = (function () {
    S.resetProgress();
    S.progress.days = 0; S.progress.streak = 0; S.progress.lastDay = null;
    const base = Date.UTC(2030, 0, 1, 12), day = 86400000;
    S.registerDay(base); S.registerDay(base + day);
    const two = S.progress.streak;
    S.registerDay(base + 3 * day);
    const skipped = S.progress.streak;
    const days = S.progress.days;
    S.registerDay(base + day);         // часы назад
    return { two: two, skipped: skipped, same: S.progress.days === days };
  })();
  ok('Пропуск дня обнуляет серию, перевод часов назад дни не накручивает',
    streak.two === 2 && streak.skipped === 1 && streak.same === true);

  // «Жёсткий» первый день: все счётчики в цели, но дней = 1
  const hard = (function () {
    S.resetProgress();
    const p = S.progress;
    p.trips = 999; p.minigames = 999; p.quiet = 999; p.tttWins = 99;
    p.rpsWins = 99; p.guessWins = 99; p.letterWins = 99; p.mixWins = 99; p.simonBest = 99;
    p.feeds = 99; p.washes = 99; p.plays = 99; p.sleeps = 99; p.furniture = 99; p.coinsEarned = 99999;
    S.coins = 99999; S.addXP(99999);
    Object.keys(S.stats).forEach(k => { S.stats[k] = 99; });
    sandbox.MUSEUM_CATEGORIES.forEach(c => { for (let i = 0; i < 20; i++) S.markSeen(c, c + ':q' + i); });
    S.checkAchievements();
    return cat.filter(a => !S.isAchUnlocked(a.id)).map(a => a.id);
  })();
  ok('Даже с заполненными счётчиками дневные достижения за один день не взять',
    ['days7', 'streak7', 'days30', 'streak30', 'days100', 'days180', 'days365', 'streak100', 'streak365']
      .every(id => hard.indexOf(id) !== -1) &&
    hard.length >= 6 && hard.length <= cat.length * 0.4,
    'закрыты за первый день: ' + hard.length + ' из ' + cat.length);

  // Симуляция настоящей игры: дни по календарю + реальный доход за день
  const pace = (function () {
    S.resetProgress();
    S.popupQueue = []; S._popupShownAt = 0;
    S.progress.days = 0; S.progress.streak = 0; S.progress.lastDay = null;
    const base = Date.UTC(2030, 0, 1, 12), day = 86400000;
    const play = (i, full) => {
      S.registerDay(base + i * day);
      const p = S.progress;
      p.trips += full ? 6 : 2; p.minigames += full ? 4 : 1; p.quiet += full ? 3 : 1;
      p.feeds += full ? 3 : 2; p.washes += 1; p.plays += full ? 3 : 1; p.tttWins += 1;
      // Мини-игры (v1.3.16): «камень, ножницы, бумага» и «Огоньки» — их достижения
      // тоже должны открываться за год игры
      p.rpsWins += full ? 2 : 1;
      p.simonBest = Math.max(p.simonBest || 0, full ? 8 : 4);
      p.guessWins += 1; p.letterWins += 1; p.mixWins += 1;
      if (full) p.furniture += 1;
      S.stats.energy = 45; S.startSleep(); S.tick(600000);
      S.earnCoins(full ? 120 : 40); S.addXP(full ? 250 : 70);
      S.stats.workSkill = Math.min(100, S.stats.workSkill + (full ? 8 : 3));
      S.stats.schoolSkill = Math.min(100, S.stats.schoolSkill + (full ? 6 : 2));
      S.stats.intelligence = Math.min(100, S.stats.intelligence + (full ? 6 : 1));
      // Уход из настоящих кнопок дома: покормил, искупал, поиграл
      if (full) { S.stats.hunger = 95; S.stats.cleanliness = 92; S.stats.happiness = 95; S.stats.health = 95; }
      if (full) sandbox.MUSEUM_CATEGORIES.forEach((c, k) => { for (let j = 0; j < 2; j++) S.markSeen(c, c + ':d' + i + '-' + k + '-' + j); });
      // Рыбалка (v1.3.9): за «полные» дни наш герой успевает поймать весь улов —
      // так симуляция года проверяет и достижение «Ихтиолог»
      if (full && sandbox.FISH_SPECIES) sandbox.FISH_SPECIES.forEach(f => { S.fishSeen[f.id] = 1; });
    };
    const at = {};
    play(0, true); at.day1 = S.unlockedCount();
    for (let i = 1; i < 400; i++) {
      play(i, i < 30 || i % 3 === 0);
      if (i === 6) at.day7 = S.unlockedCount();
      if (i === 29) at.day30 = S.unlockedCount();
      if (i === 99) at.day100 = S.unlockedCount();
    }
    at.day400 = S.unlockedCount();
    at.total = cat.length;
    at.locked = cat.filter(a => !S.isAchUnlocked(a.id)).map(a => a.id);
    return at;
  })();
  ok('Темп: за первый вечер — меньше трети каталога, за год — весь каталог',
    pace.day1 <= Math.ceil(pace.total * 0.35) && pace.day7 < pace.day30 &&
    pace.day30 < pace.day400 && pace.day400 === pace.total,
    pace.day1 + ' → ' + pace.day7 + ' → ' + pace.day30 + ' → ' + pace.day100 + ' → ' + pace.day400 +
    ' (тупиков: ' + pace.locked.length + ')');

  // Сохранение: достижения и дни переживают перезапуск, мусор вычищается
  S.resetProgress();
  S.progress.days = 12; S.progress.streak = 4; S.checkAchievements();
  const beforeSave = S.unlockedCount();
  S.achievements = ['unknown_from_old_version'].concat(S.achievements);
  S.saveGame();
  S.achievements = []; S.progress = null;
  const loaded = S.loadGame();
  ok('Достижения и дни переживают сохранение, мусорные id вычищаются',
    loaded === true && S.unlockedCount() === beforeSave && S.progress.days === 12 &&
    S.progress.streak === 4 && S.achievements.indexOf('unknown_from_old_version') === -1,
    'открыто до ' + beforeSave + ' → после ' + S.unlockedCount() + ', дней ' + S.progress.days +
    ', мусор: ' + (S.achievements.indexOf('unknown_from_old_version') === -1 ? 'убран' : 'ОСТАЛСЯ'));

  // Экран: строки внутри области списка, закрытое — с 🔒
  const achScreen = (function () {
    S.resetProgress();
    const sc = boot.scenes.stats;
    const texts = [];
    const rec = new Proxy({}, {
      get(t, p) {
        if (p === 'canvas') return { width: 360, height: 640 };
        if (p === 'measureText') return s => ({ width: String(s).length * 6 });
        if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
        return (...a) => { if (p === 'fillText') texts.push(String(a[0])); };
      },
      set() { return true; }
    });
    sc.init(); sc.tab = 'ach';
    sc.draw(sandbox.__ctx);
    const view = sc.achView, maxScroll = sc.achMaxScroll;
    let outside = 0;
    [0, 200, maxScroll].forEach(off => {
      sc.achScroll = off; sc.draw(sandbox.__ctx);
      sc.achRows.forEach(r => { if (r.y < view.top - 0.5 || r.y + r.h > view.bottom + 0.5) outside++; });
    });
    const arrows = (sc.buttons || []).filter(b => b.action === 'achUp' || b.action === 'achDown');
    sc.achScroll = 1e6;
    sc.draw(sandbox.__ctx);
    const backArrow = (sc.buttons || []).some(b => b.action === 'achUp');
    texts.length = 0;
    sc.drawAchRow(rec, cat[0], 360, 200, 46);
    const lockedRow = texts.slice();
    S.addAch(cat[0].id, { silent: true });
    texts.length = 0;
    sc.drawAchRow(rec, cat[0], 360, 200, 46);
    const openRow = texts.slice();
    // Награда не отбирается: монеты потратил — достижение осталось открытым
    S.coins = 400; S.checkAchievements();
    S.coins = 0;
    const rich = cat.find(a => a.id === 'rich200');
    texts.length = 0;
    sc.drawAchRow(rec, rich, 360, 200, 46);
    return { maxScroll: maxScroll, outside: outside, lockedRow: lockedRow, openRow: openRow,
             richRow: texts.slice(), richUnlocked: S.isAchUnlocked('rich200'), richEmoji: rich.emoji,
             arrowTexts: arrows.map(b => b.text), backArrow: backArrow,
             bottom: view.bottom, height: boot.height };
  })();
  ok('Вкладка 🏆: список листается и не уезжает под кнопку «Назад»',
    achScreen.maxScroll > 0 && achScreen.outside === 0 && achScreen.bottom <= achScreen.height - 50,
    'листание ' + Math.round(achScreen.maxScroll) + ' px, строк вне области: ' + achScreen.outside);
  ok('Стрелки листания нарисованы (не «кнопки-невидимки») и стрелка вверх есть внизу списка',
    achScreen.arrowTexts.length > 0 && achScreen.arrowTexts.every(t => t === '▲' || t === '▼') &&
    achScreen.backArrow === true,
    'подписи: ' + (achScreen.arrowTexts.join(' ') || 'нет') + ', внизу списка есть ▲: ' + achScreen.backArrow);
  ok('Закрытое достижение рисуется с 🔒, открытое — с эмодзи и подписью «открыто»',
    achScreen.lockedRow.indexOf('🔒') !== -1 && achScreen.lockedRow.indexOf(cat[0].emoji) === -1 &&
    achScreen.openRow.indexOf(cat[0].emoji) !== -1 && achScreen.openRow.indexOf('открыто') !== -1);
  ok('Полученную награду не отбирают: потратил монеты — достижение открыто и с эмодзи',
    achScreen.richUnlocked === true && achScreen.richRow.indexOf(achScreen.richEmoji) !== -1);

  S.resetProgress();
  S.isSleeping = false;
}

/* ---------- НАРЯДЫ И ГОЛОСА ГЕРОЕВ (v1.3) ---------- */
// Заказчик: «Милке нужны наряды и звуки, как и всем другим героям».
// Наряд — это слот (hat/glasses/neck/back), поэтому он садится на любого
// героя. Проверяем каталог, рисование, покупку, старые сохранения и код друга.
{
  const OUTF = sandbox.OUTFITS;
  const SLOTS = sandbox.OUTFIT_SLOTS;
  ok('Наряды: каталог не пустой, у каждого есть слот, имя, эмодзи и цена',
    OUTF.length >= 10 && OUTF.every(o => SLOTS.indexOf(o.slot) !== -1 && o.value && o.name && o.emoji &&
      o.desc && typeof o.cost === 'number' && o.cost >= 0),
    'нарядов ' + OUTF.length + ': ' + SLOTS.map(s => s + ' ' + sandbox.outfitsFor(s).length).join(', '));
  const oKeys = OUTF.map(o => o.slot + ':' + o.value);
  const oEmoji = OUTF.map(o => o.emoji);
  ok('Наряды: нет повторов слотов/значений и нет двух одинаковых эмодзи',
    new Set(oKeys).size === oKeys.length && new Set(oEmoji).size === oEmoji.length,
    'ключей ' + new Set(oKeys).size + ', эмодзи ' + new Set(oEmoji).size);
  ok('Наряды: в каждом слоте есть выбор (голова, глаза, шея, спина)',
    SLOTS.every(s => sandbox.outfitsFor(s).length >= 2),
    SLOTS.map(s => s + ':' + sandbox.outfitsFor(s).length).join(' '));

  // Наряд реально рисуется: у фигурки с нарядом вызовов рисования больше,
  // чем у той же фигурки без него (иначе «товар в магазине есть, а на герое
  // его не видно»). Заодно ловим исключения на всех 6 × 11 сочетаниях.
  const flagFor = (slot, value) => (slot === 'hat' ? 'hat' : slot === 'glasses' ? 'glasses'
    : slot === 'neck' ? (value === 'scarf' ? 'scarf' : 'bowtie') : (value === 'cape' ? 'cape' : 'backpack'));
  const drawCalls = (charId, apply) => {
    let calls = 0;
    const grad = { addColorStop() {} };
    const rec = new Proxy({
      canvas: { width: 400, height: 400 },
      measureText: () => ({ width: 10 }),
      createLinearGradient: () => grad,
      createRadialGradient: () => grad
    }, {
      get(t, p) { return p in t ? t[p] : function () { calls++; }; },
      set(t, p, v) { t[p] = v; return true; }
    });
    const fig = sandbox.createCharacter(charId, 100);
    if (apply) apply(fig);
    let err = null;
    try { fig.draw(rec, 200, 200, 1); } catch (e) { err = e.message; }
    return { calls: calls, err: err };
  };
  const invisible = [];
  sandbox.CHARACTERS.forEach(ch => {
    const base = drawCalls(ch.id, null).calls;
    OUTF.forEach(o => {
      const r = drawCalls(ch.id, fig => {
        fig[flagFor(o.slot, o.value)] = (o.slot === 'hat' || o.slot === 'glasses') ? o.value : true;
      });
      if (r.err) invisible.push(ch.name + ' + ' + o.name + ': ошибка ' + r.err);
      else if (r.calls <= base) invisible.push(ch.name + ' + ' + o.name + ': ничего не нарисовалось');
    });
  });
  ok('Каждый наряд виден на каждом герое (11 нарядов × 6 героев)',
    invisible.length === 0,
    invisible.length ? invisible.slice(0, 3).join('; ')
      : 'проверено ' + (OUTF.length * sandbox.CHARACTERS.length) + ' сочетаний');

  // Слот один: надета кепка — шеф-шапка снимается сама, шарф не мешает шапке
  S.resetProgress();
  S.setOutfit('hat', 'cap');
  S.setOutfit('neck', 'scarf');
  const oneSlot = S.look.hat === 'cap' && S.look.neck === 'scarf' && S.look.bowtie === false;
  S.setOutfit('hat', 'chef');
  ok('Наряды: слот один — новая шапка снимает старую, шарф остаётся',
    oneSlot && S.look.hat === 'chef' && S.look.neck === 'scarf',
    'надето: ' + JSON.stringify(S.lookOutfit()));
  S.clearOutfits();
  ok('Наряды: «Снять всё» очищает все слоты', Object.keys(S.lookOutfit()).length === 0);

  S.resetProgress();
  S.isSleeping = false;
}

/* ---------- НАРЯДЫ: ПОКУПКА, СОХРАНЕНИЯ, КОД ДРУГА, ГОЛОСА (v1.3) ---------- */
{
  // Покупка один раз: второй раз тот же наряд надевается бесплатно
  S.resetProgress();
  S.coins = 200;
  const bought = S.buyOutfit('hat', 'cap');
  S.setOutfit('hat', 'chef');
  S.buyOutfit('hat', 'cap');
  ok('Наряд покупается один раз и потом надевается бесплатно',
    bought && S.ownsOutfit('hat', 'cap') && S.look.hat === 'cap',
    'куплено: ' + S.ownedOutfits().join(', '));

  // Магазин: покупка списывает монеты, повторное надевание — нет
  const shop = boot.scenes.shop;
  const clickClothes = (slot, value) => {
    shop.init();
    shop.currentTab = 'clothes';
    shop.page = 0;
    shop.draw(sandbox.__ctx, boot.width, boot.height);
    const btn = shop.buttons.find(b => b.slot === slot && b.value === value);
    if (!btn) return false;
    return !!shop.handleClick(btn.x + 5, btn.y + 5);
  };
  S.resetProgress();
  S.coins = 500;
  const before = S.coins;
  const buy1 = clickClothes('hat', 'cap');
  const afterBuy = S.coins;
  S.setOutfit('hat', 'chef');
  const wear2 = clickClothes('hat', 'cap');
  const afterWear = S.coins;
  ok('Магазин: кепка списывает монеты один раз, второе надевание — бесплатно',
    buy1 && wear2 && afterBuy === before - 30 && S.look.hat === 'cap' && afterWear === afterBuy,
    'монет было ' + before + ', после покупки ' + afterBuy + ', после второго надевания ' + afterWear);
  shop.init();
  shop.currentTab = 'clothes';
  shop.page = 0;
  shop.draw(sandbox.__ctx, boot.width, boot.height);
  const outfitCards = shop.buttons.filter(b => b.slot).length;
  ok('Магазин: наряды лежат в разделе «Одежда» и видны как карточки',
    outfitCards > 0, 'карточек нарядов на странице: ' + outfitCards);

  // Старые сохранения: была только «бабочка» флагом bowtie; мусор снимаем
  const old = S.migrateLook({ hat: null, glasses: null, bowtie: true, fur: 'mint', char: 'bear' });
  const junk = S.migrateLook({ hat: 'sombrero', glasses: 'monocle', neck: 'tie', back: 'wings', fur: 'classic', char: 'gopher' });
  ok('Старое сохранение с «бабочкой» переносится в слот neck (наряд не теряется)',
    old.neck === 'bowtie' && old.bowtie === true, 'шляпа: ' + old.hat + ', шея: ' + old.neck);
  ok('Неизвестные наряды из будущих версий снимаются, игра не падает',
    junk.hat === null && junk.glasses === null && junk.neck === null && junk.back === null);

  // Код друга: v2 несёт наряды, старые коды v1 читаются по-прежнему
  S.resetProgress();
  S.setCharacter('milka');
  S.setFur('rose');
  S.setOutfit('hat', 'cap');
  S.setOutfit('neck', 'scarf');
  S.setOutfit('back', 'backpack');
  const codeV2 = S.getShortCode();
  const backV2 = S.unpackShortCode(codeV2.replace(/-/g, ''));
  ok('Короткий код (v2) несёт наряды друга: кепка, шарф и рюкзак',
    !!backV2 && backV2.look.char === 'milka' && backV2.look.hat === 'cap' &&
    backV2.look.neck === 'scarf' && backV2.look.back === 'backpack' && backV2.look.fur === 'rose',
    codeV2 + ' → ' + (backV2 ? [backV2.look.char, backV2.look.hat, backV2.look.neck, backV2.look.back].join('/') : 'нет'));
  const g1 = S.unpackShortCode('A206RG0000000 004'.replace(/[^0-9A-Z]/g, ''));
  const g2 = S.unpackShortCode('DC4T1JQE86HE0001');
  ok('Старые коды друзей (формат v1) читаются как раньше — друзья не теряются',
    !!g1 && !!g2 && g1.look.char === 'bunny' && g1.look.fur === 'mint' && g1.look.hat === 'crown' &&
    g1.look.glasses === 'nerd' && g1.look.neck === 'bowtie' && g1.level === 7 && g1.room.wall === 'warm' &&
    g2.look.char === 'milka' && g2.look.hat === 'scientist' && g2.room.floor === 'blue' &&
    g2.room.furniture.length === 4,
    'A206-RG00-0000-0004 → ' + (g1 ? g1.look.char + '/' + g1.look.hat + '/' + g1.look.neck : 'нет') +
    ', DC4T-1JQE-86HE-0001 → ' + (g2 ? g2.look.char + ', мебели ' + g2.room.furniture.length : 'нет'));
  ok('Испорченный короткий код по-прежнему отвергается',
    S.unpackShortCode('AAAAAAAAAAAAAAAA') === null);

  // Голоса: у каждого героя свой тембр, и он звучит из сцен
  const voices = sandbox.CHARACTERS.map(c => c.voice);
  const timbres = new Set(voices.map(v => v.base + '/' + v.type));
  ok('Голоса: у каждого из 6 героев свой тембр (не «один звук на всех»)',
    voices.every(v => v && v.base > 0 && v.type && v.steps.length >= 2 && v.dur > 0) &&
    timbres.size === sandbox.CHARACTERS.length,
    sandbox.CHARACTERS.map(c => sandbox.AudioSys.voiceHint(c.id)).join(' | '));
  ok('Голос героя можно послушать: AudioSys.voice играет ноты по описанию героя',
    typeof sandbox.AudioSys.voice === 'function' && typeof sandbox.AudioSys.playVoice === 'function' &&
    sandbox.AudioSys.voiceHint('milka').indexOf('Милка') === 0);
  const voiceSrc = ['game_menu.js', 'game_home.js', 'game_shop.js']
    .map(f => fs.readFileSync(path.join(WWW, f), 'utf8'));
  ok('Голос звучит при выборе героя, кормлении/купании/игре и покупке наряда',
    voiceSrc.every(txt => txt.indexOf('AudioSys.voice(') !== -1),
    'вызовов в сценах: ' + voiceSrc.reduce((n, txt) => n + (txt.match(/AudioSys\.voice\(/g) || []).length, 0));

  S.resetProgress();
  S.isSleeping = false;
}

/* ---------- НАЙДЕНО НА ЖИВОМ ANDROID (v1.3.0) ---------- */
// Прогон на эмуляторе Android 14 выявил две вещи, которых не видно в Chrome:
// 1) в меню после перезапуска герой был «раздет» (внешний вид грузился только
//    по кнопке «Продолжить») — теперь меню берёт внешний вид из сохранения;
// 2) в WebView буфер обмена недоступен, и кнопка «Вставить из буфера» молча
//    ничего не делала — теперь она объясняет путь через меню Android.
{
  S.resetProgress();
  S.look = S.migrateLook({ hat: 'cap', glasses: null, neck: 'scarf', back: 'backpack', fur: 'rose', char: 'milka' });
  S.saveGame();
  S.look = S.migrateLook({ fur: 'classic', char: 'gopher' });      // «свежий запуск»
  const restored = S.lookFromSave();
  const fig2 = sandbox.createCharacter('gopher', 100);
  S.applyLookTo(fig2);
  ok('Меню показывает героя в наряде из сохранения (после перезапуска не «раздет»)',
    restored === true && S.look.hat === 'cap' && S.look.neck === 'scarf' && S.look.back === 'backpack' &&
    S.look.char === 'milka' && fig2.hat === 'cap' && fig2.scarf === true && fig2.backpack === true,
    'вернулось: ' + JSON.stringify(S.lookOutfit()));

  const doc2 = sandbox.document;
  const origGet = doc2.getElementById;
  const hintStub = { textContent: 'старая подсказка' };
  const fieldStub = { value: '', style: { display: 'block' }, focus() {}, select() {} };
  const btnStub = { textContent: '', style: { display: 'block' }, onclick: null };
  const panelStub = { style: { display: 'none' } };
  doc2.getElementById = id => (id === 'clipHint' ? hintStub
    : id === 'clipField2' ? fieldStub
    : id === 'clipCopyBtn' ? btnStub
    : id === 'clipPanel' ? panelStub
    : origGet(id));
  let clickOk = false;
  try {
    sandbox.ClipBridge.attach();
    sandbox.ClipBridge.show({ mode: 'paste' });
    if (btnStub.onclick) { btnStub.onclick(); clickOk = true; }
  } catch (e) { clickOk = false; }
  const explainedHint = hintStub.textContent.indexOf('Буфер недоступен') !== -1;
  const focusedField = fieldStub.value === '';
  doc2.getElementById = origGet;
  ok('Кнопка «Вставить из буфера» объясняет, что делать, если буфер недоступен',
    clickOk && explainedHint, 'подсказка: ' + hintStub.textContent.slice(0, 56) + '…');
  const clipSrc = fs.readFileSync(path.join(WWW, 'helpers.js'), 'utf8');
  ok('Нажатие кнопки буфера не молчит: текст подсказки и фокус в поле кода (не «кнопка-пустышка»)',
    focusedField && clipSrc.indexOf('Буфер недоступен приложению') !== -1 &&
    clipSrc.indexOf('target.focus()') !== -1 && clipSrc.indexOf('target.select()') !== -1);

  S.resetProgress();
  S.isSleeping = false;
}

/* ---------- ФОНОВАЯ МУЗЫКА И ДВЕ ГАЛОЧКИ ЗВУКА (v1.3.1) ---------- */
// Заказчик: «хорошо бы сделать какую-нибудь фоновую музыку нейтральную, конечно,
// с возможностью отключения как музыки, так и звуков вообще, в настройках игры».
// Проверяем ровно это: петля есть и она «нейтральная», ноты расписываются,
// музыку и звуки можно выключить ПО ОТДЕЛЬНОСТИ, выбор помнит устройство.
{
  const A = sandbox.AudioSys;
  const store = sandbox.localStorage;

  // Заглушка звуковой системы: считает осцилляторы, как настоящий Web Audio
  const fakeCtx = () => {
    const ctx = {
      currentTime: 0, state: 'running', destination: {}, oscillators: 0,
      resume() { ctx.state = 'running'; },
      suspend() { ctx.state = 'suspended'; },
      createOscillator() {
        ctx.oscillators++;
        return {
          type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {}, start() {}, stop() {}
        };
      },
      createGain() {
        return {
          gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {},
                  exponentialRampToValueAtTime() {}, setTargetAtTime() {} },
          connect() {}
        };
      },
      // v1.3.12: музыка проходит через фильтры «выше и звонче» (обрез низа, подъём
      // на 2.6 кГц, воздух сверху) — в заглушке они тоже есть, иначе проверки
      // звука падали бы на «createBiquadFilter is not a function».
      filters: 0,
      createBiquadFilter() {
        ctx.filters++;
        return {
          type: '', frequency: { value: 0 }, Q: { value: 0 }, gain: { value: 0 },
          connect() {}
        };
      }
    };
    return ctx;
  };

  store.removeItem('gopherlife_audio');
  A.ctx = null;
  A.musicGain = null;
  A.musicPlaying = false;
  A.musicNotesPlayed = 0;
  A.musicCache = null;
  A.musicBoostUntil = 0;
  A.loadSettings();
  ok('Звук по умолчанию: и музыка, и звуки включены (пока родитель не выключил)',
    A.isMusicOn() && A.isSoundOn(), A.settingsHint());

  const tunes = A.MUSIC_TUNES;
  ok('Мелодий десять, и все разные (раньше на всю игру была одна петля)',
    tunes.length === 10 &&
    tunes.every(t => t.name && typeof t.lead === 'string' && typeof t.bass === 'string') &&
    new Set(tunes.map(t => t.lead)).size === tunes.length,
    tunes.map(t => t.name).join(', '));

  A.musicScene = 'home';
  const loop = A.musicTune();
  ok('Круг мелодии: 16 долей и три голоса — бас, мелодия и «звёздочки»',
    loop.beats === 16 && loop.bass.length === 4 && loop.lead.length >= 10 && loop.sparkle.length <= 3,
    '«' + loop.name + '»: нот ' + (loop.bass.length + loop.lead.length + loop.sparkle.length));

  const events = A.musicEvents('ambient');
  const sorted = events.every((e, i) => i === 0 || e.t >= events[i - 1].t);
  // v1.3.12: верхняя граница поднята с 900 Гц — мелодия теперь звучит ещё и на
  // октаву выше («стеклянный» голосок), чтобы музыка не казалась «из трубы».
  const inRange = events.every(e => e.freq > 90 && e.freq < 2000 && e.vol > 0 && e.dur > 0.2);
  const loopDur = A.musicLoopDuration('ambient');
  ok('Ноты круга разложены по времени и все в слышимом диапазоне',
    sorted && inRange && events[0].t === 0 && events[events.length - 1].t < loopDur,
    'круг ' + loopDur.toFixed(1) + ' с, нот ' + events.length);

  // «Нейтральная» музыка: все ноты — из одной пентатоники до-мажора (0 2 4 5 7 9 11).
  // Пентатоника без полутонов: даже случайное сочетание нот не звучит фальшиво.
  // Мелодия задана индексом в гамме, бас — сдвигом в полутонах от C4.
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const pc = v => ((v % 12) + 12) % 12;
  const offMajor = A.MUSIC_SCALE.filter(i => MAJOR.indexOf(pc(i)) === -1);
  const tuneChecks = tunes.map(t => {
    const lead = A.musicParseLead(t.lead);
    const bass = A.musicParseBass(t.bass, 16);
    const notesOk = lead.every(n => MAJOR.indexOf(pc(A.MUSIC_SCALE[n.i])) !== -1) &&
      bass.every(n => MAJOR.indexOf(pc(n.i)) !== -1) &&
      t.sparkle.every(s => MAJOR.indexOf(pc(A.MUSIC_SCALE[s[1]])) !== -1);
    const moves = new Set(lead.map(n => n.i)).size >= 3;   // это мелодия, а не одна нота
    return notesOk && moves;
  });
  ok('Все мелодии «нейтральные»: до-мажор, без режущих сочетаний, с движением',
    offMajor.length === 0 && tuneChecks.every(Boolean),
    'гамма: ' + A.MUSIC_SCALE.join(' ') + '; проблемных мелодий: ' +
    tuneChecks.filter(c => !c).length);

  // Смена музыки: круг за кругом мелодия и/или высота другие, повторов подряд нет
  const rotation = (function () {
    A.musicStart();                       // сбрасывает счётчики: начинаем с первого
    const keys = [], played = [];
    for (let i = 0; i < 8; i++) {
      const s = A.musicState();
      keys.push(s.tune + '@' + s.shift);
      if (played.indexOf(s.tune) === -1) played.push(s.tune);
      A.musicNextLoop();
    }
    const noRepeat = keys.every((k, i) => i === 0 || k !== keys[i - 1]);
    const pool = A.musicPool('home');
    return { noRepeat: noRepeat, played: played.length, pool: pool.length, first: keys[0], second: keys[1] };
  })();
  ok('Музыка меняется сама: подряд два круга не звучат одинаково',
    rotation.noRepeat && rotation.played === rotation.pool && rotation.first !== rotation.second,
    'круги: ' + rotation.first + ' → ' + rotation.second + ', мелодий пула услышано ' +
    rotation.played + ' из ' + rotation.pool);

  ok('Сдвиг круга (0 / +2 / −2 / +4 полутона) поднимает все голоса вместе',
    A.MUSIC_SHIFTS.length === 4 && A.MUSIC_SHIFTS.indexOf(0) !== -1 &&
    A.MUSIC_SHIFTS.every(s => [-2, 0, 2, 4].indexOf(s) !== -1),
    'сдвиги: ' + A.MUSIC_SHIFTS.join(', '));

  ok('Каждому настроению назначены свои мелодии, лишних нет',
    Object.keys(A.MUSIC_MOODS).every(m => A.MUSIC_MOODS[m].tunes && A.MUSIC_MOODS[m].tunes.length >= 1) &&
    A.MUSIC_MOODS.sleep.tunes.join() === 'lullaby' &&
    tunes.every(t => Object.keys(A.MUSIC_MOODS).some(m => A.MUSIC_MOODS[m].tunes.indexOf(t.id) !== -1)),
    Object.keys(A.MUSIC_MOODS).map(m => m + ':' + A.MUSIC_MOODS[m].tunes.length).join(' '));

  ok('Колыбельная медленнее и тише всех, «🎵 Музыка» дома — слышнее, игра — живее',
    A.MUSIC_MOODS.sleep.bpm < A.MUSIC_MOODS.ambient.bpm &&
    A.MUSIC_MOODS.sleep.gain < A.MUSIC_MOODS.ambient.gain &&
    A.MUSIC_MOODS.calm.gain > A.MUSIC_MOODS.ambient.gain &&
    A.MUSIC_MOODS.play.bpm > A.MUSIC_MOODS.ambient.bpm,
    'bpm фон/дом/сон: ' + [A.MUSIC_MOODS.ambient.bpm, A.MUSIC_MOODS.calm.bpm, A.MUSIC_MOODS.sleep.bpm].join(' / '));

  // v1.3.8: отзыв пользователей «музыка по-прежнему заунывная и грустная» —
  // проверяем ровно то, из-за чего она такой была: темпы, регистр мелодий и
  // неподвижный бас (он держал один звук четыре доли).
  const brisk = Object.keys(A.MUSIC_MOODS)
    .filter(m => m !== 'sleep')
    .every(m => A.MUSIC_MOODS[m].bpm >= 100);
  ok('Музыка бодрая: у всех настроений, кроме колыбельной, не меньше 100 уд/мин',
    brisk, Object.keys(A.MUSIC_MOODS).map(m => m + ':' + A.MUSIC_MOODS[m].bpm).join(' '));

  const leadAvg = tunes.map(t => {
    const ns = A.musicParseLead(t.lead);
    return ns.reduce((s, n) => s + n.i, 0) / ns.length;
  });
  ok('Мелодии в верхнем регистре (от G4), а не внизу: раньше вся песня шла C4–C5',
    Math.min.apply(null, leadAvg.slice(0, 5)) >= 3,
    'средний индекс ноты по песням: ' + leadAvg.map(v => v.toFixed(1)).join(' '));

  const umPahBuf = [];
  A.musicUmPah(A.musicTune(), 0.5, 0, umPahBuf);
  ok('Бас «шагает» четвертями («ум-пах»), а в музее и во сне — тишина',
    A.MUSIC_MOODS.home.pulse === true && A.MUSIC_MOODS.play.pulse === true &&
    A.MUSIC_MOODS.museum.pulse === false && A.MUSIC_MOODS.sleep.pulse === false &&
    umPahBuf.length === A.musicTune().bass.length * A.MUSIC_UM_PAH_PER_BASS,
    'четвертей за аккорд: ' + A.MUSIC_UM_PAH_PER_BASS + ', в музее/сне: нет; ' +
    Object.keys(A.MUSIC_MOODS).map(m => m + ':' + (A.MUSIC_MOODS[m].pulse ? 'есть' : 'нет')).join(' '));

  // Мелодия зависит от экрана: где играем — там и музыка (v1.3.5)
  const moodOf = scene => {
    S.isSleeping = false;
    A.musicScene = null;                 // «переезжаем» заново
    return A.setScene(scene);
  };
  const moodHome = moodOf('home'), moodShop = moodOf('shop'), moodMuseum = moodOf('visit:art_museum'),
    moodPark = moodOf('visit:park'), moodClinic = moodOf('clinic'), moodMap = moodOf('map');
  S.isSleeping = true;
  A.musicScene = null;
  const moodSleep = A.setScene('home');  // сон важнее экрана
  S.isSleeping = false;
  A.musicScene = null;
  A.setScene('menu');
  ok('У каждого экрана своя музыка: дом, магазин, музей, парк, поликлиника, сон',
    moodHome === 'home' && moodShop === 'play' && moodMuseum === 'museum' &&
    moodPark === 'play' && moodClinic === 'museum' && moodMap === 'ambient' &&
    moodSleep === 'sleep',
    [moodHome, moodShop, moodMuseum, moodPark, moodClinic, moodMap, moodSleep].join(' / '));

  // ---- фоновая музыка играет сама ----
  S.resetProgress();
  S.isSleeping = false;
  A.ctx = fakeCtx();
  const ticked = A.musicTick();
  const st = A.musicState();
  ok('Фоновая музыка стартует сама и расписывает ноты вперёд',
    ticked === true && st.playing === true && st.played > 0 && st.mood === 'ambient',
    'сыграно нот ' + st.played + ', настроение ' + st.mood);
  ok('Ноты идут через общий регулятор музыки (выключение = тишина)',
    !!A.musicGain && A.musicGainLevel === A.MUSIC_MOODS.ambient.gain,
    'громкость музыки ' + A.musicGainLevel);

  // Заказчик: «звуки стали веселее, но надо бы их выше сделать… будто из трубы
  // сейчас всё играет. И я бы сделал её тише». Проверяем три вещи: мелодия звучит
  // дважды (сама и на октаву выше), музыка проходит через фильтры «звонкости», а
  // общая громкость заметно ниже прежней.
  const octaveCheck = (function () {
    const ev = A.musicEvents('ambient');
    const times = {};
    ev.forEach(e => {
      const key = Math.round(e.t * 1000);
      if (!times[key]) times[key] = [];
      times[key].push(e.freq);
    });
    let doubled = 0, single = 0;
    Object.keys(times).forEach(k => {
      const fs = times[k];
      const hasPair = fs.some(f => fs.some(g => Math.abs(g / f - 2) < 0.02));
      if (hasPair) doubled++; else if (fs.length === 1) single++;
    });
    return { doubled: doubled, single: single };
  })();
  const quieter = Object.keys(A.MUSIC_MOODS).every(m => A.MUSIC_MOODS[m].gain <= 0.62) &&
    A.MUSIC_MOODS.ambient.gain <= 0.4;
  ok('Музыка стала выше (октавный голосок) и тише, со «звонкими» фильтрами',
    octaveCheck.doubled >= 6 && quieter && A.ctx.filters >= 3,
    'двойных нот ' + octaveCheck.doubled + ', фильтров ' + A.ctx.filters +
    ', громкость фона ' + A.MUSIC_MOODS.ambient.gain);

  // Планировщик: за один круг он обязан выдать ровно ноты мелодии (без повторов
  // и пропусков), а после круга — продолжить, а не начать заново.
  // v1.3.12: тикаем, пока курсор не замкнёт круг, а не до «loopLen − 1». Раньше
  // окно было жёстко привязано к длине круга, и при темпе 132 уд/мин последние
  // ноты круга (они попадают на 16-ю долю) в него не влезали — проверка падала
  // не из-за музыки, а из-за арифметики теста.
  const dbg = A.musicState();
  const tuneNotes = dbg.notes;
  const mark = A.musicNotesPlayed;
  const loopLen = A.musicLoopDuration('ambient');
  A.ctx.currentTime = 0;
  A.musicStart();
  A.musicTick();
  const firstTick = A.musicNotesPlayed - mark;
  let s = 0.25, wrapped = 0;
  while (s < loopLen * 2 && wrapped < 1) {
    A.ctx.currentTime = s;
    const before = A.musicCursor;
    A.musicTick();
    if (before > 0 && A.musicCursor === 0) wrapped++;   // курсор прошёл круг
    s += 0.25;
  }
  const inLoop = A.musicNotesPlayed - mark;
  ok('За круг планировщик выдаёт ровно ноты мелодии — без повторов и пропусков',
    firstTick >= 1 && inLoop === tuneNotes,
    '«' + dbg.tuneName + '»: нот в круге ' + tuneNotes + ', выдано ' + inLoop + ' (сразу ' + firstTick + ')');

  A.ctx.currentTime = loopLen + 0.6;
  A.musicTick();
  ok('Планировщик продолжает круг, а не начинает его заново',
    A.musicNotesPlayed > mark + inLoop,
    'нот после круга: ' + (A.musicNotesPlayed - mark - inLoop));

  S.isSleeping = true;
  A.musicTick();
  const sleepState = A.musicState();
  S.isSleeping = false;
  ok('Пока питомец спит — колыбельная: медленнее и тише',
    sleepState.mood === 'sleep' && sleepState.bpm === A.MUSIC_MOODS.sleep.bpm &&
    sleepState.gain === A.MUSIC_MOODS.sleep.gain,
    'сон: ' + sleepState.bpm + ' bpm, громкость ' + sleepState.gain);

  A.musicBoost(8);
  A.musicTick();
  const calmState = A.musicState();
  A.musicBoostUntil = 0;
  A.musicTick();
  ok('Домашнее действие «🎵 Музыка» делает фон слышнее и возвращает обратно',
    calmState.mood === 'calm' && calmState.gain > A.MUSIC_MOODS.ambient.gain &&
    A.musicState().mood === 'ambient',
    'дом: ' + calmState.gain + ' → фон: ' + A.MUSIC_MOODS.ambient.gain);

  // ---- галочки независимые ----
  A.toggleMusic();
  const offMusicTick = A.musicTick();
  const offState = A.musicState();
  ok('Музыку можно выключить: петля замолкает, ноты больше не расписываются',
    offMusicTick === false && offState.music === false && offState.playing === false && offState.gain < 0.01,
    'громкость музыки ' + offState.gain);

  const clickWithMusicOff = A.play('click');
  ok('Звуки при выключенной музыке работают (это разные галочки)',
    clickWithMusicOff === true && A.ctx.oscillators > 0, 'осцилляторов: ' + A.ctx.oscillators);

  A.toggleMusic();                         // музыку вернули
  const notesMark = A.musicNotesPlayed;
  A.toggleSound();                         // а звуки выключили
  const musicAlive = A.musicTick();
  ok('Музыка играет при выключенных звуках (и наоборот)',
    musicAlive === true && A.musicState().playing === true && A.musicNotesPlayed > notesMark,
    'нот добавилось ' + (A.musicNotesPlayed - notesMark));

  const silentClick = A.play('click');
  const silentVoice = A.voice('gopher', 'happy');
  ok('Звуки выключены — ни эффектов, ни голосов героев',
    silentClick === false && silentVoice === false);

  const raw = store.getItem('gopherlife_audio');
  A.settings = { music: true, sound: true };   // «перезапустили приложение»
  A.loadSettings();
  ok('Выбор помнит устройство: после перезапуска музыка вкл, звуки выкл',
    !!raw && A.isMusicOn() === true && A.isSoundOn() === false, 'в памяти: ' + raw);

  A.setSound(true);
  store.removeItem('gopherlife_audio');
  A.loadSettings();
  ok('Без сохранённой настройки игра снова со звуком (по умолчанию всё включено)',
    A.isMusicOn() && A.isSoundOn(), A.settingsHint());

  A.ctx = null;
  A.musicGain = null;
  A.musicPlaying = false;
  A.musicMoodApplied = null;
  A.musicBoostUntil = 0;
  S.isSleeping = false;
}

// --- Имя героя в текстах (v1.3.4, замечание заказчика) ---
// «Все другие персонажи тоже называются Гоферами, хотя у них есть свои имена.
//  Гофер должен быть только для гофера». Проверяем: у каждого героя есть формы
//  имени и род, подстановка склоняет и согласует, тексты игры берут слово из
//  шаблона, а в подписи меню видно имя героя, если профиль не переименован.
const petSample = 'Покорми {pet_acc}: {Pet} {pet:сыт|сыта}';
ok('У каждого героя есть формы имени для текстов и род',
  sandbox.CHARACTERS.every(c => c.gender && c.pet &&
    ['nom', 'gen', 'dat', 'acc', 'ins'].every(f => typeof c.pet[f] === 'string' && c.pet[f].length > 1)),
  sandbox.CHARACTERS.map(c => c.name + ' → ' + (c.pet && c.pet.acc)).join(', '));
ok('Милка — девочка, остальные герои мальчики (тексты согласуются по роду)',
  sandbox.findCharacter('milka').gender === 'f' &&
  sandbox.CHARACTERS.filter(c => c.gender === 'm').length === 5,
  'девочек: ' + sandbox.CHARACTERS.filter(c => c.gender === 'f').length);

S.setCharacter('gopher');
ok('С гофером всё как раньше: «Покорми гофера: Гофер сыт»',
  sandbox.petFill(petSample) === 'Покорми гофера: Гофер сыт', sandbox.petFill(petSample));

S.setCharacter('milka');
ok('С Милкой текст называет её по имени (а не «гофером»)',
  sandbox.petFill(petSample) === 'Покорми Милку: Милка сыта' &&
  !/гофер/i.test(sandbox.petFill(petSample)), sandbox.petFill(petSample));
ok('С Милкой падежи и род верные: «{pet} спит», «поспи с {pet_by}», «{pet:нашёл|нашла}»',
  sandbox.petFill('{Pet} спит 💤') === 'Милка спит 💤' &&
  sandbox.petFill('Поспи с {pet_by}') === 'Поспи с ней' &&
  sandbox.petFill('{Pet} {pet:нашёл|нашла} монетку') === 'Милка нашла монетку',
  sandbox.petFill('Поспи с {pet_by}') + ' · ' + sandbox.petFill('{Pet} {pet:нашёл|нашла} монетку'));

S.setCharacter('bear');
ok('С Мишкой текст называет его Мишкой (без «гофера»)',
  sandbox.petFill(petSample) === 'Покорми мишку: Мишка сыт' &&
  !/гофер/i.test(sandbox.petFill('{Pet} устал: поспи с {pet_by}')),
  sandbox.petFill(petSample));
ok('Милка не путается с мишкой: у каждого героя своё слово',
  (function () {
    const seen = {};
    let okAll = true;
    sandbox.CHARACTERS.forEach(c => {
      S.setCharacter(c.id);
      const w = sandbox.petWord('nom');
      if (seen[w]) okAll = false;
      seen[w] = c.id;
    });
    return okAll && Object.keys(seen).length === 6;
  })(), sandbox.CHARACTERS.map(c => c.pet.nom).join(', '));

// Тексты игры: подставляем героя в каждый и смотрим, не остался ли «гофер»/шаблон
const heroTexts = []
  .concat(sandbox.ACHIEVEMENTS.map(a => a.name).concat(sandbox.ACHIEVEMENTS.map(a => a.desc)))
  .concat(sandbox.STAT_HELP.map(h => h.what))
  .concat(sandbox.STAT_HELP.reduce((acc, h) => acc.concat(h.up || [], h.down || []), []))
  .concat(sandbox.QUIET_RULES)
  .concat(['{Pet} спит — походы закрыты', '{Pet} {pet:выспался|выспалась}!', 'Сыграй против {pet_gen}']);
sandbox.CHARACTERS.forEach(c => {
  S.setCharacter(c.id);
  const bad = heroTexts.map(t => sandbox.petFill(t)).filter(t => t.indexOf('{') !== -1 || (c.id !== 'gopher' && /гофер/i.test(t)));
  ok('Тексты игры с героем «' + c.name + '» звучат правильно (нет «гофера» и шаблонов)',
    bad.length === 0, bad.slice(0, 2).join(' | ') || 'проверено строк: ' + heroTexts.length);
});

S.setCharacter('milka');
S.profileName = sandbox.DEFAULT_PROFILE_NAME;
ok('В подписи профиля — имя героя, если профиль не переименован',
  S.profileLabel() === 'Милка', S.profileLabel());
S.profileName = 'Витя';
ok('Переименованный профиль остаётся именем ребёнка',
  S.profileLabel() === 'Витя' && S.characterName() === 'Милка', S.profileLabel());
S.profileName = sandbox.DEFAULT_PROFILE_NAME;   // вернули как было

ok('Имя профиля по умолчанию осталось «Гофер» (старые сохранения не меняются)',
  sandbox.DEFAULT_PROFILE_NAME === 'Гофер' && S.profileName === sandbox.DEFAULT_PROFILE_NAME, S.profileName);

// Список профилей и друзья: подписи берутся из профиля (v1.3.5). Профиль, который
// не переименовывали, подписан именем СВОЕГО героя — иначе у Милки в списке
// профилей и у друга стоит «Гофер» (нашлось на кадре рендера menu@profiles).
const profilesBefore = S.getProfiles();
const storedProfiles = sandbox.localStorage.getItem(S.PROFILE_KEY);
const storedSaves = {};
S.getProfiles().forEach(pr => { storedSaves[pr.id] = sandbox.localStorage.getItem(S.saveKeyFor(pr.id)); });
sandbox.localStorage.setItem(S.PROFILE_KEY, JSON.stringify([
  { id: 'p1', name: sandbox.DEFAULT_PROFILE_NAME },
  { id: 'p2', name: 'Витя' }
]));
sandbox.localStorage.setItem(S.saveKeyFor('p1'), JSON.stringify({ level: 3, look: { char: 'milka' } }));
sandbox.localStorage.setItem(S.saveKeyFor('p2'), JSON.stringify({ level: 5, look: { char: 'bear' } }));
const labelDefault = S.profileLabelFor('p1');
const emojiDefault = S.emojiForProfile('p1');
const labelNamed = S.profileLabelFor('p2');
ok('В списке профилей профиль без своего имени подписан именем своего героя',
  labelDefault === 'Милка' && labelNamed === 'Витя',
  '«Гофер»-профиль → ' + labelDefault + ', переименованный → ' + labelNamed);
sandbox.localStorage.setItem(S.PROFILE_KEY, JSON.stringify([
  { id: 'p1', name: 'Питомец 2' },
  { id: 'p2', name: 'Витя' }
]));
ok('Автоимя «Питомец 2» не перекрывает имя героя',
  S.profileLabelFor('p1') === 'Милка', S.profileLabelFor('p1'));
const keepId = S.profileId;
const keepName = S.profileName;
ok('Профиль можно переименовать и удалить, последний не удаляется',
  S.renameProfile('p2', 'Мила') && S.profileLabelFor('p2') === 'Мила' &&
  S.deleteProfile('p1') === true && S.deleteProfile('p2') === false);
S.profileId = keepId;
S.profileName = keepName;

const tools = new sandbox.ToolsScene({ width: 360, height: 640, transitionTo() {} });
ok('Калькулятор считает слева направо: 9×2+2÷2 = 10',
  tools.evalCalc('9*2+2/2') === '10', tools.evalCalc('9*2+2/2'));
const toolSrc = fs.readFileSync(path.join(WWW, 'game_tools.js'), 'utf8');
ok('В инструментах нет «Умножения» и «Выбора», есть секундомер и своё время таймера',
  toolSrc.indexOf('Умножение') === -1 && toolSrc.indexOf('Кто сегодня') === -1 &&
  toolSrc.indexOf('Секундомер') !== -1 && toolSrc.indexOf('60') !== -1 &&
  toolSrc.indexOf('Включите звук') !== -1);
ok('В списке профилей стоит эмодзи героя этого профиля, а не общий 🐹',
  emojiDefault === '🐇', emojiDefault);
// Вернули состояние стенда: профили и сохранения как были
if (storedProfiles === null) sandbox.localStorage.removeItem(S.PROFILE_KEY);
else sandbox.localStorage.setItem(S.PROFILE_KEY, storedProfiles);
Object.keys(storedSaves).forEach(id => {
  if (storedSaves[id] === null) sandbox.localStorage.removeItem(S.saveKeyFor(id));
  else sandbox.localStorage.setItem(S.saveKeyFor(id), storedSaves[id]);
});
ok('Стенд вернулся в исходное состояние: профили как были',
  S.getProfiles().length === profilesBefore.length, 'профилей ' + S.getProfiles().length);

const popupText = (function () {
  S.showAchievement('😴', '{Pet} {pet:устал|устала} — сначала поспи');
  const t = S.lastPopup.text;
  S.lastPopup = null;
  return t;
})();
ok('Плашка достижений показывает героя, а не шаблон',
  popupText === 'Милка устала — сначала поспи', popupText);

ok('Сообщение об офлайне говорит именем героя и его эмодзи',
  (function () {
    S.offlineReport = { awayMinutes: 95, sleptMinutes: 0, wokeUp: false };
    const t = sandbox.petFill(S.offlineMessage());

/* ---------- Дом, сохранение, время и выход из гостей (v1.3.6) ---------- */

// Время в игре: жалоба «всегда показывается ноль»
S.totalPlayTime = 0;
S.addPlaySeconds(90);
ok('Время в игре считается секундами, а не «+1 раз в минуту»',
  S.playTimeText() === '1 мин' && Math.round(S.totalPlayTime) === 90, S.playTimeText());
S.totalPlayTime = 0;
ok('Первую минуту честно пишем «меньше минуты»', S.playTimeText() === 'меньше минуты', S.playTimeText());
// Старые сохранения держали время в минутах: переносим их честно
sandbox.localStorage.setItem(S.saveKeyFor('p1'), JSON.stringify({ level: 2, totalPlayTime: 42, rooms: { living: { wall: 'warm', floor: 'wood', furniture: [] } } }));
S.profileId = 'p1';
S.totalPlayTime = 0;
S.loadGame();
ok('Время из старых сохранений (в минутах) переводится в секунды',
  S.totalPlayTime === 42 * 60, '42 мин → ' + S.totalPlayTime + ' с (' + S.playTimeText() + ')');
sandbox.localStorage.setItem(S.saveKeyFor('p1'), JSON.stringify({ level: 2, totalPlayTime: 42, playTimeUnit: 'sec', rooms: { living: { wall: 'warm', floor: 'wood', furniture: [] } } }));
S.totalPlayTime = 0;
S.loadGame();
ok('Новые сохранения (в секундах) читаются как есть',
  S.totalPlayTime === 42, '42 с → ' + S.playTimeText());
S.totalPlayTime = 3725;
ok('Долгая игра показывается часами и минутами', S.playTimeText() === '1 ч 2 мин', S.playTimeText());
S.totalPlayTime = 0;

// Мебель, резервная копия и восстановление после обрыва записи
const lstore = sandbox.localStorage;
const saveK = S.saveKeyFor('p1'), bakK = S.backupKeyFor('p1');
const keepRaw = lstore.getItem(saveK), keepBak = lstore.getItem(bakK);
S.profileId = 'p1';
lstore.removeItem(saveK);
lstore.removeItem(bakK);
S.resetProgress();
S.rooms = null;
S.ensureRooms();
S.rooms.living.furniture.push({ id: 'sofa', x: 0.3, y: 0.5 });
S.rooms.bedroom.furniture.push({ id: 'bed', x: 0.4, y: 0.5 });
S.saveGame();
ok('Первое сохранение сразу делает резервную копию',
  !!lstore.getItem(bakK), 'копия ' + (lstore.getItem(bakK) || '').length + ' байт');

const goodSave = lstore.getItem(saveK);
lstore.setItem(saveK, goodSave.slice(0, Math.floor(goodSave.length * 0.5)));   // обрыв записи
S.rooms = null;
const restored = S.loadGame();
const restoredItems = Object.keys(S.rooms || {}).reduce((a, k) => a + S.rooms[k].furniture.length, 0);
ok('Битое сохранение поднимается из копии — дом не пропадает',
  restored === true && S.restoredFromBackup === true && restoredItems === 2,
  'предметов после восстановления: ' + restoredItems);
ok('Сразу после восстановления основное сохранение снова целое',
  (function () { try { return JSON.parse(lstore.getItem(saveK)).level === S.level; } catch (e) { return false; } })(),
  'файл сохранения разбирается');

// Старая мебель (плоский список) переносится один раз, а не при каждой загрузке
const before = Object.keys(S.rooms).reduce((a, k) => a + S.rooms[k].furniture.length, 0);
S.loadGame();
const afterTwoLoads = Object.keys(S.rooms).reduce((a, k) => a + S.rooms[k].furniture.length, 0);
ok('Повторная загрузка не двоит мебель', before === afterTwoLoads, before + ' → ' + afterTwoLoads);

// Ошибка записи не должна разрушать прежнее сохранение
const realSet = lstore.setItem;
lstore.setItem = () => { throw new Error('QuotaExceededError'); };
S.coins = 7;
S.saveGame();
lstore.setItem = realSet;
let keptCoins = null;
try { keptCoins = JSON.parse(lstore.getItem(saveK)).coins; } catch (e) { keptCoins = 'ошибка'; }
ok('Ошибка записи не затирает прежний дом ребёнка',
  keptCoins !== 7 && S.saveFailed === true && S.saveHealth() === 'не пишется (кончилось место)',
  'в файле монет: ' + keptCoins + ', здоровье сохранения: ' + S.saveHealth());

// hasSave видит и копию: иначе в меню показали бы «Начать игру» и всё стёрли
lstore.removeItem(saveK);
ok('Прогресс считается существующим, даже если осталась только копия',
  S.hasSave() === true, 'копия есть: ' + !!lstore.getItem(bakK));
if (keepRaw === null) lstore.removeItem(saveK); else lstore.setItem(saveK, keepRaw);
if (keepBak === null) lstore.removeItem(bakK); else lstore.setItem(bakK, keepBak);
S.saveFailed = false; S.restoredFromBackup = false;

// Выход из гостей: кнопка была, но её стирала заливка фона
const friendsSrc = fs.readFileSync(path.join(WWW, 'game_friends.js'), 'utf8');
ok('В доме друга видны выходы: «← Назад» и «🏠 Домой»',
  friendsSrc.indexOf("'to_home'") !== -1 && friendsSrc.indexOf('🏠 Домой') !== -1 &&
  !/drawFriendHome[\s\S]{0,400}fillRect\(0, 0, W, H\)/.test(friendsSrc) &&
  /handleBack\(\) \{/.test(friendsSrc),
  'фон больше не заливается поверх угловой кнопки');
const gameSrc = fs.readFileSync(path.join(WWW, 'game.js'), 'utf8');
ok('Системная кнопка «Назад» сначала спрашивает игру, а не закрывает её',
  gameSrc.indexOf('window.onAndroidBack') !== -1 && gameSrc.indexOf('handleAndroidBack()') !== -1 &&
  gameSrc.indexOf("if (this.currentScene === 'menu') return 'exit'") !== -1,
  'выход из игры — только с главного меню');
const actSrc = fs.readFileSync(path.join(ROOT, 'android', 'app', 'src', 'main', 'java', 'com', 'gopherlife', 'app', 'MainActivity.java'), 'utf8');
ok('Android отдаёт «Назад» игре (иначе игра выгружается сразу)',
  actSrc.indexOf('evaluateJavascript') !== -1 && actSrc.indexOf('onAndroidBack') !== -1 &&
  actSrc.indexOf('finish()') !== -1, 'MainActivity спрашивает window.onAndroidBack');
    S.offlineReport = null;
    return t.indexOf('Милка скучала') !== -1 && t.indexOf('🐇') !== -1 && !/гофер/i.test(t);
  })(), sandbox.petFill('Тебя не было 1 ч 35 мин — {pet} {pet:скучал|скучала}, но держится ' + S.heroEmoji()));

/* ---------- Пятьдесят музеев и четыре спортивные дисциплины (v1.3.12) ---------- */
// Заказчик: «музеев очень мало, хочется уйму разных музеев, а в каждом — сотни
// экспонатов» (v1.3.7: стало десять музеев по сто экспонатов) и «музеев добавь до
// 50 разных» (v1.3.12: стало пятьдесят — десять больших по сто и сорок по двенадцать).
const MUSEUMS = sandbox.MUSEUM_CATEGORIES;
const museumSizes = MUSEUMS.map(k => sandbox.contentSize(k));
ok('Музеев ровно пятьдесят, и в каждом не меньше двенадцати экспонатов',
  MUSEUMS.length === 50 && new Set(MUSEUMS).size === 50 &&
  museumSizes.every(n => n >= 12) && museumSizes.reduce((a, b) => a + b, 0) >= 1400,
  MUSEUMS.length + ' музеев, всего ' + museumSizes.reduce((a, b) => a + b, 0) +
  ' экспонатов, минимум ' + Math.min.apply(null, museumSizes));
const museumDupNames = MUSEUMS.filter(k => {
  const names = (sandbox.CONTENT[k] || []).map(it => it.n);
  return new Set(names).size !== names.length;
});
ok('Внутри музея названия экспонатов не повторяются (id предмета — его имя)',
  museumDupNames.length === 0,
  museumDupNames.length ? ('повторы: ' + museumDupNames.join(', ')) : 'без повторов');
const hubMuseumIds = ((sandbox.VISIT_DATA.museums || {}).sub || []).map(m => m.id);
ok('В хабе музеев ровно те же пятьдесят музеев, что и в списке категорий',
  hubMuseumIds.length === 50 && hubMuseumIds.every(id => MUSEUMS.indexOf(id) !== -1),
  hubMuseumIds.length + ' карточек в хабе');
ok('У каждого музея есть обстановка в походе и своя музейная мелодия',
  MUSEUMS.every(k => !!sandbox.STAGE_DATA[k]) && MUSEUMS.every(k => !!sandbox.VISIT_DATA[k]) &&
  MUSEUMS.every(k => {
    sandbox.AudioSys.musicScene = null;
    return sandbox.AudioSys.setScene('visit:' + k) === 'museum';
  }),
  'обстановка, сцена и мелодия у всех пятидесяти');
const achIds = sandbox.ACHIEVEMENTS.map(a => a.id);
const fullAch = sandbox.ACHIEVEMENTS.filter(a => a.id === 'museumsFull')[0] || { desc: '' };
ok('Достижения про музеи знают про пятьдесят музеев и дают ступень полегче',
  achIds.indexOf('museumsFull') !== -1 && achIds.indexOf('museumsLover') !== -1 &&
  fullAch.desc.indexOf('50 музеев') !== -1, fullAch.desc);

// Спорт: четыре дисциплины со своими анимациями — кольца, полотна, заплыв, барьеры
const sports = sandbox.SPORT_DISCIPLINES;
const sportIds = Object.keys(sports);
ok('Спортивных дисциплин четыре: кольца, полотна, заплыв, барьеры',
  sportIds.length === 4 && ['rings', 'silks', 'swim', 'hurdles'].every(id => !!sports[id]),
  sportIds.join(', '));
const gymSports = sandbox.sportListFor('gym').map(d => d.id);
ok('Спортзал даёт кольца и полотна, бассейн — заплыв, парк — барьеры',
  gymSports.join(',') === 'rings,silks' &&
  sandbox.sportListFor('pool').map(d => d.id).join(',') === 'swim' &&
  sandbox.sportListFor('park').map(d => d.id).join(',') === 'hurdles',
  'зал: ' + gymSports.join(' + ') + ', бассейн: swim, парк: hurdles');
const arenaErrors = [];
sportIds.forEach(id => {
  const arena = new sandbox.SportScene(boot, id);
  arena.paid = true;
  arena.state = 'swing';
  try { arena.draw(sandbox.__ctx); } catch (e) { arenaErrors.push(id + ': ' + e.message); }
});
ok('Все четыре арены рисуются без ошибок',
  arenaErrors.length === 0, arenaErrors.length ? arenaErrors.join('; ') : 'кольца, полотна, заплыв, барьеры');
const swimRun = new sandbox.SportScene(boot, 'swim');
swimRun.paid = true;
swimRun.state = 'swing';
swimRun.power = 0.5;
swimRun.jump();
ok('Точный поворот в заплыве даёт монеты, как точный перелёт на кольцах',
  swimRun.perfect === 1 && swimRun.coinsWon === sports.swim.perfectCoins && swimRun.state === 'swing',
  'монет: ' + swimRun.coinsWon + ', попыток осталось ' + swimRun.attemptsLeft);
swimRun.state = 'swing';
swimRun.power = 0.02;
swimRun.jump();
ok('Промах не оставляет в подсказке «{pet}» — имя героя подставляется',
  swimRun.lastResult.indexOf('{pet}') === -1 && swimRun.lastResult.length > 8, swimRun.lastResult);
ok('Старое имя сцены «aerial» по-прежнему ведёт на кольца',
  new sandbox.SportScene(boot).disc.id === 'rings' && new sandbox.SportScene(boot, 'nope').disc.id === 'rings',
  'без параметра и с неизвестным id — кольца');

/* ---------- Чат с питомцем (v1.3.28): отвечает тепло, а не «назови слово» ---------- */
// Заказчик: «диалоги всё равно тупенькие». Раньше на «не очень» (ответ на «как
// дела?») бот падал в «какое тут главное слово?». Теперь он помнит, что спросил,
// и отвечает по настроению; короткие «да/нет/понятно/ха-ха» подхватывает тепло.
{
  const cs = new sandbox.ChatScene({});
  const fallbackSet = sandbox.CHAT_KID_FALLBACK || [];
  const isFallback = t => fallbackSet.indexOf(t) !== -1;

  const q1 = cs.replyTo('как дела');
  const asked = cs.pending === 'mood';
  const a1 = cs.replyTo('не очень');
  const a1warm = !!a1 && !isFallback(a1) && a1.length > 5;
  const good = cs.replyTo('хорошо');
  cs.pending = null;
  const a2 = cs.replyTo('понятно');
  const a3 = cs.replyTo('ты тупенький');
  const a4 = cs.replyTo('хахаха');
  const a5 = cs.replyTo('а ты?');

  ok('Чат: «как дела» задаёт вопрос и ждёт ответ о настроении', asked && q1.length > 3, q1);
  ok('Чат: «не очень» получает сочувствие, а не «назови слово»', a1warm, a1);
  ok('Чат: «хорошо» после «как дела» — тёплый отклик, а не фолбэк', !!good && !isFallback(good), good);
  ok('Чат: «понятно»/«ты тупенький»/«хахаха»/«а ты?» подхватываются тепло',
    [a2, a3, a4, a5].every(t => !!t && !isFallback(t) && t.length > 3),
    [a2, a3, a4, a5].join(' / '));
}

/* ---------- Смысловой чат на эмбеддингах (v1.3.29): вместо регулярок ---------- */
{
  const S = sandbox.Semantic;
  const sem = sandbox.CHAT_SEMANTIC;
  const cat = sem ? sem.best.bind(sem) : (() => null);
  ok('Есть смысловой движок: нормализация, косинус и индекс по темам',
    !!S && typeof S.cosine === 'function' && !!sem && sem.index && sem.queryCount > 300,
    sem ? ('записей в индексе: ' + sem.queryCount) : 'нет CHAT_SEMANTIC');

  // Перефразировки, которых не было в ключах, должны вести в правильную тему
  const map = {};
  ['кошка', 'котёнок', 'я расстроился', 'хочу есть', 'как у тебя дела', 'мне страшно',
   'спой песню', 'приветик', 'пока', 'сколько тебе лет', 'поиграем', 'расскажи сказку',
   'обними меня', 'красный цвет', 'дождь на улице'].forEach(q => { map[q] = cat(q) ? cat(q).id : ''; });
  ok('Смысловой поиск ведёт «кошку» в животных, а «я расстроился» в грусть',
    map['кошка'] === 'animals' && map['котёнок'] === 'animals' &&
    map['я расстроился'] === 'moodBad' && map['хочу есть'] === 'food',
    JSON.stringify(map));
  ok('Смысловой поиск узнаёт «как у тебя дела», «сказку», «песню» и «сколько тебе лет»',
    map['как у тебя дела'] === 'how' && map['расскажи сказку'] === 'story' &&
    map['спой песню'] === 'song' && map['сколько тебе лет'] === 'age',
    JSON.stringify(map));

  // База ответов должна быть «несколько десятков тысяч»
  const nounsN = (sandbox.CHAT_NOUNS || []).length;
  const patsN = (sandbox.CHAT_NOUN_PATTERNS || []).length;
  const topicN = (sandbox.CHAT_TOPICS || []).reduce((a, t) => a + (t.replies || []).length, 0);
  const totalN = nounsN * patsN + topicN;
  ok('Каталог ответов — несколько десятков тысяч фраз (слова × шаблоны + темы)',
    totalN >= 30000,
    nounsN + ' слов × ' + patsN + ' шаблонов = ' + (nounsN * patsN) + ' + темы ' + topicN + ' = ' + totalN);

  // Текстовая мини-игра «угадай слово» работает на том же движке
  const cg = new sandbox.ChatScene({});
  const start = cg.replyTo('угадай слово');
  const secretWord = cg.guess && cg.guess.word;
  const hasSecret = !!secretWord;
  const cold = cg.replyTo('абракадабра');
  const win = cg.replyTo(secretWord);
  ok('Мини-игра «угадай слово»: загадывает и принимает правильный ответ',
    hasSecret && start.length > 5 && cold.length > 3 && cg.guess === null && win.indexOf(secretWord) !== -1,
    'секрет: ' + secretWord + '; мимо: ' + cold + '; победа: ' + win);
}

/* ---------- Чат держит тему (v1.3.36): разговор заказчика ---------- */
{
  const c = new sandbox.ChatScene({});
  const say = (t) => c.replyTo(t);
  const work = say('некогда, работы много');
  const back = say('а при чём тут погода? мы же о работе говорим');
  const storm = say('гроза');
  const storm2 = say('гроза');
  const alive = say('Ты живой?');
  const sus = say('Ты суслик?');
  const sus2 = say('Но ты суслик?');
  const milka = say('Ты знаешь Милку?');
  const what = say('Что? Ты о чём?');
  const hw = say('О, помоги сделать уроки.');
  say('расскажи что-нибудь интересное');
  const deep = say('Это глубокая мысль.');
  const weatherLeak = /погод|солнце, дождь|солнечно/.test(String(work).toLowerCase());
  ok('Чат: «работы много» не уводит в погоду',
    !weatherLeak && /дел|работ|урок/.test(work.toLowerCase()), work);
  ok('Чат: «при чём тут погода» возвращает разговор к делам',
    /дел|работ|урок/.test(back.toLowerCase()), back);
  ok('Чат: «гроза» дважды отвечает про грозу',
    /гроз|гром|молни/.test(storm.toLowerCase()) && /гроз|гром|молни/.test(storm2.toLowerCase()),
    storm + ' / ' + storm2);
  ok('Чат: «ты живой» и «ты суслик» отвечают про героя, а не про объятия',
    /игр|не настоя|игруш|дыш|зовут|персонаж/.test(alive.toLowerCase()) &&
    /суслик/.test(sus.toLowerCase()) && /суслик/.test(sus2.toLowerCase()),
    [alive, sus, sus2].join(' / '));
  ok('Знания чата — целые фразы, не подстановка слова в шаблон',
    sandbox.CHAT_TALK && sandbox.CHAT_TALK.count() >= 80, 'фраз ' + (sandbox.CHAT_TALK ? sandbox.CHAT_TALK.count() : 0));
  const dlg = new sandbox.ChatScene({});
  const d = t => dlg.replyTo(t);
  const en = d("Do you speak English?");
  const mood = d('Как у тебя настроение?');
  const why = d('Что значит могу? Я же не об этом спросил.');
  const both = d('Как можно путать тёплое с мягким? Я люблю писать компьютерные программы.');
  const warm = d('Ну расскажи про тепло.');
  const feel = d('Логично, я думаю, что у него вообще нет чувств.');
  const other = d('Давай о другом уже.');
  const fr = d('Кто у тебя друзья?');
  const fr2 = d('Молодец. Так кто у тебя друзья?');
  const bear = d('расскажи про мишку');
  const badRu = d('Нет, так нельзя спросить, это не по-русски.');
  const soup = d('А как может надоесть тема суп, если мы про него вообще не говорили?');
  const reg = d('Ты снова на регулярках что ли работаешь?');
  const few = d('И у тебя всё ещё мало фраз, я угадал?');
  const low = s => String(s || '').toLowerCase().replace(/ё/g, 'е');
  const blob = [en, mood, why, both, warm, feel, other, fr, fr2, bear, badRu, soup, reg, few].join(' | ');
  const broken = /добрые заготовки|ниточку разговора|какой игрушка|про друг у меня|беречь разговор про пока|Дел много/.test(blob);
  ok('Диалог заказчика: английский, настроение, тепло, друзья, мишка — без кривого шаблона',
    /русск/i.test(en) && /настроен|спокойн|слуша/.test(low(mood)) &&
    /программ/.test(low(both)) && /тепл/.test(low(warm)) &&
    /тепл|чувств/.test(low(feel)) && !/про друг/.test(low(other)) &&
    /мишк/.test(low(fr)) && /мишк/.test(low(fr2)) && /мишк/.test(low(bear)) &&
    /прям|шаблон|вопрос/.test(low(badRu)) && /суп/.test(low(soup)) &&
    !/Дел много/.test(reg) && !broken,
    blob.slice(0, 500));
  const cctx = new sandbox.ChatScene({});
  cctx.replyTo('расскажи про котика');
  const more1 = cctx.replyTo('ещё');
  const more2 = cctx.replyTo('ещё');
  ok('Чат держит контекст: «ещё» после котика снова про котика и не повторяет строку',
    /котик|кот/.test(more1.toLowerCase()) && /котик|кот/.test(more2.toLowerCase()) && more1 !== more2,
    more1 + ' / ' + more2);
  ok('Чат: Милка — игрушка из игры, уроки — про уроки, «глубокая мысль» не про мурчание',
    /милк/i.test(milka) && !/суп/.test(milka.toLowerCase()) &&
    /милк/i.test(what) && /урок|дел|школ/.test(hw.toLowerCase()) && !/мурчу/.test(deep),
    [milka, what, hw, deep].join(' / '));
}

S.setCharacter('gopher');
S.profileName = sandbox.DEFAULT_PROFILE_NAME;

/* ---------- Мини-игры со словами и матч в камень-ножницы (v1.3.34) ---------- */
// Заказчик: игру «камень-ножницы» в один случайный тычок назвал недоделанной,
// а виселицу и другие игры в буквы попросил добавить. Проверка падает, если
// карточки пропали из списка или матч снова считается одним жестом.
{
  const java = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/gopherlife/app/MainActivity.java'), 'utf8');
  ok('Загрузчик обновления идёт по редиректам, проверяет PK и выдаёт чтение установщику',
    java.indexOf('openFollowingRedirects') !== -1 && java.indexOf("mag[0] == 'P'") !== -1 &&
    java.indexOf('grantUriPermission') !== -1,
    'без этого кнопка «Обновить игру» отдаёт установщику не APK');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const gv = (fs.readFileSync(path.join(WWW, 'helpers.js'), 'utf8').match(/GAME_VERSION = '([^']+)'/) || [])[1];
  const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
  const vn = (gradle.match(/versionName "([^"]+)"/) || [])[1];
  ok('Версия одна и та же в package.json, GAME_VERSION и versionName',
    pkg === gv && gv === vn, pkg + ' / ' + gv + ' / ' + vn);

  const game = { width: 390, height: 844, transitionTo() {} };
  const mini = new sandbox.MinigamesScene(game);
  const texts = [];
  const ctx = new Proxy({
    canvas: { width: 390, height: 844 },
    measureText: s => ({ width: String(s).length * 8 }),
    createLinearGradient: () => ({ addColorStop() {} })
  }, { get(t, p) { return p in t ? t[p] : function () {}; }, set(t, p, v) { t[p] = v; if (p === 'fillText') {} return true; } });
  const orig = ctx.fillText;
  ctx.fillText = (s) => { texts.push(String(s)); if (orig) orig(s); };
  mini.mode = 'select';
  mini.draw(ctx);
  const ids = (mini.buttons || []).map(b => b.action).filter(Boolean);
  ok('В мини-играх есть «Угадай слово», «Буквы» и «Перемешка»',
    ids.indexOf('word') !== -1 && ids.indexOf('letters') !== -1 && ids.indexOf('mix') !== -1,
    ids.join(','));
  const cards = mini.buttons.filter(b => b.action && b.h && b.y > 40);
  let piled = false;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) piled = true;
    }
  }
  ok('Кнопки списка мини-игр не наезжают друг на друга',
    !piled && cards.length >= 8, 'карточек ' + cards.length);

  mini.initRps();
  mini.rps.pick = 'rock';
  mini.rps.petHand = 'scissors';
  mini.rps.phase = 'count';
  mini.finishRpsRound();
  const afterOne = mini.rps.you === 1 && mini.rps.pet === 0 && mini.rps.phase === 'show';
  mini.rps.pick = 'rock';
  mini.rps.petHand = 'scissors';
  mini.rps.phase = 'count';
  mini.finishRpsRound();
  ok('Камень-ножницы: победа считается раундом матча, монеты — когда дошли до двух',
    afterOne && mini.rps.you === 2 && (sandbox.System.progress.rpsWins || 0) >= 1,
    'счёт ' + mini.rps.you + ':' + mini.rps.pet + ', побед матчей ' + sandbox.System.progress.rpsWins);

  mini.initLetters();
  const secret = mini.letters.word;
  secret.split('').filter((ch, i, a) => a.indexOf(ch) === i).forEach(ch => mini.guessLetter(ch));
  ok('«Буквы»: слово из банка открывается по буквам и засчитывает победу',
    mini.letters.won === true && mini.letters.word === secret,
    secret);
  const balloonCtx = new Proxy({
    canvas: { width: 390, height: 844 },
    measureText: s => ({ width: String(s).length * 8 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  }, { get(t, p) { return p in t ? t[p] : function () {}; }, set(t, p, v) { t[p] = v; return true; } });
  mini.initLetters();
  mini.mode = 'letters';
  mini.letters.wrong = 0;
  mini.letters.over = false;
  mini.draw(balloonCtx);
  const yHold = mini.letters.balloonY;
  mini.letters.wrong = 5;
  mini.draw(balloonCtx);
  const ySlip = mini.letters.balloonY;
  mini.letters.wrong = 6;
  mini.letters.over = true;
  mini.letters.won = false;
  mini.draw(balloonCtx);
  const yGone = mini.letters.balloonY;
  ok('«Буквы»: шарик в руках героя поднимается с ошибками и срывается на проигрыше',
    typeof yHold === 'number' && ySlip < yHold && yGone < ySlip,
    'высота ' + Math.round(yHold) + ' → ' + Math.round(ySlip) + ' → ' + Math.round(yGone));
  mini.initMix();
  mini.mix.picked = mini.mix.tiles.slice().sort((a, b) => a.id - b.id).map(t => t.id);
  mini.mix.tiles.forEach(t => { t.used = true; });
  mini.finishMix();
  ok('«Перемешка»: слово, собранное в верном порядке, победа',
    mini.mix.won === true, mini.mix.word);
}

ok('Карта: 16 плиток, 4 на 4, бассейна на карте нет, инструменты между мини-играми и инфо',
  sandbox.MAP_LOCATIONS.length === 16 &&
  !sandbox.MAP_LOCATIONS.some(l => l.id === 'pool') &&
  sandbox.MAP_LOCATIONS.some(l => l.id === 'tools') &&
  sandbox.MAP_LOCATIONS.findIndex(l => l.id === 'tools') === sandbox.MAP_LOCATIONS.findIndex(l => l.id === 'minigames') + 1 &&
  sandbox.MAP_LOCATIONS.findIndex(l => l.id === 'stats') === sandbox.MAP_LOCATIONS.findIndex(l => l.id === 'tools') + 1);
ok('В спортзале есть переход в бассейн, заплыв на месте',
  sandbox.sportListFor('pool').map(d => d.id).join(',') === 'swim' &&
  sandbox.sportListFor('gym').some(d => d.id === 'rings'));

S.houseShrinkOk = true;
S.resetProgress();
S.profileLoaded = true;
S.coins = 99999;
S.buyFurniture('sofa', 'living');
S.saveGame();
const beforeHouse = S.housePieces().map(p => p.id).join(',');
S.rooms.living.furniture = [];
S.houseShrinkOk = false;
S.saveGame();
const afterHouse = S.housePieces().map(p => p.id).join(',');
ok('Пустое сохранение не стирает купленную мебель', afterHouse.indexOf('sofa') !== -1, beforeHouse + ' → ' + afterHouse);

const bench = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'chat-benchmark-scenarios.json'), 'utf8'));
let benchHit = 0;
bench.scenarios.forEach(sc => {
  sandbox.CHAT_MEMORY.reset();
  const q = sc.checkpoint.question;
  let qIdx = -1;
  for (let i = sc.replies.length - 1; i >= 0; i--) {
    if (sc.replies[i].text === q) { qIdx = i; break; }
  }
  if (qIdx < 0) qIdx = sc.checkpoint.at_index;
  const goldIdx = (sc.replies[qIdx] && sc.replies[qIdx].role === 'person') ? qIdx : qIdx + 1;
  sc.replies.slice(0, goldIdx).forEach(r => sandbox.CHAT_MEMORY.note(r.role === 'user' ? 'user' : 'person', r.text));
  const ans = sandbox.CHAT_MEMORY.answer(q).toLowerCase().replace(/ё/g, 'е');
  const re = new RegExp(sc.checkpoint.expected_pattern.toLowerCase().replace(/ё/g, 'е'), 'i');
  const ban = sc.checkpoint.should_not_contain;
  const bad = ban && ans.indexOf(String(ban).toLowerCase()) !== -1;
  if (ans && re.test(ans) && !bad) benchHit++;
});
ok('Память диалога закрывает хотя бы половину сценариев из chat-benchmark',
  benchHit >= 16, benchHit + '/' + bench.scenarios.length);

const quiet = boot.scenes.quiet;
quiet.startGame('window');
const tale = quiet.win && quiet.win.birds[0] && quiet.win.birds[0].tale;
ok('У окна у птицы есть подпись до клика', typeof tale === 'string' && tale.length > 8, tale);

const letters = boot.scenes.minigames;
letters.mode = 'letters';
letters.initLetters();
letters.draw(sandbox.__ctx);
const key = letters.buttons.find(b => b.action === 'letter');
ok('Клавиши «Букв» выше прежних 28 пикселей', key && key.h >= 36, key && key.h);

console.log('\n' + '─'.repeat(50));
console.log('ИТОГО: пройдено ' + pass + ' | провалено ' + fail);
process.exit(fail ? 1 : 0);
