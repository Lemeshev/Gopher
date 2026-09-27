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

  return { x, y, w, h };
}

function isPointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}
