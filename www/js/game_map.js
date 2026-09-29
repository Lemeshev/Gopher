// ============ СЦЕНА КАРТЫ МИРА ============
class MapScene {
  constructor(game) {
    this.game = game;
    this.locationButtons = [];
    this.time = 0;
    this.particles = [];
  }

  init() {
    this.time = 0;
    this.locationButtons = [];
    this.particles = [];
  }

  update(dt) {
    this.time += dt;
    if (Math.random() < 0.05) {
      this.particles.push({
        x: Math.random() * this.game.width,
        y: this.game.height,
        vy: -randFloat(0.5, 1.5),
        size: randFloat(2, 5),
        alpha: 0.5,
        life: randInt(100, 300)
      });
    }
    this.particles.forEach(p => { p.y += p.vy; p.life--; p.alpha = Math.max(0, p.life / 100); });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    const W = this.game.width;
    const H = this.game.height;
    this.locationButtons = [];

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    const timeColors = {
      morning: ['#87CEEB', '#B0E0E6'],
      afternoon: ['#FFD93D', '#FF8C42'],
      evening: ['#FF6B6B', '#C44569'],
      night: ['#0c0c30', '#1a1a4e']
    };
    const colors = timeColors[System.timeOfDay] || timeColors.morning;
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Stars at night
    if (System.timeOfDay === 'night') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * W;
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * H * 0.4;
        ctx.globalAlpha = 0.3 + Math.sin(this.time * 0.003 + i) * 0.3;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Header with stats
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, 10, 10, W - 20, 70, 12);
    ctx.fill();

    ctx.font = `bold ${Math.min(W * 0.045, 20)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText('📍 Куда пойдём?', 20, 35);

    ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('🪙 ' + System.coins, W - 20, 28);
    const timeEmojis = { morning: '🌅', afternoon: '☀️', evening: '🌇', night: '🌙' };
    const timeNames = { morning: 'Утро', afternoon: 'День', evening: 'Вечер', night: 'Ночь' };
    ctx.fillText(timeEmojis[System.timeOfDay] + ' ' + (timeNames[System.timeOfDay] || ''), W - 20, 48);

    // === XP ПРОГРЕСС-БАР НА КАРТЕ ===
    const mapXpPct = System.xp / System.xpToNext;
    const mapXpBarY = 55;
    const mapXpBarW = (W - 40);
    const mapXpBarH = 12;
    
    ctx.font = `bold ${Math.min(W * 0.025, 11)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('⭐ Ур.' + System.level, 25, mapXpBarY - 2);
    
    ctx.font = `${Math.min(W * 0.02, 9)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(System.xp + '/' + System.xpToNext, W - 25, mapXpBarY - 2);
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, 20, mapXpBarY + 2, mapXpBarW, mapXpBarH, 6);
    ctx.fill();
    
    if (mapXpPct > 0) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, 20, mapXpBarY + 2, mapXpBarW * mapXpPct, mapXpBarH, 6);
      ctx.fill();
    }

    // Draw gopher
    if (this.game.gopher) {
      this.game.gopher.setExpression('happy', 20);
      this.game.gopher.draw(ctx, W * 0.5, H * 0.17, Math.min(W * 0.25, 100) / this.game.gopher.size);
    }

    // Locations
    const locations = [
      { id: 'home', emoji: '🏠', name: 'Дом', color: '#FF6B6B', desc: 'Еда, сон, игры' },
      { id: 'shop', emoji: '🛒', name: 'Магазин', color: '#F39C12', desc: 'Покупки 🎁' },
      { id: 'work', emoji: '🏢', name: 'Работа', color: '#4D96FF', desc: 'Разные задания', req: 'energy>40' },
      { id: 'school', emoji: '🎓', name: 'Учёба', color: '#9B59B6', desc: 'Разные знания', req: 'energy>40' },
      { id: 'restaurant', emoji: '🍽️', name: 'Ресторан', color: '#FF8C42', desc: 'Блюда мира', cost: 30, req: 'energy>30' },
      { id: 'pool', emoji: '🏊', name: 'Бассейн', color: '#00BCD4', desc: 'Плавание 🏊', req: 'hunger>30' },
      { id: 'park', emoji: '🎢', name: 'Парк', color: '#2ECC71', desc: 'Аттракционы', req: 'energy>40' },
      { id: 'clinic', emoji: '🏥', name: 'Поликлиника', color: '#E74C3C', desc: 'Разные лечения', req: 'health<70' },
      { id: 'museums', emoji: '🏛️', name: 'Музеи', color: '#E91E63', desc: '4 музея 📜', cost: 0, req: 'energy>20' },
      { id: 'library', emoji: '📚', name: 'Библиотека', color: '#607D8B', desc: '100 книг 📖', cost: 10 },
      { id: 'cinema', emoji: '🎬', name: 'Кино', color: '#8E44AD', desc: 'Фильмы 🍿', cost: 20, req: 'energy>30' },
      { id: 'gym', emoji: '🏋️', name: 'Спортзал', color: '#16A085', desc: 'Тренировки 💪', cost: 15, req: 'energy>30' },
      { id: 'friend', emoji: '🧑‍🤝‍🧑', name: 'Друзья', color: '#FF5722', desc: 'В гости 🐹' },
      { id: 'minigames', emoji: '🎮', name: 'Мини-игры', color: '#9C27B0', desc: '3 игры' },
      { id: 'stats', emoji: '📊', name: 'Инфо', color: '#607D8B', desc: 'Достижения ⭐' }
    ];

    const cols = 4;
    const btnW = (W - 40) / cols;
    const btnH = 80;
    const startX = 20;
    const startY = H * 0.23;

    locations.forEach((loc, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * btnW;
      const by = startY + row * btnH;

      const available = System.isLocationAvailable(loc.id);
      const canAfford = !loc.cost || System.canAfford(loc.cost);

      ctx.globalAlpha = (available && canAfford) ? 1 : 0.4;

      // Button
      const btnColor = loc.color;
      ctx.fillStyle = btnColor;
      roundRect(ctx, bx, by, btnW - 4, btnH - 4, 12);
      ctx.fill();

      // Button border highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      roundRect(ctx, bx, by, btnW - 4, btnH - 4, 12);
      ctx.stroke();

      if (!available || !canAfford) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        roundRect(ctx, bx, by, btnW - 4, btnH - 4, 12);
        ctx.fill();
      }

      // Emoji — слева, отдельно от названия
      ctx.font = `${Math.min(btnW * 0.24, 22)}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(loc.emoji, bx + 10, by + 24);

      // Name — справа от эмодзи, чтобы не наезжали друг на друга
      ctx.font = `bold ${Math.min(btnW * 0.115, 11)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(loc.name, bx + 34, by + 24);

      // Desc — выравнен влево, чтобы не пересекаться с бейджем цены
      ctx.font = `${Math.min(btnW * 0.1, 10)}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(loc.desc, bx + 12, by + 44);
      ctx.textAlign = 'center';

      // Cost badge — в правом нижнем углу карточки, название не перекрывает
      if (loc.cost) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        roundRect(ctx, bx + btnW - 36, by + btnH - 24, 30, 16, 8);
        ctx.fill();
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#FFD93D';
        ctx.fillText('🪙' + loc.cost, bx + btnW - 21, by + btnH - 14);
      }

