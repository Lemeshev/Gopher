// ============ СЦЕНА ДРУЗЕЙ ============
// Как подружиться:
//   1) «🤝 Познакомиться» — встречаешь соседа-гофера (тратится энергия)
//   2) Растишь дружбу: «🏠 В гости», «💬 Поболтать», «🎁 Подарок»
//   3) На 100% дружбы — статус «Лучший друг» и бонусы
// Плюс есть обмен кодами для реальных друзей по переписке.

const NPC_NAMES = [
  'Гоша', 'Грызя', 'Нора', 'Пух', 'Шустрик', 'Бусинка', 'Кекс', 'Соня',
  'Тимка', 'Лаки', 'Семечка', 'Барсик', 'Нюша', 'Тор', 'Пиксель', 'Мята',
  'Рыжик', 'Зёма', 'Дуся', 'Филя', 'Хомка', 'Пряник', 'Чип', 'Мышка'
];
const NPC_TRAITS = [
  'весёлый', 'спокойный', 'умный', 'сонный', 'активный', 'милый', 'гурман',
  'мечтательный', 'любознательный', 'везучий', 'храбрый', 'художник', 'музыкант', 'спортсмен'
];
const NPC_EMOJIS = ['🐹', '🐭', '🐿️'];
const DECOR_POOL = [
  { emoji: '🛋️', name: 'Диван' }, { emoji: '🟫', name: 'Ковёр' },
  { emoji: '🖼️', name: 'Картина' }, { emoji: '📚', name: 'Полка' },
  { emoji: '🐠', name: 'Аквариум' }, { emoji: '🪴', name: 'Растение' },
  { emoji: '💡', name: 'Лампа' }, { emoji: '📺', name: 'ТВ' },
  { emoji: '🎹', name: 'Пианино' }, { emoji: '🕐', name: 'Часы' },
  { emoji: '🛏️', name: 'Кровать' }, { emoji: '🧊', name: 'Холодильник' }
];

const FRIEND_COST_MEET = 10;   // энергия за знакомство
const FRIEND_COST_GIFT = 10;   // монеты за подарок

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function makeNPCPool(usedNames) {
  const names = NPC_NAMES.filter(n => usedNames.indexOf(n) === -1);
  return names.length > 0 ? names : NPC_NAMES.map(n => n + ' II');
}

