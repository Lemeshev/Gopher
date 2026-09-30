// ============ АУДИО СИСТЕМА (Web Audio API) ============
// Две независимые «громкости»: ФОНОВАЯ МУЗЫКА и ЗВУКИ (v1.3.1).
// Заказчик: «хорошо бы сделать какую-нибудь фоновую музыку нейтральную,
// конечно, с возможностью отключения как музыки, так и звуков вообще, в
// настройках игры». Отсюда решения:
//  • Музыка синтезируется теми же осцилляторами, что и звуки — никаких mp3:
//    игра весит 220 КБ и работает без интернета, файл музыки был бы тяжелее
//    самой игры.
//  • Мелодия «нейтральная»: пентатоника до-мажор (в ней нет полутонов, а
//    значит нет и режущих слух сочетаний) — петлю можно слушать часами.
//  • Три голоса: бас по такту, мелодия на 16 долей и редкие «звёздочки»
//    сверху — так петля не звучит как одна пищалка.
//  • Настроение (mood) меняет темп и громкость, а не ноты: во сне музыка
//    медленнее и тише, у домашнего действия «🎵 Музыка» — громче.
//  • Переключатели независимые, настройка хранится на устройстве
//    (gopherlife_audio), а не в профиле: это про «тихо в комнате», а не про
//    конкретного ребёнка.
const AudioSys = {
  ctx: null,
  musicGain: null,                       // общая громкость музыки (звуки идут мимо)
  settings: { music: true, sound: true },
  SETTINGS_KEY: 'gopherlife_audio',
  MUSIC_LOOKAHEAD: 0.9,                  // на сколько секунд вперёд расписываем ноты
  MUSIC_ROOT: 261.63,                    // C4 — от него считаем всю гамму
  // Пентатоника от C4: 0 2 4 7 9 12 14 16 19 21 полутона
  MUSIC_SCALE: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21],
  // Петля: 16 долей (4 такта по 4/4). Ноты заданы долей b и индексом i в гамме,
  // d — длительность в долях, v — индивидуальная громкость (0..1).
  MUSIC_LOOP: {
    beats: 16,
    bass: [
      { b: 0,  i: -12, d: 3.8 },        // C3
      { b: 4,  i: -15, d: 3.8 },        // A2
      { b: 8,  i: -7,  d: 3.8 },        // F3
      { b: 12, i: -5,  d: 3.8 }         // G3
    ],
    lead: [
      { b: 0,    i: 0, d: 1 }, { b: 1,   i: 2, d: 1 }, { b: 2, i: 3, d: 1 },   { b: 3,   i: 2, d: 1 },
      { b: 4,    i: 4, d: 0.5 }, { b: 4.5, i: 3, d: 0.5 }, { b: 5, i: 2, d: 1 },
      { b: 6,    i: 1, d: 1 }, { b: 7,   i: 0, d: 1 },
      { b: 8,    i: 0, d: 1 }, { b: 9,   i: 2, d: 1 }, { b: 10, i: 3, d: 1 },  { b: 11, i: 5, d: 1 },
      { b: 12,   i: 3, d: 1 }, { b: 13,  i: 2, d: 1 }, { b: 14, i: 1, d: 1 },  { b: 15, i: 0, d: 1 }
    ],
    sparkle: [
      { b: 4,  i: 7, d: 1.5, v: 0.8 },
      { b: 12, i: 8, d: 1.5, v: 0.6 }
    ]
  },
  // Настроение: темп, общая громкость и тембр мелодии
  MUSIC_MOODS: {
    ambient: { bpm: 76, gain: 0.55, lead: 'triangle' },   // обычный фон: тихо и ненавязчиво
    calm:    { bpm: 58, gain: 0.95, lead: 'sine' },       // «🎵 Музыка» дома: слышнее
    sleep:   { bpm: 50, gain: 0.35, lead: 'sine' }        // колыбельная, пока питомец спит
  },
  musicBoostUntil: 0,
  musicPlaying: false,
  musicLoopAt: 0,                        // время ctx, с которого играет текущая петля
  musicCursor: 0,                        // какую ноту петли расписываем следующей
  musicMoodApplied: null,                // для какой громкости уже настроен musicGain
  musicGainLevel: 0,
  musicNotesPlayed: 0,                   // счётчик сыгранных нот (для проверок и отладки)
  musicCache: null,
  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {}
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  // Короткий эффект (клик, монетка, успех...). Возвращает false, если звуки
  // выключены в настройках или звуковая система не готова — вызывающий код
  // ничего не должен из-за этого ломать.
  play(type) {
    if (!this.isSoundOn() || !this.ctx) return false;
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
    return true;
  },

  // ============ ГОЛОС ГЕРОЯ (v1.3) ============
  // Заказчик: «Милке нужны наряды и звуки, как и всем другим героям».
  // У каждого персонажа свой тембр (CHARACTERS[i].voice): гофер пищит, мишка
  // гудит низко, зайка тараторит, котёнок тянет «мяу», робот пикает, Милка
  // поёт мягко. Голос звучит при выборе героя, кормлении, купании, игре и
  // пробуждении — то есть тогда, когда герой «отвечает» ребёнку.
  voice(charId, mood) {
    if (!this.isSoundOn() || !this.ctx) return false;
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
  },

  // ============ НАСТРОЙКИ ЗВУКА: ДВЕ НЕЗАВИСИМЫЕ ГАЛОЧКИ (v1.3.1) ============
  // Заказчик: «с возможностью отключения как музыки, так и звуков вообще».
  // Поэтому это не один тумблер «звук», а два: музыка и звуки. Хранится на
  // устройстве: родитель выключает музыку один раз, и это действует для всех
  // профилей — просьба-то про комнату, а не про конкретного ребёнка.
  loadSettings() {
    let saved = null;
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) { saved = null; }
    this.settings = {
      music: !(saved && saved.music === false),
      sound: !(saved && saved.sound === false)
    };
    return this.settings;
  },

  saveSettings() {
    try { localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings)); } catch (e) {}
    return this.settings;
  },

  isSoundOn() { return this.settings.sound !== false; },
  isMusicOn() { return this.settings.music !== false; },

  setSound(on) {
    this.settings.sound = !!on;
    this.saveSettings();
    return this.settings.sound;
  },

  setMusic(on) {
    this.settings.music = !!on;
    this.saveSettings();
    if (!this.settings.music) this.musicStop();
    return this.settings.music;
  },

  toggleSound() { return this.setSound(!this.isSoundOn()); },
  toggleMusic() { return this.setMusic(!this.isMusicOn()); },

  // Строка для панели настроек и проверок: «🎵 вкл · 🔊 выкл»
  settingsHint() {
    return '🎵 ' + (this.isMusicOn() ? 'вкл' : 'выкл') + ' · 🔊 ' + (this.isSoundOn() ? 'вкл' : 'выкл');
  },

  // ============ ФОНОВАЯ МУЗЫКА ============
  // Ноты петли для настроения: считаем время в секундах (доля = 60/bpm) и
  // сортируем — планировщик сыпет их в хронологическом порядке.
  musicEvents(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    const beat = 60 / m.bpm;
    const out = [];
    const add = (list, type, vol) => {
      (list || []).forEach(n => out.push({
        t: n.b * beat,
        freq: this.musicFreq(n.i),
        dur: Math.max(0.22, n.d * beat),
        vol: vol * (n.v === undefined ? 1 : n.v),
        type: type
      }));
    };
    add(this.MUSIC_LOOP.bass, 'sine', 0.30);
    add(this.MUSIC_LOOP.lead, m.lead, 0.20);
    add(this.MUSIC_LOOP.sparkle, 'sine', 0.09);
    out.sort((a, b) => a.t - b.t);
    return out;
  },

  // Ноты не пересобираем по 60 раз в секунду — кэш на каждое настроение
  musicEventsCached(mood) {
    if (!this.musicCache) this.musicCache = {};
    if (!this.musicCache[mood]) this.musicCache[mood] = this.musicEvents(mood);
    return this.musicCache[mood];
  },

  musicFreq(i) { return this.MUSIC_ROOT * Math.pow(2, i / 12); },

  musicLoopDuration(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    return this.MUSIC_LOOP.beats * (60 / m.bpm);
  },

  // Настроение: питомец спит — колыбельная; недавно нажали «🎵 Музыка» дома —
  // слышнее; в остальное время обычный тихий фон.
  musicMood() {
    if (typeof System !== 'undefined' && System.isSleeping) return 'sleep';
    if (this.musicBoostUntil > Date.now()) return 'calm';
    return 'ambient';
  },

  // Домашнее действие «🎵 Музыка» поднимает музыку на несколько секунд
  musicBoost(seconds) {
    this.musicBoostUntil = Date.now() + Math.max(0, seconds || 8) * 1000;
    return this.musicMood();
  },

  // Громкость без щелчков: у AudioParam нельзя прочитать целевое значение,
  // поэтому держим его ещё и в musicGainLevel (для настроек и проверок).
  setGainValue(param, value, ramp) {
    this.musicGainLevel = value;
    if (!param) return false;
    try {
      if (this.ctx && typeof param.setTargetAtTime === 'function') {
        param.setTargetAtTime(value, this.ctx.currentTime, Math.max(0.02, (ramp || 0.25) / 3));
      } else { param.value = value; }
    } catch (e) { try { param.value = value; } catch (e2) {} }
    return true;
  },

  // Один общий узел громкости на всю музыку: выключая музыку, мы просто уводим
  // его громкость в ноль — уже расписанные ноты замолкают сами, без гонки за ними.
  ensureMusicGain() {
    if (this.musicGain || !this.ctx) return this.musicGain;
    try {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0001;
      this.musicGain.connect(this.ctx.destination);
      this.musicMoodApplied = null;
    } catch (e) { this.musicGain = null; }
    return this.musicGain;
  },

  musicApplyMood(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    if (this.musicGain && this.musicMoodApplied !== mood) {
      this.musicMoodApplied = mood;
      this.setGainValue(this.musicGain.gain, m.gain, 0.6);
    }
    return m;
  },

  musicStart() {
    if (!this.ensureMusicGain()) return false;
    this.musicPlaying = true;
    this.musicMoodApplied = null;          // громкость текущего настроения применим заново
    this.musicLoopAt = (this.ctx ? this.ctx.currentTime : 0) + 0.12;
    this.musicCursor = 0;
    return true;
  },

  musicStop() {
    const wasPlaying = this.musicPlaying;
    this.musicPlaying = false;
    this.musicCursor = 0;
    this.musicLoopAt = 0;
    this.musicMoodApplied = null;
    if (this.musicGain) this.setGainValue(this.musicGain.gain, 0.0001, 0.25);
    return wasPlaying;
  },

  // Одна нота: мягкая атака и затухание — иначе на краях слышны щелчки
  musicNote(note, at) {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return false;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type || 'sine';
      osc.frequency.setValueAtTime(note.freq, at);
      const dur = Math.max(0.2, note.dur);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(note.vol, at + Math.min(0.12, dur * 0.35));
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(at);
      osc.stop(at + dur + 0.05);
      this.musicNotesPlayed++;
      return true;
    } catch (e) { return false; }
  },

  // Вызывается каждый кадр из Game.loop(): ноты расписываются вперёд на
  // MUSIC_LOOKAHEAD секунд — тогда музыка не «спотыкается» на просадках кадров.
  musicTick() {
    if (!this.ctx) return false;
    if (!this.isMusicOn()) { this.musicStop(); return false; }
    const mood = this.musicMood();
    // Сначала поднимаем музыку (создаётся общий узел громкости), потом уже
    // применяем громкость настроения — иначе первый такт играл бы в полной тишине
    if (!this.musicPlaying) this.musicStart();
    this.musicApplyMood(mood);
    const events = this.musicEventsCached(mood);
    const loopDur = this.musicLoopDuration(mood);
    const now = this.ctx.currentTime;
    const until = now + this.MUSIC_LOOKAHEAD;
    // Приложение было свёрнуто: «догоняем» время, чтобы не высыпать ноты пачкой
    let guard = 0;
    while (this.musicLoopAt + loopDur <= now && guard++ < 300) this.musicLoopAt += loopDur;
    guard = 0;
    while (this.musicCursor < events.length &&
           this.musicLoopAt + events[this.musicCursor].t <= until && guard++ < 64) {
      const e = events[this.musicCursor];
      this.musicNote(e, this.musicLoopAt + e.t);
      this.musicCursor++;
    }
    if (this.musicCursor >= events.length) {
      this.musicLoopAt += loopDur;
      this.musicCursor = 0;
    }
    return true;
  },

  // Состояние музыки одним словарём: рисуется в настройках, проверяется тестами
  musicState() {
    const mood = this.musicMood();
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    return {
      music: this.isMusicOn(),
      sound: this.isSoundOn(),
      playing: !!this.musicPlaying,
      mood: mood,
      bpm: m.bpm,
      gain: this.musicGainLevel,
      notes: this.MUSIC_LOOP.bass.length + this.MUSIC_LOOP.lead.length + this.MUSIC_LOOP.sparkle.length,
      loop: Math.round(this.musicLoopDuration(mood) * 10) / 10,
      played: this.musicNotesPlayed,
      hint: this.settingsHint()
    };
  },

  // Приложение свернули: WebView держит звук, а ребёнок уже в другой программе
  pauseAll() {
    this.musicStop();
    try { if (this.ctx && this.ctx.suspend) this.ctx.suspend(); } catch (e) {}
    return true;
  },

  resumeAll() {
    try { if (this.ctx && this.ctx.resume) this.ctx.resume(); } catch (e) {}
    this.musicMoodApplied = null;          // громкость применим заново
    return true;
  }
};
window.AudioSys = AudioSys;

// Настройки звука читаем сразу при загрузке: панель настроек и фоновая музыка
// должны знать о них ещё до первого касания экрана.
AudioSys.loadSettings();

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

// Свернули приложение (или WebView ушёл в фон) — музыку глушим: ребёнок в этот
// момент уже в другой программе, а фоновая мелодия играла бы «в никуда».
// Вернулись — продолжаем с того же настроения, громкость применяется заново.
document.addEventListener('visibilitychange', function onAudioVisibility() {
    try {
        if (document.hidden) AudioSys.pauseAll();
        else AudioSys.resumeAll();
    } catch (e) {}
});
