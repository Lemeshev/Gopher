// ============ СЦЕНА ГЛАВНОГО МЕНЮ ============
class MenuScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.bgColor = '#1a1a2e';
    this.titleAlpha = 0;
    this.gopherExpression = 'excited';
    this.particles = [];
    this.time = 0;
  }

  init() {
    this.time = 0;
    this.titleAlpha = 0;
  }

  update(dt) {
    this.time += dt;
    this.titleAlpha = Math.min(1, this.titleAlpha + dt * 0.002);
    // Create particles
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

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Animated background circles
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

    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Title
    ctx.globalAlpha = this.titleAlpha;
    const titleY = H * 0.15;
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.1, 52)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillText('🐹 Gopher Life', W / 2 + 2, titleY + 2);
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('🐹 Gopher Life', W / 2, titleY);

    // Subtitle
    ctx.fillStyle = '#a0a0cc';
    ctx.font = `${Math.min(W * 0.035, 16)}px Arial`;
    ctx.fillText('Интерактивный питомец', W / 2, titleY + 40);
    ctx.globalAlpha = 1;

    // Draw gopher
    if (this.game.gopher) {
      const gs = Math.min(W * 0.45, 180);
      this.game.gopher.setExpression(this.gopherExpression, 30);
      this.game.gopher.draw(ctx, W / 2, H * 0.38, gs / this.game.gopher.size);
    }

    // Stats preview at menu
    const previewY = H * 0.6;
    const previewW = Math.min(W * 0.85, 350);
    const previewX = (W - previewW) / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, previewX, previewY, previewW, H * 0.15, 15);
    ctx.fill();

    ctx.font = `${Math.min(W * 0.035, 15)}px Arial`;
    ctx.textAlign = 'left';
    const statList = [
      { emoji: '❤️', val: System.stats.happiness },
      { emoji: '🍗', val: System.stats.hunger },
      { emoji: '😴', val: System.stats.energy },
      { emoji: '🏥', val: System.stats.health },
      { emoji: '🧹', val: System.stats.cleanliness }
    ];
    const cols = 5;
    const cw = previewW / cols;
    statList.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = previewX + col * cw + cw / 2;
      const sy = previewY + 15 + row * 25;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = System.getStatColor(s.val);
      ctx.fillText(s.emoji + Math.floor(s.val) + '%', sx, sy);
    });

    // Level and coins
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.04, 17)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText('⭐ Ур. ' + System.level + '    🪙 ' + System.coins, W - 20, previewY + 8);

    // Buttons
    const btnW = Math.min(W * 0.6, 240);
    const btnH = 52;
    const btnX = (W - btnW) / 2;

    // New Game button
    if (!System.loadGame()) {
      this.buttons.push(createButton(ctx, btnX, H * 0.78, btnW, btnH, '🎮 Новая игра', {
        bgColor: '#6BCB77',
        fontSize: 18
      }));
    }

    // Continue button
    if (System.loadGame()) {
      this.buttons.push(createButton(ctx, btnX, H * 0.78, btnW, btnH, '▶️ Продолжить', {
        bgColor: '#4D96FF',
        fontSize: 18
      }));
    }

    // How to play button
    this.buttons.push(createButton(ctx, btnX, H * 0.87, btnW, btnH, '📖 Как играть', {
      bgColor: '#FF8C42',
      fontSize: 16
    }));

    // Credits
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('v1.0 | Сделано с ❤️', W / 2, H - 15);
  }

  handleClick(mx, my) {
    AudioSys.play('click');
    this.gopherExpression = 'excited';
    for (const btn of this.buttons) {
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        if (btn.text.includes('Новая игра')) {
          System.saveGame();
          this.game.transitionTo('map');
        } else if (btn.text.includes('Продолжить')) {
          System.loadGame();
          this.game.transitionTo('map');
        } else if (btn.text.includes('Как играть')) {
          this.game.showTutorial();
        }
        return true;
      }
    }
    return false;
  }
}
window.MenuScene = MenuScene;
