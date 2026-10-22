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
    if (this.mode === 'salon' && this.salon) {
      const g = this.salon;
      g.t = (g.t || 0) + dt;
      (g.bubbles || []).forEach(b => {
        b.y -= dt * 0.045;
        b.x += Math.sin((g.t + b.y) / 180) * dt * 0.01;
        b.a -= dt * 0.0007;
      });
      g.bubbles = (g.bubbles || []).filter(b => b.a > 0);
      if (g.snip > 0) g.snip -= dt;
      if (g.comb > 0) g.comb -= dt;
      if (g.iron > 0) g.iron -= dt;
      if (g.drip > 0) g.drip -= dt;
      if (g.foam > 0) g.foam -= dt;
      if (g.spark > 0) g.spark -= dt;
    }
    if (this.mode === 'clay' && this.clay && this.clay.stage === 'dry') {
      const c = this.clay;
      c.puff = c.puff || [];
      if (c.grab === -2 && c.dryer) {
        c.puff.push({
          x: c.dryer.x - 36,
          y: c.dryer.y + (Math.random() - 0.5) * 18,
          vx: -0.08 - Math.random() * 0.06,
          a: 0.7,
          r: 3 + Math.random() * 4
        });
      }
      c.puff.forEach(p => {
        p.x += p.vx * dt;
        p.a -= dt * 0.0011;
        p.r += dt * 0.004;
      });
      if (c.puff.length > 40) c.puff.splice(0, c.puff.length - 40);
      c.puff = c.puff.filter(p => p.a > 0);
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
    } else if (this.mode === 'salon') {
      this.drawSalon(ctx, W, H);
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
      { id: 'clay', emoji: '🏺', name: 'Лепка', desc: 'Потяни ком глины пальцем', color: '#C47A4A' },
      { id: 'salon', emoji: '💇', name: 'Парикмахерская', desc: 'Стрижка, кудри и цвет', color: '#D4567A' }
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
      if (this.mode === 'clay' && this.clay && this.clay.stage && this.clay.stage !== 'menu') {
        this.clay = { stage: 'menu', note: 'По образцу или своя фигурка', grab: -1 };
        return true;
      }
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
            case 'salon': this.initSalon(); System.countAction('minigames'); break;
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
    if (this.mode === 'salon') return this.clickSalon(mx, my);

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
    this.mode = 'clay';
    this.clay = { stage: 'menu', note: 'По образцу или своя фигурка', grab: -1 };
  }

  clayCircle(n, r) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return pts;
  }

  startSampleClay() {
    if (!this._claySeen) this._claySeen = [];
    let pool = CLAY_FIGURES.filter(m => this._claySeen.indexOf(m.name) === -1);
    if (!pool.length) {
      this._claySeen = [];
      pool = CLAY_FIGURES.slice();
    }
    const model = pool[Math.floor(Math.random() * pool.length)];
    this._claySeen.push(model.name);
    if (this._claySeen.length > 24) this._claySeen.shift();
    this.clay = {
      stage: 'sample',
      model: model,
      pts: this.clayCircle(12, 0.62),
      grab: -1,
      pulls: 0,
      note: 'Потяни глину пальцем: рядом гнётся слабее',
      misses: 0,
      hint: false,
      over: false,
      won: false
    };
  }

  startFreeClay() {
    this.clay = {
      stage: 'free',
      pts: this.clayCircle(16, 0.62),
      colors: [],
      grab: -1,
      pulls: 0,
      dry: 0,
      paint: '#c0392b',
      strokes: [],
      note: 'Слепи что хочешь. Рядом глина поддаётся чуть-чуть',
      over: false
    };
    for (let i = 0; i < 16; i++) this.clay.colors.push('');
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
    const g = this.clay;
    const wide = g && g.stage !== 'sample';
    const m = wide
      ? { cx: 12 + (this.game.width - 24) / 2, cy: L.top + L.boardH * 0.48, sc: Math.min(this.game.width - 24, L.boardH) * 0.36 }
      : this.clayMap(L, 'work');
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

  paintClay(ctx, pts, map, soft, colors, strokes, dryAmt) {
    this.traceClay(ctx, pts, map);
    ctx.save();
    ctx.clip();
    const wet = ctx.createRadialGradient(map.cx - map.sc * 0.15, map.cy - map.sc * 0.2, map.sc * 0.08, map.cx, map.cy, map.sc * 1.15);
    wet.addColorStop(0, soft ? '#f0c49a' : '#d7b48a');
    wet.addColorStop(1, soft ? '#a85a32' : '#7a4024');
    ctx.fillStyle = wet;
    ctx.fillRect(map.cx - map.sc * 2, map.cy - map.sc * 2, map.sc * 4, map.sc * 4);
    const dry = dryAmt == null ? (soft ? 0 : 100) : dryAmt;
    const t = Math.max(0, Math.min(1, dry / 100));
    if (t > 0) {
      const matte = ctx.createRadialGradient(map.cx, map.cy - map.sc * 0.1, map.sc * 0.05, map.cx, map.cy, map.sc * 1.1);
      matte.addColorStop(0, '#f6e2c4');
      matte.addColorStop(1, '#c4895a');
      ctx.globalAlpha = t;
      ctx.fillStyle = matte;
      ctx.fillRect(map.cx - map.sc * 2, map.cy - map.sc * 2, map.sc * 4, map.sc * 4);
      ctx.globalAlpha = 1;
    }
    const blob = (x, y, col, rad) => {
      ctx.fillStyle = col;
      for (let k = 4; k >= 1; k--) {
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(x, y, rad * (k / 4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    if (colors && colors.some(c => c)) {
      const p = pts.map(q => ({ x: map.cx + q.x * map.sc, y: map.cy + q.y * map.sc }));
      for (let i = 0; i < p.length; i++) {
        if (!colors[i]) continue;
        blob(p[i].x, p[i].y, colors[i], map.sc * 0.3);
      }
    }
    (strokes || []).forEach(s => {
      blob(map.cx + s.x * map.sc, map.cy + s.y * map.sc, s.c, (s.r || 0.14) * map.sc);
    });
    if (t < 0.9) {
      ctx.globalAlpha = 0.28 * (1 - t);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(map.cx - map.sc * 0.16, map.cy - map.sc * 0.22, map.sc * 0.2, map.sc * 0.1, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    this.traceClay(ctx, pts, map);
    ctx.strokeStyle = 'rgba(70,32,16,0.5)';
    ctx.lineWidth = 2;
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
    if (g.stage === 'menu' || g.stage === 'gallery') return this.drawClayMenu(ctx, W, H);
    const L = this.clayGeom(W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`;
    const title = g.stage === 'sample'
      ? (g.over ? (g.won ? 'Получилось!' : 'Глина высохла') : g.model.name)
      : (g.stage === 'dry' ? 'Сушка' : (g.stage === 'paint' ? 'Роспись' : 'Своя фигурка'));
    ctx.fillText(title, W / 2, H * 0.125);
    const noteSize = fitFontSize(ctx, g.note, W - 24, 12, 9, false);
    ctx.font = `${noteSize}px Arial`;
    ctx.fillStyle = '#ffe7c2';
    ctx.fillText(g.note, W / 2, H * 0.155);

    const board = (x, w, title2) => {
      ctx.fillStyle = '#e7d3b0';
      roundRect(ctx, x, L.top, w, L.boardH, 14);
      ctx.fill();
      ctx.fillStyle = '#6b4423';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(title2, x + w / 2, L.top + 16);
    };
    if (g.stage === 'sample') {
      board(L.sx, L.boardW, 'Образец');
      board(L.bx, L.boardW, 'Твоя глина');
      this.paintClay(ctx, g.model.pts, this.clayMap(L, 'sample'), false);
      if (g.hint) {
        ctx.save();
        ctx.globalAlpha = 0.33;
        this.paintClay(ctx, g.model.pts, this.clayMap(L, 'work'), false);
        ctx.restore();
      }
      this.paintClay(ctx, g.pts, this.clayMap(L, 'work'), true);
    } else {
      const wide = { top: L.top, boardH: L.boardH, boardW: W - 24, sx: 12, bx: 12, by: L.top, bw: W - 24, bh: L.boardH };
      board(12, W - 24, g.stage === 'dry' ? 'Веди фен по глине' : 'Твоя глина');
      const map = this.clayMap(wide, 'work');
      this.paintClay(ctx, g.pts, map, g.stage === 'free', g.colors, g.strokes, g.stage === 'dry' ? (g.dry || 0) : (g.stage === 'paint' ? 100 : 0));
      if (g.stage === 'dry') {
        const px = 24;
        const bw = W - 48;
        const by = L.top + L.boardH - 22;
        ctx.fillStyle = 'rgba(74,46,28,0.25)';
        roundRect(ctx, px, by, bw, 10, 5);
        ctx.fill();
        ctx.fillStyle = '#e07a3c';
        roundRect(ctx, px, by, bw * Math.min(1, (g.dry || 0) / 100), 10, 5);
        ctx.fill();
        if (!g.dryer) g.dryer = { x: W - 78, y: L.top + L.boardH * 0.55 };
        (g.puff || []).forEach(p => {
          ctx.globalAlpha = Math.max(0, p.a);
          ctx.fillStyle = 'rgba(255,220,170,0.9)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        this.drawDryer(ctx, g.dryer.x, g.dryer.y, g.grab === -2);
      }
      if (g.stage === 'paint') {
        const palette = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#f4f1ea', '#2c3e50'];
        palette.forEach((col, i) => {
          const x = 16 + i * 34;
          const y = L.top + 24;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
          if (g.paint === col) {
            ctx.strokeStyle = '#4a2e1c';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          this.buttons.push({ x: x - 14, y: y - 14, w: 28, h: 28, text: 'paint:' + col });
        });
      }
    }

    const y = Math.min(H - 46, L.top + L.boardH + 8);
    const bw = Math.min(104, (W - 28) / 3);
    let labels = ['Разгладить', 'Готово', 'Заново'];
    if (g.stage === 'sample' && g.over) labels = ['', 'Ещё фигуру', ''];
    if (g.stage === 'free') labels = ['Разгладить', 'Сушить', 'Заново'];
    if (g.stage === 'dry') labels = ['', 'Ещё погреть', ''];
    if (g.stage === 'paint') labels = ['', 'В галерею', 'Заново'];
    const colors = ['#f3e6cf', '#6BCB77', '#f3e6cf'];
    labels.forEach((text, i) => {
      if (!text) return;
      this.buttons.push(createButton(ctx, 10 + i * (bw + 6), y, bw, 36, text, {
        bgColor: colors[i], fgColor: '#4a2e1c', fontSize: 13, radius: 12
      }));
    });
  }

  drawDryer(ctx, x, y, blowing) {
    ctx.save();
    ctx.translate(x, y + Math.sin(this.time / 140) * (blowing ? 2.5 : 1));
    if (blowing) {
      ctx.strokeStyle = 'rgba(255,190,120,0.85)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const yy = -16 + i * 16;
        const wave = Math.sin(this.time / 90 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(-8, yy);
        ctx.quadraticCurveTo(-28, yy + wave, -52, yy - wave);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#eceff1';
    roundRect(ctx, -6, -22, 46, 36, 10);
    ctx.fill();
    ctx.fillStyle = '#e07a3c';
    roundRect(ctx, 8, -16, 22, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#b0bec5';
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.lineTo(-28, -26);
    ctx.lineTo(-28, 16);
    ctx.lineTo(-6, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.arc(-28, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfd8dc';
    roundRect(ctx, 16, 12, 12, 26, 5);
    ctx.fill();
    ctx.restore();
  }

  drawClayMenu(ctx, W, H) {
    const g = this.clay;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.min(W * 0.05, 20)}px Arial`;
    ctx.fillText(g.stage === 'gallery' ? 'Галерея' : 'Лепка', W / 2, H * 0.16);
    ctx.font = '13px Arial';
    ctx.fillStyle = '#ffe7c2';
    ctx.fillText(g.note || '', W / 2, H * 0.2);
    if (g.stage === 'gallery') {
      const works = (System.clayWorks || []).slice(0, 12);
      if (!works.length) {
        ctx.fillStyle = '#fff';
        ctx.fillText('Пока пусто. Слепи свою и нажми «В галерею»', W / 2, H * 0.4);
      }
      works.forEach((work, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cw = Math.min(100, (W - 36) / 3);
        const x = 12 + col * (cw + 8);
        const y = H * 0.26 + row * (cw + 8);
        ctx.fillStyle = '#e7d3b0';
        roundRect(ctx, x, y, cw, cw, 12);
        ctx.fill();
        const map = { cx: x + cw / 2, cy: y + cw / 2, sc: cw * 0.34 };
        this.paintClay(ctx, work.pts, map, false, work.colors, work.strokes, 100);
      });
      return;
    }
    const bw = Math.min(260, W - 40);
    const x = (W - bw) / 2;
    this.buttons.push(createButton(ctx, x, H * 0.3, bw, 48, 'По образцу', {
      bgColor: '#C47A4A', fgColor: '#fff', fontSize: 16, radius: 14
    }));
    this.buttons.push(createButton(ctx, x, H * 0.3 + 60, bw, 48, 'Своя фигурка', {
      bgColor: '#8d4e28', fgColor: '#fff', fontSize: 16, radius: 14
    }));
    this.buttons.push(createButton(ctx, x, H * 0.3 + 120, bw, 48, 'Галерея', {
      bgColor: '#f3e6cf', fgColor: '#4a2e1c', fontSize: 16, radius: 14
    }));
  }

  beginDrag(mx, my) {
    const g0 = this.clay;
    if (this.mode !== 'clay' || !g0 || g0.over) return false;
    if (g0.stage === 'menu' || g0.stage === 'gallery') return false;
    for (let i = 0; i < this.buttons.length; i++) {
      const b = this.buttons[i];
      if (isPointInRect(mx, my, b.x, b.y, b.w, b.h)) return false;
    }
    const L = this.clayGeom(this.game.width, this.game.height);
    const onBoard = g0.stage === 'sample'
      ? isPointInRect(mx, my, L.bx, L.by, L.bw, L.bh)
      : isPointInRect(mx, my, 12, L.top, this.game.width - 24, L.boardH);
    if (!onBoard) return false;
    if (g0.stage === 'dry') {
      g0.grab = -2;
      g0.dryer = { x: mx, y: my };
      return true;
    }
    if (g0.stage === 'paint') {
      g0.grab = -3;
      this.paintClayAt(mx, my);
      return true;
    }
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
    if (!g || g.grab < 0 && g.grab !== -2 && g.grab !== -3) return;
    if (g.grab === -2) {
      g.dryer = { x: mx, y: my };
      g.dry = Math.min(100, (g.dry || 0) + 1.8);
      if (g.dry >= 100) {
        g.stage = 'paint';
        g.grab = -1;
        g.note = 'Высохло. Выбери краску и проведи по фигурке';
      } else {
        g.note = 'Фен греет. Осталось ещё поводить';
      }
      return;
    }
    if (g.grab === -3) {
      this.paintClayAt(mx, my);
      return;
    }
    const L = this.clayGeom(this.game.width, this.game.height);
    const local = this.clayLocal(mx, my, L);
    const dx = local.x - this._clayLast.x;
    const dy = local.y - this._clayLast.y;
    this._clayLast = local;
    const n = g.pts.length;
    const fall = g.stage === 'free' ? [1, 0.38, 0.14, 0.05] : [1, 0.4, 0.14];
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
      if (b.text === 'По образцу') { this.startSampleClay(); return true; }
      if (b.text === 'Своя фигурка') { this.startFreeClay(); return true; }
      if (b.text === 'Галерея') {
        g.stage = 'gallery';
        g.note = 'То, что уже высохло и расписано';
        return true;
      }
      if (b.text.indexOf('paint:') === 0) { g.paint = b.text.slice(6); return true; }
      if (b.text === 'Сушить') {
        if (g.pulls < 6) {
          g.note = 'Сначала помни глину пальцем';
          AudioSys.play('fail');
          return true;
        }
        g.stage = 'dry';
        g.dry = 0;
        g.note = 'Веди фен по фигурке, пока полоска не заполнится';
        AudioSys.play('click');
        return true;
      }
      if (b.text === 'Ещё погреть') {
        g.dry = Math.min(100, (g.dry || 0) + 22);
        if (g.dry >= 100) {
          g.stage = 'paint';
          g.note = 'Высохло. Выбери краску и проведи по фигурке';
        }
        AudioSys.play('click');
        return true;
      }
      if (b.text === 'В галерею') return this.saveClayWork();
      if (b.text === 'Ещё фигуру') { this.startSampleClay(); return true; }
      if (b.text === 'Заново' && g.stage !== 'sample') { this.startFreeClay(); return true; }
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

  paintClayAt(mx, my) {
    const g = this.clay;
    const L = this.clayGeom(this.game.width, this.game.height);
    const local = this.clayLocal(mx, my, L);
    let bi = 0;
    let bd = 99;
    g.pts.forEach((p, i) => {
      const d = Math.hypot(p.x - local.x, p.y - local.y);
      if (d < bd) { bd = d; bi = i; }
    });
    g.colors[bi] = g.paint;
    if (!g.strokes) g.strokes = [];
    const last = g.strokes[g.strokes.length - 1];
    if (!last || Math.hypot(last.x - local.x, last.y - local.y) > 0.045) {
      g.strokes.push({
        x: Math.round(local.x * 100) / 100,
        y: Math.round(local.y * 100) / 100,
        r: 0.16,
        c: g.paint
      });
      if (g.strokes.length > 90) g.strokes.shift();
    }
    g.note = 'Веди пальцем. Цвет можно сменить сверху';
  }

  saveClayWork() {
    const g = this.clay;
    const piece = {
      pts: g.pts.map(p => ({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 })),
      colors: g.colors.slice(),
      strokes: (g.strokes || []).slice()
    };
    if (!System.clayWorks) System.clayWorks = [];
    System.clayWorks.unshift(piece);
    if (System.clayWorks.length > 18) System.clayWorks.length = 18;
    System.saveGame();
    this.clay = { stage: 'gallery', note: 'Фигурка сохранена', grab: -1 };
    AudioSys.play('success');
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

  salonColor(id) {
    const all = [
      { id: 'black', hex: '#2b2118', name: 'чёрный' },
      { id: 'brown', hex: '#6b3e26', name: 'каштановый' },
      { id: 'blonde', hex: '#e6c36a', name: 'русый' },
      { id: 'red', hex: '#c4522a', name: 'рыжий' },
      { id: 'pink', hex: '#e56aa8', name: 'розовый' },
      { id: 'blue', hex: '#3d6fd8', name: 'синий' },
      { id: 'green', hex: '#3e9a62', name: 'зелёный' },
      { id: 'violet', hex: '#7a4ea3', name: 'фиолетовый' }
    ];
    for (let i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return all[1];
  }

  salonPeople() {
    return [
      { name: 'Маша', who: 'girl', shirt: '#f48fb1' },
      { name: 'Петя', who: 'boy', shirt: '#64b5f6' },
      { name: 'Аня', who: 'girl', shirt: '#ce93d8' },
      { name: 'Миша', who: 'boy', shirt: '#81c784' },
      { name: 'Лена', who: 'woman', shirt: '#ffb74d' },
      { name: 'Олег', who: 'man', shirt: '#4db6ac' },
      { name: 'Нина', who: 'grandma', shirt: '#bcaaa4' },
      { name: 'Павел', who: 'grandpa', shirt: '#90a4ae' },
      { name: 'Кира', who: 'girl', shirt: '#f06292' },
      { name: 'Тим', who: 'boy', shirt: '#4fc3f7' },
      { name: 'Соня', who: 'woman', shirt: '#ba68c8' },
      { name: 'Глеб', who: 'man', shirt: '#7986cb' },
      { name: 'Рая', who: 'grandma', shirt: '#aed581' },
      { name: 'Боря', who: 'grandpa', shirt: '#a1887f' },
      { name: 'Злата', who: 'girl', shirt: '#ffd54f' },
      { name: 'Егор', who: 'boy', shirt: '#4dd0e1' },
      { name: 'Вера', who: 'woman', shirt: '#e57373' },
      { name: 'Илья', who: 'man', shirt: '#66bb6a' }
    ];
  }

  salonMale(who) {
    return who === 'boy' || who === 'man' || who === 'grandpa';
  }

  salonCopyHair(h) {
    return {
      len: h.len, curl: h.curl, color: h.color, streak: h.streak,
      bangs: h.bangs, gel: h.gel, clean: h.clean,
      bow: !!h.bow, clip: !!h.clip, part: !!h.part, spray: !!h.spray
    };
  }

  salonRandomHair(who) {
    const cols = ['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'green', 'violet'];
    const male = this.salonMale(who);
    const streak = !male && Math.random() < 0.35 ? cols[Math.floor(Math.random() * cols.length)] : null;
    const len = male
      ? (Math.random() < 0.84 ? 0.32 + Math.random() * 0.1 : 0.5 + Math.random() * 0.1)
      : (Math.random() < 0.84 ? 0.84 + Math.random() * 0.16 : 0.62 + Math.random() * 0.12);
    return {
      len: len,
      curl: male ? (Math.random() < 0.7 ? 0 : 1) : Math.floor(Math.random() * 3),
      color: cols[Math.floor(Math.random() * 4)],
      streak: streak,
      bangs: Math.random() < (male ? 0.22 : 0.45),
      gel: Math.random() < 0.2,
      bow: false,
      clip: false,
      part: false,
      spray: false,
      clean: 0
    };
  }

  salonWishLine(w) {
    const len = w.len < 0.48 ? 'короткие' : (w.len < 0.78 ? 'средние' : 'длинные');
    const curl = w.curl === 0 ? 'прямые' : (w.curl === 1 ? 'волны' : 'кудри');
    let s = len + ' ' + curl + ', цвет ' + this.salonColor(w.color).name;
    if (w.streak) s += ', прядь ' + this.salonColor(w.streak).name;
    if (w.bangs) s += ', чёлка';
    if (w.gel) s += ', с гелем';
    return s;
  }

  initSalon() {
    this.mode = 'salon';
    if (!this._salonSeen) this._salonSeen = [];
    const people = this.salonPeople().filter(p => this._salonSeen.indexOf(p.name) === -1);
    const pool = people.length ? people : this.salonPeople();
    if (!people.length) this._salonSeen = [];
    const who = pool[Math.floor(Math.random() * pool.length)];
    this._salonSeen.push(who.name);
    if (this._salonSeen.length > 8) this._salonSeen.shift();
    const skins = ['#f6d3b4', '#e8b892', '#c68642', '#8d5524', '#f3c6a5'];
    const hair = this.salonRandomHair(who.who);
    const wish = this.salonCopyHair(hair);
    wish.clean = 2;
    const male = this.salonMale(who.who);
    const keys = male
      ? ['len', 'curl', 'color', 'bangs', 'gel', 'part']
      : ['len', 'curl', 'color', 'streak', 'bangs', 'gel', 'bow', 'clip', 'part'];
    const cols = ['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'green', 'violet'];
    const used = {};
    const nch = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < nch; k++) {
      let key = keys[Math.floor(Math.random() * keys.length)];
      let guard = 0;
      while (used[key] && guard < 8) {
        key = keys[Math.floor(Math.random() * keys.length)];
        guard++;
      }
      used[key] = true;
      if (key === 'len') wish.len = male ? (Math.random() < 0.85 ? 0.34 : 0.56) : (Math.random() < 0.85 ? 0.96 : 0.66);
      if (key === 'curl') wish.curl = (wish.curl + 1 + Math.floor(Math.random() * 2)) % 3;
      if (key === 'color') {
        let c = cols[Math.floor(Math.random() * cols.length)];
        if (c === wish.color) c = cols[(cols.indexOf(c) + 3) % cols.length];
        wish.color = c;
      }
      if (key === 'streak') {
        wish.streak = wish.streak ? null : cols[Math.floor(Math.random() * cols.length)];
        if (wish.streak === wish.color) wish.streak = 'pink';
      }
      if (key === 'bangs') wish.bangs = !wish.bangs;
      if (key === 'gel') wish.gel = !wish.gel;
      if (key === 'bow') wish.bow = !wish.bow;
      if (key === 'clip') wish.clip = !wish.clip;
      if (key === 'part') wish.part = !wish.part;
    }
    this.salon = {
      person: { name: who.name, who: who.who, shirt: who.shirt, skin: skins[Math.floor(Math.random() * skins.length)] },
      hair: hair,
      wish: wish,
      tool: 'shampoo',
      dye: 'pink',
      note: '',
      bubbles: [],
      over: false,
      head: null,
      t: 0,
      snip: 0,
      comb: 0,
      iron: 0,
      drip: 0,
      foam: 0,
      spark: 0,
      smile: 0
    };
  }

  salonBurst(x, y) {
    const g = this.salon;
    for (let i = 0; i < 8; i++) {
      g.bubbles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        r: 3 + Math.random() * 5,
        a: 1
      });
    }
  }

  drawSalonHair(ctx, hair) {
    const col = this.salonColor(hair.color).hex;
    const len = 22 + hair.len * 78;
    const sway = Math.sin((this.time || 0) / 280) * (hair.curl === 0 ? 1.5 : 3);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-32, -2);
    ctx.quadraticCurveTo(-38, -46, 0, -48);
    ctx.quadraticCurveTo(38, -46, 32, -2);
    if (hair.curl === 0) {
      ctx.lineTo(26 + sway, len);
      ctx.quadraticCurveTo(0, len + 10, -26 + sway, len);
    } else {
      const bumps = hair.curl === 2 ? 6 : 3;
      for (let i = 0; i <= bumps; i++) {
        const yy = (len * i) / bumps;
        const side = (i % 2 === 0 ? 34 : 12) + sway;
        ctx.quadraticCurveTo(side, yy - len / bumps * 0.5, (i === bumps ? 6 : 20), yy);
      }
      ctx.lineTo(-6, len);
      for (let i = bumps; i >= 0; i--) {
        const yy = (len * i) / bumps;
        const side = (i % 2 === 0 ? -34 : -12) + sway;
        ctx.quadraticCurveTo(side, yy + 8, (i === 0 ? -32 : -20), yy);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -36);
    ctx.quadraticCurveTo(-6, -10, -8, len * 0.45);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (hair.streak) {
      ctx.fillStyle = this.salonColor(hair.streak).hex;
      ctx.beginPath();
      ctx.moveTo(6, -34);
      ctx.quadraticCurveTo(20 + sway, len * 0.35, 14, len * 0.82);
      ctx.lineTo(2, len * 0.8);
      ctx.quadraticCurveTo(8, len * 0.3, -2, -30);
      ctx.fill();
    }
    if (hair.bangs) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, -18, 24, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hair.gel || hair.spray) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-14, -34);
      ctx.quadraticCurveTo(0, -16, -12, -2);
      ctx.moveTo(10, -32);
      ctx.quadraticCurveTo(4, -14, 12, 0);
      ctx.stroke();
    }
    if (hair.part) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -44);
      ctx.quadraticCurveTo(-2, -20, 4, -4);
      ctx.stroke();
    }
    if (hair.clean < 1) {
      ctx.fillStyle = 'rgba(90,70,40,0.5)';
      ctx.beginPath();
      ctx.arc(-8, -6, 2.2, 0, Math.PI * 2);
      ctx.arc(10, 6, 2.4, 0, Math.PI * 2);
      ctx.arc(-14, 14, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  salonIcon(ctx, id, x, y) {
    ctx.save();
    ctx.translate(x, y);
    if (id === 'shampoo') {
      ctx.fillStyle = '#7ad0f0';
      roundRect(ctx, -8, -12, 16, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      roundRect(ctx, -3, -16, 6, 6, 2);
      ctx.fill();
    } else if (id === 'balm') {
      ctx.fillStyle = '#f7a8c8';
      ctx.beginPath();
      ctx.arc(0, 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, -2, 16, 3);
    } else if (id === 'comb') {
      ctx.fillStyle = '#ffd36b';
      roundRect(ctx, -14, -4, 28, 8, 3);
      ctx.fill();
      ctx.strokeStyle = '#c48a20';
      ctx.lineWidth = 1.5;
      for (let i = -10; i <= 10; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, 4);
        ctx.lineTo(i, 12);
        ctx.stroke();
      }
    } else if (id === 'cut') {
      ctx.strokeStyle = '#546e7a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, -12);
      ctx.lineTo(8, 8);
      ctx.moveTo(12, -12);
      ctx.lineTo(-8, 8);
      ctx.stroke();
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath();
      ctx.arc(-6, 8, 4, 0, Math.PI * 2);
      ctx.arc(6, 8, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'grow') {
      ctx.fillStyle = '#e040fb';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(8, 12);
      ctx.lineTo(-8, 12);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(-12, 8, 24, 5);
    } else if (id === 'curl') {
      ctx.strokeStyle = '#ef6c00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0.4, Math.PI * 1.7);
      ctx.stroke();
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(8, -6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'straight') {
      ctx.fillStyle = '#5c6bc0';
      roundRect(ctx, -14, -5, 28, 10, 3);
      ctx.fill();
      ctx.fillStyle = '#9fa8da';
      ctx.fillRect(-14, -2, 28, 3);
    } else if (id === 'dye') {
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(8, -10);
      ctx.lineTo(5, 12);
      ctx.lineTo(-5, 12);
      ctx.fill();
      ctx.fillStyle = '#ff8a80';
      ctx.beginPath();
      ctx.arc(0, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'streak') {
      ctx.strokeStyle = '#7a4ea3';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(8, 0, 0, 14);
      ctx.stroke();
    } else if (id === 'bangs') {
      ctx.fillStyle = '#6b3e26';
      ctx.beginPath();
      ctx.arc(0, 2, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#f6d3b4';
      ctx.beginPath();
      ctx.arc(0, 8, 8, 0, Math.PI);
      ctx.fill();
    } else if (id === 'gel') {
      ctx.fillStyle = '#26c6da';
      roundRect(ctx, -6, -14, 12, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'spray') {
      ctx.fillStyle = '#80deea';
      roundRect(ctx, -7, -6, 14, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-10, -8, 2, 0, Math.PI * 2);
      ctx.arc(-14, -2, 1.6, 0, Math.PI * 2);
      ctx.arc(-8, -14, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'brush') {
      ctx.fillStyle = '#8d6e63';
      roundRect(ctx, -4, -14, 8, 22, 3);
      ctx.fill();
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.4;
      for (let i = -6; i <= 6; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i, 6);
        ctx.lineTo(i, 14);
        ctx.stroke();
      }
    } else if (id === 'clipper') {
      ctx.fillStyle = '#546e7a';
      roundRect(ctx, -12, -8, 24, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(-10, 4, 20, 4);
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(6, -4, 4, 6);
    } else if (id === 'dryer') {
      ctx.fillStyle = '#eceff1';
      roundRect(ctx, -4, -10, 18, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo(-14, -10);
      ctx.lineTo(-14, 6);
      ctx.lineTo(-4, 4);
      ctx.fill();
    } else if (id === 'bow') {
      ctx.fillStyle = '#ec407a';
      ctx.beginPath();
      ctx.ellipse(-7, 0, 7, 5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(7, 0, 7, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ad1457';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'clip') {
      ctx.fillStyle = '#ffd54f';
      roundRect(ctx, -12, -4, 24, 8, 3);
      ctx.fill();
      ctx.fillStyle = '#f48fb1';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'part') {
      ctx.fillStyle = '#6b3e26';
      ctx.beginPath();
      ctx.arc(0, 4, 12, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, -8);
      ctx.lineTo(4, 6);
      ctx.stroke();
    } else if (id === 'done') {
      ctx.fillStyle = '#43a047';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, 1);
      ctx.lineTo(-1, 6);
      ctx.lineTo(7, -5);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSalonPerson(ctx, x, y, sc, person, hair, smile) {
    ctx.save();
    ctx.translate(x, y + Math.sin((this.time || 0) / 420) * 2 * sc);
    ctx.scale(sc, sc);
    this.drawSalonHair(ctx, hair);
    ctx.fillStyle = person.skin;
    ctx.beginPath();
    ctx.arc(0, 4, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-27, 6, 5, 0, Math.PI * 2);
    ctx.arc(27, 6, 5, 0, Math.PI * 2);
    ctx.fill();
    const blink = Math.sin((this.time || 0) / 900) > 0.97;
    ctx.fillStyle = '#2a2118';
    if (blink) {
      ctx.fillRect(-11, 1, 5, 2);
      ctx.fillRect(6, 1, 5, 2);
    } else {
      ctx.beginPath();
      ctx.arc(-9, 2, 2.2, 0, Math.PI * 2);
      ctx.arc(9, 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#a15a4a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (smile) ctx.arc(0, 6, 8, 0.15, Math.PI - 0.15);
    else ctx.arc(0, 8, 7, 0.35, Math.PI - 0.35);
    ctx.stroke();
    if (person.who === 'man' || person.who === 'grandpa') {
      ctx.strokeStyle = this.salonColor(hair.color).hex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, 14);
      ctx.quadraticCurveTo(0, 20, 8, 14);
      ctx.stroke();
    }
    if (person.who === 'grandma' || person.who === 'grandpa') {
      ctx.strokeStyle = 'rgba(80,60,40,0.35)';
      ctx.beginPath();
      ctx.moveTo(-14, -2);
      ctx.lineTo(-6, 0);
      ctx.moveTo(14, -2);
      ctx.lineTo(6, 0);
      ctx.stroke();
    }
    ctx.fillStyle = person.skin;
    roundRect(ctx, -8, 28, 16, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#f4f7fb';
    ctx.beginPath();
    ctx.moveTo(-40, 48);
    ctx.lineTo(40, 48);
    ctx.lineTo(30, 96);
    ctx.lineTo(-30, 96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = person.shirt;
    ctx.beginPath();
    ctx.moveTo(-22, 50);
    ctx.lineTo(22, 50);
    ctx.lineTo(16, 78);
    ctx.lineTo(-16, 78);
    ctx.closePath();
    ctx.fill();
    if (hair.bow) this.salonIcon(ctx, 'bow', 22, -18);
    if (hair.clip) this.salonIcon(ctx, 'clip', -20, -22);
    ctx.restore();
  }

  drawSalonToolFx(ctx, g, hx, hy) {
    const phase = (this.time || 0) / 160;
    if (g.snip > 0) {
      ctx.save();
      ctx.translate(hx + 36, hy + 10 + Math.sin(phase) * 8);
      ctx.rotate(Math.sin(phase * 2) * 0.4);
      this.salonIcon(ctx, g.tool === 'clipper' ? 'clipper' : 'cut', 0, 0);
      ctx.restore();
    }
    if (g.comb > 0) {
      const k = 1 - g.comb / 700;
      ctx.save();
      ctx.translate(hx + 8, hy - 30 + k * 90);
      this.salonIcon(ctx, g.tool === 'brush' ? 'brush' : 'comb', 0, 0);
      ctx.restore();
    }
    if (g.iron > 0) {
      const k = 1 - g.iron / 800;
      ctx.save();
      ctx.translate(hx + 24, hy - 20 + k * 70);
      this.salonIcon(ctx, g.tool === 'dryer' ? 'dryer' : (g.tool === 'straight' ? 'straight' : 'curl'), 0, 0);
      ctx.restore();
    }
    if (g.drip > 0) {
      const k = 1 - g.drip / 700;
      ctx.fillStyle = this.salonColor(g.dye).hex;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(hx + 6, hy - 40 + k * 80, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (g.spark > 0) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + phase;
        const rr = 40 + (1 - g.spark / 900) * 30;
        ctx.fillStyle = i % 2 ? '#ffd54f' : '#fff';
        ctx.beginPath();
        ctx.arc(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr * 0.7, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawSalon(ctx, W, H) {
    const g = this.salon;
    if (!g) return;
    ctx.fillStyle = '#f8d5e4';
    ctx.fillRect(0, 48, W, H - 48);
    ctx.fillStyle = '#f3b7cf';
    ctx.fillRect(0, H * 0.62, W, H);
    ctx.fillStyle = '#c98b6a';
    ctx.fillRect(0, H * 0.72, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    roundRect(ctx, W * 0.08, 56, W * 0.62, H * 0.5, 18);
    ctx.fill();
    ctx.strokeStyle = '#e7b7a0';
    ctx.lineWidth = 6;
    ctx.stroke();

    const cardX = W - 104;
    const cardY = 56;
    ctx.fillStyle = '#fff';
    roundRect(ctx, cardX, cardY, 92, 118, 12);
    ctx.fill();
    ctx.strokeStyle = '#f48fb1';
    ctx.lineWidth = 3;
    ctx.stroke();
    this.drawSalonPerson(ctx, cardX + 46, cardY + 46, 0.48, g.person, g.wish, false);
    ctx.fillStyle = '#f48fb1';
    ctx.beginPath();
    ctx.arc(cardX + 78, cardY + 14, 8, 0, Math.PI * 2);
    ctx.fill();

    const hx = Math.min(W * 0.38, cardX - 70);
    const hy = Math.min(H * 0.28, H - 310);
    ctx.fillStyle = '#8d6e63';
    roundRect(ctx, hx - 46, hy + 78, 92, 16, 6);
    ctx.fill();
    ctx.fillStyle = '#efebe9';
    roundRect(ctx, hx - 28, hy + 92, 56, 36, 8);
    ctx.fill();
    this.drawSalonPerson(ctx, hx, hy, 1.05, g.person, g.hair, g.over || g.smile > 0);
    g.head = { x: hx - 55, y: hy - 78, w: 110, h: 190 };
    this.drawSalonToolFx(ctx, g, hx, hy);
    (g.bubbles || []).forEach(b => {
      ctx.globalAlpha = Math.max(0, b.a);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6a3048';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(g.person.name, hx, 68);
    if (g.note) {
      ctx.font = 'bold 13px Arial';
      const nw = Math.min(W - 130, ctx.measureText(g.note).width + 16);
      ctx.fillStyle = '#fff';
      roundRect(ctx, hx - nw / 2, 80, nw, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#6a3048';
      ctx.fillText(g.note, hx, 91);
    }

    const shelves = [
      [['shampoo', 'Шампунь'], ['balm', 'Бальзам'], ['spray', 'Спрей'], ['comb', 'Гребень'], ['brush', 'Щётка']],
      [['cut', 'Ножницы'], ['clipper', 'Машинка'], ['grow', 'Ленты'], ['curl', 'Плойка'], ['straight', 'Утюжок']],
      [['dryer', 'Фен'], ['dye', 'Краска'], ['streak', 'Прядь'], ['bangs', 'Чёлка'], ['gel', 'Гель']],
      [['bow', 'Бант'], ['clip', 'Зажим'], ['part', 'Пробор'], ['done', 'Готово']]
    ];
    const shelfH = 48;
    const base = H - 4 - shelves.length * shelfH;
    if (g.over) {
      this.buttons.push(createButton(ctx, W / 2 - 78, base - 52, 156, 44, 'Дальше', {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 18, radius: 14
      }));
    } else if (g.tool === 'dye' || g.tool === 'streak') {
      const ids = ['black', 'brown', 'blonde', 'red', 'pink', 'blue', 'green', 'violet'];
      const pot = Math.min(28, (W - 20) / ids.length);
      ids.forEach((id, i) => {
        const x = 12 + i * pot + pot / 2;
        const y = base - 16;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.salonColor(id).hex;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        if (g.dye === id) {
          ctx.strokeStyle = '#6a3048';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        this.buttons.push({ x: x - 12, y: y - 12, w: 24, h: 24, text: 'dye:' + id });
      });
    }
    const pulse = g.hair.clean < 1 ? 'shampoo' : (g.hair.clean < 2 ? 'balm' : '');
    shelves.forEach((row, r) => {
      const y = base + r * shelfH;
      const slot = (W - 8) / row.length;
      ctx.fillStyle = '#e7c99a';
      roundRect(ctx, 4, y + 20, W - 8, 8, 2);
      ctx.fill();
      ctx.fillStyle = '#8d5a32';
      roundRect(ctx, 4, y + 28, W - 8, 16, 3);
      ctx.fill();
      row.forEach((t, i) => {
        const x = 4 + i * slot;
        const on = g.tool === t[0];
        if (on || pulse === t[0]) {
          ctx.strokeStyle = on ? '#fff' : 'rgba(255,255,255,' + (0.35 + 0.4 * Math.sin(this.time / 160)) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + slot / 2, y + 12, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        this.salonIcon(ctx, t[0], x + slot / 2, y + 12);
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#fff8e7';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t[1], x + slot / 2, y + 36);
        if (!g.over) this.buttons.push({ x: x, y: y, w: slot, h: shelfH - 2, text: t[1] });
      });
    });
    ctx.textBaseline = 'alphabetic';
  }

  salonApply() {
    const g = this.salon;
    const h = g.hair;
    const tool = g.tool;
    const at = g.head ? { x: g.head.x + g.head.w / 2, y: g.head.y + 50 } : { x: 120, y: 180 };
    if (tool === 'shampoo') {
      h.clean = Math.max(h.clean, 1);
      g.note = '';
      g.foam = 900;
      this.salonBurst(at.x, at.y);
      return;
    }
    if (tool === 'balm') {
      if (h.clean < 1) { g.note = 'Сначала пена'; AudioSys.play('fail'); return; }
      h.clean = 2;
      g.note = '';
      g.spark = 500;
      return;
    }
    if (h.clean < 2 && tool !== 'done') {
      g.note = 'Сначала помой';
      AudioSys.play('fail');
      return;
    }
    if (tool === 'comb' || tool === 'brush') { g.note = ''; g.comb = 700; return; }
    if (tool === 'cut') {
      h.len = Math.max(0.32, Math.round((h.len - 0.12) * 100) / 100);
      g.note = '';
      g.snip = 500;
      return;
    }
    if (tool === 'clipper') {
      h.len = Math.max(0.32, Math.round((h.len - 0.28) * 100) / 100);
      g.note = '';
      g.snip = 500;
      return;
    }
    if (tool === 'grow') {
      h.len = Math.min(1, Math.round((h.len + 0.2) * 100) / 100);
      g.note = '';
      g.spark = 500;
      return;
    }
    if (tool === 'curl') {
      h.curl = Math.min(2, h.curl + 1);
      g.note = '';
      g.iron = 800;
      return;
    }
    if (tool === 'straight' || tool === 'dryer') {
      h.curl = Math.max(0, h.curl - 1);
      g.note = '';
      g.iron = 800;
      return;
    }
    if (tool === 'spray') { h.spray = !h.spray; g.note = ''; g.spark = 500; this.salonBurst(at.x, at.y - 20); return; }
    if (tool === 'dye') { h.color = g.dye; g.note = ''; g.drip = 700; return; }
    if (tool === 'streak') {
      h.streak = h.streak === g.dye ? null : g.dye;
      g.note = '';
      g.drip = 700;
      return;
    }
    if (tool === 'bangs') { h.bangs = !h.bangs; g.note = ''; g.snip = 400; return; }
    if (tool === 'gel') { h.gel = !h.gel; g.note = ''; g.spark = 500; return; }
    if (tool === 'bow') { h.bow = !h.bow; g.note = ''; g.spark = 400; return; }
    if (tool === 'clip') { h.clip = !h.clip; g.note = ''; g.spark = 400; return; }
    if (tool === 'part') { h.part = !h.part; g.note = ''; g.comb = 500; return; }
  }

  salonFinish() {
    const g = this.salon;
    if (g.over) return;
    const h = g.hair;
    const w = g.wish;
    const lenOk = Math.abs(h.len - w.len) < 0.22;
    const curlOk = h.curl === w.curl;
    const colorOk = h.color === w.color;
    const streakOk = h.streak === w.streak;
    const bangsOk = !!h.bangs === !!w.bangs;
    const gelOk = !w.gel || h.gel;
    const bowOk = !w.bow || h.bow;
    const clipOk = !w.clip || h.clip;
    const partOk = !w.part || h.part;
    const cleanOk = h.clean >= 2;
    if (lenOk && curlOk && colorOk && streakOk && bangsOk && gelOk && bowOk && clipOk && partOk && cleanOk) {
      g.over = true;
      const fem = g.person.who === 'girl' || g.person.who === 'woman' || g.person.who === 'grandma';
      g.note = fem ? 'Довольна!' : 'Доволен!';
      g.spark = 1200;
      g.smile = 1;
      AudioSys.play('success');
      System.countAction('salonWins');
      System.earnCoins(8);
      System.addXP(6);
      System.stats.happiness = Math.min(100, System.stats.happiness + 4);
      System.saveGame();
      return;
    }
    let miss = 'Сверь с карточкой';
    if (!cleanOk) miss = 'Сначала помой';
    else if (!lenOk) miss = h.len < w.len ? 'Длиннее' : 'Короче';
    else if (!curlOk) miss = h.curl < w.curl ? 'Больше кудрей' : 'Прямее';
    else if (!colorOk) miss = 'Другой цвет';
    else if (!streakOk) miss = w.streak ? 'Нужна прядь' : 'Убери прядь';
    else if (!bangsOk) miss = w.bangs ? 'Нужна чёлка' : 'Без чёлки';
    else if (!gelOk) miss = 'Нужен гель';
    else if (!bowOk) miss = 'Нужен бант';
    else if (!clipOk) miss = 'Нужен зажим';
    else if (!partOk) miss = 'Нужен пробор';
    g.note = miss;
    AudioSys.play('fail');
  }

  clickSalon(mx, my) {
    const g = this.salon;
    if (!g) return false;
    for (let i = 1; i < this.buttons.length; i++) {
      const b = this.buttons[i];
      if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
      if (b.text === 'Следующий' || b.text === 'Дальше') { this.initSalon(); return true; }
      if (b.text && b.text.indexOf('dye:') === 0) {
        g.dye = b.text.slice(4);
        g.note = '';
        AudioSys.play('click');
        return true;
      }
      const names = {
        'Шампунь': 'shampoo', 'Бальзам': 'balm', 'Спрей': 'spray', 'Гребень': 'comb', 'Щётка': 'brush',
        'Ножницы': 'cut', 'Машинка': 'clipper', 'Ленты': 'grow', 'Плойка': 'curl', 'Утюжок': 'straight',
        'Фен': 'dryer', 'Краска': 'dye', 'Прядь': 'streak', 'Чёлка': 'bangs', 'Гель': 'gel',
        'Бант': 'bow', 'Зажим': 'clip', 'Пробор': 'part', 'Готово': 'done'
      };
      if (names[b.text]) {
        g.tool = names[b.text];
        if (g.tool === 'done') this.salonFinish();
        else this.salonApply();
        AudioSys.play('click');
        return true;
      }
    }
    if (!g.over && g.head && isPointInRect(mx, my, g.head.x, g.head.y, g.head.w, g.head.h)) {
      if (g.tool === 'done') this.salonFinish();
      else this.salonApply();
      AudioSys.play('click');
      return true;
    }
    return false;
  }

  checkTTTWin(p) {
    const b = this.ttt.board;
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => w.every(i => b[i] === p));
  }
}
window.MinigamesScene = MinigamesScene;
