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
    this.buttons = [];

    this.tutorialPages = [
      '🐹 Добро пожаловать в Gopher Life!\nЭто ваш виртуальный питомец.',
      '❤️ Следите за статами гофера:\nсчастье, сытость, энергия, здоровье.',
      '🏠 Посещайте разные места:\nдом, магазин, парк, работу.',
      '🛒 Покупайте еду и игрушки,\nчтобы повысить статы.',
      '🎮 Играйте в мини-игры,\nчтобы заработать монеты!'
    ];

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

    // Единая система ввода: touch + mouse -> координаты канваса
    const onPointer = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const mx = (clientX - rect.left) / rect.width * this.width;
      const my = (clientY - rect.top) / rect.height * this.height;
      this.handleClick(mx, my);
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t) onPointer(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onPointer(e.clientX, e.clientY);
    });

    // Аудио инициализируется по первому касанию пользователя
    this.canvas.addEventListener('touchstart', () => AudioSys.init(), { once: true });
    this.canvas.addEventListener('mousedown', () => AudioSys.init(), { once: true });

    // Создаём сцены
    for (const [name, cls] of Object.entries(this.sceneClasses)) {
      this.scenes[name] = new cls(this);
    }

    this.currentScene = 'menu';
    this.scenes.menu.init();
    this.gopher.setExpression('excited', 999999);

    this.lastTime = performance.now();
    this.loop();

    setInterval(() => System.saveGame(), 30000);
    setInterval(() => { System.totalPlayTime++; }, 60000);

    document.addEventListener('click', () => this.tryFullscreen(), { once: true });
    document.addEventListener('touchstart', () => this.tryFullscreen(), { once: true });
  }

  tryFullscreen() {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        const p = el.requestFullscreen();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {}
  }

  resize() {
    const w = window.innerWidth || 360;
    const h = window.innerHeight || 640;
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  transitionTo(sceneName) {
    if (this.scenes[sceneName]) {
      this.scenes[sceneName].init();
      this.currentScene = sceneName;
    }
  }

  showTutorial() {
    this.tutorialVisible = !this.tutorialVisible;
    if (this.tutorialVisible) this.tutorialPage = 0;
  }

  handleClick(mx, my) {
    if (this.tutorialVisible) return this.handleTutorialClick(mx, my);
    const scene = this.scenes[this.currentScene];
    if (scene && scene.handleClick) {
      return scene.handleClick(mx, my);
    }
    return false;
  }

  handleTutorialClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      AudioSys.play('click');
      if (btn.action === 'tutorial-next') {
        if (this.tutorialPage >= this.tutorialPages.length - 1) {
          this.tutorialVisible = false;
        } else {
          this.tutorialPage++;
        }
      } else if (btn.action === 'tutorial-prev') {
        this.tutorialPage = Math.max(0, this.tutorialPage - 1);
      }
      return true;
    }
    return false;
  }

  loop() {
    const now = performance.now();
    this.dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    const scene = this.scenes[this.currentScene];
    try {
      scene.update(this.dt);
      this.ctx.clearRect(0, 0, this.width, this.height);
      scene.draw(this.ctx);
      if (this.tutorialVisible) this.drawTutorial();
    } catch (err) {
      // Один сбойный кадр не должен останавливать игру
      if (typeof console !== 'undefined') console.error('frame error:', err);
    }

    requestAnimationFrame(() => this.loop());
  }

  drawTutorial() {
    const W = this.width;
    const H = this.height;
    const pages = this.tutorialPages;
    this.buttons = [];

    // Затемнение
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    roundRect(this.ctx, 0, 0, W, H, 0);
    this.ctx.fill();

    // Карточка
    this.ctx.fillStyle = '#16213e';
    roundRect(this.ctx, W * 0.05, H * 0.15, W * 0.9, H * 0.7, 20);
    this.ctx.fill();
    this.ctx.strokeStyle = '#FFD93D';
    this.ctx.lineWidth = 2;
    roundRect(this.ctx, W * 0.05, H * 0.15, W * 0.9, H * 0.7, 20);
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = `bold ${Math.min(W * 0.05, 24)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('📖 Как играть', W / 2, H * 0.24);

    // Текст страницы (с переносами по \n)
    this.ctx.font = `${Math.min(W * 0.038, 17)}px Arial`;
    this.ctx.fillStyle = '#E4E4F0';
    const lines = pages[this.tutorialPage].split('\n');
    const lineH = Math.min(H * 0.045, 28);
    lines.forEach((line, i) => {
      this.ctx.fillText(line, W / 2, H * 0.38 + i * lineH);
    });

    // Точки-индикаторы
    const dotsY = H * 0.70;
    const dotsW = (pages.length - 1) * 18;
    for (let i = 0; i < pages.length; i++) {
      this.ctx.fillStyle = i === this.tutorialPage ? '#FFD93D' : 'rgba(255,255,255,0.3)';
      this.ctx.beginPath();
      this.ctx.arc(W / 2 - dotsW / 2 + i * 18, dotsY, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Кнопки
    const btnW = Math.min(W * 0.32, 150);
    const btnH = 46;
    const btnY = H * 0.78;
    const isLast = this.tutorialPage >= pages.length - 1;

    if (this.tutorialPage > 0) {
      const prevX = W / 2 - btnW - 8;
      createButton(this.ctx, prevX, btnY, btnW, btnH, '← Назад', {
        bgColor: 'rgba(255,255,255,0.25)', fgColor: '#fff', fontSize: 15
      });
      this.buttons.push({ x: prevX, y: btnY, w: btnW, h: btnH, action: 'tutorial-prev' });
    }

    const nextX = this.tutorialPage > 0 ? W / 2 + 8 : W / 2 - btnW / 2;
    createButton(this.ctx, nextX, btnY, btnW, btnH, isLast ? 'Закрыть' : 'Далее →', {
      bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15
    });
    this.buttons.push({ x: nextX, y: btnY, w: btnW, h: btnH, action: 'tutorial-next' });
  }
}
window.Game = Game;
