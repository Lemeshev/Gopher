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

    // Страницы подсказки. v1.3.12: заказчик — «в „Как играть“ не все предложения
    // помещаются в экран — вылезают за рамочку». Причины: строки длиннее карточки,
    // жёсткие переводы «\n» и рисование по центру без переноса. Теперь каждая
    // страница — короткие строки (влезают и на узком экране), а drawTutorial ещё и
    // переносит текст по ширине с подбором размера шрифта — на всякий случай.
    // Список музеев и длина кода обновлены под текущую версию (музеев 50,
    // короткий код 19 знаков, иначе подсказка врала бы новым игрокам).
    this.tutorialPages = [
      '🐹 Это твой питомец:\nкорми его, купай и играй!',
      '⚡ Энергия тратится понемногу\n(поход — 2–8), а сон даёт +10% в минуту.',
      '😴 Уложи спать и закрой игру:\nэнергия копится даже без тебя.',
      '🤫 Пока питомец спит, походы закрыты.\nДоступны тихие игры и мини-игры.',
      '🏠 Дома четыре комнаты:\nгостиная, спальня, кухня, ванная.',
      '🛋️ Мебель покупается в магазине\nи переставляется пальцем.',
      '😌 Все полоски одного смысла:\nчем полнее и зеленее — тем лучше.',
      '🗺️ На карте — 50 музеев,\nпарк, бассейн, кино и спортзал.',
      '🧑‍🤝‍🧑 Друзья: короткий код из 19 знаков\nможно продиктовать, полный — скопировать.',
      '⚙️ Музыку и звуки можно выключить\nв настройках — игра станет тихой.'
    ];

    this.sceneClasses = {
      menu: MenuScene,
      map: MapScene,
      home: HomeScene,
      shop: ShopScene,
      minigames: MinigamesScene,
      tools: ToolsScene,
      stats: StatsScene,
      clinic: ClinicScene,
      visit: VisitScene,
      friends: FriendsScene,
      quiet: QuietScene,        // тихие игры: чем заняться, пока гофер спит
      aerial: AerialScene,      // воздушная гимнастика (кольца) — старое имя сцены
      sport: SportScene         // спортивные тренировки: кольца, полотна, заплыв, барьеры
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
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resize());
      window.visualViewport.addEventListener('scroll', () => this.resize());
    }

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
    // Меню — «ambient»: тихий фон. Дальше сцены сами сообщают, где мы (v1.3.5)
    if (typeof AudioSys !== 'undefined' && AudioSys.setScene) AudioSys.setScene('menu');
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

    // Автосохранение — только когда профиль загружен: до нажатия «Продолжить»
    // сохранять нечего, а пустое состояние затёрло бы сохранение ребёнка.
    setInterval(() => { if (System.profileLoaded) System.saveGame(); }, 30000);
    setInterval(() => {
      // Каждую минуту пересчитываем достижения по времени (само время копит
      // игровой цикл реальными секундами — см. loop())
      if (System.profileLoaded) System.checkAchievements();
    }, 60000);

    // Мост для системной кнопки «Назад»: MainActivity спрашивает игру и
    // закрывает приложение только если игра ответила «exit»
    window.onAndroidBack = () => this.handleAndroidBack();

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
    const vv = window.visualViewport;
    const w = Math.round((vv && vv.width) || window.innerWidth || 360);
    const h = Math.round((vv && vv.height) || window.innerHeight || 640);
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    if (vv) this.canvas.style.marginTop = Math.round(vv.offsetTop || 0) + 'px';
    const bar = document.getElementById('kitBar');
    if (bar && vv) {
      const lift = Math.max(0, Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0)));
      bar.style.bottom = lift + 'px';
    }
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  transitionTo(sceneName, initArgs) {
    if (this.scenes[sceneName]) {
      this.dragging = false;
      this.dragScene = null;
      // Поле «Новый пункт» — это HTML поверх канваса. Жест «Назад» меняет сцену
      // мимо кнопки на экране, и без этого поле остаётся на всех экранах.
      if (typeof KitBar !== 'undefined' && KitBar.close) KitBar.close();
      // Панель кода друга не должна висеть поверх других сцен
      if (typeof ClipBridge !== 'undefined' && ClipBridge.hide && sceneName !== 'friends') ClipBridge.hide();
      // Временные эффекты не должны «протекать» в другую сцену
      this.gopher.outfit = null;
      this.gopher.heldEmoji = null;
      this.gopher.heldTimer = 0;
      this.gopher.shower = 0;
      this.scenes[sceneName].init(initArgs);
      this.currentScene = sceneName;
      // Сцена сообщает музыке, где мы: у каждого экрана свой характер мелодии
      // (v1.3.5). Сцена «в гости» уточняет это сама — там важен сам музей/парк.
      if (typeof AudioSys !== 'undefined' && AudioSys.setScene) AudioSys.setScene(sceneName);
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
      } else if (btn.action === 'tutorial-close') {
        // Крестик: подсказку можно закрыть на любой странице (v1.3.12) —
        // раньше приходилось листать все десять страниц до кнопки «Закрыть»
        this.tutorialVisible = false;
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
      // Время в игре: раньше счётчик прибавлялся раз в минуту, а статистика
      // делила его на 60 — поэтому у всех было «0 мин» (v1.3.6)
      if (System.profileLoaded) System.addPlaySeconds(Math.min(this.dt / 1000, 5));
      // Таймер инструментов должен звонить на любой сцене, не только в «Инструментах».
      if (this.scenes.tools && this.scenes.tools.checkTimer) this.scenes.tools.checkTimer();
      AudioSys.musicTick();   // фоновая музыка: ноты расписываются вперёд на доли секунды
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

  // ================= КНОПКА «НАЗАД» НА ANDROID (v1.3.6) =================
  // Раньше «Назад» сразу закрывала игру: из гостей у друга выйти было нельзя,
  // приходилось выгружать приложение (жалоба 30.09.2026). Теперь сначала
  // закрываем то, что открыто, и только с главного экрана игра закрывается.
  handleAndroidBack() {
    try {
      if (this.tutorialVisible) { this.tutorialVisible = false; return 'back'; }
      const scene = this.scenes[this.currentScene];
      // Коллекция рыб — это подэкран внутри «Информации»: системная «Назад»
      // сначала возвращает к достижениям, а не на карту (v1.3.12)
      if (scene && typeof scene.handleFishBack === 'function' && scene.handleFishBack()) return 'back';
      if (scene && typeof scene.handleBack === 'function' && scene.handleBack()) return 'back';
      // Цепочка «назад»: любая сцена → карта → дом → меню → выход из игры.
      // Так «Назад» всегда что-то делает и никогда не выкидывает ребёнка из игры
      // посреди дела.
      if (this.currentScene === 'menu') return 'exit';
      if (this.currentScene === 'home') { this.transitionTo('menu'); return 'back'; }
      if (this.currentScene === 'map') { this.transitionTo('home'); return 'back'; }
      this.transitionTo('map');
      return 'back';
    } catch (e) {
      return 'exit';
    }
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

    // Текст страницы: сами строки заданы с «\n», но каждая ещё и переносится по
    // ширине карточки, а размер шрифта подбирается так, чтобы всё влезло и по
    // ширине, и по высоте. Раньше рисовали фиксированным 17 px без переноса —
    // длинные строки (и эмодзи) вылезали за рамку (замечание заказчика, v1.3.12).
    const textMaxW = W * 0.9 - 40;
    const baseSize = Math.min(W * 0.038, 17), minSize = 10;
    const maxLines = 6;
    const rawLines = pages[this.tutorialPage].split('\n');
    let size = baseSize, drawLines = [];
    while (size >= minSize) {
      this.ctx.font = `${size}px Arial`;
      const wrapped = [];
      rawLines.forEach(raw => {
        wrapLines(this.ctx, raw, textMaxW, maxLines).forEach(l => wrapped.push(l));
      });
      if (wrapped.length <= maxLines) { drawLines = wrapped; break; }
      size -= 0.5;
    }
    if (!drawLines.length) {
      this.ctx.font = `${minSize}px Arial`;
      rawLines.forEach(raw => {
        wrapLines(this.ctx, raw, textMaxW, maxLines).forEach(l => drawLines.push(l));
      });
      drawLines = drawLines.slice(0, maxLines);
      size = minSize;
    }
    // Если строка всё равно шире карточки (эмодзи меряется криво) — ужимаем её
    // отдельно, чтобы ничего не выходило за рамку
    this.ctx.font = `${size}px Arial`;
    this.ctx.fillStyle = '#E4E4F0';
    const lineH = Math.min(H * 0.045, 28) * (size / baseSize + 0.15);
    const textTop = H * 0.38;
    drawLines.forEach((line, i) => {
      const s2 = fitFontSize(this.ctx, line, textMaxW, size, 8.5, false);
      if (s2 !== size) this.ctx.font = `${s2}px Arial`;
      this.ctx.fillText(line, W / 2, textTop + i * lineH);
      if (s2 !== size) this.ctx.font = `${size}px Arial`;
    });

    // Точки-индикаторы
    const dotsY = H * 0.68;
    const dotsW = (pages.length - 1) * 18;
    for (let i = 0; i < pages.length; i++) {
      this.ctx.fillStyle = i === this.tutorialPage ? '#FFD93D' : 'rgba(255,255,255,0.3)';
      this.ctx.beginPath();
      this.ctx.arc(W / 2 - dotsW / 2 + i * 18, dotsY, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Крестик в углу — закрыть можно СРАЗУ, не листая до конца.
    // Заказчик: «экран „Как играть“ не закрыть, пока не пролистаешь всё до конца —
    // это бесит» (v1.3.12). Раньше «Закрыть» появлялась только на последней странице,
    // а кнопки «Назад» на экране подсказки не было вовсе.
    const cs = 34;
    const cx = W * 0.05 + W * 0.9 - cs - 8, cy = H * 0.15 + 8;
    this.ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(this.ctx, cx, cy, cs, cs, 10);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.font = `bold ${Math.round(cs * 0.5)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('✕', cx + cs / 2, cy + cs / 2 + 1);
    this.ctx.textBaseline = 'alphabetic';
    this.buttons.push({ x: cx, y: cy, w: cs, h: cs, action: 'tutorial-close' });

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

    // «Пропустить» — рядом с номером страницы, пока это не последняя страница
    if (!isLast) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
      this.ctx.font = `${Math.min(W * 0.028, 11.5)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Страница ' + (this.tutorialPage + 1) + ' из ' + pages.length + '  ·  можно закрыть в любой момент', W / 2, H * 0.725);
    }
  }
}
window.Game = Game;
