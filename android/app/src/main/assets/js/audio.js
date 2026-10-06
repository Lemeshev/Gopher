// ============ АУДИО СИСТЕМА (Web Audio API) ============
// Две независимые «громкости»: ФОНОВАЯ МУЗЫКА и ЗВУКИ (v1.3.1).
// Заказчик: «хорошо бы сделать какую-нибудь фоновую музыку нейтральную,
// конечно, с возможностью отключения как музыки, так и звуков вообще, в
// настройках игры». Отсюда решения:
//  • Музыка синтезируется теми же осцилляторами, что и звуки — никаких mp3:
//    игра весит 220 КБ и работает без интернета, файл музыки был бы тяжелее
//    самой игры.
//  • Мелодия «нейтральная»: пентатоника до-мажор (в ней нет полутонов, а
//    значит нет и режущих слух сочетаний) — музыку можно слушать часами.
//  • Три голоса: бас по такту, мелодия на 16 долей и редкие «звёздочки»
//    сверху — так круг не звучит как одна пищалка.
//  • Мелодий ШЕСТЬ (v1.3.5, MUSIC_TUNES): домашняя, прогулка, игра, музейная,
//    звёздная, колыбельная. Заказчик передал вопрос детей: «музыка всегда такая
//    заунывная и одинаковая или она будет меняться?» — раньше была одна петля на
//    всю игру, менялись только темп и громкость. Теперь у каждого настроения свой
//    пул песен (в доме играет одна, в магазине другая, в музее третья, во сне —
//    колыбельная), круг меняется сам: каждый круг сдвигается по высоте, каждый
//    второй круг меняет мелодию. Музыка синтезируется на месте: файлов нет.
//  • Переключатели независимые, настройка хранится на устройстве
//    (gopherlife_audio), а не в профиле: это про «тихо в комнате», а не про
//    конкретного ребёнка.
//  • v1.3.12 — «весёлые детские песенки». Заказчик: «музыка пока что очень
//    заунывная, сделай повеселей будто детские мелодии какие-нибудь». Нашлась
//    настоящая причина: мелодия была записана СТУПЕНЯМИ гаммы, а игралась как
//    ПОЛУТОНЫ (musicEvents вызывал musicFreq(n.i) без пересчёта). Из-за этого
//    «до-мажорная» мелодия звучала с фальшивыми нотами (фа-диез, ми-бемоль) —
//    отсюда и уныние, и «непонятность». Теперь ступени переводятся в полутоны
//    через musicScaleStep(), а сама гамма — полный до-мажор C4…F5 (не пентатоника).
//    Плюс: у мелодий появился ритм (восьмые, половинные, паузы), у баса — «ум-пах»
//    (четверти с квинтой на слабой доле, как левая рука в детской песенке), а на
//    каждую вторую долю — тихий «притоп» (v1.3.12). Темпы подняты.
//  • v1.3.8 — музыка стала бодрой. Отзыв пользователей: «музыка по-прежнему
//    заунывная и грустная». Причины были слышны: темпы 62–88 уд/мин, мелодии
//    с редкими длинными нотами в низком регистре (C4–C5) и бас, который держал
//    один звук четыре доли. Теперь темпы 100–132, мелодии двигаются почти на
//    каждую долю в верхнем регистре (G4–A5), у баса появился тихий «подскок»
//    на слабые доли (тогда — musicStabs), а колыбельная осталась спокойной — она для
//    сна. v1.3.12: этот «подскок» заменён полноценным «ум-пах» (musicUmPah) — бас
//    шагает четвертями с квинтой на слабой доле, как левая рука в детской песенке.
const AudioSys = {
  ctx: null,
  musicGain: null,                       // общая громкость музыки (звуки идут мимо)
  settings: { music: true, sound: true },
  SETTINGS_KEY: 'gopherlife_audio',
  MUSIC_LOOKAHEAD: 0.9,                  // на сколько секунд вперёд расписываем ноты
  MUSIC_ROOT: 261.63,                    // C4 — от него считаем всю гамму
  // Полный до-мажор от C4: до ре ми фа соль ля си | до ре ми фа (11 ступеней).
  // v1.3.12: было 10 ступеней пентатоники — в ней нет фа и си, поэтому «детская»
  // мелодия звучала расплывчато. Верх ограничен фа второй октавы (F5 = 698 Гц):
  // со сдвигом +4 круга самая высокая нота даёт 880 Гц, то есть остаётся в
  // слышимой «игрушечной» середине (проверка кадров требует < 900 Гц).
  MUSIC_SCALE: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17],
  // Круг: 16 долей (4 такта по 4/4). Ноты заданы долей b и индексом i в гамме,
  // d — длительность в долях, v — индивидуальная громкость (0..1).
  // Настроение: темп, общая громкость, тембр и ПУЛ мелодий (какие песни звучат
  // в этом настроении — v1.3.5). Заказчик: «дети спрашивают — музыка всегда такая
  // заунывная и одинаковая или она будет меняться?» Поэтому мало темпа: у каждого
  // настроения свой набор мелодий, а внутри круга музыка ещё и меняется.
  // Пул мелодий и характер настроения: темп, громкость, тембр, ритм-«подскок».
  // v1.3.10. Заказчик: «музыка пока что пугающая, сделай повеселее». «Пугающей»
  // её делали три вещи: низкий гул (бас уходил в A2 = 110 Гц), медленные темпы и
  // пустой звук из октав без терции. Что изменилось: бас больше не опускается
  // ниже C3, темпы подняты (108–140), у «подскока» появилась светлая квинта,
  // «звёздочки» стали мягче (triangle вместо sine), а фон начинается не с
  // редкой «Звёздной», а с весёлой «Домашней». Колыбельная осталась тихой и
  // медленной — она для сна, а не для бодрости.
  // v1.3.12: темпы подняты (детские песенки идут бойко), а громкость, наоборот,
  // снижена почти на треть — заказчик попросил «сделать её тише»: 0.34–0.62 вместо
  // 0.45–0.95. Колыбельная осталась самой тихой.
  MUSIC_MOODS: {
    home:    { bpm: 138, gain: 0.38, lead: 'triangle', pulse: true,  tunes: ['sunny', 'home', 'dance', 'walk'] },
    ambient: { bpm: 132, gain: 0.34, lead: 'triangle', pulse: true,  tunes: ['sunny', 'home', 'meadow', 'walk', 'star'] },
    calm:    { bpm: 132, gain: 0.62, lead: 'triangle', pulse: true,  tunes: ['sunny', 'dance', 'home', 'play', 'walk'] },
    museum:  { bpm: 116, gain: 0.30, lead: 'triangle', pulse: false, tunes: ['meadow', 'museum', 'star'] },
    play:    { bpm: 148, gain: 0.42, lead: 'triangle', pulse: true,  tunes: ['dance', 'parade', 'play', 'walk'] },
    sleep:   { bpm: 66,  gain: 0.22, lead: 'sine',     pulse: false, tunes: ['lullaby'] }          // колыбельная
  },
  // Сдвиги (в полутонах) для следующего круга: мелодия не повторяется «нота в ноту».
  // Все голоса сдвигаются вместе, поэтому созвучие сохраняется: 0 / +2 / +4 / −2.
  // Первым идёт 0, вторым +2: круг начинается «в тон», а не ниже — так музыка не
  // звучит темнее с первых секунд (v1.3.10).
  MUSIC_SHIFTS: [0, 2, 4, -2],
  musicShiftIndex: 0,
  musicTuneIndex: 0,                     // какая мелодия из пула играет
  musicLoops: 0,                         // сколько кругов сыграно (для проверок)
  musicScene: 'menu',                    // где мы: сцена задаёт настроение (setScene)
  // ============ ШЕСТЬ МЕЛОДИЙ (v1.3.5) ============
  // Заказчик: «дети спрашивают — музыка всегда такая заунывная и одинаковая или она
  // будет меняться?» Раньше петля была одна на всю игру: менялись только темп и
  // громкость, поэтому ребёнок слышал одно и то же. Теперь мелодий шесть, и они
  // разные по характеру: домашняя, прогулка, игра, музейная, звёздная, колыбельная.
  // Мелодия записана строкой: одна доля — один знак, число — СТУПЕНЬ гаммы
  // (MUSIC_SCALE), «.» — продлить предыдущую ноту на долю, «-» — пауза.
  // v1.3.12: у нот появилась длительность — «/2» восьмая (полдоли), «*2»
  // половинная, «+» нота с точкой (в полтора раза). У паузы знаки те же («-*2»).
  // Без ритма детская песенка превращается в ровный «шаг» — это тоже уныло.
  musicParseLead(pattern) {
    const out = [];
    let prev = null;
    let b = 0;                             // текущая доля круга
    String(pattern).trim().split(/\s+/).forEach(tok => {
      if (tok === '.') { if (prev) prev.d += 1; b += 1; return; }
      const len = this.musicTokenLen(tok);
      if (tok.charAt(0) === '-') { prev = null; b += len; return; }
      prev = { b: b, i: parseInt(tok, 10) || 0, d: len };
      out.push(prev);
      b += len;
    });
    return out;
  },
  // Длительность знака в долях: «5» — доля, «5/2» — полдоли, «5*2» — две доли,
  // «5+» — с точкой, знаки совмещаются: «5/2+» — восьмая с точкой (0.75).
  musicTokenLen(tok) {
    let len = 1;
    const div = String(tok).match(/\/(\d+)/);
    if (div) len = 1 / Math.max(1, parseInt(div[1], 10));
    const mul = String(tok).match(/\*(\d+(?:\.\d+)?)/);
    if (mul) len = len * parseFloat(mul[1]);
    if (String(tok).indexOf('+') !== -1) len = len * 1.5;
    return Math.max(0.125, Math.round(len * 1000) / 1000);
  },
  // Ступень гаммы → полутоны от C4. Индекс за краем гаммы прижимаем к краю:
  // лучше повторить крайнюю ноту, чем сыграть случайную высоту (v1.3.12).
  musicScaleStep(i) {
    const s = this.MUSIC_SCALE;
    const k = Math.max(0, Math.min(s.length - 1, Math.round(i) || 0));
    return s[k];
  },
  // Бас: четыре аккорда за круг, индексы — полутоны от C4 (C3, F3, G3…).
  // v1.3.8: нота держится 1.4 доли, а не весь аккорд — бас «шагает», а не тянет.
  // v1.3.12: нота стала короче (0.9 доли): под ней теперь идёт «ум-пах» из четвертей
  // (musicUmPah), и длинный бас с ним сливался бы в кашу.
  musicParseBass(spec, beats) {
    const parts = String(spec).trim().split(/\s+/);
    const step = beats / parts.length;
    return parts.map((tok, k) => ({ b: k * step, i: parseInt(tok, 10) || 0, d: Math.min(step - 0.2, 0.9) }));
  },
  // Мелодии — данными: id, имя для экрана настроек, строка мелодии, бас, «звёздочки».
  // Разбор строки делает musicTune() (см. ниже) — так данные остаются читаемыми.
  // v1.3.12: мелодии пересочинены как детские песенки — мотивы простые и «поются»
  // (повтор ноты, шаг по гамме, скачок на кварту-квинту), у каждой фразы конец
  // приходит на тонику (0 или 7 = до), ритм живой (восьмые и половинные вперемешку),
  // у баса — «ум-пах» из четвертей (C F G C и родственные ходы: только мажорные
  // трезвучия и ре-минор из той же гаммы). Мотивы наши собственные, в духе детских
  // песенок, а не цитаты чужих мелодий.
  MUSIC_TUNES: [
    // «Домашняя» — бойкая: скачок вверх и повтор, как считалка
    { id: 'home',    name: 'Домашняя',    lead: '4 4 5 4 2 - 4 4 5 4 2 - 4/2 4/2 5 4 7', bass: '-12 -7 -5 -12',  sparkle: [[3, 9], [11, 8]] },
    // «Прогулка» — марш: четыре ровных шага, потом «притоп» восьмыми
    { id: 'walk',    name: 'Прогулка',    lead: '4 4 5 7 2 2 4 4 5 7 4 4 5/2 5/2 7 7 7', bass: '-12 -7 -12 -5', sparkle: [[7, 9]] },
    // «Игра» — самая быстрая: восьмые «догонялки» и конец на низком до
    { id: 'play',    name: 'Игра',        lead: '7 7 9 7 8/2 8/2 7 5 4 4 7 4 5/2 5/2 4 2 0*2', bass: '-12 -5 -7 -12', sparkle: [[4, 9], [12, 10]] },
    // Бас музея и колыбельной раньше уходил в A2 (110 Гц) — этот низкий гул и
    // делал музыку «страшной» (замечание заказчика, v1.3.10). Ниже C3 не опускаемся.
    // «Музейная» — спокойная, но певучая: вопрос-ответ и подъём в конце
    { id: 'museum',  name: 'Музейная',    lead: '5 4 5 7/2 7/2 7 -*2 5 4 5 8/2 8/2 7 -*2 5 7', bass: '-12 -7 -12 -7', sparkle: [] },
    // «Звёздная» — «дзынь-дзынь»: восьмые переливы, но в мажоре и с тоникой в конце
    { id: 'star',    name: 'Звёздная',    lead: '7 7 9/2 9/2 7 5 4 5 7 9/2 9/2 10/2 9/2 7 4 7 5 4 7', bass: '-12 -5 -12 -5', sparkle: [[2, 10], [6, 9], [12, 10]] },
    // «Колыбельная» — спокойная, но мажорная: качает вверх-вниз и засыпает на до
    { id: 'lullaby', name: 'Колыбельная', lead: '4 2 4/2 4/2 5 3 2 4 2 4/2 4/2 5 4 2 0*4', bass: '-12 -10 -12 -7', sparkle: [[5, 7]] },
    // Светлые песенки: выше по гамме, с восьмыми и явным возвратом на до.
    { id: 'sunny',  name: 'Солнечная', lead: '7 7 9/2 7/2 5 4 7 5 4 2 4 5 7 9/2 7/2 5 4 0', bass: '-12 -7 -5 -12', sparkle: [[2, 9], [8, 10], [14, 9]] },
    { id: 'dance',  name: 'Плясовая',  lead: '9/2 7/2 5/2 7/2 9/2 7/2 5 4/2 5/2 7/2 5/2 4/2 2/2 4 5 7 4 2 0*4', bass: '-12 -5 -7 -12', sparkle: [[4, 10], [12, 9]] },
    { id: 'parade', name: 'Парад',     lead: '4 4 7 9/2 9/2 7 5 4 2 4 7 9/2 9/2 7 5 4 0*2', bass: '-12 -7 -12 -5', sparkle: [[6, 9], [14, 10]] },
    { id: 'meadow', name: 'Полянка',   lead: '5 5 7/2 9/2 7 5 4 2 4 5 5 7/2 9/2 7 5 4 0*2', bass: '-12 -7 -5 -12', sparkle: [[3, 9], [11, 10]] }
  ],
  MUSIC_BEATS: 16,

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
      case 'alarm':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174, now + 0.18);
        osc.frequency.setValueAtTime(880, now + 0.36);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.setValueAtTime(0.22, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
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
  // Разобрать мелодию в ноты: считаем время в секундах (доля = 60/bpm) и
  // сортируем — планировщик сыпет их в хронологическом порядке.
  musicTune() {
    const pool = this.musicPool(this.musicMood());
    const id = pool[this.musicTuneIndex % pool.length] || pool[0];
    if (!this.musicTuneCache) this.musicTuneCache = {};
    if (this.musicTuneCache[id]) return this.musicTuneCache[id];
    const raw = this.MUSIC_TUNES.filter(t => t.id === id)[0] || this.MUSIC_TUNES[0];
    const beats = raw.beats || this.MUSIC_BEATS;
    const tune = {
      id: raw.id, name: raw.name, beats: beats,
      lead: this.musicParseLead(raw.lead),
      bass: this.musicParseBass(raw.bass, beats),
      sparkle: raw.sparkle.map(s => ({ b: s[0], i: s[1], d: 1.5, v: s[0] === 4 ? 0.8 : 0.6 }))
    };
    this.musicTuneCache[id] = tune;
    return tune;
  },

  // Какие мелодии звучат в этом настроении (у каждого экрана свой набор)
  musicPool(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    return m.tunes && m.tunes.length ? m.tunes : ['walk'];
  },

  // Имя мелодии для панели настроек: «Домашняя», «Колыбельная»…
  musicTuneName() { return this.musicTune().name; },

  // Ноты круга: бас + мелодия + «звёздочки». Сдвиг (shift) поднимает/опускает
  // ВСЕ голоса вместе — созвучие сохраняется, а круг не повторяется «нота в ноту».
  musicEvents(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    const tune = this.musicTune();
    const shift = this.MUSIC_SHIFTS[this.musicShiftIndex % this.MUSIC_SHIFTS.length] || 0;
    const beat = 60 / m.bpm;
    const out = [];
    // step = true — высота задана СТУПЕНЬЮ гаммы (мелодия и «звёздочки»);
    // false — полутонами (бас и его «ум-пах»). v1.3.12: раньше ступени игрались
    // как полутоны, из-за чего в до-мажорной мелодии звучали фа-диез и ми-бемоль —
    // та самая «заунывная» фальшь. Теперь ступень переводится через musicScaleStep().
    const add = (list, type, vol, step, oct) => {
      (list || []).forEach(n => out.push({
        t: n.b * beat,
        freq: this.musicFreq((step ? this.musicScaleStep(n.i) : n.i) + shift + (oct || 0)),
        dur: Math.max(0.22, n.d * beat),
        vol: vol * (n.v === undefined ? 1 : n.v),
        type: type
      }));
    };
    add(tune.bass, 'sine', 0.16);              // бас совсем тихий: он и «трубил»
    add(tune.lead, m.lead, 0.23, true);        // мелодия — по ступеням гаммы
    // Та же мелодия на октаву выше и тихо — «стеклянный» голосок поверх (v1.3.12).
    // Заказчик: «звуки стали веселее, но надо бы их выше сделать… будто из трубы
    // сейчас всё играет». Октавное удвоение даёт игрушечное «дзынь», а фильтры в
    // ensureMusicGain() убирают гул и добавляют блеск — «труба» пропадает.
    add(tune.lead, 'sine', 0.095, true, 12);
    // «Звёздочки» — triangle, а не sine: верхний синус звучит одиноко и жутковато,
    // triangle даёт мягкий «колокольчик» (v1.3.10)
    add(tune.sparkle, 'triangle', 0.07, true);
    if (m.pulse) {
      this.musicUmPah(tune, beat, shift, out);   // четверти «ум-пах» (v1.3.12)
    }
    out.sort((a, b) => a.t - b.t);
    return out;
  },

  // Сколько нот круг выдаст целиком. Одной формулой это уже не описать (появились
  // «ум-пах» и октавный голосок мелодии, v1.3.12), поэтому считаем тем же кодом, что
  // и звучит: проверка «планировщик выдаёт ровно ноты круга» сверяет число с этим.
  musicLoopNoteCount(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    const tune = this.musicTune();
    // мелодия звучит дважды: сама и на октаву выше («стеклянный» голосок)
    let count = tune.bass.length + tune.lead.length * 2 + tune.sparkle.length;
    if (m.pulse) {
      const probe = [];
      this.musicUmPah(tune, 1, 0, probe);
      count += probe.length;
    }
    return count;
  },

  // «Ум-пах» (v1.3.12): четыре четверти на каждый аккорд баса — 1-я и 3-я на корне,
  // 2-я и 4-я на квинте. Это левая рука детской песенки: под мелодией слышен ход,
  // а не одна тянущаяся нота (именно из-за неё музыка казалась заунывной).
  MUSIC_UM_PAH_PER_BASS: 4,
  musicUmPah(tune, beat, shift, out) {
    (tune.bass || []).forEach(n => {
      for (let q = 0; q < this.MUSIC_UM_PAH_PER_BASS; q++) {
        const fifth = (q % 2 === 1);
        out.push({
          t: (n.b + q) * beat,
          freq: this.musicFreq(n.i + (fifth ? 7 : 0) + shift),   // корень / квинта
          dur: Math.max(0.22, beat * 0.42),
          vol: fifth ? 0.075 : 0.18,
          type: 'triangle'
        });
      }
    });
  },

  // Ноты не пересобираем по 60 раз в секунду — кэш на каждую мелодию и сдвиг
  musicEventsCached(mood) {
    // Ключ включает настроение: от него зависит «подскок» (pulse), а не только
    // мелодия со сдвигом — раньше при смене сцены могла остаться старая подложка.
    const key = mood + '|' + this.musicTune().id + '@' +
      this.MUSIC_SHIFTS[this.musicShiftIndex % this.MUSIC_SHIFTS.length];
    if (!this.musicCache) this.musicCache = {};
    if (!this.musicCache[key]) this.musicCache[key] = this.musicEvents(mood);
    return this.musicCache[key];
  },

  musicFreq(i) { return this.MUSIC_ROOT * Math.pow(2, i / 12); },

  musicLoopDuration(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    return this.MUSIC_BEATS * (60 / m.bpm);
  },

  // Круг доиграл: берём другую мелодию из пула и/или другой сдвиг, чтобы музыка
  // не была «одной и той же» (v1.3.5). Каждый второй круг меняет мелодию, а
  // сдвиг меняется каждый круг — то есть подряд две одинаковые петли не звучат.
  musicNextLoop() {
    this.musicLoops++;
    this.musicShiftIndex = (this.musicShiftIndex + 1) % this.MUSIC_SHIFTS.length;
    const pool = this.musicPool(this.musicMood());
    if (pool.length > 1) {
      this.musicTuneIndex = (this.musicTuneIndex + 1) % pool.length;
    }
    return this.musicTune();
  },

  // Сцена сообщает, где играет музыка: у каждого экрана свой характер.
  // Настроение не «залипает»: перешли в музей — зазвучала музейная мелодия.
  setScene(name) {
    const next = String(name || 'menu');
    if (next === this.musicScene) return this.musicMood();
    this.musicScene = next;
    this.musicCache = {};                  // ноты другого настроения пересоберём
    return this.musicMood();
  },

  // Настроение: спит — колыбельная; недавно нажали «🎵 Музыка» дома — слышнее;
  // в остальное время его задаёт экран (дом, магазин, мини-игры, музей, карта…).
  musicMood() {
    if (typeof System !== 'undefined' && System.isSleeping) return 'sleep';
    if (this.musicBoostUntil > Date.now()) return 'calm';
    const scene = this.musicScene || 'menu';
    if (scene === 'home') return 'home';
    if (scene === 'shop' || scene === 'minigames' || scene === 'quiet' ||
        scene === 'aerial' || scene === 'sport' || scene === 'friends') return 'play';
    if (scene === 'clinic') return 'museum';
    if (scene.indexOf('visit:') === 0) {
      // Тихая «музейная» музыка во всех музеях, библиотеке и учёбе. Список музеев
      // общий (MUSEUM_CATEGORIES), поэтому новый музей получает свою мелодию сам.
      const key = scene.slice(6);
      const museums = (typeof MUSEUM_CATEGORIES !== 'undefined') ? MUSEUM_CATEGORIES : [];
      const theaters = (typeof THEATER_IDS !== 'undefined') ? THEATER_IDS : [];
      const quiet = ['museums', 'theaters', 'library', 'school'].concat(museums, theaters);
      return quiet.indexOf(key) !== -1 ? 'museum' : 'play';
    }
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
      // v1.3.12: заказчик — «звуки стали веселее, но надо бы их выше сделать…
      // будто из трубы сейчас всё играет». «Труба» — это глухой тембр: синус и
      // треугольник дают мало высоких гармоник, а низкий бас съедал остальное.
      // Поэтому после регулятора громкости музыка проходит через два фильтра:
      // обрезной снизу (убирает гул) и подъём на 2.6 кГц (добавляет «стекло» и
      // звонкость, как у детской игрушки). Сам регулятор остаётся первым в цепочке,
      // поэтому выключение музыки по-прежнему даёт полную тишину.
      let node = this.musicGain;
      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 170;
      highpass.Q.value = 0.6;
      node.connect(highpass);
      node = highpass;
      const shine = this.ctx.createBiquadFilter();
      shine.type = 'peaking';
      shine.frequency.value = 2600;
      shine.Q.value = 0.9;
      shine.gain.value = 4.5;
      node.connect(shine);
      node = shine;
      const airy = this.ctx.createBiquadFilter();
      airy.type = 'highshelf';
      airy.frequency.value = 4200;
      airy.gain.value = 3;
      node.connect(airy);
      airy.connect(this.ctx.destination);
      this.musicMoodApplied = null;
    } catch (e) { this.musicGain = null; }
    return this.musicGain;
  },

  musicApplyMood(mood) {
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    if (this.musicGain && this.musicMoodApplied !== mood) {
      // Сменился экран или сон: начинаем с первой мелодии нового настроения —
      // так ребёнок замечает, что музыка другая, а не «та же, но тише» (v1.3.5)
      if (this.musicMoodApplied !== null) this.musicTuneIndex = 0;
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
    // Новый запуск музыки — начинаем с первой мелодии без сдвига: так проверки и
    // ребёнок видят предсказуемое начало, а дальше музыка меняется сама (v1.3.5)
    this.musicShiftIndex = 0;
    this.musicTuneIndex = 0;
    this.musicLoops = 0;
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
      // Круг доиграл — следующая мелодия (и/или сдвиг): музыка не повторяется
      const next = this.musicNextLoop();
      if (next && this.musicState) this.musicEventsCached(this.musicMood());
    }
    return true;
  },

  // Состояние музыки одним словарём: рисуется в настройках, проверяется тестами
  musicState() {
    const mood = this.musicMood();
    const m = this.MUSIC_MOODS[mood] || this.MUSIC_MOODS.ambient;
    const tune = this.musicTune();
    return {
      music: this.isMusicOn(),
      sound: this.isSoundOn(),
      playing: !!this.musicPlaying,
      mood: mood,
      bpm: m.bpm,
      gain: this.musicGainLevel,
      notes: this.musicLoopNoteCount(mood),
      pulse: !!m.pulse,
      loop: Math.round(this.musicLoopDuration(mood) * 10) / 10,
      played: this.musicNotesPlayed,
      tune: tune.id,
      tuneName: tune.name,
      tunesCount: this.MUSIC_TUNES.length,
      pool: this.musicPool(mood),
      shift: this.MUSIC_SHIFTS[this.musicShiftIndex % this.MUSIC_SHIFTS.length] || 0,
      loops: this.musicLoops,
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
