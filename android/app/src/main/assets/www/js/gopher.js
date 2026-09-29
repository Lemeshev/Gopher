// ============ ПЕРСОНАЖ — КЛАССИЧЕСКИЙ Go-МАСКОТ + ОБЩАЯ АНИМАЦИЯ ============
// Пропорции гофера: тело-«капсула» со прямыми боками, круглые уши, огромные
// глаза, бежевая морда с тёмным носом и двумя резцами, бежевые лапы и ступни.
//
// ВАЖНО (задел на будущее): класс отвечает не только за гофера. Любая детская
// игрушка (мишка, зайка, котёнок, робот) — это тот же персонаж с другим
// описанием из CHARACTERS (см. js/characters.js). Общая часть — «пульс» фигурки
// (покачивание, мигание, zzz, искры), аксессуары и экипировка.
class Gopher {
  constructor(canvas, size, charId) {
    this.size = size || 100;
    this.charId = charId || 'gopher';
    this.char = (typeof findCharacter === 'function') ? findCharacter(this.charId) : null;
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
    this.bodyColor = null;     // свой окрас (если куплен)
    this.outfit = null;        // 'tie' | 'trunks' | 'sporty'
    this.heldEmoji = null;     // что держит в лапе
    this.heldTimer = 0;
    this.shower = 0;           // >0 — над гофером льётся вода
    this.waterLine = null;     // доля s: ниже — вода (для бассейна)
    this.animationTime = 0;
    this.zzz = [];
    this.sparks = [];
    this.canvas = canvas;
  }

  // ---------- ПАЛИТРА ----------
  // body — свой окрас (купленный) → иначе цвет персонажа (гофер голубой,
  // мишка коричневый, зайка белый, ...) → иначе классический Go-голубой.
  get COLORS() {
    const ch = this.char || {};
    return {
      body: this.bodyColor || ch.body || '#7FDBE8',
      limb: ch.limb || '#F7D8A8',   // морда/лапы/ступни
      nose: ch.nose || '#3A2618',   // тёмно-коричневый нос
      line: '#1A1A1A',   // обводка
      tooth: '#FFFFFF',
      eyePupil: '#141414'
    };
  }

  // Силуэт тела: используется и для заливки, и для обрезки экипировки
  bodyPath(ctx, s) {
    roundRect(ctx, -s * 0.315, -s * 0.400, s * 0.63, s * 0.80, s * 0.235);
  }

  // ---------- ОБЩИЙ «ПУЛЬС» ФИГУРКИ ----------
  // Покачивание, мигание, таймеры, «z» во сне и искры при радости.
  // Вызывается всеми персонажами — и гофером, и другими игрушками.
  animate(x, y, s) {
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
    if (this.heldTimer > 0) {
      this.heldTimer--;
      if (this.heldTimer <= 0) this.heldEmoji = null;
    }
    if (this.shower > 0) this.shower--;

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

  }

