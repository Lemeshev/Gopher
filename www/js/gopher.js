// ============ ГОФЕР — КЛАССИЧЕСКИЙ Go-МАСКОТ (Renée French) ============
// Пропорции: тело-«капсула» со прямыми боками, круглые уши, огромные глаза,
// бежевая морда с тёмным носом и двумя резцами, бежевые лапы и ступни.
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

  // ---------- ПАЛИТРА ----------
  get COLORS() {
    return {
      body: '#7FDBE8',   // светло-голубой, как у маскота Go
      limb: '#F7D8A8',   // бежевые морда/лапы/ступни
      nose: '#3A2618',   // тёмно-коричневый нос
      line: '#1A1A1A',   // обводка
      tooth: '#FFFFFF',
      eyePupil: '#141414'
    };
  }

  draw(ctx, x, y, scale) {
    const s = this.size * (scale || 1);
    this.animationTime += 0.05;
    this.bobY = Math.sin(this.animationTime * 2) * 2;
    this.blinkTimer++;
    if (this.blinkTimer > 120) { this.blinking = true; }
    if (this.blinkTimer > 125) { this.blinking = false; this.blinkTimer = 0; }
    this.armAngle = Math.sin(this.animationTime * 3) * 0.10;
    this.legAnim = Math.sin(this.animationTime * 4) * 0.12;

    if (this.expressionTimer > 0) {
      this.expressionTimer--;
      if (this.expressionTimer <= 0) this.expression = 'happy';
    }

    if (this.expression === 'sleeping') {
      this.zzz.push({ x: x + s * 0.4, y: y - s * 0.55 - this.zzz.length * 12, alpha: 1, size: 10 + this.zzz.length * 2 });
      if (this.zzz.length > 4) this.zzz.shift();
      this.zzz.forEach(z => { z.alpha -= 0.012; z.y -= 0.4; });
      this.zzz = this.zzz.filter(z => z.alpha > 0);
    }

    if (this.expression === 'excited') {
      if (Math.random() < 0.2) {
        this.sparks.push({ x: (Math.random() - 0.5) * s * 0.9, y: (Math.random() - 0.5) * s * 0.9, alpha: 1, size: Math.random() * 3 + 1.5 });
      }
      this.sparks.forEach(sp => { sp.alpha -= 0.03; sp.y -= 0.8; });
      this.sparks = this.sparks.filter(sp => sp.alpha > 0);
    }

    const C = this.COLORS;
    const lw = Math.max(1.2, s * 0.011);

    ctx.save();
    ctx.translate(x, y + this.bobY);
    ctx.lineJoin = 'round';

    // --- искры (excited) ---
    if (this.sparks.length > 0) {
      this.sparks.forEach(sp => {
        ctx.globalAlpha = sp.alpha; ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // --- «z» (sleeping) ---
    if (this.zzz.length > 0) {
      this.zzz.forEach(z => {
        ctx.globalAlpha = z.alpha; ctx.fillStyle = '#8FD8E8';
        ctx.font = `bold ${z.size}px Arial`; ctx.textAlign = 'center';
        ctx.fillText('z', z.x - x, z.y - y);
      });
      ctx.globalAlpha = 1;
    }

    // ============ УШИ — маленькие круги по бокам головы (ПОД телом) ============
    const earR = s * 0.072;
    [1, -1].forEach(dir => {
      ctx.beginPath();
      ctx.arc(dir * s * 0.280, -s * 0.308, earR, 0, Math.PI * 2);
      ctx.fillStyle = C.body; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
    });

    // ============ СТУПНИ — бежевые, торчат из-под тела ============
    const footR = this.legAnim * 0.25;
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.235, s * 0.408);
      ctx.rotate(dir * (0.18 + footR));
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.075, s * 0.056, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      ctx.restore();
    });

    // ============ ЛАПЫ — бежевые, торчат в стороны ============
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.340, s * 0.03);
      ctx.rotate(dir * (0.16 + this.armAngle));
      if (this.expression === 'excited') ctx.rotate(dir * 0.26);
      // предплечье
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.055, s * 0.034, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      // кисть — круглая
      ctx.beginPath();
      ctx.arc(dir * s * 0.048, s * 0.004, s * 0.036, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      ctx.restore();
    });

    // ============ ТЕЛО — капсула со прямыми боками ============
    const bodyW = s * 0.63, bodyH = s * 0.80, bodyR = s * 0.235;
    const bodyX = -bodyW / 2, bodyY = -s * 0.400;
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, bodyR);
    ctx.fillStyle = C.body; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();

    // ============ ГЛАЗА — огромные, почти вплотную, у макушки ============
    const eyeY = -s * 0.272;
    const eyeSpacing = s * 0.097;
    const eyeR = s * 0.098;
    const pupilR = eyeR * 0.43;

    [1, -1].forEach(dir => {
      const ex = dir * eyeSpacing;

      if (this.expression === 'sleeping') {
        // закрытый глаз — дуга «вниз»
        ctx.strokeStyle = C.line; ctx.lineWidth = lw * 1.3; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ex, eyeY - eyeR * 0.30, eyeR * 0.70, Math.PI * 0.18, Math.PI * 0.82);
        ctx.stroke();
        ctx.lineCap = 'butt';
        return;
      }
      if (this.blinking) {
        // моргание — почти прямая линия
        ctx.strokeStyle = C.line; ctx.lineWidth = lw * 1.3; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - eyeR * 0.62, eyeY - eyeR * 0.06);
        ctx.quadraticCurveTo(ex, eyeY + eyeR * 0.18, ex + eyeR * 0.62, eyeY - eyeR * 0.06);
        ctx.stroke();
        ctx.lineCap = 'butt';
        return;
      }

      // белок
      ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();

      if (this.expression === 'sad' || this.expression === 'sick') {
        // полуприкрытые глаза: веко опущено, внешний угол ниже
        const inX = ex - dir * eyeR, outX = ex + dir * eyeR;
        const inY = eyeY - eyeR * 0.12, outY = eyeY + eyeR * 0.18;
        ctx.save();
        ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2); ctx.clip();
        // зрачок внизу
        ctx.beginPath();
        ctx.arc(ex + dir * eyeR * 0.08, eyeY + eyeR * 0.40, pupilR * 0.86, 0, Math.PI * 2);
        ctx.fillStyle = C.eyePupil; ctx.fill();
        // веко
        ctx.beginPath();
        ctx.moveTo(inX, eyeY - eyeR);
        ctx.lineTo(inX, inY);
        ctx.lineTo(outX, outY);
        ctx.lineTo(outX, eyeY - eyeR);
        ctx.closePath();
        ctx.fillStyle = C.body; ctx.fill();
        ctx.restore();
        // контур глаза и линия века
        ctx.strokeStyle = C.line; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(inX, inY); ctx.lineTo(outX, outY); ctx.stroke();
      } else {
        const pr = (this.expression === 'excited') ? pupilR * 1.18 : pupilR;
        // зрачок чуть внутрь и вниз
        const px = ex - dir * eyeR * 0.10;
        const py = eyeY + eyeR * 0.13;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = C.eyePupil; ctx.fill();
        // блик
        ctx.beginPath(); ctx.arc(px + pr * 0.34, py - pr * 0.36, pr * 0.30, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF'; ctx.fill();
      }
    });

    // ============ МОРДА — бежевая, вокруг носа и рта ============
    const muzzleY = -s * 0.168;
    ctx.beginPath();
    ctx.ellipse(0, muzzleY, s * 0.106, s * 0.057, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.limb; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();

    // ============ НОС — тёмно-коричневый, крупный ============
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.198, s * 0.049, s * 0.033, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.nose; ctx.fill();
    // мягкий блик сверху
    ctx.beginPath();
    ctx.ellipse(-s * 0.011, -s * 0.207, s * 0.022, s * 0.009, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();

    // ============ РОТ И ЗУБЫ (два резца) ============
    const toothW = s * 0.040, toothH = s * 0.062, toothTop = -s * 0.152;
    const toothGap = s * 0.022;
    if (this.expression === 'eating') {
      // открытый рот + зубы
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.150, s * 0.052, s * 0.036, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7A2230'; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = C.tooth; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.7;
      [-1, 1].forEach(dir => {
        roundRect(ctx, dir * toothGap - toothW / 2, toothTop - s * 0.012, toothW, toothH * 0.62, s * 0.010);
        ctx.fill(); ctx.stroke();
      });
    } else if (this.expression === 'sad' || this.expression === 'sick') {
      // уголки рта вниз, зубы короче
      ctx.strokeStyle = C.line; ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-s * 0.048, -s * 0.140);
      ctx.quadraticCurveTo(0, -s * 0.108, s * 0.048, -s * 0.140);
      ctx.stroke();
      ctx.fillStyle = C.tooth; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.7;
      [-1, 1].forEach(dir => {
        roundRect(ctx, dir * toothGap - toothW / 2, toothTop + s * 0.014, toothW, toothH * 0.7, s * 0.010);
        ctx.fill(); ctx.stroke();
      });
    } else if (this.expression === 'sleeping') {
      // маленький приоткрытый рот
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.145, s * 0.024, s * 0.016, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.nose; ctx.fill();
    } else {
      // happy / excited — два резца, линия рта сверху
      ctx.fillStyle = C.tooth; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.7;
      [-1, 1].forEach(dir => {
        roundRect(ctx, dir * toothGap - toothW / 2, toothTop, toothW, toothH, s * 0.010);
        ctx.fill(); ctx.stroke();
      });
    }

    // ============ КАПЛЯ ПОТА (sick) ============
    if (this.expression === 'sick') {
      ctx.fillStyle = '#8FD8F5';
      ctx.beginPath();
      ctx.moveTo(s * 0.235, -s * 0.30);
      ctx.quadraticCurveTo(s * 0.265, -s * 0.235, s * 0.235, -s * 0.195);
      ctx.quadraticCurveTo(s * 0.195, -s * 0.235, s * 0.235, -s * 0.30);
      ctx.fill();
    }

    // ============ АКСЕССУАРЫ ============
    // Шляпы садятся на макушку (верх тела — y = -0.395s)
    if (this.hat === 'chef') {
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.8;
      roundRect(ctx, -s * 0.155, -s * 0.460, s * 0.31, s * 0.12, s * 0.02);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -s * 0.460, s * 0.175, s * 0.058, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -s * 0.510, s * 0.105, s * 0.042, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (this.hat === 'scientist') {
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.8;
      roundRect(ctx, -s * 0.165, -s * 0.455, s * 0.33, s * 0.115, s * 0.015);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1F3B4D'; ctx.font = `bold ${s * 0.055}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Go', 0, -s * 0.398);
    } else if (this.hat === 'crown') {
      ctx.fillStyle = '#FFD700'; ctx.beginPath();
      ctx.moveTo(-s * 0.135, -s * 0.44); ctx.lineTo(-s * 0.135, -s * 0.57); ctx.lineTo(-s * 0.052, -s * 0.50);
      ctx.lineTo(0, -s * 0.60); ctx.lineTo(s * 0.052, -s * 0.50); ctx.lineTo(s * 0.135, -s * 0.57);
      ctx.lineTo(s * 0.135, -s * 0.44);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#B8860B'; ctx.lineWidth = Math.max(1, lw * 0.7); ctx.stroke();
    }

    // Очки размером под большие глаза
    if (this.glasses === 'nerd') {
      ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(1.6, s * 0.016);
      [-1, 1].forEach(dir => {
        ctx.beginPath(); ctx.arc(dir * eyeSpacing, eyeY, eyeR * 1.08, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing + eyeR * 1.08, eyeY); ctx.lineTo(eyeSpacing - eyeR * 1.08, eyeY);
      ctx.stroke();
    } else if (this.glasses === 'cool') {
      ctx.fillStyle = 'rgba(24,24,28,0.88)';
      ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.8;
      [-1, 1].forEach(dir => {
        const gx = dir * eyeSpacing - eyeR * 0.95;
        roundRect(ctx, gx, eyeY - eyeR * 0.62, eyeR * 1.9, eyeR * 1.24, s * 0.022);
        ctx.fill(); ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing + eyeR * 0.95, eyeY); ctx.lineTo(eyeSpacing - eyeR * 0.95, eyeY);
      ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(1.4, s * 0.012); ctx.stroke();
    }

    // Бабочка — под подбородком
    if (this.bowtie) {
      const by = s * 0.045, bw = s * 0.072, bh = s * 0.062;
      ctx.fillStyle = '#FF4444'; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.7;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(0, by);
        ctx.lineTo(dir * bw, by - bh / 2);
        ctx.lineTo(dir * bw, by + bh / 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = '#CC0000';
      ctx.beginPath(); ctx.arc(0, by, s * 0.019, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.6; ctx.stroke();
    }

    ctx.restore();
  }

  setExpression(expr, duration) {
    this.expression = expr;
    this.expressionTimer = duration || 30;
  }

  getExpression() { return this.expression; }
}
window.Gopher = Gopher;
