// ============ СЦЕНА ГЛАВНОГО МЕНЮ ============
class MenuScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.particles = [];
    this.time = 0;
    this.titleAlpha = 0;
    this.hasSave = false;
  }

  init() {
    this.time = 0;
    this.titleAlpha = 0;
    this.buttons = [];
    this.particles = [];
    this.hasSave = System.hasSave();
    if (this.game.gopher) this.game.gopher.setExpression('excited', 999999);
  }

  update(dt) {
    this.time += dt;
    this.titleAlpha = Math.min(1, this.titleAlpha + dt * 0.002);
    if (Math.random() < 0.1) {
      this.particles.push({
        x: Math.random() * this.game.width,
        y: this.game.height + 10,
        vy: -randFloat(1, 3),
        vx: randFloat(-0.5, 0.5),
        size: randFloat(3, 8),
        alpha: 1,
        color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BB5'][randInt(0, 4)],
        life: randInt(80, 200)
      });
    }
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.max(0, p.life / 80);
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Фон
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Круги на фоне
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 8; i++) {
      const cx = W * 0.5 + Math.cos(this.time * 0.0005 + i) * W * 0.35;
      const cy = H * 0.5 + Math.sin(this.time * 0.0007 + i * 0.7) * H * 0.35;
      ctx.fillStyle = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D'][i % 4];
      ctx.beginPath();
      ctx.arc(cx, cy, 60 + Math.sin(this.time * 0.001 + i) * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Частицы
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Заголовок
    ctx.globalAlpha = this.titleAlpha;
    const titleY = H * 0.10;
    const titleSize = Math.min(W * 0.085, 42);

    ctx.font = `bold ${titleSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillText('Gopher Life', W / 2 + 2, titleY + 2);
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('Gopher Life', W / 2, titleY);

    // Подзаголовок
    const subSize = Math.min(W * 0.032, 15);
    ctx.font = `${subSize}px Arial`;
    ctx.fillStyle = '#a0a0cc';
    ctx.fillText('Интерактивный питомец', W / 2, titleY + subSize + 10);
    ctx.globalAlpha = 1;

    // === XP ПРОГРЕСС-БАР ===
    const xpBarY = titleY + subSize + 34;
    const xpBarW = Math.min(W * 0.6, 220);
    const xpBarH = 16;
    const xpBarX = (W - xpBarW) / 2;

    ctx.font = `bold ${Math.min(W * 0.034, 14)}px Arial`;
    ctx.fillStyle = '#FFD93D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐ Уровень ' + System.level, W / 2, xpBarY);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, xpBarX, xpBarY + 12, xpBarW, xpBarH, 8);
    ctx.fill();

    const xpPercent = clamp(System.xp / System.xpToNext, 0, 1);
    if (xpPercent > 0.01) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, xpBarX + 1, xpBarY + 13, (xpBarW - 2) * xpPercent, xpBarH - 2, 7);
      ctx.fill();
    }

    ctx.font = `${Math.min(W * 0.024, 11)}px Arial`;
    ctx.fillStyle = '#fff';
    ctx.fillText(System.xp + ' / ' + System.xpToNext + ' XP', W / 2, xpBarY + 12 + xpBarH / 2);

    // Гофер
    if (this.game.gopher) {
      const gs = Math.min(W * 0.36, 150);
      this.game.gopher.draw(ctx, W / 2, H * 0.30, gs / this.game.gopher.size);
    }

    // === КНОПКИ ===
    const btnW = Math.min(W * 0.72, 270);
    const btnH = 50;
    const gap = 12;
    const btnX = (W - btnW) / 2;

    const list = [];
    if (this.hasSave) {
      list.push({ text: '▶️ Продолжить', color: '#4D96FF', size: 18 });
      list.push({ text: '🎮 Новая игра', color: '#6BCB77', size: 18 });
    } else {
      list.push({ text: '🎮 Новая игра', color: '#6BCB77', size: 18 });
    }
    list.push({ text: '📖 Как играть', color: '#FF8C42', size: 16 });

    const totalH = list.length * btnH + (list.length - 1) * gap;
    let by = Math.max(H * 0.52, H - totalH - 40);
    if (by + totalH > H - 12) by = H - totalH - 12;

    list.forEach(item => {
      this.buttons.push(createButton(ctx, btnX, by, btnW, btnH, item.text, {
        bgColor: item.color, fontSize: item.size
      }));
      by += btnH + gap;
    });
  }

  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      AudioSys.play('click');
      const t = btn.text || '';
      if (t.indexOf('Новая игра') !== -1) {
        System.resetProgress();
        System.saveGame();
        this.hasSave = true;
        this.game.transitionTo('map');
      } else if (t.indexOf('Продолжить') !== -1) {
        System.loadGame();
        this.game.transitionTo('map');
      } else if (t.indexOf('Как играть') !== -1) {
        this.game.showTutorial();
      }
      return true;
    }
    return false;
  }
}
window.MenuScene = MenuScene;
