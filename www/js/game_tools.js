// Поле ввода поверх игры. Его нельзя переписывать каждый кадр: иначе буква
// пропадает сразу после нажатия.
const KitBar = {
  onOk: null,
  live: null,
  multi: false,
  open(placeholder, value, onOk, live, multiline) {
    const bar = document.getElementById('kitBar');
    const input = document.getElementById(multiline ? 'kitNote' : 'kitInput');
    if (!bar || !input) return;
    this.onOk = onOk || null;
    this.live = live || null;
    this.multi = !!multiline;
    bar.className = multiline ? 'open multi' : 'open';
    input.placeholder = placeholder || '';
    if (document.activeElement !== input) input.value = value || '';
    const self = this;
    if (!bar._bound) {
      bar._bound = true;
      document.getElementById('kitOk').addEventListener('click', () => self.commit());
      document.getElementById('kitInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') self.commit(); });
      document.getElementById('kitInput').addEventListener('input', () => { if (self.live && !self.multi) self.live(document.getElementById('kitInput').value); });
      const note = document.getElementById('kitNote');
      if (note) note.addEventListener('input', () => { if (self.live && self.multi) self.live(note.value); });
    }
    try { input.focus(); } catch (e) {}
  },
  commit() {
    const input = document.getElementById(this.multi ? 'kitNote' : 'kitInput');
    const text = input ? String(input.value || '').slice(0, this.multi ? 4000 : 400) : '';
    if (this.onOk) this.onOk(text);
  },
  close() {
    const bar = document.getElementById('kitBar');
    if (bar) bar.className = '';
    this.onOk = null;
    this.live = null;
    this.multi = false;
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
    this.mem = 0;
    this.listsScroll = 0;
    this.itemScroll = 0;
    this.noteId = null;
    this.notesScroll = 0;
    this.boardMode = 'draw';
    this.albumScroll = 0;
    this.watch = { run: false, acc: 0, at: 0, laps: [] };
  }

  init() {
    this.buttons = [];
    this.tool = 'menu';
    this.expr = '';
    this.calc = '0';
    this.listId = null;
    this.noteId = null;
    this.boardMode = 'draw';
    this.pen = '#24324a';
    this.penW = 6;
    this.ensureKit();
    KitBar.close();
  }

  ensureKit() {
    if (!System.kit) System.kit = { notes: '', pages: [], lists: [], drawings: [], timerEnd: 0 };
    if (!Array.isArray(System.kit.pages)) System.kit.pages = [];
    if (!Array.isArray(System.kit.lists)) System.kit.lists = [];
    if (!Array.isArray(System.kit.drawings)) System.kit.drawings = [];
    if (typeof System.kit.notes === 'string' && System.kit.notes.trim() && !System.kit.pages.length) {
      System.kit.pages.push({ id: 'legacy', title: 'Заметка', body: System.kit.notes });
      System.kit.notes = '';
    }
  }

  // Пустое имя рисунка или заметки: 2026-10-24_11_48
  drawingStamp(d) {
    const when = d || new Date();
    const p = (n) => (n < 10 ? '0' : '') + n;
    return when.getFullYear() + '-' + p(when.getMonth() + 1) + '-' + p(when.getDate()) +
      '_' + p(when.getHours()) + '_' + p(when.getMinutes());
  }

  update() { this.checkTimer(); }

  // Звонок не зависит от открытого экрана: цикл игры вызывает это каждый кадр.
  checkTimer() {
    const end = System.kit && System.kit.timerEnd;
    if (!end) return;
    if (Date.now() < end) {
      if (this.rangFor === end) this.rangFor = 0;
      return;
    }
    if (this.rangFor === end) return;
    this.rangFor = end;
    this.ring();
    if (typeof System !== 'undefined' && System.showAchievement) System.showAchievement('⏱️', 'Время вышло');
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
    const nested = (this.tool === 'lists' && this.listId) || (this.tool === 'notes' && this.noteId) ||
      (this.tool === 'board' && this.boardMode === 'album');
    const backLabel = this.tool === 'menu' ? '← На карту' : (nested ? '← Назад' : '← К списку');
    const backW = this.tool === 'menu' ? 112 : 122;
    const backBtn = createButton(ctx, 8, 8, backW, 32, backLabel, {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 10
    });
    backBtn.action = this.tool === 'menu' ? 'to-map' : (nested ? 'level-up' : 'leave');
    this.buttons.push(backBtn);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px Arial';
    const titles = {
      menu: 'Инструменты', calc: 'Калькулятор', notes: 'Заметки',
      lists: 'Списки', board: 'Доска', timer: 'Таймер', watch: 'Секундомер'
    };
    ctx.fillText(titles[this.tool] || 'Инструменты', 16 + backW, 24);
    ctx.textBaseline = 'alphabetic';
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
      { id: 'calc', emoji: '🔢', name: 'Калькулятор', desc: 'Сначала умножение', color: '#1F6F5B' },
      { id: 'notes', emoji: '📝', name: 'Заметки', desc: 'Свои названия', color: '#3D6B8C' },
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
    if (this.mem) {
      ctx.fillStyle = '#ffe082';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('M ' + this.mem, 28, 78);
      this.buttons.push({ x: 16, y: 64, w: 110, h: 22, action: 'key:MR' });
    }
    const keys = ['√', '%', 'M+', 'MC', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', 'C', '=', '+'];
    const cols = 4;
    const cw = (W - 28) / cols;
    const ch = Math.min(52, (H - 210) / 5 - 6);
    keys.forEach((k, i) => {
      const x = 14 + (i % cols) * cw;
      const y = 136 + Math.floor(i / cols) * (ch + 6);
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

  formatNum(n) {
    if (!isFinite(n)) return '0';
    const rounded = Math.round(n * 1000) / 1000;
    return String(rounded);
  }

  pressCalc(key) {
    if (key === 'C') { this.expr = ''; this.calc = '0'; return; }
    if (key === 'M+') {
      const n = parseFloat(this.calc);
      if (isFinite(n)) this.mem = Math.round((this.mem + n) * 1000) / 1000;
      return;
    }
    if (key === 'MC') { this.mem = 0; return; }
    if (key === 'MR') {
      this.expr = this.formatNum(this.mem);
      this.calc = this.expr;
      return;
    }
    if (key === '√') {
      const n = parseFloat(this.calc);
      if (!isFinite(n) || n < 0) { this.calc = 'нельзя'; this.expr = ''; return; }
      this.calc = this.formatNum(Math.sqrt(n));
      this.expr = this.calc;
      return;
    }
    if (key === '%') {
      this.calc = this.applyPercent(this.expr);
      this.expr = this.calc === 'нельзя' ? '' : this.calc;
      return;
    }
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

  // 200+10% = 220, одно число 50% = 0.5.
  applyPercent(expr) {
    const m = String(expr || '').match(/^([0-9.]+)([+\-*/])([0-9.]+)$/);
    if (m) {
      const a = parseFloat(m[1]);
      const b = parseFloat(m[3]);
      if (!isFinite(a) || !isFinite(b)) return '0';
      const part = a * b / 100;
      if (m[2] === '+') return this.formatNum(a + part);
      if (m[2] === '-') return this.formatNum(a - part);
      if (m[2] === '*') return this.formatNum(a * b / 100);
      if (b === 0) return 'нельзя';
      return this.formatNum(a / (b / 100));
    }
    const n = parseFloat(expr);
    if (!isFinite(n)) return '0';
    return this.formatNum(n / 100);
  }

  // Сначала умножение и деление: 10+20×2 = 50, 9×2+2÷2 = 19.
  evalCalc(expr) {
    if (!/^[0-9+\-*/.]+$/.test(expr || '')) return '0';
    const parts = expr.split(/([+\-*/])/).filter(s => s !== '');
    if (!parts.length) return '0';
    const flat = [];
    for (let i = 0; i < parts.length; i++) {
      const tok = parts[i];
      if ((tok === '*' || tok === '/') && flat.length) {
        const a = parseFloat(flat.pop());
        const n = parseFloat(parts[++i]);
        if (!isFinite(a) || !isFinite(n)) return '0';
        if (tok === '/' && n === 0) return 'нельзя';
        flat.push(String(tok === '*' ? a * n : a / n));
      } else flat.push(tok);
    }
    let acc = parseFloat(flat[0]);
    if (!isFinite(acc)) return '0';
    for (let i = 1; i < flat.length; i += 2) {
      const n = parseFloat(flat[i + 1]);
      if (!isFinite(n)) break;
      if (flat[i] === '+') acc += n;
      else if (flat[i] === '-') acc -= n;
    }
    if (!isFinite(acc)) return '0';
    return this.formatNum(acc);
  }

  currentPage() {
    const pages = (System.kit && System.kit.pages) || [];
    return pages.find(p => p.id === this.noteId) || null;
  }

  drawNotes(ctx, W, H) {
    this.ensureKit();
    const pages = System.kit.pages;
    const self = this;
    if (!this.noteId) {
      if (!this._noteTitleOpen) {
        this._noteTitleOpen = true;
        this._noteBodyOpen = false;
        KitBar.open('Название заметки', '', (text) => {
          const title = (text.trim() || self.drawingStamp(new Date())).slice(0, 32);
          const id = 'n' + Date.now();
          System.kit.pages.push({ id: id, title: title, body: '' });
          self.noteId = id;
          self._noteTitleOpen = false;
          self._noteBodyOpen = false;
          System.saveGame();
        });
      }
      ctx.fillStyle = '#f4e7c5';
      roundRect(ctx, 16, 48, W - 32, 44, 10);
      ctx.fill();
      ctx.fillStyle = '#3a2e16';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Новая заметка', 28, 68);
      ctx.font = '12px Arial';
      ctx.fillText('Название — внизу. Пустое станет датой.', 28, 84);
      if (!pages.length) {
        ctx.fillStyle = '#d7fff4';
        ctx.font = '15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Пока нет ни одной записи.', W / 2, 130);
      }
      const top = 104;
      const row = 52;
      const viewH = H - top - 72;
      const max = Math.max(0, pages.length * row - viewH);
      this.notesScroll = Math.max(0, Math.min(this.notesScroll || 0, max));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, top, W, viewH);
      ctx.clip();
      pages.forEach((page, i) => {
        const y = top + i * row - this.notesScroll;
        if (y + 46 < top || y > top + viewH) return;
        ctx.fillStyle = 'rgba(125,190,230,0.28)';
        roundRect(ctx, 16, y, W - 32, 46, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const title = page.title.length > 18 ? page.title.slice(0, 18) + '…' : page.title;
        ctx.fillText(title, 28, y + 28);
        this.buttons.push({ x: 16, y: y, w: W - 100, h: 46, action: 'open-note:' + page.id });
        ctx.fillStyle = '#E74C3C';
        roundRect(ctx, W - 64, y + 8, 36, 30, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('✕', W - 46, y + 28);
        this.buttons.push({ x: W - 64, y: y + 8, w: 36, h: 30, action: 'del-note:' + page.id });
      });
      ctx.restore();
      return;
    }
    const page = this.currentPage();
    if (!page) { this.noteId = null; return; }
    if (!this._noteBodyOpen) {
      this._noteBodyOpen = true;
      this._noteTitleOpen = false;
      KitBar.open('Текст заметки', page.body || '', (text) => {
        const cur = self.currentPage();
        if (cur) cur.body = text;
        System.saveGame();
      }, (text) => {
        const cur = self.currentPage();
        if (cur) cur.body = text;
      }, true);
    }
    ctx.fillStyle = '#f7f1e3';
    roundRect(ctx, 16, 52, W - 32, 92, 12);
    ctx.fill();
    ctx.fillStyle = '#3a2e16';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    const title = page.title.length > 22 ? page.title.slice(0, 22) + '…' : page.title;
    ctx.fillText(title, 28, 80);
    ctx.font = '13px Arial';
    ctx.fillText('Текст только в поле внизу.', 28, 104);
    ctx.fillText('Переносы строк сохраняются.', 28, 124);
  }

  drawLists(ctx, W, H) {
    this.ensureKit();
    const lists = System.kit.lists;
    const self = this;
    if (!this.listId) {
      if (!this._listNameOpen) {
        this._listNameOpen = true;
        this._listItemOpen = false;
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
      ctx.fillStyle = '#1F6F5B';
      roundRect(ctx, 16, 48, W - 32, 44, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Новый список', 28, 68);
      ctx.font = '12px Arial';
      ctx.fillText('Сюда пишется только название, не пункты.', 28, 84);
      const top = 104;
      const row = 52;
      const viewH = H - top - 72;
      const max = Math.max(0, lists.length * row - viewH);
      this.listsScroll = Math.max(0, Math.min(this.listsScroll || 0, max));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, top, W, viewH);
      ctx.clip();
      if (!lists.length) {
        ctx.fillStyle = '#d7fff4';
        ctx.font = '15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Списков пока нет.', W / 2, top + 36);
      }
      lists.forEach((list, i) => {
        const y = top + i * row - this.listsScroll;
        if (y + 46 < top || y > top + viewH) return;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        roundRect(ctx, 16, y, W - 32, 46, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const title = list.title.length > 16 ? list.title.slice(0, 16) + '…' : list.title;
        ctx.fillText(title + ' · ' + list.items.length, 28, y + 28);
        this.buttons.push({ x: 16, y: y, w: W - 100, h: 46, action: 'open-list:' + list.id });
        ctx.fillStyle = '#E74C3C';
        roundRect(ctx, W - 64, y + 8, 36, 30, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('✕', W - 46, y + 28);
        this.buttons.push({ x: W - 64, y: y + 8, w: 36, h: 30, action: 'del-list:' + list.id });
      });
      ctx.restore();
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
    ctx.fillStyle = '#8C5A2E';
    roundRect(ctx, 16, 46, W - 32, 48, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    const head = list.title.length > 18 ? list.title.slice(0, 18) + '…' : list.title;
    ctx.fillText('Пункты: ' + head, 28, 66);
    ctx.font = '12px Arial';
    ctx.fillText('Внизу — новая строка, не новый список.', 28, 84);
    const top = 104;
    const row = 46;
    const viewH = H - top - 72;
    const max = Math.max(0, list.items.length * row - viewH);
    this.itemScroll = Math.max(0, Math.min(this.itemScroll || 0, max));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, W, viewH);
    ctx.clip();
    list.items.forEach((item, i) => {
      const y = top + i * row - this.itemScroll;
      if (y + 42 < top || y > top + viewH) return;
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
    ctx.restore();
  }

  drawBoard(ctx, W, H) {
    this.ensureKit();
    if (this.boardMode === 'album') {
      this.drawAlbum(ctx, W, H);
      return;
    }
    if (!this._drawNameOpen) KitBar.close();
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
    const pad = { x: 16, y: 92, w: W - 32, h: H - 250 };
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
    const bw = (W - 40) / 3;
    const rowY = H - 58;
    [['Шаг назад', 'undo-stroke', '#3D6B8C'], ['Стереть', 'clear-board', '#E74C3C'], ['Записать', 'save-board', '#1F6F5B']].forEach((spec, i) => {
      const btn = createButton(ctx, 12 + i * (bw + 8), rowY, bw, 40, spec[0], {
        bgColor: spec[2], fgColor: '#fff', fontSize: 14, radius: 10
      });
      btn.action = spec[1];
      this.buttons.push(btn);
    });
    const album = createButton(ctx, W - 108, H - 148, 92, 30, 'Альбом', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 8
    });
    album.action = 'open-album';
    this.buttons.push(album);
  }

  drawAlbum(ctx, W, H) {
    KitBar.close();
    this._drawNameOpen = false;
    const pics = (System.kit && System.kit.drawings) || [];
    ctx.fillStyle = '#d7fff4';
    ctx.font = '15px Arial';
    ctx.textAlign = 'center';
    if (!pics.length) ctx.fillText('Сохранённых рисунков нет.', W / 2, 120);
    const top = 56;
    const row = 52;
    const viewH = H - top - 24;
    const max = Math.max(0, pics.length * row - viewH);
    this.albumScroll = Math.max(0, Math.min(this.albumScroll || 0, max));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, W, viewH);
    ctx.clip();
    pics.forEach((pic, i) => {
      const y = top + i * row - this.albumScroll;
      if (y + 46 < top || y > top + viewH) return;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRect(ctx, 16, y, W - 32, 46, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      const title = String(pic.title || '').slice(0, 22);
      ctx.fillText(title, 28, y + 28);
      this.buttons.push({ x: 16, y: y, w: W - 100, h: 46, action: 'open-draw:' + pic.id });
      ctx.fillStyle = '#E74C3C';
      roundRect(ctx, W - 64, y + 8, 36, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('✕', W - 46, y + 28);
      this.buttons.push({ x: W - 64, y: y + 8, w: 36, h: 30, action: 'del-draw:' + pic.id });
    });
    ctx.restore();
  }

  askDrawingName() {
    const self = this;
    if (this._drawNameOpen) return;
    this._drawNameOpen = true;
    KitBar.open('Название рисунка', '', (text) => {
      self._drawNameOpen = false;
      const title = (text.trim() || self.drawingStamp(new Date())).slice(0, 32);
      let strokes = [];
      try { strokes = JSON.parse(JSON.stringify(self.board || [])); } catch (e) { strokes = []; }
      System.kit.drawings.push({ id: 'd' + Date.now(), title: title, strokes: strokes });
      if (System.kit.drawings.length > 30) System.kit.drawings.shift();
      System.saveGame();
      KitBar.close();
    });
  }

  beginDrag(x, y) {
    if (this.tool === 'board' && this.pad) {
      const p = this.pad;
      if (x < p.x || y < p.y || x > p.x + p.w || y > p.y + p.h) return false;
      this.stroke = { color: this.pen, w: this.penW, pts: [{ x: x, y: y }] };
      this.board.push(this.stroke);
      return true;
    }
    if (this.tool === 'lists' || (this.tool === 'notes' && !this.noteId) || (this.tool === 'board' && this.boardMode === 'album')) {
      const at = this.tool === 'notes' ? (this.notesScroll || 0)
        : (this.tool === 'board' ? (this.albumScroll || 0)
          : (this.listId ? (this.itemScroll || 0) : (this.listsScroll || 0)));
      this._scrollDrag = { x: x, y: y, moved: false, at: at, kind: this.tool + (this.listId ? '-in' : '') };
      return true;
    }
    return false;
  }

  dragMove(x, y) {
    if (this.stroke) this.stroke.pts.push({ x: x, y: y });
    if (!this._scrollDrag) return;
    const dy = this._scrollDrag.y - y;
    if (Math.abs(dy) > 8 || Math.abs(x - this._scrollDrag.x) > 8) this._scrollDrag.moved = true;
    const next = this._scrollDrag.at + dy;
    const kind = this._scrollDrag.kind || '';
    if (kind.indexOf('notes') === 0) this.notesScroll = next;
    else if (kind.indexOf('board') === 0) this.albumScroll = next;
    else if (this.listId) this.itemScroll = next;
    else this.listsScroll = next;
  }

  endDrag(x, y) {
    if (this._scrollDrag && !this._scrollDrag.moved) this.handleClick(x, y);
    this._scrollDrag = null;
    this.stroke = null;
  }

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
    KitBar.open('1:30 или 25', '', (text) => {
      const ms = self.parseTimer(text);
      if (!ms) return;
      System.kit.timerEnd = Date.now() + ms;
      self.rangFor = 0;
      System.saveGame();
      KitBar.close();
    });
  }

  // «1:30» — минута и 30 секунд. «25» и «1.5» — минуты.
  parseTimer(text) {
    const t = String(text || '').trim().replace(',', '.');
    const clock = t.match(/^(\d+):(\d{1,2})$/);
    if (clock) {
      const m = parseInt(clock[1], 10);
      const s = parseInt(clock[2], 10);
      if (s > 59 || m > 180) return 0;
      const ms = (m * 60 + s) * 1000;
      return ms > 0 && ms <= 180 * 60000 ? ms : 0;
    }
    const n = parseFloat(t);
    if (!isFinite(n) || n <= 0 || n > 180) return 0;
    return Math.round(n * 60000);
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
    this.noteId = null;
    this.boardMode = 'draw';
    this._notesOpen = false;
    this._noteTitleOpen = false;
    this._noteBodyOpen = false;
    this._listNameOpen = false;
    this._listItemOpen = false;
    this._drawNameOpen = false;
    if (System.kit && ((System.kit.pages && System.kit.pages.length) || (System.kit.drawings && System.kit.drawings.length))) System.saveGame();
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
      if (a === 'to-map' || t.indexOf('На карту') !== -1) {
        this.leaveTool();
        this.game.transitionTo('map');
        return true;
      }
      if (a === 'level-up') {
        if (this.listId) {
          this.listId = null;
          this._listItemOpen = false;
          this._listNameOpen = false;
        } else if (this.noteId) {
          this.noteId = null;
          this._noteBodyOpen = false;
          this._noteTitleOpen = false;
        } else if (this.boardMode === 'album') this.boardMode = 'draw';
        KitBar.close();
        return true;
      }
      if (a === 'leave' || t.indexOf('К списку') !== -1) { this.leaveTool(); return true; }
      if (a.indexOf('tool:') === 0) {
        this.tool = a.slice(5);
        this.listId = null;
        this.noteId = null;
        this.boardMode = 'draw';
        this._notesOpen = false;
        this._noteTitleOpen = false;
        this._noteBodyOpen = false;
        this._listNameOpen = false;
        this._listItemOpen = false;
        this._drawNameOpen = false;
        KitBar.close();
        return true;
      }
      if (a.indexOf('key:') === 0) { this.pressCalc(a.slice(4)); return true; }
      if (a.indexOf('open-list:') === 0) {
        this.listId = a.slice(10);
        this.itemScroll = 0;
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
      if (a.indexOf('del-list:') === 0) {
        const id = a.slice(9);
        System.kit.lists = (System.kit.lists || []).filter(l => l.id !== id);
        if (this.listId === id) this.listId = null;
        System.saveGame();
        return true;
      }
      if (a.indexOf('open-note:') === 0) {
        this.noteId = a.slice(10);
        this._noteBodyOpen = false;
        this._noteTitleOpen = false;
        KitBar.close();
        return true;
      }
      if (a.indexOf('del-note:') === 0) {
        const id = a.slice(9);
        System.kit.pages = (System.kit.pages || []).filter(p => p.id !== id);
        if (this.noteId === id) this.noteId = null;
        System.saveGame();
        return true;
      }
      if (a.indexOf('pen:') === 0) { this.pen = a.slice(4); return true; }
      if (a.indexOf('width:') === 0) { this.penW = parseInt(a.slice(6), 10) || 6; return true; }
      if (a === 'undo-stroke' || t === 'Шаг назад') {
        if (this.board.length) this.board.pop();
        return true;
      }
      if (a === 'clear-board' || t === 'Стереть') { this.board = []; return true; }
      if (a === 'save-board' || t === 'Записать') { this.askDrawingName(); return true; }
      if (a === 'open-album') { this.boardMode = 'album'; this._drawNameOpen = false; KitBar.close(); return true; }
      if (a.indexOf('open-draw:') === 0) {
        const pic = (System.kit.drawings || []).find(d => d.id === a.slice(10));
        if (pic) {
          try { this.board = JSON.parse(JSON.stringify(pic.strokes || [])); } catch (e) { this.board = []; }
        }
        this.boardMode = 'draw';
        return true;
      }
      if (a.indexOf('del-draw:') === 0) {
        const id = a.slice(9);
        System.kit.drawings = (System.kit.drawings || []).filter(d => d.id !== id);
        System.saveGame();
        return true;
      }
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
