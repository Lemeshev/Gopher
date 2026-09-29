// ============ ТИХИЕ ИГРЫ («чем заняться, пока гофер спит») ============
// Спокойные занятия без таймеров, без проигрышей и без затрат энергии:
//   1) Созвездие — соедини звёзды по порядку;
//   2) Раскраска — раскрась картинку цветами;
//   3) Тихая рыбалка — дождись поклёвки и тяни.
// Пока гофер спит, энергия копится (+10% в минуту) — об этом написано на экране.
class QuietScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.mode = 'select';   // select | stars | color | fish
    this.result = '';
    this.resultTimer = 0;
    this.initStars();
    this.initColor();
    this.initFish();
  }

  init() {
    this.time = 0;
    this.mode = 'select';
    this.buttons = [];
    this.result = '';
    this.resultTimer = 0;
    this.initStars();
    this.initColor();
    this.initFish();
  }

  // ---------- 1. СОЗВЕЗДИЕ ----------
  initStars() {
    // «Ковш» из 9 звёзд: соединяем по номерам — получается созвездие
    const base = [
      [0.20, 0.30], [0.32, 0.26], [0.44, 0.30], [0.56, 0.38],
      [0.68, 0.34], [0.74, 0.50], [0.60, 0.56], [0.46, 0.54], [0.34, 0.62]
    ];
    this.stars = { points: base, next: 0, done: false };
  }

  // ---------- 2. РАСКРАСКА ----------
  initColor() {
    this.paint = {
      colors: ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#C39BD3', '#FF8C42'],
      picked: 0,
      done: false,
      parts: [
        { id: 'body', kind: 'ellipse', cx: 0.50, cy: 0.60, rx: 0.26, ry: 0.20, fill: null },
        { id: 'head', kind: 'circle', cx: 0.50, cy: 0.32, r: 0.15, fill: null },
        { id: 'earL', kind: 'circle', cx: 0.38, cy: 0.19, r: 0.07, fill: null },
        { id: 'earR', kind: 'circle', cx: 0.62, cy: 0.19, r: 0.07, fill: null },
        { id: 'tail', kind: 'circle', cx: 0.79, cy: 0.68, r: 0.08, fill: null },
        { id: 'grass', kind: 'rect', x: 0.08, y: 0.80, w: 0.84, h: 0.13, fill: null }
      ]
    };
  }

  // ---------- 3. РЫБАЛКА ----------
  initFish() {
    this.fish = { state: 'wait', timer: randFloat(2.5, 5.5), biteWindow: 0, caught: 0, target: 3 };
  }

  startGame(id) {
    if (id === 'stars') this.initStars();
    else if (id === 'color') this.initColor();
    else this.initFish();
    this.mode = id;
    AudioSys.play('click');
  }

  // Награда за спокойную игру: монеты, опыт, меньше стресса, без затрат энергии
  reward(gameId, title) {
    const meta = (typeof QUIET_GAMES !== 'undefined') ? QUIET_GAMES.find(g => g.id === gameId) : null;
    const coins = meta ? meta.reward : 8;
    System.countAction('quiet');
    System.earnCoins(coins);
    System.addXP(6);
    System.relax(4);
    System.saveGame();
    AudioSys.play('success');
    this.result = title + '  🪙+' + coins + '  😌−4 стресса';
    this.resultTimer = 4.5;
    System.showAchievement('✨', title);
  }

  update(dt) {
    this.time += dt;
    const sec = dt / 1000;
    if (this.resultTimer > 0) this.resultTimer -= sec;

    if (this.mode === 'fish') {
      const f = this.fish;
      if (f.state === 'wait') {
        f.timer -= sec;
        if (f.timer <= 0) { f.state = 'bite'; f.biteWindow = 2.2; AudioSys.play('coin'); }
      } else if (f.state === 'bite') {
        f.biteWindow -= sec;
        if (f.biteWindow <= 0) { f.state = 'wait'; f.timer = randFloat(2.0, 4.5); }
      }
    }
  }
  // ================= ОТРИСОВКА =================
  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;

    // Ночь и покой — фон всегда спокойный
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#141433');
    grad.addColorStop(1, '#243055');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * 12.9) * 0.5 + 0.5) * W;
      const sy = (Math.cos(i * 7.3) * 0.5 + 0.5) * H * 0.7;
      const tw = 0.5 + 0.5 * Math.sin(this.time * 0.002 + i);
      ctx.globalAlpha = 0.25 + tw * 0.45;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawHeader(ctx, W, H);

    if (this.mode === 'select') this.drawSelect(ctx, W, H);
    else if (this.mode === 'stars') this.drawStars(ctx, W, H);
    else if (this.mode === 'color') this.drawColor(ctx, W, H);
    else this.drawFish(ctx, W, H);

    if (this.resultTimer > 0) {
      const bw = Math.min(W * 0.9, 340);
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      roundRect(ctx, (W - bw) / 2, H * 0.44, bw, 44, 12);
      ctx.fill();
      ctx.fillStyle = '#FFD93D';
      const size = fitFontSize(ctx, this.result, bw - 16, Math.min(W * 0.034, 14), 9, true);
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.result, W / 2, H * 0.44 + 22);
      ctx.textBaseline = 'alphabetic';
    }

    this.buttons.push(createButton(ctx, 10, 10, 88, 34, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 9
    }));
  }

  // Состояние гофера: спит — энергия копится; не спит — просто тихая игра
  drawHeader(ctx, W, H) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.055, 24)}px Arial`;
    ctx.fillText('🤫 Тихие игры', W / 2, H * 0.055);

    const status = System.isSleeping
      ? 'Гофер спит 💤  энергия ' + Math.round(System.stats.energy) + '% (+10% в минуту)'
      : 'Гофер не спит. Тихие игры не тратят энергию и не мешают отдыху';
    const size = fitFontSize(ctx, status, W - 30, Math.min(W * 0.029, 12.5), 8.5, false);
    ctx.fillStyle = System.isSleeping ? '#9be3b0' : '#c9cfe0';
    ctx.font = `${size}px Arial`;
    ctx.fillText(status, W / 2, H * 0.095);
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Выбор игры ----------
  drawSelect(ctx, W, H) {
    const games = (typeof QUIET_GAMES !== 'undefined') ? QUIET_GAMES : [];
    const cardW = Math.min(W * 0.86, 330);
    const cardH = Math.min(H * 0.13, 88);
    const x0 = (W - cardW) / 2;
    const y0 = H * 0.15;

    games.forEach((g, i) => {
      const y = y0 + i * (cardH + 12);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, x0, y, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x0, y, cardW, cardH, 14);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(cardH * 0.5, 38)}px Arial`;
      ctx.fillText(g.emoji, x0 + 14, y + cardH / 2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.042, 17)}px Arial`;
      ctx.fillText(g.name, x0 + 66, y + cardH / 2 - 11);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.min(W * 0.030, 12.5)}px Arial`;
      ctx.fillText(g.desc, x0 + 66, y + cardH / 2 + 11);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(W * 0.030, 12.5)}px Arial`;
      ctx.fillText('🪙+' + g.reward, x0 + cardW - 14, y + cardH - 15);

      this.buttons.push({ x: x0, y: y, w: cardW, h: cardH, action: 'quiet:' + g.id });
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
    ctx.fillText('Проиграть нельзя — можно только отдохнуть 😌', W / 2, H - 26);
  }
  // ---------- 1. Созвездие ----------
  drawStars(ctx, W, H) {
    const a = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const pts = this.stars.points.map(p => ({ x: a.x + a.w * p[0], y: a.y + a.h * p[1] }));

    ctx.strokeStyle = 'rgba(255,217,61,0.85)';
    ctx.lineWidth = 2;
    for (let i = 1; i < this.stars.next; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    pts.forEach((p, i) => {
      const done = i < this.stars.next;
      const isNext = i === this.stars.next && !this.stars.done;
      const pulse = isNext ? 1 + Math.sin(this.time * 0.006) * 0.22 : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (isNext ? 13 : 9) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = done ? '#FFD93D' : (isNext ? '#8FE3FF' : 'rgba(255,255,255,0.35)');
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isNext ? '#0d1024' : 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), p.x, p.y + 0.5);
      ctx.textBaseline = 'alphabetic';
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.030, 13)}px Arial`;
    ctx.fillText(this.stars.done ? 'Созвездие готово! ✨' : 'Нажимай звёзды по порядку: 1, 2, 3…', W / 2, H * 0.80);

    this.buttons.push(createButton(ctx, W * 0.30, H * 0.84, W * 0.40, 38,
      this.stars.done ? '✨ Ещё раз' : '🔄 Заново', {
        bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 14, radius: 10
      }));
  }

  // ---------- 2. Раскраска ----------
  drawColor(ctx, W, H) {
    const p = this.paint;
    const a = { x: W * 0.12, y: H * 0.14, w: W * 0.76, h: H * 0.54 };

    p.parts.forEach(part => {
      ctx.beginPath();
      if (part.kind === 'circle') {
        ctx.arc(a.x + a.w * part.cx, a.y + a.h * part.cy, a.w * part.r, 0, Math.PI * 2);
      } else if (part.kind === 'ellipse') {
        ctx.ellipse(a.x + a.w * part.cx, a.y + a.h * part.cy, a.w * part.rx, a.h * part.ry, 0, 0, Math.PI * 2);
      } else if (part.kind === 'rect') {
        roundRect(ctx, a.x + a.w * part.x, a.y + a.h * part.y, a.w * part.w, a.h * part.h, 8);
      }
      ctx.fillStyle = part.fill || 'rgba(255,255,255,0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });

    // мордочка, чтобы картинка читалась
    const hx = a.x + a.w * 0.50, hy = a.y + a.h * 0.32;
    ctx.fillStyle = '#1b1b26';
    ctx.beginPath(); ctx.arc(hx - a.w * 0.05, hy, a.w * 0.014, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + a.w * 0.05, hy, a.w * 0.014, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx, hy + a.h * 0.045, a.w * 0.02, a.h * 0.015, 0, 0, Math.PI * 2); ctx.fill();

    // палитра
    const sw = Math.min((W - 40) / p.colors.length, 54);
    const y = H * 0.73;
    p.colors.forEach((c, i) => {
      const x = (W - sw * p.colors.length) / 2 + i * sw;
      ctx.fillStyle = c;
      roundRect(ctx, x + 2, y, sw - 4, sw * 0.55, 8);
      ctx.fill();
      if (i === p.picked) {
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 3;
        roundRect(ctx, x + 2, y, sw - 4, sw * 0.55, 8);
        ctx.stroke();
      }
      this.buttons.push({ x: x + 2, y: y, w: sw - 4, h: sw * 0.55, action: 'paint:' + i });
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.030, 13)}px Arial`;
    ctx.fillText(p.done ? 'Картинка раскрашена! 🎨' : 'Выбери цвет и нажимай на части картинки', W / 2, H * 0.69);

    this.buttons.push(createButton(ctx, W * 0.32, H * 0.85, W * 0.36, 36, '🔄 Новая', {
      bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 13, radius: 10
    }));
  }

  // ---------- 3. Тихая рыбалка ----------
  drawFish(ctx, W, H) {
    const f = this.fish;
    const waterTop = H * 0.46;

    const wg = ctx.createLinearGradient(0, waterTop, 0, H * 0.86);
    wg.addColorStop(0, '#1d5b86');
    wg.addColorStop(1, '#0e3350');
    ctx.fillStyle = wg;
    ctx.fillRect(0, waterTop, W, H * 0.86 - waterTop);

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = waterTop + 16 + i * 26 + Math.sin((x * 0.03) + this.time * 0.002 + i) * 3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const dip = (f.state === 'bite') ? 14 + Math.sin(this.time * 0.03) * 4 : 0;
    const bx = W / 2, by = waterTop + 44 + dip;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, H * 0.16);
    ctx.lineTo(bx, by - 10);
    ctx.stroke();
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(bx, by + 5, 6, 0, Math.PI); ctx.fill();

    if (f.state === 'bite') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(bx, by + 12, r * 14, r * 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = f.state === 'bite' ? '#FFD93D' : '#c9cfe0';
    ctx.font = `bold ${Math.min(W * 0.036, 15)}px Arial`;
    ctx.fillText(f.state === 'bite' ? 'КЛЮЁТ! Нажимай — тяни!' : 'Ждём поклёвку… тихо-тихо 🎣', W / 2, H * 0.90);

    ctx.font = `${Math.min(W * 0.030, 12.5)}px Arial`;
    ctx.fillStyle = '#9be3b0';
    ctx.fillText('Поймано: ' + f.caught + ' / ' + f.target + ' 🐟', W / 2, H * 0.94);

    this.buttons.push(createButton(ctx, W * 0.32, H * 0.79, W * 0.36, 40,
      f.state === 'bite' ? '🎣 Тянуть!' : '⏳ Ждём…', {
        bgColor: f.state === 'bite' ? '#6BCB77' : 'rgba(255,255,255,0.18)',
        fgColor: f.state === 'bite' ? '#0d1024' : '#fff', fontSize: 14, radius: 10
      }));
  }

  // ================= НАЖАТИЯ =================
  handleClick(mx, my) {
    // «Назад» — всегда последняя кнопка в массиве
    const back = this.buttons[this.buttons.length - 1];
    if (back && back.text && back.text.indexOf('Назад') !== -1 &&
        isPointInRect(mx, my, back.x, back.y, back.w, back.h)) {
      AudioSys.play('click');
      if (this.mode === 'select') this.game.transitionTo('home');
      else this.init();
      return true;
    }

    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const a = btn.action || '';
      const t = btn.text || '';
      if (a.indexOf('quiet:') === 0) { this.startGame(a.slice(6)); return true; }
      if (a.indexOf('paint:') === 0) {
        this.paint.picked = parseInt(a.slice(6), 10);
        AudioSys.play('click');
        return true;
      }
      if (t.indexOf('Заново') !== -1 || t.indexOf('Ещё раз') !== -1) { this.startGame('stars'); return true; }
      if (t.indexOf('Новая') !== -1) { this.startGame('color'); return true; }
      if (t.indexOf('Тянуть') !== -1 || t.indexOf('Ждём') !== -1) { return this.tryFish(); }
      return true;
    }

    if (this.mode === 'stars') return this.clickStars(mx, my);
    if (this.mode === 'color') return this.clickColor(mx, my);
    if (this.mode === 'fish') return this.tryFish();
    return false;
  }

  clickStars(mx, my) {
    const W = this.game.width, H = this.game.height;
    const a = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const pts = this.stars.points.map(p => ({ x: a.x + a.w * p[0], y: a.y + a.h * p[1] }));
    for (let i = 0; i < pts.length; i++) {
      const dx = mx - pts[i].x, dy = my - pts[i].y;
      if (Math.sqrt(dx * dx + dy * dy) <= 24) {
        if (this.stars.done) return true;
        if (i === this.stars.next) {
          this.stars.next++;
          AudioSys.play('click');
          if (this.stars.next >= pts.length) {
            this.stars.done = true;
            this.reward('stars', 'Созвездие собрано ✨');
          }
        } else {
          AudioSys.play('fail');
          this.result = 'Эта звезда ещё не следующая — ищи номер ' + (this.stars.next + 1);
          this.resultTimer = 2.2;
        }
        return true;
      }
    }
    return false;
  }

  // Попадает ли точка в часть картинки
  paintHit(part, a, mx, my) {
    if (part.kind === 'circle') {
      const cx = a.x + a.w * part.cx, cy = a.y + a.h * part.cy;
      const dx = mx - cx, dy = my - cy;
      return Math.sqrt(dx * dx + dy * dy) <= a.w * part.r;
    }
    if (part.kind === 'ellipse') {
      const dx = (mx - (a.x + a.w * part.cx)) / (a.w * part.rx);
      const dy = (my - (a.y + a.h * part.cy)) / (a.h * part.ry);
      return (dx * dx + dy * dy) <= 1;
    }
    return isPointInRect(mx, my, a.x + a.w * part.x, a.y + a.h * part.y, a.w * part.w, a.h * part.h);
  }

  clickColor(mx, my) {
    const W = this.game.width, H = this.game.height;
    const p = this.paint;
    const a = { x: W * 0.12, y: H * 0.14, w: W * 0.76, h: H * 0.54 };
    // Части перекрывают друг друга, поэтому сначала ищем незакрашенную под
    // пальцем: так картинку всегда можно довести до конца. Если все под
    // пальцем уже раскрашены — перекрашиваем верхнюю (ребёнок видит отклик).
    const hits = p.parts.filter(part => this.paintHit(part, a, mx, my));
    if (!hits.length) return false;
    const target = hits.find(x => !x.fill) || hits[hits.length - 1];
    target.fill = p.colors[p.picked];
    AudioSys.play('click');
    if (p.parts.every(x => x.fill)) {
      p.done = true;
      this.reward('color', 'Картинка раскрашена 🎨');
    }
    return true;
  }

  tryFish() {
    const f = this.fish;
    if (f.state === 'bite') {
      f.caught++;
      f.state = 'wait';
      f.timer = randFloat(2.0, 4.5);
      AudioSys.play('success');
      if (f.caught >= f.target) {
        this.reward('fish', 'Рыбалка удалась 🎣');
        f.caught = 0;
      } else {
        this.result = 'Есть! Рыбка поймана 🐟 (' + f.caught + '/' + f.target + ')';
        this.resultTimer = 2.4;
      }
    } else {
      this.result = 'Рано! Дождись, когда поплавок нырнёт';
      this.resultTimer = 2.0;
    }
    return true;
  }
}
window.QuietScene = QuietScene;
