// ============ СЦЕНА МИНИ-ИГР ============
class MinigamesScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.mode = 'select'; // select, ticTacToe, memory, coinFlip
    this.ttt = { board: Array(9).fill(null), turn: 'X', over: false, winner: null };
    this.memory = { cards: [], flipped: [], matched: [], moves: 0, ready: false };
    this.coinFlip = { state: 'none', timer: 0, result: null };
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
    this.memory = { cards: emojis, flipped: [null, null], matched: Array(16).fill(false), moves: 0, ready: false };
    this.mode = 'memory';
  }

  initCoinFlip() {
    this.coinFlip = { state: 'waiting', timer: 0, target: 0.7, result: null };
    this.mode = 'coinFlip';
  }

  update(dt) {
    this.time += dt;
    if (this.mode === 'coinFlip' && this.coinFlip.state === 'flipping') {
      this.coinFlip.timer += dt;
      if (this.coinFlip.timer > 1000) {
        const success = this.coinFlip.timer / 1000 >= this.coinFlip.target - 0.1 && this.coinFlip.timer / 1000 <= this.coinFlip.target + 0.15;
        this.coinFlip.result = success ? 'heads' : 'tails';
        this.coinFlip.state = 'done';
        if (success) {
          const reward = randInt(10, 30);
          System.earnCoins(reward);
          System.stats.happiness = Math.min(100, System.stats.happiness + 10);
          System.showAchievement('🪙', '+' + reward + ' монет!');
          AudioSys.play('coin');
        } else {
          AudioSys.play('fail');
        }
        System.addXP(3);
        System.saveGame();
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

    if (this.mode === 'select') {
      this.drawSelect(ctx, W, H);
    } else if (this.mode === 'ticTacToe') {
      this.drawTTT(ctx, W, H);
    } else if (this.mode === 'memory') {
      this.drawMemory(ctx, W, H);
    } else if (this.mode === 'coinFlip') {
      this.drawCoinFlip(ctx, W, H);
    }
  }

  drawSelect(ctx, W, H) {
    const games = [
      { id: 'tictactoe', emoji: '❌⭕', name: 'Крестики-нолики', desc: 'Сыграй против Гофера', color: '#FF6B6B' },
      { id: 'memory', emoji: '🧠', name: 'Memory', desc: 'Найди пары карточек', color: '#9B59B6' },
      { id: 'coinflip', emoji: '🪙', name: 'Бросай монету', desc: 'Поймай тайминг!', color: '#FFD93D' }
    ];

    const btnW = Math.min(W * 0.7, 280);
    const btnH = 80;
    const startX = (W - btnW) / 2;

    games.forEach((g, i) => {
      const y = H * 0.15 + i * (btnH + 20);

      ctx.fillStyle = g.color;
      roundRect(ctx, startX, y, btnW, btnH, 15);
      ctx.fill();

      ctx.font = `${btnW * 0.25}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(g.emoji, startX + 15, y + btnH / 2 - 10);

      ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`;
      ctx.fillText(g.name, startX + btnW * 0.3, y + btnH / 2 - 10);

      ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(g.desc, startX + btnW * 0.3, y + btnH / 2 + 12);

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
      ctx.fillText(this.ttt.turn === 'X' ? 'Ваш ход! ❌' : 'Гофер думает... ⭕', W / 2, offsetY + cellSize * 3 + 35);
    } else {
      const msg = this.ttt.winner === 'draw' ? '🤝 Ничья!' : this.ttt.winner === 'X' ? '🎉 Вы победили!' : '😢 Гофер победил!';
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

    if (cf.state === 'waiting') {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Нажмите КОГДА захотите!', W / 2, H * 0.35);

      ctx.font = `${Math.min(W * 0.035, 16)}px Arial`;
      ctx.fillStyle = '#aaa';
      ctx.fillText('Таймер крутится... жмите в зелёную зону!', W / 2, H * 0.42);

      this.buttons.push(createButton(ctx, W / 2 - 80, H * 0.5, 160, 50, '🪙 Бросить!', {
        bgColor: '#FFD93D',
        fgColor: '#333',
        fontSize: 18,
        radius: 15
      }));
    } else if (cf.state === 'flipping') {
      // Spinning bar
      const barW = W * 0.7;
      const barX = (W - barW) / 2;
      const barY = H * 0.4;

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      roundRect(ctx, barX, barY, barW, 30, 15);
      ctx.fill();

      // Target zone (green)
      const targetStart = barX + barW * (cf.target - 0.1);
      const targetEnd = barX + barW * Math.min(cf.target + 0.15, 1);
      ctx.fillStyle = 'rgba(107, 203, 119, 0.5)';
      roundRect(ctx, targetStart, barY, targetEnd - targetStart, 30, cf.target - 0.1 < 0 ? 15 : 0);
      ctx.fill();

      // Indicator
      const progress = Math.min(cf.timer / 1000, 1);
      ctx.fillStyle = '#FF6B6B';
      roundRect(ctx, barX + progress * barW - 3, barY - 5, 6, 40, 3);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.04, 20)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('⬆️ ЖМИТЕ!', W / 2, H * 0.25);
    } else if (cf.state === 'done') {
      const won = cf.result === 'heads';
      ctx.fillStyle = won ? 'rgba(107, 203, 119, 0.3)' : 'rgba(255, 107, 107, 0.3)';
      roundRect(ctx, W * 0.15, H * 0.3, W * 0.7, 100, 20);
      ctx.fill();

      ctx.font = `${Math.min(W * 0.3, 60)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(won ? '🪙' : '❌', W / 2, H * 0.38);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.05, 24)}px Arial`;
      ctx.fillText(won ? 'Победа!' : 'Мимо!', W / 2, H * 0.48);
    }
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    // Back button
    if (this.buttons[0] && isPointInRect(mx, my, this.buttons[0].x, this.buttons[0].y, this.buttons[0].w, this.buttons[0].h)) {
      this.mode = 'select';
      return true;
    }

    if (this.mode === 'select') {
      for (let i = 1; i < this.buttons.length; i++) {
        const btn = this.buttons[i];
        if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
          switch (btn.action) {
            case 'tictactoe': this.initTTT(); break;
            case 'memory': this.initMemory(); break;
            case 'coinflip': this.initCoinFlip(); break;
          }
          return true;
        }
      }
    }

    if (this.mode === 'ticTacToe' && !this.ttt.over) {
      // Check restart
      if (this.buttons.length > 1 && isPointInRect(mx, my, this.buttons[1].x, this.buttons[1].y, this.buttons[1].w, this.buttons[1].h)) {
        this.initTTT();
        return true;
      }
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
      // Restart
      if (this.buttons.length > 1 && isPointInRect(mx, my, this.buttons[1].x, this.buttons[1].y, this.buttons[1].w, this.buttons[1].h)) {
        this.initTTT();
        return true;
      }
    }

    if (this.mode === 'memory') {
      const m = this.memory;
      if (m.matched.every(x => x)) {
        System.earnCoins(15);
        System.addXP(8);
        System.stats.happiness = Math.min(100, System.stats.happiness + 10);
        System.saveGame();
        AudioSys.play('success');
        if (this.buttons.length > 1 && isPointInRect(mx, my, this.buttons[1].x, this.buttons[1].y, this.buttons[1].w, this.buttons[1].h)) {
          this.initMemory();
        }
        return true;
      }
      if (this.buttons.length > 1 && isPointInRect(mx, my, this.buttons[1].x, this.buttons[1].y, this.buttons[1].w, this.buttons[1].h)) {
        this.initMemory();
        return true;
      }
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

    if (this.mode === 'coinFlip') {
      const cf = this.coinFlip;
      if (cf.state === 'waiting') {
        cf.state = 'flipping';
        cf.timer = 0;
        cf.target = randFloat(0.4, 0.9);
        return true;
      } else if (cf.state === 'flipping') {
        cf.state = 'done';
        const success = cf.timer / 1000 >= cf.target - 0.1 && cf.timer / 1000 <= cf.target + 0.15;
        cf.result = success ? 'heads' : 'tails';
        if (success) {
          const reward = randInt(10, 30);
          System.earnCoins(reward);
          System.stats.happiness = Math.min(100, System.stats.happiness + 10);
          System.showAchievement('🪙', '+' + reward + ' монет!');
          AudioSys.play('coin');
        } else {
          AudioSys.play('fail');
        }
        System.addXP(3);
        System.saveGame();
        return true;
      }
    }

    return false;
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
