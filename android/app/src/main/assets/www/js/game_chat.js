// Чат с текущим питомцем. Сеть не используется: ответ выбирается из chat_lines.js.
class ChatScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.recent = [];
    this.bound = false;
  }

  init() {
    this.recent = [];
    this.openPanel();
    this.logEl().innerHTML = '';
    const name = this.petName();
    this.push('pet', 'Привет! Я ' + name + '. Это чат 0+: я отвечаю только добрыми фразами, которые уже лежат в игре.');
    const input = document.getElementById('chatInput');
    if (input) input.value = '';
  }

  petName() {
    const id = (System.look && System.look.char) || 'gopher';
    const ch = (typeof findCharacter === 'function') ? findCharacter(id) : null;
    return (ch && ch.name) || 'Гофер';
  }

  charId() {
    return (System.look && System.look.char) || 'gopher';
  }

  logEl() { return document.getElementById('chatLog'); }

  openPanel() {
    const panel = document.getElementById('chatPanel');
    if (!panel) return;
    panel.classList.add('open');
    const head = document.getElementById('chatHead');
    if (head) head.textContent = 'Чат с ' + this.petName();
    if (!this.bound) {
      this.bound = true;
      const form = document.getElementById('chatForm');
      const close = document.getElementById('chatClose');
      if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input ? input.value : '';
        if (input) input.value = '';
        this.onUser(text);
      });
      if (close) close.addEventListener('click', () => this.leave());
    }
  }

  hidePanel() {
    const panel = document.getElementById('chatPanel');
    if (panel) panel.classList.remove('open');
  }

  leave() {
    this.hidePanel();
    AudioSys.play('click');
    this.game.transitionTo('home');
  }

  handleBack() {
    this.hidePanel();
    this.game.transitionTo('home');
    return true;
  }

  push(who, text) {
    const log = this.logEl();
    if (!log) return;
    const row = document.createElement('div');
    row.className = 'chat-row ' + (who === 'me' ? 'me' : 'pet');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = (typeof petFill === 'function') ? petFill(text) : text;
    row.appendChild(bubble);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  pick(list) {
    if (!list || !list.length) return 'Я рядом.';
    const fresh = list.filter(line => this.recent.indexOf(line) === -1);
    const pool = fresh.length ? fresh : list;
    const line = pool[Math.floor(Math.random() * pool.length)];
    this.recent.push(line);
    if (this.recent.length > 24) this.recent.shift();
    return line;
  }

  replyTo(text) {
    const n = this.norm(text);
    if (!n) return this.pick(window.CHAT_FALLBACK || ['Напиши хоть слово.']);
    const topics = window.CHAT_TOPICS || [];
    let best = null;
    let score = 0;
    topics.forEach(topic => {
      let s = 0;
      (topic.keys || []).forEach(k => {
        const key = this.norm(k);
        if (key && n.indexOf(key) !== -1) s += key.length;
      });
      if (s > score) { score = s; best = topic; }
    });
    let line = (best && score >= 3) ? this.pick(best.replies) : this.pick(window.CHAT_FALLBACK);
    const voice = (window.CHAT_VOICES && window.CHAT_VOICES[this.charId()]) || [];
    if (voice.length && Math.random() < 0.35) line += ' ' + this.pick(voice);
    return line;
  }

  onUser(text) {
    const clean = String(text || '').trim();
    if (!clean) return;
    this.push('me', clean.slice(0, 180));
    this.push('pet', this.replyTo(clean));
    AudioSys.play('click');
  }

  update() {}

  draw(ctx) {
    const W = this.game.width, H = this.game.height;
    ctx.fillStyle = '#1a2140';
    ctx.fillRect(0, 0, W, H);
    if (this.game.gopher) this.game.gopher.draw(ctx, W / 2, H * 0.42, Math.min(W, H) * 0.28 / this.game.gopher.size);
    ctx.fillStyle = '#FFD93D';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Чат 0+', W / 2, H * 0.72);
  }
}

window.ChatScene = ChatScene;
