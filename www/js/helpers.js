// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.random() * (max - min) + min; }

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
const GAME_VERSION = '1.2';

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
        this.readFromClipboard((ok) => this.notify(ok ? '📥 Вставили из буфера' : 'Нажми на поле и удерживай → «Вставить»'));
      } else {
        this.copy(this.plainCode(), (ok) => this.notify(ok ? '📋 Код скопирован!' : 'Выдели код в поле и скопируй вручную'));
      }
    };
    if (paste) paste.onclick = () => {
      const txt = this.plainCode();
      if (this.share(txt)) this.notify('📤 Отправляем другу…');
      else this.notify('Скопируй код и отправь любым способом');
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
      set('clipPasteBtn', '📤 Отправить', true);
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

  // Поделиться кодом: системное окно Android, иначе SMS, иначе — копия в буфер
  share(text) {
    const value = String(text || '');
    try {
      if (navigator.share) {
        navigator.share({ title: 'Gopher Life', text: 'Мой код друга: ' + value }).catch(() => {});
        return true;
      }
    } catch (e) {}
    try {
      if (typeof openExternalLink === 'function' &&
          openExternalLink('sms:?body=' + encodeURIComponent('Мой код друга в Gopher Life: ' + value))) {
        return true;
      }
    } catch (e) {}
    this.copy(value, null);
    return false;
  }
};

window.ClipBridge = ClipBridge;

// Открыть ссылку во внешнем браузере (Android WebView тоже)
function openExternalLink(url) {
  try {
    if (window.cordova && window.cordova.InAppBrowser && window.cordova.InAppBrowser.open) {
      window.cordova.InAppBrowser.open(url, '_system');
      return true;
    }
  } catch (e) {}
  try {
    const w = window.open(url, '_system');
    if (w) return true;
  } catch (e) {}
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { document.body.removeChild(a); } catch (e) {} }, 200);
    return true;
  } catch (e) {}
  return false;
}
