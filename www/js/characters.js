// ============ ПЕРСОНАЖИ ИГРЫ (задел на «любую детскую игрушку») ============
// Требование заказчика: главным героем может быть не только гофер, но и другая
// детская игрушка. Поэтому персонаж — это ОПИСАНИЕ (CHARACTERS), а не класс:
//   * 'gopher' — рисуется проверенным классическим рендером (js/gopher.js);
//   * остальные — параметрическим рендером ToyCharacter из этого файла.
// Добавить новую игрушку = дописать один объект в CHARACTERS, код сцен менять
// не нужно: сцены работают с game.gopher через общий интерфейс
// (draw, setExpression, hat, glasses, bowtie, outfit, heldEmoji, shower...).

// Кроме вида, у героя есть ИМЯ В ТЕКСТЕ: pet — формы имени для подстановки в
// подписи ({pet}, {pet_gen}, {pet_dat}, {pet_acc}, {pet_ins} — см. petFill в
// helpers.js), gender — род для согласования («нашёл» / «нашла»).
// Заказчик (v1.3.4): «Гофер должен быть только для гофера» — поэтому тексты берут
// слово отсюда, а не пишут «гофер» руками.
const CHARACTERS = [
  {
    id: 'gopher', name: 'Гофер', emoji: '🐹', toy: 'гофер',
    desc: 'Классический Go-маскот',
    gender: 'm',
    pet: { nom: 'гофер', gen: 'гофера', dat: 'гоферу', acc: 'гофера', ins: 'гофером' },
    body: '#7FDBE8', limb: '#F7D8A8', nose: '#3A2618',
    ears: { style: 'gopher' }, tail: 'none', muzzle: true, teeth: 'incisors',
    shape: 'capsule',
    // Голос: у каждого героя свой тембр (AudioSys.voice)
    voice: { base: 660, type: 'sine', steps: [1, 1.5], dur: 0.12, bend: 1.10 }
  },
  {
    id: 'bear', name: 'Мишка', emoji: '🐻', toy: 'мишка',
    desc: 'Мягкий и уютный',
    gender: 'm',
    pet: { nom: 'мишка', gen: 'мишки', dat: 'мишке', acc: 'мишку', ins: 'мишкой' },
    body: '#C9A06A', limb: '#EFDCC0', nose: '#4A2E1E',
    ears: { style: 'round', r: 0.105, spread: 0.255, dy: -0.345, inner: '#EFDCC0' },
    tail: 'puff', belly: '#E7D3B4', muzzle: true, teeth: 'none', shape: 'oval',
    voice: { base: 240, type: 'triangle', steps: [1, 1.26], dur: 0.20, bend: 0.97 }
  },
  {
    id: 'bunny', name: 'Зайка', emoji: '🐰', toy: 'зайка',
    desc: 'Прыгает выше всех',
    gender: 'm',
    pet: { nom: 'зайка', gen: 'зайки', dat: 'зайке', acc: 'зайку', ins: 'зайкой' },
    body: '#EFE6E0', limb: '#FFFBF6', nose: '#F095A5',
    ears: { style: 'long', w: 0.082, h: 0.30, spread: 0.135, dy: -0.415, inner: '#FADCE2' },
    tail: 'puff', belly: '#FFFBF6', muzzle: true, teeth: 'incisors', shape: 'oval',
    voice: { base: 820, type: 'sine', steps: [1, 1.33, 1.5], dur: 0.10, bend: 1.15 }
  },
  {
    id: 'cat', name: 'Котёнок', emoji: '🐱', toy: 'котёнок',
    desc: 'Мурчит и играет',
    gender: 'm',
    pet: { nom: 'котёнок', gen: 'котёнка', dat: 'котёнку', acc: 'котёнка', ins: 'котёнком' },
    body: '#F0B27A', limb: '#FDF2E3', nose: '#D9736F',
    ears: { style: 'pointy', w: 0.115, h: 0.145, spread: 0.175, dy: -0.375, inner: '#FAD9C6' },
    tail: 'thin', belly: '#FDF2E3', muzzle: true, teeth: 'fangs', whiskers: true, shape: 'oval',
    voice: { base: 540, type: 'triangle', steps: [1, 1.18], dur: 0.30, bend: 1.45 }
  },
  {
    id: 'robot', name: 'Робот', emoji: '🤖', toy: 'робот',
    desc: 'Пикает и мигает огоньками',
    gender: 'm',
    pet: { nom: 'робот', gen: 'робота', dat: 'роботу', acc: 'робота', ins: 'роботом' },
    body: '#B8C6D9', limb: '#DCE6F2', nose: '#33475C',
    ears: { style: 'antenna', spread: 0.16, dy: -0.40, ball: '#FF6B6B' },
    tail: 'none', muzzle: false, teeth: 'none', shape: 'capsule', visor: true, antenna: true,
    voice: { base: 320, type: 'square', steps: [1, 1.5, 1.5], dur: 0.09, bend: 1.00 }
  },
  {
    // Милка — плюшевая игрушка заказчика: белая, с длинными ушами и зелёной
    // подкладкой, зелёными вышитыми глазами, румянцем, крылышками с зелёными
    // подушечками и розовыми подушечками на лапах.
    id: 'milka', name: 'Милка', emoji: '🐇', toy: 'плюшевая милка',
    desc: 'Белая, зелёные ушки',
    // Милка — имя (пишется с большой буквы всегда) и она девочка: тексты
    // согласуются («выспалась», «нашла»), поэтому gender: 'f'
    gender: 'f',
    pet: { nom: 'Милка', gen: 'Милки', dat: 'Милке', acc: 'Милку', ins: 'Милкой' },
    body: '#FFFFFF', limb: '#FFFFFF', nose: '#F09BA8',
    ears: { style: 'long', w: 0.100, h: 0.320, spread: 0.108, dy: -0.418, tilt: 0.20, inner: '#2BB24C' },
    tail: 'plush', belly: '#F3EFE6', muzzle: false, teeth: 'none', shape: 'oval',
    eyeStyle: 'oval', eyeColor: '#2E8B57', cheeks: '#F7B7C4',
    mouth: '#E8637A', noseScale: 0.55, tuft: true,
    wings: { spread: 0.455, dy: 0.055, rx: 0.138, ry: 0.082, tilt: 0.30, pad: '#2FA84F' },
    pads: '#F58CA0',
    voice: { base: 700, type: 'sine', steps: [1, 1.25, 1.5], dur: 0.16, bend: 1.05 },
    // У Милки длинные уши — шапка садится чуть ниже и уже, иначе спорит с ушами
    hat: { shift: 0.018, scale: 0.92 }
  }
];

