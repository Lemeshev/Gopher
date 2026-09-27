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
  }

  update(dt) {
    this.time += dt;
  }

  draw(ctx) {
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
      { id: 'inventory', label: '🎒', w: 50 }
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
      { key: 'stress', emoji: '😰', name: 'Стресс' }
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

      drawProgressBar(ctx, bx + 4, y + 20, bw - 8, 10, System.stats[s.key], 100, 'rgba(255,255,255,0.15)', System.getStatColor(s.key));

      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.fillText(Math.floor(System.stats[s.key]) + '%', bx + bw - 8, y + 27);
    });

    // Info
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, W * 0.05, startY + mainStats.length * rowH + 10, W * 0.9, 70, 12);
    ctx.fill();

    ctx.font = `${Math.min(W * 0.03, 14)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('🪙 Монет: ' + System.coins, W / 2, startY + mainStats.length * rowH + 32);
    ctx.fillStyle = '#fff';
    ctx.fillText('📅 Время в игре: ' + Math.floor(System.totalPlayTime / 60) + ' мин', W / 2, startY + mainStats.length * rowH + 55);
  }

  drawAchTab(ctx, W, H) {
    const achievements = [
      { id: 'first_feed', emoji: '🍽️', name: 'Первая еда', desc: 'Покормите гофера', check: () => System.visitedLocations.has('home') },
      { id: 'first_work', emoji: '💼', name: 'Первая зарплата', desc: 'Сходите на работу', check: () => System.visitedLocations.has('work') },
      { id: 'first_pool', emoji: '🏊', name: 'Первый бассейн', desc: 'Поплавайте', check: () => System.visitedLocations.has('pool') },
      { id: 'rich', emoji: '💰', name: 'Богач', desc: 'Накопите 200 монет', check: () => System.coins >= 200 },
      { id: 'level5', emoji: '⭐', name: 'Опытный', desc: 'Достигните 5 уровня', check: () => System.level >= 5 },
      { id: 'level10', emoji: '🌟', name: 'Ветеран', desc: 'Достигните 10 уровня', check: () => System.level >= 10 },
      { id: 'all_museums', emoji: '🎓', name: 'Коллекционер', desc: 'Посетите все музеи', check: () => ['museum_art','museum_nature','museum_space','museum_history'].every(l => System.visitedLocations.has(l)) },
      { id: 'tictactoe_win', emoji: '❌', name: 'Победитель', desc: 'Выиграйте в крестики-нолики', check: () => System.achievements.includes('ttt_win') },
      { id: 'healthy', emoji: '💪', name: 'Здоровяк', desc: 'Все статы > 80', check: () => ['happiness','hunger','energy','health','cleanliness'].every(s => System.stats[s] > 80) },
      { id: 'scholar', emoji: '📚', name: 'Учёный', desc: 'Интеллект > 80', check: () => System.stats.intelligence > 80 },
      { id: 'professional', emoji: '👔', name: 'Профессионал', desc: 'Рабочий навык > 80', check: () => System.stats.workSkill > 80 },
      { id: 'graduator', emoji: '🎓', name: 'Выпускник', desc: 'Учебный навык > 80', check: () => System.stats.schoolSkill > 80 }
    ];

    const startY = 100;
    const rowH = 55;

    achievements.forEach((a, i) => {
      const y = startY + i * (rowH + 8);
      const unlocked = System.achievements.includes(a.id);

      ctx.fillStyle = unlocked ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, 15, y, W - 30, rowH, 12);
      ctx.fill();

      if (!unlocked) {
        ctx.globalAlpha = 0.4;
      }

      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(unlocked ? a.emoji : '🔒', 25, y + 28);

      ctx.font = `bold ${Math.min(W * 0.035, 15)}px Arial`;
      ctx.fillText(a.name, 55, y + 22);

      ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
      ctx.fillStyle = '#aaa';
      ctx.fillText(a.desc, 55, y + 42);

      ctx.globalAlpha = 1;
    });

    // Count
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🏆 ' + System.achievements.length + ' / ' + achievements.length, W / 2, H - 70);
  }

  drawKnowledgeTab(ctx, W, H) {
    const knowledge = [
      { key: 'artMuseum', emoji: '🎨', name: 'Художественный музей', value: System.knowledge.artMuseum },
      { key: 'natureMuseum', emoji: '🦕', name: 'Музей природы', value: System.knowledge.natureMuseum },
      { key: 'spaceMuseum', emoji: '🚀', name: 'Космический музей', value: System.knowledge.spaceMuseum },
      { key: 'historyMuseum', emoji: '🏛️', name: 'Исторический музей', value: System.knowledge.historyMuseum },
      { key: 'library', emoji: '📚', name: 'Библиотека', value: System.knowledge.library }
    ];

    const startY = 100;
    const rowH = 50;

    knowledge.forEach((k, i) => {
      const y = startY + i * (rowH + 10);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, 15, y, W - 30, rowH, 12);
      ctx.fill();

      ctx.font = '22px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(k.emoji, 25, y + 30);

      ctx.font = `bold ${Math.min(W * 0.035, 14)}px Arial`;
      ctx.fillText(k.name, 55, y + 18);

      drawProgressBar(ctx, 55, y + 28, W * 0.45, 12, k.value, 100, 'rgba(255,255,255,0.15)', '#4D96FF');

      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#4D96FF';
      ctx.fillText(k.value + '%', W - 25, y + 37);
    });
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

    // Tab buttons
    for (let i = 0; i < 4; i++) {
      const btn = this.buttons[i];
      if (btn && isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        if (btn.action === 'stats') this.tab = 'stats';
        else if (btn.action === 'ach') this.tab = 'ach';
        else if (btn.action === 'knowledge') this.tab = 'knowledge';
        else if (btn.action === 'inventory') this.tab = 'inventory';
        return true;
      }
    }

    // Back button
    if (this.buttons.length > 4) {
      const btn = this.buttons[this.buttons.length - 1];
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        this.game.transitionTo('map');
        return true;
      }
    }

    return false;
  }
}
window.StatsScene = StatsScene;
