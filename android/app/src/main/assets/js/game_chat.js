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
  }

  init() {
    this.recent = [];
    this.lastTopic = null;
    this.pending = null;
    this.guess = null;
    this.thread = null;
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
    const steered = this.steer(n);
    if (steered) return steered;

    // 5) Смысловой поиск по темам: эмбеддинги (слова + n-граммы, косинус).
    const sem = window.CHAT_SEMANTIC;
    if (sem && sem.best) {
      const hit = sem.best(n);
      if (hit && hit.score >= (sem.THRESHOLD || 0.3)) {
        const topic = this.topicById(hit.id);
        if (topic) {
          this.lastTopic = topic;
          this.pending = topic.ask || null;
          return this.pick(topic.replies);
        }
      }
    }

    // 6) Одиночное существительное без своей темы — общий тёплый отклик про слово.
    const nounLine = this.nounLine(n);
    if (nounLine) return nounLine;

    this.lastTopic = null;
    this.pending = null;
    return this.pick(window.CHAT_KID_FALLBACK || window.CHAT_FALLBACK);
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
    if (has(/урок|домашк|тетрад|школ|работ|дел много|некогда/)) {
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