function createNPC(existingIds) {
  const used = existingIds || [];
  const name = pickRandom(makeNPCPool(used));
  const decorCount = randInt(1, 4);
  const decor = [];
  const pool = DECOR_POOL.slice();
  for (let i = 0; i < decorCount && pool.length; i++) {
    decor.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return {
    id: 'npc_' + name + '_' + Date.now().toString(36),
    name: name,
    emoji: pickRandom(NPC_EMOJIS),
    trait: pickRandom(NPC_TRAITS),
    level: randInt(1, Math.max(2, System.level)),
    friendship: 10,
    decor: decor,
    hat: Math.random() < 0.3 ? 'scientist' : null,
    glasses: Math.random() < 0.25 ? 'cool' : null,
    bowtie: Math.random() < 0.35
  };
}

function friendTag(f) {
  if (f.friendship >= 100) return '⭐ Лучший друг';
  if (f.friendship >= 70) return '💙 Близкий друг';
  if (f.friendship >= 40) return '🙂 Приятель';
  return '👋 Знакомый';
}

class FriendsScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.tab = 'list'; // 'list' | 'mycode' | 'add' | 'visit' | 'meet'
    this.inputText = '';
    this.friendVisitData = null;
    this.notification = null;
    this.notifTimer = 0;
    this.newFriend = null;
    this.scroll = 0;
    this.page = 0;
  }

  init() {
    this.buttons = [];
    this.tab = 'list';
    this.inputText = '';
    this.notification = null;
    this.notifTimer = 0;
    this.friendVisitData = null;
    this.newFriend = null;
    this.scroll = 0;
    this.page = 0;
  }

  update(dt) {
    if (this.notifTimer > 0) {
      this.notifTimer -= dt;
      if (this.notifTimer <= 0) this.notification = null;
    }
  }

  showNotif(text) {
    this.notification = text;
    this.notifTimer = 2200;
  }

  getFriends() {
    return System.friends || [];
  }

  findFriend(id) {
    return this.getFriends().find(f => f.id === id) || null;
  }

  // ---------- ДРУЖБА ----------
  meet() {
    if (System.stats.energy < FRIEND_COST_MEET) {
      this.showNotif('Нужно ' + FRIEND_COST_MEET + ' энергии');
      AudioSys.play('fail');
      return;
    }
    System.stats.energy -= FRIEND_COST_MEET;
    const npc = createNPC(this.getFriends().map(f => f.name));
    System.friends.push(npc);
    System.stats.happiness = Math.min(100, System.stats.happiness + 5);
    System.addXP(8);
    System.saveGame();
    AudioSys.play('success');
    this.newFriend = npc;
    this.tab = 'meet';
  }

  addFriendship(f, amount) {
    f.friendship = Math.min(100, (f.friendship || 0) + amount);
    System.saveGame();
  }

  gift(friendId) {
    const f = this.findFriend(friendId);
    if (!f) return;
    if (!System.canAfford(FRIEND_COST_GIFT)) {
      this.showNotif('Не хватает монет (нужно ' + FRIEND_COST_GIFT + ')');
      AudioSys.play('fail');
      return;
    }
    System.spendCoins(FRIEND_COST_GIFT);
    this.addFriendship(f, 12);
    System.stats.happiness = Math.min(100, System.stats.happiness + 6);
    System.addXP(4);
    AudioSys.play('coin');
    this.showNotif('🎁 Подарок для ' + f.name + '! Дружба +12');
  }

  chat(friendId) {
    const f = this.findFriend(friendId);
    if (!f) return;
    this.addFriendship(f, 6);
    System.stats.happiness = Math.min(100, System.stats.happiness + 4);
    System.addXP(3);
    AudioSys.play('click');
    this.showNotif('💬 Поболтали с ' + f.name + '! Дружба +6');
  }

  visit(friendId) {
    const f = this.findFriend(friendId);
    if (!f) return;
    this.friendVisitData = f;
    this.tab = 'visit';
    this.addFriendship(f, 8);
    System.stats.happiness = Math.min(100, System.stats.happiness + 8);
    System.addXP(6);
    AudioSys.play('success');
  }

  // ================= ОТРИСОВКА =================
  draw(ctx) {
    const W = this.game.width, H = this.game.height;
    this.buttons = [];

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('🧑‍🤝‍🧑 ' + this.titles(), W / 2, 34);

    const backLabel = (this.tab === 'list') ? '← Назад' : (this.tab === 'visit' ? '← Назад' : '← Закрыть');
    this.buttons.push(createButton(ctx, 10, 10, 82, 32, backLabel, {
      bgColor: 'rgba(255,255,255,0.15)', fgColor: '#fff', fontSize: 13, radius: 8
    }));

    if (this.tab === 'mycode') return this.drawMyCode(ctx, W, H);
    if (this.tab === 'add') return this.drawAddFriend(ctx, W, H);
    if (this.tab === 'visit' && this.friendVisitData) return this.drawFriendHome(ctx, W, H);
    if (this.tab === 'meet' && this.newFriend) return this.drawMeet(ctx, W, H);
    return this.drawList(ctx, W, H);
  }

  titles() {
    if (this.tab === 'mycode') return 'Мой код';
    if (this.tab === 'add') return 'Добавить по коду';
    if (this.tab === 'visit') return 'В гостях';
    if (this.tab === 'meet') return 'Новое знакомство';
    return 'Друзья';
  }

  drawList(ctx, W, H) {
    const friends = this.getFriends();
    const btnW = Math.min(W * 0.88, 300);
    const btnX = (W - btnW) / 2;

    // Кнопки действий
    createButton(ctx, btnX, 56, btnW, 46, '🤝 Познакомиться (-' + FRIEND_COST_MEET + '⚡)', {
      bgColor: '#6BCB77', fgColor: '#fff', fontSize: 14, radius: 12
    });
    this.buttons.push({ x: btnX, y: 56, w: btnW, h: 46, text: 'meet' });

    createButton(ctx, btnX, 108, btnW, 40, '🔑 Код друга (для реальных друзей)', {
      bgColor: '#4D96FF', fgColor: '#fff', fontSize: 13, radius: 10
    });
    this.buttons.push({ x: btnX, y: 108, w: btnW, h: 40, text: 'codes' });

    if (friends.length === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.034, 14)}px Arial`;
      ctx.fillText('Пока никого не знаешь.', W / 2, H * 0.42);
      ctx.fillText('Нажми «Познакомиться» —', W / 2, H * 0.46);
      ctx.fillText('познакомишься с соседом!', W / 2, H * 0.50);
      return;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
    ctx.fillText('Друзей: ' + friends.length, W / 2, 166);

    const perPage = 3;
    const pages = Math.max(1, Math.ceil(friends.length / perPage));
    if (this.page >= pages) this.page = pages - 1;
    if (this.page < 0) this.page = 0;
    const slice = friends.slice(this.page * perPage, this.page * perPage + perPage);

    const cardH = Math.min(96, (H - 200 - (pages > 1 ? 40 : 0)) / perPage);
    let y = 178;
    slice.forEach((f, i) => {
      const idx = this.page * perPage + i;
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      roundRect(ctx, btnX, y, btnW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = f.friendship >= 100 ? '#FFD93D' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      roundRect(ctx, btnX, y, btnW, cardH, 12);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(W * 0.075, 30)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(f.emoji || '🐹', btnX + 12, y + 26);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.038, 15)}px Arial`;
      ctx.fillText(f.name, btnX + 46, y + 20);

      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.028, 11)}px Arial`;
      ctx.fillText(f.trait + ' · Ур.' + (f.level || 1), btnX + 46, y + 36);

      // Полоса дружбы
      const barX = btnX + 46, barY = y + 44, barW = btnW - 60;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      roundRect(ctx, barX, barY, barW, 8, 4);
      ctx.fill();
      ctx.fillStyle = f.friendship >= 100 ? '#FFD93D' : (f.friendship >= 40 ? '#6BCB77' : '#FF8C42');
      roundRect(ctx, barX, barY, barW * (f.friendship / 100), 8, 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `${Math.min(W * 0.026, 10)}px Arial`;
      ctx.textAlign = 'right';
      ctx.fillText(friendTag(f) + ' · ' + Math.round(f.friendship) + '%', btnX + btnW - 12, y + 48);

      // Кнопки: гости и подарок
      const bw = (btnW - 36) / 2;
      createButton(ctx, btnX + 12, y + cardH - 34, bw, 28, '🏠 В гости', {
        bgColor: '#FF8C42', fgColor: '#fff', fontSize: 12, radius: 8, shadow: false
      });
      this.buttons.push({ x: btnX + 12, y: y + cardH - 34, w: bw, h: 28, text: 'visit_' + idx });

      createButton(ctx, btnX + 24 + bw, y + cardH - 34, bw, 28, '🎁 -' + FRIEND_COST_GIFT + '🪙', {
        bgColor: '#FFD93D', fgColor: '#333', fontSize: 12, radius: 8, shadow: false
      });
      this.buttons.push({ x: btnX + 24 + bw, y: y + cardH - 34, w: bw, h: 28, text: 'gift_' + idx });

      y += cardH + 10;
    });

    if (pages > 1) {
      createButton(ctx, btnX, H - 44, 60, 32, '◀', { bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 14, radius: 8 });
      this.buttons.push({ x: btnX, y: H - 44, w: 60, h: 32, text: 'page_prev' });
      createButton(ctx, btnX + btnW - 60, H - 44, 60, 32, '▶', { bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 14, radius: 8 });
      this.buttons.push({ x: btnX + btnW - 60, y: H - 44, w: 60, h: 32, text: 'page_next' });
      ctx.fillStyle = '#aaa';
      ctx.font = `${Math.min(W * 0.03, 12)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText((this.page + 1) + ' / ' + pages, W / 2, H - 24);
    }

    this.drawNotif(ctx, W, H);
  }

  drawMeet(ctx, W, H) {
    const f = this.newFriend;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(W * 0.22, 90)}px Arial`;
    ctx.fillText(f.emoji, W / 2, H * 0.3);

    ctx.fillStyle = '#6BCB77';
    ctx.font = `bold ${Math.min(W * 0.055, 24)}px Arial`;
    ctx.fillText('Познакомились!', W / 2, H * 0.44);

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.045, 20)}px Arial`;
    ctx.fillText(f.name + ' — ' + f.trait, W / 2, H * 0.50);

    ctx.fillStyle = '#9aa';
    ctx.font = `${Math.min(W * 0.033, 14)}px Arial`;
    ctx.fillText('Уровень ' + f.level + ' · Дружба 10%', W / 2, H * 0.55);

    if (f.decor && f.decor.length) {
      ctx.fillStyle = '#b9c3ff';
      ctx.fillText('Дома у него: ' + f.decor.map(d => d.emoji + d.name).join(', '), W / 2, H * 0.60);
    }

    ctx.fillStyle = '#888';
    ctx.font = `${Math.min(W * 0.03, 12)}px Arial`;
    ctx.fillText('Будь внимателен: дружбу растим гостями и подарками', W / 2, H * 0.64);

    const btnW = Math.min(W * 0.8, 260);
    const btnX = (W - btnW) / 2;
    createButton(ctx, btnX, H * 0.7, btnW, 44, '🏠 Сразу в гости', { bgColor: '#FF8C42', fgColor: '#fff', fontSize: 15, radius: 12 });
    this.buttons.push({ x: btnX, y: H * 0.7, w: btnW, h: 44, text: 'visit_new' });

    createButton(ctx, btnX, H * 0.7 + 54, btnW, 40, '✅ К списку друзей', { bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 14, radius: 12 });
    this.buttons.push({ x: btnX, y: H * 0.7 + 54, w: btnW, h: 40, text: 'to_list' });
  }

  drawFriendHome(ctx, W, H) {
    const f = this.friendVisitData;
    if (!f) { this.tab = 'list'; return; }

    // Комната друга
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2a2340');
    grad.addColorStop(1, '#3a2f52');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(0, H * 0.56, W, H * 0.44);

    // Имя и статус
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.045, 19)}px Arial`;
    ctx.fillText(f.name + ' — ' + f.trait, W / 2, 62);

    // Полоса дружбы
    const barW = Math.min(W * 0.7, 260);
    const barX = (W - barW) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, barX, 72, barW, 12, 6);
    ctx.fill();
    ctx.fillStyle = f.friendship >= 100 ? '#FFD93D' : '#6BCB77';
    roundRect(ctx, barX, 72, barW * (f.friendship / 100), 12, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.026, 11)}px Arial`;
    ctx.fillText(friendTag(f) + ' · ' + Math.round(f.friendship) + '%', W / 2, 100);

    // Гофер-хозяин
    if (this.game.gopher) {
      const g = this.game.gopher;
      const savedHat = g.hat, savedGlasses = g.glasses, savedBow = g.bowtie;
      g.hat = f.hat; g.glasses = f.glasses; g.bowtie = f.bowtie;
      g.setExpression('happy', 40);
      const gs = Math.min(W * 0.3, 120);
      g.draw(ctx, W * 0.5, H * 0.38, gs / g.size);
      g.hat = savedHat; g.glasses = savedGlasses; g.bowtie = savedBow;
    }

    // Мебель друга
    if (f.decor && f.decor.length) {
      const cols = Math.min(f.decor.length, 4);
      const floorY = H * 0.58;
      const cellW = W / cols;
      f.decor.forEach((d, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = col * cellW + cellW / 2;
        const cy = floorY + row * 56 + 26;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.min(cellW * 0.5, 32)}px Arial`;
        ctx.fillText(d.emoji, cx, cy);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = `${Math.min(cellW * 0.13, 9)}px Arial`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(d.name, cx, cy + 20);
      });
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.032, 13)}px Arial`;
      ctx.fillText('У ' + f.name + ' пока пусто дома...', W / 2, H * 0.65);
    }

    // Действия
    const btnW = Math.min(W * 0.8, 260);
    const btnX = (W - btnW) / 2;
    const startY = H - 140;
    createButton(ctx, btnX, startY, btnW, 42, '💬 Поболтать (+6 дружбы)', {
      bgColor: '#4D96FF', fgColor: '#fff', fontSize: 14, radius: 12
    });
    this.buttons.push({ x: btnX, y: startY, w: btnW, h: 42, text: 'chat' });

    createButton(ctx, btnX, startY + 50, btnW, 42, '🎁 Подарок (-' + FRIEND_COST_GIFT + '🪙, +12 дружбы)', {
      bgColor: '#FFD93D', fgColor: '#333', fontSize: 13, radius: 12
    });
    this.buttons.push({ x: btnX, y: startY + 50, w: btnW, h: 42, text: 'gift_here' });

    this.drawNotif(ctx, W, H);
  }

  drawMyCode(ctx, W, H) {
    const code = System.getMyCode(this.game);
    const panelW = Math.min(W * 0.9, 320);
    const panelH = 210;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2 - 20;

    ctx.fillStyle = '#1e2a4a';
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.fill();
    ctx.strokeStyle = '#4D96FF';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#4D96FF';
    ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`;
    ctx.fillText('📋 Ваш код', W / 2, py + 30);

    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.min(W * 0.026, 11)}px Arial`;
    ctx.fillText('Отправьте его другу — он добавит вас', W / 2, py + 50);

    ctx.fillStyle = '#FFD93D';
    ctx.font = `${Math.min(W * 0.026, 11)}px monospace`;
    const chunk = 32;
    for (let i = 0; i < code.length; i += chunk) {
      const row = Math.floor(i / chunk);
      if (py + 74 + row * 14 < py + panelH - 60) {
        ctx.fillText(code.substring(i, i + chunk), W / 2, py + 74 + row * 14);
      }
    }

    createButton(ctx, px + 16, py + panelH - 50, panelW / 2 - 24, 36, '📋 Копировать', {
      bgColor: '#6BCB77', fgColor: '#fff', fontSize: 12, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + panelH - 50, w: panelW / 2 - 24, h: 36, text: 'copy' });

    createButton(ctx, px + panelW / 2 + 8, py + panelH - 50, panelW / 2 - 24, 36, '➕ Ввести чужой', {
      bgColor: '#FF8C42', fgColor: '#fff', fontSize: 12, radius: 10
    });
    this.buttons.push({ x: px + panelW / 2 + 8, y: py + panelH - 50, w: panelW / 2 - 24, h: 36, text: 'open_add' });
  }

  drawAddFriend(ctx, W, H) {
    const panelW = Math.min(W * 0.9, 320);
    const panelH = 220;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2 - 10;

    ctx.fillStyle = '#1e2a4a';
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.fill();
    ctx.strokeStyle = '#6BCB77';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#6BCB77';
    ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`;
    ctx.fillText('➕ Код друга', W / 2, py + 30);

    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.min(W * 0.026, 11)}px Arial`;
    ctx.fillText('Вставьте код, который прислал друг', W / 2, py + 50);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, px + 16, py + 64, panelW - 32, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
    ctx.textAlign = 'left';
    const shown = this.inputText ? this.inputText.substring(0, 34) + (this.inputText.length > 34 ? '…' : '') : '— пусто —';
    ctx.fillText(shown, px + 26, py + 89);

    createButton(ctx, px + 16, py + 112, panelW - 32, 34, '📋 Вставить из буфера', {
      bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 12, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + 112, w: panelW - 32, h: 34, text: 'paste' });

    createButton(ctx, px + 16, py + panelH - 50, panelW - 32, 38, '✅ Добавить друга', {
      bgColor: '#6BCB77', fgColor: '#fff', fontSize: 14, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + panelH - 50, w: panelW - 32, h: 38, text: 'addcode' });

    this.drawNotif(ctx, W, H);
  }

  drawNotif(ctx, W, H) {
    if (!this.notification) return;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    roundRect(ctx, W / 2 - Math.min(W * 0.44, 160), H - 62, Math.min(W * 0.88, 320), 34, 12);
    ctx.fill();
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.032, 13)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.notification, W / 2, H - 45);
  }

  // ================= ОБРАБОТКА НАЖАТИЙ =================
  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const t = btn.text || '';

      if (t === '← Назад' || t === '← Закрыть') {
        AudioSys.play('click');
        if (this.tab === 'list') { this.game.transitionTo('map'); }
        else { this.tab = 'list'; this.newFriend = null; this.friendVisitData = null; }
        return true;
      }
      if (t === 'meet') { this.meet(); return true; }
      if (t === 'to_list') { AudioSys.play('click'); this.tab = 'list'; this.newFriend = null; return true; }
      if (t === 'codes') { AudioSys.play('click'); this.tab = 'mycode'; return true; }
      if (t === 'open_add') { AudioSys.play('click'); this.tab = 'add'; this.inputText = ''; return true; }

      if (t === '🎁') { /* не используется */ }

      if (t.indexOf('visit_') === 0) {
        AudioSys.play('click');
        if (t === 'visit_new') { this.visit(this.newFriend.id); return true; }
        const idx = parseInt(t.split('_')[1], 10);
        const f = this.getFriends()[idx];
        if (f) this.visit(f.id);
        return true;
      }
      if (t.indexOf('gift_') === 0) {
        if (t === 'gift_here') { this.gift(this.friendVisitData ? this.friendVisitData.id : null); return true; }
        const idx = parseInt(t.split('_')[1], 10);
        const f = this.getFriends()[idx];
        if (f) this.gift(f.id);
        return true;
      }
      if (t === 'chat') { this.chat(this.friendVisitData ? this.friendVisitData.id : null); return true; }
      if (t === 'page_prev') { AudioSys.play('click'); this.page = Math.max(0, this.page - 1); return true; }
      if (t === 'page_next') { AudioSys.play('click'); this.page = this.page + 1; return true; }

      if (t === 'copy') {
        const code = System.getMyCode(this.game);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => this.showNotif('Код скопирован!')).catch(() => this.showNotif('Скопируйте вручную'));
        } else { this.showNotif('Скопируйте код вручную'); }
        return true;
      }
      if (t === 'paste') {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(txt => { this.inputText = (txt || '').trim(); this.showNotif('Вставлено'); }).catch(() => this.showNotif('Нет доступа к буферу'));
        } else { this.showNotif('Буфер недоступен'); }
        return true;
      }
      if (t === 'addcode') {
        if (!this.inputText.trim()) { this.showNotif('Сначала вставьте код'); return true; }
        if (System.addFriend(this.inputText.trim())) {
          AudioSys.play('success');
          this.showNotif('Друг добавлен!');
          this.inputText = '';
          this.tab = 'list';
        } else {
          AudioSys.play('fail');
          this.showNotif('Неверный код или уже добавлен');
        }
        return true;
      }
      return true;
    }
    return false;
  }
}

window.FriendsScene = FriendsScene;