  // ---------- АУРА: искры (excited) и «z» (sleeping) ----------
  drawAura(ctx, x, y, s) {
    if (this.sparks.length > 0) {
      this.sparks.forEach(sp => {
        ctx.globalAlpha = sp.alpha; ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    if (this.zzz.length > 0) {
      this.zzz.forEach(z => {
        ctx.globalAlpha = z.alpha; ctx.fillStyle = '#8FD8E8';
        ctx.font = `bold ${z.size}px Arial`; ctx.textAlign = 'center';
        ctx.fillText('z', z.x - x, z.y - y);
      });
      ctx.globalAlpha = 1;
    }
  }

  // ---------- ЭКИПИРОВКА (одинаковая для всех персонажей) ----------
  // Плавки/галстук/повязка обрезаются по силуэту своего тела.
  drawOutfit(ctx, s, lw) {
    // ============ ЭКИПИРОВКА (зависит от места) ============
    if (this.outfit === 'trunks') {
      // плавки: пояс + полоса, обрезанные по силуэту тела
      ctx.save(); this.bodyPath(ctx, s); ctx.clip();
      ctx.fillStyle = '#2D6BE0';
      ctx.fillRect(-s * 0.5, s * 0.155, s, s * 0.16);
      ctx.fillStyle = '#F2F2F2';
      ctx.fillRect(-s * 0.5, s * 0.155, s, s * 0.028);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(-s * 0.5, s * 0.265, s, s * 0.014);
      ctx.restore();
    } else if (this.outfit === 'tie') {
      // галстук: узел + полотнище
      const topY = s * 0.075;
      ctx.fillStyle = '#C0392B';
      ctx.beginPath();
      ctx.moveTo(-s * 0.028, topY);
      ctx.lineTo(s * 0.028, topY);
      ctx.lineTo(s * 0.020, topY + s * 0.045);
      ctx.lineTo(-s * 0.020, topY + s * 0.045);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.030, topY + s * 0.040);
      ctx.lineTo(s * 0.030, topY + s * 0.040);
      ctx.lineTo(s * 0.042, topY + s * 0.225);
      ctx.lineTo(0, topY + s * 0.275);
      ctx.lineTo(-s * 0.042, topY + s * 0.225);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = Math.max(0.8, lw * 0.5); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.moveTo(-s * 0.030, topY + s * 0.046);
      ctx.lineTo(-s * 0.008, topY + s * 0.046);
      ctx.lineTo(-s * 0.022, topY + s * 0.235);
      ctx.closePath(); ctx.fill();
    } else if (this.outfit === 'sporty') {
      // спортивная повязка на лбу (обрезана по силуэту головы)
      ctx.save(); this.bodyPath(ctx, s); ctx.clip();
      ctx.fillStyle = '#E74C3C';
      ctx.fillRect(-s * 0.5, -s * 0.400, s, s * 0.040);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(-s * 0.5, -s * 0.364, s, s * 0.009);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(0, -s * 0.382, s * 0.010, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

  }

  // ---------- АКСЕССУАРЫ: шляпы, очки, бабочка ----------
  drawAccessories(ctx, s, C, lw, eyeY, eyeSpacing, eyeR) {
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

  }

  draw(ctx, x, y, scale) {
    const s = this.size * (scale || 1);
    this.animate(x, y, s);

    const C = this.COLORS;
    const lw = Math.max(1.2, s * 0.011);

    ctx.save();
    ctx.translate(x, y + this.bobY);
    ctx.lineJoin = 'round';

    this.drawAura(ctx, x, y, s);

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
    this.bodyPath(ctx, s);
    ctx.fillStyle = C.body; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();

    this.drawOutfit(ctx, s, lw);

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

    // ============ ПРЕДМЕТ В ЛАПЕ ============
    if (this.heldEmoji) {
      const sway = Math.sin(this.animationTime * 5) * s * 0.012;
      ctx.font = `${s * 0.20}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.heldEmoji, s * 0.40 + sway, -s * 0.045);
    }

    // ============ ВОДА НАД ГОФЕРОМ (купание) ============
    if (this.shower > 0) {
      for (let i = 0; i < 16; i++) {
        const seed = i * 1.73;
        const phase = ((this.animationTime * 0.55 + seed) % 1);
        const dx = (((i * 37) % 11) / 10 - 0.5) * s * 0.62 + Math.sin(seed) * s * 0.02;
        const dy = -s * 0.62 + phase * s * 0.42;
        ctx.fillStyle = 'rgba(122,203,240,0.9)';
        ctx.beginPath();
        ctx.ellipse(dx, dy, s * 0.011, s * 0.030, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // брызги и пузырьки у тела
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 8; i++) {
        const seed = i * 2.1;
        const bx = Math.sin(this.animationTime * 0.8 + seed) * s * 0.30;
        const by = s * (0.10 + ((i % 5) * 0.055)) + Math.cos(seed) * s * 0.02;
        const br = s * (0.014 + ((i % 3) * 0.006));
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      }
      // лужа под гофером
      ctx.fillStyle = 'rgba(122,203,240,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.455, s * (0.30 + Math.sin(this.animationTime) * 0.02), s * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawAccessories(ctx, s, C, lw, eyeY, eyeSpacing, eyeR);

    ctx.restore();
  }

  setExpression(expr, duration) {
    this.expression = expr;
    this.expressionTimer = duration || 30;
  }

  getExpression() { return this.expression; }
}
window.Gopher = Gopher;
