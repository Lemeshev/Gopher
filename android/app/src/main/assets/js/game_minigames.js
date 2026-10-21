// Лепка: ком глины из 12 точек. Палец тянет поверхность, соседи тянутся следом.
// Образец — тот же контур. Сто фигурок, у каждой свой силуэт.

function clayNorm(pts) {
  let cx = 0;
  let cy = 0;
  pts.forEach(p => { cx += p.x; cy += p.y; });
  cx /= pts.length;
  cy /= pts.length;
  let r = 0;
  pts.forEach(p => { r = Math.max(r, Math.hypot(p.x - cx, p.y - cy)); });
  if (r < 0.001) r = 1;
  return pts.map(p => ({ x: (p.x - cx) / r, y: (p.y - cy) / r }));
}

function clayResample(pts, n) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 0.0001;
    seg.push({ a: a, b: b, len: len });
    total += len;
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (total * k) / n;
    for (let s = 0; s < seg.length; s++) {
      if (d <= seg[s].len) {
        const t = d / seg[s].len;
        out.push({
          x: seg[s].a.x + (seg[s].b.x - seg[s].a.x) * t,
          y: seg[s].a.y + (seg[s].b.y - seg[s].a.y) * t
        });
        break;
      }
      d -= seg[s].len;
    }
  }
  return clayNorm(out);
}

function clayFish(len, fat, tail) {
  return [
    { x: len, y: 0 },
    { x: len * 0.55, y: -fat * 0.45 },
    { x: len * 0.1, y: -fat },
    { x: -len * 0.25, y: -fat * 0.72 },
    { x: -len * 0.72, y: -tail },
    { x: -len * 0.42, y: -tail * 0.15 },
    { x: -len * 0.72, y: tail },
    { x: -len * 0.25, y: fat * 0.72 },
    { x: len * 0.08, y: fat },
    { x: len * 0.58, y: fat * 0.4 }
  ];
}

function clayBird(beak, body, tail) {
  return [
    { x: 0.95, y: -0.05 },
    { x: 0.95 + beak, y: 0.12 },
    { x: 0.72, y: 0.22 },
    { x: 0.35, y: body },
    { x: -0.05, y: body * 0.85 },
    { x: -0.55, y: tail },
    { x: -0.85, y: tail * 0.2 },
    { x: -0.4, y: -body * 0.2 },
    { x: 0.05, y: -body * 0.95 },
    { x: 0.45, y: -body * 0.7 }
  ];
}

function clayHouse(roof, wall, chimney) {
  return [
    { x: 0, y: -1 },
    { x: roof, y: -0.25 },
    { x: roof * 0.72, y: -0.25 },
    { x: roof * 0.72, y: -0.25 - chimney },
    { x: roof * 0.48, y: -0.25 - chimney },
    { x: roof * 0.48, y: -0.25 },
    { x: wall, y: -0.15 },
    { x: wall, y: 0.85 },
    { x: -wall, y: 0.85 },
    { x: -wall, y: -0.15 },
    { x: -roof, y: -0.25 }
  ];
}

function clayTree(crown, trunk) {
  return [
    { x: 0, y: -1 },
    { x: crown, y: -0.15 },
    { x: trunk, y: -0.05 },
    { x: trunk, y: 0.95 },
    { x: -trunk, y: 0.95 },
    { x: -trunk, y: -0.05 },
    { x: -crown, y: -0.15 }
  ];
}

function clayMushroom(cap, stem) {
  return [
    { x: 0, y: -0.95 },
    { x: cap, y: -0.35 },
    { x: cap * 0.92, y: -0.12 },
    { x: stem, y: -0.08 },
    { x: stem * 1.1, y: 0.85 },
    { x: -stem * 1.1, y: 0.85 },
    { x: -stem, y: -0.08 },
    { x: -cap * 0.92, y: -0.12 },
    { x: -cap, y: -0.35 }
  ];
}

function clayCar(cab, nose, wheel) {
  return [
    { x: -0.95, y: 0.15 },
    { x: -0.7, y: -0.35 },
    { x: -0.15, y: -0.72 },
    { x: cab, y: -0.68 },
    { x: nose, y: -0.15 },
    { x: 1.05, y: 0.15 },
    { x: 0.85, y: 0.42 },
    { x: 0.55, y: 0.42 + wheel },
    { x: 0.28, y: 0.42 },
    { x: -0.15, y: 0.42 },
    { x: -0.4, y: 0.42 + wheel },
    { x: -0.72, y: 0.42 }
  ];
}

function clayCat(ear, body, tail) {
  return [
    { x: -0.35, y: -0.15 },
    { x: -0.55, y: -0.95 },
    { x: -0.15, y: -0.35 },
    { x: 0.15, y: -0.35 },
    { x: 0.45, y: -0.95 - ear },
    { x: 0.62, y: -0.1 },
    { x: 0.85, y: 0.35 },
    { x: 0.55, y: 0.85 },
    { x: -0.2, y: 0.9 },
    { x: -0.75, y: 0.45 },
    { x: -1.05, y: tail },
    { x: -0.7, y: 0.05 }
  ];
}

function clayRocket(fin, body) {
  return [
    { x: 0, y: -1.05 },
    { x: body * 0.45, y: -0.45 },
    { x: body, y: 0.15 },
    { x: body + fin, y: 0.85 },
    { x: body * 0.35, y: 0.55 },
    { x: 0, y: 0.95 },
    { x: -body * 0.35, y: 0.55 },
    { x: -body - fin, y: 0.85 },
    { x: -body, y: 0.15 },
    { x: -body * 0.45, y: -0.45 }
  ];
}

function clayFlower(petals, stem) {
  const pts = [];
  const n = petals;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    pts.push({ x: Math.cos(a) * 0.72, y: Math.sin(a) * 0.55 - 0.25 });
    pts.push({ x: Math.cos(a + Math.PI / n) * 0.28, y: Math.sin(a + Math.PI / n) * 0.2 - 0.25 });
  }
  pts.push({ x: stem, y: 0.15 });
  pts.push({ x: stem, y: 1 });
  pts.push({ x: -stem, y: 1 });
  pts.push({ x: -stem, y: 0.15 });
  return pts;
}

function clayCup(bowl, handle) {
  return [
    { x: -bowl, y: -0.55 },
    { x: bowl, y: -0.55 },
    { x: bowl * 0.85, y: 0.45 },
    { x: bowl + handle, y: 0.15 },
    { x: bowl + handle, y: -0.15 },
    { x: bowl * 0.95, y: -0.05 },
    { x: bowl * 0.78, y: 0.62 },
    { x: -bowl * 0.78, y: 0.62 }
  ];
}

function clayBoat(hull, sail) {
  return [
    { x: -1, y: 0.25 },
    { x: -0.55, y: 0.72 },
    { x: 0.7, y: 0.72 },
    { x: 1.05, y: 0.2 },
    { x: 0.15, y: 0.18 },
    { x: 0.15, y: -sail },
    { x: 0.72, y: -0.05 },
    { x: 0.12, y: 0.05 },
    { x: -0.85, y: 0.12 }
  ];
}

function clayStar(inner) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
    pts.push({ x: Math.cos(a), y: Math.sin(a) });
    const b = a + Math.PI / 5;
    pts.push({ x: Math.cos(b) * inner, y: Math.sin(b) * inner });
  }
  return pts;
}

function clayHeart(wide, dent) {
  return [
    { x: 0, y: 0.95 },
    { x: -0.85 * wide, y: 0.15 },
    { x: -0.7 * wide, y: -0.55 },
    { x: -0.25, y: -0.72 },
    { x: 0, y: -0.25 - dent },
    { x: 0.25, y: -0.72 },
    { x: 0.7 * wide, y: -0.55 },
    { x: 0.85 * wide, y: 0.15 }
  ];
}

function claySnow(head, mid, base) {
  return [
    { x: 0, y: -1.15 },
    { x: head, y: -0.82 },
    { x: head * 0.65, y: -0.48 },
    { x: mid, y: -0.05 },
    { x: mid * 0.8, y: 0.22 },
    { x: base, y: 0.72 },
    { x: 0, y: 1.05 },
    { x: -base, y: 0.72 },
    { x: -mid * 0.8, y: 0.22 },
    { x: -mid, y: -0.05 },
    { x: -head * 0.65, y: -0.48 },
    { x: -head, y: -0.82 }
  ];
}

function clayHat(brim, crown) {
  return [
    { x: -brim, y: 0.35 },
    { x: -crown, y: 0.22 },
    { x: -crown, y: -0.85 },
    { x: crown, y: -0.85 },
    { x: crown, y: 0.22 },
    { x: brim, y: 0.35 },
    { x: brim * 0.7, y: 0.55 },
    { x: -brim * 0.7, y: 0.55 }
  ];
}

