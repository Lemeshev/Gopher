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
    this.hasUpdate = false;    // есть ли новая версия, обнаруженная при загрузке
    // Герой в меню — в наряде и со своим окрасом из сохранения, а рядом честные
    // уровень, опыт и монеты: иначе после перезапуска ребёнок видел «раздетого»
    // питомца и «Уровень 1, 0/100 XP», хотя прогресс на месте (v1.3.3).
    if (this.hasSave && System.previewFromSave && System.previewFromSave()) {
      if (this.game.ensureCharacter) this.game.ensureCharacter();
      System.applyLookTo(this.game.gopher);
    }
    if (this.game.gopher) this.game.gopher.setExpression('excited', 999999);
    // Проверяем, не появилась ли новая версия (кэш 15 мин, см. checkForLatestVersion)
    try {
      const res = window.checkForLatestVersion && window.checkForLatestVersion();
      if (res) this.hasUpdate = res;
    } catch (e) {}
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

    // Герой — НИЖЕ полосы опыта: у Милки длинные уши и шапка сверху, и раньше
    // они залезали на надпись «38 / 100 XP» (нашлось на живом устройстве, v1.3.4)
    if (this.game.gopher) {
      const gs = Math.min(W * 0.33, 138);
      this.game.gopher.draw(ctx, W / 2, H * 0.345, gs / this.game.gopher.size);
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
    const pchip = '👥 ' + System.profileLabel();
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
    ctx.fillText('Играть можно любым героем', W / 2, H * 0.135);

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

    // Голос героя (v1.3): у каждого свой тембр — можно послушать до выбора
    createButton(ctx, W * 0.2, H - 116, W * 0.6, 44, '🔊 Послушать голос', {
      bgColor: 'rgba(255,255,255,0.16)', fgColor: '#fff', fontSize: 15, radius: 12
    });
    this.buttons.push({ x: W * 0.2, y: H - 116, w: W * 0.6, h: 44, text: 'voice_demo' });

    // Что надето на герое — видно прямо здесь (наряды покупаются в магазине)
    const worn = (typeof System !== 'undefined' && System.lookOutfit) ? System.lookOutfit() : {};
    const wornNames = (typeof OUTFIT_SLOTS !== 'undefined')
      ? OUTFIT_SLOTS.filter(s => worn[s]).map(s => worn[s])
      : [];
    const wornTxt = wornNames.length
      ? ('Наряды: ' + wornNames.join(' · '))
      : 'Наряды покупаются в магазине, раздел «Одежда»';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    const wornSize = fitFontSize(ctx, wornTxt, W * 0.9, Math.min(W * 0.028, 12), 8, false);
    ctx.font = `${wornSize}px Arial`;
    ctx.fillText(wornTxt, W / 2, H - 130);
  }

  // ---------- ПАНЕЛЬ НАСТРОЕК ----------
  // Системная кнопка «Назад»: закрываем окна по одному, а на главном экране меню
  // возвращаем false — тогда игра закрывается по-настоящему (v1.3.6).
  handleBack() {
    if (typeof KitBar !== 'undefined' && KitBar.close) KitBar.close();
    if (this.showSettings) { this.showSettings = false; this.confirmReset = false; return true; }
    if (this.aboutMode) { this.aboutMode = false; return true; }
    if (this.profilesMode) { this.profilesMode = false; return true; }
    if (this.charMode) { this.charMode = false; return true; }
    return false;
  }

  drawSettings(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    const panelW = Math.min(W * 0.86, 320);
    // Панель выросла в v1.3.1: добавились музыка и звуки. Высоту ограничиваем
    // экраном, чтобы на невысоких телефонах кнопка «Закрыть» не уехала вниз.
    const panelH = Math.min(468, H - 20);
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

    // Музыка и звуки — два независимых переключателя (v1.3.1, просьба заказчика).
    // Сверху звуки: их замечают чаще, и первым делом родитель обычно глушит их.
    this.drawToggleRow(ctx, panelX + 20, panelY + 46, panelW - 40, 46,
      '🔊', 'Звуки', AudioSys.isSoundOn(), 'toggle_sound');
    this.drawToggleRow(ctx, panelX + 20, panelY + 100, panelW - 40, 46,
      '🎵', 'Музыка', AudioSys.isMusicOn(), 'toggle_music');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fb0d8';
    // Заказчик: «дети спрашивают — музыка всегда одинаковая или будет меняться?»
    // Поэтому в настройках видно, какая мелодия играет сейчас и что они меняются (v1.3.5).
    // Строки подняты ближе к кнопке «Об авторе»: ряд «Музыка» заканчивается на 146,
    // а подпись шрифтом 11 заезжала под его рамку (нашли на живой проверке).
    ctx.font = `${Math.min(W * 0.025, 10)}px Arial`;
    ctx.fillText('🎵 Мелодия: «' + AudioSys.musicTuneName() + '»', W / 2, panelY + 158);
    ctx.fillText('Мелодии меняются сами', W / 2, panelY + 170);

    this.buttons.push(createButton(ctx, panelX + 20, panelY + 176, panelW - 40, 42, '👤 Об авторе', {
      bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
    }));

    if (!this.confirmReset) {
      ctx.fillStyle = '#aaa';
      ctx.font = `${Math.min(W * 0.029, 12.5)}px Arial`;
      ctx.fillText('Сброс нельзя отменить — будь осторожен', W / 2, panelY + 238);
      this.buttons.push(createButton(ctx, panelX + 20, panelY + 250, panelW - 40, 42, '🗑️ Сбросить прогресс', {
        bgColor: '#E74C3C', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    } else {
      ctx.fillStyle = '#E74C3C';
      ctx.font = `bold ${Math.min(W * 0.035, 15)}px Arial`;
      ctx.fillText('Вы уверены? Это необратимо!', W / 2, panelY + 238);
      const halfW = (panelW - 50) / 2;
      this.buttons.push(createButton(ctx, panelX + 20, panelY + 250, halfW, 42, '✅ Да, сбросить', {
        bgColor: '#E74C3C', fgColor: '#fff', fontSize: 13, radius: 10
      }));
      this.buttons.push(createButton(ctx, panelX + 30 + halfW, panelY + 250, halfW, 42, '❌ Отмена', {
        bgColor: '#6BCB77', fgColor: '#fff', fontSize: 13, radius: 10
      }));
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fb0d8';
    ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
    const note = (typeof window !== 'undefined' && window.__updateNote) ? window.__updateNote : '';
    ctx.fillText('Сейчас версия ' + GAME_VERSION + (note ? ' · ' + note : ''), W / 2, panelY + panelH - 128);

    this.buttons.push(createButton(ctx, panelX + 20, panelY + panelH - 108, panelW - 40, 42, '⬇️ Обновить игру', {
      bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
    }));

    this.buttons.push(createButton(ctx, panelX + 20, panelY + panelH - 56, panelW - 40, 42, '← Закрыть', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 15, radius: 10
    }));
  }

  // Строка-переключатель: слева название, справа пилюля «ВКЛ/ВЫКЛ».
  // Состояние видно сразу (зелёное = работает), а не угадывается по щелчку.
  drawToggleRow(ctx, x, y, w, h, emoji, label, on, text) {
    ctx.fillStyle = on ? 'rgba(107,203,119,0.22)' : 'rgba(255,255,255,0.08)';
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = on ? '#6BCB77' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 12);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(w * 0.095, 15)}px Arial`;
    ctx.fillText(emoji + ' ' + label, x + 12, y + h / 2);

    const pillW = Math.min(w * 0.34, 78), pillH = h - 16;
    const pillX = x + w - pillW - 8, pillY = y + 8;
    ctx.fillStyle = on ? '#6BCB77' : '#8d93a8';
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = on ? '#10121c' : '#f0f2f8';
    ctx.font = `bold ${Math.min(pillW * 0.26, 13)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(on ? 'ВКЛ' : 'ВЫКЛ', pillX + pillW / 2, pillY + pillH / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    this.buttons.push({ x: x, y: y, w: w, h: h, text: text });
  }

  // ---------- ОБ АВТОРЕ ----------
  drawAbout(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    const panelW = Math.min(W * 0.88, 330);
    const panelH = 420;
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
    ctx.fillText('Игра про питомца · v' + GAME_VERSION, W / 2, py + 214);

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.036, 14)}px Arial`;
    ctx.fillText('© Лемешев Виктор', W / 2, py + 240);

    ctx.fillStyle = '#9fb0d8';
    ctx.font = `${Math.min(W * 0.027, 11)}px Arial`;
    ctx.fillText('Сайт игры', W / 2, py + 262);

    // Адреса — просто текстом: в детской игре нет кликабельных переходов
    // наружу, ребёнок не должен случайно уйти из игры.
    ctx.fillStyle = '#8FC7FF';
    ctx.font = `bold ${Math.min(W * 0.034, 14)}px Arial`;
    ctx.fillText('gopher.umort.ru', W / 2, py + 284);
    ctx.fillText('vk.com/VL', W / 2, py + 308);

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
    const panelH = Math.min(H * 0.92, (canAdd ? 200 : 150) + rows * 70);
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
    ctx.fillText('У каждого свой питомец · можно ходить друг к другу', W / 2, py + 54);

    let y = py + 70;
    list.forEach(pr => {
      const active = pr.id === System.profileId;
      ctx.fillStyle = active ? 'rgba(107,203,119,0.25)' : 'rgba(255,255,255,0.09)';
      roundRect(ctx, px + 16, y, panelW - 32, 62, 12);
      ctx.fill();
      ctx.strokeStyle = active ? '#6BCB77' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      roundRect(ctx, px + 16, y, panelW - 32, 62, 12);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(W * 0.05, 22)}px Arial`;
      ctx.fillText(active ? '✅' : System.emojiForProfile(pr.id), px + 26, y + 22);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.038, 15)}px Arial`;
      const prLabel = System.profileLabelFor(pr.id);
      const nameSize = fitFontSize(ctx, prLabel, panelW - 168, Math.min(W * 0.038, 15), 9, true);
      ctx.font = `bold ${nameSize}px Arial`;
      ctx.fillText(prLabel, px + 52, y + 20);

      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.028, 11)}px Arial`;
      const lv = this.profileLevel(pr.id);
      ctx.fillText(active ? ('Сейчас · Ур.' + lv) : ('Ур.' + lv), px + 52, y + 40);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#4D96FF';
      roundRect(ctx, px + panelW - 118, y + 16, 46, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Имя', px + panelW - 95, y + 31);
      this.buttons.push({ x: px + panelW - 118, y: y + 16, w: 46, h: 30, text: 'rename_' + pr.id });
      if (list.length > 1) {
        ctx.fillStyle = '#E74C3C';
        roundRect(ctx, px + panelW - 66, y + 16, 36, 30, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('✕', px + panelW - 48, y + 31);
        this.buttons.push({ x: px + panelW - 66, y: y + 16, w: 36, h: 30, text: 'drop_' + pr.id });
      }
      ctx.textBaseline = 'alphabetic';
      this.buttons.push({ x: px + 16, y: y, w: panelW - 130, h: 62, text: 'profile_' + pr.id });
      y += 70;
    });

    if (this.confirmDrop) {
      ctx.fillStyle = '#ffb4b4';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Нажми ✕ ещё раз, чтобы удалить', W / 2, y + 14);
    }

    if (canAdd) {
      this.buttons.push(createButton(ctx, px + 16, y + 4, panelW - 32, 42, '＋ Новый питомец', {
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
    System.showAchievement('👥', 'Играем за ' + System.profileLabel());
  }

  createProfile() {
    const list = System.getProfiles();
    if (list.length >= 4) return;
    // Имя профиля — «кто играет». Питомец может быть любым героем, поэтому и
    // вопрос, и запасное имя нейтральные (v1.3.4): раньше было «Как зовут гофера?»
    // prompt() в WebView часто не открывается, и профиль навсегда оставался
    // «Питомец 2». Имя пустое: в списке видно героя, своё имя ставится кнопкой «Имя».
    System.saveGame();
    const id = 'p' + Date.now().toString(36);
    const name = '';
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
    System.showAchievement('🐾', 'Новый питомец: ' + System.profileLabel());
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
          AudioSys.voice(id, 'hello');            // герой «здоровается» своим голосом
          return true;
        }
        if (t === 'voice_demo') {
          AudioSys.voice(System.look.char, 'hello');
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
        if (t.indexOf('rename_') === 0) {
          const id = t.slice(7);
          const pr = System.getProfiles().find(p => p.id === id);
          const raw = (pr && pr.name) || '';
          const current = raw && raw !== DEFAULT_PROFILE_NAME && !/^Питомец \d+$/.test(raw) ? raw : '';
          if (window.KitBar) {
            KitBar.open('Как зовут питомца?', current, (text) => {
              System.renameProfile(id, text);
              KitBar.close();
            });
          }
          return true;
        }
        if (t.indexOf('drop_') === 0) {
          const id = t.slice(5);
          if (this.confirmDrop === id) {
            System.deleteProfile(id);
            this.confirmDrop = null;
            if (this.game && this.game.ensureCharacter) this.game.ensureCharacter();
            System.applyLookTo(this.game.gopher);
          } else this.confirmDrop = id;
          return true;
        }
        if (t.indexOf('profile_') === 0) { this.switchToProfile(t.slice(8)); return true; }
        if (t.indexOf('Новый питомец') !== -1) { this.createProfile(); return true; }
        if (t.indexOf('Закрыть') !== -1 || t.indexOf('Назад') !== -1) { this.profilesMode = false; return true; }
        return true;
      }

      // ---- Настройки ----
      if (this.showSettings) {
        // Музыка и звуки (v1.3.1). Две независимые галочки: можно оставить звуки
        // и выключить музыку — и наоборот.
        if (t === 'toggle_sound') {
          const on = AudioSys.toggleSound();
          // Включая звук, сразу даём короткий сигнал: слышно, что он заработал
          if (on) {
            if (!AudioSys.ctx) AudioSys.init();
            AudioSys.play('success');
          }
          return true;
        }
        if (t === 'toggle_music') {
          AudioSys.toggleMusic();
          AudioSys.musicTick();       // слышно (или тихо) сразу, не ждём кадра
          return true;
        }
        if (t.indexOf('Обновить игру') !== -1) {
          openGameUpdate();
          return true;
        }
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
      } else if (t === 'profiles' || t.indexOf('Профили') !== -1) {
        // v1.3.12: заказчик — «Зачем нужна кнопка „Профили“? Она не работает».
        // Причина: у большой кнопки текст «👥 Профили», а обработчик ждал только
        // внутренний код 'profiles' (он есть у маленькой кнопки-чипа в углу).
        // Из-за этого большая кнопка в списке меню не открывала ничего.
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
