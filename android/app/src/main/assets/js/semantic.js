// ============ СМЫСЛОВОЙ ПОИСК: эмбеддинги без внешних библиотек и сети ============
// Текст превращается в разреженный вектор: полные слова + символьные 3/4-граммы
// с TF-IDF, сравнение — косинусное. Благодаря n-граммам «кот», «котик», «кошка»,
// «котёнок» близки, а синонимы и перефразировки дают ненулевой отклик — в отличие
// от точных ключевых слов.
//
// Интерфейс намеренно узкий (normalize/tokens/vectorize/Index), чтобы позже можно
// было заменить vectorize() на нейросетевые эмбеддинги (rubert-tiny2 через ONNX),
// не трогая остальной код.
(function () {
  function normalize(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Общий корень без падежного хвоста. «мама» и «маму» сходятся, «театр» и «тётя» нет:
  // остаток короче 3 букв не отрезаем, мягкий знак снимаем до сравнения.
  function stem(s) {
    let w = normalize(s).replace(/ь/g, '');
    if (!w || w.indexOf(' ') !== -1) w = w.split(' ')[0] || '';
    const ends = ['иями', 'ами', 'ями', 'ого', 'ему', 'ому', 'ыми', 'ими', 'иях', 'ах', 'ях', 'ами', 'ов', 'ев', 'ам', 'ям', 'ою', 'ею', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ой', 'ей', 'ий', 'ый', 'ом', 'ем', 'ую', 'юю', 'ия', 'ья', 'а', 'я', 'ы', 'и', 'у', 'ю', 'е', 'о'];
    if (w.length <= 3) return w;
    for (let i = 0; i < ends.length; i++) {
      const e = ends[i];
      if (w.length - e.length >= 3 && w.slice(w.length - e.length) === e) return w.slice(0, w.length - e.length);
    }
    return w;
  }

  // Слова + символьные 3/4-граммы с границами «#». «кот» → w:кот, g3:#ко, g3:кот,
  // g3:от#, g4:#кот, g4:кот# — поэтому «котик» и «кот» пересекаются.
  function tokens(s) {
    const out = new Set();
    const words = s.split(' ');
    for (const w of words) {
      if (!w) continue;
      out.add('w:' + w);
      const p = '#' + w + '#';
      for (let i = 0; i + 3 <= p.length; i++) out.add('g3:' + p.slice(i, i + 3));
      for (let i = 0; i + 4 <= p.length; i++) out.add('g4:' + p.slice(i, i + 4));
    }
    return Array.from(out);
  }

  // Документная частота: сколько строк корпуса содержат токен.
  function countDf(corpus) {
    const df = new Map();
    for (const text of corpus) {
      const seen = new Set(tokens(normalize(text)));
      for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
    }
    return df;
  }

  // TF-IDF-вектор (Map токен → вес). Слова чуть весомее грамм.
  function vectorize(text, idf) {
    const toks = tokens(normalize(text));
    const tf = new Map();
    for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
    const vec = new Map();
    for (const [t, c] of tf) {
      const idfv = idf ? (idf.get(t) || 1) : 1;
      const base = (1 + Math.log(c)) * idfv;
      vec.set(t, base * (t.charAt(0) === 'w' ? 1.5 : 1));
    }
    return vec;
  }

  function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (const [t, v] of a) {
      na += v * v;
      if (b.has(t)) dot += v * b.get(t);
    }
    if (!dot) return 0;
    for (const v of b.values()) nb += v * v;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  class Index {
    // entries: [{ id, text, ... }] — заранее векторизуются по корпусу из самих text.
    constructor(entries) {
      this.entries = entries || [];
      this.corpus = this.entries.map(e => e.text);
      this.idf = countDf(this.corpus);
      this.vectors = this.entries.map(e => vectorize(e.text, this.idf));
    }
    size() { return this.entries.length; }
    // top-k ближайших: [{ id, text, score, ... }]
    search(query, k) {
      const q = vectorize(query, this.idf);
      const scored = [];
      for (let i = 0; i < this.vectors.length; i++) {
        const s = cosine(q, this.vectors[i]);
        if (s > 0) scored.push(Object.assign({ score: s }, this.entries[i]));
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k || 5);
    }
    best(query) { return this.search(query, 1)[0] || null; }
  }

  window.Semantic = { normalize, stem, tokens, vectorize, cosine, countDf, Index };
})();
