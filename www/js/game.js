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
    this.gopher = (typeof createCharacter === 'function') ? createCharacter('gopher', 100) : new Gopher(null, 100);
    this.isFullscreen = false;
    this.tutorialVisible = false;
    this.tutorialPage = 0;
    this.buttons = [];
    this.dragging = false;
    this.dragScene = null;

    this.tutorialPages = [
      '🐹 Добро пожаловать в Gopher Life!\nЭто твой питомец: корми его, купай и играй.',
      '⚡ Энергия тратится понемногу (поход — 2–8),\nа сон возвращает +10% каждую минуту.',
      '😴 Уложи спать и закрой игру: энергия будет\nкопиться даже без тебя — через 10 минут он бодр!',
      '🤫 Пока питомец спит, играй в тихие игры:\nсозвездие, раскраска и рыбалка. Энергия не тратится.',
      '🏠 Дома четыре комнаты: гостиная, спальня, кухня,\nванная. В каждой — своя мебель и свои действия.',
      '🛋️ Мебель покупается в магазине, ставится и\nпереставляется. Цвет можно менять за монетки.',
      '😰 Стресс — чем меньше, тем лучше. Снижают: сон,\nмузыка, купание, тихие игры и поликлиника.',
      '🗺️ На карте — музеи, парк, бассейн, кино, спортзал\n(там воздушная гимнастика), работа и учёба.',
      '🧑‍🤝‍🧑 Друзья: короткий код из 16 знаков можно\nпродиктовать, полный — скопировать кнопкой.'
    ];

    this.sceneClasses = {
      menu: MenuScene,
      map: MapScene,
      home: HomeScene,
      shop: ShopScene,
      minigames: MinigamesScene,
      stats: StatsScene,
      clinic: ClinicScene,
      visit: VisitScene,
      friends: FriendsScene,
      quiet: QuietScene,        // тихие игры: чем заняться, пока гофер спит
      aerial: AerialScene       // воздушная гимнастика в спортзале
    };
  }

  // Персонаж мог измениться (профиль, выбор игрушки) — пересоздаём фигурку
  ensureCharacter() {
    const want = (System.look && System.look.char) || 'gopher';
    if (!this.gopher || this.gopher.charId !== want) {
      this.gopher = System.makeCharacter(100);
      System.applyLookTo(this.gopher);
    }
    return this.gopher;
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Единая система ввода: touch + mouse -> координаты канваса
    const toCanvas = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: (clientX - rect.left) / rect.width * this.width,
        y: (clientY - rect.top) / rect.height * this.height
      };
    };

    const onDown = (clientX, clientY) => {
      const pt = toCanvas(clientX, clientY);
      if (!pt) return;
      const scene = this.scenes[this.currentScene];
      // Сначала даём сцене возможность начать перетаскивание (мебель в доме)
      if (scene && scene.beginDrag && scene.beginDrag(pt.x, pt.y)) {
        this.dragging = true;
        this.dragScene = scene;
        return;
      }
      this.dragging = false;
      this.dragScene = null;
      this.handleClick(pt.x, pt.y);
    };

    const onMove = (clientX, clientY) => {
      if (!this.dragging) return;
      const pt = toCanvas(clientX, clientY);
      if (!pt) return;
      if (this.dragScene && this.dragScene.dragMove) this.dragScene.dragMove(pt.x, pt.y);
    };

    const onUp = (clientX, clientY) => {
      if (!this.dragging) return;
      const pt = toCanvas(clientX, clientY) || { x: 0, y: 0 };
      if (this.dragScene && this.dragScene.endDrag) this.dragScene.endDrag(pt.x, pt.y);
      this.dragging = false;
      this.dragScene = null;
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t) onDown(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      if (this.dragging) e.preventDefault();
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      if (t) onUp(t.clientX, t.clientY);
    });

    this.canvas.addEventListener('touchcancel', () => {
      if (this.dragging && this.dragScene && this.dragScene.endDrag) this.dragScene.endDrag(0, 0);
      this.dragging = false;
      this.dragScene = null;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onDown(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => onUp(e.clientX, e.clientY));

    // Аудио инициализируется по первому касанию пользователя
    this.canvas.addEventListener('touchstart', () => AudioSys.init(), { once: true });
    this.canvas.addEventListener('mousedown', () => AudioSys.init(), { once: true });

    // Создаём сцены
    for (const [name, cls] of Object.entries(this.sceneClasses)) {
      this.scenes[name] = new cls(this);
    }

    this.currentScene = 'menu';
    this.scenes.menu.init();
    this.ensureCharacter();
    System.applyLookTo(this.gopher);
    this.gopher.setExpression('excited', 999999);

    // Панель кода друга: настоящие поля ввода (копирование/вставка в WebView)
    if (typeof ClipBridge !== 'undefined' && ClipBridge.attach) {
      ClipBridge.attach((name, code) => {
        const fr = this.scenes.friends;
        if (fr && fr.handlePanelSubmit) fr.handlePanelSubmit(name, code);
      }, () => {
        const fr = this.scenes.friends;
        if (fr && fr.onPanelClosed) fr.onPanelClosed();
      });
    }

    // Приложение сворачивают/закрывают — сохраняем время, чтобы офлайн-прогресс
    // (в том числе сон) считался правильно при следующем запуске.
    const saveNow = () => { try { System.saveGame(); } catch (e) {} };
    window.addEventListener('pagehide', saveNow);
    window.addEventListener('blur', saveNow);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveNow();
    });

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

  transitionTo(sceneName, initArgs) {
    if (this.scenes[sceneName]) {
      this.dragging = false;
      this.dragScene = null;
      // Панель кода друга не должна висеть поверх других сцен
      if (typeof ClipBridge !== 'undefined' && ClipBridge.hide && sceneName !== 'friends') ClipBridge.hide();
      // Временные эффекты не должны «протекать» в другую сцену
      this.gopher.outfit = null;
      this.gopher.heldEmoji = null;
      this.gopher.heldTimer = 0;
      this.gopher.shower = 0;
      this.scenes[sceneName].init(initArgs);
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
      System.tick(this.dt);   // сон: энергия растёт постепенно в реальном времени
      this.ensureCharacter();
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
