// ============ ТИХИЕ ИГРЫ («чем заняться, пока гофер спит») ============
// Спокойные занятия без таймеров, без проигрышей и без затрат энергии:
//   1) Созвездие — соедини звёзды по порядку;
//   2) Раскраска — раскрась картинку цветами;
//   3) Тихая рыбалка — дождись поклёвки и тяни;
//   4) У окна — сидеть и смотреть на улицу: время суток, сезон и погода настоящие.
// Пока гофер спит, энергия копится (+10% в минуту) — об этом написано на экране.

// Большие обитатели подводного мира (v1.3.11). Раньше их было один-два случайных
// из семи, и заказчик справедливо заметил: «из всех этих существ я вижу кроме рыб
// только медузу, не увидел ни одной акулы, черепахи или осьминога». Теперь в воде
// одновременно три РАЗНЫХ обитателя, а раз в 14–22 секунды один уплывает к краю и
// на его место приходит случайный из тех, кого сейчас нет в воде.
const SEA_FRIENDS_IN_WATER = 3;
const FRIEND_SWAP_MIN = 14;
const FRIEND_SWAP_MAX = 22;

// Картинки для раскраски (v1.3.12). Заказчик 01.10.2026: «улучши раскраски, а то они
// все однотипные». Раньше картинка была одна и та же (гофер) — менялись только
// цвета. Теперь восемь картинок, у каждой свой набор частей, своя палитра и своё
// имя: «Другая картинка» выбирает ту, что ещё не попадалась (как подборка в музее).
// Координаты — доли рамки картинки, поэтому картинка сама подстраивается под экран.
const PAINT_PICTURES = [
  { id: 'gopher', name: '{pet}',
    face: { x: 0.50, y: 0.32, r: 0.15 },
    colors: ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#C39BD3', '#FF8C42'],
    parts: [
      { id: 'body', kind: 'ellipse', cx: 0.50, cy: 0.60, rx: 0.26, ry: 0.20 },
      { id: 'head', kind: 'circle', cx: 0.50, cy: 0.32, r: 0.15 },
      { id: 'earL', kind: 'circle', cx: 0.38, cy: 0.19, r: 0.07 },
      { id: 'earR', kind: 'circle', cx: 0.62, cy: 0.19, r: 0.07 },
      { id: 'tail', kind: 'circle', cx: 0.79, cy: 0.68, r: 0.08 },
      { id: 'grass', kind: 'rect', x: 0.08, y: 0.80, w: 0.84, h: 0.13 }
    ] },
  { id: 'fish', name: 'Рыбка',
    face: { x: 0.62, y: 0.42, r: 0.05 },
    colors: ['#4FC3F7', '#FFD93D', '#FF8C42', '#6BCB77', '#C39BD3', '#FF6B6B'],
    parts: [
      { id: 'body', kind: 'ellipse', cx: 0.48, cy: 0.50, rx: 0.30, ry: 0.20 },
      { id: 'tail', kind: 'circle', cx: 0.16, cy: 0.50, r: 0.11 },
      { id: 'fin', kind: 'ellipse', cx: 0.50, cy: 0.64, rx: 0.12, ry: 0.07 },
      { id: 'bubble', kind: 'circle', cx: 0.80, cy: 0.34, r: 0.055 },
      { id: 'bubble2', kind: 'circle', cx: 0.88, cy: 0.22, r: 0.038 },
      { id: 'stone', kind: 'ellipse', cx: 0.22, cy: 0.84, rx: 0.11, ry: 0.05 },
      { id: 'water', kind: 'rect', x: 0.08, y: 0.78, w: 0.84, h: 0.15 }
    ] },
  { id: 'ship', name: 'Кораблик',
    colors: ['#FFFFFF', '#4D96FF', '#FFD93D', '#FF8C42', '#6BCB77', '#C39BD3'],
    parts: [
      { id: 'hull', kind: 'rect', x: 0.18, y: 0.62, w: 0.64, h: 0.14 },
      { id: 'mast', kind: 'rect', x: 0.485, y: 0.30, w: 0.03, h: 0.33 },
      { id: 'sailL', kind: 'ellipse', cx: 0.36, cy: 0.45, rx: 0.14, ry: 0.16 },
      { id: 'sailR', kind: 'ellipse', cx: 0.63, cy: 0.45, rx: 0.13, ry: 0.15 },
      { id: 'sun', kind: 'circle', cx: 0.82, cy: 0.18, r: 0.09 },
      { id: 'cloud', kind: 'ellipse', cx: 0.22, cy: 0.22, rx: 0.13, ry: 0.06 },
      { id: 'wave', kind: 'rect', x: 0.08, y: 0.78, w: 0.84, h: 0.14 }
    ] },
  { id: 'house', name: 'Домик',
    colors: ['#FF8C42', '#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D', '#C39BD3'],
    parts: [
      { id: 'body', kind: 'rect', x: 0.24, y: 0.44, w: 0.52, h: 0.36 },
      { id: 'roof', kind: 'ellipse', cx: 0.50, cy: 0.40, rx: 0.34, ry: 0.13 },
      { id: 'door', kind: 'rect', x: 0.44, y: 0.60, w: 0.16, h: 0.20 },
      { id: 'winL', kind: 'circle', cx: 0.34, cy: 0.54, r: 0.055 },
      { id: 'winR', kind: 'circle', cx: 0.66, cy: 0.54, r: 0.055 },
      { id: 'sun', kind: 'circle', cx: 0.84, cy: 0.18, r: 0.08 },
      { id: 'grass', kind: 'rect', x: 0.08, y: 0.80, w: 0.84, h: 0.12 }
    ] },
  { id: 'cake', name: 'Тортик',
    colors: ['#F48FB1', '#FFF176', '#8D6E63', '#E57373', '#81D4FA', '#BA68C8'],
    parts: [
      { id: 'tier1', kind: 'rect', x: 0.22, y: 0.62, w: 0.56, h: 0.16 },
      { id: 'tier2', kind: 'rect', x: 0.30, y: 0.48, w: 0.40, h: 0.14 },
      { id: 'tier3', kind: 'rect', x: 0.38, y: 0.36, w: 0.24, h: 0.12 },
      { id: 'cherry', kind: 'circle', cx: 0.50, cy: 0.30, r: 0.045 },
      { id: 'candle', kind: 'rect', x: 0.485, y: 0.22, w: 0.03, h: 0.08 },
      { id: 'flame', kind: 'circle', cx: 0.50, cy: 0.19, r: 0.032 },
      { id: 'plate', kind: 'rect', x: 0.16, y: 0.78, w: 0.68, h: 0.06 }
    ] },
  { id: 'butterfly', name: 'Бабочка',
    face: { x: 0.50, y: 0.31, r: 0.05 },
    colors: ['#FF6B6B', '#FFD93D', '#C39BD3', '#4D96FF', '#6BCB77', '#FF8C42', '#26A69A'],
    parts: [
      { id: 'wingUL', kind: 'ellipse', cx: 0.34, cy: 0.42, rx: 0.16, ry: 0.14 },
      { id: 'wingUR', kind: 'ellipse', cx: 0.66, cy: 0.42, rx: 0.16, ry: 0.14 },
      { id: 'wingDL', kind: 'ellipse', cx: 0.35, cy: 0.64, rx: 0.13, ry: 0.11 },
      { id: 'wingDR', kind: 'ellipse', cx: 0.65, cy: 0.64, rx: 0.13, ry: 0.11 },
      { id: 'body', kind: 'ellipse', cx: 0.50, cy: 0.53, rx: 0.045, ry: 0.20 },
      { id: 'head', kind: 'circle', cx: 0.50, cy: 0.31, r: 0.055 },
      { id: 'flower', kind: 'circle', cx: 0.50, cy: 0.86, r: 0.05 }
    ] },
  { id: 'rocket', name: 'Ракета',
    colors: ['#4D96FF', '#FF8C42', '#FFD93D', '#C39BD3', '#6BCB77', '#ECEFF1'],
    parts: [
      { id: 'body', kind: 'ellipse', cx: 0.50, cy: 0.50, rx: 0.12, ry: 0.28 },
      { id: 'nose', kind: 'circle', cx: 0.50, cy: 0.24, r: 0.10 },
      { id: 'finL', kind: 'rect', x: 0.30, y: 0.62, w: 0.08, h: 0.16 },
      { id: 'finR', kind: 'rect', x: 0.62, y: 0.62, w: 0.08, h: 0.16 },
      { id: 'window', kind: 'circle', cx: 0.50, cy: 0.44, r: 0.06 },
      { id: 'flame', kind: 'ellipse', cx: 0.50, cy: 0.83, rx: 0.07, ry: 0.10 },
      { id: 'star1', kind: 'circle', cx: 0.24, cy: 0.30, r: 0.04 },
      { id: 'star2', kind: 'circle', cx: 0.80, cy: 0.36, r: 0.035 },
      { id: 'star3', kind: 'circle', cx: 0.72, cy: 0.72, r: 0.03 }
    ] },
  { id: 'flower', name: 'Цветик',
    colors: ['#FF6B6B', '#FFD93D', '#FF8C42', '#C39BD3', '#4D96FF', '#6BCB77'],
    parts: [
      { id: 'petal1', kind: 'circle', cx: 0.50, cy: 0.44, r: 0.11 },
      { id: 'petal2', kind: 'circle', cx: 0.66, cy: 0.55, r: 0.11 },
      { id: 'petal3', kind: 'circle', cx: 0.60, cy: 0.74, r: 0.11 },
      { id: 'petal4', kind: 'circle', cx: 0.40, cy: 0.74, r: 0.11 },
      { id: 'petal5', kind: 'circle', cx: 0.34, cy: 0.55, r: 0.11 },
      { id: 'middle', kind: 'circle', cx: 0.50, cy: 0.60, r: 0.09 },
      { id: 'stem', kind: 'rect', x: 0.485, y: 0.70, w: 0.03, h: 0.22 },
      { id: 'leaf', kind: 'ellipse', cx: 0.40, cy: 0.82, rx: 0.09, ry: 0.05 },
      { id: 'grass', kind: 'rect', x: 0.08, y: 0.86, w: 0.84, h: 0.08 }
    ] }
];

class QuietScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.mode = 'select';   // select | stars | color | fish
    this.result = '';
    this.resultTimer = 0;
    this.initStars();
    this.initColor();
    this.initFish();
  }

  init() {
    this.time = 0;
    this.mode = 'select';
    this.buttons = [];
    this.result = '';
    this.resultTimer = 0;
    this.initStars();
    this.initColor();
    this.initFish();
  }

  // ---------- 1. СОЗВЕЗДИЕ ----------
  // Рисунок каждый раз новый: раньше созвездие было одно и то же, и игра
  // быстро надоедала. Строим «путь» из 9 звёзд: каждая следующая на
  // расстоянии 70–125 px от предыдущей, с плавным поворотом, так что
  // получается похоже на созвездие, а не на прямую линию. Минимальный
  // зазор — 56 px: по звёздам легко попадать пальцем (радиус попадания 24).
  initStars() {
    const W = (this.game && this.game.width) || 540;
    const H = (this.game && this.game.height) || 960;
    const area = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const padX = 26, padY = 34;
    let minGap = 56;

    const pts = [];
    let cur = {
      x: randFloat(area.x + padX, area.x + area.w * 0.35),
      y: randFloat(area.y + padY, area.y + area.h - padY)
    };
    pts.push(cur);
    let dir = randFloat(-0.6, 0.6);          // идём в основном вправо
    let guard = 0;
    while (pts.length < 9 && guard++ < 500) {
      const step = randFloat(70, 125);
      dir += randFloat(-0.9, 0.9);
      let nx = cur.x + Math.cos(dir) * step;
      let ny = cur.y + Math.sin(dir) * step;
      // У края области разворачиваемся, чтобы созвездие осталось внутри
      if (nx < area.x + padX || nx > area.x + area.w - padX) {
        dir = Math.PI - dir;
        nx = clamp(cur.x + Math.cos(dir) * step, area.x + padX, area.x + area.w - padX);
      }
      if (ny < area.y + padY || ny > area.y + area.h - padY) {
        dir = -dir;
        ny = clamp(cur.y + Math.sin(dir) * step, area.y + padY, area.y + area.h - padY);
      }
      const tooClose = pts.some(p => Math.hypot(p.x - nx, p.y - ny) < minGap);
      if (tooClose) {
        if (guard > 250) minGap = Math.max(42, minGap - 2);   // страховка от затора
        continue;
      }
      cur = { x: nx, y: ny };
      pts.push(cur);
    }
    // Доли области — в таком виде звёзды рисует и проверяет игра
    const points = pts.map(p => [(p.x - area.x) / area.w, (p.y - area.y) / area.h]);
    this.stars = { points: points, next: 0, done: false };
  }

  // ---------- 2. РАСКРАСКА ----------
  initColor(forceId) {
    // Картинка выбирается из восьми; если есть ещё не раскрашенные — берём из них
    // (как подборка в музее), а подряд одну и ту же не показываем (v1.3.12).
    const seen = (typeof System !== 'undefined' && System.getSeen) ? System.getSeen('paint') : [];
    const others = PAINT_PICTURES.filter(p => p.id !== this.paintId);
    const fresh = others.filter(p => seen.indexOf(p.id) === -1);
    let pick = forceId ? PAINT_PICTURES.find(p => p.id === forceId) : null;
    if (!pick) {
      const pool = fresh.length ? fresh : (others.length ? others : PAINT_PICTURES);
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
    this.paintId = pick.id;
    this.paintTotal = PAINT_PICTURES.length;   // сколько всего картинок (для подписи и проверок)
    this.paint = {
      id: pick.id,
      name: pick.name,
      face: pick.face || null,
      colors: pick.colors.slice(),
      picked: 0,
      done: false,
      parts: pick.parts.map(part => Object.assign({}, part, { fill: null }))
    };
  }

  // ---------- 3. РЫБАЛКА ----------
  // Куда опущен крючок с наживкой: чуть ниже поплавка, при поклёвке — ниже
  fishHookY() {
    const w = this.fishWater();
    const bite = !!(this.fish && this.fish.state === 'bite');
    const dip = bite ? 12 + Math.sin(this.time * 0.03) * 4 : 0;
    return w.top + 66 + dip;
  }

  // Границы воды: сверху — поверхность, снизу — дно
  fishWater() {
    const W = (this.game && this.game.width) || 540;
    const H = (this.game && this.game.height) || 960;
    return { x0: W * 0.05, x1: W * 0.95, top: H * 0.40, bottom: H * 0.80 };
  }

  // Новый житель воды: kind 'fish' — кого ловим, 'friend' — кого только смотрим.
  // species можно передать явно (нужно для больших обитателей, v1.3.11)
  makeSwimmer(kind, W, H, species) {
    const w = this.fishWater();
    const friend = (kind === 'friend');
    const sp = species || (friend
      ? (typeof SEA_FRIENDS !== 'undefined' ? SEA_FRIENDS[Math.floor(Math.random() * SEA_FRIENDS.length)] : null)
      : (typeof randomFishSpecies === 'function' ? randomFishSpecies() : null));
    if (!sp) return null;
    return {
      kind: kind, id: sp.id, data: sp,
      x: randFloat(w.x0, w.x1),
      y: randFloat(w.top + 30, w.bottom - 30),
      dir: Math.random() < 0.5 ? -1 : 1,
      speed: (friend ? randFloat(12, 22) : randFloat(22, 50)) * (0.7 + sp.size * 0.5),
      phase: randFloat(0, Math.PI * 2),
      bob: randFloat(0.4, 1.3),
      nibble: 0,                 // сколько уже «пробует» крючок
      alpha: friend ? 0.92 : 1
    };
  }

  // Кто приплывёт вместо ушедшего: случайный вид из тех, кого сейчас нет на экране.
  nextFriendSpecies(inWater) {
    const all = (typeof SEA_FRIENDS !== 'undefined') ? SEA_FRIENDS : [];
    if (!all.length) return null;
    const busy = inWater || [];
    const free = all.filter(sp => busy.indexOf(sp.id) === -1);
    const pool = free.length ? free : all;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Подводный мир: стайка рыбок + большие обитатели, все разные
  spawnSea(W, H, count) {
    const list = [];
    for (let i = 0; i < (count || 9); i++) {
      const s = this.makeSwimmer('fish', W, H);
      if (s) list.push(s);
    }
    const used = [];
    for (let i = 0; i < SEA_FRIENDS_IN_WATER; i++) {
      const sp = this.nextFriendSpecies(used);
      if (!sp) break;
      used.push(sp.id);
      const s = this.makeSwimmer('friend', W, H, sp);
      if (s) list.push(s);
    }
    return list;
  }

  // Подводное царство выбирается заново при каждом входе в рыбалку.
  // Подряд один и тот же вид не повторяем, чтобы смена была заметна.
  pickSeaBiome() {
    const all = [
      { id: 'classic', name: 'Тихая заводь' },
      { id: 'reef', name: 'Коралловый риф' },
      { id: 'sand', name: 'Песчаная отмель' },
      { id: 'kelp', name: 'Заросли водорослей' },
      { id: 'ice', name: 'Ледяная полынья' },
      { id: 'night', name: 'Ночное море' },
      { id: 'wreck', name: 'Затонувший корабль' },
      { id: 'cave', name: 'Подводная пещера' },
      { id: 'lagoon', name: 'Бирюзовая лагуна' }
    ];
    const pool = all.filter(b => b.id !== this.lastSeaBiome);
    const pick = pool[Math.floor(Math.random() * pool.length)] || all[0];
    this.lastSeaBiome = pick.id;
    return pick;
  }

  initFish() {
    const W = (this.game && this.game.width) || 540;
    const H = (this.game && this.game.height) || 960;
    const biome = this.pickSeaBiome();
    this.fish = {
      state: 'wait',           // wait | bite
      // Поклёвки реже: ребёнку нужно успеть прочитать факт, а не сразу тянуть снова
      timer: randFloat(7, 12),
      biome: biome,
      biteWindow: 0,
      caught: 0,
      target: 3,
      swimmers: this.spawnSea(W, H),
      biteFish: null,          // кто сейчас тянется к крючку
      splash: 0,               // всплеск после удачной подсечки
      friendHint: 0,           // таймер подсказки «больших не ловим»
      friendHintText: '',
      friendHintId: '',
      friendQueue: [],         // кого ещё надо подписать: каждый новый обитатель, не только тот, кто у крючка
      friendSwap: randFloat(FRIEND_SWAP_MIN, FRIEND_SWAP_MAX),  // когда менять состав (v1.3.11)
      friendSwapWanted: false, // пора менять: ждём, когда обитатель дойдёт до края
      lastCatch: null,         // { id, name, fact, times } — для текста после поимки
      school: null,            // проплывающая стайка: не клюёт, только проносится мимо
      schoolIn: randFloat(6, 14),
      jumps: [],               // рыбки, которые выпрыгивают из воды
      jumpIn: randFloat(9, 18),
      diver: null,             // редкий гость: персонаж игры в акваланге
      diverIn: randFloat(22, 40)
    };
    this.fish.swimmers.filter(s => s.kind === 'friend').forEach(s => this.queueFriendHint(s.id));
  }

  // Кто сейчас перед глазами: ближе всех к середине и не у самого края.
  // Подпись берётся у него, а не из очереди появления — иначе у кита в центре
  // висит факт акулы, которая плывёт сзади.
  centeredFriend() {
    const f = this.fish;
    const W = (this.game && this.game.width) || 360;
    if (!f) return null;
    const list = (f.swimmers || []).filter(s =>
      s.kind === 'friend' && s.x > W * 0.12 && s.x < W * 0.88);
    if (!list.length) return null;
    list.sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2));
    return list[0];
  }

  syncFriendCaption(sec) {
    const f = this.fish;
    if (!f || this.readingCatch()) return;
    const vis = this.centeredFriend();
    const visId = vis ? vis.id : '';
    if (visId && f.friendHintId === visId && f.friendHint > 0) {
      f.friendHint -= sec;
      return;
    }
    if (visId) {
      const hint = (typeof seaFriendHint === 'function') ? seaFriendHint(visId) : '';
      if (hint) {
        f.friendHintId = visId;
        f.friendHintText = hint;
        f.friendHint = 5;
      }
      return;
    }
    if (f.diver && f.diver.note) {
      f.friendHintText = f.diver.note;
      f.friendHintId = 'diver';
      f.friendHint = 5;
      f.diver.note = '';
      return;
    }
    if (f.friendHintId === 'diver' && f.friendHint > 0) {
      f.friendHint -= sec;
      return;
    }
    f.friendHint = 0;
    f.friendHintText = '';
    f.friendHintId = '';
  }

  // Описание большого обитателя ставится в очередь один раз за появление.
  // Раньше текст вспыхивал только у крючка, поэтому косатка и кит проплывали молча.
  queueFriendHint(id) {
    const f = this.fish;
    if (!f || !id) return;
    if (f.friendHintId === id && f.friendHint > 0) return;
    if ((f.friendQueue || []).indexOf(id) !== -1) return;
    f.friendQueue.push(id);
  }

  // Каждый заплыв — случайный персонаж. Очереди нет: Милка может приплыть сразу
  // и может приплыть два раза подряд.
  nextDiverCharacter() {
    const all = (typeof CHARACTERS !== 'undefined' && CHARACTERS.length) ? CHARACTERS : [];
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  }

  // Кто клюнет: ближайшая к крючку рыбка. Большие обитатели не клюют — их не ловят
  pickBiter() {
    const W = this.game.width, hy = this.fishHookY();
    const near = (s) => Math.abs(s.x - W / 2) + Math.abs(s.y - hy);
    const list = (this.fish.swimmers || []).filter(s => s.kind === 'fish' && typeof s.caughtAnim !== 'number');
    if (!list.length) return null;
    return list.slice().sort((a, b) => near(a) - near(b))[0];
  }

  startGame(id) {
    if (id === 'stars') this.initStars();
    else if (id === 'color') this.initColor();
    else if (id === 'window') this.initWindow();
    else this.initFish();
    this.mode = id;
    AudioSys.play('click');
  }

  // Награда за спокойную игру: монеты, опыт, больше спокойствия, без затрат энергии
  reward(gameId, title) {
    const meta = (typeof QUIET_GAMES !== 'undefined') ? QUIET_GAMES.find(g => g.id === gameId) : null;
    const coins = meta ? meta.reward : 8;
    System.countAction('quiet');
    System.earnCoins(coins);
    System.addXP(6);
    System.relax(4);
    System.saveGame();
    AudioSys.play('success');
    this.result = title + '  🪙+' + coins + '  😌+4 спокойствия';
    this.resultTimer = 4.5;
    System.showAchievement('✨', title);
  }

  update(dt) {
    this.time += dt;
    const sec = dt / 1000;
    if (this.resultTimer > 0) this.resultTimer -= sec;

    if (this.mode === 'window') this.updateWindow(sec);

    if (this.mode === 'fish' || this.mode === 'watch') {
      const f = this.fish;
      const W = this.game.width;
      const w = this.fishWater();
      const hookY = this.fishHookY();

      // Кто плавает под водой: рыбки идут туда-сюда, покачиваются по синусу и
      // разворачиваются у краёв — это и есть «видно, как они плавают» (v1.3.9)
      (f.swimmers || []).forEach(s => {
        s.phase += sec * (1.2 + s.speed * 0.03);
        if (typeof s.caughtAnim === 'number') {
          // Поймали: рыбку тянет к поплавку и она растворяется в всплеске
          s.caughtAnim -= sec;
          s.x += (W / 2 - s.x) * Math.min(1, sec * 6);
          s.y += (hookY - 26 - s.y) * Math.min(1, sec * 4);
          s.alpha = Math.max(0, s.caughtAnim / 0.8);
          return;
        }
        if (f.state === 'bite' && f.biteFish === s) {
          // Клюнула: подплывает к наживке и «пробует» её — видно, как цепляется
          const dx = W / 2 - s.x, dy = (hookY + 4) - s.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          s.x += (dx / d) * 78 * sec;
          s.y += (dy / d) * 78 * sec;
          s.nibble += sec;
        } else {
          // Большие обитатели обходят крючок стороной: «черепашкам не навредить»
          if (s.kind === 'friend' && Math.abs(s.x - W / 2) < 92 && Math.abs(s.y - hookY) < 74) {
            s.x += (s.dir > 0 ? 1 : -1) * 46 * sec;
          } else {
            s.x += s.dir * s.speed * sec;
          }
          s.y += Math.sin(s.phase) * s.bob * sec * 9;
        }
        if (s.y < w.top + 16) s.y = w.top + 16;
        if (s.y > w.bottom - 16) s.y = w.bottom - 16;
        if (s.x < w.x0) { s.x = w.x0; s.dir = 1; }
        if (s.x > w.x1) { s.x = w.x1; s.dir = -1; }

        // Состав больших обитателей меняется (v1.3.11): заказчик видел одних медуз,
        // а хотел черепаху, акулу и осьминога. Меняем вид только у самого края —
        // получается, будто один уплыл, а другой приплыл, без телепорта посередине.
        if (s.kind === 'friend' && f.friendSwapWanted &&
            (s.x <= w.x0 + 3 || s.x >= w.x1 - 3)) {
          const others = (f.swimmers || [])
            .filter(x => x.kind === 'friend' && x !== s).map(x => x.id);
          const sp = this.nextFriendSpecies(others);
          if (sp) {
            s.id = sp.id;
            s.data = sp;
            s.speed = randFloat(12, 22) * (0.7 + sp.size * 0.5);
            s.y = randFloat(w.top + 40, w.bottom - 40);
            this.queueFriendHint(sp.id);
            f.friendSwapWanted = false;
            f.friendSwap = randFloat(FRIEND_SWAP_MIN, FRIEND_SWAP_MAX);
          }
        }
      });

      // Уплывшие (пойманные) рыбки заменяются новыми — мир не пустеет
      const gone = (f.swimmers || []).filter(s => typeof s.caughtAnim === 'number' && s.caughtAnim <= 0);
      if (gone.length) {
        f.swimmers = f.swimmers.filter(s => !(typeof s.caughtAnim === 'number' && s.caughtAnim <= 0));
        gone.forEach(() => {
          const ns = this.makeSwimmer('fish', W, this.game.height);
          if (ns) f.swimmers.push(ns);
        });
        f.splash = 0.6;
      }

      this.syncFriendCaption(sec);
      if (f.splash > 0) f.splash -= sec;

      // Стайка проносится через весь экран и уходит. Следующая — не сразу,
      // чтобы это было событие, а не постоянная толпа.
      if (f.school) {
        f.school.x += f.school.dir * f.school.speed * sec;
        f.school.phase += sec * 6;
        const off = f.school.dir > 0 ? f.school.x > w.x1 + 80 : f.school.x < w.x0 - 80;
        if (off) { f.school = null; f.schoolIn = randFloat(16, 28); }
      } else if ((f.schoolIn -= sec) <= 0) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const colors = [
          ['#d7e3ea', '#f4f9fc'], ['#c6d2dc', '#f0f5f9'], ['#ffd36a', '#fff1b8'], ['#7fc1c9', '#dcf0f2']
        ];
        const col = colors[Math.floor(Math.random() * colors.length)];
        const members = [];
        const n = 7 + Math.floor(Math.random() * 5);
        for (let i = 0; i < n; i++) {
          members.push({
            ox: (i % 4) * 16 + (i > 3 ? 8 : 0),
            oy: (Math.floor(i / 4) - 0.5) * 14 + (i % 2) * 4,
            bob: randFloat(0.6, 1.4)
          });
        }
        f.school = {
          x: dir > 0 ? w.x0 - 30 : w.x1 + 30,
          y: randFloat(w.top + 50, w.bottom - 70),
          dir: dir, speed: randFloat(78, 110), phase: 0,
          color: col[0], belly: col[1], members: members
        };
      }

      // Иногда рыбка выпрыгивает дугой над водой и падает обратно.
      f.jumps = (f.jumps || []).filter(j => {
        j.t += sec;
        return j.t < j.dur;
      });
      if ((f.jumpIn -= sec) <= 0) {
        f.jumpIn = randFloat(11, 20);
        f.jumps.push({
          x: randFloat(w.x0 + 30, w.x1 - 30),
          t: 0,
          dur: 1.15,
          h: randFloat(46, 78),
          dir: Math.random() < 0.5 ? -1 : 1
        });
      }

      // Персонаж в акваланге — редкость. Плывёт неспешно через весь экран и уходит.
      if (f.diver) {
        f.diver.x += f.diver.dir * f.diver.speed * sec;
        f.diver.phase += sec;
        f.diver.bubbles.forEach(b => {
          b.y -= 28 * sec;
          b.r += sec * 0.35;
          b.x += Math.sin(b.y * 0.08) * 6 * sec;
          b.life -= sec;
        });
        f.diver.bubbles = f.diver.bubbles.filter(b => b.life > 0 && b.r < 6);
        // Рот трубки в координатах фигурки: чуть выше макушки. Тот же поворот, что в drawDiver.
        const ang = (f.diver.dir > 0 ? Math.PI / 2 : -Math.PI / 2) - f.diver.dir * 0.22;
        const cs = Math.cos(ang), sn = Math.sin(ang);
        const lx = 7, ly = -50;
        const mouthX = f.diver.x + lx * cs - ly * sn;
        const mouthY = f.diver.y + lx * sn + ly * cs;
        if (Math.random() < sec * 0.85) {
          f.diver.bubbles.push({
            x: mouthX + randFloat(-2, 2),
            y: mouthY + randFloat(-2, 2),
            r: randFloat(1.8, 3.2),
            life: randFloat(1.5, 2.2)
          });
        }
        const gone = f.diver.dir > 0 ? f.diver.x > w.x1 + 90 : f.diver.x < w.x0 - 90;
        if (gone) { f.diver = null; f.diverIn = randFloat(45, 75); }
      } else if ((f.diverIn -= sec) <= 0) {
        const ch = this.nextDiverCharacter();
        if (ch && typeof createCharacter === 'function') {
          const dir = Math.random() < 0.5 ? -1 : 1;
          f.diver = {
            id: ch.id,
            name: ch.name,
            actor: createCharacter(ch.id, 86),
            x: dir > 0 ? w.x0 - 70 : w.x1 + 70,
            y: randFloat(w.top + 70, w.bottom - 80),
            dir: dir,
            speed: randFloat(16, 24),
            phase: 0,
            bubbles: [],
            note: ch.name + ' в акваланге! Редкий гость на глубине.'
          };
        } else f.diverIn = 30;
      }
      // Пора менять состав больших обитателей: ждём, когда кто-то дойдёт до края
      if (f.friendSwap > 0) {
        f.friendSwap -= sec;
        if (f.friendSwap <= 0) f.friendSwapWanted = true;
      }

      // Пока на экране факт о пойманной рыбе, поклёвки нет: иначе текст
      // перекрывается «КЛЮЁТ!» и ребёнок не успевает дочитать.
      if (this.mode === 'watch') {
        this.watchOpenFor = (this.watchOpenFor || 0) + sec;
        f.watchTime = (f.watchTime || 0) + sec;
        if (!f.watchRewarded && f.watchTime > 40) {
          f.watchRewarded = true;
          this.reward('watch', 'Посмотрели на море');
        }
      } else if (!this.readingCatch()) {
        if (f.state === 'wait') {
          f.timer -= sec;
          if (f.timer <= 0) {
            f.state = 'bite';
            f.biteWindow = 2.4;
            f.biteFish = this.pickBiter();
            AudioSys.play('coin');
          }
        } else if (f.state === 'bite') {
          f.biteWindow -= sec;
          if (f.biteWindow <= 0) {
            if (f.biteFish) f.biteFish.nibble = 0;      // рыбка уплыла — попробуем снова
            f.biteFish = null;
            f.state = 'wait';
            f.timer = randFloat(8, 13);
          }
        }
      }
    }
  }
  // ================= ОТРИСОВКА =================
  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;

    // Ночь и покой — фон всегда спокойный
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#141433');
    grad.addColorStop(1, '#243055');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * 12.9) * 0.5 + 0.5) * W;
      const sy = (Math.cos(i * 7.3) * 0.5 + 0.5) * H * 0.7;
      const tw = 0.5 + 0.5 * Math.sin(this.time * 0.002 + i);
      ctx.globalAlpha = 0.25 + tw * 0.45;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawHeader(ctx, W, H);

    if (this.mode === 'select') this.drawSelect(ctx, W, H);
    else if (this.mode === 'stars') this.drawStars(ctx, W, H);
    else if (this.mode === 'color') this.drawColor(ctx, W, H);
    else if (this.mode === 'window') this.drawWindow(ctx, W, H);
    else this.drawFish(ctx, W, H);

    if (this.resultTimer > 0) {
      // Факты о рыбах длинные, и в одну строку они превращались в нечитаемые
      // 9 px (замечание заказчика, v1.3.10). Теперь подбираем размер и переносим
      // текст по словам: до четырёх строк, плашка растёт вместе с текстом.
      const bw = Math.min(W * 0.92, 380);
      const pad = 14;
      const baseSize = Math.min(W * 0.034, 14), minSize = 10.5;
      let size = baseSize, lines = [];
      while (size >= minSize) {
        ctx.font = 'bold ' + size + 'px Arial, sans-serif';
        const probe = wrapLines(ctx, this.result, bw - pad * 2, 4);
        if (probe.every(l => ctx.measureText(l).width <= bw - pad * 2)) { lines = probe; break; }
        size -= 0.5;
      }
      if (!lines.length) {
        ctx.font = 'bold ' + minSize + 'px Arial, sans-serif';
        lines = wrapLines(ctx, this.result, bw - pad * 2, 4);
      }
      const lh = size + 5.5;
      const bh = Math.max(42, lines.length * lh + pad + 4);
      const by = H * 0.44 - (bh - 44) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.74)';
      roundRect(ctx, (W - bw) / 2, by, bw, bh, 12);
      ctx.fill();
      ctx.fillStyle = '#FFD93D';
      ctx.font = 'bold ' + size + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => ctx.fillText(line, W / 2, by + pad / 2 + lh * (i + 0.5)));
      ctx.textBaseline = 'alphabetic';
    }

    this.buttons.push(createButton(ctx, 10, 10, 88, 34, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 9
    }));
  }

  // Состояние гофера: спит — энергия копится; не спит — просто тихая игра
  drawHeader(ctx, W, H) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.055, 24)}px Arial`;
    ctx.fillText('🤫 Тихие игры', W / 2, H * 0.055);

    const status = System.isSleeping
      ? '{Pet} спит 💤  энергия ' + Math.round(System.stats.energy) + '% (+10% в минуту)'
      : '{Pet} не спит. Тихие игры не тратят энергию и не мешают отдыху';
    const size = fitFontSize(ctx, status, W - 30, Math.min(W * 0.029, 12.5), 8.5, false);
    ctx.fillStyle = System.isSleeping ? '#9be3b0' : '#c9cfe0';
    ctx.font = `${size}px Arial`;
    ctx.fillText(status, W / 2, H * 0.095);
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Выбор игры ----------
  drawSelect(ctx, W, H) {
    const games = (typeof QUIET_GAMES !== 'undefined') ? QUIET_GAMES : [];
    const cardW = Math.min(W * 0.86, 330);
    const cardH = Math.min(H * 0.095, 72);
    const x0 = (W - cardW) / 2;
    const y0 = H * 0.15;

    games.forEach((g, i) => {
      const y = y0 + i * (cardH + 12);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, x0, y, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x0, y, cardW, cardH, 14);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(cardH * 0.5, 38)}px Arial`;
      ctx.fillText(g.emoji, x0 + 14, y + cardH / 2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.042, 17)}px Arial`;
      ctx.fillText(g.name, x0 + 66, y + cardH / 2 - 11);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.min(W * 0.030, 12.5)}px Arial`;
      ctx.fillText(g.desc, x0 + 66, y + cardH / 2 + 11);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(W * 0.030, 12.5)}px Arial`;
      ctx.fillText('🪙+' + g.reward, x0 + cardW - 14, y + cardH - 15);

      this.buttons.push({ x: x0, y: y, w: cardW, h: cardH, action: 'quiet:' + g.id });
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
    ctx.fillText('Проиграть нельзя — можно только отдохнуть 😌', W / 2, H - 26);
  }
  // ---------- 1. Созвездие ----------
  drawStars(ctx, W, H) {
    const a = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const pts = this.stars.points.map(p => ({ x: a.x + a.w * p[0], y: a.y + a.h * p[1] }));

    ctx.strokeStyle = 'rgba(255,217,61,0.85)';
    ctx.lineWidth = 2;
    for (let i = 1; i < this.stars.next; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    pts.forEach((p, i) => {
      const done = i < this.stars.next;
      const isNext = i === this.stars.next && !this.stars.done;
      const pulse = isNext ? 1 + Math.sin(this.time * 0.006) * 0.22 : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (isNext ? 13 : 9) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = done ? '#FFD93D' : (isNext ? '#8FE3FF' : 'rgba(255,255,255,0.35)');
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isNext ? '#0d1024' : 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), p.x, p.y + 0.5);
      ctx.textBaseline = 'alphabetic';
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.030, 13)}px Arial`;
    ctx.fillText(this.stars.done ? 'Созвездие готово! ✨' : 'Нажимай звёзды по порядку: 1, 2, 3…', W / 2, H * 0.80);

    this.buttons.push(createButton(ctx, W * 0.30, H * 0.84, W * 0.40, 38,
      this.stars.done ? '✨ Ещё раз' : '🔄 Заново', {
        bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 14, radius: 10
      }));
  }

  // ---------- 2. Раскраска ----------
  drawColor(ctx, W, H) {
    const p = this.paint;
    const a = { x: W * 0.12, y: H * 0.16, w: W * 0.76, h: H * 0.52 };

    // Имя картинки: их восемь, и это видно (v1.3.12)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.040, 17)}px Arial`;
    ctx.fillText('🎨 ' + p.name, W / 2, a.y - 12);

    p.parts.forEach(part => {
      ctx.beginPath();
      if (part.kind === 'circle') {
        ctx.arc(a.x + a.w * part.cx, a.y + a.h * part.cy, a.w * part.r, 0, Math.PI * 2);
      } else if (part.kind === 'ellipse') {
        ctx.ellipse(a.x + a.w * part.cx, a.y + a.h * part.cy, a.w * part.rx, a.h * part.ry, 0, 0, Math.PI * 2);
      } else if (part.kind === 'rect') {
        roundRect(ctx, a.x + a.w * part.x, a.y + a.h * part.y, a.w * part.w, a.h * part.h, 8);
      }
      ctx.fillStyle = part.fill || 'rgba(255,255,255,0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });

    // Мордочка — только у тех картинок, у кого она есть (гофер, рыбка, бабочка)
    if (p.face) {
      const hx = a.x + a.w * p.face.x, hy = a.y + a.h * p.face.y;
      const eye = Math.max(1.6, a.w * 0.014);
      ctx.fillStyle = '#1b1b26';
      ctx.beginPath(); ctx.arc(hx - a.w * 0.05, hy, eye, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + a.w * 0.05, hy, eye, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx, hy + a.h * 0.045, a.w * 0.02, a.h * 0.015, 0, 0, Math.PI * 2); ctx.fill();
    }

    // палитра
    const sw = Math.min((W - 40) / p.colors.length, 54);
    const y = H * 0.73;
    p.colors.forEach((c, i) => {
      const x = (W - sw * p.colors.length) / 2 + i * sw;
      ctx.fillStyle = c;
      roundRect(ctx, x + 2, y, sw - 4, sw * 0.55, 8);
      ctx.fill();
      if (i === p.picked) {
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 3;
        roundRect(ctx, x + 2, y, sw - 4, sw * 0.55, 8);
        ctx.stroke();
      }
      this.buttons.push({ x: x + 2, y: y, w: sw - 4, h: sw * 0.55, action: 'paint:' + i });
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.030, 13)}px Arial`;
    const painted = (typeof System !== 'undefined' && System.getSeen) ? System.getSeen('paint').length : 0;
    ctx.fillText(p.done
      ? 'Готово! Раскрасок открыто: ' + painted + ' из ' + PAINT_PICTURES.length + ' 🎨'
      : 'Выбери цвет и нажимай на части картинки', W / 2, H * 0.69);

    this.buttons.push(createButton(ctx, W * 0.30, H * 0.85, W * 0.40, 36, '🔄 Другая картинка', {
      bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 12, radius: 10
    }));
  }

  // Факт о пойманной рыбе на экране: поклёвки и «Рано!» в это время не мешают чтению
  readingCatch() {
    return this.mode === 'fish' && this.resultTimer > 0 && String(this.result || '').indexOf('🐟') === 0;
  }

  // Текст про краба, ската и остальных — под строкой «Поймано / Видов»,
  // в пустой полосе внизу, чтобы не закрывать воду и рыбок.
  drawWrappedHint(ctx, W, H, text) {
    const bw = Math.min(W * 0.92, 460);
    let size = Math.min(W * 0.026, 11);
    let lines = [];
    while (size >= 9) {
      ctx.font = size + 'px Arial';
      lines = wrapLines(ctx, text, bw, 2);
      if (lines.every(l => ctx.measureText(l).width <= bw)) break;
      size -= 0.5;
    }
    const lh = size + 3;
    ctx.fillStyle = '#ffd9a0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => ctx.fillText(line, W / 2, H * 0.968 + i * lh));
    ctx.textBaseline = 'alphabetic';
  }

  // Вода, дно и декор зависят от царства, выбранного при входе в рыбалку
  drawSeaBiome(ctx, W, H, w, id) {
    const pal = {
      classic: ['#2f8fb8', '#1d5b86', '#0b2b45', '#c8b27a'],
      reef: ['#1aa0b8', '#0e6e86', '#083848', '#c4a06a'],
      sand: ['#49c2d4', '#2a8eae', '#14607a', '#e6d2a2'],
      kelp: ['#1f7a62', '#0e4e48', '#062e30', '#8a7a48'],
      ice: ['#d7f3ff', '#7eb8d4', '#3d6f96', '#eef6fb'],
      night: ['#12304a', '#0a1c30', '#050c16', '#2a3340'],
      wreck: ['#3d7a6a', '#1e4a42', '#102820', '#6e6248'],
      cave: ['#245068', '#122838', '#070f18', '#3a342c'],
      lagoon: ['#5ad4e0', '#1a9aaa', '#0c6070', '#f0ddb0']
    }[id] || ['#2f8fb8', '#1d5b86', '#0b2b45', '#c8b27a'];

    const wg = ctx.createLinearGradient(0, w.top - 30, 0, H * 0.86);
    wg.addColorStop(0, pal[0]);
    wg.addColorStop(0.45, pal[1]);
    wg.addColorStop(1, pal[2]);
    ctx.fillStyle = wg;
    ctx.fillRect(0, w.top - 30, W, H * 0.86 - (w.top - 30));

    if (id !== 'night' && id !== 'cave') {
      ctx.save();
      ctx.globalAlpha = id === 'ice' ? 0.18 : 0.10;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const bx = (i + 0.5) * W / 5 + Math.sin(this.time * 0.0007 + i) * 14;
        ctx.beginPath();
        ctx.moveTo(bx - 16, w.top - 30);
        ctx.lineTo(bx + 16, w.top - 30);
        ctx.lineTo(bx + 62, H * 0.84);
        ctx.lineTo(bx + 18, H * 0.84);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    const wave = id === 'ice' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)';
    ctx.strokeStyle = wave;
    ctx.lineWidth = id === 'ice' ? 2.4 : 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const amp = id === 'ice' ? 1.2 : 3;
        const y = w.top - 18 + i * 12 + Math.sin((x * 0.03) + this.time * 0.002 + i) * amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = pal[3];
    ctx.beginPath();
    ctx.moveTo(0, H * 0.84);
    for (let x = 0; x <= W; x += 24) {
      const hump = id === 'sand' ? 9 : 4;
      ctx.lineTo(x, H * 0.84 + Math.sin(x * 0.02 + (id === 'sand' ? 1 : 0)) * hump);
    }
    ctx.lineTo(W, H * 0.90);
    ctx.lineTo(0, H * 0.90);
    ctx.closePath();
    ctx.fill();

    const sandY = H * 0.845;
    const blade = (sx, height, color, wide) => {
      const sway = Math.sin(this.time * 0.0016 + sx) * (height > 80 ? 14 : 8);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(sx - wide, sandY);
      ctx.quadraticCurveTo(sx + sway * 0.4, sandY - height * 0.55, sx + sway, sandY - height);
      ctx.quadraticCurveTo(sx + sway * 0.3 + wide, sandY - height * 0.45, sx + wide, sandY);
      ctx.fill();
    };
    if (id === 'kelp') {
      for (let i = 0; i < 9; i++) blade(18 + i * (W / 9), 90 + (i % 3) * 28, i % 2 ? '#2f8f4e' : '#3eaf62', 5);
    } else if (id === 'classic' || id === 'lagoon') {
      for (let i = 0; i < 4; i++) blade(30 + i * (W / 4.2), 36 + (i % 2) * 16, 'rgba(90,140,70,0.9)', 3);
    }

    if (id === 'reef' || id === 'lagoon') {
      const cols = ['#ff7a8a', '#ffb15a', '#e07ad4', '#ff8f6b', '#7ad0c8'];
      const n = id === 'reef' ? 6 : 3;
      for (let i = 0; i < n; i++) {
        const cx = W * (0.08 + i * (0.84 / n));
        const h = 28 + (i % 3) * 12;
        const col = cols[i % cols.length];
        if (i % 3 === 2) {
          ctx.fillStyle = '#e7a0c4';
          ctx.beginPath();
          ctx.ellipse(cx, sandY - 10, 16, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(120,50,80,0.45)';
          ctx.lineWidth = 1;
          for (let k = -1; k <= 1; k++) {
            ctx.beginPath();
            ctx.ellipse(cx, sandY - 10 + k * 4, 12, 3, 0.2 * k, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          // Рогатый коралл: толстый ствол и ветки с круглыми кончиками
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(cx - 9, sandY);
          ctx.quadraticCurveTo(cx - 6, sandY - h * 0.45, cx, sandY - h * 0.62);
          ctx.quadraticCurveTo(cx + 6, sandY - h * 0.45, cx + 9, sandY);
          ctx.closePath();
          ctx.fill();
          for (let f = -2; f <= 2; f++) {
            const bx = cx + f * 8;
            const bh = h * (0.72 + (f === 0 ? 0.22 : Math.abs(f) * 0.05));
            const lean = f * 5;
            ctx.beginPath();
            ctx.moveTo(cx + f * 2 - 3.5, sandY - h * 0.28);
            ctx.quadraticCurveTo(bx + lean * 0.4 - 3, sandY - bh * 0.62, bx + lean, sandY - bh);
            ctx.quadraticCurveTo(bx + lean * 0.4 + 3, sandY - bh * 0.62, cx + f * 2 + 3.5, sandY - h * 0.28);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx + lean, sandY - bh, 5.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.beginPath();
            ctx.arc(bx + lean - 1.4, sandY - bh - 1.2, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = col;
          }
        }
      }
      if (id === 'reef') {
        const fx = W * 0.78, fy = sandY - 6;
        ctx.fillStyle = 'rgba(255,150,180,0.55)';
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.arc(fx, fy, 26, Math.PI * 1.08, Math.PI * 1.92);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,50,90,0.55)';
        ctx.lineWidth = 1.3;
        for (let k = 0; k < 7; k++) {
          const a = Math.PI * 1.12 + k * 0.12;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + Math.cos(a) * 26, fy + Math.sin(a) * 26);
          ctx.stroke();
        }
      }
    }

    if (id === 'sand' || id === 'lagoon') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, sandY + 6);
        ctx.quadraticCurveTo(x + 8, sandY + 2, x + 16, sandY + 6);
        ctx.stroke();
      }
      [[0.2, '#f4efe4'], [0.55, '#f7f3ea'], [0.78, '#efe6d4']].forEach(([rx, col], i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(W * rx, sandY + 2, 8 + i, 4, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,90,50,0.4)';
        ctx.stroke();
      });
      ctx.fillStyle = '#e07a3c';
      const sx = W * 0.38, sy = sandY - 2;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        ctx.lineTo(sx + Math.cos(a) * 7, sy + Math.sin(a) * 7);
        ctx.lineTo(sx + Math.cos(a + 0.4) * 3, sy + Math.sin(a + 0.4) * 3);
      }
      ctx.fill();
    }

    if (id === 'ice') {
      ctx.fillStyle = 'rgba(230,246,255,0.88)';
      ctx.fillRect(0, w.top - 36, W, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      [0.08, 0.22, 0.41, 0.63, 0.8, 0.93].forEach((rx, i) => {
        const x = W * rx;
        const len = 18 + (i % 3) * 14;
        ctx.beginPath();
        ctx.moveTo(x - 6, w.top - 18);
        ctx.lineTo(x, w.top - 18 + len);
        ctx.lineTo(x + 6, w.top - 18);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(190,220,235,0.55)';
      [[0.18, 22], [0.7, 30]].forEach(([rx, rw]) => {
        ctx.beginPath();
        ctx.moveTo(W * rx, sandY);
        ctx.lineTo(W * rx + rw, sandY - 26);
        ctx.lineTo(W * rx + rw * 1.4, sandY);
        ctx.fill();
      });
    }

    if (id === 'night') {
      for (let i = 0; i < 22; i++) {
        const px = (i * 97) % W;
        const py = w.top + 24 + ((i * 53) % Math.max(20, w.bottom - w.top - 50));
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(this.time * 0.003 + i));
        const rad = 2.2 + (i % 3);
        ctx.fillStyle = 'rgba(140,255,210,' + (0.35 + tw * 0.5).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(px, py, rad * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#eafff6';
        ctx.beginPath();
        ctx.arc(px, py, rad * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (id === 'wreck') this.drawWreck(ctx, W, H);

    if (id === 'cave') {
      ctx.fillStyle = 'rgba(16,22,30,0.88)';
      for (let i = 0; i < 7; i++) {
        const x = (i + 0.35) * W / 7;
        const len = 28 + (i % 3) * 22;
        ctx.beginPath();
        ctx.moveTo(x - 8, w.top - 24);
        ctx.quadraticCurveTo(x - 2, w.top + len * 0.4, x, w.top + len);
        ctx.quadraticCurveTo(x + 4, w.top + len * 0.35, x + 10, w.top - 24);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 6, sandY + 6);
        ctx.lineTo(x, sandY - 18 - (i % 2) * 10);
        ctx.lineTo(x + 8, sandY + 6);
        ctx.fill();
      }
      [[0.25, '#7fd0ff'], [0.58, '#b388ff'], [0.82, '#7dffa8']].forEach(([rx, col], i) => {
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.55 + 0.25 * Math.sin(this.time * 0.002 + i);
        ctx.beginPath();
        ctx.moveTo(W * rx, sandY - 4);
        ctx.lineTo(W * rx + 6, sandY - 22);
        ctx.lineTo(W * rx + 12, sandY - 4);
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    if (id !== 'sand' && id !== 'ice') {
      ctx.fillStyle = 'rgba(90,80,70,0.55)';
      [[0.12, 0.05], [0.36, 0.035], [0.68, 0.055], [0.88, 0.035]].forEach(([rx, rr]) => {
        ctx.beginPath();
        ctx.ellipse(W * rx, H * 0.86, W * rr, W * rr * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.save();
    ctx.strokeStyle = id === 'night' ? 'rgba(160,255,230,0.45)' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      const bx = (i * 137 % W);
      const t = (this.time * 0.02 + i * 90) % 260;
      const by = w.bottom - 10 - ((t / 260) * (w.bottom - w.top - 20));
      ctx.globalAlpha = 0.5 - (t / 260) * 0.35;
      ctx.beginPath();
      ctx.arc(bx, by, 1.6 + (i % 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    const labels = {
      classic: 'Тихая заводь', reef: 'Коралловый риф', sand: 'Песчаная отмель',
      kelp: 'Заросли водорослей', ice: 'Ледяная полынья', night: 'Ночное море',
      wreck: 'Затонувший корабль', cave: 'Подводная пещера', lagoon: 'Бирюзовая лагуна'
    };
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(labels[id] || '', W / 2, H * 0.125);
  }

  // Затонувший корабль сбоку: корпус лежит на дне, нос задран, мачта сломана,
  // в борту иллюминаторы, рядом якорь. Рыбам остаётся вода над палубой.
  drawWreck(ctx, W, H) {
    const yb = H * 0.845;
    const x0 = W * 0.12;
    const x1 = W * 0.90;
    const hullH = Math.min(H * 0.11, 78);
    ctx.save();
    // корпус: нос слева выше, корма справа ушла в песок
    ctx.fillStyle = '#6b4a32';
    ctx.beginPath();
    ctx.moveTo(x0 + 18, yb);
    ctx.quadraticCurveTo(x0 - 6, yb - hullH * 0.2, x0 + 28, yb - hullH * 0.95);
    ctx.lineTo(x1 - 36, yb - hullH * 0.55);
    ctx.quadraticCurveTo(x1 + 8, yb - hullH * 0.15, x1 - 10, yb);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a6244';
    ctx.beginPath();
    ctx.moveTo(x0 + 34, yb - hullH * 0.72);
    ctx.lineTo(x1 - 40, yb - hullH * 0.42);
    ctx.lineTo(x1 - 28, yb - hullH * 0.22);
    ctx.lineTo(x0 + 46, yb - hullH * 0.48);
    ctx.closePath();
    ctx.fill();
    // палуба и сломанный фальшборт
    ctx.strokeStyle = '#3e2a1c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0 + 36, yb - hullH * 0.78);
    ctx.lineTo(x1 - 42, yb - hullH * 0.48);
    ctx.stroke();
    // иллюминаторы
    ctx.fillStyle = '#d7eef8';
    for (let i = 0; i < 4; i++) {
      const t = 0.22 + i * 0.16;
      const px = x0 + (x1 - x0) * t;
      const py = yb - hullH * (0.62 - i * 0.06);
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3e2a1c';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    // мачта сломана и накренилась
    const mx = W * 0.46;
    const my = yb - hullH * 0.62;
    ctx.strokeStyle = '#4a3424';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + 28, my - hullH * 1.15);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx + 28, my - hullH * 1.15);
    ctx.lineTo(mx + 6, my - hullH * 0.35);
    ctx.stroke();
    // обрывок паруса
    ctx.fillStyle = 'rgba(230,214,180,0.75)';
    ctx.beginPath();
    ctx.moveTo(mx + 8, my - hullH * 0.95);
    ctx.lineTo(mx + 36, my - hullH * 0.7);
    ctx.quadraticCurveTo(mx + 18, my - hullH * 0.45, mx + 4, my - hullH * 0.55);
    ctx.closePath();
    ctx.fill();
    // якорь на песке перед носом
    const ax = x0 + 8, ay = yb - 4;
    ctx.strokeStyle = '#2c2c30';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay - 28);
    ctx.lineTo(ax, ay);
    ctx.moveTo(ax - 12, ay - 4);
    ctx.quadraticCurveTo(ax, ay + 10, ax + 12, ay - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ax, ay - 32, 5, 0, Math.PI * 2);
    ctx.stroke();
    // водоросли на борту, чтобы было видно, что корабль давно лежит
    ctx.strokeStyle = 'rgba(70,140,70,0.8)';
    ctx.lineWidth = 3;
    [0.3, 0.55, 0.72].forEach((t, i) => {
      const sx = x0 + (x1 - x0) * t;
      const sway = Math.sin(this.time * 0.0016 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(sx, yb - hullH * 0.25);
      ctx.quadraticCurveTo(sx + sway, yb - hullH * 0.7, sx + sway * 0.4, yb - hullH * 1.05);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawSchool(ctx, school) {
    if (!school) return;
    const L = 11, h = 6;
    school.members.forEach((m, i) => {
      const wig = Math.sin(school.phase + i) * 3;
      const x = school.x + school.dir * m.ox;
      const y = school.y + m.oy + wig;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(school.dir, 1);
      ctx.save();
      ctx.translate(-L * 0.35, 0);
      ctx.rotate(wig * 0.08);
      ctx.fillStyle = school.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-L * 0.45, -h * 0.7);
      ctx.lineTo(-L * 0.28, 0);
      ctx.lineTo(-L * 0.45, h * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const g = ctx.createLinearGradient(0, -h, 0, h);
      g.addColorStop(0, school.belly);
      g.addColorStop(1, school.color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(L * 0.55, 0);
      ctx.quadraticCurveTo(L * 0.2, -h, -L * 0.15, -h * 0.7);
      ctx.quadraticCurveTo(-L * 0.45, 0, -L * 0.15, h * 0.7);
      ctx.quadraticCurveTo(L * 0.2, h, L * 0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#102030';
      ctx.beginPath();
      ctx.arc(L * 0.28, -1, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawDiver(ctx, diver) {
    if (!diver || !diver.actor) return;
    diver.bubbles.forEach(b => {
      const a = Math.max(0.15, Math.min(0.9, b.life * 0.45));
      ctx.fillStyle = 'rgba(220,245,255,' + a.toFixed(2) + ')';
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, a + 0.25).toFixed(2) + ')';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    const s = 86;
    // В локальных координатах фигурки голова — это минус Y. Поворот кладёт
    // голову в сторону движения, нос чуть к поверхности.
    const back = diver.dir > 0 ? -1 : 1;
    const kick = Math.sin(diver.phase * 5) * 0.45;
    ctx.save();
    ctx.translate(diver.x, diver.y + Math.sin(diver.phase * 1.4) * 3);
    ctx.rotate((diver.dir > 0 ? Math.PI / 2 : -Math.PI / 2) - diver.dir * 0.22);

    // Баллон на спине (к поверхности), рисуется до тела, чтобы выглядывал из-за него
    ctx.save();
    ctx.translate(back * s * 0.20, s * 0.02);
    ctx.fillStyle = '#f2c14e';
    ctx.strokeStyle = '#6b4e12';
    ctx.lineWidth = 2;
    roundRect(ctx, -s * 0.09, -s * 0.22, s * 0.18, s * 0.46, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a4552';
    roundRect(ctx, -s * 0.07, -s * 0.28, s * 0.14, s * 0.08, 3);
    ctx.fill();
    ctx.restore();

    const actor = diver.actor;
    const animate = actor.animate;
    actor.animate = function (x, y, size) {
      animate.call(this, x, y, size);
      this.armAngle = -1.05;
      this.legAnim = kick;
    };
    actor.draw(ctx, 0, 0, 1);
    actor.animate = animate;

    // Маска и трубка: от маски вверх, над макушкой, а не к баллону
    ctx.strokeStyle = '#16324a';
    ctx.fillStyle = 'rgba(150,220,245,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.26, s * 0.15, s * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#e7eef5';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.22);
    ctx.quadraticCurveTo(s * 0.28, -s * 0.4, s * 0.08, -s * 0.56);
    ctx.stroke();
    ctx.fillStyle = '#16324a';
    ctx.beginPath();
    ctx.arc(s * 0.08, -s * 0.56, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // Ласты: длинные лопасти назад от ступней, гребут в противофазе
    [-1, 1].forEach((side, i) => {
      const flap = kick * (i === 0 ? 1 : -1);
      ctx.save();
      ctx.translate(side * s * 0.16, s * 0.40);
      ctx.rotate(side * 0.15 + flap);
      ctx.fillStyle = i === 0 ? '#1f6f8a' : '#174f66';
      ctx.strokeStyle = '#0d2c3a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-s * 0.05, 0);
      ctx.lineTo(-s * 0.11, s * 0.28);
      ctx.lineTo(s * 0.11, s * 0.28);
      ctx.lineTo(s * 0.05, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  drawJumps(ctx, jumps, w) {
    jumps.forEach(j => {
      const p = j.t / j.dur;
      const x = j.x + j.dir * p * 36;
      const y = w.top - Math.sin(p * Math.PI) * j.h;
      ctx.save();
      ctx.translate(x, y);
      // Голова рисуется в плюс X. Сначала смотрим в сторону прыжка, потом нос
      // вверх на выходе из воды и вниз на входе. Иначе прыжок влево идёт хвостом.
      ctx.scale(j.dir || 1, 1);
      ctx.rotate((p - 0.5) * 1.15);
      ctx.fillStyle = '#e7f4fb';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-13, -4);
      ctx.lineTo(-13, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (p < 0.18 || p > 0.82) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(j.x, w.top + 2, 10 + p * 16, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  // ---------- 3. Тихая рыбалка ----------
  drawFish(ctx, W, H) {
    const f = this.fish;
    const waterTop = H * 0.46;
    const w = this.fishWater();

    this.drawSeaBiome(ctx, W, H, w, (f.biome && f.biome.id) || 'classic');
    this.drawSchool(ctx, f.school);
    this.drawDiver(ctx, f.diver);
    this.drawJumps(ctx, f.jumps || [], w);

    // Жители воды: сначала большие (фон), потом рыбки — их хорошо видно
    const order = (f.swimmers || []).slice().sort((a, b) => (a.kind === 'friend' ? -1 : 1) - (b.kind === 'friend' ? -1 : 1));
    order.forEach(s => {
      if (s.kind === 'friend') this.drawSeaFriend(ctx, s);
      else this.drawSeaFish(ctx, s);
    });

    const watching = this.mode === 'watch';
    // Поплавок на поверхности, ниже — крючок с наживкой: видно, как рыбка
    // подплывает к наживке и цепляется (v1.3.9). В режиме «смотреть» крючка нет.
    const dip = (!watching && f.state === 'bite') ? 14 + Math.sin(this.time * 0.03) * 4 : 0;
    const bx = W / 2;
    if (!watching) {
    const by = w.top + 14 + dip;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, H * 0.16);
    ctx.lineTo(bx, by - 10);
    ctx.stroke();
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(bx, by + 5, 6, 0, Math.PI); ctx.fill();

    const hy = this.fishHookY();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + 8);
    ctx.lineTo(bx, hy + 8);
    ctx.stroke();
    ctx.strokeStyle = '#cfd8e3';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(bx, hy + 13, 7, Math.PI * 0.15, Math.PI * 1.15);
    ctx.stroke();
    ctx.fillStyle = '#F6C177';
    ctx.beginPath(); ctx.arc(bx, hy + 6, 4.5, 0, Math.PI * 2); ctx.fill();

    if (f.state === 'bite') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(bx, w.top + 2, r * 15, r * 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    }
    if (!watching && f.splash > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(0.8, f.splash).toFixed(2) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(bx, w.top + 4, 26 + (0.6 - f.splash) * 70, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    // Строка состояния — на тёмной плашке: без неё текст теряется на песочном дне
    ctx.fillStyle = 'rgba(8,18,32,0.66)';
    roundRect(ctx, W / 2 - Math.min(W * 0.44, 232), H * 0.881, Math.min(W * 0.88, 464), 27, 10);
    ctx.fill();
    ctx.fillStyle = f.state === 'bite' ? '#FFD93D' : '#c9cfe0';
    ctx.font = `bold ${Math.min(W * 0.036, 15)}px Arial`;
    ctx.fillText(watching ? 'Смотрим на море 👀' : (f.state === 'bite' ? 'КЛЮЁТ! Нажимай — тяни!' : 'Ждём поклёвку… тихо-тихо 🎣'), W / 2, H * 0.900);

    ctx.font = `${Math.min(W * 0.030, 12.5)}px Arial`;
    ctx.fillStyle = '#9be3b0';
    const species = (typeof System !== 'undefined' && System.fishSpeciesCount) ? System.fishSpeciesCount() : 0;
    const all = (typeof FISH_SPECIES !== 'undefined') ? FISH_SPECIES.length : 0;
    ctx.fillText(watching
      ? ('Видов в море: ' + all)
      : ('Поймано: ' + f.caught + ' / ' + f.target + ' 🐟   Видов: ' + species + ' / ' + all), W / 2, H * 0.94);

    // Подсказка про больших обитателей появляется только тогда, когда кто-то из
    // них проходит рядом с крючком: постоянной надписи внизу экрана нет —
    // заказчик v1.3.11 попросил её убрать («явно не нужная»).
    if (f.friendHint > 0 && f.friendHintText) {
      this.drawWrappedHint(ctx, W, H, f.friendHintText);
    }

    // Галочка в небе справа. Через 30 секунд «просто смотреть» остаётся только зелёная клетка.
    const collapsed = watching && (this.watchOpenFor || 0) > 30;
    const box = 22;
    const rowH = 36;
    const rowW = collapsed ? 36 : Math.min(W * 0.48, 188);
    const rowX = W - 12 - rowW;
    const rowY = H * 0.145;
    ctx.fillStyle = 'rgba(8,24,48,0.45)';
    roundRect(ctx, rowX, rowY, rowW, rowH, 10);
    ctx.fill();
    const markX = collapsed ? rowX + 7 : rowX + 8;
    const markY = rowY + 7;
    ctx.strokeStyle = watching ? '#9be3b0' : 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.6;
    roundRect(ctx, markX, markY, box, box, 5);
    ctx.stroke();
    if (watching) {
      ctx.strokeStyle = '#9be3b0';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(markX + 4, markY + 11);
      ctx.lineTo(markX + 9, markY + 16);
      ctx.lineTo(markX + 18, markY + 5);
      ctx.stroke();
    }
    if (!collapsed) {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Просто смотреть', markX + box + 8, rowY + rowH / 2);
      ctx.textBaseline = 'alphabetic';
    }
    this.buttons.push({ x: rowX, y: rowY, w: rowW, h: rowH, text: '', action: 'watch:toggle' });

    if (!watching) {
      this.buttons.push(createButton(ctx, W * 0.28, H * 0.79, W * 0.44, 40,
        f.state === 'bite' ? '🎣 Тянуть!' : '⏳ Ждём…', {
          bgColor: f.state === 'bite' ? '#6BCB77' : 'rgba(255,255,255,0.18)',
          fgColor: f.state === 'bite' ? '#0d1024' : '#fff', fontSize: 14, radius: 10
        }));
    }
  }

  // Рыбка: тело, хвост, плавники, узор и глаз. Хвост машет — видно, что она плывёт.
  // Силуэт тела по «портрету» вида: нормальная, вытянутая (щука, сом), высокая
  // (окунь, лещ) и плоская (скалярия). Заказчик v1.3.12: «чтобы рыбки были разной
  // формы, размеров… некоторые разноцветные с разными плавниками».
  fishBodyBox(v, L, hgt) {
    if (v.shape === 'slim') return { rx: L * 0.62, ry: hgt * 0.34 };
    if (v.shape === 'deep') return { rx: L * 0.44, ry: hgt * 0.62 };
    if (v.shape === 'flat') return { rx: L * 0.40, ry: hgt * 0.68 };
    return { rx: L * 0.5, ry: hgt * 0.5 };
  }

  drawSeaFish(ctx, s) {
    const d = s.data || {};
    const base = Math.min(this.game.width * 0.046, 25);
    const L = base * (d.size || 1) * 1.5;
    const hgt = base * (d.size || 1) * 0.9;
    const wag = Math.sin(this.time * 0.012 + s.x * 0.05) * 0.38;
    // Портрет вида: форма, хвост, плавник, узор (v1.3.12)
    const v = (typeof fishVariety === 'function') ? fishVariety(d) : { shape: 'normal', tail: 'fan', fin: 'sail', pattern: 'none' };
    const body = this.fishBodyBox(v, L, hgt);
    ctx.save();
    ctx.globalAlpha = (s.alpha === undefined ? 1 : s.alpha);
    ctx.translate(s.x, s.y);
    ctx.scale(s.dir || 1, 1);

    // Хвост — плавник сзади, качается как у рыбы, а не ниточка вверх-вниз.
    ctx.save();
    ctx.translate(-body.rx * 0.72, 0);
    ctx.rotate(wag);
    ctx.fillStyle = d.color || '#8ab4ff';
    if (v.tail === 'fork') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-L * 0.42, -hgt * 0.55);
      ctx.lineTo(-L * 0.18, 0);
      ctx.lineTo(-L * 0.42, hgt * 0.55);
      ctx.closePath();
      ctx.fill();
    } else if (v.tail === 'round') {
      ctx.beginPath();
      ctx.ellipse(-L * 0.22, 0, L * 0.2, hgt * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (v.tail === 'streamer') {
      ctx.strokeStyle = d.color || '#8ab4ff';
      ctx.lineWidth = Math.max(2.2, hgt * 0.18);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-L * 0.35, hgt * 0.15, -L * 0.62, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-L * 0.4, -hgt * 0.5);
      ctx.lineTo(-L * 0.28, 0);
      ctx.lineTo(-L * 0.4, hgt * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Тело с мордой впереди: не круг, иначе светлая рыбка читается как мышь
    const g = ctx.createLinearGradient(0, -body.ry, 0, body.ry);
    g.addColorStop(0, d.belly || '#ffffff');
    g.addColorStop(0.55, d.belly || '#ffffff');
    g.addColorStop(1, d.color || '#8ab4ff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(body.rx * 1.05, 0);
    ctx.quadraticCurveTo(body.rx * 0.85, -body.ry * 0.55, body.rx * 0.15, -body.ry);
    ctx.quadraticCurveTo(-body.rx * 0.55, -body.ry * 0.85, -body.rx * 0.78, 0);
    ctx.quadraticCurveTo(-body.rx * 0.55, body.ry * 0.85, body.rx * 0.15, body.ry);
    ctx.quadraticCurveTo(body.rx * 0.85, body.ry * 0.55, body.rx * 1.05, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(18, 36, 52, 0.45)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Узор «внутри» тела — по маске эллипса, чтобы полоски и пятна не вылезали:
    // полосатые (окунь, данио, клоун) и пятнистые (щука, рыба-нож). Так рыбки
    // стали разноцветными, а не только одноцветными (заказчик, v1.3.12)
    if (v.pattern === 'stripes' || v.pattern === 'spots') {
      const accent = v.accent || 'rgba(0,0,0,0.28)';
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, body.rx, body.ry, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = accent;
      if (v.pattern === 'stripes') {
        for (let i = 0; i < 3; i++) {
          const sx = -body.rx * 0.45 + i * body.rx * 0.42;
          roundRect(ctx, sx, -body.ry, Math.max(2.2, body.rx * 0.13), body.ry * 2, 2);
          ctx.fill();
        }
      } else {
        for (let i = 0; i < 5; i++) {
          const a = i * 1.7;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * body.rx * 0.55, Math.sin(a) * body.ry * 0.55,
            Math.max(1.4, body.ry * 0.22), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Спинной плавник: парус (высокий треугольник), шипастый (два-три зубца) и
    // низкий. Форма меняется от вида к виду — плавники действительно разные
    ctx.fillStyle = d.color || '#8ab4ff';
    if (v.fin === 'sail') {
      ctx.beginPath();
      ctx.moveTo(-body.rx * 0.12, -body.ry * 0.84);
      ctx.lineTo(body.rx * 0.1, -body.ry * 1.7);
      ctx.lineTo(body.rx * 0.34, -body.ry * 0.8);
      ctx.closePath();
      ctx.fill();
    } else if (v.fin === 'spiky') {
      for (let i = 0; i < 3; i++) {
        const fx = -body.rx * 0.3 + i * body.rx * 0.3;
        ctx.beginPath();
        ctx.moveTo(fx, -body.ry * 0.9);
        ctx.lineTo(fx + body.rx * 0.12, -body.ry * 1.5);
        ctx.lineTo(fx + body.rx * 0.24, -body.ry * 0.86);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -body.ry * 0.92, body.rx * 0.3, body.ry * 0.22, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Брюшной плавник — есть у половины видов: маленький треугольник снизу
    if ((v.fin !== 'low') && v.pattern !== 'spots') {
      ctx.fillStyle = d.belly || '#ffffff';
      ctx.globalAlpha = (s.alpha === undefined ? 1 : s.alpha) * 0.85;
      ctx.beginPath();
      ctx.moveTo(body.rx * 0.1, body.ry * 0.8);
      ctx.lineTo(body.rx * 0.02, body.ry * 1.45);
      ctx.lineTo(body.rx * 0.3, body.ry * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = (s.alpha === undefined ? 1 : s.alpha);
    }

    // глаз
    ctx.fillStyle = '#0e1a2b';
    ctx.beginPath(); ctx.arc(body.rx * 0.6, -body.ry * 0.18, Math.max(1.4, hgt * 0.12), 0, Math.PI * 2); ctx.fill();

    // Редкую рыбку видно издалека: у очень редких и легендарных блестит чешуя
    // (v1.3.12). Искорка только у рыбок — большие обитатели (черепаха, акула) не
    // ловятся и веса у них нет, поэтому редкость к ним не применяем.
    const rar = (s.kind === 'fish' && typeof fishRarityOf === 'function') ? fishRarityOf(d) : null;
    if (rar && (rar.id === 'epic' || rar.id === 'legendary')) {
      const tw = 0.45 + Math.sin(this.time * 0.005 + s.x * 0.12) * 0.4;
      ctx.globalAlpha = Math.max(0.15, Math.min(1, tw));
      ctx.fillStyle = rar.color;
      ctx.beginPath();
      ctx.arc(L * 0.42, -hgt * 0.72, Math.max(2, base * 0.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-L * 0.3, -hgt * 0.5, Math.max(1.4, base * 0.06), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (s.alpha === undefined ? 1 : s.alpha);
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(L * 0.32, -hgt * 0.14, Math.max(0.7, hgt * 0.05), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Большие обитатели. Голова смотрит вправо, ctx.scale разворачивает по ходу.
  drawSeaFriend(ctx, s) {
    const d = s.data || {}, k = d.kind || 'turtle';
    const b = Math.min(this.game.width * 0.055, 30) * (d.size || 1);
    const t = this.time * 0.003;
    const eye = (x, y, r) => {
      ctx.fillStyle = '#f4f7fb';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.15, r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14202b';
      ctx.beginPath(); ctx.arc(x + r * 0.25, y, r * 0.45, 0, Math.PI * 2); ctx.fill();
    };
    ctx.save();
    ctx.globalAlpha = (s.alpha === undefined ? 0.95 : s.alpha);
    ctx.translate(s.x, s.y);
    ctx.scale(s.dir || 1, 1);

    if (k === 'shark') {
      ctx.fillStyle = '#7d8b98';
      ctx.beginPath();
      ctx.moveTo(b * 1.35, 0);
      ctx.quadraticCurveTo(b * 0.9, -b * 0.28, b * 0.2, -b * 0.32);
      ctx.quadraticCurveTo(-b * 0.55, -b * 0.28, -b * 0.95, -b * 0.08);
      ctx.lineTo(-b * 1.35, -b * 0.38);
      ctx.lineTo(-b * 1.05, 0);
      ctx.lineTo(-b * 1.35, b * 0.28);
      ctx.quadraticCurveTo(-b * 0.4, b * 0.22, b * 0.3, b * 0.16);
      ctx.quadraticCurveTo(b * 1.05, b * 0.1, b * 1.35, 0);
      ctx.fill();
      ctx.fillStyle = '#e7eef3';
      ctx.beginPath();
      ctx.moveTo(b * 1.05, b * 0.04);
      ctx.quadraticCurveTo(b * 0.2, b * 0.22, -b * 0.7, b * 0.08);
      ctx.quadraticCurveTo(b * 0.2, b * 0.02, b * 1.05, b * 0.04);
      ctx.fill();
      ctx.fillStyle = '#6a7886';
      ctx.beginPath();
      ctx.moveTo(b * 0.15, -b * 0.28); ctx.quadraticCurveTo(b * 0.32, -b * 0.85, b * 0.55, -b * 0.22); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(b * 0.35, b * 0.12); ctx.quadraticCurveTo(b * 0.55, b * 0.48, b * 0.15, b * 0.16); ctx.fill();
      eye(b * 0.85, -b * 0.08, b * 0.07);
    } else if (k === 'dolphin') {
      // Дельфин. Раньше делил силуэт с акулой — острый нос и плавник, поэтому их
      // путали. Теперь у дельфина длинный «клюв» (рострум), округлый лоб (мелон),
      // серповидный спинной плавник, загнутый назад, и улыбка.
      ctx.fillStyle = '#6f97b8';
      ctx.beginPath();
      ctx.moveTo(b * 1.5, b * 0.04);
      ctx.quadraticCurveTo(b * 1.28, b * 0.0, b * 1.08, -b * 0.04);
      ctx.quadraticCurveTo(b * 0.95, -b * 0.3, b * 0.45, -b * 0.34);
      ctx.quadraticCurveTo(-b * 0.15, -b * 0.27, -b * 0.6, -b * 0.2);
      ctx.quadraticCurveTo(-b * 0.95, -b * 0.15, -b * 1.08, -b * 0.05);
      ctx.lineTo(-b * 1.38, -b * 0.34);
      ctx.lineTo(-b * 1.12, 0);
      ctx.lineTo(-b * 1.38, b * 0.24);
      ctx.quadraticCurveTo(-b * 0.95, b * 0.16, -b * 0.4, b * 0.24);
      ctx.quadraticCurveTo(b * 0.1, b * 0.22, b * 0.7, b * 0.14);
      ctx.quadraticCurveTo(b * 1.25, b * 0.08, b * 1.5, b * 0.04);
      ctx.fill();
      // серповидный спинной плавник — загнут назад, в отличие от акульего
      ctx.beginPath();
      ctx.moveTo(b * 0.35, -b * 0.28);
      ctx.quadraticCurveTo(b * 0.2, -b * 0.85, b * 0.0, -b * 0.55);
      ctx.quadraticCurveTo(-b * 0.2, -b * 0.4, -b * 0.3, -b * 0.22);
      ctx.closePath();
      ctx.fill();
      // грудной плавник
      ctx.fillStyle = '#557d9c';
      ctx.beginPath();
      ctx.moveTo(b * 0.5, b * 0.06);
      ctx.quadraticCurveTo(b * 0.38, b * 0.4, b * 0.12, b * 0.3);
      ctx.quadraticCurveTo(b * 0.32, b * 0.18, b * 0.5, b * 0.06);
      ctx.fill();
      // светлое брюхо
      ctx.fillStyle = '#d5e6f2';
      ctx.beginPath();
      ctx.ellipse(b * 0.3, b * 0.12, b * 0.7, b * 0.1, 0.02, 0, Math.PI);
      ctx.fill();
      // улыбка на клюве
      ctx.strokeStyle = '#3f5f78';
      ctx.lineWidth = Math.max(1.2, b * 0.04);
      ctx.beginPath();
      ctx.moveTo(b * 1.42, b * 0.06);
      ctx.quadraticCurveTo(b * 1.2, b * 0.11, b * 1.0, b * 0.05);
      ctx.stroke();
      eye(b * 0.82, -b * 0.1, b * 0.055);
    } else if (k === 'orca') {
      ctx.fillStyle = '#1b2430';
      ctx.beginPath();
      ctx.moveTo(b * 1.25, b * 0.02);
      ctx.quadraticCurveTo(b * 0.7, -b * 0.34, 0, -b * 0.28);
      ctx.quadraticCurveTo(-b * 0.7, -b * 0.16, -b * 1.05, -b * 0.02);
      ctx.quadraticCurveTo(-b * 1.35, -b * 0.28, -b * 1.15, 0);
      ctx.quadraticCurveTo(-b * 1.35, b * 0.26, -b * 1.0, b * 0.04);
      ctx.quadraticCurveTo(-b * 0.4, b * 0.22, b * 0.45, b * 0.16);
      ctx.quadraticCurveTo(b * 1.05, b * 0.12, b * 1.25, b * 0.02);
      ctx.fill();
      ctx.fillStyle = '#f4f7fb';
      ctx.beginPath();
      ctx.ellipse(b * 0.15, b * 0.08, b * 0.55, b * 0.1, 0.05, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(b * 0.55, -b * 0.08, b * 0.16, b * 0.1, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b2430';
      ctx.beginPath();
      ctx.moveTo(b * 0.05, -b * 0.22); ctx.quadraticCurveTo(b * 0.18, -b * 0.62, b * 0.38, -b * 0.16); ctx.fill();
      eye(b * 0.72, -b * 0.08, b * 0.055);
    } else if (k === 'whale') {
      // Кит: тупая голова, фонтан, широкий горизонтальный хвост, горб сзади.
      // Острого рыла и высокого плавника посередине нет — так рисуется акула.
      ctx.fillStyle = '#5c7d94';
      ctx.beginPath();
      ctx.ellipse(-b * 0.05, 0, b * 1.05, b * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(b * 0.82, -b * 0.02, b * 0.46, b * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d5e4ec';
      ctx.beginPath();
      ctx.ellipse(b * 0.15, b * 0.14, b * 0.85, b * 0.14, 0.04, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,96,112,0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(b * (0.7 - i * 0.16), b * 0.05);
        ctx.quadraticCurveTo(b * (0.62 - i * 0.16), b * 0.16, b * (0.74 - i * 0.16), b * 0.22);
        ctx.stroke();
      }
      ctx.fillStyle = '#4a6a80';
      ctx.beginPath();
      ctx.moveTo(b * 0.35, b * 0.12);
      ctx.quadraticCurveTo(b * 0.05, b * 0.62, -b * 0.28, b * 0.4);
      ctx.quadraticCurveTo(b * 0.12, b * 0.2, b * 0.35, b * 0.12);
      ctx.fill();
      ctx.fillStyle = '#4e7088';
      ctx.beginPath();
      ctx.moveTo(-b * 1.05, 0);
      ctx.quadraticCurveTo(-b * 1.45, -b * 0.08, -b * 1.9, -b * 0.42);
      ctx.quadraticCurveTo(-b * 1.4, -b * 0.02, -b * 1.05, 0);
      ctx.quadraticCurveTo(-b * 1.4, b * 0.02, -b * 1.9, b * 0.42);
      ctx.quadraticCurveTo(-b * 1.45, b * 0.08, -b * 1.05, 0);
      ctx.fill();
      ctx.fillStyle = '#5c7d94';
      ctx.beginPath();
      ctx.moveTo(-b * 0.55, -b * 0.32);
      ctx.quadraticCurveTo(-b * 0.46, -b * 0.46, -b * 0.3, -b * 0.3);
      ctx.fill();
      ctx.fillStyle = 'rgba(226,240,246,0.9)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(b * (0.48 + i * 0.035), -b * (0.4 + i * 0.1), Math.max(1.2, b * 0.035), 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b * (0.68 + i * 0.04), -b * (0.38 + i * 0.1), Math.max(1.2, b * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }
      eye(b * 0.95, -b * 0.04, b * 0.045);
    } else if (k === 'ray') {
      const flap = Math.sin(t * 2) * 0.15;
      ctx.fillStyle = '#8a7568';
      ctx.beginPath();
      ctx.moveTo(b * 0.55, 0);
      ctx.quadraticCurveTo(b * 0.15, -b * 0.15, -b * 0.15, -b * 0.95 - flap * b);
      ctx.quadraticCurveTo(-b * 0.45, -b * 0.2, -b * 0.35, 0);
      ctx.quadraticCurveTo(-b * 0.45, b * 0.2, -b * 0.15, b * 0.95 + flap * b);
      ctx.quadraticCurveTo(b * 0.15, b * 0.15, b * 0.55, 0);
      ctx.fill();
      ctx.fillStyle = '#d9cfc4';
      ctx.beginPath();
      ctx.ellipse(b * 0.05, 0, b * 0.22, b * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6d5c52';
      ctx.lineWidth = Math.max(1.5, b * 0.04);
      ctx.beginPath();
      ctx.moveTo(-b * 0.35, 0);
      ctx.quadraticCurveTo(-b * 0.9, Math.sin(t) * b * 0.15, -b * 1.35, b * 0.05);
      ctx.stroke();
      eye(b * 0.18, -b * 0.08, b * 0.045);
      eye(b * 0.18, b * 0.08, b * 0.045);
    } else if (k === 'seal') {
      ctx.fillStyle = '#8d7464';
      ctx.beginPath();
      ctx.ellipse(0, 0, b * 0.95, b * 0.38, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(b * 0.85, -b * 0.02, b * 0.32, b * 0.26, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c4a48e';
      ctx.beginPath();
      ctx.ellipse(b * 0.1, b * 0.08, b * 0.4, b * 0.14, 0, 0, Math.PI);
      ctx.fill();
      const paw = Math.sin(t * 3) * 0.4;
      ctx.fillStyle = '#8d7464';
      ctx.beginPath();
      ctx.ellipse(b * 0.35, b * 0.28, b * 0.22, b * 0.1, paw, 0, Math.PI * 2);
      ctx.ellipse(-b * 0.15, b * 0.26, b * 0.18, b * 0.08, -paw, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-b * 0.85, b * 0.04, b * 0.22, b * 0.1, 0.6, 0, Math.PI * 2);
      ctx.fill();
      eye(b * 1.0, -b * 0.06, b * 0.05);
      ctx.strokeStyle = '#5c463c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b * 1.12, 0); ctx.lineTo(b * 1.28, -0.04 * b);
      ctx.moveTo(b * 1.12, b * 0.04); ctx.lineTo(b * 1.26, b * 0.06);
      ctx.stroke();
    } else if (k === 'octopus') {
      ctx.fillStyle = '#d36b86';
      ctx.beginPath();
      ctx.ellipse(0, -b * 0.25, b * 0.55, b * 0.42, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0b7c4';
      ctx.beginPath();
      ctx.ellipse(0, -b * 0.18, b * 0.28, b * 0.2, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#c45b78';
      ctx.lineWidth = Math.max(2.4, b * 0.09);
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const x0 = -b * 0.48 + i * b * 0.14;
        const wave = Math.sin(t * 2 + i) * b * 0.18;
        ctx.beginPath();
        ctx.moveTo(x0, -b * 0.05);
        ctx.bezierCurveTo(x0 + wave, b * 0.25, x0 - wave, b * 0.55, x0 + wave * 0.4, b * 0.95);
        ctx.stroke();
      }
      eye(-b * 0.16, -b * 0.32, b * 0.07);
      eye(b * 0.16, -b * 0.32, b * 0.07);
    } else if (k === 'squid') {
      ctx.fillStyle = '#e08b86';
      ctx.beginPath();
      ctx.moveTo(-b * 0.85, 0);
      ctx.quadraticCurveTo(-b * 0.2, -b * 0.45, b * 0.45, -b * 0.12);
      ctx.quadraticCurveTo(b * 0.15, 0, b * 0.45, b * 0.12);
      ctx.quadraticCurveTo(-b * 0.2, b * 0.45, -b * 0.85, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-b * 0.55, -b * 0.12);
      ctx.quadraticCurveTo(-b * 1.15, -b * 0.45, -b * 0.7, 0);
      ctx.quadraticCurveTo(-b * 1.15, b * 0.4, -b * 0.55, b * 0.1);
      ctx.fill();
      ctx.strokeStyle = '#d07278';
      ctx.lineWidth = Math.max(1.6, b * 0.05);
      for (let i = 0; i < 6; i++) {
        const y0 = -b * 0.16 + i * b * 0.06;
        ctx.beginPath();
        ctx.moveTo(b * 0.35, y0);
        ctx.quadraticCurveTo(b * 0.8, y0 + Math.sin(t + i) * b * 0.08, b * 1.15, y0);
        ctx.stroke();
      }
      eye(b * 0.15, -b * 0.08, b * 0.06);
    } else if (k === 'jellyfish') {
      ctx.fillStyle = 'rgba(186, 226, 245, 0.85)';
      ctx.beginPath();
      ctx.ellipse(0, -b * 0.15, b * 0.7, b * 0.42, 0, Math.PI, Math.PI * 2);
      ctx.quadraticCurveTo(b * 0.2, b * 0.05, 0, b * 0.02);
      ctx.quadraticCurveTo(-b * 0.2, b * 0.05, -b * 0.7, -b * 0.15);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.4;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * b * 0.16, 0);
        ctx.quadraticCurveTo(i * b * 0.2 + Math.sin(t * 2 + i) * b * 0.1, b * 0.4, i * b * 0.12, b * 0.85);
        ctx.stroke();
      }
    } else if (k === 'turtle') {
      const paddle = Math.sin(t * 2) * 0.5;
      ctx.fillStyle = '#6e8f55';
      ctx.beginPath(); ctx.ellipse(b * 0.85, 0, b * 0.28, b * 0.18, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(b * 0.25, b * 0.15); ctx.rotate(paddle);
      ctx.beginPath(); ctx.ellipse(b * 0.28, 0, b * 0.32, b * 0.1, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(-b * 0.2, b * 0.12); ctx.rotate(-paddle);
      ctx.beginPath(); ctx.ellipse(-b * 0.22, 0, b * 0.26, b * 0.09, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#8d6b45';
      ctx.beginPath(); ctx.ellipse(0, 0, b * 0.72, b * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6a4e30';
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(0, 0, b * 0.38, b * 0.26, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-b * 0.15, -b * 0.42); ctx.lineTo(b * 0.1, 0); ctx.lineTo(-b * 0.1, b * 0.42); ctx.stroke();
      eye(b * 0.95, -b * 0.04, b * 0.045);
    } else if (k === 'crab') {
      ctx.fillStyle = '#d4654e';
      ctx.beginPath(); ctx.ellipse(0, b * 0.05, b * 0.55, b * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d4654e';
      ctx.lineWidth = Math.max(2, b * 0.08);
      for (let i = 0; i < 3; i++) {
        const y0 = -b * 0.05 + i * b * 0.14;
        ctx.beginPath();
        ctx.moveTo(-b * 0.4, y0);
        ctx.quadraticCurveTo(-b * 0.7, y0 + b * 0.12, -b * 0.95, y0 + b * 0.05);
        ctx.moveTo(b * 0.4, y0);
        ctx.quadraticCurveTo(b * 0.7, y0 + b * 0.12, b * 0.95, y0 + b * 0.05);
        ctx.stroke();
      }
      const claw = (sx) => {
        ctx.beginPath();
        ctx.moveTo(sx * b * 0.4, -b * 0.1);
        ctx.quadraticCurveTo(sx * b * 0.85, -b * 0.45, sx * b * 0.7, -b * 0.05);
        ctx.quadraticCurveTo(sx * b * 0.95, -b * 0.2, sx * b * 0.55, b * 0.05);
        ctx.fill();
      };
      claw(-1); claw(1);
      ctx.fillStyle = '#d4654e';
      ctx.beginPath(); ctx.arc(-b * 0.12, -b * 0.28, b * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(b * 0.12, -b * 0.28, b * 0.06, 0, Math.PI * 2); ctx.fill();
      eye(-b * 0.12, -b * 0.36, b * 0.045);
      eye(b * 0.12, -b * 0.36, b * 0.045);
    } else if (k === 'starfish') {
      ctx.fillStyle = '#e08a3c';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        const tip = b * (0.7 + Math.sin(t + i) * 0.04);
        ctx.lineTo(Math.cos(a) * tip, Math.sin(a) * tip);
        const a2 = a + Math.PI / 5;
        ctx.quadraticCurveTo(Math.cos(a2) * b * 0.22, Math.sin(a2) * b * 0.22, Math.cos(a + Math.PI * 2 / 5) * tip, Math.sin(a + Math.PI * 2 / 5) * tip);
      }
      ctx.fill();
      ctx.fillStyle = '#f2c08a';
      ctx.beginPath(); ctx.arc(0, 0, b * 0.16, 0, Math.PI * 2); ctx.fill();
    } else if (k === 'seahorse') {
      ctx.strokeStyle = '#e0b04a';
      ctx.lineWidth = Math.max(4, b * 0.16);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b * 0.1, -b * 0.7);
      ctx.bezierCurveTo(b * 0.7, -b * 0.2, -b * 0.2, b * 0.1, b * 0.25, b * 0.55);
      ctx.quadraticCurveTo(b * 0.45, b * 0.85, b * 0.05, b * 0.75);
      ctx.stroke();
      ctx.fillStyle = '#e0b04a';
      ctx.beginPath(); ctx.ellipse(b * 0.05, -b * 0.78, b * 0.22, b * 0.16, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-b * 0.1, -b * 0.78); ctx.quadraticCurveTo(-b * 0.55, -b * 0.7, -b * 0.15, -b * 0.66); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(b * 0.15, -b * 0.35);
      ctx.quadraticCurveTo(b * 0.55, -b * 0.15 + Math.sin(t * 4) * b * 0.08, b * 0.1, b * 0.05);
      ctx.fill();
      eye(-b * 0.02, -b * 0.82, b * 0.04);
    } else if (k === 'swordfish') {
      ctx.fillStyle = '#3c5d86';
      ctx.beginPath();
      ctx.moveTo(b * 0.9, 0);
      ctx.quadraticCurveTo(b * 0.2, -b * 0.28, -b * 0.7, -b * 0.12);
      ctx.quadraticCurveTo(-b * 1.15, -b * 0.28, -b * 0.95, 0);
      ctx.quadraticCurveTo(-b * 1.15, b * 0.22, -b * 0.7, b * 0.1);
      ctx.quadraticCurveTo(b * 0.2, b * 0.22, b * 0.9, 0);
      ctx.fill();
      ctx.strokeStyle = '#dbe7f2';
      ctx.lineWidth = Math.max(2, b * 0.07);
      ctx.beginPath(); ctx.moveTo(b * 0.85, 0); ctx.lineTo(b * 1.7, -b * 0.04); ctx.stroke();
      ctx.fillStyle = '#3c5d86';
      ctx.beginPath();
      ctx.moveTo(-b * 0.05, -b * 0.16); ctx.quadraticCurveTo(b * 0.15, -b * 0.85, b * 0.4, -b * 0.1); ctx.fill();
      eye(b * 0.55, -b * 0.08, b * 0.05);
    } else if (k === 'sunfish') {
      // Круглый диск на боку: высокие плавники сверху и снизу, сзади волнистая бахрома, без хвоста.
      ctx.fillStyle = '#d7e1e8';
      ctx.beginPath();
      ctx.moveTo(b * 0.82, 0);
      ctx.quadraticCurveTo(b * 0.72, -b * 0.5, b * 0.2, -b * 0.7);
      ctx.quadraticCurveTo(b * 0.42, -b * 1.22, -b * 0.02, -b * 0.78);
      ctx.quadraticCurveTo(-b * 0.5, -b * 0.68, -b * 0.58, -b * 0.22);
      ctx.quadraticCurveTo(-b * 0.7, 0, -b * 0.58, b * 0.22);
      ctx.quadraticCurveTo(-b * 0.5, b * 0.68, -b * 0.02, b * 0.78);
      ctx.quadraticCurveTo(b * 0.42, b * 1.22, b * 0.2, b * 0.7);
      ctx.quadraticCurveTo(b * 0.72, b * 0.5, b * 0.82, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7c8d9b';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#f4f7fa';
      ctx.beginPath();
      ctx.ellipse(b * 0.12, b * 0.1, b * 0.4, b * 0.32, 0.15, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#8ea0ae';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-b * 0.56, -b * 0.2);
      for (let i = 1; i <= 5; i++) {
        const yy = -b * 0.2 + i * b * 0.08;
        ctx.quadraticCurveTo(-b * 0.92, yy - b * 0.04, -b * 0.56, yy);
      }
      ctx.stroke();
      eye(b * 0.46, -b * 0.14, b * 0.07);
      ctx.strokeStyle = '#5c6c78';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(b * 0.74, 0.02 * b, b * 0.07, 0.5, Math.PI - 0.3);
      ctx.stroke();
    } else if (k === 'moray') {
      ctx.strokeStyle = '#6f8f5a';
      ctx.lineWidth = Math.max(7, b * 0.28);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-b * 1.2, 0);
      for (let i = 1; i <= 7; i++) {
        ctx.quadraticCurveTo(-b * 1.2 + i * b * 0.32, Math.sin(t * 2 + i) * b * 0.28, -b * 1.2 + (i + 0.5) * b * 0.32, Math.sin(t * 2 + i + 0.5) * b * 0.18);
      }
      ctx.stroke();
      const hx = b * 1.15, hy = Math.sin(t * 2 + 6) * b * 0.15;
      ctx.fillStyle = '#7ea36a';
      ctx.beginPath(); ctx.ellipse(hx, hy, b * 0.28, b * 0.16, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a120e';
      ctx.beginPath(); ctx.ellipse(hx + b * 0.08, hy + b * 0.02, b * 0.08, b * 0.04, 0, 0, Math.PI * 2); ctx.fill();
      eye(hx + b * 0.05, hy - b * 0.06, b * 0.04);
    } else if (k === 'urchin') {
      ctx.fillStyle = '#6b3a6a';
      ctx.beginPath(); ctx.arc(0, 0, b * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a1c38';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 14; i++) {
        const a = i * Math.PI * 2 / 14 + Math.sin(t + i) * 0.05;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * b * 0.3, Math.sin(a) * b * 0.3);
        ctx.lineTo(Math.cos(a) * b * 0.85, Math.sin(a) * b * 0.85);
        ctx.stroke();
      }
    } else if (k === 'sponge') {
      ctx.fillStyle = '#e0a050';
      ctx.beginPath();
      ctx.moveTo(-b * 0.45, b * 0.4);
      ctx.quadraticCurveTo(-b * 0.7, -b * 0.2, -b * 0.2, -b * 0.55);
      ctx.quadraticCurveTo(b * 0.15, -b * 0.9, b * 0.45, -b * 0.35);
      ctx.quadraticCurveTo(b * 0.7, b * 0.15, b * 0.35, b * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c47e32';
      [[-0.1, -0.1], [0.18, 0.05], [0.02, 0.22]].forEach(h => {
        ctx.beginPath(); ctx.arc(b * h[0], b * h[1], b * 0.1, 0, Math.PI * 2); ctx.fill();
      });
    } else if (k === 'cucumber') {
      ctx.fillStyle = '#6a8f4a';
      ctx.beginPath();
      ctx.ellipse(0, b * 0.05, b * 1.05, b * 0.28, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4d6b34';
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * b * 0.28, -b * 0.16);
        ctx.quadraticCurveTo(i * b * 0.28, b * 0.05, i * b * 0.22, b * 0.22);
        ctx.stroke();
      }
      ctx.fillStyle = '#3d5528';
      ctx.beginPath(); ctx.ellipse(b * 0.95, 0, b * 0.08, b * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (k === 'shrimp') {
      const curl = Math.sin(t * 3) * 0.15;
      ctx.strokeStyle = '#f0a0a8';
      ctx.lineWidth = Math.max(3, b * 0.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b * 0.7, -b * 0.05);
      ctx.quadraticCurveTo(b * 0.2, -b * 0.35, -b * 0.15, 0);
      ctx.quadraticCurveTo(-b * 0.45, b * 0.35 + curl * b, -b * 0.85, b * 0.05);
      ctx.stroke();
      ctx.fillStyle = '#f4c2c4';
      ctx.beginPath(); ctx.ellipse(b * 0.55, -b * 0.08, b * 0.22, b * 0.12, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e08088';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(b * 0.7, -b * 0.1); ctx.lineTo(b * 1.15, -b * 0.28); ctx.moveTo(b * 0.68, 0); ctx.lineTo(b * 1.1, -b * 0.02); ctx.stroke();
      eye(b * 0.62, -b * 0.12, b * 0.035);
    } else if (k === 'clam') {
      ctx.fillStyle = '#d9c7a2';
      ctx.beginPath();
      ctx.ellipse(0, b * 0.06, b * 0.55, b * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3e6c8';
      ctx.beginPath();
      ctx.ellipse(0, -b * 0.04, b * 0.5, b * 0.22, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a89068';
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * b * 0.14, -b * 0.02);
        ctx.quadraticCurveTo(i * b * 0.1, b * 0.12, i * b * 0.16, b * 0.28);
        ctx.stroke();
      }
    } else if (k === 'lobster') {
      ctx.fillStyle = '#c4492a';
      ctx.beginPath();
      ctx.ellipse(b * 0.15, 0, b * 0.55, b * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); ctx.ellipse(-b * 0.45, 0, b * 0.22, b * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c4492a';
      ctx.lineWidth = Math.max(2, b * 0.06);
      ctx.beginPath();
      ctx.moveTo(-b * 0.55, -b * 0.08); ctx.quadraticCurveTo(-b * 0.9, -b * 0.35, -b * 1.15, -b * 0.15);
      ctx.moveTo(-b * 0.55, b * 0.08); ctx.quadraticCurveTo(-b * 0.9, b * 0.35, -b * 1.15, b * 0.15);
      ctx.stroke();
      ctx.fillStyle = '#a33a22';
      ctx.beginPath();
      ctx.moveTo(b * 0.45, -b * 0.12); ctx.lineTo(b * 0.85, -b * 0.42); ctx.lineTo(b * 0.95, -b * 0.18); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(b * 0.45, b * 0.12); ctx.lineTo(b * 0.9, b * 0.4); ctx.lineTo(b * 0.7, b * 0.12); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#9a321c';
        ctx.fillRect(-b * 0.15 + i * b * 0.16, -b * 0.16, b * 0.05, b * 0.32);
      }
      eye(-b * 0.5, -b * 0.06, b * 0.04);
    } else if (k === 'dugong') {
      ctx.fillStyle = '#8d93a0';
      ctx.beginPath();
      ctx.ellipse(-b * 0.05, 0, b * 0.95, b * 0.32, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); ctx.ellipse(b * 0.85, b * 0.06, b * 0.28, b * 0.2, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6e7582';
      ctx.beginPath();
      ctx.moveTo(-b * 0.85, 0); ctx.quadraticCurveTo(-b * 1.25, -b * 0.28, -b * 1.05, 0);
      ctx.quadraticCurveTo(-b * 1.25, b * 0.28, -b * 0.85, 0); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(b * 0.15, b * 0.22, b * 0.28, b * 0.1, 0.4, 0, Math.PI * 2); ctx.fill();
      eye(b * 0.95, -b * 0.02, b * 0.04);
    } else if (k === 'walrus') {
      ctx.fillStyle = '#a56a48';
      ctx.beginPath(); ctx.ellipse(0, 0, b * 0.9, b * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(b * 0.78, -b * 0.02, b * 0.32, b * 0.26, 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2e2c8';
      ctx.beginPath(); ctx.ellipse(b * 1.02, b * 0.08, b * 0.16, b * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f4f0e4';
      ctx.lineWidth = Math.max(2, b * 0.06);
      ctx.beginPath();
      ctx.moveTo(b * 0.95, b * 0.12); ctx.quadraticCurveTo(b * 1.05, b * 0.45, b * 0.9, b * 0.55);
      ctx.moveTo(b * 1.05, b * 0.12); ctx.quadraticCurveTo(b * 1.18, b * 0.42, b * 1.02, b * 0.52);
      ctx.stroke();
      eye(b * 0.85, -b * 0.1, b * 0.045);
    } else if (k === 'nerpa') {
      ctx.fillStyle = '#c5ced6';
      ctx.beginPath(); ctx.ellipse(0, 0, b * 0.72, b * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(b * 0.62, -b * 0.02, b * 0.22, b * 0.18, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8ea0ae';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(-b * 0.35 + i * b * 0.18, (i % 2 ? -1 : 1) * b * 0.08, b * 0.06, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#9aabba';
      ctx.beginPath();
      ctx.moveTo(-b * 0.6, b * 0.05); ctx.quadraticCurveTo(-b * 0.95, b * 0.2, -b * 0.7, b * 0.22); ctx.fill();
      eye(b * 0.72, -b * 0.06, b * 0.04);
    } else if (k === 'dancer') {
      const wave = Math.sin(t * 3) * b * 0.08;
      ctx.fillStyle = '#e23b3b';
      ctx.beginPath();
      ctx.moveTo(b * 0.55, 0);
      ctx.quadraticCurveTo(b * 0.1, -b * 0.15, -b * 0.2, -b * 0.05);
      ctx.quadraticCurveTo(-b * 0.55, b * 0.05, -b * 0.2, b * 0.08);
      ctx.quadraticCurveTo(b * 0.1, b * 0.16, b * 0.55, 0);
      ctx.fill();
      ctx.fillStyle = '#ff6a3d';
      ctx.beginPath();
      ctx.moveTo(-b * 0.05, -b * 0.08);
      ctx.quadraticCurveTo(-b * 0.35, -b * 0.85 + wave, b * 0.15, -b * 0.35);
      ctx.quadraticCurveTo(b * 0.45, -b * 0.15, -b * 0.05, -b * 0.08);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-b * 0.05, b * 0.08);
      ctx.quadraticCurveTo(-b * 0.4, b * 0.9 - wave, b * 0.2, b * 0.32);
      ctx.quadraticCurveTo(b * 0.4, b * 0.12, -b * 0.05, b * 0.08);
      ctx.fill();
      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-b * 0.2, -b * 0.55); ctx.quadraticCurveTo(0, -b * 0.35, b * 0.05, -b * 0.2); ctx.stroke();
      eye(b * 0.32, -b * 0.04, b * 0.03);
    } else if (k === 'narwhal') {
      // Нарвал: округлая голова, пятна разного размера и спиральный бивень.
      // Ряда одинаковых кругов нет — так получались иллюминаторы.
      ctx.fillStyle = '#e4ebf2';
      ctx.beginPath();
      ctx.ellipse(-b * 0.08, 0, b * 0.92, b * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(b * 0.7, -b * 0.04, b * 0.34, b * 0.24, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7f8fa0';
      [[-0.55, 0.06, 0.1, 0.06], [-0.22, -0.08, 0.06, 0.09], [0.02, 0.1, 0.12, 0.07],
        [0.28, -0.02, 0.05, 0.08], [0.42, 0.1, 0.07, 0.04]].forEach(p => {
        ctx.beginPath();
        ctx.ellipse(b * p[0], b * p[1], b * p[2], b * p[3], 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#d5dde6';
      ctx.beginPath();
      ctx.moveTo(-b * 0.78, 0);
      ctx.quadraticCurveTo(-b * 1.15, -b * 0.2, -b * 1.38, -b * 0.1);
      ctx.quadraticCurveTo(-b * 1.05, 0, -b * 0.78, 0);
      ctx.quadraticCurveTo(-b * 1.15, b * 0.2, -b * 1.38, b * 0.1);
      ctx.quadraticCurveTo(-b * 1.05, 0, -b * 0.78, 0);
      ctx.fill();
      ctx.strokeStyle = '#c5d0da';
      ctx.lineWidth = Math.max(1.4, b * 0.04);
      ctx.beginPath();
      ctx.moveTo(-b * 0.15, -b * 0.26);
      ctx.quadraticCurveTo(b * 0.15, -b * 0.34, b * 0.4, -b * 0.2);
      ctx.stroke();
      ctx.strokeStyle = '#f6f0dc';
      ctx.lineWidth = Math.max(2.4, b * 0.055);
      ctx.beginPath();
      ctx.moveTo(b * 0.98, -b * 0.02);
      ctx.lineTo(b * 1.85, -b * 0.08);
      ctx.stroke();
      ctx.lineWidth = Math.max(1.2, b * 0.03);
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(b * (1.08 + i * 0.1), -b * 0.03 - i * b * 0.008, b * 0.045, 0.4, Math.PI * 1.15);
        ctx.stroke();
      }
      eye(b * 0.78, -b * 0.08, b * 0.04);
    } else if (k === 'manta') {
      const flap = Math.sin(t * 2) * b * 0.12;
      ctx.fillStyle = '#2c3d4f';
      ctx.beginPath();
      ctx.moveTo(b * 0.35, 0);
      ctx.quadraticCurveTo(b * 0.1, -b * 0.15, -b * 0.15, -b * 1.05 - flap);
      ctx.quadraticCurveTo(-b * 0.55, -b * 0.2, -b * 0.35, 0);
      ctx.quadraticCurveTo(-b * 0.55, b * 0.2, -b * 0.15, b * 1.05 + flap);
      ctx.quadraticCurveTo(b * 0.1, b * 0.15, b * 0.35, 0);
      ctx.fill();
      ctx.fillStyle = '#f2f5f8';
      ctx.beginPath(); ctx.ellipse(-b * 0.05, 0, b * 0.16, b * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1b2836';
      ctx.lineWidth = Math.max(1.6, b * 0.04);
      ctx.beginPath();
      ctx.moveTo(-b * 0.3, -b * 0.08); ctx.quadraticCurveTo(-b * 0.7, -b * 0.2, -b * 1.15, 0);
      ctx.moveTo(-b * 0.3, b * 0.08); ctx.quadraticCurveTo(-b * 0.7, b * 0.2, -b * 1.15, 0);
      ctx.stroke();
      ctx.fillStyle = '#d7e4ea';
      ctx.beginPath(); ctx.ellipse(b * 0.22, -b * 0.1, b * 0.1, b * 0.08, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(b * 0.22, b * 0.1, b * 0.1, b * 0.08, 0.6, 0, Math.PI * 2); ctx.fill();
      eye(b * 0.12, -b * 0.16, b * 0.035);
      eye(b * 0.12, b * 0.16, b * 0.035);
    } else {
      ctx.fillStyle = '#e0b04a';
      ctx.beginPath(); ctx.ellipse(0, 0, b * 0.8, b * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      eye(b * 0.4, -b * 0.05, b * 0.05);
    }
    ctx.restore();
  }

  // ---------- 4. У окна ----------
  // Время суток и сезон — из часов устройства. Погода меняется, пока сидишь.
  windowClock() {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const month = now.getMonth();
    let day;
    if (hour >= 5 && hour < 9) day = 'morning';
    else if (hour >= 9 && hour < 17) day = 'day';
    else if (hour >= 17 && hour < 21) day = 'evening';
    else day = 'night';
    let season;
    if (month === 11 || month < 2) season = 'winter';
    else if (month < 5) season = 'spring';
    else if (month < 8) season = 'summer';
    else season = 'autumn';
    return { hour, day, season };
  }

  initWindow() {
    const clock = this.windowClock();
    const views = ['hills', 'lake', 'town', 'forest', 'field'];
    const charId = (typeof System !== 'undefined' && System.look && System.look.char) || 'gopher';
    this.win = {
      view: views[Math.floor(Math.random() * views.length)],
      day: clock.day,
      season: clock.season,
      hour: clock.hour,
      weather: 'clear',
      weatherIn: randFloat(16, 28),
      birds: [],
      birdIn: 1.2,
      passers: [],
      passerIn: 1,
      far: null,
      farIn: randFloat(28, 55),
      flakes: [],
      bugs: [],
      flash: 0,
      watch: 0,
      rewarded: false,
      clouds: [0.12, 0.4, 0.68, 0.9].map((x, i) => ({ x: x, y: 0.06 + (i % 3) * 0.05, w: 0.16 + (i % 3) * 0.03, s: 0.01 + i * 0.003 })),
      actor: (typeof createCharacter === 'function') ? createCharacter(charId, 78) : null
    };
    this.spawnWindowBird(true);
    this.spawnWindowBird(true);
    this.spawnWindowPasser(true);
  }

  spawnWindowBird(inside) {
    const kinds = [
      { id: 'sparrow', color: '#b07a45', belly: '#f3e0c0', scale: 1.05 },
      { id: 'swallow', color: '#24345e', belly: '#f7f9fc', scale: 1.15 },
      { id: 'crow', color: '#1a1a1a', belly: '#2c2c2c', scale: 1.4 },
      { id: 'pigeon', color: '#8b8e98', belly: '#eceef2', scale: 1.25 },
      { id: 'tit', color: '#f0c93a', belly: '#fff4c4', scale: 1 }
    ];
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.win.birds.push({
      id: k.id, color: k.color, belly: k.belly,
      scale: k.scale * (Math.random() < 0.5 ? 1.35 : 1),
      x: inside ? randFloat(0.12, 0.88) : (dir > 0 ? -0.16 : 1.16),
      y0: randFloat(0.14, 0.46),
      amp: randFloat(0.012, 0.035),
      wave: randFloat(4, 8),
      dir: dir,
      speed: randFloat(0.07, 0.14) * (k.id === 'swallow' ? 1.4 : 1),
      phase: randFloat(0, 6),
      tale: this.windowTale('bird', k.id)
    });
  }

  spawnWindowPasser(inside) {
    const kinds = ['cat', 'dog', 'kid', 'bike', 'car', 'bus', 'plane', 'scooter', 'stroller', 'walker', 'runner'];
    const id = kinds[Math.floor(Math.random() * kinds.length)];
    if (id === 'plane' && this.win.day === 'night') return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.win.passers.push({
      id: id,
      x: inside ? randFloat(0.2, 0.75) : (dir > 0 ? -0.2 : 1.2),
      dir: dir,
      speed: id === 'plane' ? randFloat(0.09, 0.14) : (id === 'cat' ? 0.045 : randFloat(0.05, 0.11)),
      phase: randFloat(0, 6),
      y: id === 'plane' ? randFloat(0.08, 0.22) : 0,
      color: ['#e07a3d', '#6d6a66', '#c9a27a', '#3d3a38'][Math.floor(Math.random() * 4)],
      tale: this.windowTale('walk', id)
    });
  }

  // Одна история на всё время, пока герой на экране. Следующий такой же
  // получит другую фразу уже при появлении.
  windowTale(group, id) {
    const lines = {
      sparrow: ['Это воробей Чирик, ищет крошки.', 'Это воробей, спешит к стае.', 'Это Чирик, несёт веточку в гнездо.'],
      swallow: ['Это ласточка, ловит мошек.', 'Это ласточка Стрела, возвращается домой.', 'Это ласточка, рисует круги в небе.'],
      crow: ['Это ворона Каркуша, смотрит с интересом.', 'Это ворона, несёт блестяшку.', 'Это Каркуша, летит к парку.'],
      pigeon: ['Это голубь, гуляет по крыше.', 'Это голубь Сизый, ищет семечки.', 'Это голубь, несёт письмо никому.'],
      tit: ['Это синица Зинка, скачет по ветке.', 'Это синица, ищет семечки.', 'Это Зинка, поёт тонким голосом.'],
      cat: ['Это кот Мурзик, идёт по своим делам.', 'Это кошка Муся, спешит домой.', 'Это кот, обходит лужу.'],
      dog: ['Это пёс Шарик, гуляет с хозяином.', 'Это собака Жучка, несёт палку.', 'Это пёс, бежит к парку.'],
      kid: ['Это девочка Люся, идёт со школы.', 'Это мальчик Петя, несёт портфель.', 'Это ребёнок, спешит к друзьям.'],
      bike: ['Это велосипедист, едет в парк.', 'Это девочка на велике, везёт корзину.', 'Это мальчик, крутит педали.'],
      car: ['Это машина, везёт семью на дачу.', 'Это красная машина, едет тихо.', 'Это машина, везёт арбуз.'],
      bus: ['Это автобус, едет по маршруту рынок-школа.', 'Это автобус, везёт ребят со школы.', 'Это автобус номер 5, едет к парку.'],
      plane: ['Это самолёт, летит к морю.', 'Это самолёт, рисует белую полоску.', 'Это самолёт, везёт письма.'],
      scooter: ['Это самокат, едет по дорожке.', 'Это мальчик на самокате, спешит к дому.', 'Это самокат, объезжает лужу.'],
      stroller: ['Это коляска, в ней спит малыш.', 'Это коляска, мама везёт её к парку.', 'Это коляска с игрушечным мишкой.'],
      walker: ['Это Григорий Иванович, идёт за пенсией.', 'Это сосед, несёт батон.', 'Это бабушка, идёт в магазин.'],
      runner: ['Это бегун, тренируется к празднику.', 'Это девочка, бежит на тренировку.', 'Это бегун, считает шаги.']
    };
    const list = lines[id] || ['Кто-то идёт по улице.'];
    return list[Math.floor(Math.random() * list.length)];
  }

  windowWeatherName(w) {
    return { clear: 'ясно', cloudy: 'облачно', rain: 'дождь', storm: 'гроза', snow: 'снег' }[w] || '';
  }

  pickWindowWeather(season) {
    const roll = Math.random();
    if (season === 'winter') {
      if (roll < 0.45) return 'snow';
      if (roll < 0.7) return 'cloudy';
      if (roll < 0.82) return 'storm';
      return 'clear';
    }
    if (roll < 0.42) return 'clear';
    if (roll < 0.68) return 'cloudy';
    if (roll < 0.86) return 'rain';
    return 'storm';
  }

  updateWindow(sec) {
    const win = this.win;
    if (!win) return;
    const clock = this.windowClock();
    win.day = clock.day;
    win.season = clock.season;
    win.hour = clock.hour;
    win.watch += sec;
    if (!win.rewarded && win.watch > 40) {
      win.rewarded = true;
      this.reward('window', 'Посидели у окна');
    }
    if ((win.weatherIn -= sec) <= 0) {
      win.weather = this.pickWindowWeather(win.season);
      win.weatherIn = randFloat(18, 36);
    }
    if (win.flash > 0) win.flash -= sec;
    if (win.weather === 'storm' && Math.random() < sec * 0.35) win.flash = 0.18;

    win.clouds.forEach(c => {
      c.x += c.s * sec;
      if (c.x > 1.25) c.x = -0.3;
    });

    if ((win.birdIn -= sec) <= 0 && win.birds.length < 4) {
      win.birdIn = randFloat(1.6, 3.4);
      this.spawnWindowBird(false);
    }
    win.birds.forEach(b => {
      b.x += b.dir * b.speed * sec;
      b.phase += sec * (9 + b.speed * 30);
    });
    win.birds = win.birds.filter(b => b.x > -0.25 && b.x < 1.25);

    if ((win.passerIn -= sec) <= 0 && win.passers.length < 3) {
      win.passerIn = randFloat(3.5, 7);
      this.spawnWindowPasser(false);
    }
    win.passers.forEach(p => {
      p.x += p.dir * p.speed * sec;
      p.phase += sec * (p.id === 'plane' ? 0 : 7);
    });
    win.passers = win.passers.filter(p => p.x > -0.28 && p.x < 1.28);

    if (win.far) {
      win.far.x += win.far.dir * win.far.speed * sec;
      win.far.phase = (win.far.phase || 0) + sec;
      const gone = win.far.dir > 0 ? win.far.x > 1.2 : win.far.x < -0.2;
      if (gone) { win.far = null; win.farIn = randFloat(80, 150); }
    } else if ((win.farIn -= sec) <= 0) {
      const all = (typeof CHARACTERS !== 'undefined' && CHARACTERS.length) ? CHARACTERS : [];
      const ch = all.length ? all[Math.floor(Math.random() * all.length)] : null;
      if (ch && typeof createCharacter === 'function') {
        const dir = Math.random() < 0.5 ? -1 : 1;
        win.far = {
          id: ch.id, name: ch.name, dir: dir,
          x: dir > 0 ? -0.12 : 1.12,
          speed: randFloat(0.018, 0.03),
          phase: 0,
          actor: createCharacter(ch.id, 42)
        };
      } else win.farIn = 40;
    }

    if ((win.season === 'spring' || win.season === 'summer') && win.bugs.length < 3 && Math.random() < sec * 0.8) {
      win.bugs.push({
        x: randFloat(0.15, 0.85), y: randFloat(0.55, 0.78),
        phase: randFloat(0, 6), hue: Math.random() < 0.5 ? '#f48fb1' : '#ffd54f'
      });
    }
    win.bugs.forEach(b => { b.phase += sec * 4; b.x += Math.sin(b.phase) * 0.01; });

    const falling = win.weather === 'snow' || win.weather === 'rain' || win.weather === 'storm' || win.season === 'autumn';
    const flakeCap = win.weather === 'storm' ? 70 : 46;
    if (falling && win.flakes.length < flakeCap && Math.random() < sec * (win.weather === 'storm' ? 40 : 22)) {
      win.flakes.push({
        x: Math.random(),
        y: -0.02,
        s: randFloat(0.1, 0.28),
        drift: randFloat(-0.03, 0.03),
        leaf: win.season === 'autumn' && win.weather !== 'snow' && win.weather !== 'rain' && win.weather !== 'storm'
      });
    }
    win.flakes.forEach(f => {
      f.y += f.s * sec;
      f.x += f.drift * sec;
    });
    win.flakes = win.flakes.filter(f => f.y < 1.05);
  }

  drawWindowBird(ctx, x, y, b) {
    const s = 26 * b.scale;
    // Оба крыла на одном угле: поднимаются и опускаются вместе.
    const lift = Math.sin(b.phase);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.dir, 1);
    ctx.rotate(Math.sin(b.x * b.wave) * 0.08);
    const wing = (alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(-s * 0.02, -s * 0.02);
      ctx.rotate(-0.15 - lift * 0.85);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-s * 0.35, -s * 0.22, -s * 0.95, -s * 0.08);
      ctx.quadraticCurveTo(-s * 0.7, s * 0.08, -s * 0.28, s * 0.1);
      ctx.quadraticCurveTo(-s * 0.08, s * 0.04, 0, 0);
      ctx.fill();
      ctx.restore();
    };
    wing(0.45);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.ellipse(-s * 0.05, s * 0.02, s * 0.46, s * 0.22, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = b.belly;
    ctx.beginPath();
    ctx.ellipse(s * 0.02, s * 0.08, s * 0.26, s * 0.12, 0, 0, Math.PI);
    ctx.fill();
    wing(1);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.ellipse(s * 0.38, -s * 0.06, s * 0.18, s * 0.15, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6d27a';
    ctx.beginPath();
    ctx.moveTo(s * 0.52, -s * 0.02);
    ctx.quadraticCurveTo(s * 0.78, s * 0.02, s * 0.5, s * 0.07);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, 0);
    ctx.quadraticCurveTo(-s * 0.7, -s * 0.18, -s * 0.58, 0);
    ctx.quadraticCurveTo(-s * 0.7, s * 0.16, -s * 0.4, s * 0.04);
    ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.arc(s * 0.44, -s * 0.1, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.11, s * 0.012, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawWindowCat(ctx, x, y, p) {
    const step = Math.sin(p.phase);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.dir, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(-28, 4);
    ctx.quadraticCurveTo(-36, -8 + step * 5, -30, -14 + step * 3);
    ctx.quadraticCurveTo(-22, -6, -20, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2, 2, 22, 11, -0.05, 0, Math.PI * 2);
    ctx.fill();
    [-12, -4, 4, 12].forEach((lx, i) => {
      const up = Math.sin(p.phase + i * 1.4) * 3;
      ctx.beginPath();
      ctx.ellipse(lx, 10 - Math.max(0, up), 3.2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(18, -4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4c7cf';
    ctx.beginPath();
    ctx.moveTo(12, -10);
    ctx.quadraticCurveTo(11, -18, 15, -11);
    ctx.moveTo(18, -12);
    ctx.quadraticCurveTo(21, -20, 22, -11);
    ctx.fill();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(12, -8); ctx.quadraticCurveTo(11, -16, 16, -9); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, -9); ctx.quadraticCurveTo(21, -17, 23, -9); ctx.fill();
    ctx.fillStyle = '#2a241f';
    ctx.beginPath();
    ctx.ellipse(22, -5, 1.6, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(22.4, -5.6, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e89aaa';
    ctx.beginPath(); ctx.ellipse(26, -2, 2.2, 1.5, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(26, -2); ctx.lineTo(34, -5);
    ctx.moveTo(26, -1); ctx.lineTo(34, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawWindowPlane(ctx, frame, p) {
    const x = frame.x + frame.w * p.x;
    const y = frame.y + frame.h * p.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.dir, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(-70, 2);
    ctx.lineTo(-28, 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f7fbff';
    ctx.strokeStyle = '#9bb0c2';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.quadraticCurveTo(28, -8, 8, -8);
    ctx.lineTo(-22, -7);
    ctx.quadraticCurveTo(-34, -6, -32, 0);
    ctx.quadraticCurveTo(-34, 6, -22, 7);
    ctx.lineTo(8, 8);
    ctx.quadraticCurveTo(28, 8, 30, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.quadraticCurveTo(2, -22, 22, -4);
    ctx.quadraticCurveTo(4, -2, -2, 2);
    ctx.quadraticCurveTo(2, 14, 16, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-24, -3);
    ctx.quadraticCurveTo(-36, -16, -22, -4);
    ctx.fill();
    ctx.fillStyle = '#b9def2';
    ctx.beginPath();
    ctx.ellipse(16, -1, 6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawWindowPasser(ctx, x, y, p) {
    const step = Math.sin(p.phase);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.dir, 1);
    if (p.id === 'dog') {
      ctx.fillStyle = '#c68642';
      ctx.beginPath(); ctx.ellipse(-4, -6, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(12, -10, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, -15, 3, 5, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c68642'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-16, -4); ctx.quadraticCurveTo(-24, -8 + step * 4, -22, -2); ctx.stroke();
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2;
      [-8, 0, 6].forEach((lx, i) => {
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + step, 8); ctx.stroke();
      });
    } else if (p.id === 'kid') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -16, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 0); ctx.moveTo(0, -6); ctx.lineTo(7, -2); ctx.moveTo(-2, 0); ctx.lineTo(-4 + step, 8); ctx.moveTo(2, 0); ctx.lineTo(4 - step, 8); ctx.stroke();
      ctx.strokeStyle = '#e25b5b';
      ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(12, -18); ctx.stroke();
      ctx.fillStyle = '#ff5a7a';
      ctx.beginPath(); ctx.arc(14, -22, 5, 0, Math.PI * 2); ctx.fill();
    } else if (p.id === 'bike') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-12, 2, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(12, 2, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(0, -6); ctx.lineTo(12, 2); ctx.lineTo(2, 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(2, -12, 4, 0, Math.PI * 2); ctx.stroke();
    } else if (p.id === 'bus') {
      ctx.fillStyle = '#f0c14a';
      roundRect(ctx, -26, -16, 52, 18, 8); ctx.fill();
      ctx.fillStyle = '#b9e2f5';
      for (let i = 0; i < 4; i++) ctx.fillRect(-20 + i * 11, -12, 8, 7);
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-14, 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, 4, 4, 0, Math.PI * 2); ctx.fill();
    } else if (p.id === 'car') {
      ctx.fillStyle = '#4d8fd6';
      roundRect(ctx, -18, -12, 36, 14, 7); ctx.fill();
      ctx.fillStyle = '#d7eef8';
      ctx.fillRect(4, -8, 8, 6);
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-8, 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, 4, 4, 0, Math.PI * 2); ctx.fill();
    } else if (p.id === 'scooter') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-8, 4, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(12, 4, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(12, 4); ctx.lineTo(8, -14); ctx.stroke();
      ctx.beginPath(); ctx.arc(6, -20, 4, 0, Math.PI * 2); ctx.stroke();
    } else if (p.id === 'stroller') {
      ctx.strokeStyle = '#5a6a88'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-8, 4, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(10, 4, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#8eb4e8';
      roundRect(ctx, -12, -14, 22, 14, 6); ctx.fill();
      ctx.fillStyle = '#f3c7a8';
      ctx.beginPath(); ctx.arc(0, -16, 4, 0, Math.PI * 2); ctx.fill();
    } else if (p.id === 'walker') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -18, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 0); ctx.moveTo(0, -8); ctx.lineTo(6, -2);
      ctx.moveTo(-1, 0); ctx.lineTo(-3 + step, 8); ctx.moveTo(1, 0); ctx.lineTo(3 - step, 8); ctx.stroke();
      ctx.strokeStyle = '#8a5a32';
      ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(8, 8); ctx.stroke();
    } else if (p.id === 'runner') {
      ctx.strokeStyle = '#c4492a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -16, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(4, -2);
      ctx.moveTo(0, -8); ctx.lineTo(8, -6 + step * 2);
      ctx.moveTo(2, -2); ctx.lineTo(-6 + step * 3, 8);
      ctx.moveTo(4, -2); ctx.lineTo(10 - step * 2, 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawWindow(ctx, W, H) {
    const win = this.win;
    if (!win) return;
    const frame = { x: W * 0.08, y: H * 0.15, w: W * 0.84, h: H * 0.62 };
    const season = win.season;
    const day = win.day;

    ctx.fillStyle = '#3a2a22';
    roundRect(ctx, frame.x - 10, frame.y - 10, frame.w + 20, frame.h + 20, 8);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.w, frame.h);
    ctx.clip();

    let skyTop = { morning: '#ffb37a', day: '#7ec8f0', evening: '#ff8a5b', night: '#0c1430' }[day];
    let skyBot = { morning: '#87b7e8', day: '#d7f0ff', evening: '#6a4a8a', night: '#243058' }[day];
    if (win.weather === 'storm' || win.weather === 'rain') {
      skyTop = day === 'night' ? '#12141c' : '#6d7886';
      skyBot = '#3e4854';
    }
    const g = ctx.createLinearGradient(0, frame.y, 0, frame.y + frame.h * 0.62);
    g.addColorStop(0, skyTop);
    g.addColorStop(1, skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

    if (day === 'night' && win.weather !== 'storm') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 28; i++) {
        const sx = frame.x + ((i * 97) % frame.w);
        const sy = frame.y + 8 + ((i * 53) % (frame.h * 0.38));
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 0.002 + i));
        ctx.fillRect(sx, sy, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f4f1d8';
      ctx.beginPath();
      ctx.arc(frame.x + frame.w * 0.78, frame.y + frame.h * 0.16, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (day !== 'night') {
      let sx = 0.5, sy = 0.16;
      if (day === 'morning') { sx = 0.18; sy = 0.42; }
      if (day === 'evening') { sx = 0.82; sy = 0.42; }
      const sunx = frame.x + frame.w * sx;
      const suny = frame.y + frame.h * sy;
      ctx.fillStyle = day === 'day' ? 'rgba(255,229,120,0.35)' : 'rgba(255,170,80,0.35)';
      ctx.beginPath();
      ctx.arc(sunx, suny, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = day === 'day' ? '#ffe56a' : '#ffb347';
      ctx.beginPath();
      ctx.arc(sunx, suny, day === 'day' ? 20 : 24, 0, Math.PI * 2);
      ctx.fill();
    }

    win.clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.globalAlpha = (win.weather === 'clear' && day !== 'night') ? 0.8 : (win.weather === 'storm' ? 0.5 : 0.92);
      const cx = frame.x + frame.w * c.x;
      const cy = frame.y + frame.h * c.y;
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 16, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy + 8, 14, 0, Math.PI * 2);
      ctx.arc(cx + 34, cy + 7, 12, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy - 4, 15, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    win.passers.filter(p => p.id === 'plane').forEach(p => this.drawWindowPlane(ctx, frame, p));

    const groundY = frame.y + frame.h * 0.58;
    const grass = { winter: '#e7eef4', spring: '#7dbe6e', summer: '#3c9a4c', autumn: '#c4a15a' }[season];
    const far = { winter: '#c5d5e2', spring: '#8ec98a', summer: '#5aaa62', autumn: '#d08958' }[season];
    const near = { winter: '#dce6ee', spring: '#6eae62', summer: '#2f8a3e', autumn: '#b86a32' }[season];
    const hill = (color, y0, humps) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(frame.x, frame.y + frame.h);
      ctx.lineTo(frame.x, y0);
      humps.forEach(h => ctx.quadraticCurveTo(frame.x + frame.w * h[0], y0 + h[1], frame.x + frame.w * h[2], y0 + h[3]));
      ctx.lineTo(frame.x + frame.w, frame.y + frame.h);
      ctx.closePath();
      ctx.fill();
    };
    hill(far, groundY + 8, [[0.2, -46, 0.4, -8], [0.62, -38, 0.82, 4], [1.05, -10, 1.1, 0]]);
    hill(near, groundY + 28, [[0.18, -22, 0.38, 6], [0.58, -18, 0.78, 8], [1.02, -6, 1.1, 4]]);
    ctx.fillStyle = grass;
    ctx.beginPath();
    ctx.moveTo(frame.x, groundY + 46);
    for (let x = 0; x <= frame.w; x += 18) {
      ctx.lineTo(frame.x + x, groundY + 46 + Math.sin(x * 0.05) * 3);
    }
    ctx.lineTo(frame.x + frame.w, frame.y + frame.h);
    ctx.lineTo(frame.x, frame.y + frame.h);
    ctx.closePath();
    ctx.fill();

    const tree = (tx, th, col) => {
      ctx.fillStyle = season === 'winter' ? '#efe8df' : '#6b4a32';
      roundRect(ctx, tx - 3, groundY + 36 - th * 0.35, 6, th * 0.4, 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(tx, groundY + 28 - th * 0.55, th * 0.28, th * 0.22, 0, 0, Math.PI * 2);
      ctx.ellipse(tx - th * 0.16, groundY + 34 - th * 0.42, th * 0.2, th * 0.16, 0, 0, Math.PI * 2);
      ctx.ellipse(tx + th * 0.16, groundY + 34 - th * 0.4, th * 0.18, th * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    const leaf = season === 'winter' ? '#d5e2ea' : (season === 'autumn' ? '#e07a32' : (season === 'spring' ? '#8fd18a' : '#2f7d45'));

    if (win.view === 'lake') {
      const water = ctx.createLinearGradient(0, groundY + 24, 0, groundY + 70);
      water.addColorStop(0, day === 'night' ? '#24506e' : '#8ed0ea');
      water.addColorStop(1, day === 'night' ? '#16364c' : '#3d8eb8');
      ctx.fillStyle = water;
      ctx.beginPath();
      ctx.moveTo(frame.x + frame.w * 0.18, groundY + 40);
      ctx.quadraticCurveTo(frame.x + frame.w * 0.5, groundY + 18, frame.x + frame.w * 0.86, groundY + 42);
      ctx.quadraticCurveTo(frame.x + frame.w * 0.55, groundY + 64, frame.x + frame.w * 0.16, groundY + 48);
      ctx.fill();
      tree(frame.x + frame.w * 0.12, 70, leaf);
      tree(frame.x + frame.w * 0.9, 58, leaf);
    } else if (win.view === 'town') {
      [[0.12, 78, '#e7d3c4'], [0.3, 108, '#d7c2b0'], [0.48, 64, '#efe0d2'], [0.66, 92, '#cbb59f']].forEach(([rx, hh, col]) => {
        const bx = frame.x + frame.w * rx;
        const by = groundY + 40 - hh;
        ctx.fillStyle = col;
        roundRect(ctx, bx, by + 16, 34, hh - 16, 4);
        ctx.fill();
        ctx.fillStyle = '#a35448';
        ctx.beginPath();
        ctx.moveTo(bx - 4, by + 18);
        ctx.lineTo(bx + 17, by);
        ctx.lineTo(bx + 38, by + 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = day === 'night' ? '#ffe7a0' : '#b9dff0';
        [[6, 24], [18, 24], [6, 40], [18, 40]].forEach(([wx, wy]) => {
          roundRect(ctx, bx + wx, by + wy, 8, 10, 2);
          ctx.fill();
        });
      });
    } else if (win.view === 'forest' || win.view === 'hills') {
      [0.08, 0.22, 0.38, 0.7, 0.86].forEach((rx, i) => tree(frame.x + frame.w * rx, 52 + (i % 3) * 16, leaf));
    } else if (win.view === 'field') {
      tree(frame.x + frame.w * 0.12, 64, leaf);
      const mx = frame.x + frame.w * 0.72;
      ctx.strokeStyle = '#8d8378';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mx, groundY + 40);
      ctx.lineTo(mx, groundY - 8);
      ctx.stroke();
      ctx.strokeStyle = '#f2efe6';
      ctx.lineWidth = 2;
      const ang = this.time * 0.0012;
      for (let i = 0; i < 4; i++) {
        const a = ang + i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(mx, groundY - 8);
        ctx.quadraticCurveTo(mx + Math.cos(a) * 10, groundY - 8 + Math.sin(a) * 4, mx + Math.cos(a) * 22, groundY - 8 + Math.sin(a) * 6);
        ctx.stroke();
      }
    }

    if (season === 'spring' || season === 'summer') {
      ctx.fillStyle = season === 'spring' ? '#f48fb1' : '#ffd54f';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(frame.x + 20 + i * 28, groundY + 34 + (i % 2) * 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = '#a9845c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(frame.x, groundY + 22);
    ctx.lineTo(frame.x + frame.w, groundY + 22);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let x = frame.x + 8; x < frame.x + frame.w; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 14);
      ctx.lineTo(x, groundY + 32);
      ctx.stroke();
    }
    ctx.fillStyle = season === 'winter' ? '#d5dee6' : '#b7b1a4';
    ctx.beginPath();
    ctx.moveTo(frame.x, groundY + 48);
    ctx.quadraticCurveTo(frame.x + frame.w * 0.5, groundY + 40, frame.x + frame.w, groundY + 50);
    ctx.lineTo(frame.x + frame.w, groundY + 64);
    ctx.quadraticCurveTo(frame.x + frame.w * 0.5, groundY + 56, frame.x, groundY + 62);
    ctx.fill();

    if (win.far && win.far.actor) {
      const fx = frame.x + frame.w * win.far.x;
      ctx.save();
      ctx.globalAlpha = 0.92;
      win.far.actor.draw(ctx, fx, groundY + 8, 0.55);
      ctx.restore();
    }

    win.hits = [];
    win.passers.filter(p => p.id !== 'plane').forEach(p => {
      const px = frame.x + frame.w * p.x;
      if (p.id === 'cat') this.drawWindowCat(ctx, px, groundY + 12, p);
      else this.drawWindowPasser(ctx, px, groundY + 44, p);
      win.hits.push({ x: px - 28, y: groundY - 10, w: 56, h: 58, tale: p.tale });
    });

    win.bugs.forEach(b => {
      const bx = frame.x + frame.w * b.x;
      const by = frame.y + frame.h * b.y + Math.sin(b.phase) * 6;
      const wing = Math.abs(Math.sin(b.phase * 3)) * 7;
      ctx.fillStyle = b.hue;
      ctx.beginPath();
      ctx.ellipse(bx - 3, by - wing, 4, 6, -0.4, 0, Math.PI * 2);
      ctx.ellipse(bx + 3, by - wing, 4, 6, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillRect(bx - 1, by, 2, 7);
    });

    win.birds.forEach(b => {
      const by = b.y0 + Math.sin(b.x * b.wave + b.phase * 0.15) * b.amp;
      const bx = frame.x + frame.w * b.x;
      const byPx = frame.y + frame.h * by;
      this.drawWindowBird(ctx, bx, byPx, b);
      win.hits.push({ x: bx - 22, y: byPx - 16, w: 44, h: 32, tale: b.tale });
    });
    win.passers.filter(p => p.id === 'plane').forEach(p => {
      win.hits.push({
        x: frame.x + frame.w * p.x - 30,
        y: frame.y + frame.h * p.y - 16,
        w: 70, h: 28, tale: p.tale
      });
    });

    win.flakes.forEach(f => {
      const fx = frame.x + frame.w * f.x;
      const fy = frame.y + frame.h * f.y;
      if (f.leaf) {
        ctx.fillStyle = '#e07a32';
        ctx.fillRect(fx, fy, 4, 3);
      } else if (win.weather === 'rain' || win.weather === 'storm') {
        ctx.strokeStyle = 'rgba(190,210,230,0.7)';
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx - 2, fy + 8);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(fx, fy, 2, 2);
      }
    });

    if (win.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.75, win.flash * 4).toFixed(2) + ')';
      ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
      ctx.strokeStyle = '#fff6c2';
      ctx.lineWidth = 2;
      const lx = frame.x + frame.w * 0.62;
      const ly = frame.y + 10;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - 8, ly + 28);
      ctx.lineTo(lx + 4, ly + 28);
      ctx.lineTo(lx - 6, ly + 58);
      ctx.stroke();
    }

    ctx.restore();

    // переплёт окна
    ctx.strokeStyle = '#efe6d6';
    ctx.lineWidth = 8;
    ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
    ctx.beginPath();
    ctx.moveTo(frame.x + frame.w / 2, frame.y);
    ctx.lineTo(frame.x + frame.w / 2, frame.y + frame.h);
    ctx.moveTo(frame.x, frame.y + frame.h * 0.48);
    ctx.lineTo(frame.x + frame.w, frame.y + frame.h * 0.48);
    ctx.stroke();

    if (win.actor) {
      win.actor.draw(ctx, frame.x + 58, frame.y + frame.h - 6, 0.72);
    }

    const dayName = { morning: 'утро', day: 'день', evening: 'вечер', night: 'ночь' }[day];
    const seasonName = { winter: 'зима', spring: 'весна', summer: 'лето', autumn: 'осень' }[season];
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(dayName + ' · ' + seasonName + ' · ' + this.windowWeatherName(win.weather), W / 2, frame.y + frame.h + 36);
    if (win.caption) {
      ctx.fillStyle = 'rgba(20,24,40,0.88)';
      const tw = Math.min(W - 24, ctx.measureText(win.caption).width + 24);
      roundRect(ctx, (W - tw) / 2, frame.y + 8, tw, 28, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.032, 14)}px Arial`;
      ctx.fillText(win.caption, W / 2, frame.y + 26);
    }
  }

  // ================= НАЖАТИЯ =================
  handleClick(mx, my) {
    // «Назад» — всегда последняя кнопка в массиве
    const back = this.buttons[this.buttons.length - 1];
    if (back && back.text && back.text.indexOf('Назад') !== -1 &&
        isPointInRect(mx, my, back.x, back.y, back.w, back.h)) {
      AudioSys.play('click');
      if (this.mode === 'select') this.game.transitionTo('home');
      else this.init();
      return true;
    }

    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const a = btn.action || '';
      const t = btn.text || '';
      if (a === 'watch:toggle') {
        const on = this.mode !== 'watch';
        this.mode = on ? 'watch' : 'fish';
        this.watchOpenFor = 0;
        if (this.fish) { this.fish.state = 'wait'; this.fish.biteFish = null; }
        AudioSys.play('click');
        return true;
      }
      if (a.indexOf('quiet:') === 0) { this.startGame(a.slice(6)); return true; }
      if (a.indexOf('paint:') === 0) {
        this.paint.picked = parseInt(a.slice(6), 10);
        AudioSys.play('click');
        return true;
      }
      if (t.indexOf('Заново') !== -1 || t.indexOf('Ещё раз') !== -1) { this.startGame('stars'); return true; }
      if (t.indexOf('Другая') !== -1) { this.startGame('color'); return true; }
      if (t.indexOf('Тянуть') !== -1 || t.indexOf('Ждём') !== -1) {
        // Кнопка «Ждём» лежит вне плашки: пока читают факт, это просто «убрать»,
        // а не ошибка «Рано!». На «Тянуть!» во время поклёвки рыбу всё равно ловим.
        if (this.readingCatch() && !(this.fish && this.fish.state === 'bite')) {
          this.resultTimer = 0;
          this.result = '';
          return true;
        }
        return this.tryFish();
      }
      return true;
    }

    if (this.mode === 'window' && this.win && this.win.hits) {
      for (let i = this.win.hits.length - 1; i >= 0; i--) {
        const h = this.win.hits[i];
        if (isPointInRect(mx, my, h.x, h.y, h.w, h.h)) {
          this.win.caption = h.tale || '';
          AudioSys.play('click');
          return true;
        }
      }
    }
    if (this.mode === 'stars') return this.clickStars(mx, my);
    if (this.mode === 'color') return this.clickColor(mx, my);
    if (this.mode === 'fish') {
      // Тап по самой плашке её не убирает. Тап мимо — убирает и не считается подсечкой.
      if (this.readingCatch()) {
        if (!this.hitResultPlate(mx, my)) {
          this.resultTimer = 0;
          this.result = '';
        }
        return true;
      }
      return this.tryFish();
    }
    return false;
  }

  // Границы плашки результата (те же, что в draw()) — чтобы понимать, попал ли тап
  resultPlateBox() {
    const W = this.game.width, H = this.game.height;
    const bw = Math.min(W * 0.92, 380);
    const pad = 14;
    const baseSize = Math.min(W * 0.034, 14), minSize = 10.5;
    let size = baseSize, lines = [];
    const ctx = this._measureCtx || (this.game && this.game.ctx);
    if (ctx) {
      while (size >= minSize) {
        ctx.font = 'bold ' + size + 'px Arial, sans-serif';
        const probe = wrapLines(ctx, this.result, bw - pad * 2, 4);
        if (probe.every(l => ctx.measureText(l).width <= bw - pad * 2)) { lines = probe; break; }
        size -= 0.5;
      }
      if (!lines.length) lines = wrapLines(ctx, this.result, bw - pad * 2, 4);
    }
    if (!lines.length) lines = [String(this.result || '')];
    const lh = size + 5.5;
    const bh = Math.max(42, lines.length * lh + pad + 4);
    const by = H * 0.44 - (bh - 44) / 2;
    return { x: (W - bw) / 2, y: by - 6, w: bw, h: bh + 26 };
  }

  hitResultPlate(mx, my) {
    const b = this.resultPlateBox();
    return isPointInRect(mx, my, b.x, b.y, b.w, b.h);
  }

  clickStars(mx, my) {
    const W = this.game.width, H = this.game.height;
    const a = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const pts = this.stars.points.map(p => ({ x: a.x + a.w * p[0], y: a.y + a.h * p[1] }));
    for (let i = 0; i < pts.length; i++) {
      const dx = mx - pts[i].x, dy = my - pts[i].y;
      if (Math.sqrt(dx * dx + dy * dy) <= 24) {
        if (this.stars.done) return true;
        if (i === this.stars.next) {
          this.stars.next++;
          AudioSys.play('click');
          if (this.stars.next >= pts.length) {
            this.stars.done = true;
            this.reward('stars', 'Созвездие собрано ✨');
          }
        } else {
          AudioSys.play('fail');
          this.result = 'Эта звезда ещё не следующая — ищи номер ' + (this.stars.next + 1);
          this.resultTimer = 2.2;
        }
        return true;
      }
    }
    return false;
  }

  // Попадает ли точка в часть картинки
  paintHit(part, a, mx, my) {
    if (part.kind === 'circle') {
      const cx = a.x + a.w * part.cx, cy = a.y + a.h * part.cy;
      const dx = mx - cx, dy = my - cy;
      return Math.sqrt(dx * dx + dy * dy) <= a.w * part.r;
    }
    if (part.kind === 'ellipse') {
      const dx = (mx - (a.x + a.w * part.cx)) / (a.w * part.rx);
      const dy = (my - (a.y + a.h * part.cy)) / (a.h * part.ry);
      return (dx * dx + dy * dy) <= 1;
    }
    return isPointInRect(mx, my, a.x + a.w * part.x, a.y + a.h * part.y, a.w * part.w, a.h * part.h);
  }

  clickColor(mx, my) {
    const W = this.game.width, H = this.game.height;
    const p = this.paint;
    const a = { x: W * 0.12, y: H * 0.16, w: W * 0.76, h: H * 0.52 };
    // Части перекрывают друг друга, поэтому сначала ищем незакрашенную под
    // пальцем: так картинку всегда можно довести до конца. Если все под
    // пальцем уже раскрашены — перекрашиваем верхнюю (ребёнок видит отклик).
    const hits = p.parts.filter(part => this.paintHit(part, a, mx, my));
    if (!hits.length) return false;
    const target = hits.find(x => !x.fill) || hits[hits.length - 1];
    target.fill = p.colors[p.picked];
    AudioSys.play('click');
    if (p.parts.every(x => x.fill)) {
      p.done = true;
      // Картинка засчитана в профиль: «Другая картинка» сначала предложит те, что
      // ещё не раскрашивались, а в подписи видно «Раскрасок открыто: N из 8»
      if (typeof System !== 'undefined' && System.markSeen) System.markSeen('paint', p.id);
      this.reward('color', 'Картинка раскрашена: ' + p.name + ' 🎨');
    }
    return true;
  }

  tryFish() {
    const f = this.fish;
    if (f.state === 'bite' && f.biteFish) {
      const s = f.biteFish;
      const d = s.data || {};
      const before = (typeof System !== 'undefined' && System.fishCaughtTimes) ? System.fishCaughtTimes(d.id) : 0;
      const isNew = (before === 0);
      if (typeof System !== 'undefined' && System.markFishCaught) System.markFishCaught(d.id);
      s.caughtAnim = 0.8;         // рыбку тянет к поплавку, потом её место занимает новая
      s.alpha = 1;
      f.biteFish = null;
      f.state = 'wait';
      f.timer = randFloat(8, 13);
      f.caught++;
      f.lastCatch = { id: d.id, name: d.name, fact: d.fact, isNew: isNew };
      AudioSys.play('success');
      const nowCount = (typeof System !== 'undefined' && System.fishSpeciesCount) ? System.fishSpeciesCount() : 0;
      const all = (typeof FISH_SPECIES !== 'undefined') ? FISH_SPECIES.length : 0;
      const head = isNew ? '🐟 Новый вид: ' : '🐟 ';
      // Редкость видна в плашке, и она же определяет награду: за обычную рыбку —
      // одна монета, за легендарную — пятнадцать (v1.3.12). Так редкая рыба не
      // только реже попадается, но и заметно дороже.
      const rarity = (typeof fishRarityOf === 'function') ? fishRarityOf(d) : null;
      const rareTag = (rarity && rarity.id !== 'common') ? ' ' + rarity.emoji + ' ' + rarity.name + '!' : '';
      const bonus = rarity ? rarity.coins : 0;
      if (bonus && typeof System !== 'undefined' && System.earnCoins) System.earnCoins(bonus);
      const tail = '  (🪙+' + bonus + ', видов ' + nowCount + ' из ' + all + ')';
      if (f.caught >= f.target) {
        f.caught = 0;
        this.reward('fish', head + d.name + rareTag + '! Рыбалка удалась 🎣');
        this.result = head + d.name + rareTag + ' — ' + d.fact + tail;
        // Факт держится сам и довольно долго. Пока он на экране, поклёвки нет.
        this.resultTimer = (isNew || (rarity && rarity.id === 'legendary')) ? 16 : 14;
      } else {
        this.result = head + d.name + rareTag + ' — ' + d.fact +
          '  (🪙+' + bonus + ', ' + f.caught + '/' + f.target + ', видов ' + nowCount + ' из ' + all + ')';
        this.resultTimer = (isNew || (rarity && rarity.id === 'legendary')) ? 16 : 14;
      }
    } else if (f.state === 'bite') {
      // Клюнуло, но рыбка уже уплыла — честно говорим, что торопиться не надо
      f.state = 'wait';
      f.timer = randFloat(8, 13);
      this.result = 'Рано! Дождись, когда рыбка возьмёт наживку';
      this.resultTimer = 2.2;
    } else {
      this.result = 'Рано! Дождись, когда поплавок нырнёт';
      this.resultTimer = 2.0;
      // «Рано» не должно сбрасывать уже идущее ожидание в слишком частую поклёвку
      if (f.timer < 6) f.timer = randFloat(8, 13);
    }
    return true;
  }
}
window.QuietScene = QuietScene;
// Реестр раскрасок виден наружу: его читают проверки (quickcheck перебирает все
// восемь картинок) и снимки экрана. const-объявление не становится свойством
// глобального объекта, поэтому публикуем явно — как SEA_FRIENDS и FISH_SPECIES (v1.3.12).
window.PAINT_PICTURES = PAINT_PICTURES;
