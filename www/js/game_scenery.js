// ============ СЦЕНА ЛОКАЦИИ (гофер в правильном виде) ============
// В каждой локации гофер выглядит так, как там уместно:
// в бассейне — в плавках и в воде, на работе — в галстуке,
// в спортзале — с повязкой и гантелей, в библиотеке — в очках с книгой.
const STAGE_DATA = {
  work:          { sky: ['#2b3550', '#44527c'], outfit: 'tie',    held: null,   floor: '#4a4034', kind: 'office' },
  school:        { sky: ['#3a3160', '#544a8c'], outfit: null,     held: '📖',   floor: '#5a4a3a', kind: 'school', glasses: true },
  library:       { sky: ['#24382a', '#3d6146'], outfit: null,     held: '📖',   floor: '#5a4a3a', kind: 'library', glasses: true },
  restaurant:    { sky: ['#3d2222', '#633636'], outfit: null,     held: '🍽️',   floor: '#4a3526', kind: 'restaurant' },
  park:          { sky: ['#2e6b3e', '#6cb066'], outfit: null,     held: '🎈',   floor: '#4a7a3a', kind: 'park' },
  cinema:        { sky: ['#241a3a', '#43305f'], outfit: null,     held: '🍿',   floor: '#33264a', kind: 'cinema' },
  pool:          { sky: ['#0e3a52', '#1f7ba0'], outfit: 'trunks', held: null,   floor: '#1f7ba0', kind: 'pool' },
  gym:           { sky: ['#2a2a34', '#46465a'], outfit: 'sporty', held: '🏋️',   floor: '#4a4a55', kind: 'gym' },
  art_museum:    { sky: ['#221a2e', '#3f2d4c'], outfit: null,     held: '🔍',   floor: '#4a3a45', kind: 'gallery', tint: '#E91E63' },
  nature_museum: { sky: ['#16301c', '#2b5730'], outfit: null,     held: '🔍',   floor: '#3e3a2a', kind: 'gallery', tint: '#4CAF50' },
  space_museum:  { sky: ['#0a0a2a', '#1c1c50'], outfit: null,     held: '🚀',   floor: '#33335a', kind: 'space' },
  history_museum:{ sky: ['#2b1f14', '#4d3623'], outfit: null,     held: '🏺',   floor: '#4a3a2a', kind: 'gallery', tint: '#8D6E63' }
};