function clayApple(stem, fat) {
  return [
    { x: 0, y: -0.95 },
    { x: 0.12, y: -1.15 },
    { x: 0.28, y: -0.85 },
    { x: fat, y: -0.2 },
    { x: fat * 0.85, y: 0.55 },
    { x: 0.2, y: 0.95 },
    { x: -0.35, y: 0.9 },
    { x: -fat, y: 0.35 },
    { x: -fat * 0.9, y: -0.35 },
    { x: -0.2, y: -0.75 }
  ];
}

function clayDino(neck, tail) {
  return [
    { x: 0.95, y: -0.85 },
    { x: 0.72, y: -0.35 },
    { x: 0.35, y: 0.05 },
    { x: 0.45, y: 0.55 },
    { x: 0.15, y: 0.85 },
    { x: -0.15, y: 0.5 },
    { x: -0.85, y: tail },
    { x: -1.05, y: tail - 0.25 },
    { x: -0.35, y: 0.15 },
    { x: -0.05, y: -neck },
    { x: 0.35, y: -1.05 }
  ];
}

function clayBoot(shaft, toe) {
  return [
    { x: -0.35, y: -1 },
    { x: 0.28, y: -1 },
    { x: 0.32, y: 0.15 },
    { x: toe, y: 0.35 },
    { x: toe, y: 0.72 },
    { x: -0.45, y: 0.72 },
    { x: -0.45, y: 0.2 },
    { x: -shaft, y: -0.2 }
  ];
}

function clayKey(head, bit) {
  return [
    { x: -0.75, y: -0.45 },
    { x: -0.35, y: -0.55 },
    { x: -0.15, y: -0.2 },
    { x: 0.85, y: -0.12 },
    { x: 0.85, y: 0.12 + bit },
    { x: 0.62, y: 0.12 + bit },
    { x: 0.62, y: 0.12 },
    { x: 0.4, y: 0.12 },
    { x: 0.4, y: 0.28 + bit },
    { x: 0.22, y: 0.12 },
    { x: -0.15, y: 0.15 },
    { x: -0.55, y: 0.35 },
    { x: -0.9, y: 0 }
  ];
}

function clayTeapot(spout, lid) {
  return [
    { x: -0.15, y: -0.95 },
    { x: 0.18, y: -0.95 },
    { x: 0.22, y: -0.62 },
    { x: 0.72, y: -0.35 },
    { x: 0.95 + spout, y: -0.55 },
    { x: 0.7, y: -0.05 },
    { x: 0.78, y: 0.55 },
    { x: -0.55, y: 0.62 },
    { x: -0.85, y: 0.05 },
    { x: -1.05, y: -0.15 },
    { x: -0.62, y: -0.35 },
    { x: -0.2, y: -0.62 }
  ];
}

function clayButterfly(wing, body) {
  return [
    { x: 0, y: -0.85 },
    { x: wing, y: -0.45 },
    { x: wing * 0.85, y: 0.05 },
    { x: body, y: 0.15 },
    { x: wing * 0.7, y: 0.55 },
    { x: wing * 0.35, y: 0.9 },
    { x: 0, y: 0.45 },
    { x: -wing * 0.35, y: 0.9 },
    { x: -wing * 0.7, y: 0.55 },
    { x: -body, y: 0.15 },
    { x: -wing * 0.85, y: 0.05 },
    { x: -wing, y: -0.45 }
  ];
}

function clayBowl(rim, foot) {
  return [
    { x: -rim, y: -0.35 },
    { x: rim, y: -0.35 },
    { x: rim * 0.62, y: 0.45 },
    { x: foot, y: 0.72 },
    { x: -foot, y: 0.72 },
    { x: -rim * 0.62, y: 0.45 }
  ];
}

const CLAY_FIGURES = [
  ['Карась', clayFish(0.9, 0.72, 0.38)],
  ['Щука', clayFish(1.25, 0.28, 0.22)],
  ['Камбала', clayFish(1.05, 0.95, 0.18)],
  ['Скалярия', clayFish(0.7, 0.9, 0.85)],
  ['Уклейка', clayFish(1.15, 0.3, 0.16)],
  ['Воробей', clayBird(0.18, 0.55, 0.35)],
  ['Цапля', clayBird(0.45, 0.28, 0.15)],
  ['Утка', clayBird(0.22, 0.7, 0.2)],
  ['Ласточка', clayBird(0.12, 0.32, 0.7)],
  ['Петух', clayBird(0.28, 0.6, 0.85)],
  ['Изба', clayHouse(0.85, 0.7, 0.35)],
  ['Башня', clayHouse(0.45, 0.4, 0.7)],
  ['Сарай', clayHouse(1.05, 0.9, 0.1)],
  ['Маяк', clayHouse(0.35, 0.32, 0.95)],
  ['Терем', clayHouse(0.75, 0.62, 0.45)],
  ['Ёлка', clayTree(0.85, 0.12)],
  ['Дуб', clayTree(1.05, 0.28)],
  ['Пальма', clayTree(0.55, 0.1)],
  ['Тополь', clayTree(0.4, 0.16)],
  ['Куст', clayTree(0.95, 0.4)],
  ['Мухомор', clayMushroom(1, 0.22)],
  ['Белый гриб', clayMushroom(0.72, 0.38)],
  ['Поганка', clayMushroom(0.48, 0.16)],
  ['Сыроежка', clayMushroom(0.9, 0.3)],
  ['Опёнок', clayMushroom(0.4, 0.12)],
  ['Легковая', clayCar(0.35, 0.85, 0.18)],
  ['Грузовик', clayCar(0.15, 1.05, 0.28)],
  ['Автобус', clayCar(0.85, 0.95, 0.16)],
  ['Гоночная', clayCar(0.05, 1.15, 0.1)],
  ['Фургон', clayCar(0.55, 0.7, 0.22)],
  ['Кот сидя', clayCat(0.05, 0.8, 0.55)],
  ['Котёнок', clayCat(0.2, 0.55, 0.85)],
  ['Рысь', clayCat(0.35, 0.7, 0.15)],
  ['Кошка с хвостом', clayCat(0, 0.75, -0.35)],
  ['Барсик', clayCat(0.12, 0.9, 0.25)],
  ['Ракета', clayRocket(0.35, 0.38)],
  ['Ракета-носитель', clayRocket(0.55, 0.55)],
  ['Салютная', clayRocket(0.15, 0.22)],
  ['Шаттл', clayRocket(0.7, 0.28)],
  ['Петарда', clayRocket(0.08, 0.16)],
  ['Ромашка', clayFlower(8, 0.08)],
  ['Тюльпан', clayFlower(4, 0.1)],
  ['Василёк', clayFlower(10, 0.06)],
  ['Одуванчик', clayFlower(12, 0.05)],
  ['Мак', clayFlower(6, 0.12)],
  ['Кружка', clayCup(0.7, 0.28)],
  ['Пиала', clayCup(0.95, 0.05)],
  ['Бокал', clayCup(0.45, 0.12)],
  ['Кувшин', clayCup(0.55, 0.4)],
  ['Чашка', clayCup(0.8, 0.22)],
  ['Лодочка', clayBoat(1, 0.7)],
  ['Яхта', clayBoat(1, 1.15)],
  ['Плот', clayBoat(1.1, 0.15)],
  ['Кораблик', clayBoat(0.9, 0.9)],
  ['Баркас', clayBoat(1.2, 0.4)],
  ['Звезда', clayStar(0.4)],
  ['Звёздочка', clayStar(0.22)],
  ['Снежинка-звезда', clayStar(0.55)],
  ['Знак', clayStar(0.33)],
  ['Искра', clayStar(0.15)],
  ['Сердце', clayHeart(1, 0.15)],
  ['Сердечко', clayHeart(0.75, 0.05)],
  ['Валентинка', clayHeart(1.15, 0.28)],
  ['Пряник-сердце', clayHeart(0.9, 0.2)],
  ['Сердце толстое', clayHeart(1.3, 0)],
  ['Снеговик', claySnow(0.38, 0.58, 0.82)],
  ['Снеговичок', claySnow(0.28, 0.42, 0.6)],
  ['Толстый снег', claySnow(0.5, 0.72, 0.95)],
  ['Три кома', claySnow(0.42, 0.5, 0.7)],
  ['Снежная баба', claySnow(0.33, 0.66, 0.9)],
  ['Шляпа', clayHat(1, 0.45)],
  ['Цилиндр', clayHat(0.7, 0.28)],
  ['Кепка', clayHat(1.15, 0.2)],
  ['Колпак', clayHat(0.4, 0.55)],
  ['Панама', clayHat(1.25, 0.35)],
  ['Яблоко', clayApple(0.2, 0.85)],
  ['Груша', clayApple(0.15, 0.6)],
  ['Слива', clayApple(0.05, 0.5)],
  ['Айва', clayApple(0.1, 1)],
  ['Вишня', clayApple(0.25, 0.4)],
  ['Динозавр', clayDino(0.7, 0.35)],
  ['Диплодок', clayDino(0.35, 0.7)],
  ['Раптор', clayDino(0.9, 0.5)],
  ['Бронтозавр', clayDino(0.4, 0.85)],
  ['Ящер', clayDino(0.6, 0.2)],
  ['Сапог', clayBoot(0.4, 0.95)],
  ['Валенок', clayBoot(0.7, 0.55)],
  ['Ботинок', clayBoot(0.3, 0.8)],
  ['Кроссовок', clayBoot(0.25, 1.05)],
  ['Башмак', clayBoot(0.55, 0.7)],
  ['Ключ', clayKey(0.4, 0.15)],
  ['Ключик', clayKey(0.25, 0.05)],
  ['Ключ от сундука', clayKey(0.55, 0.32)],
  ['Отмычка', clayKey(0.15, 0.22)],
  ['Амбарный ключ', clayKey(0.48, 0.4)],
  ['Чайник', clayTeapot(0.15, 0.2)],
  ['Заварник', clayTeapot(0.05, 0.35)],
  ['Кофейник', clayTeapot(0.35, 0.1)],
  ['Чайничек', clayTeapot(0.22, 0.28)],
  ['Пузатый чайник', clayTeapot(0, 0.4)],
  ['Бабочка', clayButterfly(0.9, 0.12)],
  ['Мотылёк', clayButterfly(0.55, 0.08)],
  ['Махаон', clayButterfly(1.15, 0.1)],
  ['Ночная бабочка', clayButterfly(0.7, 0.2)],
  ['Капустница', clayButterfly(0.8, 0.06)]
].map(row => ({ name: row[0], pts: clayResample(row[1], 12) }));

