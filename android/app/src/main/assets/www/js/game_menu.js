// ============ СЦЕНА ГЛАВНОГО МЕНЮ ============
class MenuScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.particles = [];
    this.time = 0;
    this.titleAlpha = 0;
    this.hasSave = false;
    this.showSettings = false;
    this.confirmReset = false;
    this.aboutMode = false;
    this.profilesMode = false;
    this.charMode = false;      // выбор персонажа (гофер, мишка, зайка...)
  }

  init() {
    this.time = 0;
    this.titleAlpha = 0;
    this.buttons = [];
    this.particles = [];
    this.hasSave = System.hasSave();
    this.showSettings = false;
    this.confirmReset = false;
    this.aboutMode = false;
    this.profilesMode = false;
    this.charMode = false;
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
    // Панели рисуются вместо списка кнопок
    if (this.aboutMode) { this.drawAbout(ctx, W, H); return; }
    if (this.profilesMode) { this.drawProfiles(ctx, W, H); return; }
    if (this.charMode) { this.drawCharacters(ctx, W, H); return; }
    if (this.showSettings) { this.drawSettings(ctx, W, H); return; }

    const btnW = Math.min(W * 0.72, 270);
    const btnH = 50;
    const gap = 12;
    const btnX = (W - btnW) / 2;

    const list = [];
    if (this.hasSave) {
      list.push({ text: '▶️ Продолжить', color: '#4D96FF', size: 18 });
    } else {
      list.push({ text: '🎮 Начать игру', color: '#6BCB77', size: 18 });
    }
    list.push({ text: '📖 Как играть', color: '#FF8C42', size: 16 });
    list.push({ text: '👥 Профили', color: '#546E7A', size: 16 });
    list.push({ text: '🧸 Персонаж: ' + System.characterName(), color: '#9B59B6', size: 15 });

    const totalH = list.length * btnH + (list.length - 1) * gap;
    let by = Math.max(H * 0.52, H - totalH - 46);
    if (by + totalH > H - 14) by = H - totalH - 14;

    list.forEach(item => {
      this.buttons.push(createButton(ctx, btnX, by, btnW, btnH, item.text, {
        bgColor: item.color, fontSize: item.size
      }));
      by += btnH + gap;
    });

    // Маленькие угловые кнопки: профиль слева, настройки справа
    const chipW = Math.min(W * 0.44, 158), chipH = 28;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, 12, 12, chipW, chipH, 14);
    ctx.fill();
    ctx.fillStyle = '#c9d2f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const pchip = '👥 ' + (System.profileName || 'Гофер');
    const chipFont = fitFontSize(ctx, pchip, chipW - 18, Math.min(chipW * 0.11, 12), 8, false);
    ctx.font = `${chipFont}px Arial`;
    ctx.fillText(pchip, 20, 12 + chipH / 2);
    this.buttons.push({ x: 12, y: 12, w: chipW, h: chipH, text: 'profiles' });

    const gearS = 30;
    const gx = W - gearS - 12, gy = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, gx, gy, gearS, gearS, 9);
    ctx.fill();
    ctx.fillStyle = '#c9d2f0';
    ctx.font = `${Math.min(gearS * 0.55, 16)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚙️', gx + gearS / 2, gy + gearS / 2 + 1);
    this.buttons.push({ x: gx, y: gy, w: gearS, h: gearS, text: 'settings' });
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- ВЫБОР ПЕРСОНАЖА ----------
  // Задел заказчика: герой — не только гофер. Здесь это уже работает:
  // можно играть гофером, мишкой, зайкой, котёнком или роботом.
  drawCharacters(ctx, W, H) {
    ctx.fillStyle = 'rgba(8,10,24,1)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.055, 24)}px Arial`;
    ctx.fillText('🧸 Кто будет героем?', W / 2, H * 0.10);
    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillText('Играть можно не только гофером', W / 2, H * 0.135);

    const chars = (typeof characterList === 'function') ? characterList() : [];
    const cols = 2, gap = 10, pad = 14;
    const cardW = (W - pad * 2 - gap) / cols;
    const cardH = Math.min(H * 0.17, 120);
    const startY = H * 0.17;

    chars.forEach((ch, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = pad + col * (cardW + gap);
      const y = startY + row * (cardH + gap);
      const active = (System.look.char || 'gopher') === ch.id;

      ctx.fillStyle = active ? 'rgba(107,203,119,0.30)' : 'rgba(255,255,255,0.10)';
      roundRect(ctx, x, y, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = active ? '#6BCB77' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = active ? 3 : 1.5;
      roundRect(ctx, x, y, cardW, cardH, 14);
      ctx.stroke();

      // Живое превью персонажа
      let preview = null;
      try { preview = (typeof createCharacter === 'function') ? createCharacter(ch.id, 100) : null; } catch (e) { preview = null; }
      if (preview) {
        preview.setExpression('happy', 20);
        preview.draw(ctx, x + cardW * 0.30, y + cardH * 0.46, (cardH * 0.62) / preview.size);
      }

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      // Имя и описание подгоняем по ширине карточки: длинное описание
      // («Белая, с зелёными ушками») раньше уезжало за правый край.
      const lineW = cardW * 0.45;
      const nameSize = fitFontSize(ctx, ch.emoji + ' ' + ch.name, lineW, Math.min(cardW * 0.13, 15), 9, true);
      ctx.font = `bold ${nameSize}px Arial`;
      ctx.fillText(ch.emoji + ' ' + ch.name, x + cardW * 0.52, y + cardH * 0.34);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      const descSize = fitFontSize(ctx, ch.desc, lineW, Math.min(cardW * 0.10, 11), 7.5, false);
      ctx.font = `${descSize}px Arial`;
      ctx.fillText(ch.desc, x + cardW * 0.52, y + cardH * 0.58);
      if (active) {
        ctx.fillStyle = '#6BCB77';
        ctx.font = `bold ${Math.min(cardW * 0.10, 11)}px Arial`;
        ctx.fillText('✓ выбран', x + cardW * 0.52, y + cardH * 0.80);
      }
      ctx.textBaseline = 'alphabetic';

      this.buttons.push({ x: x, y: y, w: cardW, h: cardH, text: 'char_' + ch.id });
    });

    createButton(ctx, W * 0.2, H - 62, W * 0.6, 44, '✅ Готово', {
      bgColor: '#6BCB77', fgColor: '#fff', fontSize: 16, radius: 12
    });
    this.buttons.push({ x: W * 0.2, y: H - 62, w: W * 0.6, h: 44, text: 'close_chars' });
  }

  // ---------- ПАНЕЛЬ НАСТРОЕК ----------
  drawSettings(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    const panelW = Math.min(W * 0.86, 320);
    const panelH = 268;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    ctx.fillStyle = '#1e2a4a';
    roundRect(ctx, panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 2;
    roundRect(ctx, panelX, panelY, panelW, panelH, 20);
    ctx.stroke();

    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('⚙️ Настройки', W / 2, panelY + 34);

    this.buttons.push(createButton(ctx, panelX + 20, panelY + 50, panelW - 40, 44, '👤 Об авторе', {
      bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
    }));

    if (!this.confirmReset) {
      ctx.fillStyle = '#aaa';
      ctx.font = `${Math.min(W * 0.029, 12.5)}px Arial`;
      ctx.fillText('Сброс нельзя отменить — будь осторожен', W / 2, panelY + 116);
      this.buttons.push(createButton(ctx, panelX + 20, panelY + 128, panelW - 40, 44, '🗑️ Сбросить прогресс', {
        bgColor: '#E74C3C', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    } else {
      ctx.fillStyle = '#E74C3C';
      ctx.font = `bold ${Math.min(W * 0.035, 15)}px Arial`;
      ctx.fillText('Вы уверены? Это необратимо!', W / 2, panelY + 116);
      const halfW = (panelW - 50) / 2;
      this.buttons.push(createButton(ctx, panelX + 20, panelY + 128, halfW, 44, '✅ Да, сбросить', {
        bgColor: '#E74C3C', fgColor: '#fff', fontSize: 13, radius: 10
      }));
      this.buttons.push(createButton(ctx, panelX + 30 + halfW, panelY + 128, halfW, 44, '❌ Отмена', {
        bgColor: '#6BCB77', fgColor: '#fff', fontSize: 13, radius: 10
      }));
    }

    this.buttons.push(createButton(ctx, panelX + 20, panelY + panelH - 58, panelW - 40, 42, '← Закрыть', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 15, radius: 10
    }));
  }

  // ---------- ОБ АВТОРЕ ----------
  drawAbout(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    const panelW = Math.min(W * 0.88, 330);
    const panelH = 380;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2;

    ctx.fillStyle = '#1e2a4a';
    roundRect(ctx, px, py, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = '#4D96FF';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, panelW, panelH, 20);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.05, 21)}px Arial`;
    ctx.fillText('👤 Об авторе', W / 2, py + 36);

    if (this.game.gopher) {
      const gs = Math.min(W * 0.26, 108);
      this.game.gopher.draw(ctx, W / 2, py + 112, gs / this.game.gopher.size);
    }

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.045, 17)}px Arial`;
    ctx.fillText('Gopher Life', W / 2, py + 192);

    ctx.fillStyle = '#9fb0d8';
    ctx.font = `${Math.min(W * 0.029, 12)}px Arial`;
    ctx.fillText('Игра про гофера-питомца · v' + GAME_VERSION, W / 2, py + 214);

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.036, 14)}px Arial`;
    ctx.fillText('© Лемешев Виктор', W / 2, py + 242);

    ctx.fillStyle = '#9fb0d8';
    ctx.font = `${Math.min(W * 0.027, 11)}px Arial`;
    ctx.fillText('Связаться и посмотреть другие проекты:', W / 2, py + 262);

    // Ссылка — просто текстом: в детской игре нет кликабельных переходов
    // во внешние приложения (Google Play для детских приложений этого не
    // разрешает, да и ребёнок не должен случайно уйти из игры).
    ctx.fillStyle = '#8FC7FF';
    ctx.font = `bold ${Math.min(W * 0.034, 14)}px Arial`;
    ctx.fillText('vk.com/VL', W / 2, py + 288);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `${Math.min(W * 0.024, 10)}px Arial`;
    ctx.fillText('(адрес можно переписать или отсканировать)', W / 2, py + 306);

    this.buttons.push(createButton(ctx, px + 30, py + panelH - 54, panelW - 60, 40, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 15, radius: 10
    }));
  }

  // ---------- ПРОФИЛИ (несколько гоферов на устройстве) ----------
  drawProfiles(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    const list = System.getProfiles();
    const rows = list.length;
    const canAdd = rows < 4;
    const panelW = Math.min(W * 0.9, 340);
    const panelH = Math.min(H * 0.9, (canAdd ? 190 : 140) + rows * 62);
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2;

    ctx.fillStyle = '#1e2a4a';
    roundRect(ctx, px, py, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, panelW, panelH, 20);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.048, 20)}px Arial`;
    ctx.fillText('👥 Профили', W / 2, py + 34);

    ctx.fillStyle = '#9fb0d8';
    ctx.font = `${Math.min(W * 0.027, 11)}px Arial`;
    ctx.fillText('У каждого свой гофер · можно ходить друг к другу', W / 2, py + 54);

    let y = py + 70;
    list.forEach(pr => {
      const active = pr.id === System.profileId;
      ctx.fillStyle = active ? 'rgba(107,203,119,0.25)' : 'rgba(255,255,255,0.09)';
      roundRect(ctx, px + 16, y, panelW - 32, 54, 12);
      ctx.fill();
      ctx.strokeStyle = active ? '#6BCB77' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      roundRect(ctx, px + 16, y, panelW - 32, 54, 12);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(W * 0.05, 22)}px Arial`;
      ctx.fillText(active ? '✅' : '🐹', px + 26, y + 27);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.038, 15)}px Arial`;
      const nameSize = fitFontSize(ctx, pr.name, panelW - 110, Math.min(W * 0.038, 15), 9, true);
      ctx.font = `bold ${nameSize}px Arial`;
      ctx.fillText(pr.name, px + 58, y + 20);

      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.028, 11)}px Arial`;
      const lv = this.profileLevel(pr.id);
      ctx.fillText(active ? ('Играем сейчас · Ур.' + lv) : ('Ур.' + lv), px + 58, y + 38);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      this.buttons.push({ x: px + 16, y: y, w: panelW - 32, h: 54, text: 'profile_' + pr.id });
      y += 62;
    });

    if (canAdd) {
      this.buttons.push(createButton(ctx, px + 16, y + 4, panelW - 32, 42, '＋ Новый гофер', {
        bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    }

    this.buttons.push(createButton(ctx, px + 16, py + panelH - 54, panelW - 32, 42, '← Закрыть', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 15, radius: 10
    }));
  }

  profileLevel(id) {
    try {
      const raw = localStorage.getItem(System.saveKeyFor(id));
      if (!raw) return 1;
      return JSON.parse(raw).level || 1;
    } catch (e) { return 1; }
  }

  switchToProfile(id) {
    if (id === System.profileId) { this.profilesMode = false; return; }
    const pr = System.getProfiles().find(p => p.id === id);
    if (!pr) return;
    System.saveGame();                       // сохраняем текущего игрока
    System.profileId = pr.id;
    System.profileName = pr.name;
    if (System.hasSave()) {
      System.loadGame();
    } else {
      System.resetProgress();                // новый профиль — новый гофер
      System.saveGame();
    }
    System.applyLookTo(this.game.gopher);
    this.hasSave = System.hasSave();
    this.profilesMode = false;
    this.showSettings = false;
    this.aboutMode = false;
    this.game.transitionTo('map');
    System.showAchievement('👥', 'Играем за ' + pr.name);
  }

  createProfile() {
    const list = System.getProfiles();
    if (list.length >= 4) return;
    const fallback = 'Гофер ' + (list.length + 1);
    let name = '';
    try { name = (window.prompt('Как зовут гофера?', fallback) || '').trim(); } catch (e) { name = ''; }
    if (!name) name = fallback;
    name = name.slice(0, 16);

    System.saveGame();                       // сохраняем текущего игрока
    const id = 'p' + Date.now().toString(36);
    list.push({ id: id, name: name });
    System.saveProfiles(list);
    System.profileId = id;
    System.profileName = name;
    System.resetProgress();
    System.saveGame();
    System.applyLookTo(this.game.gopher);
    this.hasSave = true;
    this.profilesMode = false;
    this.game.transitionTo('map');
    System.showAchievement('🐹', 'Новый гофер: ' + name);
  }

  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      AudioSys.play('click');
      const t = btn.text || '';

      // ---- Персонаж (гофер или другая игрушка) ----
      if (this.charMode) {
        if (t.indexOf('char_') === 0) {
          const id = t.slice(5);
          System.setCharacter(id);
          this.game.ensureCharacter();
          System.applyLookTo(this.game.gopher);
          System.showAchievement('🧸', 'Герой: ' + System.characterName());
          return true;
        }
        if (t === 'close_chars' || t.indexOf('Готово') !== -1 || t.indexOf('Назад') !== -1) { this.charMode = false; return true; }
        return true;
      }

      // ---- Об авторе ---- (переходов наружу нет: ссылка показана текстом)
      if (this.aboutMode) {
        if (t.indexOf('Назад') !== -1 || t.indexOf('Закрыть') !== -1) { this.aboutMode = false; return true; }
        return true;
      }

      // ---- Профили ----
      if (this.profilesMode) {
        if (t.indexOf('profile_') === 0) { this.switchToProfile(t.slice(8)); return true; }
        if (t.indexOf('Новый гофер') !== -1) { this.createProfile(); return true; }
        if (t.indexOf('Закрыть') !== -1 || t.indexOf('Назад') !== -1) { this.profilesMode = false; return true; }
        return true;
      }

      // ---- Настройки ----
      if (this.showSettings) {
        if (t.indexOf('Об авторе') !== -1) { this.aboutMode = true; return true; }
        if (t.indexOf('Сбросить прогресс') !== -1) { this.confirmReset = true; return true; }
        if (t.indexOf('Да, сбросить') !== -1) {
          System.resetProgress();
          System.saveGame();
          System.applyLookTo(this.game.gopher);
          this.hasSave = false;
          this.showSettings = false;
          this.confirmReset = false;
          this.game.transitionTo('menu');
          return true;
        }
        if (t.indexOf('Отмена') !== -1) { this.confirmReset = false; return true; }
        if (t.indexOf('Закрыть') !== -1) { this.showSettings = false; this.confirmReset = false; return true; }
        return true;
      }

      // ---- Главный экран ----
      if (t.indexOf('Начать игру') !== -1) {
        System.resetProgress();
        System.saveGame();
        System.applyLookTo(this.game.gopher);
        this.hasSave = true;
        this.game.transitionTo('map');
      } else if (t.indexOf('Продолжить') !== -1) {
        System.loadGame();
        System.applyLookTo(this.game.gopher);
        this.game.transitionTo('map');
      } else if (t.indexOf('Как играть') !== -1) {
        this.game.showTutorial();
      } else if (t === 'settings') {
        this.showSettings = true;
        this.confirmReset = false;
      } else if (t === 'profiles') {
        this.profilesMode = true;
      } else if (t.indexOf('Персонаж') !== -1) {
        this.charMode = true;
      }
      return true;
    }
    return false;
  }
}

window.MenuScene = MenuScene;