const LocationStage = {
  config(locId) { return STAGE_DATA[locId] || null; },

  draw(ctx, rect, locId, gopher, t) {
    const cfg = this.config(locId);
    const time = t || 0;
    if (!cfg) return;

    // Стена / небо
    const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    g.addColorStop(0, cfg.sky[0]);
    g.addColorStop(1, cfg.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const floorY = rect.y + rect.h * 0.78;

    switch (cfg.kind) {
      case 'pool': this.drawPool(ctx, rect, floorY, time); break;
      case 'gym': this.drawGym(ctx, rect, floorY); break;
      case 'library': this.drawLibrary(ctx, rect, floorY); break;
      case 'office': this.drawOffice(ctx, rect, floorY); break;
      case 'school': this.drawSchool(ctx, rect, floorY); break;
      case 'restaurant': this.drawRestaurant(ctx, rect, floorY, time); break;
      case 'park': this.drawPark(ctx, rect, floorY, time); break;
      case 'cinema': this.drawCinema(ctx, rect, floorY); break;
      case 'space': this.drawSpace(ctx, rect, floorY, time); break;
      default: this.drawGallery(ctx, rect, floorY, cfg.tint || '#FFD93D'); break;
    }

    // Пол
    if (cfg.kind !== 'pool') {
      ctx.fillStyle = cfg.floor;
      ctx.fillRect(rect.x, floorY, rect.w, rect.y + rect.h - floorY);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(rect.x, floorY, rect.w, Math.max(2, rect.h * 0.012));
    }

    // ---- Гофер ----
    if (!gopher) return;
    const prevOutfit = gopher.outfit, prevHeld = gopher.heldEmoji, prevGlasses = gopher.glasses;
    gopher.outfit = cfg.outfit || null;
    if (cfg.held) { gopher.heldEmoji = cfg.held; gopher.heldTimer = 2; }
    if (cfg.glasses) gopher.glasses = true;

    const scale = Math.min(rect.w * 0.30, rect.h * 0.56) / gopher.size;
    const cx = rect.x + rect.w * 0.5;
    const cy = floorY - rect.h * 0.38;

    gopher.draw(ctx, cx, cy, scale);

    gopher.outfit = prevOutfit;
    gopher.heldEmoji = prevHeld;
    gopher.heldTimer = 0;
    gopher.glasses = prevGlasses;

    // В бассейне вода накрывает нижнюю половину гофера
    if (cfg.kind === 'pool') this.drawWater(ctx, rect, floorY, cy, scale, time);
  },
  // ---------- Бассейн ----------
  drawPool(ctx, rect, floorY, time) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    const tile = Math.max(16, rect.w * 0.07);
    for (let y = rect.y; y < floorY; y += tile) {
      ctx.beginPath(); ctx.moveTo(rect.x, y); ctx.lineTo(rect.x + rect.w, y); ctx.stroke();
    }
    for (let x = rect.x; x < rect.x + rect.w; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, rect.y); ctx.lineTo(x, floorY); ctx.stroke();
    }
    ctx.restore();

    // Разделительные дорожки
    for (let i = 1; i <= 2; i++) {
      const y = rect.y + (floorY - rect.y) * (i / 3);
      for (let x = rect.x + 6; x < rect.x + rect.w; x += 18) {
        ctx.fillStyle = (i % 2) ? '#FF6B6B' : '#FFD93D';
        ctx.beginPath(); ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Спасательный круг
    ctx.save();
    ctx.translate(rect.x + rect.w * 0.88, rect.y + rect.h * 0.18);
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = Math.max(4, rect.h * 0.045);
    ctx.beginPath(); ctx.arc(0, 0, rect.h * 0.085, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, rect.h * 0.035);
    for (let a = 0; a < 4; a++) {
      ctx.beginPath();
      ctx.arc(0, 0, rect.h * 0.085, a * Math.PI / 2 + 0.4, a * Math.PI / 2 + 1.2);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawWater(ctx, rect, floorY, gopherCy, scale, time) {
    const top = Math.min(gopherCy + 100 * scale * 0.20, floorY + 4);
    const bottom = rect.y + rect.h;
    ctx.fillStyle = 'rgba(38,152,196,0.74)';
    ctx.fillRect(rect.x, top, rect.w, bottom - top);

    // Волны
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rect.x, top + 5);
    const seg = 16;
    for (let x = rect.x; x <= rect.x + rect.w; x += seg) {
      ctx.quadraticCurveTo(x + seg * 0.5, top + 5 + Math.sin(x * 0.05 + time * 0.004) * 4, x + seg, top + 5);
    }
    ctx.lineTo(rect.x + rect.w, bottom);
    ctx.lineTo(rect.x, bottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(122,215,245,0.88)';
    ctx.fill();
    ctx.restore();

    // Надувной круг — сразу видно, что гофер плавает
    const cx = rect.x + rect.w * 0.5;
    const rx = Math.min(rect.w * 0.13, 48);
    const ry = Math.max(5, rect.h * 0.035);
    ctx.save();
    ctx.lineWidth = Math.max(5, rect.h * 0.045);
    ctx.strokeStyle = '#FF6B6B';
    ctx.beginPath(); ctx.ellipse(cx, top + 2, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = Math.max(3, rect.h * 0.028);
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, top + 2, rx, ry, 0, i * Math.PI / 2 + 0.32, i * Math.PI / 2 + 1.08);
      ctx.stroke();
    }
    ctx.restore();

    // Брызги у поверхности
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 8; i++) {
      const bx = rect.x + rect.w * (0.14 + i * 0.10);
      const by = top + 5 + Math.sin(time * 0.003 + i) * 4;
      ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  },

  // ---------- Спортзал ----------
  drawGym(ctx, rect, floorY) {
    // Зеркало
    ctx.fillStyle = 'rgba(200,225,240,0.25)';
    roundRect(ctx, rect.x + rect.w * 0.06, rect.y + rect.h * 0.10, rect.w * 0.32, rect.h * 0.42, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x + rect.w * 0.06, rect.y + rect.h * 0.10, rect.w * 0.32, rect.h * 0.42, 6);
    ctx.stroke();

    // Стойка с гантелями
    ctx.fillStyle = '#3a3a48';
    ctx.fillRect(rect.x + rect.w * 0.58, rect.y + rect.h * 0.44, rect.w * 0.34, rect.h * 0.06);
    ctx.fillRect(rect.x + rect.w * 0.60, rect.y + rect.h * 0.50, rect.w * 0.03, rect.h * 0.28);
    ctx.fillRect(rect.x + rect.w * 0.87, rect.y + rect.h * 0.50, rect.w * 0.03, rect.h * 0.28);
    const cols = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D'];
    for (let i = 0; i < 4; i++) {
      const bx = rect.x + rect.w * (0.63 + i * 0.075);
      ctx.fillStyle = cols[i];
      ctx.fillRect(bx, rect.y + rect.h * 0.36, rect.w * 0.05, rect.h * 0.08);
      ctx.fillStyle = '#2a2a34';
      ctx.fillRect(bx + rect.w * 0.012, rect.y + rect.h * 0.33, rect.w * 0.026, rect.h * 0.14);
      ctx.fillStyle = cols[i];
    }
    // Мат
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(rect.x, floorY - rect.h * 0.06, rect.w * 0.40, rect.h * 0.06);
  },

  // ---------- Библиотека ----------
  drawLibrary(ctx, rect, floorY) {
    const bookColors = ['#E74C3C', '#3498DB', '#27AE60', '#F1C40F', '#9B59B6', '#E67E22'];
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = rect.y + rect.h * (0.10 + shelf * 0.22);
      const sh = rect.h * 0.19;
      ctx.fillStyle = '#5b3a22';
      ctx.fillRect(rect.x + rect.w * 0.04, sy, rect.w * 0.44, sh);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = bookColors[(i + shelf) % bookColors.length];
        const bw = rect.w * 0.038;
        ctx.fillRect(rect.x + rect.w * 0.055 + i * (bw + rect.w * 0.006), sy + sh * 0.12, bw, sh * 0.76);
      }
      ctx.fillStyle = '#3f2716';
      ctx.fillRect(rect.x + rect.w * 0.04, sy + sh, rect.w * 0.44, Math.max(2, rect.h * 0.015));
    }
    // Лампа на столе
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(rect.x + rect.w * 0.62, floorY - rect.h * 0.20, rect.w * 0.34, rect.h * 0.20);
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.79, floorY - rect.h * 0.22, rect.h * 0.07, Math.PI, Math.PI * 2);
    ctx.fill();
  },

  // ---------- Офис ----------
  drawOffice(ctx, rect, floorY) {
    // Доска с графиком
    ctx.fillStyle = '#f3f3f3';
    roundRect(ctx, rect.x + rect.w * 0.05, rect.y + rect.h * 0.10, rect.w * 0.34, rect.h * 0.36, 4);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    roundRect(ctx, rect.x + rect.w * 0.05, rect.y + rect.h * 0.10, rect.w * 0.34, rect.h * 0.36, 4);
    ctx.stroke();
    ctx.fillStyle = '#4D96FF';
    for (let i = 0; i < 4; i++) {
      const bh = rect.h * (0.08 + i * 0.045);
      ctx.fillRect(rect.x + rect.w * (0.09 + i * 0.072), rect.y + rect.h * 0.42 - bh, rect.w * 0.045, bh);
    }
    // Стол с компьютером
    ctx.fillStyle = '#5b4632';
    ctx.fillRect(rect.x + rect.w * 0.50, floorY - rect.h * 0.24, rect.w * 0.44, rect.h * 0.06);
    ctx.fillRect(rect.x + rect.w * 0.53, floorY - rect.h * 0.18, rect.w * 0.03, rect.h * 0.18);
    ctx.fillRect(rect.x + rect.w * 0.88, floorY - rect.h * 0.18, rect.w * 0.03, rect.h * 0.18);
    ctx.fillStyle = '#2c2c3a';
    ctx.fillRect(rect.x + rect.w * 0.62, floorY - rect.h * 0.48, rect.w * 0.20, rect.h * 0.24);
    ctx.fillStyle = '#7ac6ff';
    ctx.fillRect(rect.x + rect.w * 0.635, floorY - rect.h * 0.45, rect.w * 0.15, rect.h * 0.16);
  },

  // ---------- Школа ----------
  drawSchool(ctx, rect, floorY) {
    ctx.fillStyle = '#20503a';
    roundRect(ctx, rect.x + rect.w * 0.06, rect.y + rect.h * 0.10, rect.w * 0.52, rect.h * 0.40, 5);
    ctx.fill();
    ctx.strokeStyle = '#c8b28a';
    ctx.lineWidth = 3;
    roundRect(ctx, rect.x + rect.w * 0.06, rect.y + rect.h * 0.10, rect.w * 0.52, rect.h * 0.40, 5);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.max(9, rect.h * 0.13)}px Arial`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('2 + 2 = 4', rect.x + rect.w * 0.32, rect.y + rect.h * 0.34);
    // Парты
    for (let i = 0; i < 2; i++) {
      const dx = rect.x + rect.w * (0.64 + i * 0.18);
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(dx, floorY - rect.h * 0.20, rect.w * 0.14, rect.h * 0.05);
      ctx.fillStyle = '#5b4028';
      ctx.fillRect(dx + rect.w * 0.01, floorY - rect.h * 0.15, rect.w * 0.015, rect.h * 0.15);
      ctx.fillRect(dx + rect.w * 0.115, floorY - rect.h * 0.15, rect.w * 0.015, rect.h * 0.15);
    }
  },

  // ---------- Ресторан ----------
  drawRestaurant(ctx, rect, floorY, time) {
    for (let i = 0; i < 3; i++) {
      const lx = rect.x + rect.w * (0.16 + i * 0.34);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, rect.y); ctx.lineTo(lx, rect.y + rect.h * 0.14); ctx.stroke();
      ctx.fillStyle = 'rgba(255,214,120,' + (0.7 + Math.sin(time * 0.002 + i) * 0.2).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(lx, rect.y + rect.h * 0.19, rect.h * 0.055, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#8a5a34';
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w * 0.82, floorY - rect.h * 0.06, rect.w * 0.13, rect.h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3a20';
    ctx.fillRect(rect.x + rect.w * 0.805, floorY - rect.h * 0.06, rect.w * 0.03, rect.h * 0.22);
    ctx.font = `${Math.max(10, rect.h * 0.11)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🕯️', rect.x + rect.w * 0.82, floorY - rect.h * 0.10);
    ctx.textBaseline = 'alphabetic';
  },

  // ---------- Парк ----------
  drawPark(ctx, rect, floorY, time) {
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.88, rect.y + rect.h * 0.16, rect.h * 0.10, 0, Math.PI * 2);
    ctx.fill();
    const treeColors = ['#2f7d3a', '#3d9b48'];
    for (let i = 0; i < 2; i++) {
      const tx = rect.x + rect.w * (0.08 + i * 0.14);
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(tx - rect.w * 0.012, floorY - rect.h * 0.30, rect.w * 0.024, rect.h * 0.30);
      ctx.fillStyle = treeColors[i];
      ctx.beginPath();
      ctx.arc(tx, floorY - rect.h * 0.36, rect.h * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    // Колесо обозрения
    const wx = rect.x + rect.w * 0.68, wy = rect.y + rect.h * 0.42, wr = rect.h * 0.28;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.stroke();
    const wheelColors = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D'];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + time * 0.0004;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr);
      ctx.stroke();
      ctx.fillStyle = wheelColors[i % 4];
      ctx.beginPath(); ctx.arc(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  },

  // ---------- Кино ----------
  drawCinema(ctx, rect, floorY) {
    ctx.fillStyle = '#e8e8f0';
    roundRect(ctx, rect.x + rect.w * 0.08, rect.y + rect.h * 0.08, rect.w * 0.84, rect.h * 0.40, 4);
    ctx.fill();
    const fl = ctx.createLinearGradient(0, rect.y + rect.h * 0.08, 0, rect.y + rect.h * 0.48);
    fl.addColorStop(0, 'rgba(255,255,255,0)');
    fl.addColorStop(1, 'rgba(140,120,220,0.55)');
    ctx.fillStyle = fl;
    roundRect(ctx, rect.x + rect.w * 0.08, rect.y + rect.h * 0.08, rect.w * 0.84, rect.h * 0.40, 4);
    ctx.fill();
    ctx.font = `${Math.max(10, rect.h * 0.14)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎬', rect.x + rect.w * 0.5, rect.y + rect.h * 0.28);
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < 5; i++) {
      const sx = rect.x + rect.w * (0.05 + i * 0.19);
      ctx.fillStyle = '#8e2b3a';
      roundRect(ctx, sx, floorY - rect.h * 0.26, rect.w * 0.15, rect.h * 0.26, 5);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(sx + rect.w * 0.02, floorY - rect.h * 0.20, rect.w * 0.11, rect.h * 0.02);
    }
  },

  // ---------- Космический музей ----------
  drawSpace(ctx, rect, floorY, time) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 22; i++) {
      const sx = rect.x + ((Math.sin(i * 127.1) * 0.5 + 0.5) * rect.w);
      const sy = rect.y + ((Math.cos(i * 311.7) * 0.5 + 0.5) * rect.h * 0.7);
      ctx.globalAlpha = 0.35 + Math.sin(time * 0.002 + i) * 0.3;
      ctx.beginPath(); ctx.arc(sx, sy, 1.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#E8A33D';
    ctx.beginPath(); ctx.arc(rect.x + rect.w * 0.16, rect.y + rect.h * 0.22, rect.h * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w * 0.16, rect.y + rect.h * 0.22, rect.h * 0.20, rect.h * 0.055, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#5AA9E6';
    ctx.beginPath(); ctx.arc(rect.x + rect.w * 0.76, rect.y + rect.h * 0.18, rect.h * 0.08, 0, Math.PI * 2); ctx.fill();
    // Ракета
    ctx.fillStyle = '#dcdce8';
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.46, rect.y + rect.h * 0.08);
    ctx.lineTo(rect.x + rect.w * 0.50, rect.y + rect.h * 0.44);
    ctx.lineTo(rect.x + rect.w * 0.42, rect.y + rect.h * 0.44);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath(); ctx.arc(rect.x + rect.w * 0.46, rect.y + rect.h * 0.20, rect.h * 0.032, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- Картинная галерея ----------
  drawGallery(ctx, rect, floorY, tint) {
    for (let i = 0; i < 3; i++) {
      const fx = rect.x + rect.w * (0.06 + i * 0.30);
      const fw = rect.w * 0.22;
      const fh = rect.h * 0.34;
      const fy = rect.y + rect.h * 0.12;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(ctx, fx + 2, fy + 2, fw, fh, 4);
      ctx.fill();
      ctx.fillStyle = i === 1 ? tint : 'rgba(255,255,255,0.9)';
      roundRect(ctx, fx, fy, fw, fh, 4);
      ctx.fill();
      ctx.strokeStyle = '#d9c48a';
      ctx.lineWidth = 3;
      roundRect(ctx, fx, fy, fw, fh, 4);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#2a2a3a';
      ctx.beginPath();
      ctx.arc(fx + fw / 2, fy + fh * 0.5, Math.min(fw, fh) * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(rect.x + rect.w * 0.06, floorY - rect.h * 0.10, rect.w * 0.22, rect.h * 0.10);
    ctx.fillRect(rect.x + rect.w * 0.72, floorY - rect.h * 0.10, rect.w * 0.22, rect.h * 0.10);
  }
};

window.LocationStage = LocationStage;

window.STAGE_DATA = STAGE_DATA;
