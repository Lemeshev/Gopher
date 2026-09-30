// ============ АУДИО СИСТЕМА (Web Audio API) ============
const AudioSys = {
  ctx: null,
  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {}
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(type) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch(type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'fail':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'eat':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(500, now + 0.05);
        osc.frequency.setValueAtTime(350, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.05);
        osc.frequency.setValueAtTime(2000, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      case 'sleep':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      case 'bath':
        osc.type = 'sine';
        for(let i = 0; i < 8; i++) {
          osc.frequency.setValueAtTime(600 + Math.random() * 800, now + i * 0.06);
        }
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
  },

  // ============ ГОЛОС ГЕРОЯ (v1.3) ============
  // Заказчик: «Милке нужны наряды и звуки, как и всем другим героям».
  // У каждого персонажа свой тембр (CHARACTERS[i].voice): гофер пищит, мишка
  // гудит низко, зайка тараторит, котёнок тянет «мяу», робот пикает, Милка
  // поёт мягко. Голос звучит при выборе героя, кормлении, купании, игре и
  // пробуждении — то есть тогда, когда герой «отвечает» ребёнку.
  voice(charId, mood) {
    if (!this.ctx) return false;
    const ch = (typeof findCharacter === 'function') ? findCharacter(charId) : null;
    const v = (ch && ch.voice) || { base: 660, type: 'sine', steps: [1, 1.5], dur: 0.12, bend: 1.1 };
    this.playVoice(v, mood);
    return true;
  },

  // Как звучит герой — строка для проверок и отладки
  voiceHint(charId) {
    const ch = (typeof findCharacter === 'function') ? findCharacter(charId) : null;
    const v = (ch && ch.voice) || null;
    if (!v) return '';
    return (ch.name || charId) + ': ' + v.base + ' Гц, ' + v.type + ', нот ' + v.steps.length;
  },

  playVoice(v, mood) {
    try { this.resume(); } catch (e) {}
    const base = v.base || 660;
    let seq = (v.steps && v.steps.length) ? v.steps.slice() : [1, 1.5];
    let bend = v.bend || 1;
    let dur = v.dur || 0.12;
    let vol = 0.11;
    if (mood === 'happy') {
      seq = seq.concat([seq[seq.length - 1] * 1.25]);
    } else if (mood === 'sleepy') {
      seq = seq.map(k => k * 0.72);
      bend = 0.92; dur = dur * 1.7; vol = 0.06;
    } else if (mood === 'hello') {
      bend = 1 + (bend - 1) * 0.5;     // при знакомстве голос короче и мягче
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = v.type || 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    const step = dur + 0.04;
    seq.forEach((k, i) => {
      const t = now + i * step;
      const f = Math.max(60, base * k);
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, f * bend), t + dur);
    });
    const total = seq.length * step;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + total);
    osc.start(now);
    osc.stop(now + total + 0.03);
  }
};
window.AudioSys = AudioSys;

// Инициализация аудио по первому касанию
let audioInitialized = false;
function initAudioOnTouch() {
    if (!audioInitialized) {
        AudioSys.init();
        audioInitialized = true;
    }
}

// Автоматическая инициализация при touchstart
document.addEventListener('touchstart', function autoInitAudio() {
    initAudioOnTouch();
    document.removeEventListener('touchstart', autoInitAudio);
}, { once: true });

// Также при первом клике (для десктопа)
document.addEventListener('click', function autoInitAudioClick() {
    initAudioOnTouch();
    document.removeEventListener('click', autoInitAudioClick);
}, { once: true });
