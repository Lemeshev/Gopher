// ============ СИСТЕМА ХАРАКТЕРИСТИК ============
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
  knowledge: {
    artMuseum: 0,
    natureMuseum: 0,
    spaceMuseum: 0,
    historyMuseum: 0,
    library: 0
  },
  // Просмотренные предметы локаций: { 'art_museum': ['art_museum:Мона Лиза', ...] }
  visitedItems: {},
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
  // char — персонаж: 'gopher' | 'bear' | 'bunny' | 'cat' | 'robot'
  look: { hat: null, glasses: null, bowtie: false, fur: 'classic', char: 'gopher' },

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
  offlineReport: null,          // что случилось, пока приложение было закрыто
  lastTick: 0,
  sleptMinutes: 0,


  // ---- Профиль (несколько детей на одном устройстве) ----
  profileId: 'p1',
  profileName: 'Гофер',
  PROFILE_KEY: 'gopherlife_profiles',
  timeOfDay: 'morning',  // morning, afternoon, evening, night
  currentLocation: 'home',
  isSleeping: false,
  isSick: false,
  visitedLocations: new Set(),
  totalPlayTime: 0,
  lastSaveTime: Date.now(),

  getStatColor(stat) {
    const val = this.stats[stat];
    // Стресс — «чем меньше, тем лучше», поэтому цвета перевёрнуты
    if (stat === 'stress') {
      if (val > 60) return '#ef4444';
      if (val > 30) return '#fbbf24';
      return '#4ade80';
    }
    if (val > 60) return '#4ade80';
    if (val > 30) return '#fbbf24';
    return '#ef4444';
  },

  getStatEmoji(stat) {
    const map = {
      happiness: '❤️', hunger: '🍗', energy: '😴',
      health: '🏥', cleanliness: '🧹', intelligence: '🧠',
      workSkill: '💼', schoolSkill: '🎓', stress: '😰'
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

  earnCoins(amount) {
    this.coins += amount;
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
    }
  },

  seenCount(category) {
    return this.getSeen(category).length;
  },

  showAchievement(emoji, text) {
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
    if (textEl) textEl.textContent = text;
    el.classList.add('show');
    clearTimeout(this._achTimer);
    this._achTimer = setTimeout(() => el.classList.remove('show'), 2500);
  },

  // Куда можно пойти. Блокируем только то, что реально не по силам:
  // устал — поспи, голоден — поешь. Всё остальное открыто (v1.2: мягче к ребёнку).
  isLocationAvailable(loc) {
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

  // Человеческая причина отказа — вместо сухого «нельзя»
  locationLockReason(loc) {
    const energy = this.stats.energy;
    const hunger = this.stats.hunger;
    if (loc === 'work' && energy < 15) return 'Гофер устал — сначала поспи 😴';
    if (loc === 'school' && energy < 10) return 'Гофер устал — сначала поспи 😴';
    if ((loc === 'park' || loc === 'gym' || loc === 'cinema') && energy < 5) return 'Гофер совсем без сил — поспи 😴';
    if ((loc === 'pool' || loc === 'beach') && hunger <= 15) return 'Гофер голодный — сначала покорми 🍕';
    return 'Сейчас сюда нельзя';
  },

  // Сколько энергии стоит поход (немного: игра не должна наказывать)
  visitCost(loc) {
    const v = this.VISIT_ENERGY[loc];
    return (v === undefined) ? 2 : v;
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

  // Если стресс высокий — об этом надо сказать прямым текстом
  stressHint() {
    if (this.stats.stress >= 70) return 'Гофер очень нервничает 😰 Поспи с ним или поиграй тихо';
    if (this.stats.stress >= 40) return 'Гофер немного напряжён 😟 Помогут сон, музыка или тихие игры';
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
    if (r.wokeUp) return 'Пока тебя не было (' + human + '), гофер выспался и полон сил! ⚡';
    if (r.sleptMinutes > 0) return 'Гофер спал ' + r.sleptMinutes + ' мин без тебя: энергия ' + Math.round(this.stats.energy) + '% ⚡';
    return 'Тебя не было ' + human + ' — гофер скучал, но держится 🐹';
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
      knowledge: { ...this.knowledge },
      visitedItems: { ...this.visitedItems },
      timeOfDay: this.timeOfDay,
      visitedLocations: [...this.visitedLocations],
      totalPlayTime: this.totalPlayTime,
      isSick: this.isSick,
      homeDecor: [...this.homeDecor],
      friends: [...this.friends],
      localFriendship: { ...(this.localFriendship || {}) },
      rooms: this.serializedRooms(),
      activeRoom: this.activeRoom,
      paint: { walls: this.paint.walls.slice(), floors: this.paint.floors.slice() },
      furnitureColors: { ...this.furnitureColors },
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
    try {
      localStorage.setItem(this.saveKeyFor(this.profileId), JSON.stringify(data));
    } catch (e) {}
  },

  loadGame() {
    try {
      const raw = localStorage.getItem(this.saveKeyFor(this.profileId));
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.stats = { ...this.stats, ...data.stats };
      this.coins = data.coins || 100;
      this.level = data.level || 1;
      this.xp = data.xp || 0;
      this.xpToNext = data.xpToNext || 100;
      this.inventory = data.inventory || [];
      this.achievements = data.achievements || [];
      this.knowledge = { ...this.knowledge, ...data.knowledge };
      this.visitedItems = data.visitedItems || {};
      this.timeOfDay = data.timeOfDay || 'morning';
      this.visitedLocations = new Set(data.visitedLocations || []);
      this.totalPlayTime = data.totalPlayTime || 0;
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
      const legacyFurniture = (data.furniture || []);
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
      this.look = Object.assign({ hat: null, glasses: null, bowtie: false, fur: 'classic', char: 'gopher' }, data.look || {});
      this.isSleeping = !!data.isSleeping;
      this.sleptMinutes = data.sleptMinutes || 0;
      if (data.profileName) this.profileName = data.profileName;
      // Пока приложение было закрыто: сон ЧЕСТНО копит энергию, бодрствование
      // тратит мягко и не ниже «пола» (см. applyOfflineProgress).
      this.offlineReport = null;
      if (data.savedAt) this.applyOfflineProgress(data.savedAt);
      return true;
    } catch (e) {
      return false;
    }
  },

  hasSave() {
    try {
      return !!localStorage.getItem(this.saveKeyFor(this.profileId));
    } catch (e) {
      return false;
    }
  },

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
    this.knowledge = {
      artMuseum: 0, natureMuseum: 0, spaceMuseum: 0, historyMuseum: 0, library: 0
    };
    this.visitedItems = {};
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
    this.inventory = [];
    // Персонаж — это «кто играет», он сохраняется между сбросами прогресса
    this.look = { hat: null, glasses: null, bowtie: false, fur: 'classic', char: (this.look && this.look.char) || 'gopher' };
    this.isSleeping = false;
    this.offlineReport = null;
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

  // Применить внешний вид к фигурке (единственный источник правды)
  applyLookTo(g) {
    if (!g) return;
    g.hat = this.look.hat || null;
    g.glasses = this.look.glasses || null;
    g.bowtie = !!this.look.bowtie;
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
  },

  startSleep() {
    if (this.isSleeping) return false;
    this.isSleeping = true;
    this._restNotified = false;
    this.sleptMinutes = 0;
    this.lastTick = Date.now();
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
    this.saveGame();
    return true;
  },

  // Свободное место в комнате для новой вещи.
  // Стена — три яруса, пол — три «глубины»: чем дальше, тем выше по экрану.
  findFreeSpot(id, roomId) {
    const f = findFurniture(id);
    const wall = f && f.zone === 'wall';
    const room = this.rooms[roomId || this.activeRoom] || this.currentRoomData();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 0.16 + col * 0.225;
        const y = wall ? (0.25 + row * 0.30) : (0.14 + row * 0.34);
        const busy = room.furniture.some(it => Math.abs(it.x - x) < 0.14 && Math.abs(it.y - y) < 0.20);
        if (!busy) return { x: x, y: y };
      }
    }
    return { x: 0.5, y: 0.5 };
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

  getProfiles() {
    try {
      const raw = localStorage.getItem(this.PROFILE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (e) {}
    return [{ id: 'p1', name: 'Гофер' }];
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
          name: pr.name,
          emoji: '🐹',
          trait: 'гофер с этого устройства',
          level: d.level || 1,
          friendship: (this.localFriendship && this.localFriendship['local_' + pr.id]) || 25,
          decor: [],
          room: d.room || { wall: 'warm', floor: 'wood' },
          furniture: (d.furniture || []).slice(),
          hat: (d.look && d.look.hat) || null,
          glasses: (d.look && d.look.glasses) || null,
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
      friendship: 20,
      decor: [],
      room: room,
      furniture: furniture,
      rooms: rooms,
      hat: (look && look.hat) || null,
      glasses: (look && look.glasses) || null,
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

  // ПОЛНЫЙ код: весь дом со всеми комнатами (копируется кнопкой)
  getMyCode(game) {
    const name = this.profileName && this.profileName !== 'Гофер'
      ? this.profileName
      : this.characterName() + '#' + (this.level * 100 + Math.floor(this.coins / 10)).toString(36);
    const data = {
      v: 3,
      name: name,
      level: this.level,
      coins: this.coins,
      rooms: this.serializedRooms(),
      room: { wall: this.currentRoomData().wall, floor: this.currentRoomData().floor },
      furniture: this.currentRoomData().furniture.map(f => ({ id: f.id, x: f.x, y: f.y })),
      furnitureColors: { ...this.furnitureColors },
      look: { ...this.look }
    };
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
    catch (e) { return btoa(JSON.stringify(data)); }
  },

  // КОРОТКИЙ код: 16 символов группами по 4 — можно надиктовать по телефону
  // или набрать руками (длинный код руками не набрать, поэтому он и не нужен).
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
    pushBits(bits, 1, 2);                                       // версия формата
    pushBits(bits, charIdx & 7, 3);                             // персонаж
    pushBits(bits, furIdx & 15, 4);                             // окрас
    pushBits(bits, (wallIdx & 15), 4);                          // обои
    pushBits(bits, (floorIdx & 15), 4);                         // пол
    pushBits(bits, hatIdx < 0 ? 0 : hatIdx, 2);                 // шляпа
    pushBits(bits, glassIdx < 0 ? 0 : glassIdx, 2);             // очки
    pushBits(bits, this.look.bowtie ? 1 : 0, 1);                // бабочка
    pushBits(bits, Math.max(0, Math.min(31, this.level - 1)), 5); // уровень
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

  // Разбор короткого кода: строгая проверка контрольной суммы
  unpackShortCode(raw) {
    const clean = String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (clean.length !== 16) return null;
    const body = clean.slice(0, 15), sum = clean.slice(15);
    if (code32Checksum(body) !== sum) return null;
    const bits = code32ToBits(clean);
    if (!bits) return null;
    let p = 0;
    const ver = readBits(bits, p, 2); p += 2;
    if (ver !== 1) return null;
    const charIdx = readBits(bits, p, 3); p += 3;
    const furIdx = readBits(bits, p, 4); p += 4;
    const wallIdx = readBits(bits, p, 4); p += 4;
    const floorIdx = readBits(bits, p, 4); p += 4;
    const hatIdx = readBits(bits, p, 2); p += 2;
    const glassIdx = readBits(bits, p, 2); p += 2;
    const bowtie = readBits(bits, p, 1); p += 1;
    const level = readBits(bits, p, 5) + 1; p += 5;
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
        bowtie: !!bowtie
      }
    };
  },

  addAch(id) {
    if (!this.achievements.includes(id)) {
      this.achievements.push(id);
    }
  },

  getRandomEvent() {
    const events = [
      { emoji: '🪙', text: 'Гофер нашёл монетку!', effect: () => { this.earnCoins(10); }, chance: 0.15 },
      { emoji: '⭐', text: 'Гофер нашёл золотую монетку!', effect: () => { this.earnCoins(25); }, chance: 0.05 },
      { emoji: '🎁', text: 'Гофер получил подарок!', effect: () => { this.stats.happiness = Math.min(100, this.stats.happiness + 20); }, chance: 0.08 },
      { emoji: '🤒', text: 'Гофер заболел! Нужно к врачу!', effect: () => { this.isSick = true; this.stats.health = Math.max(10, this.stats.health - 20); }, chance: 0.06 },
      { emoji: '🌟', text: 'Гофер нашёл опыт!', effect: () => { this.addXP(20); }, chance: 0.1 },
      { emoji: '🎉', text: 'Угощение от друга! Счастье +10', effect: () => { this.stats.happiness = Math.min(100, this.stats.happiness + 10); }, chance: 0.07 },
      { emoji: '😴', text: 'Гофер устал. Энергия -10', effect: () => { this.stats.energy = Math.max(0, this.stats.energy - 10); }, chance: 0.1 },
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
const SHORT_HATS = [null, 'scientist', 'chef', 'crown'];
const SHORT_GLASSES = [null, 'nerd', 'cool'];

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
window.System = System;

