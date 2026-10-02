// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.random() * (max - min) + min; }

// ============ ИМЯ ГЕРОЯ В ТЕКСТЕ (v1.3.4) ============
// Заказчик: «все другие персонажи тоже называются Гоферами, хотя у них есть свои
// имена. Гофер должен быть только для гофера». Поэтому ни одна подпись в игре не
// знает, кто именно герой: в тексте пишем шаблон, а слово подставляется из
// CHARACTERS[i].pet (см. characters.js):
//   {Pet}       — имя с большой буквы: «Гофер», «Мишка», «Милка»
//   {pet}       — то же в середине фразы: «гофер», «мишка», «Милка»
//   {pet_gen}   — кого/чего:  «гофера», «Милки»
//   {pet_dat}   — кому:       «гоферу», «Милке»
//   {pet_acc}   — вижу:       «гофера», «Милку»
//   {pet_ins}   — с кем:      «гофером», «Милкой»
//   {pet_he} {pet_his} {pet_by} — он/она, его/её, ним/ней
//   {pet:м|ж}   — выбор по роду героя: «{pet:нашёл|нашла}»
//   {pet_gen^}  — форма с большой буквы (начало предложения)
// Подстановка одна на всю игру: любой текст, попадающий на экран, проходит через
// petFill() — и на канвасе (перехват fillText/measureText ниже), и в HTML-плашке
// достижений (System.showAchievement). Так «гофер» не останется у другого героя.
const PET_PRON = {
  m: { he: 'он', his: 'его', by: 'ним' },
  f: { he: 'она', his: 'её', by: 'ней' }
};

// Текущий герой (или гофер по умолчанию, если System ещё не готов)
function petHero() {
  if (typeof System !== 'undefined' && System.hero) return System.hero();
  // До загрузки CHARACTERS текстов ещё нет — имя не важно, лишь бы не врало
  return (typeof CHARACTERS !== 'undefined') ? CHARACTERS[0] : { name: 'Питомец', gender: 'm', pet: {} };
}

// Слово героя в нужной форме: petWord('acc') → «гофера» / «Милку»
function petWord(form) {
  const h = petHero();
  const pet = h.pet || {};
  return pet[form || 'nom'] || h.name;
}

function petGenderFemale() { return petHero().gender === 'f'; }

// Заполнить шаблон героем: petFill('Покорми {pet_acc}') → «Покорми мишку».
// Без шаблона строка возвращается как есть (быстрый путь для всех прочих подписей)
function petFill(text) {
  // Быстрый путь: шаблонов нет (регистр важен — {Pet} тоже шаблон!)
  if (typeof text !== 'string' || !/\{pet/i.test(text)) return text;
  const h = petHero();
  const pron = PET_PRON[h.gender === 'f' ? 'f' : 'm'];
  const up = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return text.replace(/\{pet:[^}]*\}|\{Pet\}|\{pet(?:_(?:nom|gen|dat|acc|ins|he|his|by))?\^?\}/g, (m) => {
    if (m.indexOf('{pet:') === 0) {                    // {pet:м|ж} — выбор по роду
      const parts = m.slice(5, -1).split('|');
      return (h.gender === 'f' && parts[1] !== undefined) ? parts[1] : parts[0];
    }
    if (m === '{Pet}') return h.name;                  // имя героя с большой буквы
    const key = m.slice(5, -1).replace(/^_/, '').replace('^', '') || 'nom';
    const word = (pron[key] !== undefined) ? pron[key] : (h.pet && h.pet[key]) || h.name;
    return (m.indexOf('^}') !== -1) ? up(word) : word;
  });
}

// Перехват отрисовки текста: подставляем героя в ЛЮБУЮ подпись на канвасе
// (пузыри, подсказки, достижения, справка). measureText — чтобы ширина строки
// считалась по уже подставленному тексту и вёрстка не «плыла».
function installPetText(Proto) {
  const fillText = Proto.fillText;
  const strokeText = Proto.strokeText;
  const measureText = Proto.measureText;
  Proto.fillText = function (text) {
    const args = [].slice.call(arguments);
    args[0] = petFill(text);
    return fillText.apply(this, args);
  };
  if (strokeText) {
    Proto.strokeText = function (text) {
      const args = [].slice.call(arguments);
      args[0] = petFill(text);
      return strokeText.apply(this, args);
    };
  }
  if (measureText) {
    Proto.measureText = function (text) {
      return measureText.call(this, petFill(text));
    };
  }
}
if (typeof CanvasRenderingContext2D !== 'undefined') installPetText(CanvasRenderingContext2D.prototype);