      ctx.globalAlpha = 1;

      this.locationButtons.push({ x: bx, y: by, w: btnW - 4, h: btnH - 4, loc });
    });

    // Close/map back button
    this.buttons = [];
    this.buttons.push(createButton(ctx, 20, H - 50, W - 40, 40, '← Вернуться', {
      bgColor: 'rgba(255,255,255,0.2)',
      fgColor: '#fff',
      fontSize: 16
    }));
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    // Check location buttons
    for (const btn of this.locationButtons) {
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        const loc = btn.loc;

        if (loc.id === 'home') {
          this.game.transitionTo('home');
        } else if (loc.id === 'shop') {
          this.game.transitionTo('shop');
        } else if (loc.id === 'minigames') {
          this.game.transitionTo('minigames');
        } else if (loc.id === 'stats') {
          this.game.transitionTo('stats');
        } else if (System.isLocationAvailable(loc.id)) {
          if (loc.cost && !System.canAfford(loc.cost)) {
            System.showAchievement('🪙', 'Не хватает монет!');
            AudioSys.play('fail');
            return true;
          }
          if (loc.cost) {
            System.spendCoins(loc.cost);
            AudioSys.play('coin');
          }
          System.visitedLocations.add(loc.id);
          System.addXP(10);
          System.advanceTime(1);

          // Check for random event
          const event = System.getRandomEvent();
          if (event) {
            System.showAchievement(event.emoji, event.text);
          }

          // Клиника и друзья — отдельные сцены, остальное — сцена посещения
          if (loc.id === 'clinic') {
            this.game.transitionTo('clinic');
          } else if (loc.id === 'friend') {
            this.game.transitionTo('friends');
          } else if (typeof VISIT_DATA !== 'undefined' && VISIT_DATA[loc.id]) {
            this.game.transitionTo('visit', loc.id);
          } else {
            System.showAchievement(loc.emoji, loc.name);
            this.game.transitionTo('home');
          }
          System.saveGame();
          return true;
        } else {
          System.showAchievement('🔒', 'Нужна энергия или другое условие!');
          AudioSys.play('fail');
        }
        return true;
      }
    }

    // Back button
    if (this.buttons && this.buttons.length > 0) {
      const btn = this.buttons[0];
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        this.game.transitionTo('menu');
        return true;
      }
    }

    return false;
  }
}
window.MapScene = MapScene;
