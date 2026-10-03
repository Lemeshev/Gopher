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
    this.lastTopic = null;
    this.openPanel();
    this.logEl().innerHTML = '';
    const name = this.petName();
    this.push('pet', 'Привет, я ' + name + '. Давай поболтаем.');
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
    if (head) head.textContent = this.petName();
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
    this.game.transitionTo('map');
  }

  handleBack() {
    this.hidePanel();
    this.game.transitionTo('map');
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
    const follow = ['да', 'нет', 'ага', 'угу', 'а ты', 'и что', 'почему', 'зачем', 'ну'];
    if (this.lastTopic && follow.indexOf(n) !== -1) {
      return this.pick(this.lastTopic.replies);
    }
    let best = null;
    let score = 0;
    topics.forEach(topic => {
      let s = 0;
      (topic.keys || []).forEach(k => {
        const key = this.norm(k);
        if (!key) return;
        const at = n.indexOf(key);
        if (at === -1) return;
        const before = at === 0 || n.charAt(at - 1) === ' ';
        const afterAt = at + key.length;
        const after = afterAt === n.length || n.charAt(afterAt) === ' ';
        // Короткий кусок должен совпасть с целым словом, длинный корень может быть началом слова.
        if (!before) return;
        if (!after && key.length < 4) return;
        s += key.length;
      });
      if (s > score) { score = s; best = topic; }
    });
    if (best && score >= 3) {
      this.lastTopic = best;
      return this.pick(best.replies);
    }
    this.lastTopic = null;
    return this.pick(window.CHAT_FALLBACK);
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
    ctx.fillText(this.petName(), W / 2, H * 0.72);
  }
}

window.ChatScene = ChatScene;