function findCharacter(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}

function characterList() { return CHARACTERS.slice(); }

function randomCharacterId() {
  return CHARACTERS[randInt(0, CHARACTERS.length - 1)].id;
}

// Фигурка нужного персонажа с общим интерфейсом для всех сцен
function createCharacter(id, size) {
  const cid = findCharacter(id).id;
  const s = size || 100;
  if (cid === 'gopher') return new Gopher(null, s, 'gopher');
  return new ToyCharacter(null, s, cid);
}

// ---------- ПАРАМЕТРИЧЕСКАЯ ИГРУШКА ----------
// Рисует мишку/зайку/котёнка/робота по описанию: уши, хвост, морда, живот,
// зубы, усы. Всё общее (анимация, экипировка, аксессуары) — из класса Gopher.
class ToyCharacter extends Gopher {
  bodyPath(ctx, s) {
    const ch = this.char || {};
    const r = ch.shape === 'capsule' ? s * 0.28 : s * 0.245;
    roundRect(ctx, -s * 0.31, -s * 0.400, s * 0.62, s * 0.80, r);
  }

  draw(ctx, x, y, scale) {
    const s = this.size * (scale || 1);
    this.animate(x, y, s);
    const C = this.COLORS;
    const ch = this.char || {};
    const lw = Math.max(1.2, s * 0.011);

    ctx.save();
    ctx.translate(x, y + this.bobY);
    ctx.lineJoin = 'round';
    this.drawAura(ctx, x, y, s);

    this.drawTail(ctx, s, C, lw);
    this.drawWings(ctx, s, C, lw);      // крылышки (Милка) — за телом
    this.drawBackItems(ctx, s, C, lw);  // рюкзак и плащ — тоже за телом
    this.drawEars(ctx, s, C, lw);
    this.drawTuft(ctx, s, C, lw);       // хохолок между ушами
    this.drawFeet(ctx, s, C, lw);
    this.drawFootPads(ctx, s, C, lw);   // розовые подушечки на ступнях
    this.drawArms(ctx, s, C, lw);
    this.drawHandPads(ctx, s, C, lw);   // и на ладошках

    // Тело
    this.bodyPath(ctx, s);
    ctx.fillStyle = C.body; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();

    // Живот (мягкая грудка)
    if (ch.belly) {
      ctx.save(); this.bodyPath(ctx, s); ctx.clip();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.13, s * 0.20, s * 0.235, 0, 0, Math.PI * 2);
      ctx.fillStyle = ch.belly; ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    this.drawOutfit(ctx, s, lw);
    this.drawFace(ctx, s, C, lw, ch);
    this.drawHeld(ctx, s);
    this.drawWaterFX(ctx, s);
    this.drawAccessories(ctx, s, C, lw, -s * 0.272, s * 0.097, s * 0.098);

    ctx.restore();
  }

