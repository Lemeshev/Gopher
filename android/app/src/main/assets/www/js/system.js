// ============ СИСТЕМА ХАРАКТЕРИСТИК ============
// Имя профиля «по умолчанию» (профиль = кто играет: несколько детей на одном
// устройстве). Пока оно не изменено, в подписи показываем имя героя — см.
// System.profileLabel(). v1.3.4: заказчик заметил, что у Мишки/Милки в углу
// меню было написано «Гофер».
const DEFAULT_PROFILE_NAME = 'Гофер';

const System = {
  stats: {
    happiness: 70,    // Счастье
    hunger: 70,       // Сытость
    energy: 80,       // Энергия
    health: 85,       // Здоровье
    cleanliness: 80,  // Чистота
    intelligence: 30, // Интеллект
    workSkill: 10,    // Рабочий навык
    schoolSkill: 10,  // Учебный навык
    stress: 20        // Стресс
  },
  coins: 100,
  level: 1,
  xp: 0,
  xpToNext: 100,
  inventory: [],
  achievements: [],
  // ---- Достижения: счётчики долгого прогресса (v1.2.2) ----
  // Заказчик: все достижения нельзя получить за первый вечер, должны быть
  // такие, на которые уходят месяцы. Поэтому цели долгих ступеней стоят на
  // счётчиках РАЗНЫХ ДНЕЙ и СЕРИИ ДНЕЙ, а не на «сколько раз нажали».
  progress: {
    days: 0,          // сколько РАЗНЫХ дней играли (не запусков!)
    streak: 0,        // дней подряд
    bestStreak: 0,    // лучшая серия — видна в статистике
    lastDay: null,    // 'ГГГГ-ММ-ДД' последнего захода
    trips: 0,         // походов по карте
    minigames: 0,     // мини-игр начато
    quiet: 0,         // тихих игр закончено
    tttWins: 0,       // побед в крестики-нолики
    rpsWins: 0,       // побед в «камень, ножницы, бумага»
    simonBest: 0,     // самая длинная угаданная гирлянда в «Огоньках»
    feeds: 0,         // покормлено
    washes: 0,        // искупано
    plays: 0,         // поиграно дома
    sleeps: 0,        // уложено спать
    coinsEarned: 0,   // заработано монет всего (на руках может быть меньше)
    furniture: 0      // куплено вещей в дом
  },
  POPUP_MS: 2400,       // сколько висит плашка «достижение получено»
  popupQueue: [],       // открытий бывает несколько сразу — показываем по очереди
  lastPopup: null,      // последняя показанная плашка (для проверок и отладки)
  _popupShownAt: 0,
  _dayCheckedAt: 0,
  // Профиль загружен? Нужно, чтобы до нажатия «Продолжить» игра не считала
  // день и не сохраняла поверх настоящего сохранения пустое состояние.
  profileLoaded: false,
  knowledge: {
    artMuseum: 0,
    natureMuseum: 0,
    spaceMuseum: 0,
    historyMuseum: 0,
    library: 0
  },
  // Просмотренные предметы локаций: { 'art_museum': ['art_museum:Мона Лиза', ...] }
  visitedItems: {},
  // Улов тихой рыбалки (v1.3.9): { 'crucian': 3, 'pike': 1 } — какие виды уже
  // попадались и сколько раз. Достижение «Ихтиолог» считает РАЗНЫЕ виды,
  // поэтому редкие рыбки (золотая, клоун) особенно ценны.
  fishSeen: {},
  // Мебель в доме игрока и список друзей
  homeDecor: [],
  friends: [],
  localFriendship: {},   // дружба с гоферами этого же устройства

  // ---- ДОМ: КОМНАТЫ (v1.2) ---------------------------------------------
  // Комнат четыре: гостиная, спальня, кухня, ванная. У каждой свои обои, пол
  // и своя мебель — ребёнок сам решает, что где стоит.
  rooms: null,           // создаётся ensureRooms(): { living: {wall,floor,furniture:[]}, ... }
  activeRoom: 'living',
  inventory: [],         // куплено, но убрано в инвентарь
  paint: { walls: ['warm'], floors: ['wood'] },  // купленная отделка (после покупки — бесплатно)
  furnitureColors: {},   // { sofa: 2 } — выбранный цвет предмета (индекс палитры)

  // ---- Внешний вид (для гостей и кода друга) ----
  // char — персонаж: 'gopher' | 'bear' | 'bunny' | 'cat' | 'robot' | 'milka'
  // Наряды (v1.3) — по слотам: hat (голова), glasses (глаза), neck (шея),
  // back (за спиной). Слот — один: надета кепка — снимается шеф-шапка.
  // bowtie оставлен для старых сохранений: migrateLook() переносит его в neck.
  look: { hat: null, glasses: null, neck: null, back: null, bowtie: false, fur: 'classic', char: 'gopher' },
  OUTFIT_SLOT_DEFAULT: { hat: null, glasses: null, neck: null, back: null },
  outfitsOwned: [],        // купленные наряды: 'hat:cap', 'neck:scarf' — надевай бесплатно

  // ---- СОН, ЭНЕРГИЯ И ОФЛАЙН (v1.2) ----
  SLEEP_FULL_MINUTES: 10,       // 0 → 100 энергии за 10 минут сна (требование заказчика)
  ENERGY_PER_HOUR: 1.5,         // пассивная трата, пока гофер бодр
  HUNGER_PER_HOUR: 2.5,
  CLEAN_PER_HOUR: 0.8,
  STRESS_PER_HOUR: 0.6,
  // «Пол» офлайн-изменений: ребёнок не должен возвращаться к измученному питомцу
  OFFLINE_FLOOR: { energy: 25, hunger: 25, cleanliness: 30, health: 40, happiness: 35 },
  OFFLINE_STRESS_MAX: 25,
  OFFLINE_MAX_HOURS: 24,
  // Сколько энергии стоит поход. Специально немного: 2–3 похода не «съедают» день.
  VISIT_ENERGY: {
    pool: 5, gym: 6, work: 8, school: 5, museum_any: 3, museums: 3, library: 2,
    cinema: 4, park: 5, restaurant: 2, beach: 6, friend: 3, clinic: 0, shop: 0,
    home: 0, stats: 0, minigames: 0, quiet: 0
  },
  // ---- Что можно, пока гофер спит (v1.2.1) ----
  // Спит — значит спит: походы (музеи, работа, учёба, спорт, парк, кино, гости,
  // поликлиника) закрыты. Открыто только то, что от питомца не зависит:
  // мини-игры, тихие игры, магазин (просто каталог), инфо/настройки и сам дом.
  SLEEP_ALLOWED: ['home', 'shop', 'stats', 'minigames', 'quiet'],
  offlineReport: null,          // что случилось, пока приложение было закрыто
  justWoke: false,              // питомец только что выспался (для облачка дома)
  lastTick: 0,
  sleptMinutes: 0,


  // ---- Профиль (несколько детей на одном устройстве) ----
  // DEFAULT_PROFILE_NAME — имя профиля «по умолчанию»: пока родитель не переименовал
  // профиль, в подписях показываем имя героя (см. profileLabel), а не «Гофер»
  profileId: 'p1',
  profileName: DEFAULT_PROFILE_NAME,
  PROFILE_KEY: 'gopherlife_profiles',
  timeOfDay: 'morning',  // morning, afternoon, evening, night
  currentLocation: 'home',
  isSleeping: false,
  isSick: false,
  visitedLocations: new Set(),
  totalPlayTime: 0,
  // Состояние сохранения (v1.3.6): видно в статистике и проверках
  saveFailed: false,        // запись не удалась (кончилось место)
  restoredFromBackup: false, // дом подняли из резервной копии
  saveCopies: 0,            // сколько раз резервная копия выручала (для отладки)
  lastLoadError: null,      // текст последней ошибки загрузки сохранения
  lastSaveTime: Date.now(),

  // ================= ШКАЛЫ ДЛЯ РЕБЁНКА (v1.3.2) =================
  // Замечание заказчика: «стресс — единственная полоска, которая работает
  // наоборот; детям кажется, что все идеальные показатели должны быть полными,
  // а стресс из всех выделяется». Поэтому в интерфейсе показываем обратную
  // шкалу «Спокойствие» (100 − стресс): теперь ВСЕ полоски означают одно и то
  // же — «чем полнее и зеленее, тем лучше».
  // Внутри (сохранения, механика, достижения) остаётся стресс: старые
  // сохранения читаются без переноса, relax()/addStress() работают как раньше.
  calm() { return 100 - this.stats.stress; },

  // Значение шкалы для показа: у «спокойствия» — обратная величина стресса
  statValue(key) {
    if (key === 'calm') return this.calm();
    const v = this.stats[key];
    return (typeof v === 'number') ? v : 0;
  },

  getStatColor(stat) {
    // Все шкалы одного типа: полная — зелёная, пустая — красная.
    // Никаких «перевёрнутых» шкал: ребёнку не надо держать это в голове.
    const val = this.statValue(stat);
    if (val > 60) return '#4ade80';
    if (val > 30) return '#fbbf24';
    return '#ef4444';
  },

  getStatEmoji(stat) {
    const map = {
      happiness: '❤️', hunger: '🍗', energy: '😴',
      health: '🏥', cleanliness: '🧹', intelligence: '🧠',
      workSkill: '💼', schoolSkill: '🎓', stress: '😰', calm: '😌'
    };
    return map[stat] || '📊';
  },

  // ================= КОМНАТЫ (v1.2) =================
  // Создать дом со всеми комнатами. У каждой — свои бесплатные обои и пол.
  ensureRooms() {
    const def = () => {
      const out = {};
      const list = (typeof HOME_ROOMS !== 'undefined') ? HOME_ROOMS : [{ id: 'living', free: { wall: 'warm', floor: 'wood' } }];
      for (const r of list) {
        out[r.id] = {
          wall: (r.free && r.free.wall) || 'warm',
          floor: (r.free && r.free.floor) || 'wood',
          furniture: []
        };
      }
      return out;
    };
    if (!this.rooms) this.rooms = def();
    // На всякий случай дополняем недостающие комнаты (миграция со старых версий)
    const fresh = def();
    for (const id of Object.keys(fresh)) {
      if (!this.rooms[id]) this.rooms[id] = fresh[id];
      else if (!Array.isArray(this.rooms[id].furniture)) this.rooms[id].furniture = [];
    }
    if (HOME_ROOMS.findIndex(r => r.id === this.activeRoom) === -1) this.activeRoom = 'living';
    return this.rooms;
  },

  // Данные активной комнаты: обои, пол и мебель
  currentRoomData() {
    this.ensureRooms();
    return this.rooms[this.activeRoom];
  },

  setActiveRoom(id) {
    this.ensureRooms();
    if (!this.rooms[id]) return false;
    this.activeRoom = id;
    this.saveGame();
    return true;
  },

  roomTitle() {
    return (typeof findRoom === 'function') ? findRoom(this.activeRoom).name : 'Комната';
  },

  // В какой комнате стоит предмет (или null)
  roomOfItem(id) {
    this.ensureRooms();
    for (const key of Object.keys(this.rooms)) {
      if (this.rooms[key].furniture.some(f => f.id === id)) return key;
    }
    return null;
  },

  // Цвет предмета: свой или «родной» из палитры
  colorOf(id) {
    const f = (typeof findFurniture === 'function') ? findFurniture(id) : null;
    const idx = this.furnitureColors[id];
    if (f && f.palette && f.palette.length) {
      return f.palette[(idx === undefined || idx === null) ? 0 : (idx % f.palette.length)];
    }
    return null;
  },

  colorIndex(id) {
    const idx = this.furnitureColors[id];
    return (idx === undefined || idx === null) ? 0 : idx;
  },

  // Дом целиком → для сохранения и кода друга
  serializedRooms() {
    this.ensureRooms();
    const out = {};
    for (const id of Object.keys(this.rooms)) {
      const r = this.rooms[id];
      out[id] = {
        wall: r.wall,
        floor: r.floor,
        furniture: (r.furniture || []).map(f => ({ id: f.id, x: f.x, y: f.y }))
      };
    }
    return out;
  },

  // Обратная совместимость: System.room и System.furniture — это активная комната
  get room() { return this.currentRoomData(); },
  get furniture() { return this.currentRoomData().furniture; },

  canAfford(cost) {
    return this.coins >= cost;
  },

  spendCoins(cost) {
    this.coins -= cost;
  },

  // Монеты + счётчик «заработано всего»: баланс можно потратить, а счётчик
  // для долгих достижений («2000 монет», «10 000 монет») не уменьшается.
  earnCoins(amount) {
    this.coins += amount;
    if (amount > 0) this.ensureProgress().coinsEarned += amount;
  },

  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.3);
      this.showAchievement('🎉', 'Уровень ' + this.level + '!');
    }
  },

  // ============ ДОСТИЖЕНИЯ И ДОЛГИЙ ПРОГРЕСС (v1.2.2) ============
  // Каталог живёт в game_content.js (ACHIEVEMENTS), здесь — механика:
  // счётчики, честный счёт дней и открытие наград. Список достижений ровно
  // один: и вкладка статистики, и проверки читают его же (раньше в
  // game_stats.js лежала вторая копия списка, которую никто не проверял).

  ensureProgress() {
    const def = () => ({
      days: 0, streak: 0, bestStreak: 0, lastDay: null,
      trips: 0, minigames: 0, quiet: 0, tttWins: 0, rpsWins: 0, simonBest: 0,
      feeds: 0, washes: 0, plays: 0, sleeps: 0,
      coinsEarned: 0, furniture: 0
    });
    const fresh = def();
    if (!this.progress || typeof this.progress !== 'object') this.progress = fresh;
    for (const k of Object.keys(fresh)) {
      if (k === 'lastDay') continue;
      if (typeof this.progress[k] !== 'number' || !isFinite(this.progress[k])) this.progress[k] = fresh[k];
    }
    if (typeof this.progress.lastDay !== 'string') this.progress.lastDay = null;
    if (!Array.isArray(this.achievements)) this.achievements = [];
    // Старые сохранения: неизвестные id (каталог менялся) просто убираем
    const known = this.achievementList().map(a => a.id);
    if (known.length) this.achievements = this.achievements.filter(id => known.indexOf(id) !== -1);
    return this.progress;
  },

  achievementList() {
    return (typeof ACHIEVEMENTS !== 'undefined' && Array.isArray(ACHIEVEMENTS)) ? ACHIEVEMENTS : [];
  },

  achievementTiers() {
    return (typeof ACHIEVEMENT_TIERS !== 'undefined' && Array.isArray(ACHIEVEMENT_TIERS)) ? ACHIEVEMENT_TIERS : [];
  },

  // Ключ календарного дня. Считаем по локальной дате, поэтому перевод часов
  // и часовые пояса не превращают один день в два.
  dayKey(nowMs) {
    const d = (nowMs === undefined) ? new Date() : new Date(nowMs);
    const two = n => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  },

  // Номер дня от эпохи — чтобы честно понимать «вчера» и «пропустил день»
  dayIndex(key) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
    if (!m) return null;
    return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
  },

  // Отметить день игры. Сколько бы раз ни открыли игру в один день —
  // день засчитывается ОДИН раз (иначе «сто дней» накрутили бы за вечер).
  // nowMs можно передать: так день проверяют тесты и переходы через полночь.
  registerDay(nowMs) {
    const p = this.ensureProgress();
    const key = this.dayKey(nowMs);
    if (p.lastDay === key) return false;
    const cur = this.dayIndex(key);
    const prev = p.lastDay ? this.dayIndex(p.lastDay) : null;
    if (prev !== null && (cur === null || cur <= prev)) return false;   // часы назад — не считаем
    p.streak = (prev !== null && cur - prev === 1) ? p.streak + 1 : 1;
    p.days += 1;
    p.bestStreak = Math.max(p.bestStreak, p.streak);
    p.lastDay = key;
    this.checkAchievements();
    this.saveGame();
    return true;
  },

  // Любое действие питомца или игра: плюс к счётчику и сразу проверка наград
  countAction(kind, n) {
    const p = this.ensureProgress();
    if (typeof p[kind] !== 'number') return false;
    p[kind] += (n === undefined ? 1 : n);
    this.checkAchievements();
    return p[kind];
  },

  achievementValue(a) {
    const p = this.ensureProgress();
    try { return a && a.of ? (a.of(p, this) || 0) : 0; } catch (e) { return 0; }
  },

  // Сколько уже сделано по достижению: { value, goal, done, pct }
  achievementProgress(a) {
    const value = this.achievementValue(a);
    const goal = Math.max(1, (a && a.goal) || 1);
    return { value: value, goal: goal, done: value >= goal, pct: clamp(Math.round(value / goal * 100), 0, 100) };
  },

  isAchUnlocked(id) {
    return (this.achievements || []).indexOf(id) !== -1;
  },

  unlockedCount() {
    let n = 0;
    for (const a of this.achievementList()) if (this.isAchUnlocked(a.id)) n++;
    return n;
  },

  // Проверить весь каталог: что доросло до цели — открывается и попадает в
  // очередь плашек. Возвращает список открытых сейчас (для проверок).
  checkAchievements() {
    const opened = [];
    for (const a of this.achievementList()) {
      if (this.isAchUnlocked(a.id)) continue;
      if (this.achievementValue(a) >= Math.max(1, a.goal || 1)) {
        this.achievements.push(a.id);
        opened.push(a);
      }
    }
    if (opened.length) {
      for (const a of opened) this.queuePopup('🏆', 'Достижение: ' + a.name);
      this.saveGame();
    }
    return opened;
  },

  // Плашки «получено достижение»: их может прийти несколько сразу, поэтому
  // показываем по одной (иначе ребёнок увидит только последнюю).
  queuePopup(emoji, text) {
    if (!Array.isArray(this.popupQueue)) this.popupQueue = [];
    this.popupQueue.push({ emoji: emoji, text: text });
    if (this.popupQueue.length === 1) this.showPopup();
    return this.popupQueue.length;
  },

  showPopup() {
    const next = (this.popupQueue || [])[0];
    if (!next) return false;
    this.showAchievement(next.emoji, next.text);
    this._popupShownAt = Date.now();
    return true;
  },

  // Вызывается каждый кадр из tick(): одна плашка висит POPUP_MS, потом
  // очередь идёт дальше. Без setTimeout — в WebView он может не сработать.
  updatePopups(nowMs) {
    const now = (nowMs === undefined) ? Date.now() : nowMs;
    if (!Array.isArray(this.popupQueue) || !this.popupQueue.length) return false;
    if (now - this._popupShownAt < this.POPUP_MS) return false;
    this.popupQueue.shift();
    this._popupShownAt = now;
    if (this.popupQueue.length) {
      const next = this.popupQueue[0];
      this.showAchievement(next.emoji, next.text);
    }
    return true;
  },

  // ===== Трекинг просмотренных предметов локаций =====
  getSeen(category) {
    if (!this.visitedItems) this.visitedItems = {};
    return this.visitedItems[category] || [];
  },

  hasSeen(category, id) {
    return this.getSeen(category).indexOf(id) !== -1;
  },

  markSeen(category, id) {
    if (!this.visitedItems) this.visitedItems = {};
    if (!this.visitedItems[category]) this.visitedItems[category] = [];
    if (this.visitedItems[category].indexOf(id) === -1) {
      this.visitedItems[category].push(id);
      this.checkAchievements();     // «Любознательный» и «Коллекционер» следят за этим
    }
  },

  seenCount(category) {
    return this.getSeen(category).length;
  },

  // ---------- УЛОВ ТИХОЙ РЫБАЛКИ (v1.3.9) ----------
  // Пожелание пользователя: «чтобы было много разных видов рыбок, чтоб всё время
  // разные попадались». Вид запоминается навсегда: по РАЗНЫМ видам считается
  // достижение «Ихтиолог», а счётчик показывает, сколько раз вид попадался.
  markFishCaught(speciesId) {
    if (!this.fishSeen || typeof this.fishSeen !== 'object') this.fishSeen = {};
    const id = String(speciesId || '');
    if (!id) return 0;
    this.fishSeen[id] = (this.fishSeen[id] || 0) + 1;
    this.checkAchievements();
    this.saveGame();
    return this.fishSeen[id];
  },

  // Сколько разных видов уже попадалось (для подсказки и достижения)
  fishSpeciesCount() {
    return Object.keys(this.fishSeen || {}).length;
  },

  // Сколько раз попадался конкретный вид
  fishCaughtTimes(id) {
    return (this.fishSeen && this.fishSeen[id]) || 0;
  },

  // Плашка сверху экрана. Кроме достижений её используют уровень, события на
  // карте и объяснение отказа. lastPopup хранит последний текст — это нужно
  // проверкам (в WebView DOM не всегда доступен) и отладке.
  showAchievement(emoji, text) {
    // Имя героя подставляем и в HTML-плашку, и в lastPopup: плашка — не канвас,
    // перехват fillText её не касается (v1.3.4)
    const shown = (typeof petFill === 'function') ? petFill(text) : text;
    this.lastPopup = { emoji: emoji, text: shown, raw: text, at: Date.now() };
    let el = document.getElementById('achievement-popup');
    if (!el) {
      el = document.createElement('div');
      el.id = 'achievement-popup';
      el.innerHTML = '<span class="ach-emoji"></span><span class="ach-text"></span>';
      document.body.appendChild(el);
    }
    const emojiEl = el.querySelector('.ach-emoji');
    const textEl = el.querySelector('.ach-text');
    if (emojiEl) emojiEl.textContent = emoji;
    if (textEl) textEl.textContent = shown;
    el.classList.add('show');
    clearTimeout(this._achTimer);
    // Чуть дольше, чем шаг очереди (POPUP_MS), чтобы плашка не мигала между двумя
    this._achTimer = setTimeout(() => el.classList.remove('show'), this.POPUP_MS + 200);
  },

  // Куда можно пойти. Блокируем только то, что реально не по силам:
  // устал — поспи, голоден — поешь. Всё остальное открыто (v1.2: мягче к ребёнку).
  // Отдельно (v1.2.1): пока гофер СПИТ, походов нет вовсе — иначе спящий
  // питомец оказывается в музее, на работе и в спортзале.
  isLocationAvailable(loc) {
    if (this.sleepBlocks(loc)) return false;
    const energy = this.stats.energy;
    const hunger = this.stats.hunger;
    switch (loc) {
      case 'pool': return hunger > 15 && energy >= 5;
      case 'clinic': return true;                 // к врачу пускаем всегда
      case 'shop': return true;
      case 'restaurant': return hunger < 95;
      case 'park': return energy >= 5;
      case 'gym': return energy >= 5;
      case 'work': return energy >= 15;
      case 'school': return energy >= 10;
      case 'cinema': return energy >= 5 && this.canAfford(20);
      case 'friend': return energy >= 5;
      case 'beach': return energy >= 5 && hunger > 15;
      case 'museums': return energy >= 3;
      case 'museum_art': return this.canAfford(30);
      case 'museum_nature': return this.canAfford(30);
      case 'museum_space': return this.canAfford(30);
      case 'museum_history': return this.canAfford(30);
      case 'library': return this.canAfford(10);
      case 'minigames': case 'quiet': case 'home': case 'stats': return true;
      default: return true;
    }
  },

  // Человеческая причина отказа — вместо сухого «нельзя».
  // Причина всегда та, из-за которой isLocationAvailable вернул false.
  locationLockReason(loc) {
    const energy = this.stats.energy;
    const hunger = this.stats.hunger;
    if (this.isLocationAvailable(loc)) return 'Сюда можно идти 🙂';
    if (this.sleepBlocks(loc)) {
      return '{Pet} спит 💤 — походы подождут. Сейчас можно: тихие игры, мини-игры, магазин и инфо';
    }

    const price = {
      cinema: 20, library: 10, museum_art: 30, museum_nature: 30,
      museum_space: 30, museum_history: 30
    }[loc];
    if (price && !this.canAfford(price)) {
      return 'Нужно ' + price + ' \ud83e\ude99 — загляни в магазин или на работу';
    }
    if ((loc === 'pool' || loc === 'beach') && hunger <= 15) return '{Pet} {pet:голодный|голодная} — сначала покорми 🍕';
    if (loc === 'restaurant' && hunger >= 95) return '{Pet} {pet:сыт|сыта} — сначала погуляй 🚶';

    const need = {
      work: 15, school: 10, pool: 5, park: 5, gym: 5,
      cinema: 5, friend: 5, beach: 5, museums: 3
    }[loc];
    if (need && energy < need) {
      return '{Pet} {pet:устал|устала} (⚡' + Math.round(energy) + '%) — поспи, сон даёт +10% в минуту 😴';
    }
    return 'Сейчас сюда нельзя';
  },

  // Сколько энергии стоит поход (немного: игра не должна наказывать)
  visitCost(loc) {
    const v = this.VISIT_ENERGY[loc];
    return (v === undefined) ? 2 : v;
  },

  // Нельзя ли это дело просто потому, что питомец спит?
  sleepBlocks(loc) {
    if (!this.isSleeping) return false;
    return this.SLEEP_ALLOWED.indexOf(loc) === -1;
  },

  // Что открыто, пока гофер спит — одной строкой для подсказок на экране
  sleepAllowedHint() {
    return 'тихие игры · мини-игры · магазин · инфо';
  },

  spendEnergy(amount) {
    this.stats.energy = Math.max(0, this.stats.energy - amount);
  },

  addStress(amount) {
    this.stats.stress = Math.min(100, this.stats.stress + amount);
  },

  // Снять стресс (сон, музыка, купание, тихие игры...)
  relax(amount) {
    const before = this.stats.stress;
    this.stats.stress = Math.max(0, this.stats.stress - amount);
    return before - this.stats.stress;
  },

  // Если гофер нервничает — об этом надо сказать прямым текстом.
  // Для ребёнка это шкала «Спокойствие»: чем её меньше, тем хуже дела.
  stressHint() {
    const calm = this.calm();
    if (calm <= 30) return '{Pet} очень нервничает 😰 Поспи с {pet_by} или поиграй тихо';
    if (calm <= 60) return '{Pet} немного {pet:напряжён|напряжена} 😟 Помогут сон, музыка или тихие игры';
    return '';
  },


  getTimePeriod(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  },

  // Время в игре. Траты мягкие: поход ≈ час, и это всего −1.5 энергии.
  advanceTime(hours) {
    const h = Math.max(0, hours);
    this.stats.hunger = Math.max(0, this.stats.hunger - h * this.HUNGER_PER_HOUR);
    this.stats.energy = Math.max(0, this.stats.energy - h * this.ENERGY_PER_HOUR);
    this.stats.cleanliness = Math.max(0, this.stats.cleanliness - h * this.CLEAN_PER_HOUR);
    this.stats.stress = Math.min(100, this.stats.stress + h * this.STRESS_PER_HOUR);
    if (this.stats.hunger < 10) {
      this.stats.health = Math.max(0, this.stats.health - h * 2);
      this.isSick = this.stats.health < 20;
    }
    if (this.stats.energy < 10) {
      this.stats.happiness = Math.max(0, this.stats.happiness - h * 2);
    }
    this.timeOfDay = this.getTimePeriod(new Date().getHours());
  },

  // ============ ОФЛАЙН-ПРОГРЕСС ============
  // Что случилось, пока приложение было закрыто.
  // Если гофера уложили спать и ЗАКРЫЛИ приложение — энергия честно копится
  // (те же +10% в минуту), и через 10 минут он просыпается бодрым.
  // Если бодрствовал — траты мягкие и не опускаются ниже «пола»: ребёнок
  // не должен возвращаться к измученному питомцу.
  applyOfflineProgress(savedAt) {
    const now = Date.now();
    const awayMs = Math.max(0, now - (savedAt || now));
    this.ensureRooms();
    if (awayMs < 5000) return null;                  // меньше 5 секунд не считаем
    const slept = Math.min(awayMs, this.OFFLINE_MAX_HOURS * 3600000);
    const report = { awayMinutes: Math.round(awayMs / 60000), sleptMinutes: 0, wokeUp: false, slept: false };

    if (this.isSleeping) {
      report.slept = true;
      const perMs = 100 / (this.SLEEP_FULL_MINUTES * 60000);
      const needMs = Math.max(0, 100 - this.stats.energy) / perMs;
      const effective = Math.min(slept, needMs);
      this.tick(effective);
      this.justWoke = false;      // про пробуждение расскажет «пока тебя не было»
      const sleptH = effective / 3600000;
      // Во сне гофер не ест — но и тут не проваливаемся ниже «пола»
      this.stats.hunger = Math.max(this.OFFLINE_FLOOR.hunger, this.stats.hunger - sleptH * 1.2);
      report.sleptMinutes = Math.round(effective / 60000);
      if (this.stats.energy >= 99.5) { this.isSleeping = false; report.wokeUp = true; }
      this.addXP(Math.min(20, Math.round(report.sleptMinutes / 2)));
    } else {
      const hours = slept / 3600000;
      this.stats.energy = Math.max(this.OFFLINE_FLOOR.energy, this.stats.energy - hours * this.ENERGY_PER_HOUR);
      this.stats.hunger = Math.max(this.OFFLINE_FLOOR.hunger, this.stats.hunger - hours * this.HUNGER_PER_HOUR);
      this.stats.cleanliness = Math.max(this.OFFLINE_FLOOR.cleanliness, this.stats.cleanliness - hours * this.CLEAN_PER_HOUR);
      this.stats.stress = Math.min(this.OFFLINE_STRESS_MAX, this.stats.stress + hours * this.STRESS_PER_HOUR);
      this.stats.health = Math.max(this.OFFLINE_FLOOR.health, this.stats.health);
      this.stats.happiness = Math.max(this.OFFLINE_FLOOR.happiness, this.stats.happiness);
      this.timeOfDay = this.getTimePeriod(new Date().getHours());
    }

    this.offlineReport = report;
    return report;
  },

  // Текст для игрока: «Пока тебя не было...»
  offlineMessage() {
    const r = this.offlineReport;
    if (!r) return '';
    const mins = r.awayMinutes;
    const human = mins < 60 ? (mins + ' мин') : (Math.floor(mins / 60) + ' ч ' + (mins % 60) + ' мин');
    if (r.wokeUp) return 'Пока тебя не было (' + human + '), {pet} {pet:выспался|выспалась} и {pet:полон|полна} сил! ⚡';
    if (r.sleptMinutes > 0) return '{Pet} {pet:спал|спала} ' + r.sleptMinutes + ' мин без тебя: энергия ' + Math.round(this.stats.energy) + '% ⚡';
    return 'Тебя не было ' + human + ' — {pet} {pet:скучал|скучала}, но держится ' + this.heroEmoji();
  },

  saveGame() {
    const data = {
      stats: { ...this.stats },
      coins: this.coins,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      inventory: [...this.inventory],
      achievements: [...this.achievements],
      progress: { ...this.ensureProgress() },
      knowledge: { ...this.knowledge },
      visitedItems: { ...this.visitedItems },
      fishSeen: { ...(this.fishSeen || {}) },   // улов тихой рыбалки (v1.3.9)
      timeOfDay: this.timeOfDay,
      visitedLocations: [...this.visitedLocations],
      totalPlayTime: this.totalPlayTime,
      playTimeUnit: 'sec',       // до v1.3.6 время хранилось в целых минутах
      isSick: this.isSick,
      homeDecor: [...this.homeDecor],
      friends: [...this.friends],
      localFriendship: { ...(this.localFriendship || {}) },
      rooms: this.serializedRooms(),
      activeRoom: this.activeRoom,
      paint: { walls: this.paint.walls.slice(), floors: this.paint.floors.slice() },
      furnitureColors: { ...this.furnitureColors },
      outfitsOwned: (this.outfitsOwned || []).slice(),
      // legacy-поля: их читают старые коды друзей и сторонние проверки
      room: { wall: this.currentRoomData().wall, floor: this.currentRoomData().floor },
      furniture: this.currentRoomData().furniture.map(f => ({ id: f.id, x: f.x, y: f.y })),
      look: { ...this.look },
      isSleeping: this.isSleeping,
      sleptMinutes: this.sleptMinutes,
      profileId: this.profileId,
      profileName: this.profileName,
      savedAt: Date.now()
    };
    const key = this.saveKeyFor(this.profileId);
    const json = JSON.stringify(data);
    // Перед перезаписью забираем предыдущее состояние в резервную копию: тогда
    // есть куда вернуться, если новая запись окажется битой.
    let prev = null;
    try { prev = localStorage.getItem(key); } catch (e) { prev = null; }
    try {
      localStorage.setItem(key, json);
      // Читаем обратно и сверяем длину: так мы замечаем обрыв записи сразу, а не
      // на следующем запуске, когда игра открыла бы пустой дом (v1.3.6).
      const back = localStorage.getItem(key);
      const ok = typeof back === 'string' && back.length === json.length;
      if (prev && prev.length > 40 && prev !== json) {
        try { localStorage.setItem(this.backupKeyFor(this.profileId), prev); } catch (e) {}
      } else if (!prev) {
        // Самое первое сохранение: сразу делаем копию, иначе потерять его нечем
        try { localStorage.setItem(this.backupKeyFor(this.profileId), json); } catch (e) {}
      }
      this.saveFailed = !ok;
    } catch (e) {
      // Молча терять прогресс нельзя: родитель увидит это в статистике
      this.saveFailed = true;
    }
  },

  loadGame() {
    // Читаем сохранение. Если оно побилось (приложение убили в момент записи),
    // поднимаем предыдущее удачное состояние из резервной копии. Раньше в этом
    // случае игра молча начинала «с нуля» и первым же действием затирала дом —
    // именно так у ребёнка «в какой-то момент сбросилась вся мебель» (v1.3.6).
    let data = null;
    let fromBackup = false;
    try {
      const raw = localStorage.getItem(this.saveKeyFor(this.profileId));
      if (raw) { try { data = JSON.parse(raw); } catch (e) { data = null; } }
      if (!data) {
        const bak = localStorage.getItem(this.backupKeyFor(this.profileId));
        if (bak) {
          try { data = JSON.parse(bak); fromBackup = !!data; } catch (e) { data = null; }
        }
      }
    } catch (e) { data = null; }
    if (!data) return false;
    if (typeof data !== 'object') return false;
    this.restoredFromBackup = fromBackup;   // флаг всегда про последнюю загрузку
    try {
      this.stats = { ...this.stats, ...data.stats };
      this.coins = data.coins || 100;
      this.level = data.level || 1;
      this.xp = data.xp || 0;
      this.xpToNext = data.xpToNext || 100;
      this.inventory = data.inventory || [];
      this.achievements = Array.isArray(data.achievements) ? data.achievements.slice() : [];
      // Достижения и долгий прогресс (дни, серия, накопления) — вместе с ними
      this.progress = data.progress ? { ...data.progress } : null;
      this.ensureProgress();
      this.knowledge = { ...this.knowledge, ...data.knowledge };
      this.visitedItems = data.visitedItems || {};
      // Улов рыбалки (v1.3.9): старые сохранения просто получат пустой словарь.
      this.fishSeen = (data.fishSeen && typeof data.fishSeen === 'object') ? { ...data.fishSeen } : {};
      this.timeOfDay = data.timeOfDay || 'morning';
      this.visitedLocations = new Set(data.visitedLocations || []);
      // Сохранения до v1.3.6 копили время в ЦЕЛЫХ минутах (счётчик прибавлялся раз
      // в минуту) — переводим в секунды, чтобы наигранное время не обнулилось
      this.totalPlayTime = data.playTimeUnit === 'sec'
        ? (data.totalPlayTime || 0)
        : (data.totalPlayTime || 0) * 60;
      this.isSick = data.isSick || false;
      this.homeDecor = data.homeDecor || [];
      this.friends = data.friends || [];
      this.localFriendship = data.localFriendship || {};
      this.rooms = data.rooms || null;
      this.activeRoom = data.activeRoom || 'living';
      this.ensureRooms();
      // Миграция v1.0/v1.1: одна комната + плоский список мебели → по комнатам
      this.rooms.living.wall = (data.room && data.room.wall) || this.rooms.living.wall;
      this.rooms.living.floor = (data.room && data.room.floor) || this.rooms.living.floor;
      this.paint = {
        walls: (data.paint && data.paint.walls) ? data.paint.walls.slice() : ['warm'],
        floors: (data.paint && data.paint.floors) ? data.paint.floors.slice() : ['wood']
      };
      this.furnitureColors = data.furnitureColors || {};
      this.outfitsOwned = (data.outfitsOwned || []).slice();
      // Старые сохранения (до v1.2) хранили одну комнату и плоский список мебели.
      // Переносим их в комнаты ТОЛЬКО если комнат в сохранении нет: иначе при
      // каждой загрузке предметы заново «переезжали» в свою основную комнату и
      // двоились (нашлось пробой сохранения в v1.3.6).
      const legacyFurniture = data.rooms ? [] : (data.furniture || []);
      for (const f of legacyFurniture) {
        const roomId = (typeof furnitureRooms === 'function') ? (furnitureRooms(f.id)[0] || 'living') : 'living';
        const target = this.rooms[roomId] || this.rooms.living;
        if (target.furniture.some(x => x.id === f.id)) continue;
        target.furniture.push({ id: f.id, x: f.x, y: f.y });
      }
      // Отделка, которая уже стоит в комнатах, считается купленной
      for (const rk of Object.keys(this.rooms)) {
        if (this.paint.walls.indexOf(this.rooms[rk].wall) === -1) this.paint.walls.push(this.rooms[rk].wall);
        if (this.paint.floors.indexOf(this.rooms[rk].floor) === -1) this.paint.floors.push(this.rooms[rk].floor);
      }
      // Миграция старой мебели (homeDecor без координат) — сразу в подходящую комнату
      if (legacyFurniture.length === 0 && this.homeDecor.length > 0) {
        const known = { sofa: 'sofa', carpet: 'carpet', painting: 'painting', bookshelf: 'bookshelf', aquarium: 'aquarium', plant: 'plant', lamp: 'lamp', tv: 'tv', piano: 'piano', clock: 'clock', bed: 'bed', fridge: 'fridge' };
        this.homeDecor.forEach((d, i) => {
          const id = known[d.id];
          if (!id || !findFurniture(id)) return;
          const roomId = (typeof furnitureRooms === 'function') ? (furnitureRooms(id)[0] || 'living') : 'living';
          const target = this.rooms[roomId] || this.rooms.living;
          if (target.furniture.some(f => f.id === id)) return;
          target.furniture.push({ id: id, x: 0.22 + (i % 4) * 0.19, y: 0.30 + Math.floor(i / 4) * 0.26 });
        });
      }
      this.look = this.migrateLook(Object.assign({ hat: null, glasses: null, neck: null, back: null, bowtie: false, fur: 'classic', char: 'gopher' }, data.look || {}));
      this.isSleeping = !!data.isSleeping;
      this.sleptMinutes = data.sleptMinutes || 0;
      if (data.profileName) this.profileName = data.profileName;
      // Пока приложение было закрыто: сон ЧЕСТНО копит энергию, бодрствование
      // тратит мягко и не ниже «пола» (см. applyOfflineProgress).
      this.offlineReport = null;
      if (data.savedAt) this.applyOfflineProgress(data.savedAt);
      // Профиль загружен (теперь можно считать дни и сохранять) + засчитываем
      // сегодняшний заход: «7 дней подряд» считает именно эти отметки.
      this.profileLoaded = true;
      this.registerDay();
      if (fromBackup) {
        // Дом спасли: говорим об этом ребёнку и переписываем основное сохранение,
        // чтобы копия снова стала «предыдущей», а не единственной.
        this.restoredFromBackup = true;
        this.saveCopies = (this.saveCopies || 0) + 1;
        this.saveGame();
        // Плашка — украшение: если она почему-то не нарисуется, загрузка всё
        // равно должна считаться успешной (иначе игра решит, что дом не открылся)
        try {
          if (typeof this.showAchievement === 'function') {
            this.showAchievement('🛟', '{Pet} дома: дом восстановили из резервной копии');
          }
        } catch (e) {}
      }
      this.lastLoadError = null;
      return true;
    } catch (e) {
      // Ошибку запоминаем: с ней в отчёте видно, обо что споткнулась загрузка
      this.lastLoadError = String(e && e.message ? e.message : e);
      return false;
    }
  },

  // ================= ВРЕМЯ В ИГРЕ (v1.3.6) =================
  // Раньше счётчик прибавлялся ОДИН раз в минуту, а статистика делила его на 60 —
  // поэтому «Время в игре» у всех показывало 0 мин (жалоба 30.09.2026).
  addPlaySeconds(sec) {
    const s = Number(sec);
    // Мусор и «телепорты» времени после сворачивания не считаем
    if (!isFinite(s) || s <= 0 || s > 3600) return this.totalPlayTime;
    this.totalPlayTime = (this.totalPlayTime || 0) + s;
    return this.totalPlayTime;
  },

  // Время в игре словами — для экрана статистики и проверок
  playTimeText() {
    const mins = Math.floor((this.totalPlayTime || 0) / 60);
    if (mins < 1) return 'меньше минуты';
    if (mins < 60) return mins + ' мин';
    return Math.floor(mins / 60) + ' ч ' + (mins % 60) + ' мин';
  },

  // Состояние сохранения словами: видно на экране статистики, проверяется тестами
  saveHealth() {
    if (this.saveFailed) return 'не пишется (кончилось место)';
    if (this.restoredFromBackup) return 'восстановлено из копии';
    return 'в порядке';
  },

  hasSave() {
    try {
      if (localStorage.getItem(this.saveKeyFor(this.profileId))) return true;
      // Основное сохранение побилось, но есть копия — значит прогресс есть,
      // и «Начать игру» (которое всё стирает) показывать нельзя
      return !!localStorage.getItem(this.backupKeyFor(this.profileId));
    } catch (e) {
      return false;
    }
  },

  // Прочитать из сохранения ТОЛЬКО то, что видно прямо в меню: внешний вид,
  // уровень, опыт и монеты. Полный прогресс по-прежнему грузится кнопкой
  // «Продолжить» — меню не подменяет игру, но и врать не должно: раньше ребёнок
  // с сохранением видел в меню «Уровень 1, 0 / 100 XP», хотя в игре у него были
  // и уровень, и опыт (нашлось на живом устройстве при подготовке к RuStore).
  previewFromSave() {
    let data = null;
    try {
      const raw = localStorage.getItem(this.saveKeyFor(this.profileId));
      if (raw) data = JSON.parse(raw);
    } catch (e) { data = null; }
    if (!data) return false;
    if (data.look) this.look = this.migrateLook(data.look);
    if (typeof data.level === 'number') this.level = data.level;
    if (typeof data.xp === 'number') this.xp = data.xp;
    if (typeof data.xpToNext === 'number') this.xpToNext = data.xpToNext;
    if (typeof data.coins === 'number') this.coins = data.coins;
    return true;
  },

  // Прежнее имя (v1.3.0): читало только внешний вид. Оставлено, чтобы старые
  // проверки и сторонний код продолжали работать.
  lookFromSave() { return this.previewFromSave(); },

  resetProgress() {
    this.stats = {
      happiness: 70, hunger: 70, energy: 80, health: 85, cleanliness: 80,
      intelligence: 30, workSkill: 10, schoolSkill: 10, stress: 20
    };
    this.coins = 100;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;
    this.inventory = [];
    this.achievements = [];
    // Долгий прогресс обнуляем, но сегодняшний день уже считается первым:
    // новая игра стартует с «1 день», а «7 дней» придёт на седьмой заход.
    this.progress = null;
    this.popupQueue = [];
    this.lastPopup = null;
    this._popupShownAt = 0;
    const fresh = this.ensureProgress();
    fresh.days = 1;
    fresh.streak = 1;
    fresh.bestStreak = 1;
    fresh.lastDay = this.dayKey();
    this.profileLoaded = true;
    this.knowledge = {
      artMuseum: 0, natureMuseum: 0, spaceMuseum: 0, historyMuseum: 0, library: 0
    };
    this.visitedItems = {};
    this.fishSeen = {};
    this.timeOfDay = 'morning';
    this.currentLocation = 'home';
    this.isSleeping = false;
    this.isSick = false;
    this.visitedLocations = new Set();
    this.totalPlayTime = 0;
    this.homeDecor = [];
    this.friends = [];
    this.localFriendship = {};
    // Дом: 4 комнаты с бесплатной отделкой, мебель начинается с пустой
    this.rooms = null;
    this.ensureRooms();
    this.activeRoom = 'living';
    this.paint = { walls: ['warm'], floors: ['wood'] };
    this.furnitureColors = {};
    this.outfitsOwned = [];
    this.inventory = [];
    // Персонаж — это «кто играет», он сохраняется между сбросами прогресса
    this.look = { hat: null, glasses: null, neck: null, back: null, bowtie: false, fur: 'classic', char: (this.look && this.look.char) || 'gopher' };
    this.isSleeping = false;
    this.offlineReport = null;
    this.justWoke = false;
    this.sleptItems = null;
    this.sleptMinutes = 0;
    this.lastTick = Date.now();
  },

  // Универсальное начисление награды: { stat, amount, coins, energyCost }
  applyReward(reward) {
    if (!reward) return '';
    const parts = [];
    if (reward.coins) {
      this.earnCoins(reward.coins);
      parts.push('🪙+' + reward.coins);
    }
    if (reward.stat && reward.amount) {
      if (reward.stat === 'money') {
        this.earnCoins(reward.amount);
        parts.push('🪙+' + reward.amount);
      } else if (this.stats[reward.stat] !== undefined) {
        this.stats[reward.stat] = Math.min(100, this.stats[reward.stat] + reward.amount);
        parts.push(this.getStatEmoji(reward.stat) + '+' + reward.amount);
      }
    }
    if (reward.energyCost) {
      this.stats.energy = Math.max(0, this.stats.energy - reward.energyCost);
    }
    return parts.join(' ');
  },

  // ================= ВНЕШНИЙ ВИД =================
  setFur(id) {
    const f = findFur(id);
    this.look.fur = f.id;
    this.saveGame();
  },

  // Выбрать персонажа: гофер или другая игрушка (мишка, зайка, котёнок, робот)
  setCharacter(id) {
    if (typeof findCharacter !== 'function') return false;
    const c = findCharacter(id);
    this.look.char = c.id;
    this.saveGame();
    return true;
  },

  characterName() {
    if (typeof findCharacter !== 'function') return 'Питомец';
    return findCharacter(this.look.char).name;
  },

  // Сам герой (описание из CHARACTERS): нужен текстам — по нему берётся имя
  // в нужной форме, род и эмодзи (см. petFill/petWord в helpers.js)
  hero() {
    if (typeof findCharacter !== 'function') return (typeof CHARACTERS !== 'undefined') ? CHARACTERS[0] : null;
    return findCharacter(this.look.char);
  },

  // Эмодзи героя: подписи не должны показывать 🐹 питомцу другой породы
  heroEmoji() {
    const h = this.hero();
    return (h && h.emoji) || '🐾';
  },

  // Как зовут профиль в подписи. Профиль — это «кто играет» (несколько детей на
  // одном устройстве), но по умолчанию он называется «Гофер». Если имя профиля
  // не меняли, честнее показать имя героя: иначе у Милки в углу написано «Гофер»
  profileLabel() {
    const own = (this.profileName || '').trim();
    if (own && own !== DEFAULT_PROFILE_NAME) return own;
    return this.characterName();
  },

  // Герой, записанный в сохранении конкретного профиля: нужен подписям в списке
  // профилей и в списке друзей, пока этот профиль не загружен (v1.3.5).
  characterForProfile(profileId) {
    try {
      const raw = localStorage.getItem(this.saveKeyFor(profileId));
      if (raw) {
        const d = JSON.parse(raw);
        const ch = (d && d.look && d.look.char) || (d && d.character);
        if (ch && typeof findCharacter === 'function') return findCharacter(ch).id;
      }
    } catch (e) {}
    return this.look.char;
  },

  // Имя профиля для списков. Правило то же, что в profileLabel: если профиль не
  // переименовывали, показываем имя его героя. Иначе у Милки в списке профилей и
  // у друзей стоит «Гофер» — ровно то, на что жаловался заказчик в v1.3.4
  // (нашлось на кадре рендера menu@profiles, v1.3.5).
  profileLabelFor(profileId) {
    const pr = this.getProfiles().find(p => p.id === profileId);
    const own = ((pr && pr.name) || '').trim();
    if (own && own !== DEFAULT_PROFILE_NAME) return own;
    if (typeof findCharacter !== 'function') return own || 'Питомец';
    return findCharacter(this.characterForProfile(profileId)).name;
  },

  // Эмодзи героя конкретного профиля: в списке профилей вместо 🐹 должно стоять
  // лицо того, кто там живёт (у Милки — 🐇).
  emojiForProfile(profileId) {
    if (typeof findCharacter !== 'function') return '🐾';
    return findCharacter(this.characterForProfile(profileId)).emoji || '🐾';
  },

  // Привести внешний вид к текущему формату: старые сохранения хранили
  // только «бабочку» флагом bowtie — переносим её в слот neck, а из слота
  // обратно в bowtie (его читает рисущий код и старые коды друзей).
  migrateLook(look) {
    const l = Object.assign({ hat: null, glasses: null, neck: null, back: null, bowtie: false, fur: 'classic', char: 'gopher' }, look || {});
    if (!l.neck) l.neck = l.bowtie ? 'bowtie' : null;
    l.bowtie = l.neck === 'bowtie';
    // Мусор из будущих версий: неизвестный наряд просто снимаем
    if (l.hat && !findOutfit('hat', l.hat)) l.hat = null;
    if (l.glasses && !findOutfit('glasses', l.glasses)) l.glasses = null;
    if (l.neck && !findOutfit('neck', l.neck)) l.neck = null;
    if (l.back && !findOutfit('back', l.back)) l.back = null;
    return l;
  },

  // Надеть наряд: setOutfit('hat', 'cap'). value=null — снять слот.
  setOutfit(slot, value) {
    if (OUTFIT_SLOTS.indexOf(slot) === -1) return false;
    if (value && !findOutfit(slot, value)) return false;
    this.look[slot] = value || null;
    if (slot === 'neck') this.look.bowtie = (value === 'bowtie');
    this.saveGame();
    return true;
  },

  // Наряд куплен? Как обои и пол: покупка один раз, потом надевай бесплатно
  ownsOutfit(slot, value) {
    if (!value) return true;
    return (this.outfitsOwned || []).indexOf(slot + ':' + value) !== -1;
  },

  // Купить и сразу надеть (списание делает магазин, здесь только учёт)
  buyOutfit(slot, value) {
    if (!findOutfit(slot, value)) return false;
    if (!this.outfitsOwned) this.outfitsOwned = [];
    const key = slot + ':' + value;
    if (this.outfitsOwned.indexOf(key) === -1) this.outfitsOwned.push(key);
    this.setOutfit(slot, value);
    return true;
  },

  // Список купленных нарядов (для статистики «что надето»)
  ownedOutfits() {
    return (this.outfitsOwned || []).map(id => {
      const parts = id.split(':');
      const o = findOutfit(parts[0], parts[1]);
      return o ? o.name : id;
    });
  },

  // Что сейчас надето: { hat: 'Кепка', neck: 'Шарф', ... } — для статистики и меню
  lookOutfit() {
    const out = {};
    OUTFIT_SLOTS.forEach(slot => {
      const o = findOutfit(slot, this.look[slot]);
      if (o) out[slot] = o.name;
    });
    return out;
  },

  // Снять всё (кнопка «Без аксессуаров» в магазине)
  clearOutfits() {
    OUTFIT_SLOTS.forEach(slot => { this.look[slot] = null; });
    this.look.bowtie = false;
    this.saveGame();
  },

  // Применить внешний вид к фигурке (единственный источник правды)
  applyLookTo(g) {
    if (!g) return;
    g.hat = this.look.hat || null;
    g.glasses = this.look.glasses || null;
    g.bowtie = this.look.neck === 'bowtie';
    g.scarf = this.look.neck === 'scarf';
    g.backpack = this.look.back === 'backpack';
    g.cape = this.look.back === 'cape';
    g.bodyColor = (this.look.fur && this.look.fur !== 'classic') ? findFur(this.look.fur).color : null;
  },

  // Создать фигурку нужного персонажа с уже применённым внешним видом
  makeCharacter(size) {
    if (typeof createCharacter !== 'function') return new Gopher(null, size || 100);
    return createCharacter(this.look.char, size || 100);
  },

  // ================= ВРЕМЯ И СОН =================
  // Вызывается каждый кадр: пока гофер спит — энергия растёт постепенно.
  tick(dtMs) {
    this.lastTick = Date.now();
    // Плашки достижений идут по очереди (одна за POPUP_MS), а раз в полминуты
    // проверяем, не наступил ли новый день: игру иногда оставляют открытой
    // на ночь, и «дней подряд» должен считаться честно. До нажатия
    // «Продолжить» (профиль ещё не загружен) ничего не считаем и не сохраняем,
    // иначе пустое состояние затёрло бы настоящее сохранение ребёнка.
    this.updatePopups();
    if (this.profileLoaded && this.lastTick - this._dayCheckedAt > 30000) {
      this._dayCheckedAt = this.lastTick;
      this.registerDay(this.lastTick);
      this.checkAchievements();
    }
    if (!this.isSleeping) return;
    const perSec = 100 / (this.SLEEP_FULL_MINUTES * 60);
    const d = (dtMs / 1000) * perSec;
    const before = this.stats.energy;
    this.stats.energy = Math.min(100, this.stats.energy + d);
    this.stats.health = Math.min(100, this.stats.health + d * 0.12);
    this.stats.stress = Math.max(0, this.stats.stress - d * 0.25);
    this.sleptMinutes += dtMs / 60000;
    if (before < 100 && this.stats.energy >= 100 && !this._restNotified) {
      this._restNotified = true;
      this.showAchievement('⚡', 'Энергия полностью восстановлена!');
    }
    // Выспался — просыпается сам (как и с закрытым приложением). Иначе спящий
    // питомец «висит» на экране и держит закрытыми все походы.
    if (this.stats.energy >= 99.5) {
      this.isSleeping = false;
      this.justWoke = true;
      if (this.sleptMinutes >= 5) this.addXP(Math.min(20, Math.round(this.sleptMinutes / 2)));
      this.sleptMinutes = 0;
      this.saveGame();
    }
  },

  startSleep() {
    if (this.isSleeping) return false;
    // Спать есть смысл, только когда есть что восстанавливать: при полной
    // энергии питомец мгновенно проснётся, и это выглядело бы как поломка.
    if (this.stats.energy >= 99) return false;
    this.isSleeping = true;
    this._restNotified = false;
    this.justWoke = false;
    this.sleptMinutes = 0;
    this.lastTick = Date.now();
    this.countAction('sleeps');
    this.saveGame();
    return true;
  },

  wakeUp() {
    if (!this.isSleeping) return false;
    this.isSleeping = false;
    // За долгий сон — немного опыта
    if (this.sleptMinutes >= 5) this.addXP(Math.min(20, Math.round(this.sleptMinutes / 2)));
    this.sleptMinutes = 0;
    this.lastTick = Date.now();
    this.saveGame();
    return true;
  },

  // ================= МЕБЕЛЬ, КОМНАТЫ И ОТДЕЛКА =================
  // Купить вещь: она сразу появляется в подходящей комнате (там, где ей место).
  // roomId можно задать явно — тогда ставим именно в эту комнату.
  buyFurniture(id, roomId) {
    const f = findFurniture(id);
    if (!f) return false;
    if (this.ownsFurniture(id)) return false;
    this.ensureRooms();
    const allowed = (typeof furnitureRooms === 'function') ? furnitureRooms(id) : ['living'];
    let room = roomId && allowed.indexOf(roomId) !== -1 ? roomId : allowed[0];
    if (!this.rooms[room]) room = 'living';
    const spot = this.findFreeSpot(id, room);
    this.rooms[room].furniture.push({ id: id, x: spot.x, y: spot.y });
    this.countAction('furniture');
    this.saveGame();
    return true;
  },

  // Свободное место в комнате для новой вещи.
  // Стена — три яруса, пол — три «глубины»: чем дальше, тем выше по экрану.
  findFreeSpot(id, roomId) {
    const f = findFurniture(id);
    const wall = f && f.zone === 'wall';
    const room = this.rooms[roomId || this.activeRoom] || this.currentRoomData();
    // Ряды: сначала середина комнаты (видно и не мешает герою), потом передний
    // план, и только затем глубина. В центре (x = 0.5) места нет: там стоит герой.
    // Крупную мебель (рояль, камин, шкаф) ставим сразу вперёд: у стены она
    // читается как висящая на стене картина.
    const big = f && (f.k || 1) >= 1.5;
    const rowsFloor = big ? [0.86, 0.55, 0.28] : [0.55, 0.28, 0.86];
    const rowsWall = [0.35, 0.70, 0.12];
    const colsWall = [0.16, 0.385, 0.61, 0.835];
    // Впереди, по центру, стоит сам герой: крупную вещь туда не ставим,
    // иначе она закрывает ему лапы и мордочку.
    const colsFront = [0.16, 0.84];
    // Окно нарисовано в правой части стены (от 0.64 ширины комнаты): сюда
    // вещь не ставим ни центром, ни краем — иначе рама окна режет зеркало.
    const colsWallTop = [0.16, 0.385, 0.565];
    const rows = wall ? rowsWall : rowsFloor;
    const colsFor = (row) => {
      if (wall) {
        if (rows[row] >= 0.6) return colsWall;
        // Верхняя полоса стены: широкая вещь (картина в раме) в правой колонке
        // достала бы до окна — ей оставляем только левую часть стены.
        return (f && (f.k || 1) >= 1.2) ? colsWallTop.slice(0, 2) : colsWallTop;
      }
      return rows[row] >= 0.8 ? colsFront : [0.16, 0.385, 0.61, 0.835];
    };
    // Из свободных мест берём то, что дальше всего от уже стоящих вещей, но
    // сначала заполняем самый пустой ряд — иначе вся мебель сбивается вперёд,
    // а верх комнаты остаётся голым.
    let best = null, bestScore = -1;
    for (let row = 0; row < rows.length; row++) {
      const y = rows[row];
      const rowCols = colsFor(row);
      const inRow = room.furniture.filter(it => Math.abs(it.y - y) < 0.13).length;
      for (let col = 0; col < rowCols.length; col++) {
        const x = rowCols[col];
        let nearest = 9, busy = false;
        for (const it of room.furniture) {
          const dx = Math.abs(it.x - x), dy = Math.abs(it.y - y);
          if (dx < 0.14 && dy < 0.20) busy = true;
          const d = dx + dy;
          if (d < nearest) nearest = d;
        }
        if (busy) continue;
        const score = (4 - inRow) * 10 + nearest;
        if (score > bestScore) { bestScore = score; best = { x: x, y: y }; }
      }
    }
    if (best) return best;
    // Комната забита под завязку: не сваливаем всё в одну точку, а ищем самое
    // свободное место — иначе мебель встаёт стопкой в центре комнаты.
    const fineCols = [0.12, 0.20, 0.29, 0.38, 0.47, 0.56, 0.65, 0.74, 0.83, 0.90];
    const fineRows = wall ? [0.06, 0.14, 0.22, 0.30, 0.38, 0.46]
                          : [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90];
    for (const y of fineRows) {
      for (const x of fineCols) {
        // Те же запреты, что и в сетке: окно и место героя
        if (wall && x > 0.7 && y < 0.6) continue;
        if (!wall && y >= 0.8 && Math.abs(x - 0.5) < 0.2) continue;
        let nearest = 9;
        for (const it of room.furniture) {
          const d = Math.abs(it.x - x) + Math.abs(it.y - y);
          if (d < nearest) nearest = d;
        }
        if (nearest > bestScore) { bestScore = nearest; best = { x: x, y: y }; }
      }
    }
    return best || { x: 0.5, y: 0.5 };
  },

  ownsFurniture(id) {
    return this.inventory.indexOf(id) !== -1 || this.roomOfItem(id) !== null;
  },

  // Поставить предмет из инвентаря (или переставить уже стоящий)
  placeFurniture(id, x, y) {
    const f = findFurniture(id);
    if (!f) return false;
    this.ensureRooms();
    const allowed = (typeof furnitureRooms === 'function') ? furnitureRooms(id) : ['living'];
    let room = this.activeRoom;
    if (allowed.indexOf(room) === -1) room = allowed[0];       // вещь уходит туда, где ей место
    const idx = this.inventory.indexOf(id);
    if (idx !== -1) this.inventory.splice(idx, 1);
    const was = this.roomOfItem(id);
    if (was) {
      // переносим между комнатами, если понадобилось
      const i0 = this.rooms[was].furniture.findIndex(it => it.id === id);
      if (i0 !== -1) this.rooms[was].furniture.splice(i0, 1);
    }
    this.rooms[room].furniture.push({ id: id, x: x, y: y });
    this.saveGame();
    return true;
  },

  // x, y — доли 0..1 внутри зоны предмета (стена или пол)
  moveFurniture(id, x, y) {
    const roomId = this.roomOfItem(id);
    if (!roomId) return;
    const it = this.rooms[roomId].furniture.find(f => f.id === id);
    if (!it) return;
    it.x = Math.max(0.06, Math.min(0.94, x));
    it.y = Math.max(0, Math.min(1, y));
    this.saveGame();
  },

  // Убрать в инвентарь
  removeFurniture(id) {
    const roomId = this.roomOfItem(id);
    if (!roomId) return false;
    const idx = this.rooms[roomId].furniture.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.rooms[roomId].furniture.splice(idx, 1);
    if (this.inventory.indexOf(id) === -1) this.inventory.push(id);
    this.saveGame();
    return true;
  },

  // ---- Перекраска мебели: платная услуга ----
  // Цена зависит от стоимости вещи (см. recolorCost).
  paintFurniture(id, colorIdx) {
    const f = findFurniture(id);
    if (!f || !f.palette) return { ok: false, reason: 'no-palette' };
    if (this.colorIndex(id) === colorIdx) return { ok: false, reason: 'same' };
    const price = recolorCost(id);
    if (!this.canAfford(price)) return { ok: false, reason: 'money', price: price };
    this.spendCoins(price);
    this.furnitureColors[id] = colorIdx;
    this.saveGame();
    return { ok: true, price: price, color: f.palette[colorIdx % f.palette.length] };
  },

  // ---- Обои и пол: покупка набора, применение бесплатное ----
  ownsWall(id) { return this.paint.walls.indexOf(id) !== -1; },
  ownsFloor(id) { return this.paint.floors.indexOf(id) !== -1; },

  buyWall(id) {
    const w = (typeof WALLS !== 'undefined') ? WALLS.find(x => x.id === id) : null;
    if (!w) return { ok: false, reason: 'none' };
    if (this.ownsWall(id)) return { ok: false, reason: 'owned' };
    if (!this.canAfford(w.cost)) return { ok: false, reason: 'money', price: w.cost };
    this.spendCoins(w.cost);
    this.paint.walls.push(id);
    this.saveGame();
    return { ok: true, price: w.cost };
  },

  buyFloor(id) {
    const fl = (typeof FLOORS !== 'undefined') ? FLOORS.find(x => x.id === id) : null;
    if (!fl) return { ok: false, reason: 'none' };
    if (this.ownsFloor(id)) return { ok: false, reason: 'owned' };
    if (!this.canAfford(fl.cost)) return { ok: false, reason: 'money', price: fl.cost };
    this.spendCoins(fl.cost);
    this.paint.floors.push(id);
    this.saveGame();
    return { ok: true, price: fl.cost };
  },

  // Применить обои/пол в активной комнате. Владельцу — бесплатно,
  // некупленный набор сначала нужно купить (это и есть «перекраска за деньги»).
  setWall(id) {
    if (!findWall(id)) return false;
    const w = (typeof WALLS !== 'undefined') ? WALLS.find(x => x.id === id) : null;
    if (w && w.cost > 0 && !this.ownsWall(id)) {
      const res = this.buyWall(id);
      if (!res.ok) return false;
    }
    if (!this.ownsWall(id)) this.paint.walls.push(id);
    this.currentRoomData().wall = id;
    this.saveGame();
    return true;
  },

  setFloor(id) {
    if (!findFloor(id)) return false;
    const fl = (typeof FLOORS !== 'undefined') ? FLOORS.find(x => x.id === id) : null;
    if (fl && fl.cost > 0 && !this.ownsFloor(id)) {
      const res = this.buyFloor(id);
      if (!res.ok) return false;
    }
    if (!this.ownsFloor(id)) this.paint.floors.push(id);
    this.currentRoomData().floor = id;
    this.saveGame();
    return true;
  },

  // Сколько мебели всего куплено
  furnitureCount() {
    let n = this.inventory.length;
    for (const id of Object.keys(this.rooms || {})) n += this.rooms[id].furniture.length;
    return n;
  },

  // ================= ПРОФИЛИ (несколько гоферов на устройстве) =================
  saveKeyFor(profileId) {
    return profileId === 'p1' ? 'gopherlife_save' : 'gopherlife_save_' + profileId;
  },

  // Резервная копия сохранения: в неё кладём ПРЕДЫДУЩЕЕ удачное состояние.
  // Нужна, если приложение убьют в момент записи и файл сохранения побьётся
  // (жалоба «сбросилась вся купленная мебель», v1.3.6).
  backupKeyFor(profileId) {
    return this.saveKeyFor(profileId) + '_bak';
  },

  getProfiles() {
    try {
      const raw = localStorage.getItem(this.PROFILE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (e) {}
    return [{ id: 'p1', name: DEFAULT_PROFILE_NAME }];
  },

  saveProfiles(list) {
    try { localStorage.setItem(this.PROFILE_KEY, JSON.stringify(list)); } catch (e) {}
  },

  switchProfile(id) {
    const pr = this.getProfiles().find(p => p.id === id);
    if (!pr) return false;
    this.saveGame();
    this.profileId = pr.id;
    this.profileName = pr.name;
    return true;
  },

  // Другие гоферы на этом же устройстве — можно ходить к ним в гости
  getLocalFriends() {
    const out = [];
    for (const pr of this.getProfiles()) {
      if (pr.id === this.profileId) continue;
      try {
        const raw = localStorage.getItem(this.saveKeyFor(pr.id));
        if (!raw) continue;
        const d = JSON.parse(raw);
        out.push({
          id: 'local_' + pr.id,
          // Имя в гостях — по тому же правилу: у профиля без своего имени это имя
          // его героя (v1.3.5), иначе друг-Милка подписан «Гофером»
          name: this.profileLabelFor(pr.id),
          emoji: '🐹',
          trait: 'питомец с этого устройства',
          level: d.level || 1,
          friendship: (this.localFriendship && this.localFriendship['local_' + pr.id]) || 25,
          decor: [],
          room: d.room || { wall: 'warm', floor: 'wood' },
          furniture: (d.furniture || []).slice(),
          hat: (d.look && d.look.hat) || null,
          glasses: (d.look && d.look.glasses) || null,
          neck: (d.look && d.look.neck) || ((d.look && d.look.bowtie) ? 'bowtie' : null),
          back: (d.look && d.look.back) || null,
          bowtie: !!(d.look && d.look.bowtie),
          fur: (d.look && d.look.fur) || 'classic',
          local: true
        });
      } catch (e) {}
    }
    return out;
  },

  addDecor(id, emoji, name) {
    if (!this.homeDecor.find(d => d.id === id)) {
      this.homeDecor.push({ id, emoji, name, x: 0.5, y: 0.5 });
      this.saveGame();
    }
  },

  // ================= КОДЫ ДРУЗЕЙ =================
  // Два формата:
  //  1) КОРОТКИЙ код (16 символов вида A3KF-9M2P-QR7T-VB5G) — его можно
  //     надиктовать голосом или набрать руками: в нём обои, пол, окрас,
  //     персонаж и 6 предметов гостиной.
  //  2) ПОЛНЫЙ код (длинный) — копируется и вставляется одной кнопкой:
  //     в нём весь дом со всеми комнатами.
  // Разбираем сами: короткий — если 16 символов из нашего алфавита,
  // иначе пробуем длинный.
  addFriendCode(raw, name) {
    const code = String(raw || '').trim();
    if (!code) return { ok: false, reason: 'empty' };
    // Пробелы и дефисы не мешают: код можно набирать группами
    const compact = code.replace(/[\s\-–—]/g, '');
    const upper = compact.toUpperCase();
    // Короткий код: ровно 16 символов нашего алфавита (без I и O)
    if (compact.length === 16 && /^[0-9A-Z]+$/.test(upper) && /^[0-9A-HJ-NP-Z]+$/.test(upper)) {
      const data = this.unpackShortCode(upper);
      if (!data) return { ok: false, reason: 'bad-short' };
      return this.addFriendData(data, name);
    }
    // Полный код v4 (v1.3.12): наш алфавит — цифры и заглавные буквы, со
    // контрольной суммой. Регистр не важен: мессенджер мог испортить его, а код
    // всё равно читается. Если не сошлось — пробуем base64 (коды старых версий).
    if (/^[0-9A-Z]+$/.test(upper) && /^[0-9A-HJ-NP-Z]+$/.test(upper)) {
      const packed = this.unpackFullCode(upper);
      if (packed) return this.addFriendData(packed, name);
    }
    // Длинный код: base64 с JSON внутри (регистр букв важен!)
    try {
      const bin = atob(compact);
      let data;
      try { data = JSON.parse(decodeURIComponent(escape(bin))); }
      catch (e) { data = JSON.parse(bin); }
      if (data && data.name) return this.addFriendData(data, name);
    } catch (e) {}
    return { ok: false, reason: 'bad-code' };
  },

  // Добавить друга из разобранных данных (короткий или полный код)
  addFriendData(data, name) {
    const fname = String(data.name || name || 'Друг').trim().slice(0, 16) || 'Друг';
    if (this.friends.find(f => f.name === fname)) return { ok: false, reason: 'exists', name: fname };
    const look = data.look || { hat: data.hat, glasses: data.glasses, bowtie: data.bowtie, fur: data.fur, char: data.char };
    const rooms = data.rooms || null;
    let room = data.room || { wall: 'warm', floor: 'wood' };
    let furniture = (data.furniture || []).map(f => ({ id: f.id, x: f.x, y: f.y }));
    if (rooms && rooms.living) {
      room = { wall: rooms.living.wall || room.wall, floor: rooms.living.floor || room.floor };
      furniture = (rooms.living.furniture || []).map(f => ({ id: f.id, x: f.x, y: f.y }));
    }
    // вещи, которых нет в каталоге этой версии, тихо выкидываем
    furniture = furniture.filter(f => typeof findFurniture !== 'function' || findFurniture(f.id));
    this.friends.push({
      id: 'code_' + fname + '_' + Date.now().toString(36),
      name: fname,
      emoji: '🐹',
      trait: data.trait || 'друг по переписке',
      level: data.level || 1,
      levelCapped: !!data.levelCapped,   // в коротком коде уровень ограничен «8+»
      friendship: 20,
      decor: [],
      room: room,
      furniture: furniture,
      rooms: rooms,
      hat: (look && look.hat) || null,
      glasses: (look && look.glasses) || null,
      neck: (look && look.neck) || ((look && look.bowtie) ? 'bowtie' : null),
      back: (look && look.back) || null,
      bowtie: !!(look && look.bowtie),
      fur: (look && look.fur) || 'classic',
      char: (look && look.char) || 'gopher'
    });
    this.saveGame();
    return { ok: true, name: fname };
  },

  // Совместимость: старый вызов возвращает true/false
  addFriend(code) {
    return this.addFriendCode(code).ok;
  },

  // ПОЛНЫЙ код (v4, v1.3.12) — тот же дом, но упакован битами и записан нашим
  // алфавитом: цифры и ЗАГЛАВНЫЕ латинские буквы без I и O, группами по 4 знака.
  //
  // Заказчик 01.10.2026: «нельзя ли как-то коды сделать менее страшными для
  // пересылки? Обязательно прям такие огромные?» Раньше полный код был base64 от
  // JSON: 624 знака даже на пустом доме и под три тысячи на обставленном, со
  // строчными буквами и знаками «+/=», которые мессенджеры любят портить.
  // Стало: 90–200 знаков, только цифры и заглавные буквы, группы по четыре.
  //
  // Что внутри (по битам): версия 4 · длина имени (байты) и само имя в UTF-8 ·
  // уровень · монеты · наряды (персонаж, окрас, шляпа, очки, шея, спина) ·
  // четыре комнаты: обои, пол, количество предметов и сами предметы с местом
  // (место — сетка 16×16, этого хватает: в гостях комната рисуется как есть).
  // Цвета мебели в код не кладём: в гостях они не показываются, а место в коде они
  // занимали заметное. Старые коды продолжают работать: короткие (16 знаков) и
  // полные base64 (v3) — их присылают друзья со старыми версиями приложения.
  getMyCode() {
    const bits = [];
    const idxOf = (arr, id) => {
      const i = (arr || []).findIndex(x => (x.id || x.value) === id);
      return i < 0 ? 0 : i;
    };
    const name = this.profileName && this.profileName !== DEFAULT_PROFILE_NAME
      ? this.profileName
      : this.characterName() + '#' + (this.level * 100 + Math.floor(this.coins / 10)).toString(36);
    const nameBytes = utf8ToBytes(String(name).slice(0, 16)).slice(0, 31);
    pushBits(bits, 4, 3);                                        // версия формата
    pushBits(bits, nameBytes.length, 5);                         // сколько байт в имени
    nameBytes.forEach(b => pushBits(bits, b, 8));
    pushBits(bits, Math.max(1, Math.min(255, this.level | 0)), 8);
    pushBits(bits, Math.max(0, Math.min(1048575, Math.floor(this.coins || 0))), 20);
    const look = this.look || {};
    const chars = (typeof CHARACTERS !== 'undefined') ? CHARACTERS : [{ id: 'gopher' }];
    const furs = (typeof FURS !== 'undefined') ? FURS : [{ id: 'classic' }];
    pushBits(bits, idxOf(chars, look.char) & 7, 3);              // персонаж
    pushBits(bits, idxOf(furs, look.fur) & 7, 3);                // окрас
    pushBits(bits, Math.max(0, SHORT_HATS.indexOf(look.hat || null)), 3);
    pushBits(bits, Math.max(0, SHORT_GLASSES.indexOf(look.glasses || null)), 2);
    pushBits(bits, Math.max(0, SHORT_NECK.indexOf(look.neck || null)), 2);
    pushBits(bits, Math.max(0, SHORT_BACK.indexOf(look.back || null)), 2);
    const walls = (typeof WALLS !== 'undefined') ? WALLS : [{ id: 'warm' }];
    const floors = (typeof FLOORS !== 'undefined') ? FLOORS : [{ id: 'wood' }];
    const rooms = this.serializedRooms() || {};
    FULL_CODE_ROOMS.forEach(key => {
      const r = rooms[key] || {};
      pushBits(bits, idxOf(walls, r.wall) & 15, 4);              // обои комнаты
      pushBits(bits, idxOf(floors, r.floor) & 7, 3);             // пол комнаты
      const items = (r.furniture || []).slice(0, 31);
      pushBits(bits, items.length, 5);
      items.forEach(it => {
        const fi = (typeof FURNITURE !== 'undefined' && Array.isArray(FURNITURE))
          ? FURNITURE.findIndex(f => f.id === it.id) : -1;
        pushBits(bits, (fi >= 0 && fi < 127) ? fi + 1 : 0, 7);   // 0 = предмета нет
        pushBits(bits, Math.max(0, Math.min(15, Math.round((it.x || 0) * 15))), 4);
        pushBits(bits, Math.max(0, Math.min(15, Math.round((it.y || 0) * 15))), 4);
      });
    });
    const body = bitsToCode32(bits);
    const code = body + code32Checksum(body);
    return code.replace(/(.{4})(?=.)/g, '$1-');
  },

  // КОРОТКИЙ код: 16 символов группами по 4 — можно надиктовать по телефону
  // или набрать руками (длинный код руками не набрать, поэтому он и не нужен).
  //
  // Формат v2 (v1.3): добавились наряды на шею и за спину, поэтому биты
  // пересобраны (75 бит = 15 символов по 5 бит + контрольный символ):
  //   версия 2 · персонаж 3 · окрас 3 · обои 4 · пол 3 · шляпа 3 · очки 2 ·
  //   шея 2 · спина 2 · уровень 3 · 6 × (предмет 5 + место 3)
  // Старые коды (версия 1) по-прежнему ЧИТАЮТСЯ — их присылают друзья
  // со старыми версиями приложения (см. unpackShortCode).
  getShortCode() {
    const bits = [];
    const room = this.currentRoomData();
    const idxOf = (arr, id) => {
      const i = (arr || []).findIndex(x => x.id === id);
      return i < 0 ? 0 : i;
    };
    const charIdx = (typeof CHARACTERS !== 'undefined') ? idxOf(CHARACTERS, this.look.char) : 0;
    const furIdx = (typeof FURS !== 'undefined') ? idxOf(FURS, this.look.fur) : 0;
    const wallIdx = (typeof WALLS !== 'undefined') ? idxOf(WALLS, room.wall) : 0;
    const floorIdx = (typeof FLOORS !== 'undefined') ? idxOf(FLOORS, room.floor) : 0;
    const hatIdx = SHORT_HATS.indexOf(this.look.hat || null);
    const glassIdx = SHORT_GLASSES.indexOf(this.look.glasses || null);
    const neckIdx = SHORT_NECK.indexOf(this.look.neck || null);
    const backIdx = SHORT_BACK.indexOf(this.look.back || null);
    pushBits(bits, 2, 2);                                       // версия формата (v2)
    pushBits(bits, charIdx & 7, 3);                             // персонаж
    pushBits(bits, furIdx & 7, 3);                              // окрас (7 окрасов)
    pushBits(bits, (wallIdx & 15), 4);                          // обои
    pushBits(bits, (floorIdx & 7), 3);                          // пол
    pushBits(bits, hatIdx < 0 ? 0 : hatIdx, 3);                 // шляпа (5 видов)
    pushBits(bits, glassIdx < 0 ? 0 : glassIdx, 2);             // очки
    pushBits(bits, neckIdx < 0 ? 0 : neckIdx, 2);               // шея: шарф/бабочка
    pushBits(bits, backIdx < 0 ? 0 : backIdx, 2);               // спина: рюкзак/плащ
    pushBits(bits, Math.max(0, Math.min(SHORT_LEVEL_MAX - 1, this.level - 1)), 3); // уровень (8 = «8+»)
    const items = (room.furniture || []).slice(0, 6);
    for (let i = 0; i < 6; i++) {
      const it = items[i];
      const fi = it ? FURNITURE.findIndex(f => f.id === it.id) : -1;
      pushBits(bits, (fi >= 0 && fi < 31) ? (fi + 1) : 0, 5);   // предмет (0 = пусто)
      let pos = 0;
      if (it) {
        const col = Math.max(0, Math.min(3, Math.round((it.x - 0.16) / 0.215)));
        const row = (it.y >= 0.5) ? 1 : 0;
        pos = row * 4 + col;
      }
      pushBits(bits, pos, 3);                                   // место в сетке 4×2
    }
    const body = bitsToCode32(bits);                            // 15 символов
    const full = body + code32Checksum(body);                   // + контрольный
    return full.replace(/(.{4})(?=.)/g, '$1-');
  },

  // Разбор короткого кода: строгая проверка контрольной суммы.
  // Поддерживаются обе версии: 1 (старые приложения) и 2 (с нарядами).
  unpackShortCode(raw) {
    const clean = String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (clean.length !== 16) return null;
    const body = clean.slice(0, 15), sum = clean.slice(15);
    if (code32Checksum(body) !== sum) return null;
    const bits = code32ToBits(clean);
    if (!bits) return null;
    let p = 0;
    const ver = readBits(bits, p, 2); p += 2;
    if (ver !== 1 && ver !== 2) return null;

    // Общая часть у обеих версий (в v2 окрас/пол занимают меньше бит)
    const charIdx = readBits(bits, p, 3); p += 3;
    const furIdx = readBits(bits, p, ver === 1 ? 4 : 3); p += (ver === 1 ? 4 : 3);
    const wallIdx = readBits(bits, p, 4); p += 4;
    const floorIdx = readBits(bits, p, ver === 1 ? 4 : 3); p += (ver === 1 ? 4 : 3);
    const hatIdx = readBits(bits, p, ver === 1 ? 2 : 3); p += (ver === 1 ? 2 : 3);
    const glassIdx = readBits(bits, p, 2); p += 2;
    let neck = null, back = null;
    if (ver === 1) {
      neck = readBits(bits, p, 1) ? 'bowtie' : null; p += 1;
    } else {
      neck = SHORT_NECK[readBits(bits, p, 2)] || null; p += 2;
      back = SHORT_BACK[readBits(bits, p, 2)] || null; p += 2;
    }
    const levelBits = ver === 1 ? 5 : 3;
    const levelRaw = readBits(bits, p, levelBits); p += levelBits;
    const levelCapped = ver === 2 && levelRaw >= SHORT_LEVEL_MAX - 1;
    const level = levelRaw + 1;
    const furniture = [];
    for (let i = 0; i < 6; i++) {
      const itemIdx = readBits(bits, p, 5); p += 5;
      const pos = readBits(bits, p, 3); p += 3;
      if (!itemIdx) continue;
      const f = FURNITURE[itemIdx - 1];
      if (!f) continue;
      const col = pos % 4, row = Math.floor(pos / 4);
      furniture.push({ id: f.id, x: 0.16 + col * 0.215, y: row ? 0.62 : 0.25 });
    }
    const chars = (typeof CHARACTERS !== 'undefined') ? CHARACTERS : [{ id: 'gopher' }];
    const furs = (typeof FURS !== 'undefined') ? FURS : [{ id: 'classic' }];
    return {
      name: null,
      level: level,
      levelCapped: levelCapped,
      trait: 'друг по короткому коду',
      room: {
        wall: ((typeof WALLS !== 'undefined' ? WALLS[wallIdx] : null) || {}).id || 'warm',
        floor: ((typeof FLOORS !== 'undefined' ? FLOORS[floorIdx] : null) || {}).id || 'wood',
        furniture: furniture
      },
      furniture: furniture,
      look: {
        char: (chars[charIdx] || chars[0]).id,
        fur: (furs[furIdx] || furs[0]).id,
        hat: SHORT_HATS[hatIdx] || null,
        glasses: SHORT_GLASSES[glassIdx] || null,
        neck: neck,
        back: back,
        bowtie: neck === 'bowtie'
      }
    };
  },

  // Разбор полного кода v4 (см. getMyCode). Проверяем контрольную сумму и версию:
  // повреждённый или чужой код возвращает null, и вызывающий код идёт дальше —
  // пробует base64 (полные коды старых версий).
  unpackFullCode(raw) {
    const clean = String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (clean.length < 10) return null;
    const body = clean.slice(0, -1), sum = clean.slice(-1);
    if (code32Checksum(body) !== sum) return null;
    const bits = code32ToBits(clean);
    if (!bits) return null;
    let p = 0;
    if (readBits(bits, p, 3) !== 4) return null; p += 3;
    const nBytes = readBits(bits, p, 5); p += 5;
    const bytes = [];
    for (let i = 0; i < nBytes; i++) { bytes.push(readBits(bits, p, 8)); p += 8; }
    const name = bytesToUtf8(bytes);
    const level = readBits(bits, p, 8); p += 8;
    const coins = readBits(bits, p, 20); p += 20;
    const charIdx = readBits(bits, p, 3); p += 3;
    const furIdx = readBits(bits, p, 3); p += 3;
    const hatIdx = readBits(bits, p, 3); p += 3;
    const glassIdx = readBits(bits, p, 2); p += 2;
    const neckIdx = readBits(bits, p, 2); p += 2;
    const backIdx = readBits(bits, p, 2); p += 2;
    const chars = (typeof CHARACTERS !== 'undefined') ? CHARACTERS : [{ id: 'gopher' }];
    const furs = (typeof FURS !== 'undefined') ? FURS : [{ id: 'classic' }];
    const walls = (typeof WALLS !== 'undefined') ? WALLS : [{ id: 'warm' }];
    const floors = (typeof FLOORS !== 'undefined') ? FLOORS : [{ id: 'wood' }];
    const rooms = {};
    FULL_CODE_ROOMS.forEach(key => {
      const w = readBits(bits, p, 4); p += 4;
      const fl = readBits(bits, p, 3); p += 3;
      const n = readBits(bits, p, 5); p += 5;
      const furniture = [];
      for (let i = 0; i < n; i++) {
        const fi = readBits(bits, p, 7); p += 7;
        const x = readBits(bits, p, 4); p += 4;
        const y = readBits(bits, p, 4); p += 4;
        if (!fi) continue;
        const f = (typeof FURNITURE !== 'undefined') ? FURNITURE[fi - 1] : null;
        if (!f) continue;
        furniture.push({ id: f.id, x: x / 15, y: y / 15 });
      }
      rooms[key] = {
        wall: (walls[w] || walls[0]).id,
        floor: (floors[fl] || floors[0]).id,
        furniture: furniture
      };
    });
    const living = rooms.living || { wall: 'warm', floor: 'wood', furniture: [] };
    return {
      v: 4,
      name: name,
      level: level || 1,
      coins: coins,
      rooms: rooms,
      room: { wall: living.wall, floor: living.floor },
      furniture: living.furniture,
      look: {
        char: (chars[charIdx] || chars[0]).id,
        fur: (furs[furIdx] || furs[0]).id,
        hat: SHORT_HATS[hatIdx] || null,
        glasses: SHORT_GLASSES[glassIdx] || null,
        neck: SHORT_NECK[neckIdx] || null,
        back: SHORT_BACK[backIdx] || null,
        bowtie: SHORT_NECK[neckIdx] === 'bowtie'
      },
      trait: 'друг по коду'
    };
  },

  // Ручное открытие достижения (например, из проверок или будущих наград).
  // Проверяем, что id есть в каталоге, и не открываем дважды.
  addAch(id, opts) {
    const a = this.achievementList().find(x => x.id === id);
    if (!a || this.isAchUnlocked(id)) return false;
    this.achievements.push(id);
    if (!opts || opts.silent !== true) this.queuePopup('🏆', 'Достижение: ' + a.name);
    this.saveGame();
    return true;
  },

  getRandomEvent() {
    const events = [
      { emoji: '🪙', text: '{Pet} {pet:нашёл|нашла} монетку!', effect: () => { this.earnCoins(10); }, chance: 0.15 },
      { emoji: '⭐', text: '{Pet} {pet:нашёл|нашла} золотую монетку!', effect: () => { this.earnCoins(25); }, chance: 0.05 },
      { emoji: '🎁', text: '{Pet} {pet:получил|получила} подарок!', effect: () => { this.stats.happiness = Math.min(100, this.stats.happiness + 20); }, chance: 0.08 },
      { emoji: '🤒', text: '{Pet} {pet:заболел|заболела}! Нужно к врачу!', effect: () => { this.isSick = true; this.stats.health = Math.max(10, this.stats.health - 20); }, chance: 0.06 },
      { emoji: '🌟', text: '{Pet} {pet:нашёл|нашла} опыт!', effect: () => { this.addXP(20); }, chance: 0.1 },
      { emoji: '🎉', text: 'Угощение от друга! Счастье +10', effect: () => { this.stats.happiness = Math.min(100, this.stats.happiness + 10); }, chance: 0.07 },
      { emoji: '😴', text: '{Pet} {pet:устал|устала}. Энергия -10', effect: () => { this.stats.energy = Math.max(0, this.stats.energy - 10); }, chance: 0.1 },
      { emoji: '💰', text: 'Премия! +30 монет', effect: () => { this.earnCoins(30); }, chance: 0.05 },
    ];
    const totalChance = events.reduce((s, e) => s + e.chance, 0);
    let r = Math.random() * totalChance;
    for (const ev of events) {
      r -= ev.chance;
      if (r <= 0) {
        ev.effect();
        return ev;
      }
    }
    return null;
  }
};

// ============ КОРОТКИЙ КОД ДРУГА: КОДИРОВАНИЕ ============
// 5 бит на символ, алфавит без похожих букв (нет I и O — их путают с 1 и 0).
// Длинный код руками не набрать, поэтому для диктовки есть короткий: 16
// символов группами по 4 + контрольный символ (защита от опечатки).
const CODE32 = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
// Порядок комнат в полном коде друга (v4): он должен быть одинаковым при сборке и
// разборе, иначе комнаты перепутаются местами.
const FULL_CODE_ROOMS = ['living', 'bedroom', 'kitchen', 'bathroom'];
// Наборы для короткого кода: индекс — это биты в коде. v2 (v1.3) добавил
// кепку и бантик к шляпам, шарф к шее и рюкзак/плащ за спину.
const SHORT_HATS = [null, 'scientist', 'chef', 'crown', 'cap', 'bow'];
const SHORT_GLASSES = [null, 'nerd', 'cool'];
const SHORT_NECK = [null, 'bowtie', 'scarf'];
const SHORT_BACK = [null, 'backpack', 'cape'];
const SHORT_LEVEL_MAX = 8;      // в коротком коде уровень 1..8, дальше — «8+»

function pushBits(bits, value, n) {
  for (let i = n - 1; i >= 0; i--) bits.push((value >> i) & 1);
}

function readBits(bits, pos, n) {
  let v = 0;
  for (let i = 0; i < n; i++) v = (v << 1) | (bits[pos + i] || 0);
  return v;
}

function bitsToCode32(bits) {
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    let v = 0;
    for (let j = 0; j < 5; j++) v = (v << 1) | (bits[i + j] || 0);
    out += CODE32[v];
  }
  return out;
}

function code32ToBits(str) {
  const bits = [];
  for (const ch of String(str)) {
    const v = CODE32.indexOf(ch);
    if (v === -1) return null;
    for (let j = 4; j >= 0; j--) bits.push((v >> j) & 1);
  }
  return bits;
}

function code32Checksum(body) {
  let sum = 7;
  for (let i = 0; i < body.length; i++) {
    sum = (sum * 31 + CODE32.indexOf(body[i])) % 32;
  }
  return CODE32[sum < 0 ? 0 : sum];
}

window.CODE32 = CODE32;
window.DEFAULT_PROFILE_NAME = DEFAULT_PROFILE_NAME;
window.System = System;

