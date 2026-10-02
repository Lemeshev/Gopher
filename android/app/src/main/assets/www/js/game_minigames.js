// ============ СЦЕНА МИНИ-ИГР ============
class MinigamesScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.mode = 'select'; // select, ticTacToe, memory, coinFlip
    this.ttt = { board: Array(9).fill(null), turn: 'X', over: false, winner: null };
    this.memory = { cards: [], flipped: [], matched: [], moves: 0, ready: false, done: false };
    this.coinFlip = { state: 'ready', timer: 0, result: null, angle: 0, flipDur: 1100 };
    this.rps = { pick: null, pet: null, msg: '' };
    this.simon = { seq: [], phase: 'idle', timer: 0, lit: -1, input: 0, note: '' };
  }

  init() {
    this.time = 0;
    this.mode = 'select';
  }

  initTTT() {
    this.ttt = { board: Array(9).fill(null), turn: 'X', over: false, winner: null };
    this.mode = 'ticTacToe';
  }

  initMemory() {
    const emojis = ['🐹', '🐹', '🎨', '🎨', '🚀', '🚀', '🏛️', '🏛️', '🍽️', '🍽️', '🎓', '🎓', '🏥', '🏥', '🛒', '🛒'];
    // Shuffle
    for (let i = emojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
    }
    this.memory = { cards: emojis, flipped: [], matched: Array(16).fill(false), moves: 0, ready: false, done: false };
    this.mode = 'memory';
  }

  initCoinFlip() {
    this.coinFlip = { state: 'ready', timer: 0, result: null, angle: 0, flipDur: 1100 };
    this.mode = 'coinFlip';
  }

  initRps() {
    this.rps = { pick: null, pet: null, msg: 'Выбери жест' };
    this.mode = 'rps';
  }

  initSimon() {
    this.simon = { seq: [], phase: 'idle', timer: 0, lit: -1, input: 0, note: 'Запомни огоньки и повтори' };
    this.mode = 'simon';
    this.simonExtend();
  }

  simonExtend() {
    const s = this.simon;
    s.seq.push(Math.floor(Math.random() * 4));
    s.phase = 'show';
    s.timer = 0;
    s.lit = -1;
    s.input = 0;
    s.note = 'Смотри: ' + s.seq.length;
  }

  simonPads(W, H) {
    const r = Math.min(W * 0.12, 48);
    const cx = W / 2;
    const cy = H * 0.42;
    const d = r * 2.4;
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'];
    return colors.map((color, i) => ({
      color: color,
      r: r,
      x: cx + (i % 2 === 0 ? -d / 2 : d / 2),
      y: cy + (i < 2 ? -d / 2 : d / 2)
    }));
  }

  update(dt) {
    this.time += dt;
    const cf = this.coinFlip;
    if (this.mode === 'coinFlip' && cf.state === 'flipping') {
      cf.timer += dt;
      cf.angle += dt * 0.022;
      if (cf.timer >= cf.flipDur) {
        cf.angle = 0;
        cf.result = Math.random() < 0.5 ? 'yes' : 'no';
        cf.state = 'done';
        AudioSys.play('coin');
        System.addXP(2);
        System.saveGame();
      }
    }
    if (this.mode === 'simon' && this.simon.phase === 'show') {
      const s = this.simon;
      s.timer += dt;
      const slot = 680;
      const i = Math.floor(s.timer / slot);
      if (i >= s.seq.length) {
        s.phase = 'input';
        s.lit = -1;
        s.note = 'Повтори ' + s.seq.length;
      } else {
        s.lit = (s.timer % slot) < 360 ? s.seq[i] : -1;
      }
    }
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2C3E50');
    grad.addColorStop(1, '#4A69BD');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Title
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.06, 28)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎮 Мини-игры', W / 2, H * 0.05);

    // === XP ПРОГРЕСС-БАР В МИНИ-ИГРАХ ===
    const miniXpPct = System.xp / System.xpToNext;
    const miniXpBarY = H * 0.07;
    const miniXpBarW = W - 20;
    const miniXpBarH = 12;

    ctx.font = `bold ${Math.min(W * 0.025, 11)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD93D';
    ctx.fillText('⭐ Ур.' + System.level, 10, miniXpBarY);

    ctx.font = `${Math.min(W * 0.02, 9)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,215,0,0.5)';
    ctx.fillText(System.xp + '/' + System.xpToNext, W - 10, miniXpBarY);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, 10, miniXpBarY + 4, miniXpBarW, miniXpBarH, 6);
    ctx.fill();

    if (miniXpPct > 0) {
      ctx.fillStyle = '#FFD93D';
      roundRect(ctx, 10, miniXpBarY + 4, miniXpBarW * miniXpPct, miniXpBarH, 6);
      ctx.fill();
    }

    // Back button
    this.buttons.push(createButton(ctx, 10, 10, 80, 36, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)',
      fgColor: '#fff',
      fontSize: 14,
      radius: 10
    }));

    // Пока гофер спит, мини-игры — единственное «дело»: они не зависят от
    // питомца и не тратят энергию. Об этом честно написано на экране.
    if (System.isSleeping) {
      const note = '\ud83d\udca4 {Pet} спит — играй, энергия копится сама';
      const nSize = fitFontSize(ctx, note, W - 30, Math.min(W * 0.031, 12.5), 8.5, false);
      ctx.font = `${nSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nw = ctx.measureText(note).width + 20;
      ctx.fillStyle = 'rgba(20,20,60,0.7)';
      roundRect(ctx, (W - nw) / 2, H * 0.10, nw, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#9be3b0';
      ctx.fillText(note, W / 2, H * 0.10 + 11);
      ctx.textBaseline = 'alphabetic';
    }

    if (this.mode === 'select') {
      this.drawSelect(ctx, W, H);
    } else if (this.mode === 'ticTacToe') {
      this.drawTTT(ctx, W, H);
    } else if (this.mode === 'memory') {
      this.drawMemory(ctx, W, H);
    } else if (this.mode === 'coinFlip') {
      this.drawCoinFlip(ctx, W, H);
    } else if (this.mode === 'rps') {
      this.drawRps(ctx, W, H);
    } else if (this.mode === 'simon') {
      this.drawSimon(ctx, W, H);
    }
  }

  drawSelect(ctx, W, H) {
    const games = [
      { id: 'tictactoe', emoji: '❌⭕', name: 'Крестики-нолики', desc: 'Сыграй против {pet_gen}', color: '#FF6B6B' },
      { id: 'memory', emoji: '🧠', name: 'Мемо', desc: 'Найди пары карточек', color: '#9B59B6' },
      { id: 'coinflip', emoji: '🪙', name: 'Монетка: Да или Нет', desc: 'Случайный ответ на вопрос', color: '#FFD93D' },
      { id: 'rps', emoji: '✊', name: 'Камень, ножницы', desc: 'Сыграй жест против {pet_gen}', color: '#E07A3C' },
      { id: 'simon', emoji: '💡', name: 'Огоньки', desc: 'Повтори, как зажигались', color: '#4D96FF' }
    ];

    const btnW = Math.min(W * 0.78, 300);
    const gap = 8;
    const btnH = Math.max(52, Math.min(68, (H * 0.78 - H * 0.15) / games.length - gap));
    const startX = (W - btnW) / 2;

    games.forEach((g, i) => {
      const y = H * 0.15 + i * (btnH + gap);

      ctx.fillStyle = g.color;
      roundRect(ctx, startX, y, btnW, btnH, 15);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      // Размер эмодзи ограничен: ❌⭕ шириной в две эмодзи раньше наезжало
      // на название игры.
      const emojiSizePx = Math.min(btnW * 0.25, 40);
      ctx.font = `${emojiSizePx}px Arial`;
      const emojiW = ctx.measureText(g.emoji).width;
      ctx.fillText(g.emoji, startX + 14, y + btnH / 2 - 10);

      ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`;
      ctx.textAlign = 'left';
      const nameX = Math.max(startX + btnW * 0.3, startX + 14 + emojiW + 8);
      ctx.fillText(g.name, nameX, y + btnH / 2 - 10);

      ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(g.desc, nameX, y + btnH / 2 + 12);

      this.buttons.push({ x: startX, y, w: btnW, h: btnH, action: g.id });
    });
  }

  drawTTT(ctx, W, H) {
    const board = this.ttt.board;
    const cellSize = Math.min(W * 0.22, 80);
    const offsetX = (W - cellSize * 3) / 2;
    const offsetY = H * 0.15;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, offsetX - 10, offsetY - 10, cellSize * 3 + 20, cellSize * 3 + 20, 15);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const x = offsetX + j * cellSize;
        const y = offsetY + i * cellSize;

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 8);
        ctx.fill();

        if (board[i * 3 + j]) {
          ctx.font = `bold ${cellSize * 0.5}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = board[i * 3 + j] === 'X' ? '#FF6B6B' : '#4D96FF';
          ctx.fillText(board[i * 3 + j] === 'X' ? '❌' : '⭕', x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Status
    if (!this.ttt.over) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.ttt.turn === 'X' ? 'Ваш ход! ❌' : '{Pet} думает... ⭕', W / 2, offsetY + cellSize * 3 + 35);
    } else {
      const msg = this.ttt.winner === 'draw' ? '🤝 Ничья!' : this.ttt.winner === 'X' ? '🎉 Вы победили!' : '😢 {Pet} {pet:победил|победила}!';
      ctx.fillStyle = this.ttt.winner === 'X' ? '#6BCB77' : this.ttt.winner === 'draw' ? '#FFD93D' : '#FF6B6B';
      ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
      ctx.fillText(msg, W / 2, offsetY + cellSize * 3 + 35);

      // Reward
      if (this.ttt.winner === 'X') {
        ctx.fillStyle = '#FFD93D';
        ctx.font = `${Math.min(W * 0.035, 16)}px Arial`;
        ctx.fillText('+🪙20 | +XP10', W / 2, offsetY + cellSize * 3 + 65);
      }
    }

    // Restart button
    this.buttons.push(createButton(ctx, W / 2 - 80, H * 0.85, 160, 45, '🔄 Заново', {
      bgColor: '#4D96FF',
      fontSize: 16,
      radius: 12
    }));
  }

  drawMemory(ctx, W, H) {
    const m = this.memory;
    const cols = 4;
    const cellSize = Math.min(W * 0.2, 70);
    const gap = 6;
    const offsetX = (W - (cols * (cellSize + gap) - gap)) / 2;
    const offsetY = H * 0.12;

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.035, 16)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Ходов: ' + m.moves, W / 2, offsetY - 10);

    for (let i = 0; i < 16; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = offsetX + col * (cellSize + gap);
      const y = offsetY + row * (cellSize + gap);

      if (m.matched[i]) {
        ctx.fillStyle = 'rgba(107, 203, 119, 0.3)';
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();
        ctx.font = `${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(m.cards[i], x + cellSize / 2, y + cellSize / 2);
      } else if (m.flipped.includes(i)) {
        ctx.fillStyle = '#fff';
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();
        ctx.font = `${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.fillText(m.cards[i], x + cellSize / 2, y + cellSize / 2);
      } else {
        ctx.fillStyle = '#4D96FF';
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();
        ctx.font = `${cellSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('?', x + cellSize / 2, y + cellSize / 2);
      }
    }

    // Win check
    const allMatched = m.matched.every(m => m);
    if (allMatched) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, W * 0.2, H * 0.5, W * 0.6, 80, 15);
      ctx.fill();
      ctx.fillStyle = '#6BCB77';
      ctx.font = `bold ${Math.min(W * 0.05, 24)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('🎉 Все пары найдены!', W / 2, H * 0.5 + 25);
      ctx.fillStyle = '#FFD93D';
      ctx.font = `${Math.min(W * 0.035, 16)}px Arial`;
      ctx.fillText('+🪙15 | +XP8', W / 2, H * 0.5 + 55);
    }

    this.buttons.push(createButton(ctx, W / 2 - 80, H * 0.88, 160, 40, '🔄 Заново', {
      bgColor: '#4D96FF',
      fontSize: 15,
      radius: 12
    }));
  }

  drawCoinFlip(ctx, W, H) {
    const cf = this.coinFlip;

    // Вопрос-подсказка
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${Math.min(W * 0.036, 15)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Загадай вопрос и подбрось монетку', W / 2, H * 0.16);

    // Монетка
    const R = Math.min(W * 0.22, 90);
    const cx = W / 2;
    const cy = H * 0.36;

    ctx.save();
    ctx.translate(cx, cy);
    if (cf.state === 'flipping') ctx.rotate(cf.angle);

    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(4, 6, R, R, 0, 0, Math.PI * 2);
    ctx.fill();

    // Тело монеты
    const grad = ctx.createLinearGradient(-R, -R, R, R);
    grad.addColorStop(0, '#FFE873');
    grad.addColorStop(0.5, '#FFD93D');
    grad.addColorStop(1, '#E0A800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Внутренний обод
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Символ на монете
    ctx.fillStyle = '#8B6508';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (cf.state === 'done') {
      ctx.font = `bold ${R * 0.5}px Arial`;
      ctx.fillText(cf.result === 'yes' ? 'ДА' : 'НЕТ', 0, 4);
    } else {
      ctx.font = `${R * 0.9}px Arial`;
      ctx.fillText('🪙', 0, 4);
    }
    ctx.restore();

    // Результат / кнопка
    if (cf.state === 'ready') {
      this.buttons.push(createButton(ctx, W / 2 - 110, H * 0.58, 220, 52, '🪙 Подбросить монетку', {
        bgColor: '#FFD93D', fgColor: '#333', fontSize: 16, radius: 15
      }));
    } else if (cf.state === 'flipping') {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.045, 20)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Монетка в воздухе...', W / 2, H * 0.58);
    } else if (cf.state === 'done') {
      const isYes = cf.result === 'yes';
      ctx.fillStyle = isYes ? 'rgba(107,203,119,0.95)' : 'rgba(255,107,107,0.95)';
      roundRect(ctx, W * 0.2, H * 0.52, W * 0.6, 64, 18);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.09, 34)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isYes ? 'ДА' : 'НЕТ', W / 2, H * 0.52 + 32);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = `${Math.min(W * 0.033, 14)}px Arial`;
      ctx.fillText(isYes ? 'Вселенная говорит «да» ✨' : 'Значит, не сейчас 🌙', W / 2, H * 0.64);

      this.buttons.push(createButton(ctx, W / 2 - 90, H * 0.70, 180, 46, '🔄 Ещё раз', {
        bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    }
  }

  drawRps(ctx, W, H) {
    const r = this.rps;
    const hands = [
      { id: 'rock', emoji: '✊', name: 'Камень' },
      { id: 'scissors', emoji: '✌️', name: 'Ножницы' },
      { id: 'paper', emoji: '✋', name: 'Бумага' }
    ];
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(r.msg || 'Выбери жест', W / 2, H * 0.18);
    if (r.pet) {
      const pet = hands.find(h => h.id === r.pet);
      const mine = hands.find(h => h.id === r.pick);
      ctx.font = `${Math.min(W * 0.12, 52)}px Arial`;
      ctx.fillText((mine ? mine.emoji : '') + '   ' + (pet ? pet.emoji : ''), W / 2, H * 0.30);
      ctx.font = `${Math.min(W * 0.032, 14)}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('ты          {pet}', W / 2, H * 0.36);
    }
    const bw = Math.min(W * 0.26, 100);
    const gap = 10;
    const total = hands.length * bw + gap * 2;
    const x0 = (W - total) / 2;
    hands.forEach((h, i) => {
      const x = x0 + i * (bw + gap);
      const y = H * 0.46;
      ctx.fillStyle = r.pick === h.id ? '#6BCB77' : 'rgba(255,255,255,0.16)';
      roundRect(ctx, x, y, bw, 78, 14);
      ctx.fill();
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(h.emoji, x + bw / 2, y + 30);
      ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
      ctx.fillText(h.name, x + bw / 2, y + 58);
      this.buttons.push({ x: x, y: y, w: bw, h: 78, action: 'rps:' + h.id });
    });
    ctx.textBaseline = 'alphabetic';
  }

  drawSimon(ctx, W, H) {
    const s = this.simon;
    const best = (typeof System !== 'undefined' && System.progress) ? (System.progress.simonBest || 0) : 0;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(s.note || 'Огоньки', W / 2, H * 0.18);
    ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Рекорд: ' + best, W / 2, H * 0.22);
    this.simonPads(W, H).forEach((p, i) => {
      const on = s.lit === i;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = on ? 1 : 0.38;
      ctx.beginPath();
      ctx.arc(p.x, p.y, on ? p.r + 4 : p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.buttons.push({
        x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2,
        action: 'simon:' + i
      });
    });
    if (s.phase === 'fail' || s.phase === 'idle') {
      this.buttons.push(createButton(ctx, W / 2 - 80, H * 0.72, 160, 44, '🔄 Заново', {
        bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    }
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    // Back button
    if (this.buttons[0] && isPointInRect(mx, my, this.buttons[0].x, this.buttons[0].y, this.buttons[0].w, this.buttons[0].h)) {
      if (this.mode === 'select') {
        this.game.transitionTo('map');
      } else {
        this.mode = 'select';
      }
      return true;
    }

    // Кнопка «Заново» — вторая в каждой игре (после «Назад»). Проверяем её
    // ДО логики партии: раньше обработчик стоял внутри «партия ещё идёт», и
    // после победы или ничьей кнопка не нажималась — это и был баг.
    if ((this.mode === 'ticTacToe' || this.mode === 'memory') && this.buttons.length > 1) {
      const b = this.buttons[1];
      if (isPointInRect(mx, my, b.x, b.y, b.w, b.h)) {
        if (this.mode === 'ticTacToe') this.initTTT();
        else this.initMemory();
        return true;
      }
    }

    if (this.mode === 'select') {
      for (let i = 1; i < this.buttons.length; i++) {
        const btn = this.buttons[i];
        if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
          switch (btn.action) {
            case 'tictactoe': this.initTTT(); System.countAction('minigames'); break;
            case 'memory': this.initMemory(); System.countAction('minigames'); break;
            case 'coinflip': this.initCoinFlip(); System.countAction('minigames'); break;
            case 'rps': this.initRps(); System.countAction('minigames'); break;
            case 'simon': this.initSimon(); System.countAction('minigames'); break;
          }
          return true;
        }
      }
    }

    if (this.mode === 'ticTacToe' && !this.ttt.over) {
      // Board click
      const cellSize = Math.min(this.game.width * 0.22, 80);
      const offsetX = (this.game.width - cellSize * 3) / 2;
      const offsetY = this.game.height * 0.15;
      const col = Math.floor((mx - offsetX) / cellSize);
      const row = Math.floor((my - offsetY) / cellSize);
      if (col >= 0 && col < 3 && row >= 0 && row < 3) {
        const idx = row * 3 + col;
        if (!this.ttt.board[idx]) {
          this.ttt.board[idx] = 'X';
          AudioSys.play('click');
          if (this.checkTTTWin('X')) {
            this.ttt.over = true;
            this.ttt.winner = 'X';
            System.countAction('tttWins');
            System.earnCoins(20);
            System.addXP(10);
            System.stats.happiness = Math.min(100, System.stats.happiness + 10);
            System.saveGame();
            AudioSys.play('success');
          } else if (this.ttt.board.every(c => c)) {
            this.ttt.over = true;
            this.ttt.winner = 'draw';
            AudioSys.play('fail');
          } else {
            this.aiMove();
            if (this.checkTTTWin('O')) {
              this.ttt.over = true;
              this.ttt.winner = 'O';
              System.stats.happiness = Math.max(0, System.stats.happiness - 5);
              AudioSys.play('fail');
            } else if (this.ttt.board.every(c => c)) {
              this.ttt.over = true;
              this.ttt.winner = 'draw';
            }
          }
          return true;
        }
      }
    }

    if (this.mode === 'memory') {
      const m = this.memory;
      // Партия окончена: награда уже выдана, остаётся «Заново» (обработана выше)
      if (m.done) return true;
      const cols = 4;
      const cellSize = Math.min(this.game.width * 0.2, 70);
      const gap = 6;
      const offsetX = (this.game.width - (cols * (cellSize + gap) - gap)) / 2;
      const offsetY = this.game.height * 0.12;
      const col = Math.floor((mx - offsetX) / (cellSize + gap));
      const row = Math.floor((my - offsetY) / (cellSize + gap));
      if (col >= 0 && col < 4 && row >= 0 && row < 4) {
        const idx = row * 4 + col;
        if (!m.matched[idx] && !m.flipped.includes(idx) && m.flipped.length < 2) {
          m.flipped.push(idx);
          AudioSys.play('click');
          if (m.flipped.length === 2) {
            m.moves++;
            const [a, b] = m.flipped;
            if (m.cards[a] === m.cards[b]) {
              m.matched[a] = true;
              m.matched[b] = true;
              m.flipped = [];
              AudioSys.play('success');
              // Награда — ровно один раз за партию (раньше монетки капали
              // на каждый клик после победы, пока не нажмёшь «Заново»)
              if (m.matched.every(x => x) && !m.done) {
                m.done = true;
                System.earnCoins(15);
                System.addXP(8);
                System.stats.happiness = Math.min(100, System.stats.happiness + 10);
                System.saveGame();
              }
            } else {
              setTimeout(() => {
                m.flipped = [];
              }, 800);
              AudioSys.play('fail');
            }
          }
          return true;
        }
      }
    }

    if (this.mode === 'rps') {
      for (const btn of this.buttons) {
        if (!btn.action || btn.action.indexOf('rps:') !== 0) continue;
        if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
        this.playRps(btn.action.slice(4));
        return true;
      }
      return true;
    }

    if (this.mode === 'simon') {
      for (const btn of this.buttons) {
        if (btn.text && btn.text.indexOf('Заново') !== -1 &&
            isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
          this.initSimon();
          return true;
        }
      }
      if (this.simon.phase !== 'input') return true;
      const pads = this.simonPads(this.game.width, this.game.height);
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        const dx = mx - p.x, dy = my - p.y;
        if (dx * dx + dy * dy > p.r * p.r) continue;
        const s = this.simon;
        s.lit = i;
        if (i !== s.seq[s.input]) {
          s.phase = 'fail';
          s.note = 'Почти! Рекорд ' + ((System.progress && System.progress.simonBest) || 0);
          AudioSys.play('fail');
          return true;
        }
        s.input++;
        AudioSys.play('click');
        if (s.input >= s.seq.length) {
          const pgr = System.ensureProgress();
          if (s.seq.length > pgr.simonBest) {
            pgr.simonBest = s.seq.length;
            System.checkAchievements();
          }
          System.earnCoins(2);
          System.addXP(1);
          System.saveGame();
          AudioSys.play('success');
          s.phase = 'gap';
          s.note = 'Верно! Дальше ' + (s.seq.length + 1);
          setTimeout(() => {
            if (this.mode === 'simon' && this.simon.phase === 'gap') this.simonExtend();
          }, 700);
        }
        return true;
      }
      return true;
    }

    if (this.mode === 'coinFlip') {
      const cf = this.coinFlip;
      if (cf.state === 'ready' || cf.state === 'done') {
        cf.state = 'flipping';
        cf.timer = 0;
        cf.angle = 0;
        cf.result = null;
      }
      return true;
    }

    return false;
  }

  playRps(pick) {
    const hands = ['rock', 'scissors', 'paper'];
    const pet = hands[Math.floor(Math.random() * 3)];
    const beat = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    let msg = 'Ничья';
    if (beat[pick] === pet) {
      msg = 'Ты выиграл!';
      System.countAction('rpsWins');
      System.earnCoins(8);
      System.addXP(4);
      System.stats.happiness = Math.min(100, System.stats.happiness + 4);
      AudioSys.play('success');
    } else if (beat[pet] === pick) {
      msg = '{Pet} выиграл';
      AudioSys.play('fail');
    } else {
      AudioSys.play('click');
    }
    System.saveGame();
    this.rps = { pick: pick, pet: pet, msg: msg };
  }

  aiMove() {
    const b = this.ttt.board;
    // Try to win
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        if (this.checkTTTWin('O')) { b[this.ttt._testPos] = null; return; }
        b[i] = null;
      }
    }
    // Try to block
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'X';
        if (this.checkTTTWin('X')) { b[i] = 'O'; return; }
        b[i] = null;
      }
    }
    // Center
    if (!b[4]) { b[4] = 'O'; return; }
    // Random
    const empty = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (empty.length > 0) b[empty[Math.floor(Math.random() * empty.length)]] = 'O';
  }

  checkTTTWin(p) {
    const b = this.ttt.board;
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => w.every(i => b[i] === p));
  }
}
window.MinigamesScene = MinigamesScene;
