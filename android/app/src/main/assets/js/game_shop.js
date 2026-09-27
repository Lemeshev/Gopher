// ============ СЦЕНА МАГАЗИНА ============
class ShopScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.shakeItems = [];
    this.cartItems = [];
    this.notification = null;
    this.notificationTimer = 0;
  }

  init() {
    this.time = 0;
    this.shakeItems = [];
    this.notification = null;
    this.notificationTimer = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.notificationTimer > 0) {
      this.notificationTimer -= dt;
      if (this.notificationTimer <= 0) this.notification = null;
    }
    // Animated items
    if (Math.random() < 0.05) {
      this.shakeItems.push({
        x: Math.random() * this.game.width,
        y: Math.random() * this.game.height,
        vy: -randFloat(0.5, 1),
        alpha: 0.3,
        size: randFloat(3, 8)
      });
    }
    this.shakeItems.forEach(s => { s.y += s.vy; s.alpha -= 0.005; });
    this.shakeItems = this.shakeItems.filter(s => s.alpha > 0);
  }

  showNotification(emoji, text) {
    this.notification = { emoji, text, timer: 2000 };
    this.notificationTimer = 2000;
  }

  draw(ctx) {
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#FFECD2');
    grad.addColorStop(1, '#FCB69F');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Floating particles
    this.shakeItems.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#FF8C42';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Header
    ctx.fillStyle = '#fff';
    roundRect(ctx, 10, 10, W - 20, 55, 12);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = `bold ${Math.min(W * 0.05, 24)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🛒 Магазин', W / 2, 35);

    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.035, 16)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText('🪙 ' + System.coins, W - 30, 35);

    // Shop tabs
    const tabs = [
      { id: 'food', emoji: '🍕', name: 'Еда' },
      { id: 'toys', emoji: '🧸', name: 'Игрушки' },
      { id: 'clothes', emoji: '👔', name: 'Одежда' },
      { id: 'fun', emoji: '🎉', name: 'Веселье' }
    ];

    const tabW = (W - 40) / 4;
    const tabH = 40;
    const tabStartY = 75;

    tabs.forEach((t, i) => {
      const tx = 20 + i * tabW;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      roundRect(ctx, tx + 2, tabStartY + 2, tabW - 4, tabH - 4, 10);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(t.emoji + ' ' + t.name, tx + tabW / 2, tabStartY + 25);
    });

    // Items grid
    const items = [
      // Food
      { id: 'pizza', emoji: '🍕', name: 'Пицца', desc: '+30 сытости', cost: 15, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 30); } },
      { id: 'burger', emoji: '🍔', name: 'Бургер', desc: '+25 сытости', cost: 10, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 25); System.stats.happiness = Math.min(100, System.stats.happiness + 5); } },
      { id: 'cake', emoji: '🍰', name: 'Торт', desc: '+20 сытости, +15 счастья', cost: 25, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 20); System.stats.happiness = Math.min(100, System.stats.happiness + 15); } },
      { id: 'icecream', emoji: '🍦', name: 'Мороженое', desc: '+10 сытости, +10 счастья', cost: 8, category: 'food', effect: () => { System.stats.hunger = Math.min(100, System.stats.hunger + 10); System.stats.happiness = Math.min(100, System.stats.happiness + 10); } },

      // Toys
      { id: 'ball', emoji: '⚽', name: 'Мяч', desc: '+15 счастья, +5 XP', cost: 20, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 15); System.addXP(5); } },
      { id: 'puzzle', emoji: '🧩', name: 'Пазл', desc: '+10 счастья, +5 интеллекта', cost: 15, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 10); System.stats.intelligence = Math.min(100, System.stats.intelligence + 5); } },
      { id: 'robot', emoji: '🤖', name: 'Робот', desc: '+20 счастья, +10 XP', cost: 50, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 20); System.addXP(10); } },
      { id: 'doll', emoji: '🧸', name: 'Мишка', desc: '+15 счастья, успокаивает', cost: 25, category: 'toys', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 15); System.stats.stress = Math.max(0, System.stats.stress - 10); } },

      // Clothes
      { id: 'hat_cook', emoji: '👨‍🍳', name: 'Шеф-шапка', desc: 'Визуальный аксессуар', cost: 40, category: 'clothes', effect: () => { this.game.gopher.hat = 'chef'; } },
      { id: 'hat_sci', emoji: '🧑‍🔬', name: 'Очки учёного', desc: 'Визуальный аксессуар', cost: 35, category: 'clothes', effect: () => { this.game.gopher.glasses = 'nerd'; } },
      { id: 'bowtie', emoji: '🎀', name: 'Бабочка', desc: 'Визуальный аксессуар', cost: 30, category: 'clothes', effect: () => { this.game.gopher.bowtie = true; } },
      { id: 'cool_shades', emoji: '😎', name: 'Крутые очки', desc: 'Визуальный аксессуар', cost: 45, category: 'clothes', effect: () => { this.game.gopher.glasses = 'cool'; } },
      { id: 'crown', emoji: '👑', name: 'Корона', desc: '+20 счастья!', cost: 100, category: 'clothes', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 20); } },

      // Fun
      { id: 'party', emoji: '🎉', name: 'Вечеринка', desc: '+30 счастья!', cost: 60, category: 'fun', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 30); this.game.gopher.setExpression('excited', 999); } },
      { id: 'fireworks', emoji: '🎆', name: 'Фейерверк', desc: '+25 счастья, +15 XP', cost: 80, category: 'fun', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 25); System.addXP(15); } },
      { id: 'movie', emoji: '🎬', name: 'Кино', desc: '+20 счастья', cost: 20, category: 'fun', effect: () => { System.stats.happiness = Math.min(100, System.stats.happiness + 20); System.stats.energy = Math.max(0, System.stats.energy - 10); } },
      { id: 'pet_treatment', emoji: '💎', name: 'Лечение', desc: '+25 здоровья', cost: 50, category: 'fun', effect: () => { System.stats.health = Math.min(100, System.stats.health + 25); if (System.stats.health > 50) System.isSick = false; } }
    ];

    const cols = 2;
    const itemW = (W - 40) / cols;
    const itemH = 110;
    const startX = 20;
    const startY = 130;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ix = startX + col * itemW;
      const iy = startY + row * itemH;
      const canAfford = System.canAfford(item.cost);

      // Item card
      ctx.fillStyle = canAfford ? 'rgba(255,255,255,0.9)' : 'rgba(200,200,200,0.7)';
      roundRect(ctx, ix, iy, itemW - 4, itemH - 4, 15);
      ctx.fill();

      if (!canAfford) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        roundRect(ctx, ix, iy, itemW - 4, itemH - 4, 15);
        ctx.fill();
      }

      // Emoji
      ctx.font = `${Math.min(itemW * 0.35, 36)}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#333';
      ctx.fillText(item.emoji, ix + 10, iy + 35);

      // Name
      ctx.font = `bold ${Math.min(itemW * 0.14, 14)}px Arial`;
      ctx.fillStyle = '#333';
      ctx.fillText(item.name, ix + 50, iy + 30);

      // Desc
      ctx.font = `${Math.min(itemW * 0.1, 11)}px Arial`;
      ctx.fillStyle = '#666';
      ctx.fillText(item.desc, ix + 50, iy + 48);

      // Cost
      ctx.fillStyle = canAfford ? '#4CAF50' : '#999';
      ctx.font = `bold ${Math.min(itemW * 0.12, 13)}px Arial`;
      ctx.textAlign = 'right';
      ctx.fillText('🪙 ' + item.cost, ix + itemW - 15, iy + itemH - 20);

      this.buttons.push({ ...item, x: ix, y: iy, w: itemW - 4, h: itemH - 4 });
    });

    // Back button
    this.buttons.push(createButton(ctx, 10, H - 50, 100, 40, '← Назад', {
      bgColor: 'rgba(0,0,0,0.2)',
      fgColor: '#fff',
      fontSize: 14,
      radius: 10
    }));

    // Notification
    if (this.notification) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, W * 0.1, H * 0.5, W * 0.8, 60, 15);
      ctx.fill();
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(this.notification.emoji + ' ' + this.notification.text, W / 2, H * 0.5 + 30);
    }
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    // Check item buttons
    for (const btn of this.buttons.slice(0, -1)) {
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        if (System.canAfford(btn.cost)) {
          System.spendCoins(btn.cost);
          btn.effect();
          this.showNotification(btn.emoji, 'Куплено: ' + btn.name + '!');
          System.addXP(5);
          System.saveGame();
          AudioSys.play('success');
          if (btn.cost >= 30) {
            // Visual effect
            this.game.gopher.setExpression('excited', 60);
          }
        } else {
          this.showNotification('🪙', 'Не хватает монет!');
          AudioSys.play('fail');
        }
        return true;
      }
    }

    // Back button
    if (this.buttons.length > 0) {
      const backBtn = this.buttons[this.buttons.length - 1];
      if (isPointInRect(mx, my, backBtn.x, backBtn.y, backBtn.w, backBtn.h)) {
        this.game.transitionTo('map');
        return true;
      }
    }

    return false;
  }
}
window.ShopScene = ShopScene;
