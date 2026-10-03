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
    const size = this.sizeFor(item.id, rect, item.y);
    // Крупную вещь у самой стены не должно обрезать краем кадра: чуть сдвигаем
    // внутрь, если она не влезает.
    const half = size * 0.52;
    const x = clamp(rect.x + rect.w * item.x, rect.x + half, rect.x + rect.w - half);
    return {
      x: x,
      y: rect.y + rect.h * (z.top + item.y * (z.bottom - z.top))
    };
  },

  // ---------- Перспектива и соразмерность ----------
  // Чем дальше предмет (меньше y), тем он меньше: маленькая вещь в глубине
  // комнаты читается как «стоит далеко», а не как «крошечная впереди».
  // Плюс у каждого предмета свой «истинный» размер k (шкаф выше лампы).
  DEPTH_MIN: 0.66,
  DEPTH_MAX: 1.22,

  depthScale(rect, zone, y) {
    const t = clamp((y - zone.top) / Math.max(0.0001, zone.bottom - zone.top), 0, 1);
    return this.DEPTH_MIN + (this.DEPTH_MAX - this.DEPTH_MIN) * t;
  },

  sizeFor(id, rect, y) {
    const f = (typeof findFurniture === 'function') ? findFurniture(id) : null;
    const zone = this.yRange(id);
    const yy = (y === undefined || y === null) ? (zone.top + zone.bottom) / 2 : y;
    return rect.w * 0.158 * ((f && f.k) || 1) * this.depthScale(rect, zone, yy);
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
    const size = this.sizeFor(item.id, rect, item.y);
    const color = (typeof System !== 'undefined' && System.colorOf) ? System.colorOf(item.id) : null;

    if (f.shape === 'carpet') { this.drawCarpet(ctx, p.x, p.y, size, color); return; }
    if (f.shape === 'aquarium') { this.drawAquarium(ctx, p.x, p.y, size, color); return; }

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

    // У ключевой мебели свои формы: у них видно перекраску и настоящий размер
    const shape = f.shape;
    if (shape && this['shape_' + shape]) {
      ctx.save();
      this['shape_' + shape](ctx, p.x, p.y, size, color || '#B98B57', f);
      ctx.restore();
      return;
    }

    // Всё остальное — эмодзи
    ctx.save();
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, p.x, p.y);
    ctx.restore();
  },

  // ---------- Формы мебели (рисуются кодом: виден цвет и размер) ----------
  furnitureLine: '#2b2119',

  shape_sofa(ctx, x, y, s, col) {
    const w = s * 0.95, h = s * 0.55, back = s * 0.42;
    const left = x - w / 2, top = y - h * 0.42;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, left + w * 0.04, top - back * 0.62, w * 0.92, back, s * 0.06);
    ctx.fill(); ctx.stroke();
    roundRect(ctx, left, top, w, h * 0.72, s * 0.07);
    ctx.fill(); ctx.stroke();
    ctx.save();
    roundRect(ctx, left, top, w, h * 0.72, s * 0.07); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    roundRect(ctx, left + w * 0.07, top + h * 0.12, w * 0.36, h * 0.42, s * 0.05); ctx.fill();
    roundRect(ctx, left + w * 0.56, top + h * 0.12, w * 0.36, h * 0.42, s * 0.05); ctx.fill();
    ctx.restore();
    ctx.fillStyle = col;
    roundRect(ctx, left - w * 0.03, top - h * 0.10, w * 0.12, h * 0.80, s * 0.05); ctx.fill(); ctx.stroke();
    roundRect(ctx, left + w * 0.91, top - h * 0.10, w * 0.12, h * 0.80, s * 0.05); ctx.fill(); ctx.stroke();
  },

  shape_chair(ctx, x, y, s, col) {
    const w = s * 0.48, h = s * 0.46;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.1, s * 0.015);
    roundRect(ctx, x - w / 2, y - h, w, h * 0.30, s * 0.05); ctx.fill(); ctx.stroke();
    roundRect(ctx, x - w / 2, y - h * 0.62, w, h * 0.24, s * 0.04); ctx.fill(); ctx.stroke();
    ctx.lineWidth = Math.max(1, s * 0.022);
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(x + dir * w * 0.34, y - h * 0.46);
      ctx.lineTo(x + dir * w * 0.34, y);
      ctx.stroke();
    });
  },

  shape_table(ctx, x, y, s, col) {
    const w = s * 0.95, h = s * 0.16, legH = s * 0.42;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.1, s * 0.014);
    roundRect(ctx, x - w / 2, y - legH - h, w, h, s * 0.04); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, x - w / 2 + 2, y - legH - h + 2, w - 4, h * 0.35, s * 0.03); ctx.fill();
    ctx.fillStyle = col;
    [-1, 1].forEach(dir => {
      roundRect(ctx, x + dir * w * 0.33 - s * 0.03, y - legH, s * 0.06, legH, s * 0.02); ctx.fill(); ctx.stroke();
    });
  },

  shape_bed(ctx, x, y, s, col, f) {
    const w = s * 0.98, len = s * 0.60;
    ctx.fillStyle = '#8a6a4a'; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - len, w, len, s * 0.06); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    roundRect(ctx, x - w / 2, y - len * 0.98, w, len * 0.50, s * 0.06); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x - w * 0.44, y - len * 0.94, w * 0.34, len * 0.28, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    roundRect(ctx, x - w * 0.44, y - len * 0.46, w * 0.88, len * 0.40, s * 0.05); ctx.fill(); ctx.stroke();
    if (f && f.cost >= 3000) {   // балдахин у самой дорогой кровати
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      roundRect(ctx, x - w / 2, y - len * 1.9, w, len * 0.5, s * 0.05); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - w / 2, y - len * 1.4); ctx.lineTo(x + w / 2, y - len * 1.4); ctx.stroke();
    }
  },

  shape_wardrobe(ctx, x, y, s, col) {
    const w = s * 0.70, h = s * 1.02;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - h + s * 0.04); ctx.lineTo(x, y - s * 0.04); ctx.stroke();
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath(); ctx.arc(x - w * 0.10, y - h * 0.48, s * 0.026, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w * 0.10, y - h * 0.48, s * 0.026, 0, Math.PI * 2); ctx.fill();
  },

  // Ящик игрушек: сундук с откинутой крышкой и защёлкой
  shape_chest(ctx, x, y, s, col) {
    const w = s * 0.74, h = s * 0.42, lid = s * 0.17;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#F7DC6F';
    roundRect(ctx, x - w / 2, y - h * 0.62, w, h * 0.16, s * 0.03); ctx.fill(); ctx.stroke();
    // крышка чуть шире корпуса — узнаваемый сундук
    ctx.fillStyle = col;
    roundRect(ctx, x - w * 0.54, y - h - lid, w * 1.08, lid, s * 0.05); ctx.fill(); ctx.stroke();
    // защёлка
    ctx.fillStyle = '#D4AF37';
    roundRect(ctx, x - s * 0.05, y - h - lid * 0.35, s * 0.10, lid * 0.9, s * 0.02); ctx.fill(); ctx.stroke();
  },

  // Кухонный шкаф: витрина с двумя дверцами и полкой
  shape_cupboard(ctx, x, y, s, col) {
    const w = s * 0.72, h = s * 0.86;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - h + s * 0.05); ctx.lineTo(x, y - s * 0.05); ctx.stroke();
    ctx.lineWidth = Math.max(1, s * 0.010);
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + s * 0.03, y - h * 0.42); ctx.lineTo(x + w / 2 - s * 0.03, y - h * 0.42); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + s * 0.03, y - h * 0.14); ctx.lineTo(x + w / 2 - s * 0.03, y - h * 0.14); ctx.stroke();
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath(); ctx.arc(x - w * 0.08, y - h * 0.55, s * 0.022, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w * 0.08, y - h * 0.55, s * 0.022, 0, Math.PI * 2); ctx.fill();
  },

  shape_nightstand(ctx, x, y, s, col) {
    const w = s * 0.52, h = s * 0.48;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.1, s * 0.014);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.04); ctx.fill(); ctx.stroke();
    ctx.lineWidth = Math.max(1, s * 0.010);
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 3, y - h + (h / 3) * i);
      ctx.lineTo(x + w / 2 - 3, y - h + (h / 3) * i);
      ctx.stroke();
    }
  },

  shape_fridge(ctx, x, y, s, col) {
    const w = s * 0.58, h = s * 0.98;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h * 0.62); ctx.lineTo(x + w / 2, y - h * 0.62); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, x + w * 0.28, y - h * 0.88, s * 0.030, h * 0.18, s * 0.02); ctx.fill();
    roundRect(ctx, x + w * 0.28, y - h * 0.52, s * 0.030, h * 0.24, s * 0.02); ctx.fill();
  },

  shape_stove(ctx, x, y, s, col) {
    const w = s * 0.62, h = s * 0.60;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h, w, h * 0.86, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1f2430';
    roundRect(ctx, x - w / 2 + 2, y - h - s * 0.03, w - 4, s * 0.08, s * 0.03); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e2574c';
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.arc(x - w * 0.18 + i * w * 0.36, y - h + s * 0.03 + j * s * 0.02, s * 0.028, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#3a4453';
    roundRect(ctx, x - w / 2 + 2, y - h * 0.42, w - 4, h * 0.30, s * 0.03); ctx.fill();
  },

  shape_microwave(ctx, x, y, s, col) {
    const w = s * 0.62, h = s * 0.42;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1, s * 0.016);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b3140';
    roundRect(ctx, x - w * 0.40, y - h * 0.84, w * 0.60, h * 0.68, s * 0.04); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7fdc9a';
    ctx.beginPath(); ctx.arc(x + w * 0.30, y - h * 0.52, s * 0.022, 0, Math.PI * 2); ctx.fill();
  },

  shape_washer(ctx, x, y, s, col) {
    const w = s * 0.62, h = s * 0.68;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.06); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - h * 0.45, w * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(140,200,235,0.85)'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(x - w * 0.08, y - h * 0.52, w * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4d5566';
    roundRect(ctx, x - w * 0.30, y - h * 0.94, w * 0.22, s * 0.035, s * 0.02); ctx.fill();
  },

  shape_bathtub(ctx, x, y, s, col) {
    const w = s * 0.95, h = s * 0.48;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.86, w, h * 0.86, s * 0.14); ctx.fill(); ctx.stroke();
    // вода
    ctx.save();
    roundRect(ctx, x - w / 2, y - h * 0.86, w, h * 0.86, s * 0.14); ctx.clip();
    ctx.fillStyle = 'rgba(120,205,240,0.85)';
    ctx.fillRect(x - w / 2, y - h * 0.70, w, h * 0.70);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(x - w * 0.32 + i * w * 0.16, y - h * 0.74, s * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // ножки
    ctx.fillStyle = col;
    [-1, 1].forEach(dir => {
      roundRect(ctx, x + dir * w * 0.38 - s * 0.02, y - h * 0.06, s * 0.04, h * 0.16, s * 0.02); ctx.fill(); ctx.stroke();
    });
  },

  shape_shower(ctx, x, y, s, col) {
    const w = s * 0.70, h = s * 0.98;
    // Стекло кабины: контур обязан быть тёмным — цвет палитры бывает почти
    // белым, и кабина пропадала на светлой стене ванной
    ctx.fillStyle = 'rgba(185,222,238,0.7)';
    ctx.strokeStyle = '#4E7C97';
    ctx.lineWidth = Math.max(1.6, s * 0.02);
    roundRect(ctx, x - w / 2, y - h, w, h, s * 0.06); ctx.fill(); ctx.stroke();
    // лейка сверху
    ctx.fillStyle = '#8FA9B8';
    roundRect(ctx, x - w * 0.52, y - h - s * 0.03, w * 1.04, s * 0.055, s * 0.02); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x, y - h + s * 0.07); ctx.stroke();
    // струи
    ctx.fillStyle = 'rgba(90,180,225,0.95)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(x - w * 0.2 + (i % 3) * w * 0.2, y - h * 0.72 + Math.floor(i / 3) * s * 0.09, s * 0.019, 0, Math.PI * 2);
      ctx.fill();
    }
    // поддон и ручка
    ctx.fillStyle = col;
    roundRect(ctx, x - w * 0.62, y - s * 0.13, w * 1.24, s * 0.10, s * 0.03); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4E7C97';
    roundRect(ctx, x + w * 0.26, y - h * 0.55, s * 0.035, h * 0.22, s * 0.02); ctx.fill();
  },

  shape_basin(ctx, x, y, s, col) {
    const w = s * 0.66, h = s * 0.40;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.1, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.62, w, h * 0.34, s * 0.06); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - h * 0.62); ctx.lineTo(x, y - h * 0.06); ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - h * 0.62, w * 0.30, 0, Math.PI);
    ctx.fillStyle = '#cfe6f2'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8fd0e8';
    ctx.beginPath(); ctx.arc(x + w * 0.12, y - h * 0.80, s * 0.028, 0, Math.PI * 2); ctx.fill();
  },

  shape_toilet(ctx, x, y, s, col) {
    const w = s * 0.52, h = s * 0.62;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w * 0.36, y - h, w * 0.72, h * 0.42, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.34, w * 0.50, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.36, w * 0.30, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#a9c9dc'; ctx.fill();
  },

  shape_mirror(ctx, x, y, s, col) {
    const w = s * 0.52, h = s * 0.76;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.1, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.5, w, h * 0.5, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(205,235,250,0.9)';
    roundRect(ctx, x - w * 0.40, y - h * 0.44, w * 0.80, h * 0.38, s * 0.04); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.30, y - h * 0.10); ctx.lineTo(x - w * 0.02, y - h * 0.44);
    ctx.lineTo(x + w * 0.06, y - h * 0.44); ctx.lineTo(x - w * 0.22, y - h * 0.10);
    ctx.closePath(); ctx.fill();
  },

  shape_towel(ctx, x, y, s, col) {
    const w = s * 0.34, h = s * 0.60;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.5, w, h * 0.5, s * 0.03); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    roundRect(ctx, x - w * 0.36, y - h * 0.42, w * 0.72, h * 0.09, s * 0.02); ctx.fill();
    roundRect(ctx, x - w * 0.36, y - h * 0.18, w * 0.72, h * 0.09, s * 0.02); ctx.fill();
  },

  shape_tv(ctx, x, y, s, col) {
    const w = s * 0.92, h = s * 0.56;
    ctx.fillStyle = '#2b3240'; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.98, w, h * 0.62, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(120,190,235,0.9)';
    roundRect(ctx, x - w * 0.44, y - h * 0.92, w * 0.88, h * 0.50, s * 0.03); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.40, y - h * 0.46); ctx.lineTo(x - w * 0.10, y - h * 0.88);
    ctx.lineTo(x + w * 0.02, y - h * 0.88); ctx.lineTo(x - w * 0.28, y - h * 0.46);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = col;
    roundRect(ctx, x - w * 0.10, y - h * 0.38, w * 0.20, h * 0.28, s * 0.02); ctx.fill(); ctx.stroke();
    roundRect(ctx, x - w * 0.34, y - h * 0.14, w * 0.68, h * 0.10, s * 0.03); ctx.fill(); ctx.stroke();
  },

  shape_shelf(ctx, x, y, s, col, f) {
    const w = s * 0.86, h = s * (f && f.zone === 'wall' ? 0.90 : 0.80);
    const wall = f && f.zone === 'wall';
    const top = wall ? y - h : y - h;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, top, w, h, s * 0.03); ctx.fill(); ctx.stroke();
    // полки с книгами
    const rows = 3;
    const bookCols = ['#E74C3C', '#3498DB', '#27AE60', '#F1C40F', '#9B59B6', '#E67E22'];
    for (let r = 0; r < rows; r++) {
      const ry = top + h * (0.12 + r * 0.30);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x - w * 0.44, ry + h * 0.22, w * 0.88, Math.max(1, s * 0.012));
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = bookCols[(r * 2 + i) % bookCols.length];
        const bw = w * 0.11;
        ctx.fillRect(x - w * 0.40 + i * bw * 1.10, ry, bw, h * 0.22);
      }
    }
  },

  shape_clock(ctx, x, y, s, col, f) {
    const big = f && f.cost >= 1000;    // напольные часы вместо настенных
    if (big) {
      const w = s * 0.45, h = s * 1.0;
      ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
      roundRect(ctx, x - w / 2, y - h, w, h, s * 0.05); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - h * 0.74, w * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF9E8'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - h * 0.74); ctx.lineTo(x, y - h * 0.88); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - h * 0.74); ctx.lineTo(x + w * 0.16, y - h * 0.74); ctx.stroke();
      ctx.font = `${s * 0.22}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🕰️', x, y - h * 0.30);
      ctx.textBaseline = 'alphabetic';
      return;
    }
    const r = s * 0.42;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF9E8'; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.06); ctx.stroke();
    ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1, s * 0.02);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.62); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.46, y); ctx.stroke();
  },

  shape_lamp(ctx, x, y, s, col) {
    const w = s * 0.52, h = s * 0.80;
    ctx.fillStyle = '#8a6a4a'; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1, s * 0.014);
    roundRect(ctx, x - s * 0.02, y - h * 0.70, s * 0.04, h * 0.70, s * 0.02); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.45, h * 0.06, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.50, y - h * 0.62);
    ctx.lineTo(x - w * 0.22, y - h);
    ctx.lineTo(x + w * 0.22, y - h);
    ctx.lineTo(x + w * 0.50, y - h * 0.62);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,180,0.65)';
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.52, w * 0.62, h * 0.20, 0, 0, Math.PI * 2); ctx.fill();
  },

  shape_plant(ctx, x, y, s, col, f) {
    const w = s * 0.50, h = s * 0.90;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.1, s * 0.014);
    // горшок
    ctx.beginPath();
    ctx.moveTo(x - w * 0.42, y - h * 0.30);
    ctx.lineTo(x + w * 0.42, y - h * 0.30);
    ctx.lineTo(x + w * 0.30, y);
    ctx.lineTo(x - w * 0.30, y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // листья
    ctx.fillStyle = '#3f9b52';
    const leaves = (f && f.id === 'palm') ? 7 : 5;
    for (let i = 0; i < leaves; i++) {
      const a = -Math.PI * 0.5 + (i - (leaves - 1) / 2) * 0.44;
      ctx.save();
      ctx.translate(x, y - h * 0.30);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.32, w * 0.20, h * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(0.8, s * 0.008); ctx.stroke();
      ctx.restore();
    }
  },

  shape_painting(ctx, x, y, s, col) {
    const w = s * 0.62, h = s * 0.46;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h / 2, w, h, s * 0.03); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#BFE3F5';
    roundRect(ctx, x - w * 0.40, y - h * 0.34, w * 0.80, h * 0.68, s * 0.02); ctx.fill();
    ctx.fillStyle = '#6BCB77';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.40, y + h * 0.30);
    ctx.lineTo(x - w * 0.10, y - h * 0.14);
    ctx.lineTo(x + w * 0.14, y + h * 0.30);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F7DC6F';
    ctx.beginPath(); ctx.arc(x + w * 0.24, y - h * 0.16, w * 0.08, 0, Math.PI * 2); ctx.fill();
  },

  shape_samovar(ctx, x, y, s, col) {
    const w = s * 0.42, h = s * 0.62;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.1, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.72, w, h * 0.72, s * 0.08); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, x - w * 0.36, y - h * 0.62, w * 0.18, h * 0.50, s * 0.05); ctx.fill();
    ctx.fillStyle = col;
    roundRect(ctx, x - w * 0.30, y - h, w * 0.60, h * 0.20, s * 0.04); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - h * 1.06, s * 0.035, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = Math.max(1, s * 0.012);
    ctx.beginPath(); ctx.moveTo(x + w * 0.5, y - h * 0.50); ctx.lineTo(x + w * 0.78, y - h * 0.34); ctx.stroke();
  },

  shape_piano(ctx, x, y, s, col, f) {
    const grand = f && f.cost >= 2000;      // рояль — с открытой крышкой
    const w = s * (grand ? 1.10 : 0.95), h = s * (grand ? 0.52 : 0.60);
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.62, w, h * 0.62, s * 0.05); ctx.fill(); ctx.stroke();
    // клавиши
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x - w * 0.44, y - h * 0.30, w * 0.88, h * 0.18, s * 0.02); ctx.fill();
    ctx.fillStyle = '#1f2430';
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(x - w * 0.40 + i * w * 0.12 + w * 0.07, y - h * 0.30, w * 0.045, h * 0.10);
    }
    // ножки
    ctx.fillStyle = col;
    [-1, 1].forEach(dir => {
      roundRect(ctx, x + dir * w * 0.36 - s * 0.025, y - h * 0.06, s * 0.05, h * 0.06, s * 0.02); ctx.fill(); ctx.stroke();
    });
    if (grand) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(x - w * 0.50, y - h * 0.62);
      ctx.lineTo(x + w * 0.42, y - h * 1.35);
      ctx.lineTo(x + w * 0.50, y - h * 0.62);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  },

  shape_fireplace(ctx, x, y, s, col) {
    const w = s * 0.80, h = s * 0.80;
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1.2, s * 0.014);
    roundRect(ctx, x - w / 2, y - h * 0.62, w, h * 0.62, s * 0.05); ctx.fill(); ctx.stroke();
    roundRect(ctx, x - w * 0.62, y - h, w * 1.24, h * 0.16, s * 0.04); ctx.fill(); ctx.stroke();
    // топка и огонь
    ctx.fillStyle = '#241a14';
    roundRect(ctx, x - w * 0.30, y - h * 0.44, w * 0.60, h * 0.44, s * 0.05); ctx.fill();
    ctx.fillStyle = '#FF8C42';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.16, y - h * 0.06);
    ctx.quadraticCurveTo(x - w * 0.05, y - h * 0.34, x, y - h * 0.40);
    ctx.quadraticCurveTo(x + w * 0.05, y - h * 0.34, x + w * 0.16, y - h * 0.06);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.08, y - h * 0.06);
    ctx.quadraticCurveTo(x, y - h * 0.26, x + w * 0.08, y - h * 0.06);
    ctx.closePath(); ctx.fill();
  },

  shape_duck(ctx, x, y, s, col) {
    ctx.fillStyle = col; ctx.strokeStyle = this.furnitureLine; ctx.lineWidth = Math.max(1, s * 0.014);
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.20, s * 0.26, s * 0.17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - s * 0.16, y - s * 0.36, s * 0.11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FF8C42';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.27, y - s * 0.37); ctx.lineTo(x - s * 0.40, y - s * 0.34);
    ctx.lineTo(x - s * 0.27, y - s * 0.31); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b2119';
    ctx.beginPath(); ctx.arc(x - s * 0.19, y - s * 0.40, s * 0.018, 0, Math.PI * 2); ctx.fill();
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

  // Смешать цвет с белым/чёрным (для оттенков перекрашенной мебели)
  mixHex(hex, target, t) {
    const parse = (h) => {
      const s = String(h || '#888888').replace('#', '');
      const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
      return [parseInt(full.slice(0, 2), 16) || 0, parseInt(full.slice(2, 4), 16) || 0, parseInt(full.slice(4, 6), 16) || 0];
    };
    const a = parse(hex), b = parse(target);
    const out = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return '#' + out.map(v => ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2)).join('');
  },

  drawCarpet(ctx, x, y, size, color) {
    const main = color || '#C0574B';
    const light = this.mixHex(main, '#ffffff', 0.55);
    const dark = this.mixHex(main, '#000000', 0.22);
    const rx = size * 0.52;
    const ry = size * 0.19;
    ctx.fillStyle = main;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.ellipse(x, y, rx * 0.74, ry * 0.70, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(x, y, rx * 0.40, ry * 0.36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = this.mixHex(main, '#000000', 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  },

  // Мебель без фона (чтобы рисовать её слоями вокруг фигурки)
  drawItems(ctx, rect, furniture, opts) {
    const o = opts || {};
    const isWall = (it) => this.zoneOf(it.id) === 'wall';
    const isCarpet = (it) => { const f = findFurniture(it.id); return f && f.shape === 'carpet'; };
    // Ковры — это пол: они всегда лежат под всем остальным
    const list = (furniture || []).slice().sort((a, b) => (isCarpet(a) ? 0 : 1) - (isCarpet(b) ? 0 : 1) || a.y - b.y);
    for (const it of list) {
      if (o.skipId && it.id === o.skipId) continue;
      // Настенное (часы, картина, зеркало) всегда за героем: оно на стене
      const back = isWall(it) || isCarpet(it);
      if (o.behind !== undefined && !back && it.y > o.behind) continue;
      if (o.front !== undefined && (back || it.y <= o.front)) continue;
      this.drawItem(ctx, it, rect, o);
    }
  },

  // ---------- Вся комната ----------
  // behind/front: разделение мебели на «за фигуркой» и «перед фигуркой»,
  // чтобы вещь на переднем плане честно перекрывала лапы героя.
  drawAll(ctx, rect, room, furniture, opts) {
    this.drawBase(ctx, rect, room);
    this.drawItems(ctx, rect, furniture, opts);
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
      let r = this.sizeFor(it.id, rect, it.y) * 0.5 * k;
      if (f.shape === 'carpet') r = this.sizeFor(it.id, rect, it.y) * 0.55;
      const dx = px - p.x, dy = py - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= r && d < bestDist) { bestDist = d; found = it; }
    }
    return found;
  }
};

window.RoomView = RoomView;
