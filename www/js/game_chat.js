// Чат с текущим питомцем. Сеть не используется: ответ выбирается из chat_lines.js.
class ChatScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.recent = [];
    this.bound = false;
    this.pending = null;   // «что я только что спросил» (null | 'mood'), чтобы понять ответ ребёнка
    this.guess = null;     // состояние текстовой игры «угадай слово»
    this.thread = null;    // о чём сейчас говорим, чтобы не прыгать в погоду и кашу
    this.turns = [];       // последние фразы ребёнка: эмбеддинг видит не только текущую
    this.bankCursor = 0;
  }

  init() {
    this.recent = [];
    this.lastTopic = null;
    this.pending = null;
    this.guess = null;
    this.thread = null;
    this.turns = [];
    this.bankCursor = 0;
    if (window.CHAT_MEMORY && window.CHAT_MEMORY.reset) window.CHAT_MEMORY.reset();
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
    this.turns = this.turns || [];
    this.turns.push(n);
    if (this.turns.length > 6) this.turns.shift();

    // 0) Текстовая игра «угадай слово»: пока идёт игра, любое слово — догадка.
    if (this.guess) return this.guessTurn(n);
    if (this.wantGuessGame(n)) return this.startGuessGame();

    // 1) Ответ на только что заданный вопрос («как дела?» → «не очень»). Раньше
    // такой ответ не распознавался и уходил в «какое тут главное слово?».
    const pending = this.answerPending(n);
    if (pending) return pending;

    // 2) Короткие «подхваты»: да/нет/понятно/ха-ха/«а ты?»/лёгкая грубость —
    // отвечаем тепло и продолжаем, вместо того чтобы требовать «одно слово».
    const ack = this.acknowledge(n);
    if (ack) return ack;

    // 3) Безопасность: вредные слова не пропускаем (как раньше).
    const blocked = this.topicById('safe');
    if (blocked && this.scoreTopic(n, blocked) > 0) {
      this.lastTopic = blocked;
      this.pending = null;
      return this.pick(blocked.replies);
    }

    // 4) Явные темы ребёнка важнее косинуса: «работы много» не про погоду,
    // «Милка» не про суп, «ты суслик» не про объятия. Косинус ниже остаётся
    // для перефразировок, которых нет в коротком списке.
    if (window.CHAT_TALK && window.CHAT_TALK.small) {
      const easy = window.CHAT_TALK.small(this, n);
      if (easy) return easy;
    }

    if (window.CHAT_MEMORY && window.CHAT_MEMORY.reply) {
      const recalled = window.CHAT_MEMORY.reply(this, text);
      if (recalled) return recalled;
    }

    if (window.CHAT_TALK && window.CHAT_TALK.reply) {
      const talked = window.CHAT_TALK.reply(this, text, n);
      if (talked) return talked;
    }

    const steered = this.steer(n);
    if (steered) return steered;

    // 5) Смысловой поиск по готовым темам. Случайную подстановку слова из банка не берём:
    // она ломала падеж («какой игрушка», «про друг»).
    const grounded = this.groundReply(n);
    if (grounded) return grounded;

    this.lastTopic = null;
    this.pending = null;
    return this.pick(window.CHAT_KID_FALLBACK || window.CHAT_FALLBACK);
  }

  // Ответ только про слово, которое ребёнок реально написал.
  // Шаблон «ошибки в {s}» сюда не попадает: падеж в нём ломается.
  plainAbout(id, word) {
    const q = '«' + word + '»';
    const lines = {
      animals: [
        'Про ' + q + '. Это добрый зверь, в рассказе он никого не обижает.',
        'Слышу ' + q + '. Пусть у этого зверя будет сытный день и тихий сон.'
      ],
      food: [
        'Про ' + q + '. Еду дома даёт взрослый, а я говорю «приятного аппетита».',
        'Слышу ' + q + '. Вкусно, когда не торопятся и благодарят.'
      ],
      family: [
        'Про ' + q + '. Это близкий человек: живой и важнее любой игры.',
        'Слышу ' + q + '. Я игрушка и его не заменяю.'
      ],
      school: [
        'Про ' + q + '. Это учёба. Ошибки бывают в тетради, их не стыдно исправлять.',
        'Слышу ' + q + '. Урок идёт по одному шагу, я не решаю его за тебя.'
      ],
      play: [
        'Про ' + q + '. Играем без слёз и по очереди.',
        'Слышу ' + q + '. Если надоело, можно спокойно остановиться.'
      ],
      nature: [
        'Про ' + q + '. На это можно смотреть долго и спокойно.',
        'Слышу ' + q + '. Природа никуда не спешит.'
      ],
      weather: [
        'Про ' + q + '. Погоду за окном я не вижу и говорю только про это слово.',
        'Слышу ' + q + '. Это про небо, не про другую тему.'
      ],
      scared: [
        'Про ' + q + '. Страшно бывает, монстров в этом чате нет.',
        'Слышу ' + q + '. Комната обычная, я рядом в игре.'
      ],
      how: [
        'Дела спокойные. Я рад, что ты написал.',
        'У меня всё тихо, можно просто поболтать.'
      ],
      hello: [
        'Привет. Я рядом.',
        'Здравствуй. Я слушаю.'
      ],
      moodGood: [
        'Здорово, что тебе хорошо.',
        'Я тоже этому рад.'
      ],
      moodBad: [
        'Мне жаль, что тяжело. Я рядом.',
        'Такое чувство можно назвать, и от этого чуть легче.'
      ]
    };
    return lines[id] || [
      'Я услышал ' + q + ' и остаюсь на этом слове.',
      'Слово ' + q + ' я не меняю на другое.'
    ];
  }

  withFocus(n, line) {
    this.noteFocus(n);
    const w = this.focusWord;
    const stem = window.Semantic && window.Semantic.stem;
    const root = stem ? stem(w || '') : '';
    const low = String(line || '').toLowerCase().replace(/ё/g, 'е');
    if (!w || !root || low.indexOf(root) !== -1) return line;
    return 'Про «' + w + '». ' + line;
  }

  noteFocus(n) {
    const skip = { ходил: 1, ходила: 1, ходили: 1, было: 1, была: 1, были: 1, тобой: 1, тебя: 1, тебе: 1, меня: 1, этом: 1, этот: 1, просто: 1, нормально: 1, очень: 1, расскажи: 1, это: 1, как: 1, что: 1, кто: 1, ещё: 1, еще: 1, про: 1, для: 1, или: 1 };
    const words = String(n || '').split(' ').filter(w => w.length >= 3 && !skip[w]);
    if (!words.length) return;
    words.sort((a, b) => b.length - a.length);
    this.focusWord = words[0];
  }

  holdFocus() {
    const w = this.focusWord;
    if (!w) return '';
    this.pending = null;
    return this.pick([
      'Мы всё ещё про «' + w + '».',
      'Я помню это слово: «' + w + '».'
    ]);
  }

  groundReply(n) {
    const miss = /бред|чушь|ерунд|не в тему|мимо|что за ответ/;
    if (miss.test(n) && this.focusWord) {
      this.pending = null;
      return this.pick([
        'Да, это было мимо. Тема одна: «' + this.focusWord + '».',
        'Согласен, фраза мимо. Остаёмся на «' + this.focusWord + '».'
      ]);
    }
    if (/^кто так/.test(n) && this.focusWord) {
      this.pending = null;
      return this.pick([
        'Нового героя я не называл. Мы про «' + this.focusWord + '».',
        'Это слово я не подменял. Речь про «' + this.focusWord + '».'
      ]);
    }

    const sem = window.CHAT_SEMANTIC;
    const hit = sem && sem.best ? sem.best(n) : null;
    if (hit && hit.word && hit.score >= (sem.THRESHOLD || 0.3)) {
      const topic = this.topicById(hit.id);
      this.focusWord = hit.word;
      this.thread = hit.id;
      this.lastTopic = topic || { id: hit.id };
      this.pending = topic && topic.ask ? topic.ask : null;
      return this.pick(this.plainAbout(hit.id, hit.word));
    }

    const noun = this.nounHit(n);
    if (noun) {
      this.focusWord = noun.word;
      this.thread = 'noun';
      this.pending = null;
      this.lastTopic = null;
      return this.pick(this.plainAbout('noun', noun.word));
    }

    const skip = { ходил: 1, ходила: 1, ходили: 1, было: 1, была: 1, были: 1, тобой: 1, тебя: 1, тебе: 1, меня: 1, этом: 1, этот: 1, просто: 1, нормально: 1, очень: 1, это: 1, как: 1, что: 1, кто: 1, ещё: 1, еще: 1, про: 1, для: 1, или: 1 };
    const words = n.split(' ').filter(w => w.length >= 3 && !skip[w]);
    if (words.length) {
      words.sort((a, b) => b.length - a.length);
      const word = words[0];
      const stem = window.Semantic && window.Semantic.stem;
      if (stem && this.focusWord && stem(word) === stem(this.focusWord)) return this.holdFocus();
      this.focusWord = word;
      this.thread = 'word';
      this.pending = null;
      this.lastTopic = { id: 'word' };
      return 'Я услышал слово «' + word + '» и не путаю его с другими.';
    }
    return this.holdFocus();
  }

  nounHit(n) {
    const nouns = window.CHAT_NOUNS || [];
    const stem = window.Semantic && window.Semantic.stem;
    if (!stem) return null;
    const words = n.split(' ').filter(w => w.length >= 4);
    let hit = null;
    for (let i = 0; i < nouns.length; i++) {
      const key = stem(nouns[i].key);
      if (key.length < 3) continue;
      for (let j = 0; j < words.length; j++) {
        if (stem(words[j]) !== key) continue;
        if (!hit || nouns[i].word.length > hit.word.length) hit = nouns[i];
      }
    }
    return hit;
  }

  // Короткий слой «держим тему». Пустая строка — пусть решает смысловой поиск.
  steer(n) {
    const has = (re) => re.test(n);
    const say = (thread, lines) => {
      this.thread = thread;
      this.pending = null;
      this.lastTopic = { id: thread };
      return this.pick(lines);
    };
    const who = (typeof findCharacter === 'function' && typeof System !== 'undefined')
      ? findCharacter((System.look && System.look.char) || 'gopher')
      : null;
    const pet = (who && who.name) || 'питомец';
    const toy = (who && who.toy) || 'игрушка';

    if (has(/при чем|мы же о|ты о чем|о чем ты|не про это|какая погода тут/)) {
      if (this.thread === 'work') return say('work', [
        'Да, мы про дела. Погоду я приплел зря.',
        'Работа так работа. Какое дело сейчас самое шумное?',
        'Уроки и дела. Погода подождёт, пока сам про неё не спросишь.'
      ]);
      if (this.thread === 'milka') return say('milka', [
        'Я про Милку. Это плюшевая игрушка из этой игры: белая, с зелёными ушками.'
      ]);
      if (this.thread === 'who') return say('who', [
        'Я про себя. Я ' + pet + ', игрушка на экране, не живой человек.'
      ]);
      if (this.focusWord) return say(this.thread || 'talk', [
        'Мы про «' + this.focusWord + '». Другое слово я сюда не подставляю.',
        'Тема не сменилась: «' + this.focusWord + '». Повтори, что с ним было.'
      ]);
      return say(this.thread || 'talk', [
        'Я сбился с темы. Повтори одним словом, о чём мы.'
      ]);
    }
    if (has(/^(что|а что|не понял|ничего не понял)$/) || has(/ты о чем|о чем это/)) {
      if (this.thread === 'milka') return say('milka', ['Про Милку: белая игрушка с зелёными ушками. Её можно выбрать героем.']);
      if (this.thread === 'work') return say('work', ['Про дела. Если это уроки — скажи предмет: счёт, буквы или чтение.']);
      if (this.thread === 'fact') return say('fact', ['Это был короткий факт. Напиши «ещё», если хочешь другой.']);
      if (this.thread === 'joke') return say('joke', ['Это была шутка. Если не смешно — так и скажи, я попробую другую.']);
      return say(this.thread || 'talk', ['Я про то, что ты только что написал. Скажи ещё раз проще.']);
    }

    if (has(/не смешно|не смешн|скучн(ая|ый) шутк/)) {
      return say('joke', [
        'Понял, та мимо. Ёжик спросил тень: «ты зачем за мной?» Тень промолчала и пошла дальше.',
        'Ладно, другая. Заяц спрятал морковку и сам её искал до ужина.',
        'Хорошо. Мишка надел два шарфа и сказал: «теперь я зима».'
      ]);
    }
    if (has(/анекдот|шутк|расскажи смешн|посмеши/)) {
      return say('joke', [
        'Ёжик надел носок на колючку и сказал: «я теперь варежка».',
        'Зайчонок спросил луну: «ты сыр?» Луна подмигнула и осталась лампой.',
        'Кот сел в коробку и заявил: «я почта». Никто не спорил.',
        'Пингвин купил шарф и сказал: «теперь я официально зима».'
      ]);
    }
    if (has(/урок|домашк|тетрад|школ|работы|работе|работу|дел много|некогда/)) {
      return say('work', [
        'Дел много — давай по одному. Назови, что горит.',
        'Урок я за тебя не решу. Скажи предмет: счёт, буквы или чтение — подскажу первый шаг.',
        'Если некогда болтать, напиши одно дело. Я коротко отвечу и отпущу.',
        'Работа бывает липкая. Маленький кусок уже считается делом.'
      ]);
    }
    if (has(/гроз|солнц|дожд|снег|снеж|туч|облак|погод|туман|ветер|град /) || n === 'град') {
      if (has(/гроз/)) return say('weather', [
        'Гроза — это гром и молния. Лучше остаться дома, пока не стихнет.',
        'В грозу шарики не выпускают: ветер их уносит. Ты сейчас дома?'
      ]);
      if (has(/солнц/)) return say('weather', ['Солнце — значит светло и можно гулять, если взрослый не против.']);
      if (has(/дожд/)) return say('weather', ['Дождь стучит по лужам. Сапоги и капюшон — и уже приключение.']);
      if (has(/снег|снеж/)) return say('weather', ['Снег тихий. Из него лепят ком, а в чат он не залетает.']);
      if (has(/туч|облак/)) return say('weather', ['Тучи закрыли солнце, но оно никуда не делось.']);
      return say('weather', [
        'Погоду за окном я не вижу. Назови: солнце, дождь, снег, тучи или гроза.',
        'Скажи, что за окном, и я отвечу именно про это.'
      ]);
    }
    if (has(/суслик/)) {
      return say('who', [
        'Суслик — полевой зверёк. Я ' + pet + ', игрушечный ' + toy + ', не живой суслик.',
        'Я не суслик с улицы. Я ' + pet + ' на экране. Суслик мне родственник только если герой — полевой зверёк.'
      ]);
    }
    if (has(/ты жив|ты настоя|ты робот|ты человек|кто ты|ты кто|как тебя зовут|твое имя|ты игрушк/)) {
      return say('who', [
        'Живой человек я не настоящий. Я ' + pet + ' в игре и говорю заранее записанными словами.',
        'Меня зовут ' + pet + '. Дышать и есть я не умею, зато могу болтать.',
        'Я персонаж. Если грустно по-настоящему, позови взрослого рядом.'
      ]);
    }
    if (has(/милк/)) {
      return say('milka', [
        'Милку знаю. Белая плюшевая игрушка с длинными ушами и зелёной подкладкой. Её можно выбрать героем.',
        'Милка живёт в этой игре рядом с мишкой, зайкой, котёнком и роботом.',
        'Милка — девочка-игрушка, не еда. Зелёные ушки, розовые подушечки на лапах.'
      ]);
    }
    if (n === 'еще' || n === 'дальше' || n === 'другое' || n === 'продолжай' || n === 'скажи' || n === 'начинай' || n === 'я тоже' || n === 'и я') {
      const held = this.holdFocus();
      if (held) return held;
    }
    if (has(/интересн|факт|расскажи что/) || n === 'еще' || n === 'ещё') {
      if (n === 'еще' || n === 'ещё' || this.thread === 'fact' || has(/интересн|факт|расскажи что/)) {
        return say('fact', [
          'У осьминога три сердца, и все они заняты морем, а не уроками.',
          'Пчела танцем показывает другим, где цветы. Карты у неё нет.',
          'Слон пьёт хоботом, как насосом, а спит мало: ему всё время надо помнить стадо.',
          'Бабочка пробует еду лапками. Ложка ей не нужна.',
          'Дельфин спит одним глазом: вторая половина мозга караулит.',
          'Почему небо днём светлое: солнце красится о воздух, и мы видим голубой кусок.'
        ]);
      }
    }
    if (this.thread === 'fact' && has(/глубок|мысл|сильно сказано|мудро|красиво сказано/)) {
      return say('fact', [
        'Рад, что зацепило. Напиши «ещё» — будет другой факт, такой же короткий.',
        'Это просто кусочек мира. Ещё один — по слову «ещё».'
      ]);
    }
    if (has(/как настроен|твое настроен|как сам|как ты сам|что ты как/)) {
      this.thread = 'how';
      this.pending = 'mood';
      this.lastTopic = { id: 'how' };
      return this.pick([
        'У меня ровное игровое настроение: тепло, когда пишут. А у тебя как?',
        'Я в порядке. Мне лучше, когда разговор про то, что ты сам начал. Ты как?'
      ]);
    }

    if (this.thread === 'work' && !has(/привет|пока|сказк|поигра|анекдот|милк|кто ты|как дела/)) {
      const sem = window.CHAT_SEMANTIC;
      const hit = sem && sem.best ? sem.best(n) : null;
      if (!hit || hit.score < 0.55) {
        return say('work', [
          'Слушаю про дела. Что из них можно сделать за пять минут?',
          'Я всё ещё про работу. Погода подождёт.'
        ]);
      }
    }
    return '';
  }

  // Самое длинное слово банка в реплике задаёт тему, если регулятор ещё не сработал.
  slotTopic(n) {
    const bank = window.CHAT_BANK;
    if (!bank || !bank.topics) return '';
    const hint = n.toLowerCase().replace(/ё/g, 'е');
    let id = '';
    let best = 3;
    Object.keys(bank.topics).forEach(k => {
      (bank.topics[k] || []).forEach(s => {
        const w = String(s).toLowerCase().replace(/ё/g, 'е');
        if (w.length > best && hint.indexOf(w) !== -1) {
          best = w.length;
          id = k;
        }
      });
    });
    if (!id) return '';
    return this.fromBank(id, n);
  }

  // Короткая реплика ищется вместе с прошлыми фразами и названием темы.
  contextQuery(n) {
    const words = n.split(' ').filter(Boolean);
    if (words.length > 4) return n;
    const prev = (this.turns || []).slice(0, -1).slice(-2).join(' ');
    return (n + ' ' + prev).replace(/\s+/g, ' ').trim();
  }

  // Эмбеддинг выбрал тему — фразу берём из банка, удерживая слово из реплики.
  fromBank(topicId, hint) {
    const bank = window.CHAT_BANK;
    if (!bank) return '';
    const alias = {
      work: 'school', joke: 'jokes', fact: 'questions', milka: 'play',
      moodGood: 'feelings', moodBad: 'feelings', how: 'feelings'
    };
    let id = bank.has(topicId) ? topicId : (alias[topicId] || '');
    const hintText = ((this.turns || []).join(' ' ) + ' ' + (hint || '')).trim();
    if (!id) {
      const hintN = hintText.toLowerCase().replace(/ё/g, 'е');
      const keys = Object.keys(bank.topics || {});
      for (let i = 0; i < keys.length; i++) {
        const slots = bank.topics[keys[i]] || [];
        if (slots.some(s => s.length >= 4 && hintN.indexOf(String(s).toLowerCase().replace(/ё/g, 'е')) !== -1)) {
          id = keys[i];
          break;
        }
      }
    }
    if (!id || !bank.has(id)) return '';
    const lines = [];
    this.bankCursor = (this.bankCursor || 0) + 1;
    for (let k = 0; k < 8; k++) lines.push(bank.line(id, this.bankCursor * 13 + k * 97, hintText));
    this.thread = id;
    this.pending = null;
    this.lastTopic = { id: topicId };
    return this.pick(lines.filter(Boolean));
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

  // Команда «угадай слово» запускает текстовую мини-игру на том же движке.
  wantGuessGame(n) {
    return ['угадай слово', 'угадайка', 'угадай что', 'угадай что я загадал', 'загадай слово',
      'давай в угадайку', 'поиграем в угадайку', 'сыграем в угадайку', 'игра в угадайку'].indexOf(n) !== -1;
  }

  startGuessGame() {
    const words = window.CHAT_GUESS_WORDS || [];
    const pickWord = words[Math.floor(Math.random() * words.length)];
    this.guess = { word: pickWord.word, hints: pickWord.hints, tries: 0 };
    this.lastTopic = null;
    this.pending = null;
    return this.pick((window.CHAT_GUESS_PHRASES || {}).start || ['Я загадал слово. Угадай!']);
  }

  // Догадка ребёнка: сравниваем с загаданным словом и его подсказками по косинусу.
  guessTurn(n) {
    const g = this.guess;
    if (!g) return '';
    const P = window.CHAT_GUESS_PHRASES || {};
    if (['стоп', 'хватит', 'выход', 'выйти', 'не хочу играть'].indexOf(n) !== -1) {
      this.guess = null;
      return this.pick(P.stop || ['Хорошо, поиграли.']);
    }
    const idf = (window.CHAT_SEMANTIC && window.CHAT_SEMANTIC.index) ? window.CHAT_SEMANTIC.index.idf : null;
    let best = 0;
    const targets = [g.word].concat(g.hints);
    for (const t of targets) {
      const s = Semantic.cosine(Semantic.vectorize(n, idf), Semantic.vectorize(t, idf));
      if (s > best) best = s;
    }
    g.tries++;
    if (best >= 0.5 || n === Semantic.normalize(g.word)) {
      const name = g.word;
      this.guess = null;
      return this.pick((P.win || []).map(p => p.split('{w}').join(name)));
    }
    if (best >= 0.35) return this.pick(P.hot || ['Очень тепло!']);
    if (best >= 0.2) return this.pick(P.warm || ['Тепло.']);
    return this.pick(P.cold || ['Холодно. Попробуй ещё.']);
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

  semanticGrounded(n, hit) {
    if (!hit || !hit.text) return false;
    const stop = { это: 1, меня: 1, тебе: 1, тебя: 1, тоже: 1, просто: 1, такой: 1, такая: 1, такое: 1, было: 1, была: 1, были: 1, хочу: 1, могу: 1, надо: 1 };
    const words = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е').split(' ').filter(w => w.length >= 4 && !stop[w]);
    const mine = words(n);
    const theirs = words(hit.text);
    if (!mine.length) return hit.score >= 0.97;
    return mine.some(w => theirs.some(h => h === w || (w.length >= 5 && (h.indexOf(w) === 0 || w.indexOf(h) === 0))));
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