// ============ СЦЕНА МИНИ-ИГР ============
class MinigamesScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.mode = 'select'; // select, ticTacToe, memory, coinFlip
    this.ttt = { board: Array(9).fill(null), turn: 'X', over: false, winner: null };
    this.memory = { cards: [], flipped: [], matched: [], moves: 0, ready: false, done: false };
    this.coinFlip = { state: 'ready', timer: 0, result: null, angle: 0, flipDur: 1100 };
    this.rps = { you: 0, pet: 0, round: 1, phase: 'pick', pick: null, petHand: null, last: null, msg: '', timer: 0 };
    this.letters = null;
    this.mix = null;
    this.clay = null;
    this.simon = { seq: [], phase: 'idle', timer: 0, lit: -1, input: 0, note: '' };
    this.word = null;
  }

  init() {
    this.time = 0;
    this.mode = 'select';
  }

  initTTT() {
    this.ttt = { board: Array(9).fill(null), turn: 'X', over: false, winner: null };
    this.mode = 'ticTacToe';
  }

  initMemory() {
    const emojis = ['🐹', '🐹', '🎨', '🎨', '🚀', '🚀', '🏛️', '🏛️', '🍽️', '🍽️', '🎓', '🎓', '🏥', '🏥', '🛒', '🛒'];
    // Shuffle
    for (let i = emojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
    }
    this.memory = { cards: emojis, flipped: [], matched: Array(16).fill(false), moves: 0, ready: false, done: false };
    this.mode = 'memory';
  }

  initCoinFlip() {
    this.coinFlip = { state: 'ready', timer: 0, result: null, angle: 0, flipDur: 1100 };
    this.mode = 'coinFlip';
  }

  initRps() {
    this.rps = { you: 0, pet: 0, round: 1, phase: 'pick', pick: null, petHand: null, last: null, msg: 'До двух побед', timer: 0 };
    this.mode = 'rps';
  }

  guessBank() {
    if (typeof WORD_BANK !== 'undefined' && WORD_BANK.length) return WORD_BANK;
    return [{ word: 'мяч', hints: ['круглый', 'игрушка'] }];
  }

  // Недавние слова не повторяются. Буквам и перемешке нужны короткие слова,
  // чтобы клеточки влезли в экран.
  wordBank(kind) {
    const bank = this.guessBank();
    if (!this._seen) this._seen = [];
    let pool = bank.filter(w => this._seen.indexOf(w.word) === -1);
    if (!pool.length) {
      this._seen = [];
      pool = bank.slice();
    }
    if (kind === 'letters') {
      const fit = pool.filter(w => w.word.length >= 4 && w.word.length <= 8);
      if (fit.length) pool = fit;
    } else if (kind === 'mix') {
      const fit = pool.filter(w => w.word.length >= 4 && w.word.length <= 7);
      if (fit.length) pool = fit;
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    this._seen.push(item.word);
    if (this._seen.length > 40) this._seen.shift();
    return item;
  }

  initSimon() {
    this.simon = { seq: [], phase: 'idle', timer: 0, lit: -1, input: 0, note: 'Запомни огоньки и повтори' };
    this.mode = 'simon';
    this.simonExtend();
  }

  initWord() {
    const bank = this.guessBank();
    const item = this.wordBank('word');
    const pool = bank.map(w => w.word).filter(w => w !== item.word);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    const options = [item.word].concat(pool.slice(0, 3));
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = options[i]; options[i] = options[j]; options[j] = t;
    }
    const hints = item.hints.slice();
    const first = hints.splice(Math.floor(Math.random() * hints.length), 1)[0];
    this.word = {
      answer: item.word,
      hints: [first].concat(hints),
      hintI: 0,
      hint: first,
      options: options,
      note: 'Это слово про: ' + first,
      over: false,
      gone: {}
    };
    this.mode = 'word';
  }

  initLetters() {
    const item = this.wordBank('letters');
    const hint = item.hints[Math.floor(Math.random() * item.hints.length)];
    const open = {};
    // Длинное слово начинает с первой буквы, чтобы шарик не сдувался сразу.
    if (item.word.length >= 7) open[item.word.charAt(0)] = true;
    this.letters = { word: item.word, hint: hint, open: open, miss: {}, wrong: 0, max: 6, over: false, won: false };
    this.mode = 'letters';
  }

  initMix() {
    const item = this.wordBank('mix');
    const chars = item.word.split('');
    const tiles = chars.map((ch, i) => ({ ch: ch, id: i, used: false }));
    for (let n = 0; n < 6; n++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = tiles[i]; tiles[i] = tiles[j]; tiles[j] = t;
      }
      if (tiles.map(t => t.ch).join('') !== item.word) break;
    }
    const hint = item.hints[Math.floor(Math.random() * item.hints.length)];
    this.mix = { word: item.word, hint: hint, tiles: tiles, picked: [], over: false, won: false };
    this.mode = 'mix';
  }

  simonExtend() {
    const s = this.simon;
    s.seq.push(Math.floor(Math.random() * 4));
    s.phase = 'show';
    s.timer = 0;
    s.lit = -1;
    s.input = 0;
    s.note = 'Смотри: ' + s.seq.length;
  }

  simonPads(W, H) {
    const r = Math.min(W * 0.12, 48);
    const cx = W / 2;
    const cy = H * 0.42;
    const d = r * 2.4;
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'];
    return colors.map((color, i) => ({
      color: color,
      r: r,
      x: cx + (i % 2 === 0 ? -d / 2 : d / 2),
      y: cy + (i < 2 ? -d / 2 : d / 2)
    }));
  }

  update(dt) {
    this.time += dt;
    const cf = this.coinFlip;
    if (this.mode === 'coinFlip' && cf.state === 'flipping') {
      cf.timer += dt;
      cf.angle += dt * 0.022;
      if (cf.timer >= cf.flipDur) {
        cf.angle = 0;
        cf.result = Math.random() < 0.5 ? 'yes' : 'no';
        cf.state = 'done';
        AudioSys.play('coin');
        System.addXP(2);
        System.saveGame();
      }
    }
    if (this.mode === 'rps' && this.rps.phase === 'count') {
      this.rps.timer += dt;
      if (this.rps.timer >= 900) this.finishRpsRound();
    }
    if (this.mode === 'simon' && this.simon.phase === 'show') {
      const s = this.simon;
      s.timer += dt;
      const slot = 680;
      const i = Math.floor(s.timer / slot);
      if (i >= s.seq.length) {
        s.phase = 'input';
        s.lit = -1;
        s.note = 'Повтори ' + s.seq.length;
      } else {
        s.lit = (s.timer % slot) < 360 ? s.seq[i] : -1;
      }
    }
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2C3E50');
    grad.addColorStop(1, '#4A69BD');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Title
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.06, 28)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎮 Мини-игры', W / 2, H * 0.05);

    // === XP ПРОГРЕСС-БАР В МИНИ-ИГРАХ ===
    const miniXpPct = System.xp / System.xpToNext;
    const miniXpBarY = H * 0.07;
    const miniXpBarW = W - 20;
    const miniXpBarH = 12;

    ctx.font = `bold ${Math.min(W * 0.025, 11)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('⭐ Ур.' + System.level, 10, miniXpBarY);

    ctx.font = `${Math.min(W * 0.02, 9)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,215,0,0.5)';
    ctx.fillText(System.xp + '/' + System.xpToNext, W - 10, miniXpBarY);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, 10, miniXpBarY + 4, miniXpBarW, miniXpBarH, 6);
    ctx.fill();

    if (miniXpPct > 0) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, 10, miniXpBarY + 4, miniXpBarW * miniXpPct, miniXpBarH, 6);
      ctx.fill();
    }

    // Back button
    this.buttons.push(createButton(ctx, 10, 10, 80, 36, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)',
      fgColor: '#fff',
      fontSize: 14,
      radius: 10
    }));

    // Пока гофер спит, мини-игры — единственное «дело»: они не зависят от
    // питомца и не тратят энергию. Об этом честно написано на экране.
    if (System.isSleeping) {
      const note = '\ud83d\udca4 {Pet} спит — играй, энергия копится сама';
      const nSize = fitFontSize(ctx, note, W - 30, Math.min(W * 0.031, 12.5), 8.5, false);
      ctx.font = `${nSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nw = ctx.measureText(note).width + 20;
      ctx.fillStyle = 'rgba(20,20,60,0.7)';
      roundRect(ctx, (W - nw) / 2, H * 0.10, nw, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#9be3b0';
      ctx.fillText(note, W / 2, H * 0.10 + 11);
      ctx.textBaseline = 'alphabetic';
    }

    if (this.mode === 'select') {
      this.drawSelect(ctx, W, H);
    } else if (this.mode === 'ticTacToe') {
      this.drawTTT(ctx, W, H);
    } else if (this.mode === 'memory') {
      this.drawMemory(ctx, W, H);
    } else if (this.mode === 'coinFlip') {
      this.drawCoinFlip(ctx, W, H);
    } else if (this.mode === 'rps') {
      this.drawRps(ctx, W, H);
    } else if (this.mode === 'simon') {
      this.drawSimon(ctx, W, H);
    } else if (this.mode === 'word') {
      this.drawWord(ctx, W, H);
    } else if (this.mode === 'letters') {
      this.drawLetters(ctx, W, H);
    } else if (this.mode === 'mix') {
      this.drawMix(ctx, W, H);
    } else if (this.mode === 'clay') {
      this.drawClay(ctx, W, H);
    }
  }

  drawSelect(ctx, W, H) {
    const games = [
      { id: 'tictactoe', emoji: '❌⭕', name: 'Крестики-нолики', desc: 'Сыграй против {pet_gen}', color: '#FF6B6B' },
      { id: 'memory', emoji: '🧠', name: 'Мемо', desc: 'Найди пары карточек', color: '#9B59B6' },
      { id: 'coinflip', emoji: '🪙', name: 'Монетка: Да или Нет', desc: 'Случайный ответ на вопрос', color: '#FFD93D' },
      { id: 'rps', emoji: '✊', name: 'Камень, ножницы', desc: 'Матч до двух побед', color: '#E07A3C' },
      { id: 'simon', emoji: '💡', name: 'Огоньки', desc: 'Повтори, как зажигались', color: '#4D96FF' },
      { id: 'word', emoji: '🔤', name: 'Угадай слово', desc: 'Подсказка, и ещё одна, если мимо', color: '#2E8B57' },
      { id: 'letters', emoji: '🎈', name: 'Буквы', desc: 'Открой слово, пока шарик цел', color: '#C06C84' },
      { id: 'mix', emoji: '🧩', name: 'Перемешка', desc: 'Буквы перепутаны, собери слово', color: '#3D7EA6' },
      { id: 'clay', emoji: '🏺', name: 'Лепка', desc: 'Потяни ком глины пальцем', color: '#C47A4A' }
    ];

    const btnW = Math.min(W * 0.78, 300);
    const gap = 4;
    const btnH = Math.max(32, Math.min(52, (H * 0.84 - H * 0.13) / games.length - gap));
    const startX = (W - btnW) / 2;

    games.forEach((g, i) => {
      const y = H * 0.13 + i * (btnH + gap);

      ctx.fillStyle = g.color;
      roundRect(ctx, startX, y, btnW, btnH, 15);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      // Размер эмодзи ограничен: ❌⭕ шириной в две эмодзи раньше наезжало
      // на название игры.
      const emojiSizePx = Math.min(btnW * 0.25, 40);
      ctx.font = `${emojiSizePx}px Arial`;
      const emojiW = ctx.measureText(g.emoji).width;
      ctx.fillText(g.emoji, startX + 14, y + btnH / 2 - 10);

      const nameX = Math.max(startX + btnW * 0.28, startX + 14 + emojiW + 8);
      const nameSize = fitFontSize(ctx, g.name, startX + btnW - nameX - 8, Math.min(15, btnH * 0.34), 10, true);
      ctx.font = `bold ${nameSize}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(g.name, nameX, y + btnH / 2 - btnH * 0.16);

      const descSize = fitFontSize(ctx, g.desc, startX + btnW - nameX - 8, Math.min(12, btnH * 0.28), 8, false);
      ctx.font = `${descSize}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(g.desc, nameX, y + btnH / 2 + btnH * 0.22);

      this.buttons.push({ x: startX, y, w: btnW, h: btnH, action: g.id });
    });
  }

  drawWord(ctx, W, H) {
    const g = this.word;
    if (!g) return;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.05, 20)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Угадай слово', W / 2, H * 0.16);
    ctx.fillStyle = '#d6ffe4';
    ctx.font = `${Math.min(W * 0.04, 16)}px Arial`;
    ctx.fillText(g.note, W / 2, H * 0.24);
    const btnW = Math.min(W * 0.72, 280);
    const btnH = 48;
    g.options.forEach((word, i) => {
      const y = H * 0.32 + i * (btnH + 10);
      const x = (W - btnW) / 2;
      const missed = g.gone && g.gone[word];
      let bg = missed ? '#2c3140' : '#3d6b4f';
      if (g.over && word === g.answer) bg = '#6BCB77';
      if (g.over && g.picked === word && word !== g.answer) bg = '#E74C3C';
      const btn = createButton(ctx, x, y, btnW, btnH, word, {
        bgColor: bg, fgColor: missed ? '#8d93a3' : '#fff', fontSize: 18, radius: 12
      });
      if (!missed) this.buttons.push(btn);
    });
    if (g.over) {
      this.buttons.push(createButton(ctx, (W - btnW) / 2, H * 0.32 + 4 * (btnH + 10), btnW, 42, 'Ещё слово', {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 16, radius: 12
      }));
    }
  }

  drawTTT(ctx, W, H) {
    const board = this.ttt.board;
    const cellSize = Math.min(W * 0.22, 80);
    const offsetX = (W - cellSize * 3) / 2;
    const offsetY = H * 0.15;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, offsetX - 10, offsetY - 10, cellSize * 3 + 20, cellSize * 3 + 20, 15);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const x = offsetX + j * cellSize;
        const y = offsetY + i * cellSize;

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 8);
        ctx.fill();

        if (board[i * 3 + j]) {
          ctx.font = `bold ${cellSize * 0.5}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = board[i * 3 + j] === 'X' ? '#FF6B6B' : '#4D96FF';
          ctx.fillText(board[i * 3 + j] === 'X' ? '❌' : '⭕', x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Status
    if (!this.ttt.over) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.ttt.turn === 'X' ? 'Ваш ход! ❌' : '{Pet} думает... ⭕', W / 2, offsetY + cellSize * 3 + 35);
    } else {
      const msg = this.ttt.winner === 'draw' ? '🤝 Ничья!' : this.ttt.winner === 'X' ? '🎉 Вы победили!' : '😢 {Pet} {pet:победил|победила}!';
      ctx.fillStyle = this.ttt.winner === 'X' ? '#6BCB77' : this.ttt.winner === 'draw' ? '#FFD93D' : '#FF6B6B';
      ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
      ctx.fillText(msg, W / 2, offsetY + cellSize * 3 + 35);

      // Reward
      if (this.ttt.winner === 'X') {
        ctx.fillStyle = '#FFD93D';
        ctx.font = `${Math.min(W * 0.035, 16)}px Arial`;
        ctx.fillText('+🪙20 | +XP10', W / 2, offsetY + cellSize * 3 + 65);
      }
    }

    // Restart button
    this.buttons.push(createButton(ctx, W / 2 - 80, H * 0.85, 160, 45, '🔄 Заново', {
      bgColor: '#4D96FF',
      fontSize: 16,
      radius: 12
    }));
  }

  drawMemory(ctx, W, H) {
    const m = this.memory;
    const cols = 4;
    const cellSize = Math.min(W * 0.2, 70);
    const gap = 6;
    const offsetX = (W - (cols * (cellSize + gap) - gap)) / 2;
    const offsetY = H * 0.12;

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.035, 16)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Ходов: ' + m.moves, W / 2, offsetY - 10);

    for (let i = 0; i < 16; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = offsetX + col * (cellSize + gap);
      const y = offsetY + row * (cellSize + gap);

      if (m.matched[i]) {
        ctx.fillStyle = 'rgba(107, 203, 119, 0.3)';
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();
        ctx.font = `${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(m.cards[i], x + cellSize / 2, y + cellSize / 2);
      } else if (m.flipped.includes(i)) {
        ctx.fillStyle = '#fff';
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();
        ctx.font = `${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.fillText(m.cards[i], x + cellSize / 2, y + cellSize / 2);
      } else {
        ctx.fillStyle = '#4D96FF';
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();
        ctx.font = `${cellSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('?', x + cellSize / 2, y + cellSize / 2);
      }
    }

    // Win check
    const allMatched = m.matched.every(m => m);
    if (allMatched) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, W * 0.2, H * 0.5, W * 0.6, 80, 15);
      ctx.fill();
      ctx.fillStyle = '#6BCB77';
      ctx.font = `bold ${Math.min(W * 0.05, 24)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('🎉 Все пары найдены!', W / 2, H * 0.5 + 25);
      ctx.fillStyle = '#FFD93D';
      ctx.font = `${Math.min(W * 0.035, 16)}px Arial`;
      ctx.fillText('+🪙15 | +XP8', W / 2, H * 0.5 + 55);
    }

    this.buttons.push(createButton(ctx, W / 2 - 80, H * 0.88, 160, 40, '🔄 Заново', {
      bgColor: '#4D96FF',
      fontSize: 15,
      radius: 12
    }));
  }

  drawCoinFlip(ctx, W, H) {
    const cf = this.coinFlip;

    // Вопрос-подсказка
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${Math.min(W * 0.036, 15)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Загадай вопрос и подбрось монетку', W / 2, H * 0.16);

    // Монетка
    const R = Math.min(W * 0.22, 90);
    const cx = W / 2;
    const cy = H * 0.36;

    ctx.save();
    ctx.translate(cx, cy);
    if (cf.state === 'flipping') ctx.rotate(cf.angle);

    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(4, 6, R, R, 0, 0, Math.PI * 2);
    ctx.fill();

    // Тело монеты
    const grad = ctx.createLinearGradient(-R, -R, R, R);
    grad.addColorStop(0, '#FFE873');
    grad.addColorStop(0.5, '#FFD93D');
    grad.addColorStop(1, '#E0A800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Внутренний обод
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Символ на монете
    ctx.fillStyle = '#8B6508';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (cf.state === 'done') {
      ctx.font = `bold ${R * 0.5}px Arial`;
      ctx.fillText(cf.result === 'yes' ? 'ДА' : 'НЕТ', 0, 4);
    } else {
      ctx.font = `${R * 0.9}px Arial`;
      ctx.fillText('🪙', 0, 4);
    }
    ctx.restore();

    // Результат / кнопка
    if (cf.state === 'ready') {
      this.buttons.push(createButton(ctx, W / 2 - 110, H * 0.58, 220, 52, '🪙 Подбросить монетку', {
        bgColor: '#FFD93D', fgColor: '#333', fontSize: 16, radius: 15
      }));
    } else if (cf.state === 'flipping') {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.045, 20)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Монетка в воздухе...', W / 2, H * 0.58);
    } else if (cf.state === 'done') {
      const isYes = cf.result === 'yes';
      ctx.fillStyle = isYes ? 'rgba(107,203,119,0.95)' : 'rgba(255,107,107,0.95)';
      roundRect(ctx, W * 0.2, H * 0.52, W * 0.6, 64, 18);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.09, 34)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isYes ? 'ДА' : 'НЕТ', W / 2, H * 0.52 + 32);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = `${Math.min(W * 0.033, 14)}px Arial`;
      ctx.fillText(isYes ? 'Вселенная говорит «да» ✨' : 'Значит, не сейчас 🌙', W / 2, H * 0.64);

      this.buttons.push(createButton(ctx, W / 2 - 90, H * 0.70, 180, 46, '🔄 Ещё раз', {
        bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    }
  }

  drawRps(ctx, W, H) {
    const r = this.rps;
    const hands = [
      { id: 'rock', emoji: '✊', name: 'Камень' },
      { id: 'scissors', emoji: '✌️', name: 'Ножницы' },
      { id: 'paper', emoji: '✋', name: 'Бумага' }
    ];
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Ты ' + r.you + ' : ' + r.pet + ' {pet}', W / 2, H * 0.16);
    ctx.font = `${Math.min(W * 0.034, 15)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    let line = r.msg || 'Выбери жест';
    if (r.phase === 'count') {
      const n = r.timer < 300 ? 'Раз' : (r.timer < 600 ? 'Два' : 'Три');
      line = n + '!';
    }
    ctx.fillText(line, W / 2, H * 0.22);
    if (r.phase !== 'pick') {
      const pet = hands.find(h => h.id === r.petHand);
      const mine = hands.find(h => h.id === r.pick);
      ctx.font = `${Math.min(W * 0.14, 56)}px Arial`;
      const left = r.phase === 'count' ? '✊' : (mine ? mine.emoji : '');
      const right = r.phase === 'count' ? '✊' : (pet ? pet.emoji : '');
      ctx.fillText(left + '    ' + right, W / 2, H * 0.34);
      ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText('ты              {pet}', W / 2, H * 0.40);
    }
    const bw = Math.min(W * 0.26, 100);
    const gap = 10;
    const total = hands.length * bw + gap * 2;
    const x0 = (W - total) / 2;
    hands.forEach((h, i) => {
      const x = x0 + i * (bw + gap);
      const y = H * 0.48;
      ctx.fillStyle = r.pick === h.id ? '#6BCB77' : 'rgba(255,255,255,0.16)';
      roundRect(ctx, x, y, bw, 78, 14);
      ctx.fill();
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(h.emoji, x + bw / 2, y + 30);
      ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
      ctx.fillText(h.name, x + bw / 2, y + 58);
      this.buttons.push({ x: x, y: y, w: bw, h: 78, action: 'rps:' + h.id });
    });
    if (r.phase === 'show' && (r.you >= 2 || r.pet >= 2)) {
      this.buttons.push(createButton(ctx, W / 2 - 90, H * 0.72, 180, 44, 'Ещё матч', {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 16, radius: 12
      }));
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawLetters(ctx, W, H) {
    const g = this.letters;
    if (!g) return;
    this.drawLetterBalloon(ctx, W, H, g);
    const hearts = '❤'.repeat(Math.max(0, g.max - g.wrong)) + '♡'.repeat(g.wrong);
    ctx.fillStyle = '#ff8fa3';
    ctx.font = `${Math.min(W * 0.045, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(hearts, W * 0.62, H * 0.15);
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.min(W * 0.034, 14)}px Arial`;
    ctx.fillText('Подсказка: ' + g.hint, W / 2, H * 0.20);
    const chars = g.word.split('');
    const slot = Math.min(34, (W - 40) / chars.length);
    const x0 = (W - chars.length * slot) / 2;
    ctx.font = `bold ${Math.min(slot * 0.7, 22)}px Arial`;
    chars.forEach((ch, i) => {
      const known = !!g.open[ch];
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      roundRect(ctx, x0 + i * slot + 2, H * 0.24, slot - 4, 36, 6);
      ctx.fill();
      ctx.fillStyle = known ? '#fff' : (g.over ? '#ffb4b4' : '#fff');
      if (known || g.over) ctx.fillText(ch, x0 + i * slot + slot / 2, H * 0.24 + 24);
    });
    const alphabet = 'абвгдежзийклмнопрстуфхцчшщъыьэюя';
    const cols = 8;
    const cw = Math.min(46, (W - 16) / cols);
    const chh = 40;
    const gx = (W - cols * cw) / 2;
    const gy = H * 0.58;
    for (let i = 0; i < alphabet.length; i++) {
      const ch = alphabet.charAt(i);
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gx + col * cw;
      const y = gy + row * (chh + 4);
      ctx.fillStyle = g.open[ch] ? '#6BCB77' : (g.miss && g.miss[ch] ? '#E74C3C' : 'rgba(255,255,255,0.16)');
      roundRect(ctx, x, y, cw - 3, chh, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(cw * 0.55, 14)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(ch, x + (cw - 3) / 2, y + chh / 2 + 5);
      if (!g.over) this.buttons.push({ x: x, y: y, w: cw - 3, h: chh, text: ch, action: 'letter' });
    }
    if (g.over) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.038, 16)}px Arial`;
      ctx.fillText(g.won ? 'Шарик цел! Слово «' + g.word + '».' : 'Шарик улетел. Это «' + g.word + '».', W / 2, gy + 5 * (chh + 4) + 8);
      this.buttons.push(createButton(ctx, W / 2 - 90, Math.min(H - 52, gy + 5 * (chh + 4) + 16), 180, 42, 'Ещё слово', {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 16, radius: 12
      }));
    }
  }

  // Шарик в руках героя: с каждой ошибкой нитка длиннее, на проигрыше он срывается.
  drawLetterBalloon(ctx, W, H, g) {
    const slip = (g.over && !g.won) ? 1 : Math.max(0, Math.min(1, g.wrong / g.max));
    const heroX = W * 0.14;
    const heroY = H * 0.50;
    const id = (typeof System !== 'undefined' && System.look && System.look.char) || 'gopher';
    if (!this._letterHero || this._letterHeroId !== id) {
      this._letterHeroId = id;
      this._letterHero = (typeof createCharacter === 'function') ? createCharacter(id, 78) : null;
    }
    const hero = this._letterHero;
    ctx.save();
    if (hero && hero.draw) {
      try { hero.draw(ctx, heroX, heroY, 0.58); } catch (e) { /* запасной кружок ниже */ }
    }
    if (!hero) {
      ctx.fillStyle = '#7FDBE8';
      ctx.beginPath();
      ctx.arc(heroX, heroY, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    const wobble = Math.sin((this.time || 0) / 180) * (4 + slip * 10);
    const gone = g.over && !g.won;
    const bx = heroX + 34 + slip * 26 + (gone ? 48 : 0) + wobble;
    const by = heroY - 36 - slip * H * 0.11 - (gone ? H * 0.06 : 0);
    g.balloonY = by;
    const handX = heroX + 16;
    const handY = heroY - 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    if (gone) ctx.lineTo(handX + 10, handY - 16);
    else ctx.quadraticCurveTo((handX + bx) / 2, (handY + by) / 2 + 8, bx, by + 16);
    ctx.stroke();
    ctx.translate(bx, by);
    ctx.rotate(wobble / 80);
    ctx.scale(1, 1.25);
    ctx.fillStyle = gone ? 'rgba(255,120,140,0.55)' : '#ff6b8a';
    ctx.beginPath();
    ctx.arc(0, 0, 16 + slip * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(-5, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawMix(ctx, W, H) {
    const g = this.mix;
    if (!g) return;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Собери слово', W / 2, H * 0.16);
    ctx.font = `${Math.min(W * 0.034, 14)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('Подсказка: ' + g.hint, W / 2, H * 0.21);
    const built = g.picked.map(id => g.tiles.filter(t => t.id === id)[0].ch).join('');
    ctx.font = `bold ${Math.min(W * 0.07, 28)}px Arial`;
    ctx.fillStyle = '#fff';
    ctx.fillText(built || '·', W / 2, H * 0.30);
    const n = g.tiles.length;
    const tw = Math.min(48, (W - 30) / Math.max(1, n));
    const x0 = (W - n * tw) / 2;
    g.tiles.forEach((t) => {
      const i = g.tiles.indexOf(t);
      const x = x0 + i * tw;
      const y = H * 0.40;
      ctx.fillStyle = t.used ? 'rgba(255,255,255,0.08)' : '#3D7EA6';
      roundRect(ctx, x + 2, y, tw - 4, 46, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(tw * 0.5, 20)}px Arial`;
      if (!t.used) ctx.fillText(t.ch, x + tw / 2, y + 30);
      if (!t.used && !g.over) this.buttons.push({ x: x, y: y, w: tw, h: 46, action: 'mix:' + t.id });
    });
    if (!g.over) {
      this.buttons.push(createButton(ctx, W / 2 - 110, H * 0.56, 100, 42, 'Стереть', {
        bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 15, radius: 10
      }));
      this.buttons.push(createButton(ctx, W / 2 + 10, H * 0.56, 100, 42, 'Готово', {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 15, radius: 10
      }));
    } else {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(W * 0.04, 16)}px Arial`;
      ctx.fillText(g.won ? 'Верно!' : 'Это «' + g.word + '».', W / 2, H * 0.54);
      this.buttons.push(createButton(ctx, W / 2 - 90, H * 0.60, 180, 44, 'Ещё слово', {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 16, radius: 12
      }));
    }
  }

  drawSimon(ctx, W, H) {
    const s = this.simon;
    const best = (typeof System !== 'undefined' && System.progress) ? (System.progress.simonBest || 0) : 0;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(s.note || 'Огоньки', W / 2, H * 0.18);
    ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Рекорд: ' + best, W / 2, H * 0.22);
    this.simonPads(W, H).forEach((p, i) => {
      const on = s.lit === i;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = on ? 1 : 0.38;
      ctx.beginPath();
      ctx.arc(p.x, p.y, on ? p.r + 4 : p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.buttons.push({
        x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2,
        action: 'simon:' + i
      });
    });
    if (s.phase === 'fail' || s.phase === 'idle') {
      this.buttons.push(createButton(ctx, W / 2 - 80, H * 0.72, 160, 44, '🔄 Заново', {
        bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    }
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    // Back button
    if (this.buttons[0] && isPointInRect(mx, my, this.buttons[0].x, this.buttons[0].y, this.buttons[0].w, this.buttons[0].h)) {
      if (this.mode === 'select') {
        this.game.transitionTo('map');
      } else {
        this.mode = 'select';
      }
      return true;
    }

    // Кнопка «Заново» — вторая в каждой игре (после «Назад»). Проверяем её
    // ДО логики партии: раньше обработчик стоял внутри «партия ещё идёт», и
    // после победы или ничьей кнопка не нажималась — это и был баг.
    if ((this.mode === 'ticTacToe' || this.mode === 'memory') && this.buttons.length > 1) {
      const b = this.buttons[1];
      if (isPointInRect(mx, my, b.x, b.y, b.w, b.h)) {
        if (this.mode === 'ticTacToe') this.initTTT();
        else this.initMemory();
        return true;
      }
    }

    if (this.mode === 'select') {
      for (let i = 1; i < this.buttons.length; i++) {
        const btn = this.buttons[i];
        if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
          switch (btn.action) {
            case 'tictactoe': this.initTTT(); System.countAction('minigames'); break;
            case 'memory': this.initMemory(); System.countAction('minigames'); break;
            case 'coinflip': this.initCoinFlip(); System.countAction('minigames'); break;
            case 'rps': this.initRps(); System.countAction('minigames'); break;
            case 'simon': this.initSimon(); System.countAction('minigames'); break;
            case 'word': this.initWord(); System.countAction('minigames'); break;
            case 'letters': this.initLetters(); System.countAction('minigames'); break;
            case 'mix': this.initMix(); System.countAction('minigames'); break;
            case 'clay': this.initClay(); System.countAction('minigames'); break;
          }
          return true;
        }
      }
    }

    if (this.mode === 'ticTacToe' && !this.ttt.over) {
      // Board click
      const cellSize = Math.min(this.game.width * 0.22, 80);
      const offsetX = (this.game.width - cellSize * 3) / 2;
      const offsetY = this.game.height * 0.15;
      const col = Math.floor((mx - offsetX) / cellSize);
      const row = Math.floor((my - offsetY) / cellSize);
      if (col >= 0 && col < 3 && row >= 0 && row < 3) {
        const idx = row * 3 + col;
        if (!this.ttt.board[idx]) {
          this.ttt.board[idx] = 'X';
          AudioSys.play('click');
          if (this.checkTTTWin('X')) {
            this.ttt.over = true;
            this.ttt.winner = 'X';
            System.countAction('tttWins');
            System.earnCoins(20);
            System.addXP(10);
            System.stats.happiness = Math.min(100, System.stats.happiness + 10);
            System.saveGame();
            AudioSys.play('success');
          } else if (this.ttt.board.every(c => c)) {
            this.ttt.over = true;
            this.ttt.winner = 'draw';
            AudioSys.play('fail');
          } else {
            this.aiMove();
            if (this.checkTTTWin('O')) {
              this.ttt.over = true;
              this.ttt.winner = 'O';
              System.stats.happiness = Math.max(0, System.stats.happiness - 5);
              AudioSys.play('fail');
            } else if (this.ttt.board.every(c => c)) {
              this.ttt.over = true;
              this.ttt.winner = 'draw';
            }
          }
          return true;
        }
      }
    }

    if (this.mode === 'memory') {
      const m = this.memory;
      // Партия окончена: награда уже выдана, остаётся «Заново» (обработана выше)
      if (m.done) return true;
      const cols = 4;
      const cellSize = Math.min(this.game.width * 0.2, 70);
      const gap = 6;
      const offsetX = (this.game.width - (cols * (cellSize + gap) - gap)) / 2;
      const offsetY = this.game.height * 0.12;
      const col = Math.floor((mx - offsetX) / (cellSize + gap));
      const row = Math.floor((my - offsetY) / (cellSize + gap));
      if (col >= 0 && col < 4 && row >= 0 && row < 4) {
        const idx = row * 4 + col;
        if (!m.matched[idx] && !m.flipped.includes(idx) && m.flipped.length < 2) {
          m.flipped.push(idx);
          AudioSys.play('click');
          if (m.flipped.length === 2) {
            m.moves++;
            const [a, b] = m.flipped;
            if (m.cards[a] === m.cards[b]) {
              m.matched[a] = true;
              m.matched[b] = true;
              m.flipped = [];
              AudioSys.play('success');
              // Награда — ровно один раз за партию (раньше монетки капали
              // на каждый клик после победы, пока не нажмёшь «Заново»)
              if (m.matched.every(x => x) && !m.done) {
                m.done = true;
                System.earnCoins(15);
                System.addXP(8);
                System.stats.happiness = Math.min(100, System.stats.happiness + 10);
                System.saveGame();
              }
            } else {
              setTimeout(() => {
                m.flipped = [];
              }, 800);
              AudioSys.play('fail');
            }
          }
          return true;
        }
      }
    }

    if (this.mode === 'rps') {
      for (const btn of this.buttons) {
        if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
        if (btn.text === 'Ещё матч') { this.initRps(); return true; }
        if (this.rps.phase !== 'pick' && this.rps.phase !== 'show') return true;
        if (this.rps.you >= 2 || this.rps.pet >= 2) return true;
        if (!btn.action || btn.action.indexOf('rps:') !== 0) continue;
        this.playRps(btn.action.slice(4));
        return true;
      }
      return true;
    }

    if (this.mode === 'letters' && this.letters) {
      for (let i = 1; i < this.buttons.length; i++) {
        const b = this.buttons[i];
        if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
        if (b.text === 'Ещё слово') { this.initLetters(); return true; }
        if (this.letters.over || b.action !== 'letter') return true;
        this.guessLetter(b.text);
        return true;
      }
      return true;
    }

    if (this.mode === 'mix' && this.mix) {
      for (let i = 1; i < this.buttons.length; i++) {
        const b = this.buttons[i];
        if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
        if (b.text === 'Ещё слово') { this.initMix(); return true; }
        if (b.text === 'Стереть') {
          const id = this.mix.picked.pop();
          const tile = this.mix.tiles.filter(t => t.id === id)[0];
          if (tile) tile.used = false;
          return true;
        }
        if (b.text === 'Готово') { this.finishMix(); return true; }
        if (b.action && b.action.indexOf('mix:') === 0 && !this.mix.over) {
          const id = parseInt(b.action.slice(4), 10);
          const tile = this.mix.tiles.filter(t => t.id === id)[0];
          if (tile && !tile.used) {
            tile.used = true;
            this.mix.picked.push(id);
            AudioSys.play('click');
          }
          return true;
        }
      }
      return true;
    }

    if (this.mode === 'word' && this.word) {
      for (let i = 1; i < this.buttons.length; i++) {
        const b = this.buttons[i];
        if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
        if (b.text === 'Ещё слово') { this.initWord(); return true; }
        if (this.word.over) return true;
        if (this.word.gone && this.word.gone[b.text]) return true;
        this.word.picked = b.text;
        if (b.text === this.word.answer) {
          this.word.over = true;
          this.word.note = 'Да! Это «' + this.word.answer + '».';
          AudioSys.play('success');
          System.countAction('guessWins');
          System.earnCoins(2);
        } else if (this.word.hints && this.word.hintI + 1 < this.word.hints.length) {
          this.word.hintI += 1;
          this.word.gone[b.text] = true;
          this.word.hint = this.word.hints[this.word.hintI];
          this.word.note = 'Ещё подсказка: ' + this.word.hint;
          AudioSys.play('fail');
        } else {
          this.word.over = true;
          this.word.note = 'Это было «' + this.word.answer + '».';
          AudioSys.play('fail');
        }
        return true;
      }
      return true;
    }

    if (this.mode === 'simon') {
      for (const btn of this.buttons) {
        if (btn.text && btn.text.indexOf('Заново') !== -1 &&
            isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
          this.initSimon();
          return true;
        }
      }
      if (this.simon.phase !== 'input') return true;
      const pads = this.simonPads(this.game.width, this.game.height);
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        const dx = mx - p.x, dy = my - p.y;
        if (dx * dx + dy * dy > p.r * p.r) continue;
        const s = this.simon;
        s.lit = i;
        if (i !== s.seq[s.input]) {
          s.phase = 'fail';
          s.note = 'Почти! Рекорд ' + ((System.progress && System.progress.simonBest) || 0);
          AudioSys.play('fail');
          return true;
        }
        s.input++;
        AudioSys.play('click');
        if (s.input >= s.seq.length) {
          const pgr = System.ensureProgress();
          if (s.seq.length > pgr.simonBest) {
            pgr.simonBest = s.seq.length;
            System.checkAchievements();
          }
          System.earnCoins(2);
          System.addXP(1);
          System.saveGame();
          AudioSys.play('success');
          s.phase = 'gap';
          s.note = 'Верно! Дальше ' + (s.seq.length + 1);
          setTimeout(() => {
            if (this.mode === 'simon' && this.simon.phase === 'gap') this.simonExtend();
          }, 700);
        }
        return true;
      }
      return true;
    }

    if (this.mode === 'clay') return this.clickClay(mx, my);

    if (this.mode === 'coinFlip') {
      const cf = this.coinFlip;
      if (cf.state === 'ready' || cf.state === 'done') {
        cf.state = 'flipping';
        cf.timer = 0;
        cf.angle = 0;
        cf.result = null;
      }
      return true;
    }

    return false;
  }

  playRps(pick) {
    const hands = ['rock', 'scissors', 'paper'];
    const beat = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    const lose = { rock: 'paper', scissors: 'rock', paper: 'scissors' };
    let pet;
    const roll = Math.random();
    if (!this.rps.last || roll < 0.4) pet = hands[Math.floor(Math.random() * 3)];
    else if (roll < 0.75) pet = lose[this.rps.last];
    else pet = this.rps.last;
    this.rps.pick = pick;
    this.rps.petHand = pet;
    this.rps.phase = 'count';
    this.rps.timer = 0;
    this.rps.msg = '';
    AudioSys.play('click');
  }

  finishRpsRound() {
    const r = this.rps;
    if (r.phase !== 'count') return;
    const beat = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    r.phase = 'show';
    r.last = r.pick;
    if (beat[r.pick] === r.petHand) {
      r.you++;
      r.msg = 'Твой жест сильнее';
      AudioSys.play('success');
    } else if (beat[r.petHand] === r.pick) {
      r.pet++;
      r.msg = '{Pet} угадал твой жест';
      AudioSys.play('fail');
    } else {
      r.msg = 'Одинаково. Раунд не считается';
      AudioSys.play('click');
    }
    if (r.you >= 2 || r.pet >= 2) {
      if (r.you > r.pet) {
        r.msg = 'Матч твой!';
        System.countAction('rpsWins');
        System.earnCoins(6);
        System.addXP(4);
        System.stats.happiness = Math.min(100, System.stats.happiness + 4);
      } else {
        r.msg = 'Матч за {pet_ins}';
      }
      System.saveGame();
    }
  }

  guessLetter(ch) {
    const g = this.letters;
    if (g.open[ch] || g.miss[ch]) return;
    if (g.word.indexOf(ch) !== -1) {
      g.open[ch] = true;
      AudioSys.play('click');
      const done = g.word.split('').every(c => g.open[c]);
      if (done) {
        g.over = true;
        g.won = true;
        AudioSys.play('success');
        System.countAction('letterWins');
        System.earnCoins(4);
        System.addXP(3);
        System.saveGame();
      }
    } else {
      g.miss[ch] = true;
      g.wrong++;
      AudioSys.play('fail');
      if (g.wrong >= g.max) {
        g.over = true;
        g.won = false;
      }
    }
  }

  finishMix() {
    const g = this.mix;
    const built = g.picked.map(id => g.tiles.filter(t => t.id === id)[0].ch).join('');
    g.over = true;
    g.won = built === g.word;
    if (g.won) {
      AudioSys.play('success');
      System.countAction('mixWins');
      System.earnCoins(4);
      System.addXP(3);
      System.saveGame();
    } else {
      AudioSys.play('fail');
    }
  }

  aiMove() {
    const b = this.ttt.board;
    // Try to win
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        if (this.checkTTTWin('O')) { b[this.ttt._testPos] = null; return; }
        b[i] = null;
      }
    }
    // Try to block
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'X';
        if (this.checkTTTWin('X')) { b[i] = 'O'; return; }
        b[i] = null;
      }
    }
    // Center
    if (!b[4]) { b[4] = 'O'; return; }
    // Random
    const empty = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (empty.length > 0) b[empty[Math.floor(Math.random() * empty.length)]] = 'O';
  }

  initClay() {
    if (!this._claySeen) this._claySeen = [];
    let pool = CLAY_FIGURES.filter(m => this._claySeen.indexOf(m.name) === -1);
    if (!pool.length) {
      this._claySeen = [];
      pool = CLAY_FIGURES.slice();
    }
    const model = pool[Math.floor(Math.random() * pool.length)];
    this._claySeen.push(model.name);
    if (this._claySeen.length > 24) this._claySeen.shift();
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 12;
      pts.push({ x: Math.cos(a) * 0.62, y: Math.sin(a) * 0.62 });
    }
    this.clay = {
      model: model,
      pts: pts,
      grab: -1,
      pulls: 0,
      note: 'Потяни глину пальцем: соседи тянутся следом',
      misses: 0,
      hint: false,
      over: false,
      won: false
    };
    this.mode = 'clay';
  }

  clayGeom(W, H) {
    const top = H * 0.2;
    const bottom = H - 58;
    const gap = 8;
    const boardH = Math.max(120, bottom - top);
    const boardW = (W - 24 - gap) / 2;
    return {
      top: top,
      boardH: boardH,
      boardW: boardW,
      sx: 12,
      bx: 12 + boardW + gap,
      by: top,
      bw: boardW,
      bh: boardH
    };
  }

  clayMap(L, side) {
    const x = side === 'sample' ? L.sx : L.bx;
    return {
      cx: x + L.boardW / 2,
      cy: L.top + L.boardH * 0.48,
      sc: Math.min(L.boardW, L.boardH) * 0.36
    };
  }

  clayLocal(mx, my, L) {
    const m = this.clayMap(L, 'work');
    return { x: (mx - m.cx) / m.sc, y: (my - m.cy) / m.sc };
  }

  traceClay(ctx, pts, map) {
    const p = pts.map(q => ({ x: map.cx + q.x * map.sc, y: map.cy + q.y * map.sc }));
    ctx.beginPath();
    const n0 = p.length;
    ctx.moveTo((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
    for (let i = 1; i <= n0; i++) {
      const cur = p[i % n0];
      const nxt = p[(i + 1) % n0];
      ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
    }
    ctx.closePath();
  }

  paintClay(ctx, pts, map, soft) {
    this.traceClay(ctx, pts, map);
    const g = ctx.createRadialGradient(map.cx - map.sc * 0.2, map.cy - map.sc * 0.25, map.sc * 0.1, map.cx, map.cy, map.sc * 1.1);
    g.addColorStop(0, soft ? '#e7b48a' : '#d08a55');
    g.addColorStop(1, soft ? '#b56b3c' : '#8d4e28');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,32,16,0.45)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  clayScore() {
    const g = this.clay;
    const target = g.model.pts;
    let d = 0;
    g.pts.forEach(p => {
      let best = 99;
      target.forEach(t => {
        const dist = Math.hypot(p.x - t.x, p.y - t.y);
        if (dist < best) best = dist;
      });
      d += best;
    });
    return d / g.pts.length;
  }

  drawClay(ctx, W, H) {
    const g = this.clay;
    if (!g) return;
    const L = this.clayGeom(W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`;
    ctx.fillText(g.over ? (g.won ? 'Получилось!' : 'Глина высохла') : g.model.name, W / 2, H * 0.125);
    const noteSize = fitFontSize(ctx, g.note, W - 24, 12, 9, false);
    ctx.font = `${noteSize}px Arial`;
    ctx.fillStyle = '#ffe7c2';
    ctx.fillText(g.note, W / 2, H * 0.155);

    const board = (x, title) => {
      ctx.fillStyle = '#e7d3b0';
      roundRect(ctx, x, L.top, L.boardW, L.boardH, 14);
      ctx.fill();
      ctx.fillStyle = '#6b4423';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(title, x + L.boardW / 2, L.top + 16);
    };
    board(L.sx, 'Образец');
    board(L.bx, 'Твоя глина');
    this.paintClay(ctx, g.model.pts, this.clayMap(L, 'sample'), false);
    if (g.hint) {
      ctx.save();
      ctx.globalAlpha = 0.33;
      this.paintClay(ctx, g.model.pts, this.clayMap(L, 'work'), false);
      ctx.restore();
    }
    this.paintClay(ctx, g.pts, this.clayMap(L, 'work'), true);

    const y = Math.min(H - 46, L.top + L.boardH + 8);
    const bw = Math.min(104, (W - 28) / 3);
    const labels = g.over ? ['', 'Ещё фигуру', ''] : ['Разгладить', 'Готово', 'Заново'];
    const colors = ['#f3e6cf', '#6BCB77', '#f3e6cf'];
    labels.forEach((text, i) => {
      if (!text) return;
      this.buttons.push(createButton(ctx, 10 + i * (bw + 6), y, bw, 36, text, {
        bgColor: colors[i], fgColor: '#4a2e1c', fontSize: 13, radius: 12
      }));
    });
  }

  beginDrag(mx, my) {
    if (this.mode !== 'clay' || !this.clay || this.clay.over) return false;
    for (let i = 0; i < this.buttons.length; i++) {
      const b = this.buttons[i];
      if (isPointInRect(mx, my, b.x, b.y, b.w, b.h)) return false;
    }
    const L = this.clayGeom(this.game.width, this.game.height);
    if (!isPointInRect(mx, my, L.bx, L.by, L.bw, L.bh)) return false;
    const local = this.clayLocal(mx, my, L);
    let bi = 0;
    let bd = 99;
    this.clay.pts.forEach((p, i) => {
      const d = Math.hypot(p.x - local.x, p.y - local.y);
      if (d < bd) { bd = d; bi = i; }
    });
    this.clay.grab = bi;
    this._clayLast = local;
    return true;
  }

  dragMove(mx, my) {
    const g = this.clay;
    if (!g || g.grab < 0) return;
    const L = this.clayGeom(this.game.width, this.game.height);
    const local = this.clayLocal(mx, my, L);
    const dx = local.x - this._clayLast.x;
    const dy = local.y - this._clayLast.y;
    this._clayLast = local;
    const n = g.pts.length;
    const fall = [1, 0.55, 0.22];
    for (let k = 0; k < fall.length; k++) {
      const a = (g.grab + k) % n;
      const b = (g.grab - k + n) % n;
      g.pts[a].x += dx * fall[k];
      g.pts[a].y += dy * fall[k];
      if (k > 0) {
        g.pts[b].x += dx * fall[k];
        g.pts[b].y += dy * fall[k];
      }
    }
    g.pulls += 1;
    g.note = 'Тяни дальше по контуру образца';
  }

  endDrag() {
    if (this.clay) this.clay.grab = -1;
  }

  clickClay(mx, my) {
    const g = this.clay;
    if (!g) return false;
    for (let i = 1; i < this.buttons.length; i++) {
      const b = this.buttons[i];
      if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
      if (b.text === 'Ещё фигуру') { this.initClay(); return true; }
      if (b.text === 'Заново') {
        for (let k = 0; k < 12; k++) {
          const a = -Math.PI / 2 + (Math.PI * 2 * k) / 12;
          g.pts[k].x = Math.cos(a) * 0.62;
          g.pts[k].y = Math.sin(a) * 0.62;
        }
        g.pulls = 0;
        g.hint = false;
        g.note = 'Ком снова круглый. Потяни его заново';
        AudioSys.play('click');
        return true;
      }
      if (b.text === 'Разгладить') return this.smoothClay();
      if (b.text === 'Готово') return this.finishClay();
    }
    return false;
  }

  smoothClay() {
    const g = this.clay;
    if (!g || g.over) return true;
    const next = g.pts.map((p, i) => {
      const a = g.pts[(i + 1) % g.pts.length];
      const b = g.pts[(i - 1 + g.pts.length) % g.pts.length];
      return { x: p.x * 0.5 + (a.x + b.x) * 0.25, y: p.y * 0.5 + (a.y + b.y) * 0.25 };
    });
    g.pts = next;
    g.note = 'Разгладил. Теперь потяни там, где образец выпирает';
    AudioSys.play('click');
    return true;
  }

  finishClay() {
    const g = this.clay;
    if (g.pulls < 6) {
      g.note = 'Сначала помни глину пальцем, круг сам не станет фигуркой';
      AudioSys.play('fail');
      return true;
    }
    const dist = this.clayScore();
    if (dist < 0.34) {
      g.over = true;
      g.won = true;
      g.note = 'Это и правда ' + g.model.name;
      AudioSys.play('success');
      System.countAction('clayWins');
      System.earnCoins(8);
      System.addXP(6);
      System.stats.happiness = Math.min(100, System.stats.happiness + 4);
      System.stats.intelligence = Math.min(100, System.stats.intelligence + 1);
      System.saveGame();
      return true;
    }
    g.misses++;
    if (g.misses >= 3) {
      g.hint = true;
      g.note = 'Подсказка легла на глину. Потяни свой ком к ней';
    } else {
      g.note = 'Пока не похоже. Потяни выступы и вдави лишнее';
    }
    AudioSys.play('fail');
    return true;
  }

  checkTTTWin(p) {
    const b = this.ttt.board;
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => w.every(i => b[i] === p));
  }
}
window.MinigamesScene = MinigamesScene;