function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

function drawProgressBar(ctx, x, y, w, h, value, max, bgColor, fgColor) {
  const ratio = clamp(value / max, 0, 1);
  // Background
  ctx.fillStyle = bgColor || 'rgba(0,0,0,0.3)';
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  // Foreground
  const fw = w * ratio - 2;
  if (fw > 0) {
    ctx.fillStyle = fgColor;
    roundRect(ctx, x + 1, y + 1, fw, h - 2, 3);
    ctx.fill();
  }
}

function createButton(ctx, x, y, w, h, text, opts = {}) {
  const {
    bgColor = '#FF6B6B',
    fgColor = '#ffffff',
    fontSize = 16,
    radius = 15,
    borderColor = null,
    shadow = true,
    hover = false
  } = opts;

  // Shadow
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    roundRect(ctx, x + 3, y + 3, w, h, radius);
    ctx.fill();
  }

  // Button
  ctx.fillStyle = bgColor;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();

  // Border
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, radius);
    ctx.stroke();
  }

  // Text
  ctx.fillStyle = fgColor;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);

  // ВАЖНО: возвращаем text — сцены используют btn.text для определения действия
  return { x, y, w, h, text };
}

function isPointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// Подобрать размер шрифта так, чтобы текст влез в maxW
function fitFontSize(ctx, text, maxW, baseSize, minSize, bold) {
  let size = baseSize;
  const min = minSize || 7;
  while (size > min) {
    ctx.font = (bold ? 'bold ' : '') + size + 'px Arial, sans-serif';
    if (ctx.measureText(text).width <= maxW) return size;
    size -= 0.5;
  }
  ctx.font = (bold ? 'bold ' : '') + min + 'px Arial, sans-serif';
  return min;
}

// UTF-8 в байты и обратно — считаем сами: и в WebView, и в песочнице проверок
// работает одинаково (TextEncoder есть не везде). Нужно для имени внутри кода
// друга: там русские буквы, а код — это цифры и заглавные латинские буквы.
function utf8ToBytes(str) {
  const s = String(str == null ? '' : str);
  const out = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
      const c2 = s.charCodeAt(i + 1);
      if (c2 >= 0xDC00 && c2 <= 0xDFFF) { c = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00); i++; }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

function bytesToUtf8(bytes) {
  let out = '';
  const b = bytes || [];
  for (let i = 0; i < b.length;) {
    const first = b[i++];
    let c;
    if (first < 0x80) c = first;
    else if (first >= 0xC0 && first < 0xE0) c = ((first & 31) << 6) | ((b[i++] || 0) & 63);
    else if (first >= 0xE0 && first < 0xF0) {
      c = ((first & 15) << 12) | (((b[i++] || 0) & 63) << 6) | ((b[i++] || 0) & 63);
    } else {
      c = ((first & 7) << 18) | (((b[i++] || 0) & 63) << 12) |
        (((b[i++] || 0) & 63) << 6) | ((b[i++] || 0) & 63);
    }
    if (c > 0xFFFF) { c -= 0x10000; out += String.fromCharCode(0xD800 + (c >> 10), 0xDC00 + (c & 1023)); }
    else out += String.fromCharCode(c);
  }
  return out;
}

// Разбить текст на строки по ширине (не больше maxLines)
function wrapLines(ctx, text, maxW, maxLines) {
  const words = String(text == null ? '' : text).split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (!cur || ctx.measureText(test).width <= maxW) cur = test;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  const max = maxLines || 2;
  if (lines.length > max) {
    const tail = lines.slice(max - 1).join(' ');
    lines.length = max - 1;
    lines.push(tail);
  }
  return lines;
}

// ============ ВЕРСИЯ И ВНЕШНИЕ ССЫЛКИ ============
const GAME_VERSION = '1.3.16';

