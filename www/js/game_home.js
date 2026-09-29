// ============ СЦЕНА ДОМА ============
// Дом — это «живая» комната: обои и пол перекрашиваются, мебель
// ставится перетаскиванием, гофер ест, купается, играет и спит.
class HomeScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.bubbleText = '';
    this.bubbleTimer = 0;

    // Режим обстановки
    this.decorMode = false;
    this.sheet = null;        // null | 'furniture' | 'walls' | 'floors'
    this.sheetPage = 0;
    this.sheetBtnFrom = 0;
    this.selected = null;     // id выбранной мебели
    this.dragId = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dragMoved = false;
    this.dragLive = null;     // { id, x, y } — позиция во время перетаскивания

    // Анимации
    this.feed = 0;
    this.feedEmoji = null;
    this.bath = 0;
    this.playBall = null;
    this.playTimer = 0;
    this.crumbs = [];
    this.sparkles = [];
    this.zzz = [];
  }

  init() {
    this.time = 0;
    this.bubbleText = '';
    this.bubbleTimer = 0;
    this.decorMode = false;
    this.sheet = null;
    this.sheetPage = 0;
    this.sheetBtnFrom = 0;
    this.selected = null;
    this.dragId = null;
    this.dragLive = null;
    this.dragMoved = false;
    this.feed = 0;
    this.feedEmoji = null;
    this.bath = 0;
    this.playBall = null;
    this.playTimer = 0;
    this.crumbs = [];
    this.sparkles = [];
    this.zzz = [];
    if (System.furniture.length === 0 && System.inventory.length === 0) {
      this.setBubble('Загляни в магазин — обустроим комнату! 🛒');
    }
  }

  // ---------- Геометрия экрана ----------
  layout() {
    const W = this.game.width, H = this.game.height;
    const btnGap = 6;
    const btnH = Math.max(38, Math.min(48, H * 0.070));
    const btnCols = 4;
    const btnW = (W - 20 - (btnCols - 1) * btnGap) / btnCols;
    const rows = 2;
    const actionsH = rows * btnH + (rows - 1) * btnGap;
    const actionsTop = H - 8 - actionsH;

    const pad = 9, labelH = 11, barH = 12, rowGap = 5, statRows = 3;
    const panelH = pad * 2 + statRows * (labelH + barH) + (statRows - 1) * rowGap;
    const panelTop = actionsTop - 8 - panelH;

    const bubbleTop = 36, bubbleH = 42;
    const roomTop = bubbleTop + bubbleH + 6;
    const roomBottom = panelTop - 8;
    const roomH = Math.max(120, roomBottom - roomTop);
    const floorTop = roomTop + roomH * 0.52;
    const floorDepth = roomH * 0.48;

    const gs = Math.min(W * 0.36, roomH * 0.46, 150);
    const feetY = floorTop + floorDepth * 0.34;
    const gopherY = feetY - gs * 0.52;

    return {
      W, H, btnGap, btnH, btnW, btnCols, actionsTop, actionsH,
      pad, labelH, barH, rowGap, panelTop, panelH,
      bubbleTop, bubbleH,
      roomRect: { x: 0, y: roomTop, w: W, h: roomH },
      floorTop, floorDepth, floorBottom: roomBottom,
      gs, gopherY
    };
  }

  setBubble(text) {
    this.bubbleText = text;
    this.bubbleTimer = 3.2;
  }

  update(dt) {
    this.time += dt;
    const sec = dt / 1000;

    if (this.bubbleTimer > 0) {
      this.bubbleTimer -= sec;
      if (this.bubbleTimer <= 0) this.bubbleText = '';
    }

    // Еда
    if (this.feed > 0) {
      this.feed -= sec;
      if (Math.random() < 0.35) {
        this.crumbs.push({ dx: 0, dy: 0, vx: randFloat(-0.6, 0.6), vy: randFloat(-1.4, -0.5), life: 1 });
      }
      if (this.feed <= 0) { this.feed = 0; this.feedEmoji = null; }
    }
    this.crumbs.forEach(c => { c.dx += c.vx; c.dy += c.vy; c.vy += 0.09; c.life -= 0.02; });
    this.crumbs = this.crumbs.filter(c => c.life > 0);

    // Купание
    if (this.bath > 0) this.bath -= sec;

    // Игра с мячиком
    if (this.playBall) {
      const L = this.layout();
      const b = this.playBall;
      b.vy += 0.35;
      b.x += b.vx;
      b.y += b.vy;
      const groundY = L.floorTop + L.floorDepth * 0.55;
      if (b.y > groundY) {
        b.y = groundY;
        b.vy = -Math.abs(b.vy) * 0.78;
        b.vx = -b.vx * 0.96;
      }
      if (b.x < L.roomRect.x + 14 || b.x > L.roomRect.x + L.roomRect.w - 14) b.vx = -b.vx;
      this.playTimer -= sec;
      if (this.playTimer <= 0) { this.playBall = null; this.playTimer = 0; }
    }

    // Во сне над головой всплывают «Zzz»
    if (System.isSleeping && Math.random() < 0.05) {
      const L = this.layout();
      this.zzz.push({ x: L.W * 0.5 + randFloat(-18, 18), y: L.gopherY - L.gs * 0.5, life: 1 });
    }
    this.zzz.forEach(z => { z.y -= 0.35; z.life -= 0.008; });
    this.zzz = this.zzz.filter(z => z.life > 0);

    if (!System.isSleeping && Math.random() < 0.02) {
      const L = this.layout();
      this.sparkles.push({
        x: randFloat(L.roomRect.x + 20, L.roomRect.x + L.roomRect.w - 20),
        y: randFloat(L.roomRect.y + 20, L.floorTop),
        life: 1
      });
    }
    this.sparkles.forEach(s => { s.life -= 0.012; });
    this.sparkles = this.sparkles.filter(s => s.life > 0);
  }

  // ================= ОТРИСОВКА =================
  draw(ctx) {
    const L = this.layout();
    this.buttons = [];

    this.drawRoom(ctx, L);
    this.drawGopher(ctx, L);
    this.drawEffects(ctx, L);
    this.drawTopBar(ctx, L);
    if (this.bubbleText) this.drawBubble(ctx, L);
    this.drawStats(ctx, L);

    if (this.decorMode) this.drawDecorUI(ctx, L);
    else this.drawActions(ctx, L);

    if (System.isSleeping) this.drawSleepOverlay(ctx, L);
    if (this.sheet) this.drawSheet(ctx, L);
  }

  // ---------- Комната и мебель ----------
  drawRoom(ctx, L) {
    const rect = L.roomRect;
    // Во время перетаскивания показываем предмет в новой позиции
    const furniture = System.furniture.map(it => {
      if (this.dragLive && this.dragLive.id === it.id) {
        return { id: it.id, x: this.dragLive.x, y: this.dragLive.y };
      }
      return it;
    });

    const opts = {};
    if (this.decorMode && this.dragId) opts.skipId = this.dragId;
    RoomView.drawAll(ctx, rect, System.room, furniture, opts);

    // Перетаскиваемый предмет — поверх остальных
    if (opts.skipId) {
      const it = furniture.find(f => f.id === opts.skipId);
      if (it) RoomView.drawItem(ctx, it, rect, {});
    }

    if (this.decorMode) this.drawDecorMarks(ctx, L, rect, furniture);
  }

  // ---------- Гофер ----------
  drawGopher(ctx, L) {
    const g = this.game.gopher;
    if (!g) return;

    if (System.isSleeping) g.setExpression('sleeping', 9999);
    else if (this.feed > 0) g.setExpression('eating', 30);
    else if (this.bath > 0) g.setExpression('happy', 30);
    else if (this.playTimer > 0) g.setExpression('excited', 30);
    else if (System.isSick) g.setExpression('sick', 30);
    else if (System.stats.happiness > 60) g.setExpression('happy', 30);
    else if (System.stats.hunger < 30) g.setExpression('sad', 30);
    else g.setExpression('neutral', 30);

    g.outfit = null;
    if (this.feed > 0 && this.feedEmoji) { g.heldEmoji = this.feedEmoji; g.heldTimer = 5; }
    else if (this.bath > 0) { g.heldEmoji = '🧼'; g.heldTimer = 5; }
    else { g.heldEmoji = null; g.heldTimer = 0; }
    g.shower = this.bath > 0 ? 2 : 0;

    g.draw(ctx, L.W * 0.5, L.gopherY, L.gs / g.size);
  }

  // ---------- Эффекты ----------
  drawEffects(ctx, L) {
    const mx = L.W * 0.5 + L.gs * 0.10;
    const my = L.gopherY + L.gs * 0.10;
    ctx.fillStyle = '#C89B62';
    this.crumbs.forEach(c => {
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.beginPath();
      ctx.arc(mx + c.dx, my + c.dy, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#FFD93D';
    this.sparkles.forEach(s => {
      ctx.globalAlpha = Math.max(0, s.life) * 0.8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.zzz.length; i++) {
      const z = this.zzz[i];
      ctx.globalAlpha = Math.max(0, z.life);
      ctx.font = `${14 + (i % 3) * 5}px Arial`;
      ctx.fillText('💤', z.x, z.y);
    }
    ctx.globalAlpha = 1;

    if (this.playBall) {
      const b = this.playBall;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(b.x, L.floorTop + L.floorDepth * 0.58, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
      ctx.moveTo(b.x - 9, b.y);
      ctx.lineTo(b.x + 9, b.y);
      ctx.stroke();
    }
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Верхняя панель: монеты, уровень, опыт, обстановка ----------
  drawTopBar(ctx, L) {
    const W = L.W;
    const fs = Math.min(W * 0.031, 13);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = `bold ${fs}px Arial`;
    ctx.fillStyle = '#B8860B';
    ctx.fillText('\ud83e\ude99 ' + System.coins, 10, 24);

    ctx.textAlign = 'center';
    ctx.fillStyle = System.isSleeping ? '#5b4b8a' : '#8B4513';
    ctx.fillText('\u2b50 ' + System.level, W * 0.36, 24);

    const barX = W * 0.50, barW = W - 52 - barX, barY = 13, barH = 12;
    ctx.fillStyle = 'rgba(139,69,19,0.16)';
    roundRect(ctx, barX, barY, barW, barH, 6);
    ctx.fill();
    const pct = clamp(System.xp / System.xpToNext, 0, 1);
    if (pct > 0) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, barX, barY, Math.max(barW * pct, 6), barH, 6);
      ctx.fill();
    }
    ctx.font = `${Math.min(W * 0.019, 9)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(90,60,30,0.9)';
    ctx.fillText(System.xp + '/' + System.xpToNext, barX + barW / 2, barY + 9.5);

    // Маленькая кнопка «Обстановка»
    const bw = 38, bh = 30, bx = W - 46, by = 8;
    ctx.fillStyle = this.decorMode ? '#6BCB77' : 'rgba(139,69,19,0.18)';
    roundRect(ctx, bx, by, bw, bh, 9);
    ctx.fill();
    if (!this.decorMode) {
      ctx.strokeStyle = 'rgba(139,69,19,0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 9);
      ctx.stroke();
    }
    ctx.font = `${Math.min(bw * 0.5, 17)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.decorMode ? '\u2705' : '\ud83d\udecb\ufe0f', bx + bw / 2, by + bh / 2 + 1);
    this.buttons.push({ x: bx, y: by, w: bw, h: bh, action: 'decorToggle' });
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Облачко с репликой ----------
  drawBubble(ctx, L) {
    const W = L.W;
    const y = L.bubbleTop;
    ctx.font = `bold ${Math.min(W * 0.033, 14)}px Arial`;
    const maxW = W * 0.62;
    const lines = wrapLines(ctx, this.bubbleText, maxW, 2);
    const boxW = Math.min(W - 30, Math.max.apply(null, lines.map(l => ctx.measureText(l).width)) + 28);
    const boxH = 16 + lines.length * 15;
    const bx = (W - boxW) / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, bx, y, boxW, boxH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,140,110,0.7)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, y, boxW, boxH, 14);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 7, y + boxH - 1);
    ctx.lineTo(W / 2, y + boxH + 8);
    ctx.lineTo(W / 2 + 7, y + boxH - 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4a3a2a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, y + 14 + i * 15);
    });
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Панель характеристик ----------
  drawStats(ctx, L) {
    const W = L.W;
    const stats = [
      { key: 'happiness', emoji: '\u2764\ufe0f', name: 'Счастье' },
      { key: 'hunger', emoji: '\ud83c\udf57', name: 'Сытость' },
      { key: 'energy', emoji: '\u26a1', name: 'Энергия' },
      { key: 'cleanliness', emoji: '\ud83e\uddfc', name: 'Чистота' },
      { key: 'health', emoji: '\ud83c\udfe5', name: 'Здоровье' },
      { key: 'stress', emoji: '\ud83d\ude30', name: 'Стресс' }
    ];

    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    roundRect(ctx, 10, L.panelTop, W - 20, L.panelH, 12);
    ctx.fill();

    const colGap = 12;
    const cellW = (W - 20 - L.pad * 2 - colGap) / 2;
    stats.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = 10 + L.pad + col * (cellW + colGap);
      const rowTop = L.panelTop + L.pad + row * (L.labelH + L.barH + L.rowGap);
      const baseline = rowTop + L.labelH - 1;
      const val = System.stats[s.key];

      ctx.font = `bold ${Math.min(L.labelH - 1, 11)}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(s.emoji + ' ' + s.name, cx, baseline);

      ctx.font = `${Math.min(L.labelH - 2, 10)}px Arial`;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(Math.round(val) + '%', cx + cellW, baseline);

      drawProgressBar(ctx, cx, rowTop + L.labelH + 1, cellW, L.barH, val, 100,
        'rgba(255,255,255,0.18)', System.getStatColor(s.key));
    });
  }

  // ---------- Кнопки действий ----------
  actionsList() {
    const sleeping = System.isSleeping;
    const sick = System.isSick || System.stats.health < 50;
    return [
      { emoji: '\ud83c\udf7d\ufe0f', text: 'Покормить', action: 'feed', color: '#FF6B6B', off: sleeping || System.stats.hunger >= 100 },
      { emoji: '\ud83d\udec1', text: 'Искупать', action: 'bathe', color: '#00BCD4', off: sleeping || System.stats.cleanliness >= 100 },
      { emoji: sleeping ? '\u2600\ufe0f' : '\ud83d\ude34', text: sleeping ? 'Разбудить' : 'Уложить спать', action: 'sleep', color: sleeping ? '#FFB300' : '#3F51B5' },
      { emoji: '\ud83d\udc8a', text: 'Лечить', action: 'heal', color: '#E74C3C', off: !sick },
      { emoji: '\ud83c\udfae', text: 'Играть', action: 'play', color: '#FF8C42', off: sleeping || System.stats.energy <= 10 },
      { emoji: '\ud83c\udfe2', text: 'Работа', action: 'work', color: '#4D96FF', off: sleeping || System.stats.energy < 40 },
      { emoji: '\ud83c\udf93', text: 'Учёба', action: 'study', color: '#9B59B6', off: sleeping || System.stats.energy < 40 },
      { emoji: '\ud83d\uddfa\ufe0f', text: 'Карта', action: 'map', color: '#2ECC71' }
    ];
  }

  drawActions(ctx, L) {
    const list = this.actionsList();
    list.forEach((ab, i) => {
      const col = i % L.btnCols;
      const row = Math.floor(i / L.btnCols);
      const bx = 10 + col * (L.btnW + L.btnGap);
      const by = L.actionsTop + row * (L.btnH + L.btnGap);

      ctx.fillStyle = ab.color;
      roundRect(ctx, bx, by, L.btnW, L.btnH, 12);
      ctx.fill();
      if (ab.off) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        roundRect(ctx, bx, by, L.btnW, L.btnH, 12);
        ctx.fill();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(L.btnW * 0.30, 21)}px Arial`;
      ctx.fillText(ab.emoji, bx + L.btnW / 2, by + 3);

      const size = fitFontSize(ctx, ab.text, L.btnW - 6, Math.min(L.btnW * 0.16, 11.5), 7.5, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(ab.text, bx + L.btnW / 2, by + L.btnH - 3);

      this.buttons.push({ x: bx, y: by, w: L.btnW, h: L.btnH, action: ab.action, off: !!ab.off });
    });
    ctx.textBaseline = 'alphabetic';
  }

  drawSleepOverlay(ctx, L) {
    ctx.fillStyle = 'rgba(24,24,64,0.28)';
    ctx.fillRect(0, L.bubbleTop - 6, L.W, L.panelTop - L.bubbleTop + 2);

    const txt = 'Сон: +' + (100 / System.SLEEP_FULL_MINUTES).toFixed(0) + '% энергии в минуту';
    ctx.font = `bold ${Math.min(L.W * 0.026, 11.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 22;
    const by = L.panelTop - 30;
    ctx.fillStyle = 'rgba(20,20,60,0.78)';
    roundRect(ctx, (L.W - w) / 2, by, w, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#d7dcff';
    ctx.fillText(txt, L.W / 2, by + 11);
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Отметки мебели в режиме обстановки ----------
  drawDecorMarks(ctx, L, rect, furniture) {
    for (const it of furniture) {
      const f = findFurniture(it.id);
      if (!f) continue;
      const p = RoomView.posFor(it, rect);
      const size = RoomView.sizeFor(it.id, rect);
      const isSel = this.selected === it.id;
      const r = size * 0.55;

      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = isSel ? '#FFD93D' : 'rgba(255,255,255,0.7)';
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      if (f.id === 'carpet') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, r * 0.9, r * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        roundRect(ctx, p.x - r * 0.62, p.y - r * 0.62, r * 1.24, r * 1.24, 8);
        ctx.stroke();
      }
      ctx.restore();

      if (isSel) {
        const bw = 66, bh = 24;
        const bx = clamp(p.x - bw / 2, 6, L.W - bw - 6);
        const by = Math.max(rect.y + 4, p.y - size * 0.5 - bh - 6);
        ctx.fillStyle = '#E74C3C';
        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2716 Убрать', bx + bw / 2, by + bh / 2);
        ctx.textBaseline = 'alphabetic';
        this.buttons.push({ x: bx, y: by, w: bw, h: bh, action: 'removeItem' });
      }
    }
  }

  // ---------- Панель режима обстановки ----------
  drawDecorUI(ctx, L) {
    const gap = 6;
    const bw = (L.W - 20 - gap * 3) / 4;
    const bh = 46;
    const by = L.actionsTop + L.actionsH - bh;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, 10, by - 22, L.W - 20, bh + 12, 12);
    ctx.fill();
    ctx.fillStyle = '#e8e8f5';
    ctx.font = `${Math.min(L.W * 0.026, 11)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Перетаскивай мебель · нажми, чтобы убрать', L.W / 2, by - 7);

    const items = [
      { label: '\ud83e\ude91 Мебель', sub: System.inventory.length + ' шт.', action: 'decor:sheet:furniture', color: '#4D96FF' },
      { label: '\ud83c\udfa8 Обои', sub: findWall(System.room.wall).name, action: 'decor:sheet:walls', color: '#9B59B6' },
      { label: '\ud83e\uddf1 Пол', sub: findFloor(System.room.floor).name, action: 'decor:sheet:floors', color: '#E67E22' },
      { label: '\u2705 Готово', sub: '', action: 'decor:done', color: '#6BCB77' }
    ];

    items.forEach((b, i) => {
      const bx = 10 + i * (bw + gap);
      ctx.fillStyle = b.color;
      roundRect(ctx, bx, by, bw, bh, 11);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const size = fitFontSize(ctx, b.label, bw - 6, Math.min(bw * 0.20, 12.5), 8, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.fillText(b.label, bx + bw / 2, by + 7);
      if (b.sub) {
        const s2 = fitFontSize(ctx, b.sub, bw - 6, Math.min(bw * 0.17, 10), 7, false);
        ctx.font = `${s2}px Arial`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(b.sub, bx + bw / 2, by + 25);
        ctx.globalAlpha = 1;
      }
      ctx.textBaseline = 'alphabetic';
      this.buttons.push({ x: bx, y: by, w: bw, h: bh, action: b.action });
    });
  }

  // ---------- Шторка выбора ----------
  drawSheet(ctx, L) {
    const W = L.W, H = L.H;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    const pw = Math.min(W * 0.92, 350);
    const ph = Math.min(H * 0.66, 430);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = '#2a2f45';
    roundRect(ctx, px, py, pw, ph, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    roundRect(ctx, px, py, pw, ph, 16);
    ctx.stroke();

    const titles = { furniture: '\ud83d\udce6 Свободная мебель', walls: '\ud83c\udfa8 Обои', floors: '\ud83e\uddf1 Пол' };
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(pw * 0.048, 16)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(titles[this.sheet] || '', px + 16, py + 28);

    const cw = 30;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    roundRect(ctx, px + pw - cw - 12, py + 10, cw, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2715', px + pw - cw / 2 - 12, py + 23);
    this.sheetBtnFrom = this.buttons.length;
    this.buttons.push({ x: px + pw - cw - 12, y: py + 10, w: cw, h: 26, action: 'closeSheet' });

    if (this.sheet === 'furniture') this.drawSheetFurniture(ctx, px, py, pw, ph);
    else this.drawSheetPaint(ctx, px, py, pw, ph, this.sheet === 'walls' ? 'wall' : 'floor');
    ctx.textBaseline = 'alphabetic';
  }

  drawSheetFurniture(ctx, px, py, pw, ph) {
    const list = System.inventory.filter(id => findFurniture(id));
    ctx.textBaseline = 'middle';
    if (list.length === 0) {
      ctx.fillStyle = '#c9cfe0';
      ctx.font = `${Math.min(pw * 0.042, 13)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Свободной мебели нет.', px + pw / 2, py + ph * 0.34);
      ctx.fillText('Всё уже стоит в комнате \ud83d\ude42', px + pw / 2, py + ph * 0.34 + 22);
      this.buttons.push(createButton(ctx, px + 26, py + ph - 66, pw - 52, 40, '\ud83d\uded2 В магазин за мебелью',
        { bgColor: '#F39C12', fgColor: '#fff', fontSize: 13, radius: 10 }));
      ctx.textBaseline = 'alphabetic';
      return;
    }

    const perPage = 6;
    const pages = Math.ceil(list.length / perPage);
    if (this.sheetPage >= pages) this.sheetPage = 0;
    const from = this.sheetPage * perPage;
    const slice = list.slice(from, from + perPage);

    const cols = 3, gap = 8;
    const cw = (pw - 32 - (cols - 1) * gap) / cols;
    const ch = 84;
    slice.forEach((id, i) => {
      const f = findFurniture(id);
      const col = i % cols, row = Math.floor(i / cols);
      const cx = px + 16 + col * (cw + gap);
      const cy = py + 44 + row * (ch + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, cx, cy, cw, ch, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      roundRect(ctx, cx, cy, cw, ch, 10);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = `${Math.min(cw * 0.46, 34)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(f.emoji, cx + cw / 2, cy + ch * 0.36);
      ctx.font = `bold ${Math.min(cw * 0.15, 11)}px Arial`;
      ctx.fillStyle = '#e6e9f5';
      ctx.fillText(f.name, cx + cw / 2, cy + ch * 0.76);
      this.buttons.push({ x: cx, y: cy, w: cw, h: ch, action: 'place:' + id });
    });

    if (pages > 1) {
      const label = (this.sheetPage + 1) + ' / ' + pages;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.min(pw * 0.04, 12)}px Arial`;
      ctx.fillText(label, px + pw / 2, py + ph - 22);
      this.buttons.push(createButton(ctx, px + 16, py + ph - 40, 44, 32, '\u25c0',
        { bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 13, radius: 8 }));
      this.buttons.push(createButton(ctx, px + pw - 60, py + ph - 40, 44, 32, '\u25b6',
        { bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 13, radius: 8 }));
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawSheetPaint(ctx, px, py, pw, ph, kind) {
    const list = kind === 'wall' ? WALLS : FLOORS;
    const cur = kind === 'wall' ? System.room.wall : System.room.floor;
    const cols = 2, gap = 10;
    const cw = (pw - 32 - (cols - 1) * gap) / cols;
    const ch = 56;
    list.forEach((it, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = px + 16 + col * (cw + gap);
      const cy = py + 44 + row * (ch + gap);
      if (cy + ch > py + ph - 12) return;
      const g = ctx.createLinearGradient(0, cy, 0, cy + ch);
      g.addColorStop(0, it.c1);
      g.addColorStop(1, it.c2);
      ctx.fillStyle = g;
      roundRect(ctx, cx, cy, cw, ch, 10);
      ctx.fill();
      const active = cur === it.id;
      ctx.strokeStyle = active ? '#FFD93D' : 'rgba(0,0,0,0.25)';
      ctx.lineWidth = active ? 3 : 1;
      roundRect(ctx, cx, cy, cw, ch, 10);
      ctx.stroke();
      ctx.fillStyle = '#3a3226';
      ctx.font = `bold ${Math.min(cw * 0.13, 12)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.name, cx + cw / 2, cy + ch / 2);
      if (active) {
        ctx.fillStyle = '#FFD93D';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('\u2713', cx + cw - 8, cy + 15);
      }
      this.buttons.push({ x: cx, y: cy, w: cw, h: ch, action: (kind === 'wall' ? 'wall:' : 'floor:') + it.id });
    });
    ctx.textBaseline = 'alphabetic';
  }

  // ================= ПЕРЕТАСКИВАНИЕ МЕБЕЛИ =================
  beginDrag(mx, my) {
    if (!this.decorMode || this.sheet) return false;
    const L = this.layout();
    const found = RoomView.hitTest(mx, my, L.roomRect, System.furniture, 1.2);
    if (!found) return false;
    const p = RoomView.posFor(found, L.roomRect);
    this.dragId = found.id;
    this.dragMoved = false;
    this.dragOffset = { x: p.x - mx, y: p.y - my };
    this.dragLive = { id: found.id, x: found.x, y: found.y };
    return true;
  }

  dragMove(mx, my) {
    if (!this.dragId || !this.dragLive) return;
    const L = this.layout();
    const rect = L.roomRect;
    const zone = RoomView.yRange(this.dragId);
    const px = mx + this.dragOffset.x;
    const py = my + this.dragOffset.y;
    const nx = clamp((px - rect.x) / rect.w, 0.06, 0.94);
    const ny = clamp((py - rect.y) / rect.h, zone.top, zone.bottom);
    const fy = (ny - zone.top) / Math.max(0.0001, zone.bottom - zone.top);
    this.dragLive = { id: this.dragId, x: nx, y: clamp(fy, 0, 1) };
    this.dragMoved = true;
  }

  endDrag() {
    if (this.dragId && this.dragLive) {
      if (this.dragMoved) {
        System.moveFurniture(this.dragId, this.dragLive.x, this.dragLive.y);
        this.selected = this.dragId;
      } else {
        this.selected = (this.selected === this.dragId) ? null : this.dragId;
        AudioSys.play('click');
      }
    }
    this.dragId = null;
    this.dragLive = null;
    this.dragMoved = false;
  }

  // ================= НАЖАТИЯ =================
  handleClick(mx, my) {
    if (this.sheet) return this.handleSheetClick(mx, my);

    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      if (btn.off) {
        AudioSys.play('fail');
        this.setBubble('Сейчас это не нужно \ud83d\ude42');
        return true;
      }
      return this.doAction(btn.action);
    }
    return false;
  }

  handleSheetClick(mx, my) {
    const from = this.sheetBtnFrom || 0;
    for (let i = from; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const a = btn.action || btn.text || '';

      if (a === 'closeSheet') { this.sheet = null; AudioSys.play('click'); return true; }

      if (a.indexOf('place:') === 0) {
        const id = a.slice(6);
        const f = findFurniture(id);
        const spot = System.findFreeSpot(id);
        System.placeFurniture(id, spot.x, spot.y);
        this.sheet = null;
        this.selected = id;
        this.setBubble((f ? f.name : 'Вещь') + ' — на месте! \ud83d\udc4c');
        AudioSys.play('success');
        return true;
      }

      if (a.indexOf('wall:') === 0) { System.setWall(a.slice(5)); AudioSys.play('click'); return true; }
      if (a.indexOf('floor:') === 0) { System.setFloor(a.slice(6)); AudioSys.play('click'); return true; }
      if (a.indexOf('\u25c0') === 0) { this.sheetPage = Math.max(0, this.sheetPage - 1); AudioSys.play('click'); return true; }
      if (a.indexOf('\u25b6') === 0) { this.sheetPage = this.sheetPage + 1; AudioSys.play('click'); return true; }
      if (a.indexOf('В магазин') !== -1) {
        this.sheet = null;
        this.decorMode = false;
        this.openShopDecor();
        return true;
      }
      return true;
    }
    this.sheet = null;
    return true;
  }

  openShopDecor() {
    const shop = this.game.scenes.shop;
    if (shop) shop.currentTab = 'decor';
    this.game.transitionTo('shop');
  }

  goToSection(id) {
    const map = this.game.scenes.map;
    if (map && map.enterLocation) return map.enterLocation(id);
    this.game.transitionTo('visit', id);
    return true;
  }

  // ================= ДЕЙСТВИЯ =================
  doAction(action) {
    const L = this.layout();

    switch (action) {
      case 'decorToggle':
        this.decorMode = !this.decorMode;
        this.sheet = null;
        this.selected = null;
        AudioSys.play('click');
        if (this.decorMode) this.setBubble('Расставляй мебель: тяни предметы \ud83d\udecb\ufe0f');
        return true;

      case 'decor:done':
        this.decorMode = false;
        this.sheet = null;
        this.selected = null;
        AudioSys.play('click');
        System.saveGame();
        this.setBubble('Как уютно стало! \u2728');
        return true;

      case 'decor:sheet:furniture':
        this.sheet = 'furniture';
        this.sheetPage = 0;
        AudioSys.play('click');
        return true;

      case 'decor:sheet:walls':
        this.sheet = 'walls';
        AudioSys.play('click');
        return true;

      case 'decor:sheet:floors':
        this.sheet = 'floors';
        AudioSys.play('click');
        return true;

      case 'removeItem': {
        if (!this.selected) return true;
        const f = findFurniture(this.selected);
        System.removeFurniture(this.selected);
        this.setBubble((f ? f.name : 'Вещь') + ' — убрано в инвентарь \ud83d\udce6');
        AudioSys.play('click');
        this.selected = null;
        return true;
      }

      case 'feed': {
        const foods = ['\ud83c\udf4e', '\ud83e\udd55', '\ud83c\udf70', '\ud83c\udf55', '\ud83c\udf4c', '\ud83e\uddc0', '\ud83c\udf52', '\ud83e\udd66'];
        this.feedEmoji = foods[randInt(0, foods.length - 1)];
        this.feed = 2.4;
        this.crumbs = [];
        System.stats.hunger = Math.min(100, System.stats.hunger + 25);
        System.stats.happiness = Math.min(100, System.stats.happiness + 5);
        System.stats.stress = Math.max(0, System.stats.stress - 3);
        this.setBubble('Ням-ням! Вкусно! \ud83d\ude0b');
        AudioSys.play('eat');
        System.addXP(5);
        break;
      }

      case 'bathe':
        this.bath = 3.0;
        System.stats.cleanliness = Math.min(100, System.stats.cleanliness + 30);
        System.stats.happiness = Math.min(100, System.stats.happiness + 5);
        this.setBubble('Бульк-бульк! Чистый! \ud83e\uddfc');
        AudioSys.play('bath');
        System.addXP(5);
        break;

      case 'sleep':
        if (System.isSleeping) {
          if (System.wakeUp()) {
            this.setBubble('Доброе утро! \u2600\ufe0f');
            AudioSys.play('success');
          }
        } else {
          System.startSleep();
          this.setBubble('Спокойной ночи! \ud83d\udca4 Энергия растёт сама');
          AudioSys.play('sleep');
        }
        break;

      case 'heal':
        System.stats.health = Math.min(100, System.stats.health + 20);
        System.stats.stress = Math.max(0, System.stats.stress - 5);
        if (System.stats.health > 50) System.isSick = false;
        this.setBubble('Становится лучше! \ud83d\udc8a');
        AudioSys.play('success');
        System.addXP(5);
        break;

      case 'play':
        this.playBall = { x: L.W * 0.68, y: L.floorTop - L.floorDepth * 0.20, vx: -2.4, vy: -3.4 };
        this.playTimer = 3.4;
        System.stats.happiness = Math.min(100, System.stats.happiness + 15);
        System.stats.energy = Math.max(0, System.stats.energy - 8);
        System.stats.stress = Math.max(0, System.stats.stress - 5);
        this.setBubble('Ура! Весело! \ud83c\udf89');
        AudioSys.play('success');
        System.addXP(8);
        break;

      case 'work':
        System.saveGame();
        return this.goToSection('work');

      case 'study':
        System.saveGame();
        return this.goToSection('school');

      case 'map':
        this.game.transitionTo('map');
        return true;

      default:
        return false;
    }

    System.saveGame();
    return true;
  }
}

window.HomeScene = HomeScene;
