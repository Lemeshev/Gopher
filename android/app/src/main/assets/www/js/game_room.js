// ============ ОБЩАЯ ОТРИСОВКА КОМНАТЫ ============
// Один и тот же рендер используется дома у игрока и в гостях у друзей:
// различаются только обои, пол и расстановка мебели.
const RoomView = {
  // Зоны внутри прямоугольника комнаты (доли от его высоты)
  wallZone: { top: 0.03, bottom: 0.50 },
  floorZone: { top: 0.50, bottom: 0.99 },

  zoneOf(id) {
    const f = (typeof findFurniture === 'function') ? findFurniture(id) : null;
    return (f && f.zone === 'wall') ? 'wall' : 'floor';
  },

  yRange(id) {
    return this.zoneOf(id) === 'wall' ? this.wallZone : this.floorZone;
  },

  // Экранная точка предмета внутри rect комнаты
  posFor(item, rect) {
    const z = this.yRange(item.id);
    return {
      x: rect.x + rect.w * item.x,
      y: rect.y + rect.h * (z.top + item.y * (z.bottom - z.top))
    };
  },

  sizeFor(id, rect) {
    const f = (typeof findFurniture === 'function') ? findFurniture(id) : null;
    return rect.w * 0.155 * ((f && f.k) || 1);
  },

  isNight() {
    return System.timeOfDay === 'night' || System.timeOfDay === 'evening';
  },

  // ---------- Стена, окно, пол ----------
  drawBase(ctx, rect, room) {
    const wall = (typeof findWall === 'function') ? findWall(room && room.wall) : null;
    const floor = (typeof findFloor === 'function') ? findFloor(room && room.floor) : null;
    const night = this.isNight();
    const seam = rect.y + rect.h * 0.52;

    // Обои
    const wg = ctx.createLinearGradient(0, rect.y, 0, seam);
    wg.addColorStop(0, wall ? (night ? wall.night1 : wall.c1) : '#FFF8E7');
    wg.addColorStop(1, wall ? (night ? wall.night2 : wall.c2) : '#FFE4C4');
    ctx.fillStyle = wg;
    ctx.fillRect(rect.x, rect.y, rect.w, seam - rect.y);

    // Лёгкий узор на обоях
    ctx.save();
    ctx.globalAlpha = night ? 0.05 : 0.07;
    ctx.fillStyle = night ? '#ffffff' : '#7a5a3a';
    const step = Math.max(14, rect.h * 0.045);
    for (let y = rect.y + step * 0.5; y < seam; y += step) {
      const shift = (Math.floor(y / step) % 2) ? step * 0.5 : 0;
      for (let x = rect.x + shift; x < rect.x + rect.w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    this.drawWindow(ctx, rect, night);

    // Пол
    const fg = ctx.createLinearGradient(0, seam, 0, rect.y + rect.h);
    fg.addColorStop(0, floor ? (night ? floor.night1 : floor.c1) : '#D2B48C');
    fg.addColorStop(1, floor ? (night ? floor.night2 : floor.c2) : '#C4A882');
    ctx.fillStyle = fg;
    ctx.fillRect(rect.x, seam, rect.w, rect.y + rect.h - seam);

    // Паркет / плитка
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = night ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    const plank = Math.max(10, rect.h * 0.055);
    for (let y = seam + plank; y < rect.y + rect.h; y += plank) {
      ctx.beginPath();
      ctx.moveTo(rect.x, y);
      ctx.lineTo(rect.x + rect.w, y);
      ctx.stroke();
    }
    const colW = Math.max(24, rect.w * 0.12);
    for (let x = rect.x + colW; x < rect.x + rect.w; x += colW) {
      ctx.beginPath();
      ctx.moveTo(x, seam);
      ctx.lineTo(x, rect.y + rect.h);
      ctx.stroke();
    }
    ctx.restore();

    // Плинтус
    const bbH = Math.max(3, rect.h * 0.012);
    ctx.fillStyle = night ? '#2a1f14' : '#B98B57';
    ctx.fillRect(rect.x, seam - bbH, rect.w, bbH);
  },

  drawWindow(ctx, rect, night) {
    const winX = rect.x + rect.w * 0.64;
    const winY = rect.y + rect.h * 0.07;
    const winW = rect.w * 0.26;
    const winH = rect.h * 0.19;
    const sky = ctx.createLinearGradient(0, winY, 0, winY + winH);
    if (night) { sky.addColorStop(0, '#0c0c30'); sky.addColorStop(1, '#22224e'); }
    else { sky.addColorStop(0, '#9fd8f5'); sky.addColorStop(1, '#dff1ff'); }
    ctx.fillStyle = sky;
    roundRect(ctx, winX, winY, winW, winH, 6);
    ctx.fill();

    if (night) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(winX + winW * 0.72, winY + winH * 0.32, Math.max(4, winW * 0.09), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.5 + (i % 3) * 0.2;
        ctx.beginPath();
        ctx.arc(winX + winW * (0.12 + i * 0.17), winY + winH * (0.22 + (i % 2) * 0.28), 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(winX + winW * 0.26, winY + winH * 0.34, Math.max(4, winW * 0.10), 0, Math.PI * 2);
      ctx.ellipse(winX + winW * 0.38, winY + winH * 0.36, Math.max(5, winW * 0.11), Math.max(4, winW * 0.09), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = Math.max(2, rect.w * 0.008);
    roundRect(ctx, winX, winY, winW, winH, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(winX + winW / 2, winY);
    ctx.lineTo(winX + winW / 2, winY + winH);
    ctx.moveTo(winX, winY + winH / 2);
    ctx.lineTo(winX + winW, winY + winH / 2);
    ctx.stroke();
    // Подоконник
    ctx.fillStyle = '#A9703C';
    ctx.fillRect(winX - rect.w * 0.015, winY + winH, winW + rect.w * 0.03, Math.max(3, rect.h * 0.012));
  },

  // ---------- Предмет мебели ----------
  drawItem(ctx, item, rect, opts) {
    const o = opts || {};
    const f = (typeof findFurniture === 'function') ? findFurniture(item.id) : null;
    if (!f) return;
    const p = this.posFor(item, rect);
    const size = this.sizeFor(item.id, rect);

    if (f.id === 'carpet') { this.drawCarpet(ctx, p.x, p.y, size); return; }
    if (f.id === 'aquarium') { this.drawAquarium(ctx, p.x, p.y, size); return; }

    // Тень под напольными предметами
    if (o.shadow !== false && this.zoneOf(item.id) === 'floor') {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + size * 0.42, size * 0.42, size * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, p.x, p.y);
    ctx.restore();
  },

  // Аквариум: стекло с водой, песок и рыбка внутри
  drawAquarium(ctx, x, y, size) {
    const w = size * 0.95, h = size * 0.72;
    const left = x - w / 2, top = y - h / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y + h / 2, w * 0.45, h * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(0, top, 0, top + h);
    g.addColorStop(0, 'rgba(150,225,250,0.95)');
    g.addColorStop(1, 'rgba(70,160,215,0.95)');
    ctx.fillStyle = g;
    roundRect(ctx, left, top, w, h, size * 0.07);
    ctx.fill();
    ctx.fillStyle = '#E8D3A0';
    roundRect(ctx, left, top + h * 0.82, w, h * 0.18, size * 0.04);
    ctx.fill();
    ctx.font = `${size * 0.42}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐠', x, y + h * 0.06);
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = Math.max(2, size * 0.045);
    roundRect(ctx, left, top, w, h, size * 0.07);
    ctx.stroke();
    ctx.textBaseline = 'alphabetic';
  },

  drawCarpet(ctx, x, y, size) {
    const rx = size * 0.52;
    const ry = size * 0.19;
    ctx.fillStyle = '#C0574B';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E7A08F';
    ctx.beginPath(); ctx.ellipse(x, y, rx * 0.74, ry * 0.70, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#B4483C';
    ctx.beginPath(); ctx.ellipse(x, y, rx * 0.40, ry * 0.36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8E3A30';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  },

  // ---------- Вся комната ----------
  drawAll(ctx, rect, room, furniture, opts) {
    const o = opts || {};
    this.drawBase(ctx, rect, room);
    const list = (furniture || []).slice().sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (o.skipId && it.id === o.skipId) continue;
      this.drawItem(ctx, it, rect, o);
    }
  },

  // Попадание точки в предмет (для перетаскивания)
  hitTest(px, py, rect, furniture, pad) {
    const k = pad || 1.0;
    let found = null;
    let bestDist = 1e9;
    for (const it of (furniture || [])) {
      const f = (typeof findFurniture === 'function') ? findFurniture(it.id) : null;
      if (!f) continue;
      const p = this.posFor(it, rect);
      let r = this.sizeFor(it.id, rect) * 0.5 * k;
      if (f.id === 'carpet') r = this.sizeFor(it.id, rect) * 0.55;
      const dx = px - p.x, dy = py - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= r && d < bestDist) { bestDist = d; found = it; }
    }
    return found;
  }
};

window.RoomView = RoomView;