  // ---------- ХВОСТ ----------
  drawTail(ctx, s, C, lw) {
    const style = (this.char && this.char.tail) || 'none';
    if (style === 'none') return;
    if (style === 'puff') {
      ctx.beginPath(); ctx.arc(-s * 0.300, s * 0.295, s * 0.098, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      return;
    }
    if (style === 'plush') {
      // Пушистый мягкий хвост (Милка): толстый, с обводкой и «мехом».
      // Ведём его вниз-влево, чтобы он не спорил с крылышком.
      const p0 = { x: -s * 0.24, y: s * 0.34 };
      const p1 = { x: -s * 0.54, y: s * 0.46 };
      const p2 = { x: -s * 0.46, y: s * 0.20 };
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(3, s * 0.098); ctx.stroke();
      ctx.strokeStyle = C.body; ctx.lineWidth = Math.max(2, s * 0.080); ctx.stroke();
      ctx.lineCap = 'butt';
      return;
    }
    ctx.beginPath();
    ctx.moveTo(-s * 0.27, s * 0.30);
    ctx.quadraticCurveTo(-s * 0.50, s * 0.22, -s * 0.44, -s * 0.02);
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.body; ctx.lineWidth = Math.max(2, s * 0.035); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = Math.max(0.8, lw * 0.5); ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // ---------- УШИ (по описанию персонажа) ----------
  drawEars(ctx, s, C, lw) {
    const e = (this.char && this.char.ears) || {};
    const style = e.style || 'round';
    const paint = (fill) => {
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
    };

    if (style === 'round') {
      [1, -1].forEach(dir => {
        ctx.beginPath();
        ctx.arc(dir * s * e.spread, s * e.dy, s * e.r, 0, Math.PI * 2);
        paint(C.body);
        if (e.inner) {
          ctx.beginPath();
          ctx.arc(dir * s * e.spread, s * e.dy, s * e.r * 0.55, 0, Math.PI * 2);
          paint(e.inner);
        }
      });
    } else if (style === 'long') {
      // tilt — наклон ушей в стороны (у игрушек бывает больше, чем у зайки)
      const tilt = (e.tilt === undefined) ? 0.15 : e.tilt;
      [-1, 1].forEach(dir => {
        ctx.save();
        ctx.translate(dir * s * e.spread, s * e.dy);
        ctx.rotate(dir * tilt);
        roundRect(ctx, -s * e.w / 2, -s * e.h, s * e.w, s * e.h, s * e.w * 0.5);
        paint(C.body);
        roundRect(ctx, -s * e.w * 0.26, -s * e.h * 0.84, s * e.w * 0.52, s * e.h * 0.70, s * e.w * 0.28);
        paint(e.inner || C.limb);
        ctx.restore();
      });
    } else if (style === 'pointy') {
      [1, -1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(dir * s * (e.spread - e.w * 0.6), s * (e.dy + e.h * 0.55));
        ctx.lineTo(dir * s * e.spread, s * (e.dy - e.h));
        ctx.lineTo(dir * s * (e.spread + e.w * 0.6), s * (e.dy + e.h * 0.55));
        ctx.closePath(); paint(C.body);
        ctx.beginPath();
        ctx.moveTo(dir * s * (e.spread - e.w * 0.26), s * (e.dy + e.h * 0.28));
        ctx.lineTo(dir * s * e.spread, s * (e.dy - e.h * 0.55));
        ctx.lineTo(dir * s * (e.spread + e.w * 0.26), s * (e.dy + e.h * 0.28));
        ctx.closePath(); paint(e.inner || C.limb);
      });
    } else if (style === 'antenna') {
      [1, -1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(dir * s * (e.spread * 0.72), s * (e.dy + 0.06));
        ctx.lineTo(dir * s * e.spread, s * e.dy);
        ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(1.5, s * 0.016); ctx.stroke();
        ctx.beginPath();
        ctx.arc(dir * s * e.spread, s * (e.dy - 0.025), s * 0.030, 0, Math.PI * 2);
        ctx.fillStyle = e.ball || '#FF6B6B'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      });
    }
  }

