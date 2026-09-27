// ============ ГЛАВНЫЙ ФАЙЛ ИГРЫ ============
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.currentScene = 'menu';
    this.scenes = {};
    this.lastTime = 0;
    this.dt = 0;
    this.gopher = new Gopher(null, 100);
    this.isFullscreen = false;
    this.tutorialVisible = false;
    this.tutorialPage = 0;

    // Scenes map
    this.sceneClasses = {
      menu: MenuScene,
      map: MapScene,
      home: HomeScene,
      shop: ShopScene,
      minigames: MinigamesScene,
      stats: StatsScene,
      clinic: ClinicScene
    };
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const mx = (touch.clientX - rect.left) * (this.width / rect.width);
      const my = (touch.clientY - rect.top) * (this.height / rect.height);
      this.handleClick(mx, my);
    }, { passive: false });

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.width / rect.width);
      const my = (e.clientY - rect.top) * (this.height / rect.height);
      this.handleClick(mx, my);
    });

    // Init audio on first touch
    let audioInit = false;
    const initAudio = () => {
      if (!audioInit) {
        AudioSys.init();
        audioInit = true;
      }
    };
    this.canvas.addEventListener('touchstart', initAudio, { once: false });
    this.canvas.addEventListener('mousedown', initAudio, { once: false });

    // Create scenes
    for (const [name, cls] of Object.entries(this.sceneClasses)) {
      this.scenes[name] = new cls(this);
    }

    this.currentScene = 'menu';
    this.scenes.menu.init();
    this.gopher.setExpression('excited', 9999);

    // Start loop
    this.lastTime = performance.now();
    this.loop();

    // Auto-save every 30 seconds
    setInterval(() => System.saveGame(), 30000);
    // Play time counter
    setInterval(() => { System.totalPlayTime++; }, 60000);

    // Fullscreen
    this.tryFullscreen();
    document.addEventListener('click', () => this.tryFullscreen(), { once: true });
    document.addEventListener('touchstart', () => this.tryFullscreen(), { once: true });
  }

  tryFullscreen() {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } catch(e) {}
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  transitionTo(sceneName) {
    this.currentScene = sceneName;
    if (this.scenes[sceneName]) {
      this.scenes[sceneName].init();
    }
  }

  showTutorial() {
    this.tutorialVisible = !this.tutorialVisible;
    this.tutorialPage = 0;
  }

  handleClick(mx, my) {
    AudioSys.resume();
    if (this.tutorialVisible) {
      this.handleTutorialClick(mx, my);
      return;
    }
    const scene = this.scenes[this.currentScene];
    if (scene && scene.handleClick) {
      scene.handleClick(mx, my);
    }
  }

  handleTutorialClick(mx, my) {
    const W = this.width;
    const H = this.height;
    const pages = [
      { title: '🐹 Добро пожаловать!', text: 'Это Gopher Life — ваш виртуальный питомец!\n\nУхаживайте за гофером, кормите, купайте, играйте с ним!' },
      { title: '📍 Локации', text: 'Исследуйте мир! Водите гофера в:\n• Бассейн 🏊\n• Поликлинику 🏥\n• Музеи 🎨🦕🚀🏛️\n• Магазин 🛒\n• Ресторан 🍽️\n• Работу 💼 и учёбу 🎓' },
      { title: '📊 Характеристики', text: 'Следите за статами:\n❤️ Счастье 🍗 Сытость 😴 Энергия\n🏥 Здоровье 🧹 Чистота\n\nВсе статы падают со временем!' },
      { title: '🎮 Мини-игры', text: 'Играйте в:\n❌⭕ Крестики-нолики\n🧠 Memory\n🪙 Бросай монету\n\nЗа победы получаете монеты и XP!' },
      { title: '💡 Советы', text: '💡 Сохранение автоматическое\n💡 Статы падают даже когда не играете\n💡 Посещайте разные места\n💡 Копите монеты для покупок\n💡 Лечите гофера вовремя!\n\nПриятной игры! 🎉' }
    ];

    const page = pages[this.tutorialPage] || pages[pages.length - 1];

    // Draw tutorial overlay
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, 0, W, H);

    this.ctx.fillStyle = '#fff';
    roundRect(this.ctx, W * 0.05, H * 0.1, W * 0.9, H * 0.8, 20);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFD93D';
    this.ctx.font = `bold ${Math.min(W * 0.05, 24)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(page.title, W / 2, H * 0.18);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = `${Math.min(W * 0.035, 16)}px Arial`;
    const lines = page.text.split('\n');
    lines.forEach((line, i) => {
      this.ctx.fillText(line, W / 2, H * 0.28 + i * 28);
    });

    // Page dots
    const dotY = H * 0.88;
    const dotSpacing = 30;
    const startX = W / 2 - (pages.length - 1) * dotSpacing / 2;
    pages.forEach((_, i) => {
      this.ctx.fillStyle = i === this.tutorialPage ? '#FFD93D' : 'rgba(255,255,255,0.3)';
      this.ctx.beginPath();
      this.ctx.arc(startX + i * dotSpacing, dotY, 6, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Next/Prev buttons
    const btnW = 100;
    const btnH = 40;
    if (this.tutorialPage > 0) {
      createButton(this.ctx, W * 0.15, H * 0.8, btnW, btnH, '◀ Назад', { bgColor: 'rgba(255,255,255,0.3)', fgColor: '#fff', fontSize: 14 });
    }
    if (this.tutorialPage < pages.length - 1) {
      createButton(this.ctx, W * 0.55, H * 0.8, btnW, btnH, 'Далее ▶', { bgColor: '#4D96FF', fgColor: '#fff', fontSize: 14 });
    } else {
      createButton(this.ctx, W * 0.4, H * 0.8, btnW * 1.6, btnH, '🎉 Понятно!', { bgColor: '#6BCB77', fgColor: '#fff', fontSize: 16 });
    }

    // Handle click
    if (this.tutorialPage < pages.length - 1) {
      if (isPointInRect(mx, my, W * 0.55, H * 0.8, btnW, btnH)) {
        AudioSys.play('click');
        this.tutorialPage++;
      } else if (this.tutorialPage > 0 && isPointInRect(mx, my, W * 0.15, H * 0.8, btnW, btnH)) {
        AudioSys.play('click');
        this.tutorialPage--;
      }
    } else {
      if (isPointInRect(mx, my, W * 0.4, H * 0.8, btnW * 1.6, btnH)) {
        AudioSys.play('click');
        this.tutorialVisible = false;
      }
    }
  }

  drawAchievementPopup() {
    const W = this.width;
    const H = this.height;

    // Check for achievement popup
    const popup = document.getElementById('achievement-popup');
    if (popup && popup.style.display === 'flex') {
      // Draw custom overlay for achievement
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(0, 0, W, H);

      this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
      roundRect(this.ctx, W * 0.15, H * 0.35, W * 0.7, 100, 20);
      this.ctx.fill();

      this.ctx.font = '40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const emoji = popup.querySelector('.ach-emoji');
      const text = popup.querySelector('.ach-text');
      if (emoji) this.ctx.fillText(emoji.textContent, W / 2, H * 0.35 + 35);
      if (text) {
        this.ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(text.textContent, W / 2, H * 0.35 + 75);
      }
    }
  }

  loop() {
    const now = performance.now();
    this.dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    const scene = this.scenes[this.currentScene];
    if (scene) {
      scene.update(this.dt);
    }

    // Draw
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (scene) {
      scene.draw(this.ctx);
    }
    this.drawAchievementPopup();

    requestAnimationFrame(() => this.loop());
  }
}

// ============ INIT ============
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  game.init();
});
// Also init immediately if DOM already loaded
if (document.readyState !== 'loading') {
  game = new Game();
  game.init();
}
