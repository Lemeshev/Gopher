// ============ ГОФЕР - ГЛАВНЫЙ ПЕРСОНАЖ ============
class Gopher {
  constructor(canvas, size) {
    this.size = size || 100;
    this.expression = 'happy';  // happy, sad, eating, sleeping, sick, surprised, excited, angry
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
    this.waveTimer = 0;
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
      if (this.expressionTimer <= 0) {
        this.expression = 'happy';
      }
    }

    if (this.expression === 'sleeping') {
      this.zzz.push({
        x: x + s * 0.4,
        y: y - s * 0.3 - this.zzz.length * 20,
        alpha: 1,
        size: 14 + this.zzz.length * 2
      });
      if (this.zzz.length > 5) this.zzz.shift();
      this.zzz.forEach(z => { z.alpha -= 0.01; z.y -= 0.5; });
      this.zzz = this.zzz.filter(z => z.alpha > 0);
    }

    if (this.expression === 'excited') {
      if (Math.random() < 0.3) {
        this.sparks.push({
          x: x + (Math.random() - 0.5) * s,
          y: y + (Math.random() - 0.5) * s,
          alpha: 1,
          size: Math.random() * 5 + 2
        });
      }
      this.sparks.forEach(sp => { sp.alpha -= 0.03; sp.y -= 1; });
      this.sparks = this.sparks.filter(sp => sp.alpha > 0);
    }

    // Save context
    ctx.save();
    ctx.translate(x, y + this.bobY);

