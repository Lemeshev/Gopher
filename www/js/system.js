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
  timeOfDay: 'morning',  // morning, afternoon, evening, night
  currentLocation: 'home',
  isSleeping: false,
  isSick: false,
  visitedLocations: new Set(),
  totalPlayTime: 0,
  lastSaveTime: Date.now(),

  getStatColor(stat) {
    const val = this.stats[stat];
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
      timeOfDay: this.timeOfDay,
      visitedLocations: [...this.visitedLocations],
      totalPlayTime: this.totalPlayTime,
      isSick: this.isSick,
      homeDecor: [...this.homeDecor],
      friends: [...this.friends],
      savedAt: Date.now()
    };
    try {
      localStorage.setItem('gopherlife_save', JSON.stringify(data));
    } catch (e) {}
  },

  loadGame() {
    try {
      const raw = localStorage.getItem('gopherlife_save');
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
      this.timeOfDay = data.timeOfDay || 'morning';
      this.visitedLocations = new Set(data.visitedLocations || []);
      this.totalPlayTime = data.totalPlayTime || 0;
      this.isSick = data.isSick || false;
      this.homeDecor = data.homeDecor || [];
      this.friends = data.friends || [];
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
      return !!localStorage.getItem('gopherlife_save');
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
    this.timeOfDay = 'morning';
    this.currentLocation = 'home';
    this.isSleeping = false;
    this.isSick = false;
    this.visitedLocations = new Set();
    this.totalPlayTime = 0;
    this.homeDecor = [];
    this.friends = [];
  },

  addDecor(id, emoji, name) {
    if (!this.homeDecor.find(d => d.id === id)) {
      this.homeDecor.push({ id, emoji, name, x: 0.5, y: 0.5 });
      this.saveGame();
    }
  },

  addFriend(code) {
    try {
      const data = JSON.parse(atob(code));
      if (data && data.name && !this.friends.find(f => f.name === data.name)) {
        this.friends.push(data);
        this.saveGame();
        return true;
      }
    } catch (e) {}
    return false;
  },

  getMyCode() {
    const data = {
      name: 'Гофер',
      stats: { ...this.stats },
      level: this.level,
      coins: this.coins,
      homeDecor: this.homeDecor.map(d => ({ id: d.id, emoji: d.emoji, name: d.name })),
      hat: null, glasses: null, bowtie: false
    };
    return btoa(JSON.stringify(data));
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
