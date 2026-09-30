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

    const top = 126, bottom = H - 58;      // до кнопки «Назад» остаётся место
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
        else this.drawAchRow(ctx, r.ach, W, y, r.h);
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
    ctx.fillText(a.desc, 50, y + 31);

    drawProgressBar(ctx, 50, y + h - 9, W - 122, 5, on ? prog.goal : prog.value, prog.goal,
      'rgba(255,255,255,0.15)', on ? '#FFD93D' : '#4D96FF');

    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  drawKnowledgeTab(ctx, W, H) {
    // Коллекция: сколько предметов уже увидено из базы контента
    const cats = [
      { key: 'art_museum', emoji: '🖼️', name: 'Художественный музей' },
      { key: 'nature_museum', emoji: '🦕', name: 'Музей природы' },
      { key: 'space_museum', emoji: '🚀', name: 'Космический музей' },
      { key: 'history_museum', emoji: '🏺', name: 'Исторический музей' },
      { key: 'library', emoji: '📚', name: 'Библиотека' },
      { key: 'school', emoji: '🎓', name: 'Учёба' },
      { key: 'work', emoji: '💼', name: 'Работа' },
      { key: 'park', emoji: '🎢', name: 'Парк' },
      { key: 'cinema', emoji: '🎬', name: 'Кино' },
      { key: 'pool', emoji: '🏊', name: 'Бассейн' },
      { key: 'gym', emoji: '🏋️', name: 'Спортзал' },
      { key: 'clinic', emoji: '🏥', name: 'Лечения' },
      { key: 'restaurant', emoji: '🍽️', name: 'Блюда' }
    ];

    let totalSeen = 0, totalAll = 0;
    const rows = cats.map(c => {
      const total = (typeof contentSize === 'function') ? contentSize(c.key) : 0;
      const seen = System.seenCount(c.key);
      totalSeen += seen; totalAll += total;
      return { emoji: c.emoji, name: c.name, seen: seen, total: total };
    });

    const startY = 92;
    const avail = H - startY - 70;
    const rowH = Math.max(22, Math.min(40, avail / rows.length - 5));

    rows.forEach((r, i) => {
      const y = startY + i * (rowH + 5);
      const pct = r.total > 0 ? r.seen / r.total : 0;

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, 15, y, W - 30, rowH, 10);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(rowH * 0.55, 18)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(r.emoji, 24, y + rowH / 2);

      ctx.font = `bold ${Math.min(W * 0.031, 12)}px Arial`;
      ctx.fillText(r.name, 50, y + rowH / 2);

      const barX = W * 0.56;
      const barW = W * 0.26;
      drawProgressBar(ctx, barX, y + rowH / 2 - 5, barW, 10, pct * 100, 100, 'rgba(255,255,255,0.15)', '#4D96FF');

      ctx.textAlign = 'right';
      ctx.fillStyle = '#9fd0ff';
      ctx.font = `bold ${Math.min(W * 0.028, 11)}px Arial`;
      ctx.fillText(r.seen + '/' + r.total, W - 22, y + rowH / 2);
    });

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

  handleClick(mx, my) {
    AudioSys.play('click');

    // Стрелки листания достижений (их нет в списке вкладок)
    for (const b of this.buttons) {
      if ((b.action === 'achUp' || b.action === 'achDown') && isPointInRect(mx, my, b.x, b.y, b.w, b.h)) {
        const step = (this.achView ? (this.achView.bottom - this.achView.top) * 0.7 : 200);
        this.achScroll = clamp((this.achScroll || 0) + (b.action === 'achDown' ? step : -step), 0, this.achMaxScroll || 0);
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
    if (this.tab !== 'ach' || !this.achView) return false;
    if (my < this.achView.top || my > this.achView.bottom) return false;
    for (const b of this.buttons) {
      if ((b.action === 'achUp' || b.action === 'achDown') && isPointInRect(mx, my, b.x, b.y, b.w, b.h)) return false;
    }
    this.dragFrom = { y: my, scroll: this.achScroll || 0 };
    return true;
  }

  dragMove(mx, my) {
    if (!this.dragFrom) return false;
    this.achScroll = clamp(this.dragFrom.scroll + (this.dragFrom.y - my), 0, this.achMaxScroll || 0);
    return true;
  }

  endDrag() {
    this.dragFrom = null;
    return true;
  }
}
window.StatsScene = StatsScene;
