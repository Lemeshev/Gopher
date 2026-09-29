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

  // ---- Комната: обои, пол и расставленная мебель ----
  room: { wall: 'warm', floor: 'wood' },
  furniture: [],   // [{ id, x, y }] — доли 0..1 внутри зоны предмета
  inventory: [],   // куплено, но убрано в инвентарь

  // ---- Внешний вид гофера (для гостей и кода друга) ----
  look: { hat: null, glasses: null, bowtie: false, fur: 'classic' },

  // ---- Сон ----
  SLEEP_FULL_MINUTES: 10,   // с 0 до 100 энергии — за 10 минут сна
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

  isLocationAvailable(loc) {
    const time = this.timeOfDay;
    const energy = this.stats.energy;
    const hunger = this.stats.hunger;
    const health = this.stats.health;

    switch (loc) {
      case 'pool': return hunger > 30 && energy > 20;
      case 'clinic': return health < 70;
      case 'shop': return true;
      case 'restaurant': return energy > 30 && hunger < 90;
      case 'park': return energy > 40;
      case 'gym': return energy > 30;
      case 'work': return energy > 40;
      case 'school': return energy > 40;
      case 'cinema': return energy > 30 && this.canAfford(20);
      case 'friend': return energy > 30;
      case 'beach': return energy > 40 && hunger > 30;
      case 'museums': return energy > 20;
      case 'museum_art': return this.canAfford(30);
      case 'museum_nature': return this.canAfford(30);
      case 'museum_space': return this.canAfford(30);
      case 'museum_history': return this.canAfford(30);
      case 'library': return this.canAfford(10);
      case 'home': return true;
      default: return true;
    }
  },

  getTimePeriod(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  },

  advanceTime(hours) {
    const now = new Date();
    const h = now.getHours() + hours;
    this.timeOfDay = this.getTimePeriod(h);
    // Пассивное изменение статов со временем
    this.stats.hunger = Math.max(0, this.stats.hunger - hours * 3);
    this.stats.energy = Math.max(0, this.stats.energy - hours * 2);
    this.stats.cleanliness = Math.max(0, this.stats.cleanliness - hours * 1);
    this.stats.stress = Math.min(100, this.stats.stress + hours * 1);

    if (this.stats.hunger < 10) {
      this.stats.health = Math.max(0, this.stats.health - hours * 2);
      this.isSick = this.stats.health < 20;
    }
    if (this.stats.energy < 10) {
      this.stats.happiness = Math.max(0, this.stats.happiness - hours * 2);
    }
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
      room: { ...this.room },
      furniture: this.furniture.map(f => ({ id: f.id, x: f.x, y: f.y })),
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
      this.room = data.room || { wall: 'warm', floor: 'wood' };
      this.furniture = (data.furniture || []).map(f => ({ id: f.id, x: f.x, y: f.y }));
      this.look = Object.assign({ hat: null, glasses: null, bowtie: false, fur: 'classic' }, data.look || {});
      this.isSleeping = !!data.isSleeping;
      this.sleptMinutes = data.sleptMinutes || 0;
      if (data.profileName) this.profileName = data.profileName;
      // Миграция старой мебели (homeDecor без координат) в новую систему
      if (this.furniture.length === 0 && this.homeDecor.length > 0) {
        const known = { sofa: 'sofa', carpet: 'carpet', painting: 'painting', bookshelf: 'shelf', aquarium: 'aquarium', plant: 'plant', lamp: 'lamp', tv: 'tv', piano: 'piano', clock: 'clock', bed: 'bed', fridge: 'fridge' };
        this.homeDecor.forEach((d, i) => {
          const id = known[d.id];
          if (!id || !findFurniture(id)) return;
          if (this.furniture.some(f => f.id === id)) return;
          this.furniture.push({ id: id, x: 0.22 + (i % 4) * 0.19, y: 0.74 + Math.floor(i / 4) * 0.11 });
        });
      }
      // Пока приложение было закрыто, гофер мог продолжать спать
      if (this.isSleeping && data.savedAt) {
        const sleptMs = Math.min(Date.now() - data.savedAt, this.SLEEP_FULL_MINUTES * 60000);
        if (sleptMs > 0) this.tick(sleptMs);
      }
      // Учёт офлайн-изменения статов
      if (data.savedAt) {
        const elapsed = (Date.now() - data.savedAt) / 1000 / 60; // minutes
        const hours = Math.min(elapsed / 60, 24);
        this.advanceTime(hours);
      }
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
    this.room = { wall: 'warm', floor: 'wood' };
    this.furniture = [];
    this.inventory = [];
    this.look = { hat: null, glasses: null, bowtie: false, fur: 'classic' };
    this.isSleeping = false;
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

  // Применить внешний вид к гоферу (единственный источник правды)
  applyLookTo(g) {
    if (!g) return;
    g.hat = this.look.hat || null;
    g.glasses = this.look.glasses || null;
    g.bowtie = !!this.look.bowtie;
    g.bodyColor = (this.look.fur && this.look.fur !== 'classic') ? findFur(this.look.fur).color : null;
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

  // ================= МЕБЕЛЬ И КОМНАТА =================
  buyFurniture(id) {
    const f = findFurniture(id);
    if (!f) return false;
    // Вещь сразу появляется в комнате — ребёнок видит результат покупки
    if (!this.furniture.some(it => it.id === id)) {
      const spot = this.findFreeSpot(id);
      this.furniture.push({ id: id, x: spot.x, y: spot.y });
    }
    this.saveGame();
    return true;
  },

  // Свободное место в комнате для новой вещи
  findFreeSpot(id) {
    const f = findFurniture(id);
    const wall = f && f.zone === 'wall';
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 0.16 + col * 0.225;
        const y = wall ? (0.18 + row * 0.30) : (0.16 + row * 0.32);
        const busy = this.furniture.some(it => Math.abs(it.x - x) < 0.14 && Math.abs(it.y - y) < 0.22);
        if (!busy) return { x: x, y: y };
      }
    }
    return { x: 0.5, y: 0.5 };
  },

  ownsFurniture(id) {
    return this.inventory.includes(id) || this.furniture.some(f => f.id === id);
  },

  // Поставить предмет из инвентаря (или переставить уже стоящий)
  placeFurniture(id, x, y) {
    if (!findFurniture(id)) return false;
    const idx = this.inventory.indexOf(id);
    if (idx !== -1) this.inventory.splice(idx, 1);
    const existing = this.furniture.find(it => it.id === id);
    if (existing) { existing.x = x; existing.y = y; }
    else this.furniture.push({ id: id, x: x, y: y });
    this.saveGame();
    return true;
  },

  // x, y — доли 0..1 внутри зоны предмета (стена или пол)
  moveFurniture(id, x, y) {
    const it = this.furniture.find(f => f.id === id);
    if (!it) return;
    it.x = Math.max(0.06, Math.min(0.94, x));
    it.y = Math.max(0, Math.min(1, y));
    this.saveGame();
  },

  // Убрать в инвентарь
  removeFurniture(id) {
    const idx = this.furniture.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.furniture.splice(idx, 1);
    if (!this.inventory.includes(id)) this.inventory.push(id);
    this.saveGame();
    return true;
  },

  setWall(id) { if (findWall(id)) { this.room.wall = id; this.saveGame(); } },
  setFloor(id) { if (findFloor(id)) { this.room.floor = id; this.saveGame(); } },

  // Сколько мебели всего куплено
  furnitureCount() { return this.furniture.length + this.inventory.length; },

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

  addFriend(code) {
    const decode = (raw) => {
      const bin = atob(raw);
      try { return JSON.parse(decodeURIComponent(escape(bin))); }
      catch (e) { return JSON.parse(bin); }
    };
    try {
      const data = decode(code);
      if (data && data.name) {
        if (this.friends.find(f => f.name === data.name)) return false;
        const look = data.look || { hat: data.hat, glasses: data.glasses, bowtie: data.bowtie };
        this.friends.push({
          id: 'code_' + data.name + '_' + Date.now().toString(36),
          name: data.name,
          emoji: '🐹',
          trait: 'друг по переписке',
          level: data.level || 1,
          friendship: 20,
          decor: (data.homeDecor || []).map(d => ({ emoji: d.emoji, name: d.name })),
          room: data.room || { wall: 'warm', floor: 'wood' },
          furniture: (data.furniture || []).map(f => ({ id: f.id, x: f.x, y: f.y })),
          hat: look.hat || null,
          glasses: look.glasses || null,
          bowtie: !!look.bowtie
        });
        this.saveGame();
        return true;
      }
    } catch (e) {}
    return false;
  },

  getMyCode(game) {
    const name = this.profileName && this.profileName !== 'Гофер'
      ? this.profileName
      : 'Гофер#' + (this.level * 100 + Math.floor(this.coins / 10)).toString(36);
    const data = {
      v: 2,
      name: name,
      stats: { ...this.stats },
      level: this.level,
      coins: this.coins,
      room: { ...this.room },
      furniture: this.furniture.map(f => ({ id: f.id, x: f.x, y: f.y })),
      homeDecor: this.homeDecor.map(d => ({ id: d.id, emoji: d.emoji, name: d.name })),
      look: { ...this.look }
    };
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
    catch (e) { return btoa(JSON.stringify(data)); }
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

window.System = System;
