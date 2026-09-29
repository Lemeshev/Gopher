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
const GAME_VERSION = '1.1';

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
