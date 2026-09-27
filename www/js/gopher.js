// ============ ГОФЕР - ГЛАВНЫЙ ПЕРСОНАЖ (классический маскот) ============
class Gopher {
  constructor(canvas, size) {
    this.size = size || 100;
    this.expression = 'happy';
    this.expressionTimer = 0;
    this.bobY = 0;
    this.blinkTimer = 0;
    this.blinking = false;
    this.armAngle = 0;
    this.legAnim = 0;
    this.hat = null;
    this.glasses = null;
    this.bowtie = false;
    this.animationTime = 0;
    this.zzz = [];
    this.sparks = [];
    this.canvas = canvas;
  }

  draw(ctx, x, y, scale) {
    const s = this.size * (scale || 1);
    this.animationTime += 0.05;
    this.bobY = Math.sin(this.animationTime * 2) * 3;
    this.blinkTimer++;
    if (this.blinkTimer > 120) { this.blinking = true; }
    if (this.blinkTimer > 125) { this.blinking = false; this.blinkTimer = 0; }
    this.armAngle = Math.sin(this.animationTime * 3) * 0.15;
    this.legAnim = Math.sin(this.animationTime * 4) * 0.2;

    if (this.expressionTimer > 0) {
      this.expressionTimer--;
      if (this.expressionTimer <= 0) this.expression = 'happy';
    }

    if (this.expression === 'sleeping') {
      this.zzz.push({
        x: x + s * 0.5, y: y - s * 0.45 - this.zzz.length * 15,
        alpha: 1, size: 12 + this.zzz.length * 2
      });
      if (this.zzz.length > 4) this.zzz.shift();
      this.zzz.forEach(z => { z.alpha -= 0.012; z.y -= 0.4; });
      this.zzz = this.zzz.filter(z => z.alpha > 0);
    }

    if (this.expression === 'excited') {
      if (Math.random() < 0.2) {
        this.sparks.push({
          x: (Math.random() - 0.5) * s * 0.8,
          y: (Math.random() - 0.5) * s * 0.8,
          alpha: 1, size: Math.random() * 4 + 2
        });
      }
      this.sparks.forEach(sp => { sp.alpha -= 0.03; sp.y -= 1; });
      this.sparks = this.sparks.filter(sp => sp.alpha > 0);
    }

    ctx.save();
    ctx.translate(x, y + this.bobY);

    // NOSE
    if (this.sparks.length > 0) {
      this.sparks.forEach(sp => {
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // ============ НОЖКИ (маленькие, тёмные с розовыми ступнями) ============
    const legW = s * 0.08, legH = s * 0.16, footR = legW * 0.8;
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.16, s * 0.30);
      ctx.rotate(this.legAnim * 0.2 * dir);
      ctx.fillStyle = '#7EC8E3';
      ctx.beginPath();
      ctx.roundRect(-legW/2, -legH/2, legW, legH, legW * 0.5);
      ctx.fill();
      ctx.fillStyle = '#F8A4B8';
      ctx.beginPath();
      ctx.ellipse(0, legH/2 + 1, footR, footR*0.7, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    // ============ ТЕЛО (тёмно-серое, овальное) ============
    ctx.fillStyle = '#7EC8E3';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.34, s * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // ============ ГОЛУБОЙ ЖИВОТ (отличный от головы цвет — бежевый как у оригинального Go гопера) ============
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.26, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // ============ РУЧКИ (маленькие, тёмные с розовыми лапками) ============
    const armW = s * 0.06, armH = s * 0.18;
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.31, s * 0.05);
      ctx.rotate(0.3 * dir - this.armAngle * dir);
      ctx.fillStyle = '#7EC8E3';
      ctx.beginPath();
      ctx.roundRect(-armW/2, -armH/2, armW, armH, armW * 0.5);
      ctx.fill();
      ctx.fillStyle = '#F8A4B8';
      ctx.beginPath();
      ctx.arc(0, armH/2 + 2, armW * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ============ ГОЛОВА (голубая, круглая — МОРДОЧКА + ГОЛОВА) ============
    ctx.fillStyle = '#5DADE2';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.28, s * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // ============ УШКИ (маленькие, тёмные) ============
    ctx.fillStyle = '#7EC8E3';
    // Левое ухо
    ctx.beginPath();
    ctx.ellipse(-s * 0.22, -s * 0.44, s * 0.07, s * 0.09, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F8A4B8';
    ctx.beginPath();
    ctx.ellipse(-s * 0.22, -s * 0.44, s * 0.04, s * 0.055, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Правое ухо
    ctx.fillStyle = '#7EC8E3';
    ctx.beginPath();
    ctx.ellipse(s * 0.22, -s * 0.44, s * 0.07, s * 0.09, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F8A4B8';
    ctx.beginPath();
    ctx.ellipse(s * 0.22, -s * 0.44, s * 0.04, s * 0.055, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // ============ ЩЁЧКИ (розовый румянец) ============
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#F5A9B8';
    ctx.beginPath(); ctx.ellipse(-s * 0.19, -s * 0.17, s * 0.055, s * 0.035, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.19, -s * 0.17, s * 0.055, s * 0.035, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // ============ ГЛАЗА (большие, круглые) ============
    if (this.expression === 'sleeping') {
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(-s * 0.13, -s * 0.28, s * 0.05, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(s * 0.13, -s * 0.28, s * 0.05, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
      // Белки
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.ellipse(-s * 0.13, -s * 0.28, s * 0.11, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 0.13, -s * 0.28, s * 0.11, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.stroke();

      // Зрачки
      ctx.fillStyle = '#1a1a2e';
      if (this.expression === 'surprised') {
        ctx.beginPath(); ctx.arc(-s * 0.13, -s * 0.28, s * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.13, -s * 0.28, s * 0.07, 0, Math.PI * 2); ctx.fill();
      } else {
        let po = (this.expression === 'happy' || this.expression === 'excited') ? 2 : 0;
        ctx.beginPath(); ctx.arc(-s * 0.13, -s * 0.28 + po, s * 0.055, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.13, -s * 0.28 + po, s * 0.055, 0, Math.PI * 2); ctx.fill();
        // Блики
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(-s * 0.10, -s * 0.33, s * 0.025, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.17, -s * 0.33, s * 0.02, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ============ НОС ============
    ctx.fillStyle = '#F8A4B8';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.05, s * 0.038, 0, 0, Math.PI * 2);
    ctx.fill();

    // ============ ПЕРЕДНИЕ ЗУБЫ (фирменная черта гофера) ============
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#2C7A9C';
    ctx.lineWidth = 1.2;
    [-1, 1].forEach(dir => {
      const x0 = dir > 0 ? s * 0.008 : -s * 0.052;
      ctx.beginPath();
      ctx.roundRect(x0, -s * 0.155, s * 0.044, s * 0.09, s * 0.014);
      ctx.fill();
      ctx.stroke();
    });

    // ============ РОТ ============
    ctx.lineCap = 'round';
    if (this.expression === 'sad') {
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -s * 0.185, s * 0.05, Math.PI + 0.35, -0.35); ctx.stroke();
    } else if (this.expression === 'surprised') {
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath(); ctx.ellipse(0, -s * 0.185, s * 0.022, s * 0.03, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -s * 0.20, s * 0.045, 0.25, Math.PI - 0.25); ctx.stroke();
    }

    // ============ УСЫ (две тонкие линии у мордочки) ============
    ctx.strokeStyle = 'rgba(70,110,130,0.35)';
    ctx.lineWidth = Math.max(1, s * 0.009);
    [-1, 1].forEach(dir => {
      [-0.02, 0.02].forEach(dy => {
        ctx.beginPath();
        ctx.moveTo(dir * s * 0.16, -s * 0.19 + s * dy);
        ctx.lineTo(dir * s * 0.255, -s * 0.20 + s * dy * 2.2);
        ctx.stroke();
      });
    });

    // ACCESSORIES
    if (this.hat === 'chef') {
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.roundRect(-s*0.18, -s*0.55, s*0.36, s*0.22, 10);
      ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -s*0.55, s*0.22, s*0.08, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -s*0.62, s*0.12, s*0.06, 0, 0, Math.PI*2); ctx.fill();
    } else if (this.hat === 'scientist') {
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.roundRect(-s*0.2, -s*0.5, s*0.4, s*0.16, 6);
      ctx.fill();
      ctx.fillStyle = '#1F3B4D';
      ctx.font = `bold ${s*0.07}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Go', 0, -s*0.4);
    } else if (this.hat === 'crown') {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(-s*0.18, -s*0.5);
      ctx.lineTo(-s*0.18, -s*0.65);
      ctx.lineTo(-s*0.07, -s*0.58);
      ctx.lineTo(0, -s*0.68);
      ctx.lineTo(s*0.07, -s*0.58);
      ctx.lineTo(s*0.18, -s*0.65);
      ctx.lineTo(s*0.18, -s*0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#FF0000';
      ctx.beginPath(); ctx.arc(0, -s*0.58, s*0.02, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0066FF';
      ctx.beginPath(); ctx.arc(-s*0.1, -s*0.55, s*0.015, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#00CC00';
      ctx.beginPath(); ctx.arc(s*0.1, -s*0.55, s*0.015, 0, Math.PI*2); ctx.fill();
    }

    if (this.glasses === 'nerd') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-s*0.13, -s*0.28, s*0.12, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(s*0.13, -s*0.28, s*0.12, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.01, -s*0.28); ctx.lineTo(s*0.01, -s*0.28); ctx.stroke();
      ctx.fillStyle = 'rgba(200,230,255,0.2)';
      ctx.beginPath(); ctx.arc(-s*0.13, -s*0.28, s*0.11, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(s*0.13, -s*0.28, s*0.11, 0, Math.PI*2); ctx.fill();
    } else if (this.glasses === 'cool') {
      ctx.fillStyle = 'rgba(30,30,30,0.85)';
      ctx.beginPath(); ctx.roundRect(-s*0.24, -s*0.37, s*0.2, s*0.14, 8); ctx.fill();
      ctx.beginPath(); ctx.roundRect(s*0.04, -s*0.37, s*0.2, s*0.14, 8); ctx.fill();
      ctx.fillStyle = 'rgba(150,220,255,0.25)';
      ctx.beginPath(); ctx.roundRect(-s*0.22, -s*0.35, s*0.15, s*0.06, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(s*0.06, -s*0.35, s*0.15, s*0.06, 5); ctx.fill();
    }

    if (this.bowtie) {
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-s*0.1, -s*0.08);
      ctx.lineTo(-s*0.1, s*0.08);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s*0.1, -s*0.08);
      ctx.lineTo(s*0.1, s*0.08);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#CC0000';
      ctx.beginPath(); ctx.arc(0, 0, s*0.025, 0, Math.PI*2); ctx.fill();
    }

    // Outline (мягкая тень-обводка только по контуру, без колец)
    ctx.lineJoin = 'round';

    ctx.restore();
  }

  setExpression(expr, duration) {
    this.expression = expr;
    this.expressionTimer = duration || 30;
  }

  getExpression() { return this.expression; }
}
window.Gopher = Gopher;
