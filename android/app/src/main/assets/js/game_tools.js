// Поле ввода поверх игры. Его нельзя переписывать каждый кадр: иначе буква
// пропадает сразу после нажатия.
const KitBar = {
  onOk: null,
  live: null,
  open(placeholder, value, onOk, live) {
    const bar = document.getElementById('kitBar');
    const input = document.getElementById('kitInput');
    if (!bar || !input) return;
    this.onOk = onOk || null;
    this.live = live || null;
    bar.className = 'open';
    input.placeholder = placeholder || '';
    if (document.activeElement !== input) input.value = value || '';
    const self = this;
    if (!bar._bound) {
      bar._bound = true;
      document.getElementById('kitOk').addEventListener('click', () => self.commit());
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') self.commit(); });
      input.addEventListener('input', () => { if (self.live) self.live(input.value); });
    }
    try { input.focus(); } catch (e) {}
  },
  commit() {
    const input = document.getElementById('kitInput');
    const text = input ? String(input.value || '').slice(0, 400) : '';
    if (this.onOk) this.onOk(text);
  },
  close() {
    const bar = document.getElementById('kitBar');
    if (bar) bar.className = '';
    this.onOk = null;
    this.live = null;
  }
};
window.KitBar = KitBar;

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
    this.pen = '#24324a';
    this.penW = 6;
    this.rangFor = 0;
    this.watch = { run: false, acc: 0, at: 0, laps: [] };
  }

  init() {
    this.buttons = [];
    this.tool = 'menu';
    this.expr = '';
    this.calc = '0';
    this.listId = null;
    this.pen = '#24324a';
    this.penW = 6;
    if (!System.kit) System.kit = { notes: '', lists: [], timerEnd: 0 };
    KitBar.close();
  }

  update() {
    const end = System.kit && System.kit.timerEnd;
    if (!end) return;
    if (Date.now() < end) {
      if (this.rangFor === end) this.rangFor = 0;
      return;
    }
    if (this.rangFor === end) return;
    this.rangFor = end;
    this.ring();
  }

  ring() {
    try { if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 500]); } catch (e) {}
    if (typeof AudioSys === 'undefined' || !AudioSys.isSoundOn || !AudioSys.isSoundOn()) return;
    if (!AudioSys.ctx) AudioSys.init();
    AudioSys.play('alarm');
    setTimeout(() => { try { AudioSys.play('alarm'); } catch (e) {} }, 800);
  }

  currentList() {
    const lists = (System.kit && System.kit.lists) || [];
    return lists.find(l => l.id === this.listId) || null;
  }

  draw(ctx) {
    const W = this.game.width, H = this.game.height;
    this.buttons = [];
    ctx.fillStyle = '#12312c';
    ctx.fillRect(0, 0, W, H);
    this.buttons.push(createButton(ctx, 10, 10, this.tool === 'menu' ? 110 : 148, 36,
      this.tool === 'menu' ? '← На карту' : '← К списку', {
        bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 14, radius: 10
      }));
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Arial';
    const titles = {
      menu: 'Инструменты', calc: 'Калькулятор', notes: 'Заметки',
      lists: 'Списки', board: 'Доска', timer: 'Таймер', watch: 'Секундомер'
    };
    ctx.fillText(titles[this.tool] || 'Инструменты', W / 2, 34);
    if (this.tool === 'menu') this.drawMenu(ctx, W, H);
    else if (this.tool === 'calc') this.drawCalc(ctx, W, H);
    else if (this.tool === 'notes') this.drawNotes(ctx, W, H);
    else if (this.tool === 'lists') this.drawLists(ctx, W, H);
    else if (this.tool === 'board') this.drawBoard(ctx, W, H);
    else if (this.tool === 'timer') this.drawTimer(ctx, W, H);
    else if (this.tool === 'watch') this.drawWatch(ctx, W, H);
  }

  drawMenu(ctx, W, H) {
    const items = [
      { id: 'calc', emoji: '🔢', name: 'Калькулятор', desc: 'Считает по порядку', color: '#1F6F5B' },
      { id: 'notes', emoji: '📝', name: 'Заметки', desc: 'Короткий текст', color: '#3D6B8C' },
      { id: 'lists', emoji: '✅', name: 'Списки', desc: 'Отметить и убрать', color: '#6B5B3D' },
      { id: 'board', emoji: '🎨', name: 'Доска', desc: 'Рисунок пальцем', color: '#8C4A6B' },
      { id: 'timer', emoji: '⏱️', name: 'Таймер', desc: 'Звонок в конце', color: '#8C5A2E' },
      { id: 'watch', emoji: '⌚', name: 'Секундомер', desc: 'Круги по ходу', color: '#3D5A8C' }
    ];
    const btnW = Math.min(W * 0.78, 300);
    const gap = 8;
    const btnH = Math.max(48, Math.min(64, (H * 0.78 - 70) / items.length - gap));
    const startX = (W - btnW) / 2;
    items.forEach((g, i) => {
      const y = 64 + i * (btnH + gap);
      ctx.fillStyle = g.color;
      roundRect(ctx, startX, y, btnW, btnH, 14);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = '26px Arial';
      ctx.fillText(g.emoji, startX + 14, y + btnH / 2);
      ctx.font = 'bold 17px Arial';
      ctx.fillText(g.name, startX + 58, y + btnH / 2 - 10);
      ctx.font = '13px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(g.desc, startX + 58, y + btnH / 2 + 12);
      ctx.textBaseline = 'alphabetic';
      this.buttons.push({ x: startX, y: y, w: btnW, h: btnH, action: 'tool:' + g.id });
    });
  }

  drawCalc(ctx, W, H) {
    ctx.fillStyle = '#0c241f';
    roundRect(ctx, 16, 58, W - 32, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#d7fff4';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const shown = this.calc.length > 14 ? this.calc.slice(-14) : this.calc;
    ctx.fillText(shown, W - 28, 90);
    ctx.textAlign = 'center';
    const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', 'C', '=', '+'];
    const cols = 4;
    const cw = (W - 28) / cols;
    const ch = Math.min(58, (H - 160) / 4 - 6);
    keys.forEach((k, i) => {
      const x = 14 + (i % cols) * cw;
      const y = 138 + Math.floor(i / cols) * (ch + 8);
      let bg = '#1d4a42';
      if ('÷×−+'.indexOf(k) !== -1) bg = '#0e7c66';
      if (k === '=') bg = '#6BCB77';
      if (k === 'C') bg = '#c4564a';
      roundRect(ctx, x, y, cw - 8, ch, 12);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.fillStyle = k === '=' ? '#102014' : '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(k, x + (cw - 8) / 2, y + ch / 2);
      this.buttons.push({ x: x, y: y, w: cw - 8, h: ch, action: 'key:' + k });
    });
    ctx.textBaseline = 'alphabetic';
  }

  pressCalc(key) {
    if (key === 'C') { this.expr = ''; this.calc = '0'; return; }
    if (key === '=') {
      this.calc = this.evalCalc(this.expr);
      this.expr = this.calc === 'нельзя' ? '' : this.calc;
      return;
    }
    const op = { '÷': '/', '×': '*', '−': '-', '+': '+' }[key] || key;
    if ('+-*/'.indexOf(op) !== -1 && !this.expr) return;
    if ('+-*/'.indexOf(op) !== -1 && /[+\-*/]$/.test(this.expr)) {
      this.expr = this.expr.slice(0, -1) + op;
    } else if (this.expr.length < 28) this.expr += op;
    this.calc = this.expr || '0';
  }

  // Слева направо: 9×2+2÷2 = ((9×2)+2)÷2 = 10.
  evalCalc(expr) {
    if (!/^[0-9+\-*/.]+$/.test(expr || '')) return '0';
    const parts = expr.split(/([+\-*/])/).filter(s => s !== '');
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
    const self = this;
    if (!this._notesOpen) {
      this._notesOpen = true;
      KitBar.open('Текст заметки', (System.kit && System.kit.notes) || '', (text) => {
        System.kit.notes = text;
        System.saveGame();
      }, (text) => { System.kit.notes = text; });
    }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    const text = (System.kit && System.kit.notes) || 'Пиши в поле внизу. Кнопка «Ок» сохраняет.';
    this.wrap(ctx, text, 20, 78, W - 40, 22);
  }

  drawLists(ctx, W, H) {
    const lists = (System.kit && System.kit.lists) || [];
    const self = this;
    if (!this.listId) {
      if (!this._listNameOpen) {
        this._listNameOpen = true;
        KitBar.open('Название списка', '', (text) => {
          const title = text.trim().slice(0, 24);
          if (!title) return;
          const id = 'l' + Date.now();
          System.kit.lists.push({ id: id, title: title, items: [] });
          self.listId = id;
          self._listNameOpen = false;
          self._listItemOpen = false;
          System.saveGame();
          const input = document.getElementById('kitInput');
          if (input) input.value = '';
        });
      }
      if (!lists.length) {
        ctx.fillStyle = '#d7fff4';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Напиши название внизу и нажми Ок.', W / 2, 90);
      }
      lists.forEach((list, i) => {
        const y = 64 + i * 52;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        roundRect(ctx, 16, y, W - 32, 46, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const title = list.title.length > 18 ? list.title.slice(0, 18) + '…' : list.title;
        ctx.fillText(title + ' · ' + list.items.length, 28, y + 28);
        this.buttons.push({ x: 16, y: y, w: W - 32, h: 46, action: 'open-list:' + list.id });
      });
      return;
    }
    const list = this.currentList();
    if (!list) { this.listId = null; return; }
    if (!this._listItemOpen) {
      this._listItemOpen = true;
      KitBar.open('Новый пункт', '', (text) => {
        const line = text.trim().slice(0, 60);
        if (!line || !self.currentList()) return;
        self.currentList().items.push({ text: line, done: false });
        System.saveGame();
        const input = document.getElementById('kitInput');
        if (input) input.value = '';
      });
    }
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(list.title, W / 2, 62);
    list.items.slice(0, 8).forEach((item, i) => {
      const y = 76 + i * 46;
      ctx.fillStyle = item.done ? 'rgba(107,203,119,0.35)' : 'rgba(255,255,255,0.12)';
      roundRect(ctx, 16, y, W - 32, 42, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '15px Arial';
      ctx.textAlign = 'left';
      const label = (item.done ? '☑ ' : (i + 1) + '. ') + item.text;
      ctx.fillText(label.length > 28 ? label.slice(0, 28) + '…' : label, 28, y + 26);
      this.buttons.push({ x: 16, y: y, w: W - 90, h: 42, action: 'toggle:' + i });
      ctx.fillStyle = '#E74C3C';
      roundRect(ctx, W - 64, y + 6, 36, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('✕', W - 46, y + 26);
      this.buttons.push({ x: W - 64, y: y + 6, w: 36, h: 30, action: 'del-item:' + i });
    });
  }

  drawBoard(ctx, W, H) {
    KitBar.close();
    const colors = ['#24324a', '#e74c3c', '#2e8b57', '#4d96ff', '#ffd93d', '#ffffff'];
    colors.forEach((c, i) => {
      const x = 16 + i * 42;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + 14, 64, this.pen === c ? 14 : 11, 0, Math.PI * 2);
      ctx.fill();
      if (this.pen === c) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      this.buttons.push({ x: x, y: 50, w: 28, h: 28, action: 'pen:' + c });
    });
    [2, 6, 12].forEach((w, i) => {
      const x = W - 132 + i * 40;
      ctx.fillStyle = this.penW === w ? '#ffe082' : 'rgba(255,255,255,0.2)';
      roundRect(ctx, x, 50, 34, 28, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 8, 62 - w / 2, 18, Math.max(2, w / 2));
      this.buttons.push({ x: x, y: 50, w: 34, h: 28, action: 'width:' + w });
    });
    const pad = { x: 16, y: 92, w: W - 32, h: H - 168 };
    this.pad = pad;
    ctx.fillStyle = '#f7f1e3';
    roundRect(ctx, pad.x, pad.y, pad.w, pad.h, 12);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.x, pad.y, pad.w, pad.h);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.board.forEach(stroke => {
      if (!stroke.pts || stroke.pts.length < 1) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.w;
      ctx.beginPath();
      ctx.moveTo(stroke.pts[0].x, stroke.pts[0].y);
      stroke.pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
    ctx.restore();
    this.buttons.push(createButton(ctx, W / 2 - 70, H - 58, 140, 40, 'Стереть', {
      bgColor: '#E74C3C', fgColor: '#fff', fontSize: 16, radius: 10
    }));
  }

  beginDrag(x, y) {
    if (this.tool !== 'board' || !this.pad) return false;
    const p = this.pad;
    if (x < p.x || y < p.y || x > p.x + p.w || y > p.y + p.h) return false;
    this.stroke = { color: this.pen, w: this.penW, pts: [{ x: x, y: y }] };
    this.board.push(this.stroke);
    return true;
  }

  dragMove(x, y) {
    if (!this.stroke) return;
    this.stroke.pts.push({ x: x, y: y });
  }

  endDrag() { this.stroke = null; }

  drawTimer(ctx, W, H) {
    const leftMs = Math.max(0, ((System.kit && System.kit.timerEnd) || 0) - Date.now());
    const left = Math.ceil(leftMs / 1000);
    const m = Math.floor(left / 60);
    const s = left % 60;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText((m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s, W / 2, 120);
    const soundOn = typeof AudioSys !== 'undefined' && AudioSys.isSoundOn && AudioSys.isSoundOn();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffe082';
    if (!soundOn) ctx.fillText('Включите звук, иначе не услышите звонок.', W / 2, 148);
    else if (leftMs <= 0 && System.kit && System.kit.timerEnd) ctx.fillText('Время вышло.', W / 2, 148);
    const mins = [1, 3, 5, 10, 15, 60];
    mins.forEach((min, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bw = (W - 40) / 3;
      const x = 12 + col * bw;
      const y = 170 + row * 58;
      this.buttons.push(createButton(ctx, x, y, bw - 8, 48, min + ' мин', {
        bgColor: '#0e7c66', fgColor: '#fff', fontSize: 16, radius: 10
      }));
    });
    this.buttons.push(createButton(ctx, W / 2 - 90, 300, 180, 46, 'Своё время', {
      bgColor: '#3D6B8C', fgColor: '#fff', fontSize: 16, radius: 10
    }));
  }

  askCustomTimer() {
    const self = this;
    KitBar.open('Минуты, например 25', '', (text) => {
      const n = parseInt(text, 10);
      if (!n || n < 1 || n > 180) return;
      System.kit.timerEnd = Date.now() + n * 60000;
      self.rangFor = 0;
      System.saveGame();
      KitBar.close();
    });
  }

  drawWatch(ctx, W, H) {
    KitBar.close();
    const w = this.watch;
    let ms = w.acc;
    if (w.run) ms += Date.now() - w.at;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.formatMs(ms), W / 2, 120);
    const label = w.run ? 'Стоп' : 'Старт';
    this.buttons.push(createButton(ctx, 16, 150, (W - 44) / 2, 46, label, {
      bgColor: '#6BCB77', fgColor: '#102014', fontSize: 16, radius: 10
    }));
    this.buttons.push(createButton(ctx, W / 2 + 6, 150, (W - 44) / 2, 46, 'Круг', {
      bgColor: '#3D6B8C', fgColor: '#fff', fontSize: 16, radius: 10
    }));
    this.buttons.push(createButton(ctx, W / 2 - 70, 208, 140, 40, 'Сброс', {
      bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 15, radius: 10
    }));
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    w.laps.slice(0, 8).forEach((lap, i) => {
      ctx.fillStyle = '#d7fff4';
      ctx.fillText((i + 1) + '.  ' + this.formatMs(lap), 28, 270 + i * 26);
    });
  }

  formatMs(ms) {
    const t = Math.max(0, ms);
    const m = Math.floor(t / 60000);
    const s = Math.floor(t / 1000) % 60;
    const d = Math.floor(t / 100) % 10;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + d;
  }

  wrap(ctx, text, x, y, maxW, lh) {
    ctx.textAlign = 'left';
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

  leaveTool() {
    this.tool = 'menu';
    this.listId = null;
    this._notesOpen = false;
    this._listNameOpen = false;
    this._listItemOpen = false;
    if (System.kit && System.kit.notes) System.saveGame();
    KitBar.close();
  }

  // Системный жест «Назад»: сначала выходим из списка или заметок и прячем поле,
  // и только со списка инструментов отдаём ход карте.
  handleBack() {
    if (this.tool !== 'menu') {
      this.leaveTool();
      return true;
    }
    KitBar.close();
    return false;
  }

  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const a = btn.action || '';
      const t = btn.text || '';
      if (t.indexOf('На карту') !== -1) {
        this.leaveTool();
        this.game.transitionTo('map');
        return true;
      }
      if (t.indexOf('К списку') !== -1) { this.leaveTool(); return true; }
      if (a.indexOf('tool:') === 0) {
        this.tool = a.slice(5);
        this._notesOpen = false;
        this._listNameOpen = false;
        this._listItemOpen = false;
        KitBar.close();
        return true;
      }
      if (a.indexOf('key:') === 0) { this.pressCalc(a.slice(4)); return true; }
      if (a.indexOf('open-list:') === 0) {
        this.listId = a.slice(10);
        this._listItemOpen = false;
        this._listNameOpen = false;
        KitBar.close();
        return true;
      }
      if (a.indexOf('toggle:') === 0) {
        const list = this.currentList();
        const item = list && list.items[parseInt(a.slice(7), 10)];
        if (item) { item.done = !item.done; System.saveGame(); }
        return true;
      }
      if (a.indexOf('del-item:') === 0) {
        const list = this.currentList();
        if (list) { list.items.splice(parseInt(a.slice(9), 10), 1); System.saveGame(); }
        return true;
      }
      if (a.indexOf('pen:') === 0) { this.pen = a.slice(4); return true; }
      if (a.indexOf('width:') === 0) { this.penW = parseInt(a.slice(6), 10) || 6; return true; }
      if (t === 'Стереть') { this.board = []; return true; }
      if (/^\d+ мин$/.test(t)) {
        const min = parseInt(t, 10) || 1;
        System.kit.timerEnd = Date.now() + min * 60000;
        this.rangFor = 0;
        System.saveGame();
        return true;
      }
      if (t === 'Своё время') { this.askCustomTimer(); return true; }
      if (t === 'Старт') {
        this.watch.run = true;
        this.watch.at = Date.now();
        return true;
      }
      if (t === 'Стоп') {
        if (this.watch.run) this.watch.acc += Date.now() - this.watch.at;
        this.watch.run = false;
        return true;
      }
      if (t === 'Круг') {
        let ms = this.watch.acc;
        if (this.watch.run) ms += Date.now() - this.watch.at;
        this.watch.laps.unshift(ms);
        if (this.watch.laps.length > 12) this.watch.laps.pop();
        return true;
      }
      if (t === 'Сброс') {
        this.watch = { run: false, acc: 0, at: 0, laps: [] };
        return true;
      }
      return true;
    }
    return false;
  }
}

window.ToolsScene = ToolsScene;