// ============ БУФЕР ОБМЕНА И ВВОД ТЕКСТА ============
// Проблема: в canvas-игре нельзя выделить текст, а значит нельзя скопировать
// код друга. Android WebView не даёт доступ к буферу из canvas.
// Решение: поверх игры есть НАСТОЯЩИЕ поля ввода (input/textarea) в разметке.
// Их WebView умеет копировать и вставлять штатным меню Android.
//
// Порядок копирования:
//   1) выделить текст в поле и вызвать document.execCommand('copy') — работает
//      и в старых WebView (без secure context);
//   2) если не вышло — navigator.clipboard.writeText (современный путь).
// Вставка: либо кнопка «Вставить из буфера» (navigator.clipboard.readText),
// либо ребёнок делает долгое нажатие в поле и выбирает «Вставить» в меню Android.
const ClipBridge = {
  _opts: null,
  _onSubmit: null,
  _onCancel: null,

  el(id) { try { return document.getElementById(id); } catch (e) { return null; } },
  panel() { return this.el('clipPanel'); },
  field() { return this.el('clipField'); },
  field2() { return this.el('clipField2'); },
  titleEl() { return this.el('clipTitle'); },
  hintEl() { return this.el('clipHint'); },
  btn(id) { return this.el(id); },

  available() { return !!this.panel(); },

  notify(text) {
    try {
      if (typeof System !== 'undefined' && System.showAchievement) System.showAchievement('🐹', text);
    } catch (e) {}
  },

  value() { const f = this.field(); return f ? String(f.value || '') : ''; },
  value2() { const f = this.field2(); return f ? String(f.value || '') : ''; },

  // Код без дефисов в начале строки — так его вставляют и так им делятся
  plainCode() {
    const raw = this.value() + (this.value2() ? ' ' + this.value2() : '');
    return raw.replace(/\s+/g, ' ').trim();
  },

  fill(text) {
    const f2 = this.field2();
    const visible2 = f2 && f2.style && f2.style.display !== 'none';
    if (visible2) f2.value = text;
    else { const f = this.field(); if (f) f.value = text; }
  },

  // Подключить обработчики кнопок панели (вызывается один раз при старте игры)
  attach(onSubmit, onCancel) {
    this._onSubmit = onSubmit || null;
    this._onCancel = onCancel || null;
    const copy = this.btn('clipCopyBtn');
    const paste = this.btn('clipPasteBtn');
    const submit = this.btn('clipSubmitBtn');
    const close = this.btn('clipCloseBtn');

    if (copy) copy.onclick = () => {
      if (this.mode === 'paste') {
        this.readFromClipboard((ok) => {
          if (ok) { this.notify('📥 Вставили из буфера'); return; }
          // В WebView из file:// системный буфер прочитать нельзя — раньше кнопка
          // молча ничего не делала. Теперь объясняем путь через меню Android и
          // сразу ставим курсор в поле кода: остаётся удержать палец → «Вставить».
          if (this.hintEl()) {
            this.hintEl().textContent = 'Буфер недоступен приложению. Нажми на поле кода и удерживай палец — появится меню Android, выбери «Вставить». Или набери 16 знаков руками.';
          }
          const f2v = this.field2();
          const visible2 = f2v && f2v.style && f2v.style.display !== 'none';
          const target = visible2 ? f2v : this.field();
          if (target && target.focus) {
            try { target.focus(); if (target.select) target.select(); } catch (e) {}
          }
          this.notify('Удерживай палец в поле кода — меню Android → «Вставить»');
        });
      } else {
        this.copy(this.plainCode(), (ok) => this.notify(ok ? '📋 Код скопирован!' : 'Выдели код в поле и скопируй вручную'));
      }
    };
    if (paste) paste.onclick = () => {
      const txt = this.plainCode();
      if (this.share(txt)) this.notify('📤 Открываем «Поделиться»…');
      else this.notify('📋 Код скопирован — вставь его в сообщение другу');
    };
    if (submit) submit.onclick = () => {
      if (this._onSubmit) this._onSubmit(this.value(), this.value2());
    };
    if (close) close.onclick = () => {
      this.hide();
      if (this._onCancel) this._onCancel();
    };
    return this;
  },

  // Показать панель. mode: 'copy' (мой код) | 'paste' (добавить друга)
  show(opts) {
    const o = opts || {};
    const p = this.panel();
    if (!p) return false;
    this.mode = o.mode || 'copy';

    if (this.titleEl()) this.titleEl().textContent = o.title || '';
    if (this.hintEl()) this.hintEl().textContent = o.hint || '';

    const f = this.field();
    if (f) {
      f.value = o.value || '';
      f.readOnly = !!o.readonly;
      if (o.placeholder) f.placeholder = o.placeholder;
    }
    const f2 = this.field2();
    if (f2) {
      const show2 = o.value2 !== undefined;
      if (f2.style) f2.style.display = show2 ? 'block' : 'none';
      if (show2) {
        f2.value = o.value2 || '';
        f2.placeholder = o.value2Label || '';
      }
    }

    const set = (id, label, visible) => {
      const b = this.btn(id);
      if (!b) return;
      if (b.style) b.style.display = visible ? 'inline-block' : 'none';
      if (label) b.textContent = label;
    };
    if (this.mode === 'copy') {
      set('clipCopyBtn', '📋 Скопировать', true);
      set('clipPasteBtn', '📤 Поделиться', true);
      set('clipSubmitBtn', null, false);
    } else {
      set('clipCopyBtn', '📥 Вставить из буфера', true);
      set('clipPasteBtn', null, false);
      set('clipSubmitBtn', o.submitLabel || '➕ Добавить', true);
    }
    if (p.style) p.style.display = 'block';

    this._opts = o;
    return true;
  },

  hide() {
    const p = this.panel();
    if (p && p.style) p.style.display = 'none';
    const f = this.field();
    if (f) f.value = '';
    const f2 = this.field2();
    if (f2) f2.value = '';
    this._opts = null;
  },

  // Копирование с гарантированным запасным путём
  copy(text, done) {
    const value = String(text || '');
    let ok = false;
    const f = this.field();
    try {
      if (f && document.execCommand) {
        const prevValue = f.value;
        const prevRO = f.readOnly;
        f.readOnly = false;
        f.value = value;
        if (f.focus) f.focus();
        if (f.setSelectionRange) f.setSelectionRange(0, value.length);
        if (f.select) { try { f.select(); } catch (e) {} }
        ok = !!document.execCommand('copy');
        f.readOnly = prevRO;
        f.value = prevValue;
      }
    } catch (e) { ok = false; }
    if (!ok) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value)
            .then(() => { if (done) done(true); })
            .catch(() => { if (done) done(false); });
          return true;
        }
      } catch (e) {}
    }
    if (done) done(ok);
    return ok;
  },

  // Вставка из системного буфера (если доступна)
  readFromClipboard(cb) {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText()
          .then(txt => {
            if (txt && String(txt).trim()) { this.fill(String(txt).trim()); cb(true); }
            else cb(false);
          })
          .catch(() => cb(false));
        return;
      }
    } catch (e) {}
    cb(false);
  },

  // Поделиться кодом. Порядок: мост Android (системное окно «Поделиться»), Web
  // Share API, копия в буфер. Ссылок вида «sms:?body=…» больше НЕТ: WebView не
  // умеет открывать такие схемы и показывал ребёнку страницу ошибки
  // «Не удалось открыть веб-страницу: net::ERR_UNKNOWN_URL_SCHEME» вместо игры
  // (жалоба заказчика 01.10.2026). Теперь телефон и почту запускает сама обёртка
  // через WebViewClient.shouldOverrideUrlLoading, а если и этого нет — код просто
  // копируется, и панель говорит, что делать дальше.
  share(text) {
    const value = String(text || '');
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.share === 'function') {
        window.AndroidBridge.share(value);
        return true;
      }
    } catch (e) {}
    try {
      if (navigator.share) {
        navigator.share({ title: 'Gopher Life', text: 'Мой код друга: ' + value }).catch(() => {});
        return true;
      }
    } catch (e) {}
    this.copy(value, null);
    return false;
  }
};

window.ClipBridge = ClipBridge;

// Открыть ссылку во внешнем браузере (Android WebView тоже).
// v1.3.12: разрешены ТОЛЬКО веб-ссылки. Схемы вроде «sms:», «tel:» и «whatsapp:»
// WebView сам не открывает — он показывает страницу ошибки
// «net::ERR_UNKNOWN_URL_SCHEME» прямо внутри игры (жалоба заказчика 01.10.2026).
// Телефон, почту и SMS запускает Android-обёртка через
// WebViewClient.shouldOverrideUrlLoading, а игра такие ссылки не открывает.
function openExternalLink(url) {
  const u = String(url || '').trim();
  if (!/^https?:\/\//i.test(u)) return false;
  try {
    if (window.cordova && window.cordova.InAppBrowser && window.cordova.InAppBrowser.open) {
      window.cordova.InAppBrowser.open(u, '_system');
      return true;
    }
  } catch (e) {}
  try {
    const w = window.open(u, '_system');
    if (w) return true;
  } catch (e) {}
  try {
    const a = document.createElement('a');
    a.href = u;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { document.body.removeChild(a); } catch (e) {} }, 200);
    return true;
  } catch (e) {}
  return false;
}
