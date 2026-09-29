// ============ СЦЕНА МАГАЗИНА ============
class ShopScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.shakeItems = [];
    this.cartItems = [];
    this.notification = null;
    this.notificationTimer = 0;
    this.currentTab = 'food';
    // Вкладка «Дом»: какая комната и что смотрим (мебель / обои / пол)
    this.decorRoom = 'living';
    this.decorKind = 'furniture';
    this.decorPage = 0;
    this.decorPages = 1;
  }

  init() {
    this.time = 0;
    this.shakeItems = [];
    this.notification = null;
    this.notificationTimer = 0;
    this.currentTab = this.currentTab || 'food';
    this.decorRoom = this.decorRoom || 'living';
    this.decorKind = this.decorKind || 'furniture';
    this.decorPage = 0;
    this.page = 0;
    // Пришли из дома за мебелью — сразу открываем нужную комнату
    if (this.currentTab === 'decor' && typeof System !== 'undefined' && System.activeRoom) {
      this.decorRoom = System.activeRoom;
      this.decorKind = 'furniture';
    }
  }

  update(dt) {
    this.time += dt;
    if (this.notificationTimer > 0) {
      this.notificationTimer -= dt;
      if (this.notificationTimer <= 0) this.notification = null;
    }
    // Animated items
    if (Math.random() < 0.05) {
      this.shakeItems.push({
        x: Math.random() * this.game.width,
        y: Math.random() * this.game.height,
        vy: -randFloat(0.5, 1),
        alpha: 0.3,
        size: randFloat(3, 8)
      });
    }
    this.shakeItems.forEach(s => { s.y += s.vy; s.alpha -= 0.005; });
    this.shakeItems = this.shakeItems.filter(s => s.alpha > 0);
  }

  showNotification(emoji, text) {
    this.notification = { emoji, text, timer: 2000 };
    this.notificationTimer = 2000;
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#FFECD2');
    grad.addColorStop(1, '#FCB69F');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Floating particles
    this.shakeItems.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#FF8C42';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Header
    ctx.fillStyle = '#fff';
    roundRect(ctx, 10, 10, W - 20, 55, 12);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = `bold ${Math.min(W * 0.05, 24)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🛒 Магазин', W / 2, 35);

    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.035, 16)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText('🪙 ' + System.coins, W - 30, 35);

    // === XP ПРОГРЕСС-БАР В МАГАЗИНЕ ===
    const shopXpPct = System.xp / System.xpToNext;
    const shopXpBarY = 50;
    const shopXpBarW = (W - 40);
    const shopXpBarH = 12;

    ctx.font = `bold ${Math.min(W * 0.025, 11)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#333';
    ctx.fillText('⭐ Ур.' + System.level, 20, shopXpBarY - 1);

    ctx.font = `${Math.min(W * 0.02, 9)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(System.xp + '/' + System.xpToNext, W - 20, shopXpBarY - 1);

    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    roundRect(ctx, 20, shopXpBarY + 2, shopXpBarW, shopXpBarH, 6);
    ctx.fill();

    if (shopXpPct > 0) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, 20, shopXpBarY + 2, shopXpBarW * shopXpPct, shopXpBarH, 6);
      ctx.fill();
    }

    // Shop tabs
    const tabs = [
      { id: 'food', emoji: '🍕', name: 'Еда' },
      { id: 'toys', emoji: '🧸', name: 'Игрушки' },
      { id: 'clothes', emoji: '👔', name: 'Одежда' },
      { id: 'decor', emoji: '🛋️', name: 'Дом' },
      { id: 'fun', emoji: '🎉', name: 'Веселье' }
    ];

    const tabW = (W - 40) / 5;
    const tabH = 40;
    const tabStartY = 75;

    tabs.forEach((t, i) => {
      const tx = 20 + i * tabW;
      const isActive = t.id === this.currentTab;
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)';
      roundRect(ctx, tx + 2, tabStartY + 2, tabW - 4, tabH - 4, 10);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = '#FF8C42'; ctx.lineWidth = 2;
        roundRect(ctx, tx + 2, tabStartY + 2, tabW - 4, tabH - 4, 10); ctx.stroke();
      }
      ctx.fillStyle = isActive ? '#333' : '#777';
      ctx.font = `${isActive ? 'bold ' : ''}12px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(t.emoji, tx + tabW / 2, tabStartY + 18);
      ctx.fillText(t.name, tx + tabW / 2, tabStartY + 32);
    });

    // Items grid
    const items = [
      // Food
      { id: 'pizza', emoji: '🍕', name: 'Пицца', desc: '+30 сытости', cost: 15, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 30); } },
      { id: 'burger', emoji: '🍔', name: 'Бургер', desc: '+25 сытости', cost: 10, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 25); System.stats.happiness = Math.min(100, System.stats.happiness + 5); } },
      { id: 'cake', emoji: '🍰', name: 'Торт', desc: '+20 сытости, +15 счастья', cost: 25, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 20); System.stats.happiness = Math.min(100, System.stats.happiness + 15); } },
      { id: 'icecream', emoji: '🍦', name: 'Мороженое', desc: '+10 сытости, +10 счастья', cost: 8, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 10); System.stats.happiness = Math.min(100, System.stats.happiness + 10); } },

      // Toys
      { id: 'ball', emoji: '⚽', name: 'Мяч', desc: '+15 счастья, +5 XP', cost: 20, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 15); System.addXP(5); } },
      { id: 'puzzle', emoji: '🧩', name: 'Пазл', desc: '+10 счастья, +5 интеллекта', cost: 15, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 10); System.stats.intelligence = Math.min(100, System.stats.intelligence + 5); } },
      { id: 'robot', emoji: '🤖', name: 'Робот', desc: '+20 счастья, +10 XP', cost: 50, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 20); System.addXP(10); } },
      { id: 'doll', emoji: '🧸', name: 'Мишка', desc: '+15 счастья, успокаивает', cost: 25, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 15); System.stats.stress = Math.max(0, System.stats.stress - 10); } },

      // Одежда и аксессуары (внешний вид хранится в System.look)
      { id: 'no_acc', emoji: '🚫', name: 'Без аксессуаров', desc: 'Снять всё', cost: 0, category: 'clothes',
        effect: () => { System.look.hat = null; System.look.glasses = null; System.look.bowtie = false; System.saveGame(); } },
      { id: 'hat_cook', emoji: '👨‍🍳', name: 'Шеф-шапка', desc: 'Поварской колпак', cost: 40, category: 'clothes',
        effect: () => { System.look.hat = 'chef'; System.saveGame(); } },
      { id: 'hat_sci', emoji: '🧑‍🔬', name: 'Шапочка учёного', desc: 'Умный вид', cost: 35, category: 'clothes',
        effect: () => { System.look.hat = 'scientist'; System.saveGame(); } },
      { id: 'glasses_nerd', emoji: '🤓', name: 'Очки учёного', desc: 'Для чтения', cost: 35, category: 'clothes',
        effect: () => { System.look.glasses = 'nerd'; System.saveGame(); } },
      { id: 'cool_shades', emoji: '😎', name: 'Крутые очки', desc: 'Стиль', cost: 45, category: 'clothes',
        effect: () => { System.look.glasses = 'cool'; System.saveGame(); } },
      { id: 'bowtie', emoji: '🎀', name: 'Бабочка', desc: 'Нарядный', cost: 30, category: 'clothes',
        effect: () => { System.look.bowtie = true; System.saveGame(); } },
      { id: 'crown', emoji: '👑', name: 'Корона', desc: '+20 счастья!', cost: 100, category: 'clothes',
        effect: () => { System.look.hat = 'crown'; System.stats.happiness = Math.min(100, System.stats.happiness + 20); System.saveGame(); } },

      // Окрас шерсти — гофера видно издалека
      ...FURS.map(f => ({
        id: 'fur_' + f.id, emoji: '🎨', name: 'Окрас: ' + f.name,
        desc: f.cost === 0 ? 'Классический цвет' : 'Новый цвет шерсти',
        cost: f.cost === 0 ? 5 : f.cost, category: 'clothes', fur: f.id
      })),

      // Fun
      { id: 'party', emoji: '🎉', name: 'Вечеринка', desc: '+30 счастья!', cost: 60, category: 'fun', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 30); this.game.gopher.setExpression('excited', 999); } },
      { id: 'fireworks', emoji: '🎆', name: 'Фейерверк', desc: '+25 счастья, +15 XP', cost: 80, category: 'fun', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 25); System.addXP(15); } },
      { id: 'movie', emoji: '🎬', name: 'Кино', desc: '+20 счастья', cost: 20, category: 'fun', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 20); System.stats.energy = Math.max(0, System.stats.energy - 10); } },
      { id: 'pet_treatment', emoji: '💎', name: 'Лечение', desc: '+25 здоровья', cost: 50, category: 'fun', effect: () => { System.stats.health = Math.min(100, System.stats.health + 25); if (System.stats.health > 50) System.isSick = false; } }
    ];

    const cols = 2;
    const itemW = (W - 40) / cols;
    const startX = 20;
    // Вкладка «Дом»: над сеткой стоят фильтры комнат и вида товара
    const startY = this.currentTab === 'decor' ? 182 : 130;
    // Дом — отдельная логика: комнаты, обои, пол и страницы каталога
    let filteredItems;
    if (this.currentTab === 'decor') {
      filteredItems = this.decorItems();
    } else {
      filteredItems = items.filter(it => it.category === this.currentTab);
    }
    // Карточки обязаны уместиться над кнопкой «Назад», иначе последний ряд обрезается
    const itemRows = Math.min(3, Math.ceil(filteredItems.length / cols));
    const itemH = Math.min(110, (H - startY - 70) / Math.max(itemRows, 1));

    if (this.currentTab === 'decor') this.drawDecorFilters(ctx, W, H, filteredItems);

    // Во вкладках без фильтров тоже нужны страницы: иначе 7-й и следующие
    // товары уезжают за нижний край экрана и их нельзя купить.
    const perPage = itemRows * cols;
    const pages = Math.max(1, Math.ceil(filteredItems.length / perPage));
    this.pages = pages;
    if ((this.page || 0) >= pages) this.page = 0;
    const shownItems = (this.currentTab === 'decor')
      ? filteredItems
      : filteredItems.slice((this.page || 0) * perPage, (this.page || 0) * perPage + perPage);

    if (this.currentTab !== 'decor' && pages > 1) {
      const py = H - 100;
      ctx.fillStyle = '#4a4a4a';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('стр. ' + ((this.page || 0) + 1) + ' / ' + pages, W / 2, py + 15);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      roundRect(ctx, W / 2 - 96, py, 44, 24, 8); ctx.fill();
      roundRect(ctx, W / 2 + 52, py, 44, 24, 8); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('\u25c0', W / 2 - 74, py + 17);
      ctx.fillText('\u25b6', W / 2 + 74, py + 17);
      this.buttons.push({ x: W / 2 - 96, y: py, w: 44, h: 24, action: 'shopPage:-1' });
      this.buttons.push({ x: W / 2 + 52, y: py, w: 44, h: 24, action: 'shopPage:1' });
    }

    shownItems.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ix = startX + col * itemW;
      const iy = startY + row * itemH;
      const owned = item.furniture ? System.ownsFurniture(item.id)
        : (item.fur ? System.look.fur === item.fur : !!item.owned);
      const active = !!item.active;
      const canAfford = System.canAfford(item.cost) && !owned;

      // Item card
      ctx.fillStyle = active ? 'rgba(107,203,119,0.55)'
        : (owned ? 'rgba(107,203,119,0.28)' : (canAfford ? 'rgba(255,255,255,0.9)' : 'rgba(200,200,200,0.7)'));
      roundRect(ctx, ix, iy, itemW - 4, itemH - 4, 15);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2.5;
        roundRect(ctx, ix, iy, itemW - 4, itemH - 4, 15);
        ctx.stroke();
      }

      if (!canAfford) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        roundRect(ctx, ix, iy, itemW - 4, itemH - 4, 15);
        ctx.fill();
      }

      // Плашка с настоящим цветом обоев/пола — видно, что покупаешь.
      // Она же заменяет эмодзи: две картинки в одном углу налезали друг на друга.
      let swatch = null;
      if (item.wallId || item.floorId) {
        const src = item.wallId
          ? (typeof WALLS !== 'undefined' ? WALLS.find(x => x.id === item.wallId) : null)
          : (typeof FLOORS !== 'undefined' ? FLOORS.find(x => x.id === item.floorId) : null);
        if (src) {
          swatch = src;
          const sw = Math.min(itemW * 0.24, 38);
          const sy2 = iy + itemH * 0.30 - sw * 0.4;
          // Верх — светлый оттенок, низ — основной цвет: плашку видно даже
          // у самых бледных обоев («Мятные», «Плитка»)
          ctx.fillStyle = src.c2;
          roundRect(ctx, ix + 10, sy2, sw, sw, 6);
          ctx.fill();
          ctx.save();
          roundRect(ctx, ix + 10, sy2, sw, sw, 6);
          ctx.clip();
          ctx.fillStyle = src.c1;
          ctx.fillRect(ix + 10, sy2, sw, sw * 0.5);
          ctx.restore();
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1.5;
          roundRect(ctx, ix + 10, sy2, sw, sw, 6);
          ctx.stroke();
        }
      }

      // Emoji (у обоев и пола вместо него — цветовая плашка)
      if (!swatch) {
        ctx.font = `${Math.min(itemW * 0.32, 34)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#333';
        ctx.fillText(item.emoji, ix + 10, iy + itemH * 0.36);
      }

      // Name
      ctx.textAlign = 'left';   // обязательно: предыдущая карточка могла оставить 'right'
      const nameSize = fitFontSize(ctx, item.name, itemW - 62, Math.min(itemW * 0.13, 14), 9, true);
      ctx.font = `bold ${nameSize}px Arial`;
      ctx.fillStyle = '#333';
      ctx.fillText(item.name, ix + 50, iy + itemH * 0.30);

      // Desc
      const descSize = fitFontSize(ctx, item.desc, itemW - 62, Math.min(itemW * 0.1, 11), 8, false);
      ctx.font = `${descSize}px Arial`;
      ctx.fillStyle = '#666';
      ctx.fillText(item.desc, ix + 50, iy + itemH * 0.50);

      // Для мебели — подсказка: комната и уровень цены
      if (item.roomLabel) {
        ctx.fillStyle = '#8B6B3D';
        const label = item.roomLabel + (item.tier ? ' \u00b7 ' + item.tier : '');
        const labelSize = fitFontSize(ctx, label, itemW - 62, Math.min(itemW * 0.095, 10), 7.5, false);
        ctx.font = `${labelSize}px Arial`;
        ctx.fillText(label, ix + 50, iy + itemH * 0.68);
      }

      // Цена / состояние
      ctx.textAlign = 'right';
      ctx.font = `bold ${Math.min(itemW * 0.12, 13)}px Arial`;
      if (active) {
        ctx.fillStyle = '#1B5E20';
        ctx.fillText('✓ Сейчас тут', ix + itemW - 15, iy + itemH - 14);
      } else if (owned) {
        ctx.fillStyle = '#2E7D32';
        ctx.fillText((item.wallId || item.floorId) ? 'Применить' : '✓ Куплено', ix + itemW - 15, iy + itemH - 14);
      } else if (item.cost === 0) {
        ctx.fillStyle = '#2E7D32';
        ctx.fillText('Бесплатно', ix + itemW - 15, iy + itemH - 14);
      } else {
        ctx.fillStyle = canAfford ? '#4CAF50' : '#999';
        ctx.fillText('🪙 ' + item.cost, ix + itemW - 15, iy + itemH - 14);
      }

      this.buttons.push({ ...item, x: ix, y: iy, w: itemW - 4, h: itemH - 4 });
    });

    // Back button
    this.buttons.push(createButton(ctx, 10, H - 50, 100, 40, '← Назад', {
      bgColor: 'rgba(0,0,0,0.2)',
      fgColor: '#fff',
      fontSize: 14,
      radius: 10
    }));

    // Notification
    if (this.notification) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, W * 0.1, H * 0.5, W * 0.8, 60, 15);
      ctx.fill();
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(this.notification.emoji + ' ' + this.notification.text, W / 2, H * 0.5 + 30);
    }
  }

  // ================= ВКЛАДКА «ДОМ» =================
  // Комнат четыре, и у каждой — своя мебель. Плюс обои и пол, которые
  // покупаются один раз и потом применяются бесплатно.
  decorItems() {
    const kind = this.decorKind || 'furniture';
    const room = this.decorRoom || 'living';
    let list = [];

    if (kind === 'furniture') {
      list = ((typeof furnitureForRoom === 'function') ? furnitureForRoom(room) : []).map(f => ({
        id: f.id, emoji: f.emoji, name: f.name, desc: f.desc, cost: f.cost,
        category: 'decor', furniture: true,
        roomLabel: (typeof findRoom === 'function') ? findRoom(room).name : '',
        tier: (typeof tierOf === 'function') ? tierOf(f.cost) : ''
      }));
      // сначала дешёвое — ребёнку понятнее, что можно купить прямо сейчас
      list.sort((a, b) => a.cost - b.cost);
    } else if (kind === 'walls') {
      list = ((typeof WALLS !== 'undefined') ? WALLS : []).map(w => ({
        id: 'wall_' + w.id, emoji: '\ud83c\udfa8', name: w.name,
        desc: w.cost === 0 ? 'Стартовые обои' : 'Покупается один раз',
        cost: w.cost, category: 'decor', wallId: w.id,
        owned: System.ownsWall(w.id), active: System.currentRoomData().wall === w.id,
        roomLabel: 'Ставь в любой комнате', tier: ''
      }));
    } else {
      list = ((typeof FLOORS !== 'undefined') ? FLOORS : []).map(fl => ({
        id: 'floor_' + fl.id, emoji: '\ud83e\uddf1', name: fl.name,
        desc: fl.cost === 0 ? 'Стартовый пол' : 'Покупается один раз',
        cost: fl.cost, category: 'decor', floorId: fl.id,
        owned: System.ownsFloor(fl.id), active: System.currentRoomData().floor === fl.id,
        roomLabel: 'Ставь в любой комнате', tier: ''
      }));
    }

    // страницы по 6 карточек
    const perPage = 6;
    this.decorPages = Math.max(1, Math.ceil(list.length / perPage));
    if ((this.decorPage || 0) >= this.decorPages) this.decorPage = 0;
    const from = (this.decorPage || 0) * perPage;
    return list.slice(from, from + perPage);
  }

  // Фильтры над сеткой: комната, вид товара, страницы
  drawDecorFilters(ctx, W, H, shown) {
    const rooms = (typeof HOME_ROOMS !== 'undefined') ? HOME_ROOMS : [];
    const y = 118;
    const gap = 6, pad = 20;
    const rw = (W - pad * 2 - gap * (rooms.length - 1)) / rooms.length;

    rooms.forEach((r, i) => {
      const x = pad + i * (rw + gap);
      const active = (this.decorRoom || 'living') === r.id && (this.decorKind || 'furniture') === 'furniture';
      ctx.fillStyle = active ? '#FF8C42' : 'rgba(255,255,255,0.55)';
      roundRect(ctx, x, y, rw, 24, 8);
      ctx.fill();
      ctx.fillStyle = active ? '#fff' : '#4a4a4a';
      const size = fitFontSize(ctx, r.name, rw - 6, 11.5, 7.5, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(r.name, x + rw / 2, y + 16);
      this.buttons.push({ x: x, y: y, w: rw, h: 24, action: 'decorRoom:' + r.id });
    });

    // вид товара: мебель / обои / пол
    const kinds = [
      { id: 'furniture', label: '\ud83e\ude91 Мебель' },
      { id: 'walls', label: '\ud83c\udfa8 Обои' },
      { id: 'floors', label: '\ud83e\uddf1 Пол' }
    ];
    const kw = (W - pad * 2 - gap * 2) / 3;
    kinds.forEach((k, i) => {
      const x = pad + i * (kw + gap);
      const active = (this.decorKind || 'furniture') === k.id;
      ctx.fillStyle = active ? '#9B59B6' : 'rgba(255,255,255,0.45)';
      roundRect(ctx, x, y + 28, kw, 24, 8);
      ctx.fill();
      ctx.fillStyle = active ? '#fff' : '#4a4a4a';
      const size = fitFontSize(ctx, k.label, kw - 6, 11, 7, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(k.label, x + kw / 2, y + 44);
      this.buttons.push({ x: x, y: y + 28, w: kw, h: 24, action: 'decorKind:' + k.id });
    });

    // Листание каталога — внизу, над кнопкой «Назад» (иначе налезает на карточки)
    if ((this.decorPages || 1) > 1) {
      const py2 = H - 100;
      ctx.fillStyle = '#4a4a4a';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('стр. ' + ((this.decorPage || 0) + 1) + ' / ' + this.decorPages, W / 2, py2 + 15);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      roundRect(ctx, W / 2 - 96, py2, 44, 24, 8); ctx.fill();
      roundRect(ctx, W / 2 + 52, py2, 44, 24, 8); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('\u25c0', W / 2 - 74, py2 + 17);
      ctx.fillText('\u25b6', W / 2 + 74, py2 + 17);
      this.buttons.push({ x: W / 2 - 96, y: py2, w: 44, h: 24, action: 'decorPage:-1' });
      this.buttons.push({ x: W / 2 + 52, y: py2, w: 44, h: 24, action: 'decorPage:1' });
    }

  }

  handleClick(mx, my) {
    // Check tab clicks
    const W = this.game.width;
    const tabW = (W - 40) / 5;
    const tabStartY = 75;
    const tabIds = ['food', 'toys', 'clothes', 'decor', 'fun'];
    for (let i = 0; i < 5; i++) {
      const tx = 20 + i * tabW;
      if (isPointInRect(mx, my, tx + 2, tabStartY + 2, tabW - 4, 36)) {
        this.currentTab = tabIds[i];
        this.page = 0;
        if (this.currentTab === 'decor') {
          this.decorPage = 0;
          if (typeof System !== 'undefined' && System.activeRoom) this.decorRoom = System.activeRoom;
        }
        AudioSys.play('click');
        return true;
      }
    }

    AudioSys.play('click');

    // ---- Фильтры вкладки «Дом» (комната, вид, страницы) ----
    for (const btn of this.buttons) {
      if (!btn.action) continue;
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const a = btn.action;
      if (a.indexOf('shopPage:') === 0) {
        const d = parseInt(a.slice(9), 10) || 1;
        const p = this.pages || 1;
        this.page = ((this.page || 0) + d + p) % p;
        AudioSys.play('click');
        return true;
      }
      if (a.indexOf('decorRoom:') === 0) {
        this.decorRoom = a.slice(10);
        this.decorKind = 'furniture';
        this.decorPage = 0;
        AudioSys.play('click');
        return true;
      }
      if (a.indexOf('decorKind:') === 0) {
        this.decorKind = a.slice(10);
        this.decorPage = 0;
        AudioSys.play('click');
        return true;
      }
      if (a.indexOf('decorPage:') === 0) {
        const d = parseInt(a.slice(10), 10) || 1;
        const pages = this.decorPages || 1;
        this.decorPage = ((this.decorPage || 0) + d + pages) % pages;
        AudioSys.play('click');
        return true;
      }
    }

    // Check item buttons
    for (const btn of this.buttons.slice(0, -1)) {
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        // Обои и пол: покупаются один раз, применяются к текущей комнате
        if (btn.wallId) {
          const id = btn.wallId;
          const w = WALLS.find(x => x.id === id);
          if (System.ownsWall(id)) {
            System.setWall(id);
            this.showNotification('\ud83c\udfa8', w.name + ' — применено');
            AudioSys.play('success');
            return true;
          }
          if (!System.canAfford(w.cost)) {
            this.showNotification('\ud83e\ude99', 'Не хватает монет! Нужно ещё ' + (w.cost - System.coins));
            AudioSys.play('fail');
            return true;
          }
          System.setWall(id);
          this.showNotification('\ud83c\udfa8', w.name + ' — куплено за ' + w.cost);
          System.addXP(6);
          AudioSys.play('success');
          return true;
        }
        if (btn.floorId) {
          const id = btn.floorId;
          const fl = FLOORS.find(x => x.id === id);
          if (System.ownsFloor(id)) {
            System.setFloor(id);
            this.showNotification('\ud83e\uddf1', fl.name + ' — применено');
            AudioSys.play('success');
            return true;
          }
          if (!System.canAfford(fl.cost)) {
            this.showNotification('\ud83e\ude99', 'Не хватает монет! Нужно ещё ' + (fl.cost - System.coins));
            AudioSys.play('fail');
            return true;
          }
          System.setFloor(id);
          this.showNotification('\ud83e\uddf1', fl.name + ' — куплено за ' + fl.cost);
          System.addXP(6);
          AudioSys.play('success');
          return true;
        }

        // Мебель: купленная вещь сразу встаёт в комнату
        if (btn.furniture) {
          if (System.ownsFurniture(btn.id)) {
            this.showNotification('🏠', btn.name + ' уже дома!');
            AudioSys.play('fail');
            return true;
          }
          if (!System.canAfford(btn.cost)) {
            this.showNotification('🪙', 'Не хватает монет! Нужно ещё ' + (btn.cost - System.coins));
            AudioSys.play('fail');
            return true;
          }
          System.spendCoins(btn.cost);
          System.buyFurniture(btn.id, this.decorRoom || 'living');
          this.showNotification(btn.emoji, btn.name + ' уже в комнате!');
          System.addXP(8);
          System.saveGame();
          AudioSys.play('success');
          this.game.gopher.setExpression('excited', 60);
          return true;
        }

        if (btn.fur) {
          if (System.look.fur === btn.fur) {
            this.showNotification('🎨', 'Этот окрас уже выбран');
            AudioSys.play('fail');
            return true;
          }
          if (!System.canAfford(btn.cost)) {
            this.showNotification('🪙', 'Не хватает монет!');
            AudioSys.play('fail');
            return true;
          }
          System.spendCoins(btn.cost);
          System.setFur(btn.fur);
          System.applyLookTo(this.game.gopher);
          this.showNotification('🎨', 'Новый окрас: ' + findFur(btn.fur).name);
          System.addXP(6);
          AudioSys.play('success');
          this.game.gopher.setExpression('excited', 60);
          return true;
        }

        if (System.canAfford(btn.cost)) {
          System.spendCoins(btn.cost);
          btn.effect();
          System.applyLookTo(this.game.gopher);
          this.showNotification(btn.emoji, 'Куплено: ' + btn.name + '!');
          System.addXP(5);
          System.saveGame();
          AudioSys.play('success');
          if (btn.cost >= 30) {
            this.game.gopher.setExpression('excited', 60);
          }
        } else {
          this.showNotification('🪙', 'Не хватает монет!');
          AudioSys.play('fail');
        }
        return true;
      }
    }

    // Back button
    if (this.buttons.length > 0) {
      const backBtn = this.buttons[this.buttons.length - 1];
      if (isPointInRect(mx, my, backBtn.x, backBtn.y, backBtn.w, backBtn.h)) {
        this.game.transitionTo('map');
        return true;
      }
    }

    return false;
  }
}
window.ShopScene = ShopScene;
