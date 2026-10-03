// Чат с текущим питомцем. Сеть не используется: ответ выбирается из chat_lines.js.
class ChatScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.recent = [];
    this.bound = false;
    this.pending = null;   // «что я только что спросил» (null | 'mood'), чтобы понять ответ ребёнка
  }

  init() {
    this.recent = [];
    this.lastTopic = null;
    this.pending = null;
    this.openPanel();
    const log = this.logEl();
    if (log) log.innerHTML = '';
    const name = this.petName();
    this.push('pet', 'Привет, я ' + name + '. Давай поболтаем.');
    const input = document.getElementById('chatInput');
    if (input) input.value = '';
  }

  petName() {
    const id = (System.look && System.look.char) || 'gopher';
    const ch = (typeof findCharacter === 'function') ? findCharacter(id) : null;
    return (ch && ch.name) || 'Питомец';
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

  topicById(id) {
    const topics = window.CHAT_TOPICS || [];
    for (let i = 0; i < topics.length; i++) if (topics[i].id === id) return topics[i];
    return null;
  }

  // Сначала вредные темы, потом точные детские фразы, потом слова из фразы.
  replyTo(text) {
    const n = this.norm(text);
    if (!n) return this.pick(window.CHAT_FALLBACK || ['Напиши хоть слово.']);

    // 1) Ответ на только что заданный вопрос («как дела?» → «не очень»). Раньше
    // такой ответ не распознавался и уходил в «какое тут главное слово?».
    const pending = this.answerPending(n);
    if (pending) return pending;

    // 2) Короткие «подхваты»: да/нет/понятно/ха-ха/«а ты?»/лёгкая грубость —
    // отвечаем тепло и продолжаем, вместо того чтобы требовать «одно слово».
    const ack = this.acknowledge(n);
    if (ack) return ack;

    const topics = window.CHAT_TOPICS || [];
    const follow = ['да', 'нет', 'ага', 'угу', 'а ты', 'и что', 'почему', 'зачем', 'ну', 'давай', 'хорошо', 'ладно'];
    if (this.lastTopic && follow.indexOf(n) !== -1) {
      return this.pick(this.lastTopic.replies);
    }
    const blocked = this.topicById('safe');
    if (blocked && this.scoreTopic(n, blocked) > 0) {
      this.lastTopic = blocked;
      this.pending = null;
      return this.pick(blocked.replies);
    }
    const intents = window.CHAT_INTENTS || [];
    for (let i = 0; i < intents.length; i++) {
      if (intents[i].re.test(n)) {
        const topic = this.topicById(intents[i].id);
        if (topic) {
          this.lastTopic = topic;
          this.pending = topic.ask || null;
          return this.pick(topic.replies);
        }
      }
    }
    const words = n.split(' ');
    if (words.length <= 3 && n.length < 28) {
      const nounLine = this.nounLine(n);
      if (nounLine) return nounLine;
    }
    let best = null;
    let score = 0;
    topics.forEach(topic => {
      const s = this.scoreTopic(n, topic);
      if (s > score) { score = s; best = topic; }
    });
    if (best && score >= 3) {
      this.lastTopic = best;
      this.pending = best.ask || null;
      return this.pick(best.replies);
    }
    const nounLine = this.nounLine(n);
    if (nounLine) return nounLine;
    this.lastTopic = null;
    this.pending = null;
    return this.pick(window.CHAT_KID_FALLBACK || window.CHAT_FALLBACK);
  }

  // Ответ на мой последний вопрос. Возвращает '' если это не ответ, а новая тема.
  answerPending(n) {
    const p = this.pending;
    if (!p) return '';
    const A = window.CHAT_ANSWER || {};
    let out = '';
    if (p === 'mood') {
      if ((A.moodBadWords || []).indexOf(n) !== -1 || n === 'нет' || n === 'не') out = this.pick(A.moodBad);
      else if ((A.moodGoodWords || []).indexOf(n) !== -1 || n === 'да') out = this.pick(A.moodGood);
      else if ((A.moodOtherWords || []).indexOf(n) !== -1) out = this.pick(A.moodOther);
      else { this.pending = null; return ''; }   // это не про настроение — обычный путь
    }
    this.pending = null;
    return out;
  }

  // Тёплые «подхваты» для коротких ответов и междометий ребёнка.
  acknowledge(n) {
    const A = window.CHAT_ACK || {};
    if ((A.mildKeys || []).some(k => n.indexOf(k) !== -1)) return this.pick(A.mild);
    if ((A.laughWords || []).indexOf(n) !== -1) return this.pick(A.laugh);
    if ((A.backWords || []).indexOf(n) !== -1) return this.pick(A.back);
    if ((A.yesWords || []).indexOf(n) !== -1) return this.pick(A.yes);
    if ((A.noWords || []).indexOf(n) !== -1) return this.pick(A.no);
    if ((A.fillerWords || []).indexOf(n) !== -1) return this.pick(A.filler);
    return '';
  }

  nounLine(n) {
    const nouns = window.CHAT_NOUNS || [];
    let hit = null;
    for (let i = 0; i < nouns.length; i++) {
      const key = nouns[i].key;
      const at = n.indexOf(key);
      if (at === -1) continue;
      const before = at === 0 || n.charAt(at - 1) === ' ';
      if (!before) continue;
      if (!hit || key.length > hit.key.length) hit = nouns[i];
    }
    if (!hit) return '';
    this.lastTopic = null;
    const patterns = window.CHAT_NOUN_PATTERNS || ['{s}! Расскажи ещё.'];
    return this.pick(patterns).split('{s}').join(hit.word);
  }

  scoreTopic(n, topic) {
    let s = 0;
    (topic.keys || []).forEach(k => {
      const key = this.norm(k);
      if (!key) return;
      const at = n.indexOf(key);
      if (at === -1) return;
      const before = at === 0 || n.charAt(at - 1) === ' ';
      const afterAt = at + key.length;
      const after = afterAt === n.length || n.charAt(afterAt) === ' ';
      if (!before) return;
      if (!after && key.length < 4) return;
      s += Math.max(key.length, 3);
    });
    return s;
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
