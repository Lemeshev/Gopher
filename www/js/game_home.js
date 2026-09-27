// ============ СЦЕНА ДОМА ============
class HomeScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.roomDecorations = [];
    this.bubbleText = '';
    this.bubbleTimer = 0;
  }

  init() {
    this.time = 0;
    this.bubbleText = '';
    this.bubbleTimer = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.bubbleTimer > 0) {
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0) this.bubbleText = '';
    }
    // Ambient particles
    if (Math.random() < 0.03) {
      this.roomDecorations.push({
        type: 'sparkle',
        x: Math.random() * this.game.width,
        y: Math.random() * this.game.height,
        alpha: 0,
        life: 0
      });
    }
    this.roomDecorations.forEach(d => {
      if (d.type === 'sparkle') {
        d.alpha = Math.sin(this.time * 0.003 + d.x) * 0.3;
        d.life++;
      }
    });
  }

  setBubble(text) {
    this.bubbleText = text;
    this.bubbleTimer = 3000;
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Room background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    const isNight = System.timeOfDay === 'night' || System.timeOfDay === 'evening';
    if (isNight) {
      grad.addColorStop(0, '#1a1a3e');
      grad.addColorStop(1, '#2a2a4e');
    } else {
      grad.addColorStop(0, '#FFF8E7');
      grad.addColorStop(1, '#FFE4C4');
    }
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Window
    if (!isNight) {
      ctx.fillStyle = '#87CEEB';
      roundRect(ctx, W * 0.7, H * 0.05, W * 0.2, H * 0.2, 8);
      ctx.fill();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 4;
      roundRect(ctx, W * 0.7, H * 0.05, W * 0.2, H * 0.2, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.8, H * 0.05);
      ctx.lineTo(W * 0.8, H * 0.25);
      ctx.moveTo(W * 0.7, H * 0.15);
      ctx.lineTo(W * 0.9, H * 0.15);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0c0c30';
      roundRect(ctx, W * 0.7, H * 0.05, W * 0.2, H * 0.2, 8);
      ctx.fill();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 4;
      roundRect(ctx, W * 0.7, H * 0.05, W * 0.2, H * 0.2, 8);
      ctx.stroke();
      // Moon
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(W * 0.8, H * 0.13, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floor
    ctx.fillStyle = isNight ? '#3a2a1a' : '#D2B48C';
    ctx.fillRect(0, H * 0.7, W, H * 0.3);
    ctx.strokeStyle = isNight ? '#2a1a0a' : '#C4A882';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, H * 0.7 + i * H * 0.06);
      ctx.lineTo(W, H * 0.7 + i * H * 0.06);
      ctx.stroke();
    }

    // === XP ПРОГРЕСС-БАР НА ДОМЕ ===
    const homeXpPct = System.xp / System.xpToNext;
    const homeXpBarY = 10;
    const homeXpBarW = W - 20;
    const homeXpBarH = 12;
    
    ctx.font = `bold ${Math.min(W * 0.025, 11)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8B4513';
    ctx.fillText('⭐ Ур.' + System.level, 15, homeXpBarY + 2);
    
    ctx.font = `${Math.min(W * 0.02, 9)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
    ctx.fillText(System.xp + '/' + System.xpToNext, W - 15, homeXpBarY + 2);
    
    ctx.fillStyle = 'rgba(139, 69, 19, 0.15)';
    roundRect(ctx, 10, homeXpBarY + 5, homeXpBarW, homeXpBarH, 6);
    ctx.fill();
    
    if (homeXpPct > 0) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, 10, homeXpBarY + 5, homeXpBarW * homeXpPct, homeXpBarH, 6);
      ctx.fill();
    }

    // Rug
    ctx.fillStyle = isNight ? 'rgba(139, 69, 19, 0.3)' : 'rgba(205, 92, 92, 0.3)';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.75, W * 0.3, H * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Furniture - shelf
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(W * 0.05, H * 0.25, W * 0.15, H * 0.02);
    ctx.fillRect(W * 0.05, H * 0.4, W * 0.15, H * 0.02);
    // Books on shelf
    const bookColors = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#FF8C42', '#9B59B6'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = bookColors[i];
      ctx.fillRect(W * 0.06 + i * W * 0.022, H * 0.17, W * 0.018, H * 0.07);
      ctx.fillRect(W * 0.06 + i * W * 0.022, H * 0.32, W * 0.018, H * 0.07);
    }

    // Lamp
    ctx.fillStyle = '#666';
    ctx.fillRect(W * 0.92, H * 0.15, 4, H * 0.15);
    ctx.fillStyle = isNight ? '#FFD700' : '#FFE4B5';
    ctx.beginPath();
    ctx.moveTo(W * 0.92 - 2, H * 0.15);
    ctx.lineTo(W * 0.92 + 2, H * 0.15);
    ctx.lineTo(W * 0.92 + 18, H * 0.1);
    ctx.lineTo(W * 0.92 - 18, H * 0.1);
    ctx.closePath();
    ctx.fill();
    if (isNight) {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(W * 0.92, H * 0.12, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Sparkles
    this.roomDecorations.forEach(d => {
      if (d.type === 'sparkle') {
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // Draw Gopher
    if (this.game.gopher) {
      const expression = System.isSleeping ? 'sleeping' :
                         System.isSick ? 'sick' :
                         System.stats.happiness > 60 ? 'happy' :
                         System.stats.hunger < 30 ? 'sad' : 'neutral';
      this.game.gopher.setExpression(expression, 30);
      const gs = Math.min(W * 0.4, 160);
      this.game.gopher.draw(ctx, W * 0.5, H * 0.55, gs / this.game.gopher.size);
    }

    // Speech bubble
    if (this.bubbleText) {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      roundRect(ctx, W * 0.15, H * 0.08, W * 0.7, 45, 15);
      ctx.fill();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      roundRect(ctx, W * 0.15, H * 0.08, W * 0.7, 45, 15);
      ctx.stroke();
      // Triangle
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - 8, H * 0.08 + 45);
      ctx.lineTo(W * 0.5, H * 0.08 + 55);
      ctx.lineTo(W * 0.5 + 8, H * 0.08 + 45);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = `bold ${Math.min(W * 0.035, 15)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.bubbleText, W * 0.5, H * 0.08 + 22);
    }

    // Stats panel
    const panelY = H * 0.72;
    const panelH = H * 0.18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, 10, panelY, W - 20, panelH, 12);
    ctx.fill();

    // Individual stat bars
    const stats = [
      { key: 'happiness', emoji: '❤️', name: 'Счастье' },
      { key: 'hunger', emoji: '🍗', name: 'Сытость' },
      { key: 'energy', emoji: '😴', name: 'Энергия' },
      { key: 'health', emoji: '🏥', name: 'Здоровье' },
      { key: 'cleanliness', emoji: '🧹', name: 'Чистота' }
    ];

    const barW = (W - 40) / 2;
    const barH = 18;
    const startY = panelY + 8;
    const startX = 20;
    const spacing = (panelH - 20) / 5;

    stats.forEach((s, i) => {
      const row = i;
      const y = startY + row * spacing;
      const col = row % 2;
      const bx = startX + col * (barW + 10);
      const by = y + Math.floor(row / 2) * (barH + 4);

      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(s.emoji + ' ' + s.name, bx, by);

      drawProgressBar(ctx, bx, by + 4, barW, barH - 6, System.stats[s.key], 100, 'rgba(255,255,255,0.2)', System.getStatColor(s.key));

      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.fillText(System.stats[s.key].toFixed(0), bx + barW, by + barH - 6);
    });

    // Action buttons
    const actionButtons = [
      { emoji: '🍽️', text: 'Покормить', action: 'feed', color: '#FF6B6B', stat: 'hunger', change: 25 },
      { emoji: '🛁', text: 'Искупать', action: 'bathe', color: '#00BCD4', stat: 'cleanliness', change: 30 },
      { emoji: '😴', text: 'Уложить спать', action: 'sleep', color: '#3F51B5', condition: () => !System.isSleeping },
      { emoji: '🎮', text: 'Играть', action: 'play', color: '#FF8C42', condition: () => !System.isSleeping && System.stats.energy > 10 },
      { emoji: '💊', text: 'Лечить', action: 'heal', color: '#E74C3C', condition: () => System.isSick || System.stats.health < 50 },
      { emoji: '👔', text: 'Работать', action: 'work', color: '#4D96FF', condition: () => System.stats.energy > 40 },
      { emoji: '🎓', text: 'Учиться', action: 'study', color: '#9B59B6', condition: () => System.stats.energy > 40 },
      { emoji: '🗺️', text: 'Картa', action: 'map', color: '#2ECC71' }
    ];

    const btnW = (W - 40) / 3;
    const btnH = 48;
    const btnStartY = H - 65;

    actionButtons.forEach((ab, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = 20 + col * (btnW + 5);
      const by = btnStartY + row * (btnH + 8);

      if (ab.condition && !ab.condition()) return;

      ctx.fillStyle = ab.color;
      roundRect(ctx, bx, by, btnW, btnH, 12);
      ctx.fill();

      ctx.font = `${Math.min(btnW * 0.28, 24)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff';
      ctx.fillText(ab.emoji, bx + btnW / 2, by + 4);

      ctx.font = `bold ${Math.min(btnW * 0.13, 11)}px Arial`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(ab.text, bx + btnW / 2, by + btnH - 2);

      this.buttons.push({ ...ab, x: bx, y: by, w: btnW, h: btnH });
    });
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    for (const btn of this.buttons) {
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        switch (btn.action) {
          case 'feed':
            System.stats.hunger = Math.min(100, System.stats.hunger + btn.change);
            System.stats.happiness = Math.min(100, System.stats.happiness + 5);
            this.setBubble('Ням-ням! Вкусно! 😋');
            this.game.gopher.setExpression('eating', 60);
            AudioSys.play('eat');
            System.addXP(5);
            break;
          case 'bathe':
            System.stats.cleanliness = Math.min(100, System.stats.cleanliness + btn.change);
            System.stats.happiness = Math.min(100, System.stats.happiness + 5);
            this.setBubble('Бульк-бульк! Чистый! 🫧');
            this.game.gopher.setExpression('happy', 60);
            AudioSys.play('bath');
            System.addXP(5);
            break;
          case 'sleep':
            System.isSleeping = !System.isSleeping;
            if (System.isSleeping) {
              this.game.gopher.setExpression('sleeping', 9999);
              this.setBubble('Спокойной ночи! 💤');
              AudioSys.play('sleep');
              // Restore energy
              setTimeout(() => {
                System.stats.energy = Math.min(100, System.stats.energy + 40);
                System.stats.health = Math.min(100, System.stats.health + 10);
                System.isSleeping = false;
                System.showAchievement('😴', 'Энергия восстановлена!');
              }, 2000);
            } else {
              this.setBubble('Доброе утро! ☀️');
              this.game.gopher.setExpression('happy', 60);
            }
            break;
          case 'play':
            System.stats.happiness = Math.min(100, System.stats.happiness + 15);
            System.stats.energy = Math.max(0, System.stats.energy - 10);
            this.setBubble('Ура! Весело! 🎉');
            this.game.gopher.setExpression('excited', 60);
            AudioSys.play('success');
            System.addXP(8);
            break;
          case 'heal':
            System.stats.health = Math.min(100, System.stats.health + 20);
            if (System.stats.health > 50) System.isSick = false;
            this.setBubble('Становится лучше! 💊');
            AudioSys.play('success');
            System.addXP(5);
            break;
          case 'work':
            const earn = Math.floor(10 + System.stats.workSkill * 0.3 + System.level);
            System.earnCoins(earn);
            System.stats.energy = Math.max(0, System.stats.energy - 15);
            System.stats.workSkill = Math.min(100, System.stats.workSkill + 2);
            System.stats.stress = Math.min(100, System.stats.stress + 5);
            this.setBubble('Зарплата: 🪙' + earn + '!');
            AudioSys.play('coin');
            System.addXP(5);
            break;
          case 'study':
            System.stats.schoolSkill = Math.min(100, System.stats.schoolSkill + 3);
            System.stats.intelligence = Math.min(100, System.stats.intelligence + 3);
            System.stats.energy = Math.max(0, System.stats.energy - 15);
            this.setBubble('Учёба продвигается! 📚');
            AudioSys.play('success');
            System.addXP(8);
            break;
          case 'map':
            this.game.transitionTo('map');
            return true;
        }
        System.saveGame();
        return true;
      }
    }

    return false;
  }
}
window.HomeScene = HomeScene;