  // ---------- СТУПНИ И ЛАПЫ ----------
  drawFeet(ctx, s, C, lw) {
    const footR = this.legAnim * 0.25;
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.235, s * 0.408);
      ctx.rotate(dir * (0.18 + footR));
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.078, s * 0.058, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      ctx.restore();
    });
  }

  drawArms(ctx, s, C, lw) {
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.335, s * 0.03);
      ctx.rotate(dir * (0.16 + this.armAngle));
      if (this.expression === 'excited') ctx.rotate(dir * 0.26);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.058, s * 0.036, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      ctx.beginPath();
      ctx.arc(dir * s * 0.048, s * 0.004, s * 0.038, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      ctx.restore();
    });
  }
  // ---------- ЛИЦО: глаза, морда, нос, рот, усы ----------
  // ---------- ЛИЦО ИГРУШКИ ----------
  // Разные игрушки «вышиты» по-разному: у большинства — глазки-бусины,
  // у Милки — крупные зелёные вышитые глаза (eyeStyle: 'oval').
  drawFace(ctx, s, C, lw, ch) {
    if (ch.eyeStyle === 'oval') return this.drawFaceOval(ctx, s, C, lw, ch);
    const r = this.drawFaceBeads(ctx, s, C, lw, ch);
    this.drawCheeks(ctx, s, ch);
    return r;
  }

  drawFaceBeads(ctx, s, C, lw, ch) {
    const eyeY = -s * 0.272;
    const eyeSpacing = s * 0.097;
    const eyeR = s * 0.098;
    const pupilR = eyeR * 0.43;

    [1, -1].forEach(dir => {
      const ex = dir * eyeSpacing;

      // Робот: тёмный «козырёк» вместо глаз, внутри — огоньки
      if (ch.visor) {
        if (dir === 1) {
          ctx.fillStyle = '#1d2733';
          roundRect(ctx, -s * 0.25, eyeY - s * 0.078, s * 0.50, s * 0.16, s * 0.045);
          ctx.fill();
          ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
        }
        const closed = this.expression === 'sleeping' || this.blinking;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * (closed ? 0.16 : 0.30), 0, Math.PI * 2);
        ctx.fillStyle = (this.expression === 'sad' || this.expression === 'sick') ? '#FFA94D' : '#63E6FF';
        ctx.fill();
        return;
      }

      if (this.expression === 'sleeping') {
        ctx.strokeStyle = C.line; ctx.lineWidth = lw * 1.3; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ex, eyeY - eyeR * 0.30, eyeR * 0.70, Math.PI * 0.18, Math.PI * 0.82);
        ctx.stroke();
        ctx.lineCap = 'butt';
        return;
      }
      if (this.blinking) {
        ctx.strokeStyle = C.line; ctx.lineWidth = lw * 1.3; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - eyeR * 0.62, eyeY - eyeR * 0.06);
        ctx.quadraticCurveTo(ex, eyeY + eyeR * 0.18, ex + eyeR * 0.62, eyeY - eyeR * 0.06);
        ctx.stroke();
        ctx.lineCap = 'butt';
        return;
      }

      ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();

      if (this.expression === 'sad' || this.expression === 'sick') {
        const inX = ex - dir * eyeR, outX = ex + dir * eyeR;
        const inY = eyeY - eyeR * 0.12, outY = eyeY + eyeR * 0.18;
        ctx.save();
        ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath();
        ctx.arc(ex + dir * eyeR * 0.08, eyeY + eyeR * 0.40, pupilR * 0.86, 0, Math.PI * 2);
        ctx.fillStyle = C.eyePupil; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(inX, eyeY - eyeR); ctx.lineTo(inX, inY);
        ctx.lineTo(outX, outY); ctx.lineTo(outX, eyeY - eyeR);
        ctx.closePath();
        ctx.fillStyle = C.body; ctx.fill();
        ctx.restore();
        ctx.strokeStyle = C.line; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(inX, inY); ctx.lineTo(outX, outY); ctx.stroke();
      } else {
        const pr = (this.expression === 'excited') ? pupilR * 1.18 : pupilR;
        const px = ex - dir * eyeR * 0.10;
        const py = eyeY + eyeR * 0.13;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = C.eyePupil; ctx.fill();
        ctx.beginPath(); ctx.arc(px + pr * 0.34, py - pr * 0.36, pr * 0.30, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF'; ctx.fill();
      }
    });
    this.drawMuzzle(ctx, s, C, lw, ch);
  }

  // ---------- МОРДА, НОС, РОТ, ЗУБЫ, УСЫ ----------
  drawMuzzle(ctx, s, C, lw, ch) {
    if (ch.muzzle) {
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.168, s * 0.106, s * 0.057, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.limb; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
    }
    // Нос. У плюшевых игрушек он бывает совсем маленьким (noseScale)
    const ns = ch.noseScale || 1;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.198, s * 0.049 * ns, s * 0.033 * ns, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.nose; ctx.fill();
    if (ns > 0.6) {
      ctx.beginPath();
      ctx.ellipse(-s * 0.011 * ns, -s * 0.207, s * 0.022 * ns, s * 0.009 * ns, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
    }

    const toothW = s * 0.040, toothH = s * 0.062, toothTop = -s * 0.152, toothGap = s * 0.022;
    const teeth = ch.teeth || 'none';

    if (this.expression === 'eating') {
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.150, s * 0.052, s * 0.036, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7A2230'; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      if (teeth !== 'none') {
        ctx.fillStyle = C.tooth; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.7;
        [-1, 1].forEach(dir => {
          roundRect(ctx, dir * toothGap - toothW / 2, toothTop - s * 0.012, toothW, toothH * 0.62, s * 0.010);
          ctx.fill(); ctx.stroke();
        });
      }
    } else if (this.expression === 'sad' || this.expression === 'sick') {
      ctx.strokeStyle = C.line; ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-s * 0.048, -s * 0.140);
      ctx.quadraticCurveTo(0, -s * 0.108, s * 0.048, -s * 0.140);
      ctx.stroke();
    } else if (this.expression === 'sleeping') {
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.145, s * 0.024, s * 0.016, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.nose; ctx.fill();
    } else if (teeth === 'incisors') {
      ctx.fillStyle = C.tooth; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.7;
      [-1, 1].forEach(dir => {
        roundRect(ctx, dir * toothGap - toothW / 2, toothTop, toothW, toothH, s * 0.010);
        ctx.fill(); ctx.stroke();
      });
    } else if (teeth === 'fangs') {
      ctx.fillStyle = C.tooth; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.7;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(dir * s * 0.030, -s * 0.142);
        ctx.lineTo(dir * s * 0.046, -s * 0.142);
        ctx.lineTo(dir * s * 0.038, -s * 0.108);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    } else {
      // Рот-улыбка. У плюшевых игрушек он своего цвета (Милка — розовый)
      ctx.strokeStyle = ch.mouth || C.line; ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-s * 0.040, -s * 0.132);
      ctx.quadraticCurveTo(0, -s * 0.095, s * 0.040, -s * 0.132);
      ctx.stroke();
    }

    // Усы (котёнок)
    if (ch.whiskers) {
      ctx.strokeStyle = 'rgba(60,40,30,0.6)'; ctx.lineWidth = Math.max(0.9, lw * 0.7);
      [-1, 1].forEach(dir => {
        [0, 1, 2].forEach(i => {
          ctx.beginPath();
          ctx.moveTo(dir * s * 0.078, -s * (0.178 + i * 0.014));
          ctx.lineTo(dir * s * 0.245, -s * (0.186 + i * 0.022));
          ctx.stroke();
        });
      });
    }

    // Капля пота при болезни
    if (this.expression === 'sick') {
      ctx.fillStyle = '#8FD8F5';
      ctx.beginPath();
      ctx.moveTo(s * 0.235, -s * 0.30);
      ctx.quadraticCurveTo(s * 0.265, -s * 0.235, s * 0.235, -s * 0.195);
      ctx.quadraticCurveTo(s * 0.195, -s * 0.235, s * 0.235, -s * 0.30);
      ctx.fill();
    }
  }

  // ---------- КРЫЛЫШКИ (Милка) ----------
  // У плюшевой Милки по бокам мягкие крылышки, а на них — зелёные подушечки
  // (как на фотографии игрушки, по которой рисовался герой).
  drawWings(ctx, s, C, lw) {
    const w = (this.char && this.char.wings) || null;
    if (!w) return;
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * w.spread, s * w.dy);
      ctx.rotate(dir * w.tilt);

      ctx.beginPath();
      ctx.ellipse(0, 0, s * w.rx, s * w.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.body; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();

      // пушистый край: мягкие «пёрышки» по верхнему краю крыла
      [0.24, 0.52, 0.80].forEach((t, i) => {
        ctx.beginPath();
        ctx.arc(dir * s * w.rx * t, -s * w.ry * (0.62 - i * 0.05), s * 0.023, 0, Math.PI * 2);
        ctx.fillStyle = C.body; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.85; ctx.stroke();
      });

      // зелёная подушечка на крыле — как на фотографии игрушки
      if (w.pad) {
        ctx.fillStyle = w.pad;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = Math.max(0.6, lw * 0.5);
        ctx.beginPath();
        ctx.ellipse(dir * s * w.rx * 0.46, s * w.ry * 0.22, s * 0.034, s * 0.026, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        [-1, 0, 1].forEach(k => {
          ctx.beginPath();
          ctx.arc(dir * s * w.rx * 0.46 + k * s * 0.024, -s * 0.012, s * 0.011, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        });
      }
      ctx.restore();
    });
  }

  // ---------- ХОХОЛОК МЕЖДУ УШАМИ ----------
  drawTuft(ctx, s, C, lw) {
    if (!(this.char && this.char.tuft)) return;
    ctx.fillStyle = C.body; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.8;
    [[-0.048, -0.398, 0.030], [0, -0.424, 0.034], [0.048, -0.398, 0.030]].forEach(b => {
      ctx.beginPath();
      ctx.arc(s * b[0], s * b[1], s * b[2], 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });
  }

  // ---------- ПОДУШЕЧКИ НА ЛАПАХ ----------
  pawPad(ctx, s, lw, spread) {
    const ch = this.char || {};
    ctx.fillStyle = ch.pads;
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = Math.max(0.6, lw * 0.45);
    if (spread) {
      // ступня: большая подушечка и три «пальчика»
      ctx.beginPath();
      ctx.ellipse(0, s * 0.004, s * 0.030, s * 0.022, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      [-1, 0, 1].forEach(k => {
        ctx.beginPath();
        ctx.arc(k * s * 0.024, -s * 0.026, s * 0.011, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.020, s * 0.016, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
  }

  drawFootPads(ctx, s, C, lw) {
    if (!(this.char && this.char.pads)) return;
    const footR = this.legAnim * 0.25;
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.235, s * 0.408);
      ctx.rotate(dir * (0.18 + footR));
      this.pawPad(ctx, s, lw, true);
      ctx.restore();
    });
  }

  drawHandPads(ctx, s, C, lw) {
    if (!(this.char && this.char.pads)) return;
    [1, -1].forEach(dir => {
      ctx.save();
      ctx.translate(dir * s * 0.335, s * 0.03);
      ctx.rotate(dir * (0.16 + this.armAngle));
      if (this.expression === 'excited') ctx.rotate(dir * 0.26);
      ctx.translate(dir * s * 0.048, s * 0.004);
      this.pawPad(ctx, s, lw, false);
      ctx.restore();
    });
  }

  // ---------- ВЫШИТЫЕ ГЛАЗА И РУМЯНЕЦ (Милка) ----------
  drawFaceOval(ctx, s, C, lw, ch) {
    const eyeY = -s * 0.272, eyeSpacing = s * 0.097, eyeR = s * 0.098;
    const eyeCol = ch.eyeColor || '#2E8B57';
    [1, -1].forEach(dir => {
      const ex = dir * eyeSpacing;
      if (this.expression === 'sleeping' || this.blinking) {
        ctx.strokeStyle = C.line; ctx.lineWidth = lw * 1.3; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ex, eyeY - eyeR * 0.30, eyeR * 0.70, Math.PI * 0.18, Math.PI * 0.82);
        ctx.stroke();
        ctx.lineCap = 'butt';
        return;
      }
      // круглый зелёный глаз с бликом — как вышито на игрушке
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeR * 0.74, eyeR * 1.02, 0, 0, Math.PI * 2);
      ctx.fillStyle = eyeCol; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(ex - dir * eyeR * 0.20, eyeY - eyeR * 0.34, eyeR * 0.15, eyeR * 0.20, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
      if (this.expression === 'sad' || this.expression === 'sick') {
        ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.9;
        ctx.beginPath();
        ctx.moveTo(ex - dir * eyeR * 0.80, eyeY - eyeR * 1.25);
        ctx.lineTo(ex + dir * eyeR * 0.50, eyeY - eyeR * 1.05);
        ctx.stroke();
      }
    });
    this.drawMuzzle(ctx, s, C, lw, ch);
    this.drawCheeks(ctx, s, ch);
  }

  drawCheeks(ctx, s, ch) {
    if (!ch.cheeks) return;
    ctx.fillStyle = ch.cheeks;
    ctx.globalAlpha = 0.65;
    [1, -1].forEach(dir => {
      ctx.beginPath();
      ctx.ellipse(dir * s * 0.215, -s * 0.175, s * 0.052, s * 0.032, dir * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ---------- ПРЕДМЕТ В ЛАПЕ ----------
  drawHeld(ctx, s) {
    if (!this.heldEmoji) return;
    const sway = Math.sin(this.animationTime * 5) * s * 0.012;
    ctx.font = `${s * 0.20}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.heldEmoji, s * 0.40 + sway, -s * 0.045);
  }

  // ---------- ВОДА НАД ИГРУШКОЙ (купание) ----------
  drawWaterFX(ctx, s) {
    if (!(this.shower > 0)) return;
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
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 8; i++) {
      const seed = i * 2.1;
      const bx = Math.sin(this.animationTime * 0.8 + seed) * s * 0.30;
      const by = s * (0.10 + ((i % 5) * 0.055)) + Math.cos(seed) * s * 0.02;
      ctx.beginPath(); ctx.arc(bx, by, s * (0.014 + ((i % 3) * 0.006)), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(122,203,240,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.455, s * (0.30 + Math.sin(this.animationTime) * 0.02), s * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();
  }

}
window.CHARACTERS = CHARACTERS;
window.findCharacter = findCharacter;
window.characterList = characterList;
window.randomCharacterId = randomCharacterId;
window.createCharacter = createCharacter;
window.ToyCharacter = ToyCharacter;
