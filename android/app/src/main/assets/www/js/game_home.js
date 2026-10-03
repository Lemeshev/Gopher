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
    this.sheet = null;        // null | 'furniture' | 'walls' | 'floors' | 'paint' | 'help'
    this.sheetPage = 0;
    this.sheetBtnFrom = 0;
    this.selected = null;     // id выбранной мебели
    this.dragId = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dragMoved = false;
    this.dragLive = null;     // { id, x, y } — позиция во время перетаскивания
    this.roomTabs = [];       // кнопки переключения комнат

    // Анимации
    this.feed = 0;
    this.feedEmoji = null;
    this.bath = 0;
    this.playBall = null;
    this.playTimer = 0;
    this.music = 0;           // >0 — играет тихая музыка (снимает стресс)
    this.notes = [];
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
    this.music = 0;
    this.notes = [];
    this.crumbs = [];
    this.sparkles = [];
    this.zzz = [];
    System.ensureRooms();

    // Что показать в облачке: сначала «пока тебя не было», потом сон/стресс
    if (System.offlineReport) {
      this.setBubble(System.offlineMessage());
      System.offlineReport = null;
    } else if (System.isSleeping) {
      this.setBubble('\ud83d\udca4 \u0413\u043e\u0444\u0435\u0440 \u0441\u043f\u0438\u0442: \u043f\u043e\u0445\u043e\u0434\u044b \u0437\u0430\u043a\u0440\u044b\u0442\u044b \u2014 \u0441\u0435\u0439\u0447\u0430\u0441 \u0442\u0438\u0445\u0438\u0435 \u0438\u0433\u0440\u044b \u0438 \u043c\u0438\u043d\u0438-\u0438\u0433\u0440\u044b');
    } else if (System.stressHint()) {
      this.setBubble(System.stressHint());
    } else if (System.furnitureCount() === 0) {
      this.setBubble('\u0417\u0430\u0433\u043b\u044f\u043d\u0438 \u0432 \u043c\u0430\u0433\u0430\u0437\u0438\u043d — \u043e\u0431\u0443\u0441\u0442\u0440\u043e\u0438\u043c \u043a\u043e\u043c\u043d\u0430\u0442\u0443! \ud83d\uded2');
    }
  }

  // ---------- Геометрия экрана ----------
  layout() {
    const W = this.game.width, H = this.game.height;
    const btnGap = 6;
    const btnH = Math.max(38, Math.min(46, H * 0.066));
    const btnCols = 4;
    const btnW = (W - 20 - (btnCols - 1) * btnGap) / btnCols;
    const rows = 3;
    const actionsH = rows * btnH + (rows - 1) * btnGap;
    const actionsTop = H - 8 - actionsH;

    const pad = 9, labelH = 11, barH = 12, rowGap = 5, statRows = 3;
    // +hintH: под шкалами идёт строка-правило «все полоски: чем больше, тем
    // лучше» и маленькая кнопка «❓» (v1.3.2). Раньше тут была надпись «нажми
    // на „Стресс“», а сама кнопка справки стояла в чужой ячейке — по стрессу
    // нажатие не срабатывало (замечание заказчика).
    const hintH = 20;
    const panelH = pad * 2 + statRows * (labelH + barH) + (statRows - 1) * rowGap + hintH;
    const panelTop = actionsTop - 8 - panelH;

    // Переключатель комнат: над комнатой, под верхней панелью
    const tabsTop = 32, tabsH = Math.max(24, Math.min(30, H * 0.036));
    const bubbleTop = tabsTop + tabsH + 4, bubbleH = 40;
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
      tabsTop, tabsH, bubbleTop, bubbleH,
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

    // Питомец выспался сам (энергия 100%) — говорим об этом прямо, иначе
    // ребёнок не поймёт, почему «Разбудить» превратилось в «Уложить спать».
    if (System.justWoke) {
      System.justWoke = false;
      this.setBubble('\u2600\ufe0f {Pet} {pet:выспался|выспалась}! Энергия 100% \u26a1');
      AudioSys.play('success');
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

    // Тихая музыка: нотки летят, спокойствие понемногу растёт
    if (this.music > 0) {
      this.music -= sec;
      if (Math.random() < 0.10) {
        const L = this.layout();
        this.notes.push({
          x: randFloat(L.W * 0.15, L.W * 0.85),
          y: L.floorTop + randFloat(-10, 40),
          life: 1,
          emoji: ['\ud83c\udfb5', '\ud83c\udfb6', '\ud83c\udfb7', '\ud83c\udfb9'][randInt(0, 3)]
        });
      }
      if (Math.random() < 0.06) System.relax(0.4);
      if (this.music <= 0) this.setBubble('\u041c\u0443\u0437\u044b\u043a\u0430 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0430\u0441\u044c — \u0441\u0442\u0430\u043b\u043e \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u0435\u0435 \ud83d\ude0c');
    }
    this.notes.forEach(n => { n.life -= 0.006; n.y -= 0.42; });
    this.notes = this.notes.filter(n => n.life > 0);

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
    this.roomTabs = [];

    this.drawRoom(ctx, L);          // фон + мебель вокруг фигурки
    this.drawEffects(ctx, L);
    this.drawTopBar(ctx, L);
    this.drawRoomTabs(ctx, L);      // переключатель комнат
    if (this.bubbleText) this.drawBubble(ctx, L);
    this.drawStats(ctx, L);

    if (this.decorMode) this.drawDecorUI(ctx, L);
    else this.drawActions(ctx, L);

    if (System.isSleeping) this.drawSleepOverlay(ctx, L);
    if (this.sheet) this.drawSheet(ctx, L);
  }

  // ---------- Переключатель комнат ----------
  // Гостиная, спальня, кухня, ванная. У каждой свои обои, пол и мебель.
  drawRoomTabs(ctx, L) {
    const list = (typeof HOME_ROOMS !== 'undefined') ? HOME_ROOMS : [];
    const gap = 5, pad = 10;
    const tw = (L.W - pad * 2 - gap * (list.length - 1)) / list.length;
    const th = L.tabsH;

    list.forEach((r, i) => {
      const x = pad + i * (tw + gap);
      const active = System.activeRoom === r.id;
      const count = (System.rooms && System.rooms[r.id]) ? System.rooms[r.id].furniture.length : 0;

      ctx.fillStyle = active ? '#FFB300' : 'rgba(0,0,0,0.42)';
      roundRect(ctx, x, L.tabsTop, tw, th, th * 0.35);
      ctx.fill();
      if (!active) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        roundRect(ctx, x, L.tabsTop, tw, th, th * 0.35);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = active ? '#3a2600' : '#ffffff';
      const label = r.emoji + ' ' + r.name;
      const size = fitFontSize(ctx, label, tw - 8, Math.min(th * 0.44, 12.5), 7.5, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.fillText(label, x + tw / 2, L.tabsTop + th / 2 + 0.5);

      // сколько предметов уже стоит в комнате
      if (count > 0) {
        ctx.fillStyle = active ? 'rgba(58,38,0,0.55)' : 'rgba(255,217,61,0.85)';
        ctx.font = `${Math.min(th * 0.34, 9)}px Arial`;
        ctx.fillText(String(count), x + tw - 7, L.tabsTop + th - 6);
      }

      this.roomTabs.push({ x: x, y: L.tabsTop, w: tw, h: th, action: 'room:' + r.id });
    });
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Комната и мебель ----------
  // Мебель рисуется в два слоя: дальняя — за фигуркой, ближняя — перед ней,
  // поэтому большая кровать на переднем плане честно перекрывает лапы.
  gopherDepthLine() { return 0.45; }

  drawRoom(ctx, L) {
    const rect = L.roomRect;
    const room = System.currentRoomData();
    // Во время перетаскивания показываем предмет в новой позиции
    const furniture = System.furniture.map(it => {
      if (this.dragLive && this.dragLive.id === it.id) {
        return { id: it.id, x: this.dragLive.x, y: this.dragLive.y };
      }
      return it;
    });

    RoomView.drawBase(ctx, rect, room);
    RoomView.drawItems(ctx, rect, furniture, { behind: this.gopherDepthLine() });
    this.drawGopher(ctx, L);
    RoomView.drawItems(ctx, rect, furniture, { front: this.gopherDepthLine() });

    // Перетаскиваемый предмет — поверх остальных
    if (this.decorMode && this.dragId) {
      const it = furniture.find(f => f.id === this.dragId);
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

    // Нотки тихой музыки
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.notes.forEach(n => {
      ctx.globalAlpha = Math.max(0, n.life);
      ctx.font = `${16 + (1 - n.life) * 8}px Arial`;
      ctx.fillText(n.emoji, n.x, n.y);
    });
    ctx.globalAlpha = 1;
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
    // Все шкалы «чем больше, тем лучше» (v1.3.2). Стресса в интерфейсе нет:
    // вместо него «Спокойствие» = 100 − стресс, иначе единственная пустая
    // полоска выглядела как поломка (замечание заказчика).
    const stats = [
      { key: 'happiness', emoji: '\u2764\ufe0f', name: 'Счастье' },
      { key: 'hunger', emoji: '\ud83c\udf57', name: 'Сытость' },
      { key: 'energy', emoji: '\u26a1', name: 'Энергия' },
      { key: 'cleanliness', emoji: '\ud83e\uddfc', name: 'Чистота' },
      { key: 'health', emoji: '\ud83c\udfe5', name: 'Здоровье' },
      { key: 'calm', emoji: '\ud83d\ude0c', name: 'Спокойствие' }
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
      const val = System.statValue(s.key);

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

    // Одна общая подсказка вместо «нажми на стресс» (v1.3.2): детям нужно
    // правило, а не ещё одно нажатие. Кнопка «❓» рядом — привычная справка.
    const helpW = 26, helpH = 15;
    const helpX = W - 10 - L.pad - helpW;
    const helpY = L.panelTop + L.panelH - helpH - 4;

    const ruleText = 'Все полоски: чем больше, тем лучше 🙂';
    const ruleMax = helpX - (10 + L.pad) - 6;
    const ruleSize = fitFontSize(ctx, ruleText, ruleMax, Math.min(L.labelH - 2, 9.5), 7, false);
    ctx.font = `${ruleSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(ruleText, 10 + L.pad, L.panelTop + L.panelH - 8);

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, helpX, helpY, helpW, helpH, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${Math.min(helpH - 4, 11)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❓', helpX + helpW / 2, helpY + helpH / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
    this.buttons.push({ x: helpX, y: helpY, w: helpW, h: helpH, action: 'help' });
  }

  // ---------- Кнопки действий ----------
  // Действия привязаны к комнатам: покормить — на кухне, искупать — в ванной,
  // спать — в спальне, играть и слушать музыку — в гостиной. Если комната не та,
  // питомец сам идёт туда — так ребёнок изучает планировку дома.
  actionsList() {
    const sleeping = System.isSleeping;
    // Пока питомец спит, действия с ним закрыты и подсказка говорит почему.
    const sleepHint = '{Pet} спит 💤 — сначала разбуди';
    return [
      { emoji: '\ud83c\udf7d\ufe0f', text: 'Покормить', action: 'feed', color: '#FF6B6B', room: 'kitchen',
        off: sleeping || System.stats.hunger >= 100, hint: sleeping ? sleepHint : 'Покормить можно на кухне' },
      { emoji: '\ud83d\udec1', text: 'Искупать', action: 'bathe', color: '#00BCD4', room: 'bathroom',
        off: sleeping || System.stats.cleanliness >= 100, hint: sleeping ? sleepHint : 'Купаются в ванной' },
      { emoji: sleeping ? '\u2600\ufe0f' : '\ud83d\ude34', text: sleeping ? 'Разбудить' : 'Уложить спать',
        action: 'sleep', color: sleeping ? '#FFB300' : '#3F51B5', room: 'bedroom',
        off: !sleeping && System.stats.energy >= 99, hint: '{Pet} и так {pet:полон|полна} сил ⚡' },
      { emoji: '\ud83c\udfae', text: 'Играть', action: 'play', color: '#FF8C42', room: 'living',
        off: sleeping || System.stats.energy <= 5, hint: sleeping ? sleepHint : 'Играют в гостиной' },
      { emoji: '\ud83c\udfb5', text: 'Музыка', action: 'music', color: '#9B59B6', room: 'living',
        off: sleeping || this.music > 0, hint: sleeping ? sleepHint : 'Музыка играет в гостиной' },
      { emoji: '\ud83e\udd2b', text: 'Тихие игры', action: 'quiet', color: sleeping ? '#3E8E5A' : '#546E7A',
        off: false, hint: '' },
      { emoji: '\ud83d\udcac', text: 'Поболтать', action: 'chat', color: '#5C6BC0',
        off: false, hint: '' },
      { emoji: '\ud83d\udecb\ufe0f', text: 'Обстановка', action: 'decorToggle',
        color: this.decorMode ? '#6BCB77' : '#2ECC71', off: false, hint: '' },
      { emoji: '\ud83d\uddfa\ufe0f', text: 'Карта', action: 'map', color: '#4D96FF', off: false, hint: '' }
    ];
  }

  drawActions(ctx, L) {
    const list = this.actionsList();
    list.forEach((ab, i) => {
      const col = i % L.btnCols;
      const row = Math.floor(i / L.btnCols);
      const bx = 10 + col * (L.btnW + L.btnGap);
      const by = L.actionsTop + row * (L.btnH + L.btnGap);
      const wrongRoom = ab.room && System.activeRoom !== ab.room;

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
      ctx.font = `${Math.min(L.btnW * 0.28, 19)}px Arial`;
      ctx.fillText(ab.emoji, bx + L.btnW / 2, by + 2);

      const size = fitFontSize(ctx, ab.text, L.btnW - 6, Math.min(L.btnW * 0.16, 11.5), 7, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(ab.text, bx + L.btnW / 2, by + L.btnH - 3);

      // Значок комнаты: куда питомец пойдёт за этим действием
      if (wrongRoom && !ab.off) {
        const r = (typeof findRoom === 'function') ? findRoom(ab.room) : null;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(r ? r.emoji : '\u2192', bx + 3, by + 2);
      }

      this.buttons.push({ x: bx, y: by, w: L.btnW, h: L.btnH, action: ab.action, off: !!ab.off, hint: ab.hint || '' });
    });
    ctx.textBaseline = 'alphabetic';
  }

  drawSleepOverlay(ctx, L) {
    ctx.fillStyle = 'rgba(24,24,64,0.28)';
    ctx.fillRect(0, L.bubbleTop - 6, L.W, L.panelTop - L.bubbleTop + 2);

    // Две строки: сколько энергии капает и что сейчас открыто ребёнку.
    // Иначе возникает вопрос «а что делать, пока он спит?».
    const lines = [
      '\ud83d\ude34 Сон: +' + (100 / System.SLEEP_FULL_MINUTES).toFixed(0) + '% энергии в минуту',
      'Открыто: ' + System.sleepAllowedHint()
    ];
    const pad = 12, lineH = 13;
    const sizes = lines.map(t => fitFontSize(ctx, t, L.W - 40, Math.min(L.W * 0.026, 11.5), 8.5, true));
    const boxW = Math.min(L.W - 20, Math.max.apply(null,
      lines.map((t, i) => { ctx.font = `bold ${sizes[i]}px Arial`; return ctx.measureText(t).width; })) + pad * 2);
    const boxH = pad + lines.length * lineH;
    const by = L.panelTop - boxH - 8;
    ctx.fillStyle = 'rgba(20,20,60,0.78)';
    roundRect(ctx, (L.W - boxW) / 2, by, boxW, boxH, 11);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((t, i) => {
      ctx.font = `bold ${sizes[i]}px Arial`;
      ctx.fillStyle = i === 0 ? '#d7dcff' : '#9be3b0';
      ctx.fillText(t, L.W / 2, by + pad * 0.6 + lineH * (i + 0.5));
    });
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Отметки мебели в режиме обстановки ----------
  drawDecorMarks(ctx, L, rect, furniture) {
    for (const it of furniture) {
      const f = findFurniture(it.id);
      if (!f) continue;
      const p = RoomView.posFor(it, rect);
      const size = RoomView.sizeFor(it.id, rect, it.y);
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
        const f2 = findFurniture(it.id);
        const canPaint = !!(f2 && f2.palette && f2.palette.length);
        const bw = canPaint ? 62 : 74, bh = 24, gap = 4;
        const totalW = canPaint ? bw * 2 + gap : bw;
        const bx = clamp(p.x - totalW / 2, 6, L.W - totalW - 6);
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

        // Перекраска — платная услуга, цена зависит от стоимости вещи
        if (canPaint) {
          const cx2 = bx + bw + gap;
          ctx.fillStyle = '#4D96FF';
          roundRect(ctx, cx2, by, bw, bh, 8);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('\ud83c\udfa8 Цвет', cx2 + bw / 2, by + bh / 2);
          ctx.textBaseline = 'alphabetic';
          this.buttons.push({ x: cx2, y: by, w: bw, h: bh, action: 'colorPicker' });
        }
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
    ctx.fillText('Тяни мебель · нажми на вещь, чтобы убрать или перекрасить', L.W / 2, by - 7);

    const items = [
      { label: '\ud83d\udce6 В кладовке', sub: System.inventory.length + ' шт.', action: 'decor:sheet:furniture', color: '#4D96FF' },
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
  // Системная кнопка «Назад»: сначала закрываем то, что открыто в доме
  // (перетаскивание, режим расстановки, шторку), и только потом выходим в меню.
  handleBack() {
    if (this.dragId) { this.dragId = null; return true; }
    if (this.decorMode) { this.decorMode = false; return true; }
    if (this.sheet) { this.sheet = null; return true; }
    return false;
  }

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

    const titles = { furniture: '\ud83d\udce6 Свободная мебель', walls: '\ud83c\udfa8 Обои за монетки', floors: '\ud83e\uddf1 Пол за монетки', paint: '\ud83c\udfa8 Цвет предмета', help: '\u2753 Как это работает' };
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
    else if (this.sheet === 'paint') this.drawSheetColor(ctx, px, py, pw, ph);
    else if (this.sheet === 'help') this.drawSheetHelp(ctx, px, py, pw, ph);
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
      ctx.fillText('В кладовке пусто.', px + pw / 2, py + ph * 0.34);
      ctx.fillText('Всё стоит в комнате \ud83d\ude42 Нажми на вещь в комнате,', px + pw / 2, py + ph * 0.34 + 22);
      ctx.fillText('чтобы убрать её сюда и поставить заново', px + pw / 2, py + ph * 0.34 + 40);
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

  // ---------- Шторка «Цвет предмета» (перекраска за монетки) ----------
  drawSheetColor(ctx, px, py, pw, ph) {
    const id = this.selected;
    const f = findFurniture(id);
    if (!f) { this.sheet = null; return; }
    const cols = f.palette.length;
    const price = recolorCost(id);
    const cur = System.colorIndex(id);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#e6e9f5';
    ctx.font = `${Math.min(pw * 0.036, 12)}px Arial`;
    ctx.fillText(f.name + ' \u00b7 перекраска ' + price + ' \ud83e\ude99', px + 16, py + 52);

    const gap = 10, rows = 2;
    const perRow = Math.ceil(cols / rows);
    const cw = (pw - 32 - (perRow - 1) * gap) / perRow;
    const ch = 46;
    for (let i = 0; i < cols; i++) {
      const col = i % perRow, row = Math.floor(i / perRow);
      const cx = px + 16 + col * (cw + gap);
      const cy = py + 70 + row * (ch + gap);
      ctx.fillStyle = f.palette[i];
      roundRect(ctx, cx, cy, cw, ch, 10);
      ctx.fill();
      if (i === cur) {
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 3;
        roundRect(ctx, cx, cy, cw, ch, 10);
        ctx.stroke();
        ctx.fillStyle = '#10121c';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('\u2713', cx + cw - 8, cy + 18);
      }
      this.buttons.push({ x: cx, y: cy, w: cw, h: ch, action: 'paintcolor:' + i });
    }

    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(pw * 0.032, 11)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(System.coins + ' \ud83e\ude99 \u0443 \u0442\u0435\u0431\u044f \u0441\u0435\u0439\u0447\u0430\u0441', px + pw / 2, py + ph - 18);
  }

  // ---------- Шторка-справка: что делает каждая шкала ----------
  drawSheetHelp(ctx, px, py, pw, ph) {
    const list = (typeof STAT_HELP !== 'undefined') ? STAT_HELP : [];
    const perPage = 2;
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    if (this.sheetPage >= pages) this.sheetPage = 0;
    const from = this.sheetPage * perPage;
    const slice = list.slice(from, from + perPage);

    let y = py + 48;
    slice.forEach(h => {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(pw * 0.040, 14)}px Arial`;
      ctx.fillText(h.emoji + ' ' + h.name, px + 16, y);
      y += 16;
      ctx.fillStyle = '#dfe3f0';
      ctx.font = `${Math.min(pw * 0.032, 11.5)}px Arial`;
      const what = wrapLines(ctx, h.what, pw - 32, 2);
      what.forEach(w => { ctx.fillText(w, px + 16, y); y += 13; });
      y += 2;
      ctx.fillStyle = '#9be3b0';
      wrapLines(ctx, '\u2b06 ' + h.up.join('; '), pw - 32, 3).forEach(w => { ctx.fillText(w, px + 16, y); y += 13; });
      ctx.fillStyle = '#ffb3b3';
      wrapLines(ctx, '\u2b07 ' + h.down.join('; '), pw - 32, 3).forEach(w => { ctx.fillText(w, px + 16, y); y += 13; });
      y += 6;
    });

    if (pages > 1) {
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.min(pw * 0.038, 12)}px Arial`;
      ctx.fillText((this.sheetPage + 1) + ' / ' + pages, px + pw / 2, py + ph - 22);
      this.buttons.push(createButton(ctx, px + 16, py + ph - 40, 44, 32, '\u25c0',
        { bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 13, radius: 8 }));
      this.buttons.push(createButton(ctx, px + pw - 60, py + ph - 40, 44, 32, '\u25b6',
        { bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 13, radius: 8 }));
    }
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

    // Переключатель комнат — проверяем первым: это самое частое нажатие
    for (const tab of this.roomTabs) {
      if (!isPointInRect(mx, my, tab.x, tab.y, tab.w, tab.h)) continue;
      const id = (tab.action || '').slice(5);
      if (System.setActiveRoom(id)) {
        this.selected = null;
        this.sheet = null;
        const r = (typeof findRoom === 'function') ? findRoom(id) : null;
        if (r) this.setBubble(r.name + ' ' + r.emoji + ' · ' + r.desc);
        AudioSys.play('click');
      }
      return true;
    }

    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      if (btn.off) {
        AudioSys.play('fail');
        this.setBubble(btn.hint || 'Сейчас это не нужно \ud83d\ude42');
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
        const allowed = (typeof furnitureRooms === 'function') ? furnitureRooms(id) : ['living'];
        if (allowed.indexOf(System.activeRoom) === -1) {
          const names = allowed.map(r2 => findRoom(r2).name).join(' или ');
          this.setBubble((f ? f.name : 'Вещь') + ' \u2014 \u043c\u0435\u0441\u0442\u043e: ' + names);
          AudioSys.play('fail');
          this.sheet = null;
          return true;
        }
        const spot = System.findFreeSpot(id, System.activeRoom);
        System.placeFurniture(id, spot.x, spot.y);
        this.sheet = null;
        this.selected = id;
        this.setBubble((f ? f.name : 'Вещь') + ' \u2014 \u043d\u0430 \u043c\u0435\u0441\u0442\u0435! \ud83d\udc4c');
        AudioSys.play('success');
        return true;
      }

      // Перекраска предмета: списываем монеты, цвет меняется сразу
      if (a.indexOf('paintcolor:') === 0) {
        const idx = parseInt(a.slice(11), 10);
        const res = System.paintFurniture(this.selected, idx);
        if (res.ok) {
          this.setBubble('\ud83c\udfa8 \u041d\u043e\u0432\u044b\u0439 \u0446\u0432\u0435\u0442! \u2212' + res.price + ' \ud83e\ude99');
          AudioSys.play('success');
        } else if (res.reason === 'money') {
          this.setBubble('\ud83e\ude99 \u041d\u0443\u0436\u043d\u043e ' + res.price + ' \u043c\u043e\u043d\u0435\u0442 \u043d\u0430 \u043f\u0435\u0440\u0435\u043a\u0440\u0430\u0441\u043a\u0443');
          AudioSys.play('fail');
        } else if (res.reason === 'same') {
          this.setBubble('\u042d\u0442\u043e\u0442 \u0446\u0432\u0435\u0442 \u0443\u0436\u0435 \u0432\u044b\u0431\u0440\u0430\u043d');
        }
        return true;
      }

      if (a.indexOf('wall:') === 0) {
        const id = a.slice(5);
        const w = (typeof WALLS !== 'undefined') ? WALLS.find(x => x.id === id) : null;
        const owned = System.ownsWall(id);
        if (System.setWall(id)) {
          this.setBubble((w ? w.name : 'Обои') + ' \u2014 ' + ((w && w.cost && !owned) ? ('\u043a\u0443\u043f\u043b\u0435\u043d\u043e \u0437\u0430 ' + w.cost) : '\u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u043e') + ' \ud83c\udfa8');
          AudioSys.play('success');
        } else {
          this.setBubble('\ud83e\ude99 \u041d\u0443\u0436\u043d\u043e ' + (w ? w.cost : 0) + ' \u043c\u043e\u043d\u0435\u0442 \u043d\u0430 \u044d\u0442\u0438 \u043e\u0431\u043e\u0438');
          AudioSys.play('fail');
        }
        return true;
      }
      if (a.indexOf('floor:') === 0) {
        const id = a.slice(6);
        const fl = (typeof FLOORS !== 'undefined') ? FLOORS.find(x => x.id === id) : null;
        const ownedF = System.ownsFloor(id);
        if (System.setFloor(id)) {
          this.setBubble((fl ? fl.name : 'Пол') + ' \u2014 ' + ((fl && fl.cost && !ownedF) ? ('\u043a\u0443\u043f\u043b\u0435\u043d\u043e \u0437\u0430 ' + fl.cost) : '\u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u043e') + ' \ud83e\uddf1');
          AudioSys.play('success');
        } else {
          this.setBubble('\ud83e\ude99 \u041d\u0443\u0436\u043d\u043e ' + (fl ? fl.cost : 0) + ' \u043c\u043e\u043d\u0435\u0442 \u043d\u0430 \u044d\u0442\u043e\u0442 \u043f\u043e\u043b');
          AudioSys.play('fail');
        }
        return true;
      }
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
  // В какой комнате делается действие
  roomForAction(action) {
    switch (action) {
      case 'feed': return 'kitchen';
      case 'bathe': return 'bathroom';
      case 'sleep': return 'bedroom';
      case 'play': return 'living';
      case 'music': return 'living';
      default: return null;
    }
  }

  doAction(action) {
    const L = this.layout();

    // Пока питомец спит — никаких дел с ним: только тихие игры, обстановка,
    // карта, инфо и «Разбудить». Проверка обязана стоять до всего остального,
    // иначе спящий гофер идёт работать, гулять и лечиться.
    const awakeOnly = ['feed', 'bathe', 'play', 'music', 'heal', 'work', 'study'];
    if (System.isSleeping && awakeOnly.indexOf(action) !== -1) {
      this.setBubble('{Pet} спит 💤 — сначала разбуди или поиграй тихо 🤫');
      AudioSys.play('fail');
      return true;
    }

    // Если действие делается в другой комнате — питомец идёт туда
    const targetRoom = this.roomForAction(action);
    if (targetRoom && System.activeRoom !== targetRoom) {
      System.setActiveRoom(targetRoom);
      const r = (typeof findRoom === 'function') ? findRoom(targetRoom) : null;
      if (r) this.setBubble('Идём в ' + r.name.toLowerCase() + ' ' + r.emoji);
      AudioSys.play('click');
    }

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
        this.setBubble((f ? f.name : 'Вещь') + ' — убрано в кладовку \ud83d\udce6');
        AudioSys.play('click');
        this.selected = null;
        return true;
      }

      case 'music': {
        this.music = 8;
        System.relax(2);
        System.stats.happiness = Math.min(100, System.stats.happiness + 4);
        // Фоновая музыка (v1.3.1): на эти 8 секунд петля становится слышнее и
        // медленнее — «включили музыку». Если музыку выключили в настройках,
        // действие честно об этом говорит, а не делает вид, что играет.
        AudioSys.musicBoost(8);
        if (AudioSys.isMusicOn()) {
          this.setBubble('\ud83c\udfb5 Тихая музыка: спокойствие растёт, {pet_dat} легче');
        } else {
          this.setBubble('\ud83c\udfb5 Музыка выключена в настройках — включить можно в меню \u2699\ufe0f');
        }
        AudioSys.play('success');
        break;
      }

      case 'quiet':
        System.saveGame();
        this.game.transitionTo('quiet');
        return true;

      case 'chat':
        System.saveGame();
        this.game.transitionTo('chat');
        return true;

      case 'help':
        this.sheet = 'help';
        this.sheetPage = 0;
        this.sheetBtnFrom = this.buttons.length;
        AudioSys.play('click');
        return true;

      case 'colorPicker':
        if (!this.selected) return true;
        this.sheet = 'paint';
        this.sheetPage = 0;
        this.sheetBtnFrom = this.buttons.length;
        AudioSys.play('click');
        return true;

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
        AudioSys.voice(System.look.char, 'happy');   // герой чавкает своим голосом (v1.3)
        System.addXP(5);
        System.countAction('feeds');
        break;
      }

      case 'bathe':
        this.bath = 3.0;
        System.stats.cleanliness = Math.min(100, System.stats.cleanliness + 30);
        System.stats.happiness = Math.min(100, System.stats.happiness + 5);
        this.setBubble('Бульк-бульк! Чистый! \ud83e\uddfc');
        AudioSys.play('bath');
        AudioSys.voice(System.look.char, 'happy');
        System.addXP(5);
        System.countAction('washes');
        break;

      case 'sleep':
        if (System.isSleeping) {
          if (System.wakeUp()) {
            this.setBubble('Доброе утро! \u2600\ufe0f');
            AudioSys.play('success');
            AudioSys.voice(System.look.char, 'hello');  // проснулся и поздоровался
          }
        } else if (System.startSleep()) {
          this.setBubble('Спокойной ночи! \ud83d\udca4 Энергия растёт сама');
          AudioSys.play('sleep');
          AudioSys.voice(System.look.char, 'sleepy');
        } else {
          // Энергия и так полная: спать нечего, и это надо сказать словами
          this.setBubble('{Pet} и так {pet:полон|полна} сил \u26a1 — бегать и играть!');
          AudioSys.play('fail');
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
        AudioSys.voice(System.look.char, 'happy');
        System.addXP(8);
        System.countAction('plays');
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
