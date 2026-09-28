// ============ ГОФЕР - ГЛАВНЫЙ ПЕРСОНАЖ (классический Go-маскот) ============
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
    this.bobY = Math.sin(this.animationTime * 2) * 2;
    this.blinkTimer++;
    if (this.blinkTimer > 120) { this.blinking = true; }
    if (this.blinkTimer > 125) { this.blinking = false; this.blinkTimer = 0; }
    this.armAngle = Math.sin(this.animationTime * 3) * 0.12;
    this.legAnim = Math.sin(this.animationTime * 4) * 0.15;

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
        this.sparks.push({ x: (Math.random() - 0.5) * s * 0.8, y: (Math.random() - 0.5) * s * 0.8, alpha: 1, size: Math.random() * 3 + 1.5 });
      }
      this.sparks.forEach(sp => { sp.alpha -= 0.03; sp.y -= 0.8; });
      this.sparks = this.sparks.filter(sp => sp.alpha > 0);
    }

    ctx.save();
    ctx.translate(x, y + this.bobY);

    // Sparkles
    if (this.sparks.length > 0) {
      this.sparks.forEach(sp => {
        ctx.globalAlpha = sp.alpha; ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // ZZZ
    if (this.zzz.length > 0) {
      this.zzz.forEach(z => {
        ctx.globalAlpha = z.alpha; ctx.fillStyle = '#aaddff';
        ctx.font = `bold ${z.size}px Arial`; ctx.textAlign = 'center';
        ctx.fillText('z', z.x - x, z.y - y);
      });
      ctx.globalAlpha = 1;
    }

    // ============ НОЖКИ ============
    const legW = s * 0.07, legH = s * 0.13, footR = legW * 0.9;
    [1, -1].forEach(dir => {
      ctx.save(); ctx.translate(dir * s * 0.18, s * 0.32); ctx.rotate(this.legAnim * 0.3 * dir);
      ctx.fillStyle = '#6BCB77'; ctx.beginPath(); ctx.ellipse(0, 0, legW, legH * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#F8A4B8'; ctx.beginPath(); ctx.ellipse(0, legH * 0.5, footR, footR * 0.65, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // ============ ТЕЛО — единый широкий овал (картофелина Go-гофера) ============
    ctx.fillStyle = '#6BCB77'; ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.38, s * 0.34, 0, 0, Math.PI * 2); ctx.fill();

    // ============ ЖИВОТ — светлый оверлей ============
    ctx.fillStyle = '#A8E6A3'; ctx.beginPath(); ctx.ellipse(0, s * 0.10, s * 0.28, s * 0.24, 0, 0, Math.PI * 2); ctx.fill();

    // ============ УШИ (круглые) ============
    [1, -1].forEach(dir => {
      ctx.fillStyle = '#6BCB77'; ctx.beginPath(); ctx.arc(dir * s * 0.30, -s * 0.22, s * 0.10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#F8A4B8'; ctx.beginPath(); ctx.arc(dir * s * 0.30, -s * 0.22, s * 0.06, 0, Math.PI * 2); ctx.fill();
    });

    // ============ РУЧКИ ============
    const armW = s * 0.055, armH = s * 0.14;
    [1, -1].forEach(dir => {
      ctx.save(); ctx.translate(dir * s * 0.34, s * 0.05); ctx.rotate(dir * (0.3 + this.armAngle));
      if (this.expression === 'excited') { ctx.rotate(dir * 0.3); }
      ctx.fillStyle = '#6BCB77'; ctx.beginPath(); ctx.ellipse(0, armH * 0.3, armW, armH * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#F8A4B8'; ctx.beginPath(); ctx.ellipse(0, armH * 0.8, armW * 1.1, armW * 0.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // ============ ГЛАЗА ============
    const eyeY = -s * 0.10;
    const eyeSpacing = s * 0.14;
    const eyeR = s * 0.09;
    [1, -1].forEach(dir => {
      const ex = dir * eyeSpacing;
      if (this.expression === 'sleeping') {
        ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(2, s * 0.02);
        ctx.beginPath(); ctx.moveTo(ex - eyeR * 0.6, eyeY); ctx.lineTo(ex + eyeR * 0.6, eyeY); ctx.stroke();
      } else if (this.blinking) {
        ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(2, s * 0.02);
        ctx.beginPath(); ctx.moveTo(ex - eyeR * 0.7, eyeY); ctx.lineTo(ex + eyeR * 0.7, eyeY); ctx.stroke();
      } else if (this.expression === 'sad' || this.expression === 'sick') {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeR, eyeR * 0.9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(ex, eyeY + eyeR * 0.15, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(1.5, s * 0.015);
        ctx.beginPath(); ctx.moveTo(ex - eyeR * 0.7, eyeY - eyeR * 0.8 + dir * eyeR * 0.2); ctx.lineTo(ex + eyeR * 0.7, eyeY - eyeR * 0.8 - dir * eyeR * 0.2); ctx.stroke();
      } else if (this.expression === 'eating') {
        ctx.lineWidth = Math.max(2, s * 0.025); ctx.strokeStyle = '#333';
        ctx.beginPath(); ctx.moveTo(ex - eyeR * 0.7, eyeY); ctx.quadraticCurveTo(ex, eyeY + eyeR * 0.5, ex + eyeR * 0.7, eyeY); ctx.stroke();
      } else {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeR, eyeR * (this.expression === 'excited' ? 1.15 : 1), 0, 0, Math.PI * 2); ctx.fill();
        const pupilR = eyeR * (this.expression === 'excited' ? 0.55 : 0.5);
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(ex, eyeY + eyeR * 0.08, pupilR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + pupilR * 0.3, eyeY - pupilR * 0.2, pupilR * 0.3, 0, Math.PI * 2); ctx.fill();
      }
    });

    // ============ НОС ============
    ctx.fillStyle = '#F8A4B8'; ctx.beginPath(); ctx.ellipse(0, -s * 0.01, s * 0.035, s * 0.025, 0, 0, Math.PI * 2); ctx.fill();

    // ============ УСЫ ============
    ctx.strokeStyle = '#4a7c4a'; ctx.lineWidth = Math.max(1, s * 0.01);
    [1, -1].forEach(dir => {
      ctx.beginPath(); ctx.moveTo(dir * s * 0.04, -s * 0.01); ctx.lineTo(dir * s * 0.20, -s * 0.06); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dir * s * 0.04, 0); ctx.lineTo(dir * s * 0.19, s * 0.02); ctx.stroke();
    });

    // ============ РОТ / ЗУБЫ ============
    const mouthY = s * 0.06;
    if (this.expression === 'happy' || this.expression === 'excited') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(1.5, s * 0.015);
      ctx.beginPath(); ctx.moveTo(-s * 0.08, mouthY); ctx.quadraticCurveTo(0, mouthY + s * 0.08, s * 0.08, mouthY); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5;
      const toothW = s * 0.032, toothH = s * 0.04;
      [-1, 1].forEach(dir => { ctx.beginPath(); ctx.roundRect(dir * toothW * 0.3 - toothW / 2, mouthY, toothW, toothH, 1); ctx.fill(); ctx.stroke(); });
    } else if (this.expression === 'eating') {
      ctx.fillStyle = '#8B0000'; ctx.beginPath(); ctx.ellipse(0, mouthY + s * 0.02, s * 0.06, s * 0.04, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, mouthY, s * 0.06, s * 0.015, 0, 0, Math.PI); ctx.fill();
    } else if (this.expression === 'sad' || this.expression === 'sick') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(1.5, s * 0.015);
      ctx.beginPath(); ctx.moveTo(-s * 0.06, mouthY + s * 0.02); ctx.quadraticCurveTo(0, mouthY - s * 0.04, s * 0.06, mouthY + s * 0.02); ctx.stroke();
      ctx.fillStyle = '#fff'; const toothW = s * 0.032, toothH = s * 0.035;
      [-1, 1].forEach(dir => { ctx.beginPath(); ctx.roundRect(dir * toothW * 0.3 - toothW / 2, mouthY - s * 0.01, toothW, toothH, 1); ctx.fill(); });
    } else if (this.expression === 'sleeping') {
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(0, mouthY + s * 0.02, s * 0.025, s * 0.02, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(1.5, s * 0.015);
      ctx.beginPath(); ctx.moveTo(-s * 0.06, mouthY); ctx.quadraticCurveTo(0, mouthY + s * 0.05, s * 0.06, mouthY); ctx.stroke();
      ctx.fillStyle = '#fff'; const toothW = s * 0.032, toothH = s * 0.035;
      [-1, 1].forEach(dir => { ctx.beginPath(); ctx.roundRect(dir * toothW * 0.3 - toothW / 2, mouthY, toothW, toothH, 1); ctx.fill(); });
    }

    // Cheeks for happy/excited
    if (this.expression === 'happy' || this.expression === 'excited') {
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#FF9999';
      [-1, 1].forEach(dir => { ctx.beginPath(); ctx.ellipse(dir * s * 0.22, s * 0.02, s * 0.05, s * 0.035, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
    }

    // Sweat for sick
    if (this.expression === 'sick') {
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath(); ctx.moveTo(s * 0.22, -s * 0.18); ctx.quadraticCurveTo(s * 0.25, -s * 0.12, s * 0.22, -s * 0.08); ctx.quadraticCurveTo(s * 0.18, -s * 0.12, s * 0.22, -s * 0.18); ctx.fill();
    }

    // ============ АКСЕССУАРЫ ============
    if (this.hat === 'chef') {
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.roundRect(-s * 0.18, -s * 0.42, s * 0.36, s * 0.18, 8); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -s * 0.42, s * 0.22, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -s * 0.48, s * 0.12, s * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    } else if (this.hat === 'scientist') {
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.roundRect(-s * 0.2, -s * 0.38, s * 0.4, s * 0.14, 5); ctx.fill();
      ctx.fillStyle = '#1F3B4D'; ctx.font = `bold ${s * 0.06}px Arial`; ctx.textAlign = 'center'; ctx.fillText('Go', 0, -s * 0.30);
    } else if (this.hat === 'crown') {
      ctx.fillStyle = '#FFD700'; ctx.beginPath();
      ctx.moveTo(-s * 0.16, -s * 0.38); ctx.lineTo(-s * 0.16, -s * 0.52); ctx.lineTo(-s * 0.06, -s * 0.45);
      ctx.lineTo(0, -s * 0.55); ctx.lineTo(s * 0.06, -s * 0.45); ctx.lineTo(s * 0.16, -s * 0.52); ctx.lineTo(s * 0.16, -s * 0.38);
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 1; ctx.stroke();
    }

    if (this.glasses === 'nerd') {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, eyeR * 1.2, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, eyeR * 1.2, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-eyeSpacing + eyeR * 1.2, eyeY); ctx.lineTo(eyeSpacing - eyeR * 1.2, eyeY); ctx.stroke();
    } else if (this.glasses === 'cool') {
      ctx.fillStyle = 'rgba(30,30,30,0.85)';
      ctx.beginPath(); ctx.roundRect(-eyeSpacing - eyeR * 1.1, eyeY - eyeR * 0.6, eyeR * 2.2, eyeR * 1.2, 6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(eyeSpacing - eyeR * 1.1, eyeY - eyeR * 0.6, eyeR * 2.2, eyeR * 1.2, 6); ctx.fill();
    }

    if (this.bowtie) {
      ctx.fillStyle = '#FF4444';
      ctx.beginPath(); ctx.moveTo(0, s * 0.20); ctx.lineTo(-s * 0.08, s * 0.14); ctx.lineTo(-s * 0.08, s * 0.26); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, s * 0.20); ctx.lineTo(s * 0.08, s * 0.14); ctx.lineTo(s * 0.08, s * 0.26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#CC0000'; ctx.beginPath(); ctx.arc(0, s * 0.20, s * 0.02, 0, Math.PI * 2); ctx.fill();
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
