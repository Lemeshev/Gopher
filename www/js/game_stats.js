// ============ СЦЕНА СТАТИСТИКИ ============
class StatsScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.tab = 'stats'; // stats, achievements, knowledge, inventory
  }

  init() {
    this.time = 0;
    this.tab = 'stats';
    this.achScroll = 0;
    this.achRows = [];
    this.achView = null;
    this.tabButtons = [];
    this.dragFrom = null;
    // v1.3.12: коллекция пойманных рыб — отдельный экран из вкладки достижений
    this.fishMode = false;
    this.fishScroll = 0;
  }

  update(dt) {
    this.time += dt;
  }

  draw(ctx) {
    this.buttons = [];
    this.tabButtons = [];
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Коллекция рыб — свой экран поверх вкладки достижений (v1.3.12)
    if (this.fishMode) { this.drawFishCollection(ctx, W, H); return; }

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2C3E50');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Title
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.06, 28)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('📊 Информация', W / 2, 30);

    // Tabs
    const tabs = [
      { id: 'stats', label: '📈 Статы', w: 80 },
      { id: 'ach', label: '🏆', w: 50 },
      { id: 'knowledge', label: '📚', w: 50 },
      { id: 'inventory', label: '🎒', w: 50 },
      { id: 'help', label: '❓', w: 46 }
    ];
    const totalTabW = tabs.reduce((s, t) => s + t.w, 0) + tabs.length * 8;
    let tabX = (W - totalTabW) / 2;
    tabs.forEach(tab => {
      const isSelected = this.tab === tab.id;
      ctx.fillStyle = isSelected ? '#FFD93D' : 'rgba(255,255,255,0.2)';
      roundRect(ctx, tabX, 50, tab.w, 36, 10);
      ctx.fill();
      ctx.fillStyle = isSelected ? '#333' : '#fff';
      ctx.font = `${Math.min(tab.w * 0.28, 16)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tabX + tab.w / 2, 68);
      this.buttons.push({ x: tabX, y: 50, w: tab.w, h: 36, action: tab.id });
      this.tabButtons.push({ x: tabX, y: 50, w: tab.w, h: 36, action: tab.id });
      tabX += tab.w + 8;
    });

    // Tab content
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.clip();

    if (this.tab === 'stats') this.drawStatsTab(ctx, W, H);
    else if (this.tab === 'ach') this.drawAchTab(ctx, W, H);
    else if (this.tab === 'knowledge') this.drawKnowledgeTab(ctx, W, H);
    else if (this.tab === 'inventory') this.drawInventoryTab(ctx, W, H);
    else if (this.tab === 'help') this.drawHelpTab(ctx, W, H);

    ctx.restore();

    // Back button
    this.buttons.push(createButton(ctx, 10, H - 50, 100, 40, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)',
      fgColor: '#fff',
      fontSize: 14,
      radius: 10
    }));
  }

  drawStatsTab(ctx, W, H) {
    // Level bar
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('⭐ Уровень ' + System.level, W / 2, 110);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, W * 0.1, 125, W * 0.8, 20, 10);
    ctx.fill();
    drawProgressBar(ctx, W * 0.1, 125, W * 0.8, 20, System.xp, System.xpToNext, 'rgba(255,255,255,0.1)', '#FFD93D');

    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillText('XP: ' + System.xp + ' / ' + System.xpToNext, W / 2, 160);

    // Stats
    const mainStats = [
      { key: 'happiness', emoji: '❤️', name: 'Счастье' },
      { key: 'hunger', emoji: '🍗', name: 'Сытость' },
      { key: 'energy', emoji: '😴', name: 'Энергия' },
      { key: 'health', emoji: '🏥', name: 'Здоровье' },
      { key: 'cleanliness', emoji: '🧹', name: 'Чистота' },
      { key: 'intelligence', emoji: '🧠', name: 'Интеллект' },
      { key: 'workSkill', emoji: '💼', name: 'Рабочий навык' },
      { key: 'schoolSkill', emoji: '🎓', name: 'Учебный навык' },
      { key: 'calm', emoji: '😌', name: 'Спокойствие' }
    ];

    const startY = 180;
    const rowH = 38;

    mainStats.forEach((s, i) => {
      const y = startY + i * rowH;
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = W * 0.05 + col * (W * 0.32);
      const bw = W * 0.3;

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, bx, y, bw, rowH - 6, 10);
      ctx.fill();

      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(s.emoji + ' ' + s.name, bx + 8, y + 13);

      const val = System.statValue(s.key);
      drawProgressBar(ctx, bx + 4, y + 20, bw - 8, 10, val, 100, 'rgba(255,255,255,0.15)', System.getStatColor(s.key));

      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.fillText(Math.floor(val) + '%', bx + bw - 8, y + 27);
    });

    // Info: монеты, время в игре и состояние сохранения (v1.3.6).
    // Время раньше считалось неверно и всегда показывало «0 мин» (жалоба 30.09.2026).
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, W * 0.05, startY + mainStats.length * rowH + 10, W * 0.9, 92, 12);
    ctx.fill();

    ctx.font = `${Math.min(W * 0.03, 14)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('🪙 Монет: ' + System.coins, W / 2, startY + mainStats.length * rowH + 32);
    ctx.fillStyle = '#fff';
    ctx.fillText('📅 Время в игре: ' + System.playTimeText(), W / 2, startY + mainStats.length * rowH + 55);
    const health = System.saveHealth();
    ctx.fillStyle = (health === 'в порядке') ? '#9be3b0' : '#FFB4A2';
    ctx.font = `${Math.min(W * 0.028, 12.5)}px Arial`;
    ctx.fillText('💾 Сохранение: ' + health, W / 2, startY + mainStats.length * rowH + 78);
  }

  // Вкладка достижений (v1.2.2): каталог берём из контента — один список на
  // всю игру (раньше здесь лежала вторая копия, которую никто не проверял).
  // Видно четыре ступени по времени: что можно взять сегодня, а что — только
  // через месяцы (дни и серия дней). Список длинный, поэтому листается.
  drawAchTab(ctx, W, H) {
    const list = System.achievementList();
    const tiers = System.achievementTiers();
    const p = System.ensureProgress();

    // Счётчик и дни — сверху; список начинается ниже, ничего не наезжает
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.04, 17)}px Arial`;
    ctx.fillText('🏆 ' + System.unlockedCount() + ' / ' + list.length, W / 2, 100);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = `${Math.min(W * 0.028, 11.5)}px Arial`;
    ctx.fillText('📅 дней: ' + p.days + '   🔥 серия: ' + p.streak + ' (рекорд ' + p.bestStreak + ')', W / 2, 116);

    // Вход в коллекцию рыб (v1.3.12). Заказчик: «чтобы можно было посмотреть всю
    // коллекцию рыб, которых ты уже поймал… и чтобы это было в достижениях логично
    // отображено». Рыбные достижения («Ихтиолог» и далее) считают именно РАЗНЫЕ
    // виды, поэтому кнопка с прогрессом стоит прямо здесь, рядом со счётчиком.
    const fishSeenN = (typeof System !== 'undefined' && System.fishSpeciesCount) ? System.fishSpeciesCount() : 0;
    const fishAllN = (typeof FISH_SPECIES !== 'undefined') ? FISH_SPECIES.length : 0;
    const fbW = Math.min(W * 0.66, 260), fbH = 26;
    const fbX = (W - fbW) / 2, fbY = 122;
    ctx.fillStyle = 'rgba(77,150,255,0.22)';
    roundRect(ctx, fbX, fbY, fbW, fbH, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(77,150,255,0.7)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, fbX, fbY, fbW, fbH, 9);
    ctx.stroke();
    ctx.fillStyle = '#cfe6ff';
    ctx.font = `bold ${Math.min(W * 0.03, 12.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐠 Коллекция рыб: ' + fishSeenN + ' из ' + fishAllN + ' видов →', W / 2, fbY + fbH / 2);
    ctx.textBaseline = 'alphabetic';
    this.buttons.push({ x: fbX, y: fbY, w: fbW, h: fbH, action: 'fishCollection' });

    const top = 156, bottom = H - 58;      // до кнопки «Назад» остаётся место
    this.achView = { top: top, bottom: bottom };

    const rows = [];
    tiers.forEach(t => {
      const own = list.filter(a => a.tier === t.id);
      if (!own.length) return;
      rows.push({ kind: 'tier', tier: t, h: 22 });
      own.forEach(a => rows.push({ kind: 'ach', ach: a, h: 46 }));
    });
    const contentH = rows.reduce((s, r) => s + r.h, 0) + 6;
    const maxScroll = Math.max(0, contentH - (bottom - top));
    this.achScroll = clamp(this.achScroll || 0, 0, maxScroll);
    this.achMaxScroll = maxScroll;

    // Сам список — «под ножницами»: за область списка ничего не выезжает
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, top, W, bottom - top, 0);
    ctx.clip();
    this.achRows = [];
    let y = top - this.achScroll;
    rows.forEach(r => {
      if (y + r.h > top && y < bottom) {
        if (y >= top - 0.5 && y + r.h <= bottom + 0.5) {
          this.achRows.push({ kind: r.kind, id: r.ach ? r.ach.id : r.tier.id, y: y, h: r.h });
        }
        if (r.kind === 'tier') this.drawTierRow(ctx, r.tier, W, y, r.h);
        else {
          this.drawAchRow(ctx, r.ach, W, y, r.h);
          // Рыбные достижения считают РАЗНЫЕ виды, поэтому по тапу на такую строку
          // открываем коллекцию: там видно, кто уже пойман и кого не хватает — так
          // «и логично отображено» в достижениях (v1.3.12)
          if (['fishAll', 'fishExpert', 'fishMaster'].indexOf(r.ach.id) !== -1 &&
              y >= top - 0.5 && y + r.h <= bottom + 0.5) {
            this.buttons.push({ x: 14, y: y + 1, w: W - 28, h: r.h - 3, action: 'fishCollection' });
          }
        }
      }
      y += r.h;
    });
    ctx.restore();

    // Листание: стрелки видны, только когда есть куда листать. Кнопки рисуем
    // через createButton — иначе они попадали бы в клики, но их не видел ребёнок.
    if (this.achScroll > 0.5) {
      const up = createButton(ctx, W - 36, top + 2, 30, 26, '▲', {
        bgColor: 'rgba(255,255,255,0.22)', fgColor: '#fff', fontSize: 13, radius: 8, shadow: false
      });
      up.action = 'achUp';
      this.buttons.push(up);
    }
    if (this.achScroll < maxScroll - 0.5) {
      const down = createButton(ctx, W - 36, bottom - 30, 30, 26, '▼', {
        bgColor: 'rgba(255,255,255,0.22)', fgColor: '#fff', fontSize: 13, radius: 8, shadow: false
      });
      down.action = 'achDown';
      this.buttons.push(down);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Заголовок ступени: «🏅 Месяцы — самые долгие»
  drawTierRow(ctx, tier, W, y, h) {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.032, 13)}px Arial`;
    ctx.fillText(tier.emoji + ' ' + tier.name, 16, y + h / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `${Math.min(W * 0.026, 10.5)}px Arial`;
    ctx.fillText(tier.hint, W - 42, y + h / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  // Строка достижения: открыто — золотое с эмодзи, закрыто — 🔒 с прогрессом.
  // Открытость берём из списка открытых, а не из «текущего прогресса»: баланс
  // монет и шкалы могут упасть, но награда уже получена и не отбирается.
  drawAchRow(ctx, a, W, y, h) {
    const prog = System.achievementProgress(a);
    const on = System.isAchUnlocked(a.id);
    ctx.globalAlpha = on ? 1 : 0.6;
    ctx.fillStyle = on ? 'rgba(255,215,0,0.16)' : 'rgba(255,255,255,0.06)';
    roundRect(ctx, 14, y + 1, W - 28, h - 3, 10);
    ctx.fill();
    if (on) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, 14, y + 1, 4, h - 3, 2);
      ctx.fill();
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(W * 0.05, 20)}px Arial`;
    ctx.fillStyle = '#fff';
    ctx.fillText(on ? a.emoji : '🔒', 24, y + h / 2);

    ctx.font = `bold ${Math.min(W * 0.036, 14)}px Arial`;
    ctx.fillText(a.name, 50, y + 16);

    ctx.textAlign = 'right';
    ctx.fillStyle = on ? '#FFD93D' : 'rgba(255,255,255,0.75)';
    ctx.font = `bold ${Math.min(W * 0.026, 10.5)}px Arial`;
    ctx.fillText(on ? 'открыто' : (Math.round(prog.value) + ' / ' + prog.goal), W - 22, y + 16);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${Math.min(W * 0.028, 11.5)}px Arial`;
    // У рыбных достижений подписываем, что тап открывает коллекцию: иначе ребёнок
    // не догадается, что строка нажимается (v1.3.12)
    const isFish = ['fishAll', 'fishExpert', 'fishMaster'].indexOf(a.id) !== -1;
    const descText = isFish ? (a.desc + '  ·  нажми — вся коллекция 🐠')
      : a.desc;
    const descSize = fitFontSize(ctx, descText, W - 74, Math.min(W * 0.028, 11.5), 8.5, false);
    ctx.font = `${descSize}px Arial`;
    ctx.fillText(descText, 50, y + 31);

    drawProgressBar(ctx, 50, y + h - 9, W - 122, 5, on ? prog.goal : prog.value, prog.goal,
      'rgba(255,255,255,0.15)', on ? '#FFD93D' : '#4D96FF');

    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  drawKnowledgeTab(ctx, W, H) {
    // Коллекция: сколько предметов уже увидено из базы контента.
    // Названия музеев берём из хаба на карте (VISIT_DATA.museums.sub), а список — из
    // MUSEUM_CATEGORIES: один источник на всю игру, поэтому вкладка не отстаёт.
    // v1.3.12: музеев стало пятьдесят, поэтому список листается (стрелки и палец).
    const hub = (typeof VISIT_DATA !== 'undefined' && VISIT_DATA.museums &&
      VISIT_DATA.museums.sub) || [];
    const MUSEUM_META = {};
    hub.forEach(m => {
      const plain = /музе/.test(m.name) ||
        /^(Океанариум|Планетарий|Ботанический сад|Театр кукол)$/.test(m.name);
      MUSEUM_META[m.id] = [m.emoji, m.name + (plain ? '' : ' музей')];
    });
    const museumKeys = (typeof MUSEUM_CATEGORIES !== 'undefined') ? MUSEUM_CATEGORIES : Object.keys(MUSEUM_META);
    const cats = museumKeys.map(k => {
      const m = MUSEUM_META[k] || ['🏛️', k];
      return { key: k, emoji: m[0], name: m[1] };
    }).concat([
      { key: 'library', emoji: '📚', name: 'Библиотека' },
      { key: 'school', emoji: '🎓', name: 'Учёба' },
      { key: 'work', emoji: '💼', name: 'Работа' },
      { key: 'park', emoji: '🎢', name: 'Парк' },
      { key: 'cinema', emoji: '🎬', name: 'Кино' },
      { key: 'pool', emoji: '🏊', name: 'Бассейн' },
      { key: 'gym', emoji: '🏋️', name: 'Спортзал' },
      { key: 'clinic', emoji: '🏥', name: 'Лечения' },
      { key: 'restaurant', emoji: '🍽️', name: 'Блюда' }
    ]);

    let totalSeen = 0, totalAll = 0;
    const rows = cats.map(c => {
      const total = (typeof contentSize === 'function') ? contentSize(c.key) : 0;
      const seen = System.seenCount(c.key);
      totalSeen += seen; totalAll += total;
      return { emoji: c.emoji, name: c.name, seen: seen, total: total };
    });

    // Строки фиксированной высоты, а длинный список листается: раньше высота
    // подгонялась под экран, но с пятьюдесятью музеями строки стали бы нечитаемыми
    // (v1.3.12). Листание общее с достижениями — стрелки и перетаскивание.
    const startY = 92;
    const bottomY = H - 74;
    const rowH = 28;
    const gap = 5;
    const contentH = rows.length * (rowH + gap);
    const maxScroll = Math.max(0, contentH - (bottomY - startY));
    this.knowView = { top: startY, bottom: bottomY };
    this.achView = this.knowView;          // перетаскивание списка — общее с достижениями
    this.achMaxScroll = maxScroll;
    this.knowScroll = clamp(this.achScroll || 0, 0, maxScroll);

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, startY, W, bottomY - startY, 0);
    ctx.clip();
    rows.forEach((r, i) => {
      const y = startY + i * (rowH + gap) - this.knowScroll;
      if (y + rowH < startY || y > bottomY) return;
      const pct = r.total > 0 ? r.seen / r.total : 0;

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, 15, y, W - 30, rowH, 10);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(rowH * 0.7, 18)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(r.emoji, 24, y + rowH / 2);

      ctx.font = `bold ${Math.min(W * 0.031, rowH * 0.68, 12)}px Arial`;
      ctx.fillText(r.name, 50, y + rowH / 2);

      const barX = W * 0.56;
      const barW = W * 0.26;
      drawProgressBar(ctx, barX, y + rowH / 2 - 5, barW, 10, pct * 100, 100, 'rgba(255,255,255,0.15)', '#4D96FF');

      ctx.textAlign = 'right';
      ctx.fillStyle = '#9fd0ff';
      ctx.font = `bold ${Math.min(W * 0.028, 11)}px Arial`;
      ctx.fillText(r.seen + '/' + r.total, W - 22, y + rowH / 2);
    });
    ctx.restore();

    // Стрелки листания: видно, что список можно листать (как в достижениях)
    if (this.knowScroll > 0.5) {
      const up = createButton(ctx, W - 36, startY + 2, 30, 26, '▲', {
        bgColor: 'rgba(255,255,255,0.22)', fgColor: '#fff', fontSize: 13, radius: 8, shadow: false
      });
      up.action = 'knowUp';
      this.buttons.push(up);
    }
    if (this.knowScroll < maxScroll - 0.5) {
      const down = createButton(ctx, W - 36, bottomY - 30, 30, 26, '▼', {
        bgColor: 'rgba(255,255,255,0.22)', fgColor: '#fff', fontSize: 13, radius: 8, shadow: false
      });
      down.action = 'knowDown';
      this.buttons.push(down);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.036, 15)}px Arial`;
    const pctAll = totalAll > 0 ? Math.round(totalSeen / totalAll * 100) : 0;
    ctx.fillText('📖 Собрано ' + totalSeen + ' / ' + totalAll + ' (' + pctAll + '%)', W / 2, H - 40);
  }

  // ---------- СПРАВКА: «почему полоска не зелёная» и остальные шкалы ----------
  drawHelpTab(ctx, W, H) {
    const list = (typeof STAT_HELP !== 'undefined') ? STAT_HELP : [];
    let y = 104;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    list.forEach(h => {
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(W * 0.038, 15)}px Arial`;
      ctx.fillText(h.emoji + ' ' + h.name, 16, y);
      y += 15;

      ctx.fillStyle = '#dfe3f0';
      ctx.font = `${Math.min(W * 0.03, 11.5)}px Arial`;
      wrapLines(ctx, h.what, W - 32, 2).forEach(l => { ctx.fillText(l, 16, y); y += 13; });

      ctx.fillStyle = '#9be3b0';
      wrapLines(ctx, '↑ ' + h.up.join('; '), W - 32, 2).forEach(l => { ctx.fillText(l, 16, y); y += 13; });
      ctx.fillStyle = '#ffb3b3';
      wrapLines(ctx, '↓ ' + h.down.join('; '), W - 32, 2).forEach(l => { ctx.fillText(l, 16, y); y += 13; });
      y += 8;
    });

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = `${Math.min(W * 0.028, 11)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Подсказка: голодный питомец быстрее устаёт и нервничает', W / 2, H - 22);
    ctx.textBaseline = 'alphabetic';
  }

  drawInventoryTab(ctx, W, H) {
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.min(W * 0.04, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🎒 Инвентарь пока пуст', W / 2, H / 2);
    ctx.font = `${Math.min(W * 0.03, 14)}px Arial`;
    ctx.fillStyle = '#aaa';
    ctx.fillText('Покупайте вещи в магазине!', W / 2, H / 2 + 30);
  }

  // ============ КОЛЛЕКЦИЯ ПОЙМАННЫХ РЫБ (v1.3.12) ============
  // Заказчик: «чтобы там можно было посмотреть всю коллекцию рыб, которых ты уже
  // поймал… поймал новую — там в списке появлялось. И чтобы это было в достижениях
  // как-то логично отображено». Поэтому вход — прямо из вкладки достижений, а сам
  // экран показывает прогресс, ступени редкости, следующую цель и список: пойманные
  // виды (сначала редкие) — с эмодзи и числом поимок, непойманные — серым «???».
  drawFishCollection(ctx, W, H) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#20304d');
    grad.addColorStop(1, '#12182b');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    const all = (typeof FISH_SPECIES !== 'undefined') ? FISH_SPECIES : [];
    const seenMap = (System.fishSeen && typeof System.fishSeen === 'object') ? System.fishSeen : {};
    const seen = all.filter(f => seenMap[f.id]);
    const rarityOf = (typeof fishRarityOf === 'function') ? fishRarityOf : () => null;
    const tiers = (typeof FISH_RARITY !== 'undefined') ? FISH_RARITY : [];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
    ctx.fillText('🐠 Коллекция рыб', W / 2, 32);

    const pct = all.length ? Math.round(seen.length / all.length * 100) : 0;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.038, 15)}px Arial`;
    ctx.fillText('Поймано ' + seen.length + ' из ' + all.length + ' видов (' + pct + '%)', W / 2, 54);
    drawProgressBar(ctx, W * 0.12, 62, W * 0.76, 9, seen.length, all.length,
      'rgba(255,255,255,0.15)', '#4D96FF');

    ctx.font = `${Math.min(W * 0.026, 11)}px Arial`;
    tiers.forEach((t, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bw = W * 0.44, bx = W * 0.05 + col * (W * 0.47);
      const by = 80 + row * 20;
      const own = all.filter(f => rarityOf(f) === t);
      const gotN = own.filter(f => seenMap[f.id]).length;
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      roundRect(ctx, bx, by, bw, 17, 7);
      ctx.fill();
      ctx.fillStyle = t.color;
      ctx.fillText(t.emoji + ' ' + t.name + ': ' + gotN + '/' + own.length, bx + bw / 2, by + 12.5);
    });

    const ach = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS : [];
    const fishAch = ['fishAll', 'fishExpert', 'fishMaster']
      .map(id => ach.filter(a => a.id === id)[0]).filter(Boolean);
    const next = fishAch.filter(a => seen.length < a.goal)[0];
    ctx.fillStyle = next ? '#9be3b0' : '#FFD93D';
    ctx.font = `${Math.min(W * 0.028, 11.5)}px Arial`;
    ctx.fillText(next
      ? ('🎯 Следующая цель: «' + next.name + '» — ещё ' + (next.goal - seen.length) + ' вид(а)')
      : '🏆 Все рыбные достижения открыты!', W / 2, 125);

    this.drawFishList(ctx, W, H, all, seenMap, seen, rarityOf, tiers);
  }

  // Список коллекции: пойманные сверху (сначала редкие), ниже — ещё не пойманные.
  // Он листается, потому что видов сто. Непойманные показаны как «???» — так у
  // ребёнка видна цель, но не портится сюрприз открытия нового вида.
  drawFishList(ctx, W, H, all, seenMap, seen, rarityOf, tiers) {
    const order = {};
    tiers.forEach((t, i) => { order[t.id] = i; });
    const got = seen.slice().sort((a, b) => {
      const ra = order[(rarityOf(a) || {}).id] || 0;
      const rb = order[(rarityOf(b) || {}).id] || 0;
      if (ra !== rb) return rb - ra;
      return (seenMap[b.id] || 0) - (seenMap[a.id] || 0);
    });
    const missed = all.filter(f => !seenMap[f.id]);
    const rows = got.map(f => ({ f: f, got: true }))
      .concat(missed.map(f => ({ f: f, got: false })));

    const top = 134, bottom = H - 56;
    const rowH = 26;
    const contentH = rows.length * rowH + 6;
    const maxScroll = Math.max(0, contentH - (bottom - top));
    this.fishView = { top: top, bottom: bottom };
    this.fishMaxScroll = maxScroll;
    this.fishScroll = clamp(this.fishScroll || 0, 0, maxScroll);

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, top, W, bottom - top, 0);
    ctx.clip();
    rows.forEach((r, i) => {
      const y = top + i * rowH - this.fishScroll;
      if (y + rowH < top || y > bottom) return;
      const rar = rarityOf(r.f) || { emoji: '⚪', name: 'Обычная', color: '#9be3b0' };
      ctx.fillStyle = r.got ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)';
      roundRect(ctx, 12, y + 1, W - 24, rowH - 3, 8);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(rowH * 0.72, 17)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(r.got ? (r.f.e || '🐟') : '❔', 20, y + rowH / 2);

      ctx.font = `bold ${Math.min(W * 0.029, 12)}px Arial`;
      ctx.fillStyle = r.got ? '#fff' : 'rgba(255,255,255,0.5)';
      ctx.fillText(r.got ? r.f.name : '???', 44, y + rowH / 2);

      ctx.textAlign = 'right';
      if (r.got) {
        ctx.fillStyle = rar.color;
        ctx.font = `${Math.min(W * 0.025, 10.5)}px Arial`;
        ctx.fillText(rar.emoji + ' ' + rar.name, W - 76, y + rowH / 2);
        ctx.fillStyle = '#9fd0ff';
        ctx.font = `bold ${Math.min(W * 0.025, 10.5)}px Arial`;
        ctx.fillText('×' + (seenMap[r.f.id] || 1), W - 20, y + rowH / 2);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = `${Math.min(W * 0.025, 10.5)}px Arial`;
        ctx.fillText(rar.emoji + ' ' + rar.name, W - 20, y + rowH / 2);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    });
    ctx.restore();

    if (this.fishScroll > 0.5) {
      const up = createButton(ctx, W - 36, top + 2, 30, 26, '▲', {
        bgColor: 'rgba(255,255,255,0.22)', fgColor: '#fff', fontSize: 13, radius: 8, shadow: false
      });
      up.action = 'fishUp';
      this.buttons.push(up);
    }
    if (this.fishScroll < maxScroll - 0.5) {
      const down = createButton(ctx, W - 36, bottom - 30, 30, 26, '▼', {
        bgColor: 'rgba(255,255,255,0.22)', fgColor: '#fff', fontSize: 13, radius: 8, shadow: false
      });
      down.action = 'fishDown';
      this.buttons.push(down);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${Math.min(W * 0.026, 10.5)}px Arial`;
    ctx.fillText('Сначала пойманные, ниже — кого ещё надо найти', W / 2, H - 40);

    this.buttons.push(createButton(ctx, 10, H - 50, 100, 40, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 14, radius: 10
    }));
  }

  handleFishBack() {
    if (!this.fishMode) return false;
    this.fishMode = false;
    return true;
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    // Коллекция рыб: листание, «Назад» (к достижениям) и системная кнопка (v1.3.12)
    if (this.fishMode) {
      for (const b of this.buttons) {
        if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
        const view = this.fishView || { top: 0, bottom: 300 };
        const step = (view.bottom - view.top) * 0.7;
        if (b.action === 'fishUp') {
          this.fishScroll = clamp((this.fishScroll || 0) - step, 0, this.fishMaxScroll || 0);
          return true;
        }
        if (b.action === 'fishDown') {
          this.fishScroll = clamp((this.fishScroll || 0) + step, 0, this.fishMaxScroll || 0);
          return true;
        }
      }
      // «← Назад» — всегда последняя кнопка в списке
      const back = this.buttons[this.buttons.length - 1];
      if (back && isPointInRect(mx, my, back.x, back.y, back.w, back.h)) {
        this.fishMode = false;
        return true;
      }
      return true;                       // прочие тапы по экрану ничего не делают
    }

    // Стрелки листания (их нет в списке вкладок): достижения и «Знания» листаются
    // одним счётчиком — список музеев стал длинным (v1.3.12)
    for (const b of this.buttons) {
      if ((b.action === 'achUp' || b.action === 'achDown' ||
           b.action === 'knowUp' || b.action === 'knowDown') && isPointInRect(mx, my, b.x, b.y, b.w, b.h)) {
        const view = this.achView || this.knowView;
        const down = (b.action === 'achDown' || b.action === 'knowDown');
        const step = (view ? (view.bottom - view.top) * 0.7 : 200);
        this.achScroll = clamp((this.achScroll || 0) + (down ? step : -step), 0, this.achMaxScroll || 0);
        return true;
      }
    }

    // Кнопка «🐠 Коллекция рыб» во вкладке достижений
    for (const b of this.buttons) {
      if (b.action === 'fishCollection' && isPointInRect(mx, my, b.x, b.y, b.w, b.h)) {
        this.fishMode = true;
        this.fishScroll = 0;
        return true;
      }
    }

    // Tab buttons
    const tabs = this.tabButtons || this.buttons.slice(0, 5);
    for (const btn of tabs) {
      if (!btn || !btn.action) break;              // закончились вкладки
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        this.tab = btn.action;
        this.achScroll = 0;
        return true;
      }
    }

    // Back button
    if (this.buttons.length > 5) {
      const btn = this.buttons[this.buttons.length - 1];
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        this.game.transitionTo('map');
        return true;
      }
    }

    return false;
  }

  // Листание достижений пальцем: тянем список — он едет (как у друзей).
  // Стрелки листания при этом остаются кнопками, а не перетаскиванием.
  beginDrag(mx, my) {
    // Коллекция рыб листается пальцем так же, как достижения (v1.3.12)
    if (this.fishMode) {
      const v = this.fishView;
      if (!v || my < v.top || my > v.bottom) return false;
      for (const b of this.buttons) {
        if ((b.action === 'fishUp' || b.action === 'fishDown') &&
            isPointInRect(mx, my, b.x, b.y, b.w, b.h)) return false;
      }
      this.dragFrom = { y: my, scroll: this.fishScroll || 0, fish: true };
      return true;
    }
    if ((this.tab !== 'ach' && this.tab !== 'knowledge') || !this.achView) return false;
    if (my < this.achView.top || my > this.achView.bottom) return false;
    for (const b of this.buttons) {
      if ((b.action === 'achUp' || b.action === 'achDown' ||
           b.action === 'knowUp' || b.action === 'knowDown') && isPointInRect(mx, my, b.x, b.y, b.w, b.h)) return false;
    }
    this.dragFrom = { y: my, scroll: this.achScroll || 0 };
    return true;
  }

  dragMove(mx, my) {
    if (!this.dragFrom) return false;
    const next = this.dragFrom.scroll + (this.dragFrom.y - my);
    if (this.dragFrom.fish) {
      this.fishScroll = clamp(next, 0, this.fishMaxScroll || 0);
    } else {
      this.achScroll = clamp(next, 0, this.achMaxScroll || 0);
    }
    return true;
  }

  endDrag() {
    this.dragFrom = null;
    return true;
  }
}
window.StatsScene = StatsScene;