    // Draw sparks (behind gopher)
    if (this.sparks.length > 0) {
      this.sparks.forEach(sp => {
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const outerX = Math.cos(angle) * sp.size;
          const outerY = Math.sin(angle) * sp.size;
          const innerAngle = angle + Math.PI / 5;
          const innerX = Math.cos(innerAngle) * sp.size * 0.5;
          const innerY = Math.sin(innerAngle) * sp.size * 0.5;
          if (i === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
          ctx.lineTo(sp.x + outerX, sp.y + outerY);
          ctx.lineTo(sp.x + innerX * 0.4, sp.y + innerY * 0.4);
        }
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // Legs
    ctx.fillStyle = '#4A90D9';
    const legW = s * 0.12;
    const legH = s * 0.22;
    const legY = s * 0.3;
    // Left leg
    ctx.save();
    ctx.translate(-s * 0.2, legY);
    ctx.rotate(this.legAnim * 0.2);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    // Foot
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.ellipse(0, legH, legW * 1.2, legH * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Right leg
    ctx.save();
    ctx.fillStyle = '#4A90D9';
    ctx.translate(s * 0.2, legY);
    ctx.rotate(-this.legAnim * 0.2);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.ellipse(0, legH, legW * 1.2, legH * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.38, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#7EC0EE';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.25, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.save();
    ctx.fillStyle = '#4A90D9';
    ctx.translate(-s * 0.38, s * 0.0);
    ctx.rotate(-0.3 + this.armAngle);
    ctx.fillRect(-s * 0.06, -s * 0.05, s * 0.12, s * 0.28);
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.arc(0, s * 0.23, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#4A90D9';
    ctx.translate(s * 0.38, s * 0.0);
    ctx.rotate(0.3 - this.armAngle);
    ctx.fillRect(-s * 0.06, -s * 0.05, s * 0.12, s * 0.28);
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.arc(0, s * 0.23, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.32, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.ellipse(-s * 0.28, -s * 0.42, s * 0.08, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7EC0EE';
    ctx.beginPath();
    ctx.ellipse(-s * 0.28, -s * 0.42, s * 0.04, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.ellipse(s * 0.28, -s * 0.42, s * 0.08, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7EC0EE';
    ctx.beginPath();
    ctx.ellipse(s * 0.28, -s * 0.42, s * 0.04, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks (blush)
    ctx.fillStyle = 'rgba(255, 150, 150, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.18, -s * 0.18, s * 0.06, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.18, -s * 0.18, s * 0.06, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout/muzzle
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.14, s * 0.14, s * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#FF6B8A';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.17, s * 0.04, s * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (this.expression === 'sleeping') {
      // Closed eyes
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-s * 0.12, -s * 0.28, s * 0.05, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.12, -s * 0.28, s * 0.05, 0, Math.PI);
      ctx.stroke();
    } else {
      // Eye whites
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-s * 0.12, -s * 0.28, s * 0.08, s * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.12, -s * 0.28, s * 0.08, s * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      let pupilY = 0;
      if (this.expression === 'surprised') {
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-s * 0.12, -s * 0.28, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.12, -s * 0.28, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-s * 0.12, -s * 0.28 + pupilY, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.12, -s * 0.28 + pupilY, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.3, s * 0.015, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.14, -s * 0.3, s * 0.015, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mouth
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    switch (this.expression) {
      case 'happy':
      case 'excited':
        ctx.beginPath();
        ctx.arc(0, -s * 0.1, s * 0.06, 0.1, Math.PI - 0.1);
        ctx.stroke();
        break;
      case 'eating':
        ctx.fillStyle = '#FF6B8A';
        ctx.beginPath();
        ctx.arc(0, -s * 0.1, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(0, -s * 0.1, s * 0.05, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'sad':
        ctx.beginPath();
        ctx.arc(0, -s * 0.04, s * 0.05, Math.PI + 0.3, -0.3);
        ctx.stroke();
        break;
      case 'sick':
        ctx.beginPath();
        ctx.moveTo(-s * 0.04, -s * 0.1);
        ctx.quadraticCurveTo(0, -s * 0.13, s * 0.04, -s * 0.1);
        ctx.stroke();
        break;
      case 'surprised':
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.08, s * 0.03, s * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'angry':
        ctx.beginPath();
        ctx.moveTo(-s * 0.04, -s * 0.09);
        ctx.lineTo(s * 0.04, -s * 0.09);
        ctx.stroke();
        // Angry eyebrows
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-s * 0.18, -s * 0.38);
        ctx.lineTo(-s * 0.06, -s * 0.34);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.18, -s * 0.38);
        ctx.lineTo(s * 0.06, -s * 0.34);
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, -s * 0.1, s * 0.06, 0.1, Math.PI - 0.1);
        ctx.stroke();
    }

    // Hat
    if (this.hat === 'chef') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(-s * 0.15, -s * 0.55, s * 0.3, s * 0.2, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.55, s * 0.2, s * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.62, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.hat === 'scientist') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(-s * 0.18, -s * 0.5, s * 0.36, s * 0.15, 5);
      ctx.fill();
      ctx.fillStyle = '#4A90D9';
      ctx.font = `bold ${s * 0.06}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Go', 0, -s * 0.41);
    } else if (this.hat === 'crown') {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, -s * 0.48);
      ctx.lineTo(-s * 0.15, -s * 0.62);
      ctx.lineTo(-s * 0.05, -s * 0.55);
      ctx.lineTo(0, -s * 0.65);
      ctx.lineTo(s * 0.05, -s * 0.55);
      ctx.lineTo(s * 0.15, -s * 0.62);
      ctx.lineTo(s * 0.15, -s * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(0, -s * 0.55, s * 0.015, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glasses
    if (this.glasses === 'nerd') {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-s * 0.12, -s * 0.28, s * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.12, -s * 0.28, s * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.02, -s * 0.28);
      ctx.lineTo(s * 0.02, -s * 0.28);
      ctx.stroke();
    } else if (this.glasses === 'cool') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(-s * 0.22, -s * 0.36, s * 0.18, s * 0.12, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(s * 0.04, -s * 0.36, s * 0.18, s * 0.12, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(-s * 0.2, -s * 0.34, s * 0.14, s * 0.06, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(s * 0.06, -s * 0.34, s * 0.14, s * 0.06, 5);
      ctx.fill();
    }

    // Bowtie
    if (this.bowtie) {
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.02);
      ctx.lineTo(-s * 0.08, -s * 0.06);
      ctx.lineTo(-s * 0.08, s * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.02);
      ctx.lineTo(s * 0.08, -s * 0.06);
      ctx.lineTo(s * 0.08, s * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#CC0000';
      ctx.beginPath();
      ctx.arc(0, -s * 0.02, s * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }

    // Zzz
    if (this.expression === 'sleeping') {
      this.zzz.forEach(z => {
        ctx.globalAlpha = z.alpha;
        ctx.fillStyle = '#87CEEB';
        ctx.font = `bold ${z.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Z', z.x - x, z.y - y - this.bobY);
      });
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  setExpression(expr, duration) {
    this.expression = expr;
    if (duration) this.expressionTimer = duration;
  }
}

window.Gopher = Gopher;
