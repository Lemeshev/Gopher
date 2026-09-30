// ============ ВОЗДУШНАЯ ГИМНАСТИКА (спортзал) ============
// Гофер качается на кольцах и перелетает на следующее.
// Игрок нажимает «Прыгнуть», когда указатель силы в зелёной зоне:
//   центр зоны (жёлтая) → точный перелёт (+12 монет)
//   зелёная зона        → хороший перелёт (+6 монет)
//   мимо                → гофер смешно повисает, но не падает (детская игра)
const AERIAL_CFG = {
  speed: 1.15,
  perfectFrom: 0.44, perfectTo: 0.56,
  goodFrom: 0.22, goodTo: 0.78
};

class AerialScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.init();
  }

  init() {
    this.time = 0;
    this.state = 'ready';       // ready | swing | summary
    this.power = 0;
    this.dir = 1;
    this.attemptsLeft = (typeof AERIAL !== 'undefined') ? AERIAL.attempts : 5;
    this.perfect = 0;
    this.good = 0;
    this.miss = 0;
    this.coinsWon = 0;
    this.flyT = 0;
    this.lastResult = '';
    this.paid = false;
  }

  // Тренировка тратит немного энергии (это же спорт)
  payEntry() {
    if (this.paid) return true;
    const cost = (typeof AERIAL !== 'undefined') ? AERIAL.energy : 5;
    if (System.stats.energy < cost + 2) {
      System.showAchievement('😴', '{Pet} {pet:устал|устала} — сначала поспи');
      return false;
    }
    System.spendEnergy(cost);
    this.paid = true;
    this.state = 'swing';
    AudioSys.play('click');
    return true;
  }

  update(dt) {
    this.time += dt;
    const sec = dt / 1000;
    if (this.state === 'swing') {
      this.power += this.dir * AERIAL_CFG.speed * sec;
      if (this.power >= 1) { this.power = 1; this.dir = -1; }
      if (this.power <= 0) { this.power = 0; this.dir = 1; }
    } else if (this.flyT > 0) {
      this.flyT = Math.max(0, this.flyT - sec * 1.4);
    }
  }

  // Оценка прыжка по положению указателя
  jump() {
    if (this.state !== 'swing') return false;
    const p = this.power;
    let coins = 0;
    if (p >= AERIAL_CFG.perfectFrom && p <= AERIAL_CFG.perfectTo) {
      coins = (typeof AERIAL !== 'undefined') ? AERIAL.perfectCoins : 12;
      this.perfect++;
      this.lastResult = 'Идеально! 🎯 +' + coins + ' 🪙';
    } else if (p >= AERIAL_CFG.goodFrom && p <= AERIAL_CFG.goodTo) {
      coins = (typeof AERIAL !== 'undefined') ? AERIAL.goodCoins : 6;
      this.good++;
      this.lastResult = 'Хороший перелёт! +' + coins + ' 🪙';
    } else {
      this.miss++;
      this.lastResult = 'Мимо — но {pet} держится крепко 😅';
    }

    this.coinsWon += coins;
    if (coins) { System.earnCoins(coins); System.relax(2); }
    System.stats.happiness = Math.min(100, System.stats.happiness + 3);
    System.addXP(4);

    this.attemptsLeft--;
    this.flyT = 1;
    this.state = this.attemptsLeft > 0 ? 'swing' : 'summary';
    AudioSys.play(coins ? 'success' : 'fail');
    return true;
  }

  finish() {
    const xp = (typeof AERIAL !== 'undefined') ? AERIAL.xp : 10;
    System.addXP(xp);
    System.saveGame();
    System.showAchievement('🎪', 'Тренировка окончена: +' + this.coinsWon + ' 🪙');
    this.game.transitionTo('map');
    return true;
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b1d4a');
    g.addColorStop(0.6, '#463066');
    g.addColorStop(1, '#241a38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Купол
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(W / 2, H * 1.15, W * (0.30 + i * 0.11), Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    // Прожекторы
    ctx.fillStyle = 'rgba(255,240,180,0.10)';
    [[0.16, 0.34, 0.02], [0.84, 0.66, 0.98]].forEach(p => {
      ctx.beginPath();
      ctx.moveTo(W * p[0], 0); ctx.lineTo(W * p[1], H * 0.7); ctx.lineTo(W * p[2], H * 0.7);
      ctx.closePath(); ctx.fill();
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`;
    ctx.fillText('🎪 Воздушная гимнастика', W / 2, H * 0.07);

    ctx.fillStyle = '#d9d2ff';
    ctx.font = `${Math.min(W * 0.028, 12.5)}px Arial`;
    ctx.fillText('Нажимай «Прыгнуть», когда указатель в зелёной зоне', W / 2, H * 0.115);

    // Кольца
    const ringY = H * 0.29;
    const leftX = W * 0.28, rightX = W * 0.72;
    this.drawRig(ctx, leftX, ringY, W * 0.10, '#FFD93D');
    this.drawRig(ctx, rightX, ringY, W * 0.10, '#9be3b0');

    // Гофер: качается и перелетает
    const t = this.flyT;
    const swing = Math.sin(this.time * 0.004) * (t > 0 ? 0 : W * 0.03);
    const gx = leftX + (rightX - leftX) * (1 - t) + swing * t;
    const gy = ringY + Math.sin((1 - t) * Math.PI) * -H * 0.10 + H * 0.05;

    const gopher = this.game.gopher;
    if (gopher) {
      gopher.outfit = 'sporty';
      gopher.heldEmoji = null;
      gopher.setExpression(this.state === 'summary' ? 'excited' : 'happy', 8);
      gopher.draw(ctx, gx, gy, (W * 0.19) / gopher.size);
      gopher.outfit = null;
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gx, gy + H * 0.10, W * 0.075, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    // Индикатор силы
    const barW = Math.min(W * 0.84, 340), barH = 24;
    const barX = (W - barW) / 2, barY = H * 0.54;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, barX, barY, barW, barH, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(107,203,119,0.35)';
    roundRect(ctx, barX + barW * AERIAL_CFG.goodFrom, barY, barW * (AERIAL_CFG.goodTo - AERIAL_CFG.goodFrom), barH, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,217,61,0.55)';
    roundRect(ctx, barX + barW * AERIAL_CFG.perfectFrom, barY, barW * (AERIAL_CFG.perfectTo - AERIAL_CFG.perfectFrom), barH, 6);
    ctx.fill();
    const markerX = barX + barW * this.power;
    ctx.fillStyle = '#fff';
    roundRect(ctx, markerX - 3, barY - 6, 6, barH + 12, 3);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.030, 13)}px Arial`;
    ctx.fillText('Точных: ' + this.perfect + '   Хороших: ' + this.good + '   Монет: ' + this.coinsWon,
      W / 2, H * 0.615);
    ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
    ctx.fillStyle = '#ffd9d9';
    ctx.fillText('Попыток: ' + this.attemptsLeft + '   Энергия: ' + Math.round(System.stats.energy) + '%',
      W / 2, H * 0.655);

    if (this.lastResult) {
      const bw = Math.min(W * 0.9, 330);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, (W - bw) / 2, H * 0.695, bw, 34, 10);
      ctx.fill();
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(W * 0.030, 13)}px Arial`;
      ctx.fillText(this.lastResult, W / 2, H * 0.695 + 17);
    }

    if (this.state === 'ready') {
      this.buttons.push(createButton(ctx, W * 0.2, H * 0.78, W * 0.6, 44, '🎪 Начать тренировку', {
        bgColor: '#9B59B6', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    } else if (this.state === 'swing') {
      this.buttons.push(createButton(ctx, W * 0.22, H * 0.78, W * 0.56, 46, '🤸 Прыгнуть!', {
        bgColor: '#6BCB77', fgColor: '#0d1024', fontSize: 17, radius: 12
      }));
    } else {
      this.buttons.push(createButton(ctx, W * 0.18, H * 0.78, W * 0.64, 44, '✅ Закончить тренировку', {
        bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    }

    this.buttons.push(createButton(ctx, 10, 10, 84, 32, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 9
    }));
    ctx.textBaseline = 'alphabetic';
  }

  // Снаряд: две верёвки и кольцо
  drawRig(ctx, x, y, r, color) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(x + dir * r * 0.8, 0);
      ctx.lineTo(x + dir * r * 0.8, y);
      ctx.stroke();
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
  }

  handleClick(mx, my) {
    const back = this.buttons[this.buttons.length - 1];
    if (back && back.text && back.text.indexOf('Назад') !== -1 &&
        isPointInRect(mx, my, back.x, back.y, back.w, back.h)) {
      AudioSys.play('click');
      System.saveGame();
      this.game.transitionTo('map');
      return true;
    }
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const t = btn.text || '';
      if (t.indexOf('Прыгнуть') !== -1) return this.jump();
      if (t.indexOf('Начать тренировку') !== -1) return this.payEntry();
      if (t.indexOf('Закончить') !== -1) return this.finish();
      return true;
    }
    return false;
  }
}
window.AerialScene = AerialScene;
