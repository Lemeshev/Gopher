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

  // Комнату обставляем по-настоящему: мебель с координатами, как у игрока
  const pool = FURNITURE.slice();
  const furniture = [];
  const spots = [];
  const count = randInt(2, 5);
  for (let i = 0; i < count && pool.length; i++) {
    const item = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const wall = item.zone === 'wall';
    let x = 0.5, y = 0.5, tries = 0;
    do {
      x = 0.16 + Math.random() * 0.68;
      y = wall ? (0.08 + Math.random() * 0.72) : (0.10 + Math.random() * 0.72);
      tries++;
    } while (spots.some(sp => Math.abs(sp.x - x) < 0.18 && Math.abs(sp.y - y) < 0.24) && tries < 24);
    spots.push({ x: x, y: y });
    furniture.push({ id: item.id, x: x, y: y });
  }

  return {
    id: 'npc_' + name + '_' + Date.now().toString(36),
    name: name,
    emoji: pickRandom(NPC_EMOJIS),
    trait: pickRandom(NPC_TRAITS),
    level: randInt(1, Math.max(2, System.level)),
    friendship: 10,
    room: {
      wall: pickRandom(WALLS.map(w => w.id)),
      floor: pickRandom(FLOORS.map(fl => fl.id))
    },
    furniture: furniture,
    decor: furniture.map(fr => ({
      id: fr.id,
      emoji: findFurniture(fr.id).emoji,
      name: findFurniture(fr.id).name
    })),
    fur: randomFurId(),
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
    // Сначала друзья с этого устройства (братья, сёстры), потом остальные
    const local = (System.getLocalFriends && System.getLocalFriends()) || [];
    return local.concat(System.friends || []);
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
    if (f.local) {
      if (!System.localFriendship) System.localFriendship = {};
      System.localFriendship[f.id] = f.friendship;
    }
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

      // Цветной кружок — окрас гофера друга
      const furColor = (typeof findFur === 'function') ? findFur(f.fur || 'classic').color : '#7FDBE8';
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.arc(btnX + 50, y + 36, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.028, 11)}px Arial`;
      const traitTxt = f.trait + ' · Ур.' + (f.level || 1) + ' · 🏠' + ((f.furniture || f.decor || []).length);
      const traitSize = fitFontSize(ctx, traitTxt, btnW - 110, Math.min(W * 0.028, 11), 7.5, false);
      ctx.font = `${traitSize}px Arial`;
      ctx.fillText(traitTxt, btnX + 62, y + 36);

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

    ctx.fillStyle = '#141428';
    ctx.fillRect(0, 0, W, H);

    // Имя и статус друга
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.045, 19)}px Arial`;
    ctx.fillText(f.name + ' — ' + f.trait, W / 2, 58);

    const barW = Math.min(W * 0.7, 260);
    const barX = (W - barW) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, barX, 66, barW, 11, 6);
    ctx.fill();
    ctx.fillStyle = f.friendship >= 100 ? '#FFD93D' : '#6BCB77';
    roundRect(ctx, barX, 66, barW * (f.friendship / 100), 11, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.026, 11)}px Arial`;
    ctx.fillText(friendTag(f) + ' · ' + Math.round(f.friendship) + '%', W / 2, 92);

    // ---- КОМНАТА ДРУГА (та же отрисовка, что и дома) ----
    const rect = { x: 0, y: 100, w: W, h: Math.max(170, Math.min(H * 0.54, H - 100 - 150)) };
    const room = f.room || { wall: 'warm', floor: 'wood' };
    const furniture = (f.furniture && f.furniture.length)
      ? f.furniture
      : (f.decor || []).map((d, i) => ({ id: this.guessItemId(d), x: 0.22 + (i % 4) * 0.19, y: 0.25 + Math.floor(i / 4) * 0.35 }));

    if (typeof RoomView !== 'undefined') {
      RoomView.drawAll(ctx, rect, room, furniture, {});

      // Хозяин комнаты — со своим окрасом и своим персонажем (гофер, мишка...)
      let host = null;
      try {
        host = (typeof createCharacter === 'function')
          ? createCharacter(f.char || 'gopher', 100)
          : this.game.gopher;
      } catch (e) { host = this.game.gopher; }
      if (host) {
        host.hat = f.hat || null;
        host.glasses = f.glasses || null;
        host.bowtie = !!f.bowtie;
        host.bodyColor = (f.fur && f.fur !== 'classic' && typeof findFur === 'function') ? findFur(f.fur).color : null;
        host.outfit = null;
        host.heldEmoji = null;
        host.shower = 0;
        host.setExpression('happy', 40);
        const floorTop = rect.y + rect.h * 0.52;
        const gs = Math.min(W * 0.30, rect.h * 0.42);
        host.draw(ctx, W * 0.5, floorTop + rect.h * 0.16 - gs * 0.52, gs / host.size);
      }
    }

    // Подпись снизу
    const wall = (typeof findWall === 'function') ? findWall(room.wall) : { name: '' };
    const floor = (typeof findFloor === 'function') ? findFloor(room.floor) : { name: '' };
    const info = 'Обои: ' + wall.name + ' · Пол: ' + floor.name + ' · Мебель: ' + furniture.length;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${Math.min(W * 0.028, 11.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(info, W / 2, rect.y + rect.h + 18);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${Math.min(W * 0.026, 10.5)}px Arial`;
    ctx.fillText('Свою комнату обустраивай дома \u2014 кнопка \ud83d\udecb\ufe0f сверху', W / 2, rect.y + rect.h + 36);

    // Действия в гостях
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

  // Постаревшие записи друзей хранили только emoji+name — приводим к id
  guessItemId(d) {
    if (d && d.id) return d.id;
    const found = (typeof FURNITURE !== 'undefined')
      ? FURNITURE.find(x => x.emoji === (d && d.emoji))
      : null;
    return found ? found.id : 'plant';
  }

  // ---- Мой код: короткий (диктуем) + полный (копируем кнопкой) ----
  // Жалоба «код огромный, руками не введёшь» решена двумя форматами:
  //   * короткий — 16 знаков: обои, пол, окрас, персонаж и 6 предметов;
  //   * полный — весь дом: его не набирают, а копируют/отправляют кнопкой.
  drawMyCode(ctx, W, H) {
    const short = System.getShortCode();
    const panelW = Math.min(W * 0.94, 340);
    const panelH = 268;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2 - 16;

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
    ctx.fillText('📋 Мой код друга', W / 2, py + 28);

    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.026, 11.5)}px Arial`;
    ctx.fillText('Короткий код — его можно продиктовать или набрать руками:', W / 2, py + 50);

    // Короткий код крупно
    ctx.fillStyle = '#FFD93D';
    const size = fitFontSize(ctx, short, panelW - 40, Math.min(W * 0.058, 26), 12, true);
    ctx.font = `bold ${size}px monospace`;
    ctx.fillText(short, W / 2, py + 84);

    ctx.fillStyle = '#9be3b0';
    ctx.font = `${Math.min(W * 0.024, 10.5)}px Arial`;
    ctx.fillText('в нём: обои, пол, окрас, персонаж и 6 предметов', W / 2, py + 104);

    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.min(W * 0.024, 10.5)}px Arial`;
    ctx.fillText('Полный код (весь дом) копируется и вставляется кнопкой', W / 2, py + 126);

    const bw = panelW - 32, bh = 38;
    createButton(ctx, px + 16, py + 140, bw, bh, '📋 Скопировать полный код', {
      bgColor: '#6BCB77', fgColor: '#fff', fontSize: 13, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + 140, w: bw, h: bh, text: 'copy' });

    createButton(ctx, px + 16, py + 184, bw, bh, '🅰 Ввести мой короткий код вручную', {
      bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 12, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + 184, w: bw, h: bh, text: 'show_short' });

    createButton(ctx, px + 16, py + 228, bw, bh, '➕ Ввести чужой код', {
      bgColor: '#FF8C42', fgColor: '#fff', fontSize: 13, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + 228, w: bw, h: bh, text: 'open_add' });

    this.drawNotif(ctx, W, H);
  }

  // ---- Добавить друга: настоящие поля ввода (в WebView работает вставка) ----
  drawAddFriend(ctx, W, H) {
    const panelW = Math.min(W * 0.94, 340);
    const panelH = 260;
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
    ctx.fillText('➕ Код друга', W / 2, py + 28);

    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.026, 11.5)}px Arial`;
    ctx.fillText('Короткие 16 знаков можно просто набрать:', W / 2, py + 50);

    // Что уже введено (из панели ввода или с клавиатуры)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, px + 16, py + 62, panelW - 32, 38, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.min(W * 0.032, 14)}px monospace`;
    ctx.textAlign = 'left';
    const shown = this.inputText
      ? this.inputText.substring(0, 22) + (this.inputText.length > 22 ? '…' : '')
      : '— код пока пустой —';
    ctx.fillText(shown, px + 26, py + 87);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.min(W * 0.024, 10.5)}px Arial`;
    ctx.fillText('Имя друга: ' + (this.friendName || '—'), px + 20, py + 118);

    const bw = panelW - 32, bh = 38;
    createButton(ctx, px + 16, py + 128, bw, bh, '⌨ Открыть поле ввода и вставить', {
      bgColor: '#4D96FF', fgColor: '#fff', fontSize: 13, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + 128, w: bw, h: bh, text: 'paste' });

    createButton(ctx, px + 16, py + 172, bw, bh, '✅ Добавить друга', {
      bgColor: '#6BCB77', fgColor: '#fff', fontSize: 14, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + 172, w: bw, h: bh, text: 'addcode' });

    createButton(ctx, px + 16, py + 216, bw, bh - 4, '← Назад к друзьям', {
      bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 12, radius: 10
    });
    this.buttons.push({ x: px + 16, y: py + 216, w: bw, h: bh - 4, text: 'to_list' });

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

  // Добавить друга по коду (короткому или полному) с понятным сообщением
  doAddFriend(rawCode, name) {
    const code = String(rawCode || '').trim();
    this.friendName = String(name || '').trim().slice(0, 16);
    if (!code) {
      this.showNotif('Сначала введи или вставь код');
      AudioSys.play('fail');
      return false;
    }
    const res = System.addFriendCode(code, this.friendName);
    if (res.ok) {
      AudioSys.play('success');
      this.showNotif('Друг добавлен: ' + res.name);
      this.inputText = '';
      this.friendName = '';
      this.tab = 'list';
      if (typeof ClipBridge !== 'undefined') ClipBridge.hide();
    } else if (res.reason === 'exists') {
      AudioSys.play('fail');
      this.showNotif('Такой друг уже есть в списке');
    } else if (res.reason === 'bad-short') {
      AudioSys.play('fail');
      this.showNotif('В коротком коде опечатка — проверь знаки');
    } else {
      AudioSys.play('fail');
      this.showNotif('Код не подошёл. Проверь, что скопировано целиком');
    }
    return res.ok;
  }

  // Кнопка «Добавить» в панели полей (имя, код) — приходит из ClipBridge
  handlePanelSubmit(name, code) {
    this.doAddFriend(code, name);
    return true;
  }

  // Панель закрыли — просто перерисовываем сцену
  onPanelClosed() {
    this.showNotif('Панель закрыта');
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
        // Полный код: открываем настоящие поля — WebView сам умеет копировать
        const full = System.getMyCode(this.game);
        if (typeof ClipBridge !== 'undefined' && ClipBridge.available()) {
          ClipBridge.show({
            mode: 'copy',
            title: '📋 Полный код (весь дом)',
            value: full,
            readonly: true,
            hint: 'Нажми «Скопировать» — код уйдёт в буфер. «Отправить» — сразу другу (SMS, мессенджер). Вставить потом можно кнопкой «Открыть поле ввода».'
          });
          this.showNotif('Открыл код: скопируй или отправь');
        } else {
          // Запасной путь без панели: выделить и скопировать
          this.inputText = full;
          this.showNotif('Код выделен — скопируй его из поля «Ввести чужой»');
        }
        return true;
      }

      if (t === 'show_short') {
        // Короткий код тоже даём выделить и переписать руками
        const short = System.getShortCode();
        this.inputText = short;
        if (typeof ClipBridge !== 'undefined' && ClipBridge.available()) {
          ClipBridge.show({
            mode: 'copy',
            title: '🅰 Короткий код (16 знаков)',
            value: short,
            hint: 'Его можно продиктовать голосом или переписать руками — 16 знаков, ничего лишнего.'
          });
        }
        this.showNotif('Короткий код: ' + short);
        return true;
      }

      if (t === 'paste') {
        if (typeof ClipBridge !== 'undefined' && ClipBridge.available()) {
          ClipBridge.show({
            mode: 'paste',
            title: '➕ Добавить друга',
            value: this.friendName || '',
            placeholder: 'Имя друга (латиницей или по-русски)',
            value2: this.inputText || '',
            value2Label: 'Код: короткие 16 знаков или длинный',
            submitLabel: '✅ Добавить',
            hint: 'Нажми на поле кода и удерживай палец — появится меню Android, выбери «Вставить». Короткий код можно просто набрать руками.'
          });
          this.showNotif('Поля открыты — вставь код');
        } else if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText()
            .then(txt => { this.inputText = (txt || '').trim(); this.showNotif('Вставлено'); })
            .catch(() => this.showNotif('Нет доступа к буферу — набери код руками'));
        } else {
          this.showNotif('Набери короткий код руками — он всего из 16 знаков');
        }
        return true;
      }

      if (t === 'addcode') {
        this.doAddFriend(this.inputText, this.friendName);
        return true;
      }
      return true;
    }
    return false;
  }
}

window.FriendsScene = FriendsScene;
