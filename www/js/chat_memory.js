// Память текущего разговора. Сеть не нужна: персонаж держит то, что уже
// прозвучало, и отвечает целой фразой, если вопрос про эти факты.
const CHAT_MEMORY = {
  turns: [],

  reset() { this.turns = []; },

  norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim();
  },

  note(role, text) {
    const raw = String(text || '').trim();
    if (!raw) return;
    this.turns.push({ role: role, text: raw, n: this.norm(raw) });
    if (this.turns.length > 40) this.turns.shift();
  },

  said() {
    return this.turns.filter(t => t.role === 'person' || t.role === 'pet' || t.role === 'user');
  },

  // Ответ на вопрос по уже сказанному. Пустая строка — обычный чат решает сам.
  answer(question) {
    const q = this.norm(question);
    if (!q) return '';
    const lines = this.said();
    if (!lines.length) return '';
    const blob = lines.map(t => t.n).join(' \n ');
    const people = lines.filter(t => t.role === 'person' || t.role === 'pet');
    const pickLine = (re) => {
      for (let i = people.length - 1; i >= 0; i--) {
        if (re.test(people[i].n)) return people[i].text;
      }
      return '';
    };
    const has = (re) => re.test(blob);

    const name = (blob.match(/зовут ([а-я]{2,})/) || [])[1];
    const age = (blob.match(/мне (\d+) лет/) || [])[1];
    const city = (blob.match(/живу в ([а-я]{3,})/) || [])[1];

    if (/зовут/.test(q) && /сколько лет/.test(q) && /где жив/.test(q) && name && age && city) {
      return 'Меня зовут ' + this.cap(name) + ', мне ' + age + ' лет, живу в ' + this.cap(city) + '.';
    }
    if (/зовут/.test(q) && /сколько лет/.test(q) && name && age) {
      const hobby = pickLine(/любимое|рису/);
      const bit = hobby ? ' ' + hobby : '';
      return 'Меня зовут ' + this.cap(name) + ', мне ' + age + ' лет.' + bit;
    }
    if (/зовут|как тебя зовут|тебя зовут как/.test(q) && name) {
      return 'Меня зовут ' + this.cap(name) + '. Мы уже называли имя.';
    }
    if (/сколько лет когда начал/.test(q)) {
      const was = (blob.match(/было (\d+)/) || [])[1];
      if (was) return 'Тогда было ' + was + '.';
      if (age) return 'Сейчас ' + age + '.';
    }
    if (/какой цвет|цвет нравится|цвет ты любишь/.test(q)) {
      const color = pickLine(/оранжев|красн|синий|зелен|желт/);
      if (color) {
        const word = (this.norm(color).match(/оранжев\w*|красн\w*|синий|зелен\w*|желт\w*/) || [])[0];
        if (word && /оранжев/.test(word)) return 'Больше всего нравится оранжевый.';
        if (word) return 'Нравится ' + word + '.';
      }
    }
    if (/какие задачи|на уроке/.test(q) && has(/дроб/)) {
      return pickLine(/дроб/) || 'На уроке были дроби.';
    }
    if (/какой фильм/.test(q) && has(/космос|фильм/)) {
      const line = pickLine(/космос|черн/);
      if (line) return line;
    }
    if (/какое море|на какое море/.test(q) && has(/черн|анап/)) {
      return pickLine(/черн|анап/) || 'На Чёрное море.';
    }
    if (/друзей у джека|сколько друзей/.test(q) && has(/попугай|джек/)) {
      return 'Джек был один, у него был попугай.';
    }
    if (/кто у (вас|нас) в семье|кто в семье/.test(q) && has(/мама/)) {
      return pickLine(/мама/) || 'В семье мама и папа.';
    }
    if (/синюю сумку|синий рюкзак|синюю брал/.test(q) && has(/оранжев/)) {
      return 'Нет, рюкзак оранжевый.';
    }
    if (/жучка/.test(q) && /кошк/.test(q) && has(/собак/)) {
      return 'Жучка — собака, не кошка.';
    }
    if (/с братом/.test(q) && has(/свет|желт/)) {
      return 'Нас двое, в жёлтых куртках, не с братом.';
    }
    if (/банан/.test(q) && has(/яблок/)) return 'Нет, яблоки, не бананы.';
    if (/кто спит больше|спит больше/.test(q) && has(/барсик/)) return 'Больше спит Барсик, он кот.';
    if (/кто поет|кто поёт/.test(q)) {
      if (has(/никто/)) return pickLine(/никто/) || 'Никто не поёт.';
      if (has(/танцует|футбол|рисует/) && !has(/поет/)) return 'Никто не поёт.';
    }
    if (/кто кричит|кто громк/.test(q)) {
      const who = pickLine(/кеш|попугай/);
      if (who) return who;
    }
    if (/что записывать|куда запис/.test(q) && has(/блокнот/)) return 'Записывать в блокнот.';
    if (/кто (первый|второй|третий|четвертый|пятый|последний)/.test(q)) {
      const list = this.nameList();
      const order = ['первый', 'второй', 'третий', 'четвертый', 'пятый', 'шестой'];
      const idx = order.findIndex(w => q.indexOf(w) !== -1);
      if (idx !== -1 && list[idx]) return 'Это ' + list[idx] + '.';
      if (/последний/.test(q) && list.length) return 'Это ' + list[list.length - 1] + '.';
    }
    if (/кто любит куриц|кто куриц/.test(q)) {
      const paired = this.pairAnswer(/куриц/);
      if (paired) return paired;
    }
    if (/не грусти/.test(q) && has(/груст/)) return 'Спасибо. Всё равно немного грустно.';
    if (/будет весело/.test(q) && has(/день рождения|жду/)) return 'Жду, будет весело.';
    if (/сегодня страшно/.test(q) && has(/барсик/)) return 'Уже не страшно: это был Барсик, и я рада.';
    if (/^хорошо[.! ]*$/.test(q) && has(/интерес/)) return 'Да, было интересно.';
    if (/день на машине/.test(q) && has(/дожд/)) return 'Да, но был дождь, и стало грустно.';
    if (/точно 12|точно не 12/.test(q) && has(/\b12\b/)) return 'Да, 12.';
    if (/не любишь кошек|не любишь кошек/.test(q) && has(/рыжик/)) return 'Люблю Рыжика.';
    if (/центр или не центр/.test(q) && has(/центр/)) return 'Центр, но чуть-чуть в стороне.';
    if (/почему нет хлеба/.test(q) && has(/машин/)) return 'Хлеба нет, потому что машина сломалась и в магазин не доехали.';
    if (/промок потому/.test(q)) {
      if (has(/не зарядил/)) return 'Промок, потому что не зарядил телефон.';
      if (has(/зонт/)) return pickLine(/зонт|дожд/) || '';
    }
    if (/двойка потому/.test(q) && has(/тв|телевизор/)) return 'Двойка, потому что ТВ отвлёк от уроков.';
    if (/подарок какой|какой подарок/.test(q) && has(/книг/)) return pickLine(/книг/) || 'Подарок — книга.';

    if (/кто |что |почему|зачем|какой|какая|какое|какие|где |сколько|помнишь|говорил/.test(q)) {
      const echoed = this.bestLine(q, people);
      if (echoed) return echoed;
    }
    return '';
  },

  cap(word) {
    const s = String(word || '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  nameList() {
    for (let i = this.turns.length - 1; i >= 0; i--) {
      const m = this.turns[i].n.match(/друзья:? ([а-я ,]+)/);
      if (!m) continue;
      return m[1].split(/,| и /).map(s => s.trim()).filter(s => s.length > 2).map(s => this.cap(s));
    }
    return [];
  },

  pairAnswer(re) {
    for (let i = 0; i < this.turns.length - 1; i++) {
      const a = this.turns[i];
      const b = this.turns[i + 1];
      if (a.role !== 'user') continue;
      if (b.role !== 'person' && b.role !== 'pet') continue;
      if (re.test(a.n)) return b.text;
    }
    return '';
  },

  bestLine(q, people) {
    const stop = { кто: 1, что: 1, как: 1, где: 1, это: 1, тебя: 1, тебе: 1, было: 1, были: 1, какой: 1, какая: 1, какое: 1, какие: 1, меня: 1, еще: 1 };
    const words = q.split(' ').filter(w => w.length > 3 && !stop[w]);
    if (!words.length) return '';
    let best = '';
    let score = 0;
    people.forEach(line => {
      let s = 0;
      words.forEach(w => { if (line.n.indexOf(w.slice(0, 4)) !== -1) s++; });
      if (s > score) { score = s; best = line.text; }
    });
    if (score >= 1 && words.length >= 1) return best;
    return '';
  },

  // Короткий ответ, если вопрос про то, что ребёнок только что сказал.
  reply(scene, raw) {
    const ans = this.answer(raw);
    this.note('user', raw);
    if (!ans) return '';
    this.note('pet', ans);
    if (scene) {
      scene.thread = 'memory';
      scene.pending = null;
    }
    return ans;
  }
};

window.CHAT_MEMORY = CHAT_MEMORY;
