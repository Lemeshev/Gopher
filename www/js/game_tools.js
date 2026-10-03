// Полезные инструменты: калькулятор, заметки, списки, доска, таймер,
// таблица умножения и случайный выбор. Всё считается на экране, сеть не нужна.
class ToolsScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.tool = 'menu';
    this.expr = '';
    this.calc = '0';
    this.listId = null;
    this.board = [];
    this.stroke = null;
    this.ask = null;
  }

  init() {
    this.buttons = [];
    this.tool = 'menu';
    this.expr = '';
    this.calc = '0';
    this.listId = null;
    this.ask = null;
    if (!System.kit) System.kit = { notes: '', lists: [], timerEnd: 0 };
    if (!Array.isArray(this.board)) this.board = [];
    this.hideBar();
  }

  hideBar() {
    const bar = document.getElementById('kitBar');
    if (bar) bar.className = '';
    this.ask = null;
  }

  showBar(placeholder, mode) {
    const bar = document.getElementById('kitBar');
    const input = document.getElementById('kitInput');
    if (!bar || !input) return;
    bar.className = 'open';
    input.placeholder = placeholder;
    input.value = mode === 'notes' ? (System.kit.notes || '') : '';
    this.ask = mode;
    const self = this;
    if (!bar._bound) {
      bar._bound = true;
      document.getElementById('kitOk').addEventListener('click', () => self.commitBar());
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') self.commitBar(); });
    }
  }

  commitBar() {
    const input = document.getElementById('kitInput');
    if (!input) return;
    const text = String(input.value || '').slice(0, 400);
    if (this.ask === 'notes') {
      System.kit.notes = text;
      System.saveGame();
      return;
    }
    if (this.ask === 'list-name' && text.trim()) {
      const id = 'l' + Date.now();
      System.kit.lists.push({ id: id, title: text.trim().slice(0, 40), items: [] });
      this.listId = id;
      System.saveGame();
      input.value = '';
      this.showBar('Пункт списка', 'list-item');
      return;
    }
    if (this.ask === 'list-item' && text.trim()) {
      const list = this.currentList();
      if (list) list.items.push({ text: text.trim().slice(0, 80), done: false });
      System.saveGame();
      input.value = '';
    }
  }

  currentList() {
    const lists = (System.kit && System.kit.lists) || [];
    return lists.find(l => l.id === this.listId) || null;
  }

  update() {}

  draw(ctx) {
    const W = this.game.width, H = this.game.height;
    this.buttons = [];
    ctx.fillStyle = '#14302c';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Полезные инструменты', W / 2, 36);
    if (this.tool === 'menu') this.drawMenu(ctx, W, H);
    else if (this.tool === 'calc') this.drawCalc(ctx, W, H);
    else if (this.tool === 'notes') this.drawNotes(ctx, W, H);
    else if (this.tool === 'lists') this.drawLists(ctx, W, H);
    else if (this.tool === 'board') this.drawBoard(ctx, W, H);
    else if (this.tool === 'timer') this.drawTimer(ctx, W, H);
    else if (this.tool === 'table') this.drawTable(ctx, W, H);
    else if (this.tool === 'pick') this.drawPick(ctx, W, H);
    this.buttons.push(createButton(ctx, 16, H - 52, W - 32, 40, this.tool === 'menu' ? '← На карту' : '← К инструментам', {
      bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 16, radius: 12
    }));
  }

  drawMenu(ctx, W, H) {
    const items = [
      ['calc', '🔢', 'Калькулятор'],
      ['notes', '📝', 'Заметки'],
      ['lists', '✅', 'Списки'],
      ['board', '🎨', 'Доска'],
      ['timer', '⏱️', 'Таймер'],
      ['table', '✖️', 'Умножение'],
      ['pick', '🎲', 'Выбор']
    ];
    const cols = 2;
    const bw = (W - 36) / cols;
    const bh = 72;
    items.forEach((it, i) => {
      const x = 12 + (i % cols) * bw;
      const y = 58 + Math.floor(i / cols) * (bh + 8);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRect(ctx, x, y, bw - 8, bh, 12);
      ctx.fill();
      ctx.font = '22px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText(it[1], x + (bw - 8) / 2, y + 28);
      ctx.font = 'bold 15px Arial';
      ctx.fillText(it[2], x + (bw - 8) / 2, y + 52);
      this.buttons.push({ x: x, y: y, w: bw - 8, h: bh, action: 'tool:' + it[0] });
    });
  }

  drawCalc(ctx, W, H) {
    ctx.fillStyle = '#0e2420';
    roundRect(ctx, 16, 56, W - 32, 54, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(this.calc, W - 28, 92);
    ctx.textAlign = 'center';
    const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', 'C', '=', '+'];
    const cols = 4;
    const cw = (W - 32) / cols;
    const ch = 52;
    keys.forEach((k, i) => {
      const x = 16 + (i % cols) * cw;
      const y = 124 + Math.floor(i / cols) * (ch + 6);
      ctx.fillStyle = k === '=' ? '#6BCB77' : (k === 'C' ? '#E74C3C' : 'rgba(255,255,255,0.16)');
      roundRect(ctx, x, y, cw - 6, ch, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(k, x + (cw - 6) / 2, y + 34);
      this.buttons.push({ x: x, y: y, w: cw - 6, h: ch, action: 'key:' + k });
    });
  }

  pressCalc(key) {
    if (key === 'C') { this.expr = ''; this.calc = '0'; return; }
    if (key === '=') { this.calc = this.evalCalc(this.expr); this.expr = this.calc === 'нельзя' ? '' : this.calc; return; }
    const op = { '÷': '/', '×': '*', '−': '-', '+': '+' }[key] || key;
    if (this.expr.length > 24) return;
    this.expr += op;
    this.calc = this.expr;
  }

  evalCalc(expr) {
    if (!/^[0-9+\-*/.]+$/.test(expr || '')) return '0';
    const parts = expr.split(/([+\-*/])/).filter(Boolean);
    if (!parts.length) return '0';
    let acc = parseFloat(parts[0]);
    if (!isFinite(acc)) return '0';
    for (let i = 1; i < parts.length; i += 2) {
      const op = parts[i];
      const n = parseFloat(parts[i + 1]);
      if (!isFinite(n)) break;
      if (op === '+') acc += n;
      else if (op === '-') acc -= n;
      else if (op === '*') acc *= n;
      else if (op === '/') {
        if (n === 0) return 'нельзя';
        acc /= n;
      }
    }
    if (!isFinite(acc)) return '0';
    const rounded = Math.round(acc * 1000) / 1000;
    return String(rounded);
  }

  drawNotes(ctx, W, H) {
    this.showBar('Напиши заметку', 'notes');
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '16px Arial';
    const text = (System.kit && System.kit.notes) || 'Здесь можно записать мысль. Поле внизу экрана.';
    this.wrap(ctx, text, W / 2, 90, W - 40, 22);
  }

  drawLists(ctx, W, H) {
    const lists = (System.kit && System.kit.lists) || [];
    if (!this.listId) {
      this.showBar('Название нового списка', 'list-name');
      lists.forEach((list, i) => {
        const y = 64 + i * 54;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        roundRect(ctx, 16, y, W - 32, 48, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.fillText(list.title + ' · ' + list.items.length, W / 2, y + 30);
        this.buttons.push({ x: 16, y: y, w: W - 32, h: 48, action: 'open-list:' + list.id });
      });
      if (!lists.length) {
        ctx.fillStyle = '#d7fff4';
        ctx.fillText('Списка ещё нет. Напиши название внизу и нажми Ок.', W / 2, 100);
      }
      return;
    }
    const list = this.currentList();
    if (!list) { this.listId = null; return; }
    this.showBar('Новый пункт', 'list-item');
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(list.title, W / 2, 70);
    list.items.forEach((item, i) => {
      const y = 84 + i * 46;
      ctx.fillStyle = item.done ? 'rgba(107,203,119,0.35)' : 'rgba(255,255,255,0.12)';
      roundRect(ctx, 16, y, W - 32, 42, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText((item.done ? '☑ ' : (i + 1) + '. ') + item.text, 28, y + 26);
      ctx.textAlign = 'center';
      this.buttons.push({ x: 16, y: y, w: W - 90, h: 42, action: 'toggle:' + i });
      ctx.fillStyle = '#E74C3C';
      roundRect(ctx, W - 68, y + 6, 40, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('✕', W - 48, y + 26);
      this.buttons.push({ x: W - 68, y: y + 6, w: 40, h: 30, action: 'del-item:' + i });
    });
  }

  drawBoard(ctx, W, H) {
    this.hideBar();
    const pad = { x: 16, y: 58, w: W - 32, h: H - 130 };
    ctx.fillStyle = '#f7f1e3';
    roundRect(ctx, pad.x, pad.y, pad.w, pad.h, 12);
    ctx.fill();
    this.pad = pad;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.x, pad.y, pad.w, pad.h);
    ctx.clip();
    ctx.strokeStyle = '#24324a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    this.board.forEach(stroke => {
      if (!stroke.length) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
    ctx.restore();
    this.buttons.push(createButton(ctx, W / 2 - 70, pad.y + pad.h + 8, 140, 36, 'Стереть', {
      bgColor: '#E74C3C', fgColor: '#fff', fontSize: 16, radius: 10
    }));
  }

  beginDrag(x, y) {
    if (this.tool !== 'board' || !this.pad) return false;
    const p = this.pad;
    if (x < p.x || y < p.y || x > p.x + p.w || y > p.y + p.h) return false;
    this.stroke = [{ x: x, y: y }];
    this.board.push(this.stroke);
    return true;
  }

  dragMove(x, y) {
    if (!this.stroke) return;
    this.stroke.push({ x: x, y: y });
  }

  endDrag() { this.stroke = null; }

  drawTimer(ctx, W, H) {
    this.hideBar();
    const left = Math.max(0, Math.ceil(((System.kit && System.kit.timerEnd) || 0) - Date.now()) / 1000);
    const m = Math.floor(left / 60);
    const s = Math.floor(left % 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText((m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s, W / 2, 140);
    [1, 3, 5].forEach((min, i) => {
      const x = 20 + i * ((W - 40) / 3);
      this.buttons.push(createButton(ctx, x, 180, (W - 56) / 3, 48, min + ' мин', {
        bgColor: '#00897B', fgColor: '#fff', fontSize: 16, radius: 10
      }));
    });
    if (left <= 0 && System.kit && System.kit.timerEnd) {
      ctx.fillStyle = '#ffe082';
      ctx.font = '18px Arial';
      ctx.fillText('Время вышло.', W / 2, 270);
    }
  }

  drawTable(ctx, W, H) {
    this.hideBar();
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    for (let a = 2; a <= 9; a++) {
      const y = 64 + (a - 2) * 52;
      ctx.fillText(a + ' × ' + a + ' = ' + (a * a), W / 2, y);
      this.buttons.push({ x: 20, y: y - 16, w: W - 40, h: 40, action: 'noop' });
    }
  }

  drawPick(ctx, W, H) {
    this.hideBar();
    const list = this.currentList();
    const names = (list && list.items.length) ? list.items.map(it => it.text) : ['мама', 'папа', 'я'];
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText(this.picked || 'Нажми, и игра выберет.', W / 2, 120);
    this.buttons.push(createButton(ctx, W / 2 - 90, 160, 180, 48, 'Выбрать', {
      bgColor: '#6BCB77', fgColor: '#102014', fontSize: 18, radius: 12
    }));
    this._names = names;
  }

  wrap(ctx, text, x, y, maxW, lh) {
    const words = String(text).split(' ');
    let line = '';
    let yy = y;
    words.forEach(word => {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > maxW) {
        ctx.fillText(line, x, yy);
        line = word;
        yy += lh;
      } else line = next;
    });
    if (line) ctx.fillText(line, x, yy);
  }

  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const a = btn.action || '';
      const t = btn.text || '';
      if (t.indexOf('На карту') !== -1) {
        this.hideBar();
        this.game.transitionTo('map');
        return true;
      }
      if (t.indexOf('К инструментам') !== -1) {
        this.tool = 'menu';
        this.listId = null;
        this.hideBar();
        return true;
      }
      if (a.indexOf('tool:') === 0) {
        this.tool = a.slice(5);
        if (this.tool !== 'notes' && this.tool !== 'lists') this.hideBar();
        return true;
      }
      if (a.indexOf('key:') === 0) { this.pressCalc(a.slice(4)); return true; }
      if (a.indexOf('open-list:') === 0) { this.listId = a.slice(10); return true; }
      if (a.indexOf('toggle:') === 0) {
        const list = this.currentList();
        const item = list && list.items[parseInt(a.slice(7), 10)];
        if (item) { item.done = !item.done; System.saveGame(); }
        return true;
      }
      if (a.indexOf('del-item:') === 0) {
        const list = this.currentList();
        const i = parseInt(a.slice(9), 10);
        if (list) { list.items.splice(i, 1); System.saveGame(); }
        return true;
      }
      if (t === 'Стереть') { this.board = []; return true; }
      if (t.indexOf('мин') !== -1) {
        const min = parseInt(t, 10) || 1;
        System.kit.timerEnd = Date.now() + min * 60000;
        System.saveGame();
        return true;
      }
      if (t === 'Выбрать') {
        const names = this._names || ['я'];
        this.picked = names[Math.floor(Math.random() * names.length)];
        return true;
      }
      return true;
    }
    return false;
  }
}

window.ToolsScene = ToolsScene;
