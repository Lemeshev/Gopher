// ============ СПИСОК ЛОКАЦИЙ ============
const MAP_LOCATIONS = [
  { id: 'home', emoji: '🏠', name: 'Дом', color: '#FF6B6B', desc: 'Еда, сон, игры' },
  { id: 'shop', emoji: '🛒', name: 'Магазин', color: '#F39C12', desc: 'Покупки' },
  { id: 'work', emoji: '🏢', name: 'Работа', color: '#4D96FF', desc: 'Задания', req: 'energy>40' },
  { id: 'school', emoji: '🎓', name: 'Учёба', color: '#9B59B6', desc: 'Знания', req: 'energy>40' },
  { id: 'restaurant', emoji: '🍽️', name: 'Ресторан', color: '#FF8C42', desc: 'Блюда', cost: 30, req: 'energy>30' },
  { id: 'pool', emoji: '🏊', name: 'Бассейн', color: '#00BCD4', desc: 'Плавание', req: 'hunger>30' },
  { id: 'park', emoji: '🎢', name: 'Парк', color: '#2ECC71', desc: 'Аттракционы', req: 'energy>40' },
  { id: 'clinic', emoji: '🏥', name: 'Поликлиника', color: '#E74C3C', desc: 'Лечение', req: 'health<70' },
  { id: 'museums', emoji: '🏛️', name: 'Музеи', color: '#E91E63', desc: '4 музея', cost: 0, req: 'energy>20' },
  { id: 'library', emoji: '📚', name: 'Библиотека', color: '#607D8B', desc: '100 книг', cost: 10 },
  { id: 'cinema', emoji: '🎬', name: 'Кино', color: '#8E44AD', desc: 'Фильмы', cost: 20, req: 'energy>30' },
  { id: 'gym', emoji: '🏋️', name: 'Спортзал', color: '#16A085', desc: 'Сила и ловкость', cost: 15, req: 'energy>30' },
  { id: 'friend', emoji: '👥', name: 'Друзья', color: '#FF5722', desc: 'В гости' },
  { id: 'minigames', emoji: '🎮', name: 'Мини-игры', color: '#9C27B0', desc: 'Игры и тихие занятия' },
  { id: 'stats', emoji: '📊', name: 'Инфо', color: '#546E7A', desc: 'Достижения' }
];

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
    if (System.isSleeping) {
      // Пока гофер спит, походов нет — говорим это на самой карте, а не после
      // нажатия: иначе ребёнок тыкает плитки и получает отказ. «Что открыто»
      // написано под плитками локаций: вторую строку шапки занимает полоса опыта.
      const msg = '💤 {Pet} спит — походы закрыты';
      const size = fitFontSize(ctx, msg, W - 150, Math.min(W * 0.045, 18), 9.5, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.fillStyle = '#FFD93D';
      ctx.fillText(msg, 20, 35);
    } else {
      ctx.fillText('📍 Куда пойдём?', 20, 35);
    }

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
      // Если гофер спит дома — на карте он тоже спит
      this.game.gopher.setExpression(System.isSleeping ? 'sleeping' : 'happy', 20);
      this.game.gopher.draw(ctx, W * 0.5, H * 0.17, Math.min(W * 0.25, 100) / this.game.gopher.size);
    }

    const locations = MAP_LOCATIONS;

    const cols = 4;
    const btnW = (W - 40) / cols;
    const btnH = Math.max(74, Math.min(H * 0.125, 92));
    const startX = 20;
    const rowsCount = Math.ceil(locations.length / cols);
    const gridH = rowsCount * btnH;
    const gridTop = H * 0.22;
    // Центрируем плитки между шапкой и кнопкой «Вернуться»
    const startY = gridTop + Math.max(0, ((H - 70) - gridTop - gridH) / 2);

    locations.forEach((loc, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * btnW;
      const by = startY + row * btnH;
      const tileW = btnW - 4;
      const tileH = btnH - 6;
      const cx = bx + tileW / 2;

      const available = System.isLocationAvailable(loc.id);
      const canAfford = !loc.cost || System.canAfford(loc.cost);
      const active = available && canAfford;

      ctx.globalAlpha = active ? 1 : 0.45;
      ctx.fillStyle = loc.color;
      roundRect(ctx, bx, by, tileW, tileH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      roundRect(ctx, bx, by, tileW, tileH, 12);
      ctx.stroke();
      if (!active) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        roundRect(ctx, bx, by, tileW, tileH, 12);
        ctx.fill();
      }

      // Эмодзи сверху по центру
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(tileW * 0.34, 24)}px Arial`;
      ctx.fillText(loc.emoji, cx, by + tileH * 0.30);

      // Название: подбираем размер и при необходимости переносим на две строки
      const nameSize = fitFontSize(ctx, loc.name, tileW - 8, Math.min(tileW * 0.16, 12), 7.5, true);
      ctx.font = `bold ${nameSize}px Arial`;
      const lines = wrapLines(ctx, loc.name, tileW - 8, 2);
      const lineH = nameSize + 1;
      const firstY = by + tileH * (lines.length > 1 ? 0.55 : 0.62);
      lines.forEach((line, li) => ctx.fillText(line, cx, firstY + li * lineH));

      // Подпись мелким шрифтом (подгоняем размер: длинная подпись не должна
      // вылезать за плитку — так уже было с «Зал и воздушная гимнастика»)
      const descSize = fitFontSize(ctx, loc.desc, tileW - 8, Math.min(tileW * 0.115, 8.5), 6.5, false);
      ctx.font = `${descSize}px Arial`;
      ctx.globalAlpha = active ? 0.85 : 0.45;
      ctx.fillText(loc.desc, cx, by + tileH - 9);
      ctx.globalAlpha = active ? 1 : 0.45;

      // Цена — маленький бейдж в правом верхнем углу
      if (loc.cost) {
        const bw2 = 30, bh2 = 15;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        roundRect(ctx, bx + tileW - bw2 - 3, by + 3, bw2, bh2, 7);
        ctx.fill();
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#FFD93D';
        ctx.fillText('🪙' + loc.cost, bx + tileW - bw2 / 2 - 3, by + 3 + bh2 / 2 + 0.5);
      }

      // Сколько энергии стоит поход — видно ДО нажатия (не сюрприз)
      const ev = System.visitCost ? System.visitCost(loc.id) : 0;
      if (active && ev > 0) {
        const ew = 26, eh = 15;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        roundRect(ctx, bx + 3, by + 3, ew, eh, 7);
        ctx.fill();
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#9BE3A5';
        ctx.fillText('⚡' + ev, bx + 3 + ew / 2, by + 3 + eh / 2 + 0.5);
      }

      // Замок, если сейчас нельзя. Спящий питомец — это 💤, а не замок:
      // ребёнок сразу видит причину.
      if (!active) {
        ctx.font = '13px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const glyph = System.sleepBlocks(loc.id) ? '💤' : (canAfford ? '🔒' : '🪙');
        ctx.fillText(glyph, bx + 13, by + 13);
      }

      ctx.globalAlpha = 1;
      ctx.textBaseline = 'alphabetic';
      this.locationButtons.push({ x: bx, y: by, w: tileW, h: tileH, loc });
    });

    // Пока гофер спит — под плитками объясняем, что сейчас открыто: в шапке
    // это место занято полосой опыта, а отказ без объяснения — плохой отказ.
    if (System.isSleeping) {
      const hint = 'Открыто: ' + System.sleepAllowedHint();
      const hs = fitFontSize(ctx, hint, W - 40, Math.min(W * 0.030, 12.5), 8, false);
      ctx.font = `${hs}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const hw = ctx.measureText(hint).width + 22;
      ctx.fillStyle = 'rgba(20,20,60,0.7)';
      roundRect(ctx, (W - hw) / 2, H - 76, hw, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#9be3b0';
      ctx.fillText(hint, W / 2, H - 76 + 11);
      ctx.textBaseline = 'alphabetic';
    }

    // Close/map back button
    this.buttons = [];
    this.buttons.push(createButton(ctx, 20, H - 50, W - 40, 40, '← Вернуться', {
      bgColor: 'rgba(255,255,255,0.2)',
      fgColor: '#fff',
      fontSize: 16
    }));
  }

  // Переход в локацию (используется картой и кнопками в доме)
  enterLocation(locId) {
    const loc = MAP_LOCATIONS.find(l => l.id === locId);
    if (!loc) return false;

    if (loc.id === 'home') { this.game.transitionTo('home'); return true; }
    if (loc.id === 'shop') { this.game.transitionTo('shop'); return true; }
    if (loc.id === 'minigames') { this.game.transitionTo('minigames'); return true; }
    if (loc.id === 'stats') { this.game.transitionTo('stats'); return true; }

    if (!System.isLocationAvailable(loc.id)) {
      // Говорим причину по-человечески: «устал — поспи», «голодный — покорми»
      const why = (System.locationLockReason && System.locationLockReason(loc.id)) || 'Сейчас сюда нельзя';
      System.showAchievement('🔒', why);
      AudioSys.play('fail');
      return true;
    }
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
    System.countAction('trips');
    System.addXP(10);
    // Энергия за поход: 2–8 (см. System.VISIT_ENERGY). Время идёт мягко.
    System.spendEnergy(System.visitCost(loc.id));
    System.advanceTime(0.5);

    const event = System.getRandomEvent();
    if (event) System.showAchievement(event.emoji, event.text);

    if (loc.id === 'clinic') this.game.transitionTo('clinic');
    else if (loc.id === 'friend') this.game.transitionTo('friends');
    else if (typeof VISIT_DATA !== 'undefined' && VISIT_DATA[loc.id]) this.game.transitionTo('visit', loc.id);
    else { System.showAchievement(loc.emoji, loc.name); this.game.transitionTo('home'); }

    System.saveGame();
    return true;
  }

  handleClick(mx, my) {
    // Кнопки локаций
    for (const btn of this.locationButtons) {
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        AudioSys.play('click');
        return this.enterLocation(btn.loc.id);
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
window.MAP_LOCATIONS = MAP_LOCATIONS;
