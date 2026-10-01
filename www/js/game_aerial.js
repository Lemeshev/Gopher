// ============ СПОРТИВНЫЕ ТРЕНИРОВКИ (спортзал, бассейн, парк) ============
// Раньше анимирована была только воздушная гимнастика на кольцах. Теперь у сцены
// четыре дисциплины с одной честной механикой: игрок жмёт кнопку, когда указатель
// силы в зелёной зоне (центр — точное попадание). А вот на экране каждый снаряд
// анимирован по-своему, и гофер ведёт себя как настоящий спортсмен:
//   🤸 кольца  — качается и перелетает на следующее кольцо;
//   🎀 полотна — взбирается по полотнам, крутит оборот и замирает в позе;
//   🏊 заплыв  — плывёт по дорожке и делает поворот у борта;
//   🏃 барьеры — бежит по дорожке и перепрыгивает барьер.
// Указатель у всех дисциплин одинаковый, поэтому ребёнку понятно: правило одно.
const AERIAL_CFG = {
  speed: 1.15,
  perfectFrom: 0.44, perfectTo: 0.56,
  goodFrom: 0.22, goodTo: 0.78
};

// Список дисциплин. place — где дисциплина доступна: спортзал / бассейн / парк.
const SPORT_DISCIPLINES = {
  rings: {
    id: 'rings', emoji: '🤸', place: 'gym', sceneEmoji: '🎪',
    title: '🎪 Воздушная гимнастика: кольца',
    hint: 'Жми «Прыгнуть», когда указатель в зелёной зоне',
    start: '🎪 Начать тренировку', action: '🤸 Прыгнуть!', finish: '✅ Закончить тренировку',
    energy: 5, attempts: 5, perfectCoins: 12, goodCoins: 6, xp: 10,
    sky: ['#2b1d4a', '#463066', '#241a38'], accent: '#9B59B6',
    perfectText: 'Идеальный перелёт! 🎯', goodText: 'Хороший перелёт!', missText: 'Мимо — но {pet} держится крепко 😅'
  },
  silks: {
    id: 'silks', emoji: '🎀', place: 'gym', sceneEmoji: '🎀',
    title: '🎀 Воздушная гимнастика: полотна',
    hint: 'Жми «Крутить оборот», когда указатель в зелёной зоне',
    start: '🎀 Начать тренировку', action: '🎀 Крутить оборот!', finish: '✅ Закончить тренировку',
    energy: 5, attempts: 5, perfectCoins: 12, goodCoins: 6, xp: 10,
    sky: ['#3a1d3f', '#5d3160', '#2a1430'], accent: '#E91E9C',
    perfectText: 'Чистый оборот! 🎯', goodText: 'Хороший оборот!', missText: 'Полотна качнулись — {pet} удержался(ась) 😅'
  },
  swim: {
    id: 'swim', emoji: '🏊', place: 'pool', sceneEmoji: '🏊',
    title: '🏊 Заплыв в бассейне',
    hint: 'Жми «Поворот», когда указатель в зелёной зоне',
    start: '🏊 Начать заплыв', action: '🏊 Поворот!', finish: '✅ Закончить заплыв',
    energy: 5, attempts: 5, perfectCoins: 12, goodCoins: 6, xp: 10,
    sky: ['#08263c', '#12556f', '#06202f'], accent: '#00BCD4',
    perfectText: 'Точный поворот! 🎯', goodText: 'Хороший поворот!', missText: 'Волна накрыла — {pet} {pet:выплыл|выплыла} 😅'
  },
  hurdles: {
    id: 'hurdles', emoji: '🏃', place: 'park', sceneEmoji: '🏃',
    title: '🏃 Спринт с барьерами',
    hint: 'Жми «Прыжок», когда указатель в зелёной зоне',
    start: '🏃 Начать забег', action: '🏃 Прыжок!', finish: '✅ Закончить забег',
    energy: 5, attempts: 5, perfectCoins: 12, goodCoins: 6, xp: 10,
    sky: ['#123a1c', '#2c7038', '#0d2a14'], accent: '#2ECC71',
    perfectText: 'Чистый прыжок! 🎯', goodText: 'Барьер взят!', missText: 'Задел барьер, но {pet} {pet:устоял|устояла} 😅'
  }
};

// Какие тренировки доступны в этой локации (нужно сцене посещения)
function sportListFor(place) {
  return Object.keys(SPORT_DISCIPLINES)
    .map(k => SPORT_DISCIPLINES[k])
    .filter(d => d.place === place);
}

class SportScene {
  constructor(game, disciplineId) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    // Без параметра сцена работает как раньше — кольца в спортзале
    this.disc = SPORT_DISCIPLINES[disciplineId] || SPORT_DISCIPLINES.rings;
    this.init(disciplineId);
  }

  init(disciplineId) {
    // Дисциплина приходит параметром перехода: transitionTo('sport', 'silks').
    // Сцены создаются один раз при старте игры, поэтому выбор снаряда живёт
    // именно здесь, а не в конструкторе. Без параметра — кольца, как раньше.
    this.disc = SPORT_DISCIPLINES[disciplineId] || SPORT_DISCIPLINES.rings;
    this.time = 0;
    this.state = 'ready';       // ready | swing | summary
    this.power = 0;
    this.dir = 1;
    this.attemptsLeft = this.disc.attempts;
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
    const cost = this.disc.energy;
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

  // Оценка движения по положению указателя. Правило общее для всех дисциплин,
  // меняются только слова и награда: кольца, полотна, заплыв, барьеры.
  jump() {
    if (this.state !== 'swing') return false;
    const d = this.disc;
    const p = this.power;
    let coins = 0;
    let text = d.missText;
    if (p >= AERIAL_CFG.perfectFrom && p <= AERIAL_CFG.perfectTo) {
      coins = d.perfectCoins;
      this.perfect++;
      text = d.perfectText;
    } else if (p >= AERIAL_CFG.goodFrom && p <= AERIAL_CFG.goodTo) {
      coins = d.goodCoins;
      this.good++;
      text = d.goodText;
    } else {
      this.miss++;
    }

    // Имя героя подставляем сразу: раньше в подсказке оставалось «{pet}»
    const shown = (typeof petFill === 'function') ? petFill(text) : text;
    this.lastResult = shown + (coins ? '  +' + coins + ' 🪙' : '');

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

  // Закончили: возвращаемся туда, откуда пришли (спортзал, бассейн или парк),
  // чтобы можно было сразу выбрать другую тренировку
  finish() {
    System.addXP(this.disc.xp);
    System.saveGame();
    System.showAchievement(this.disc.sceneEmoji, 'Тренировка окончена: +' + this.coinsWon + ' 🪙');
    this.game.transitionTo('visit', this.disc.place);
    return true;
  }

  goBack() {
    System.saveGame();
    this.game.transitionTo('visit', this.disc.place);
    return true;
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;

    // Зал, бассейн или дорожка — фон свой у каждой дисциплины
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, this.disc.sky[0]);
    g.addColorStop(0.6, this.disc.sky[1]);
    g.addColorStop(1, this.disc.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.045, 21)}px Arial`;
    ctx.fillText(this.disc.title, W / 2, H * 0.07);

    ctx.fillStyle = '#d9d2ff';
    ctx.font = `${Math.min(W * 0.028, 12.5)}px Arial`;
    ctx.fillText(this.disc.hint, W / 2, H * 0.115);

    // Снаряд, дорожка или барьер + сам гофер: у каждой дисциплины своя анимация
    this.drawStage(ctx, W, H);

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
      this.buttons.push(createButton(ctx, W * 0.2, H * 0.78, W * 0.6, 44, this.disc.start, {
        bgColor: this.disc.accent, fgColor: '#fff', fontSize: 15, radius: 12
      }));
    } else if (this.state === 'swing') {
      this.buttons.push(createButton(ctx, W * 0.22, H * 0.78, W * 0.56, 46, this.disc.action, {
        bgColor: '#6BCB77', fgColor: '#0d1024', fontSize: 17, radius: 12
      }));
    } else {
      this.buttons.push(createButton(ctx, W * 0.18, H * 0.78, W * 0.64, 44, this.disc.finish, {
        bgColor: '#4D96FF', fgColor: '#fff', fontSize: 15, radius: 12
      }));
    }

    this.buttons.push(createButton(ctx, 10, 10, 84, 32, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 9
    }));
    ctx.textBaseline = 'alphabetic';
  }

  // ----- Гофер в спортивной форме: поза и наклон зависят от движения -----
  drawGopherAt(ctx, x, y, size, rot) {
    const gopher = this.game.gopher;
    if (!gopher) return;
    ctx.save();
    if (rot) {
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.translate(-x, -y);
    }
    gopher.outfit = 'sporty';
    gopher.heldEmoji = null;
    gopher.setExpression(this.state === 'summary' ? 'excited' : 'happy', 8);
    gopher.draw(ctx, x, y, size / gopher.size);
    gopher.outfit = null;
    ctx.restore();
  }

  // Какой снаряд рисуем — зависит от дисциплины
  drawStage(ctx, W, H) {
    switch (this.disc.id) {
      case 'silks': return this.drawSilks(ctx, W, H);
      case 'swim': return this.drawSwim(ctx, W, H);
      case 'hurdles': return this.drawHurdles(ctx, W, H);
      default: return this.drawRings(ctx, W, H);
    }
  }

  // ----- 🤸 Кольца: качаемся и перелетаем на следующее -----
  drawRings(ctx, W, H) {
    // Купол и прожекторы — мы в спортивном зале
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(W / 2, H * 1.15, W * (0.30 + i * 0.11), Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,240,180,0.10)';
    [[0.16, 0.34, 0.02], [0.84, 0.66, 0.98]].forEach(p => {
      ctx.beginPath();
      ctx.moveTo(W * p[0], 0); ctx.lineTo(W * p[1], H * 0.7); ctx.lineTo(W * p[2], H * 0.7);
      ctx.closePath(); ctx.fill();
    });

    const ringY = H * 0.29;
    const leftX = W * 0.28, rightX = W * 0.72;
    this.drawRig(ctx, leftX, ringY, W * 0.10, '#FFD93D');
    this.drawRig(ctx, rightX, ringY, W * 0.10, '#9be3b0');

    const t = this.flyT;
    const swing = Math.sin(this.time * 0.004) * (t > 0 ? 0 : W * 0.03);
    const gx = leftX + (rightX - leftX) * (1 - t) + swing * t;
    const gy = ringY + Math.sin((1 - t) * Math.PI) * -H * 0.10 + H * 0.05;
    this.drawGopherAt(ctx, gx, gy, W * 0.19, 0);

    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gx, gy + H * 0.10, W * 0.075, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  // ----- 🎀 Полотна: взбираемся, крутим оборот и замираем в позе -----
  drawSilks(ctx, W, H) {
    const topPad = H * 0.16, bottom = H * 0.52;
    const x1 = W * 0.40, x2 = W * 0.60;

    // Две ленты полотен от потолка: они чуть покачиваются
    [x1, x2].forEach((x, i) => {
      ctx.strokeStyle = i ? '#FF7BD5' : '#E91E9C';
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let y = topPad; y <= bottom; y += 8) {
        const wave = Math.sin(y * 0.05 + this.time * 0.002 + i) * 3;
        if (y === topPad) ctx.moveTo(x + wave, y); else ctx.lineTo(x + wave, y);
      }
      ctx.stroke();
    });

    // Мат под полотнами
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, W * 0.24, bottom + H * 0.012, W * 0.52, H * 0.034, 10);
    ctx.fill();

    // Гофер поднимается по полотнам, а после нажатия крутит оборот
    const spin = this.flyT;
    const climb = 0.3 + Math.abs(Math.sin(this.time * 0.0011)) * 0.4;
    const gy = topPad + (bottom - topPad) * climb;
    const gx = (x1 + x2) / 2;
    const rot = spin > 0 ? (1 - spin) * Math.PI * 4 : 0;    // два полных оборота
    this.drawGopherAt(ctx, gx, gy, W * 0.17, rot);
  }

  // ----- 🏊 Заплыв: плывём по дорожке и делаем поворот у борта -----
  drawSwim(ctx, W, H) {
    const waterY = H * 0.30;

    ctx.fillStyle = 'rgba(0,150,190,0.35)';
    ctx.fillRect(0, waterY, W, H * 0.30);

    // Разметка дорожек
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      const y = waterY + (H * 0.30) * (i / 4);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Волна на поверхности воды
    ctx.strokeStyle = 'rgba(180,235,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = waterY + Math.sin(x * 0.06 + this.time * 0.004) * 4;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Борт, у которого делают поворот
    const wallX = W * 0.88;
    ctx.fillStyle = '#0e2a3a';
    ctx.fillRect(wallX, waterY - H * 0.06, W * 0.12, H * 0.36);

    // Гофер плывёт туда-обратно, а после нажатия делает кувырок на повороте
    const turn = this.flyT;
    const back = (this.time * 0.0003) % 2;
    const k = back < 1 ? back : 2 - back;
    const lineX = W * 0.18 + (wallX - W * 0.18) * (turn > 0 ? 1 - turn : k);
    const gy = waterY + H * 0.12;
    this.drawGopherAt(ctx, lineX, gy, W * 0.16, Math.PI / 2 + (turn > 0 ? (1 - turn) * Math.PI * 2 : 0));

    // Брызги при повороте
    if (turn > 0) {
      ctx.fillStyle = 'rgba(200,240,255,0.85)';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const r = (1 - turn) * W * 0.10;
        ctx.beginPath();
        ctx.arc(lineX + Math.cos(a) * r, gy + Math.sin(a) * r * 0.6, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ----- 🏃 Барьеры: бежим по дорожке и перепрыгиваем барьер -----
  drawHurdles(ctx, W, H) {
    const trackY = H * 0.46;

    // Дорожка с разметкой
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, trackY, W, H * 0.09);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 3; i++) {
      const y = trackY + (H * 0.09) * (i / 3);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Барьер: две стойки и планка
    const hx = W * 0.62, hw = W * 0.12, hurdleH = H * 0.09;
    ctx.fillStyle = '#C9A227';
    ctx.fillRect(hx, trackY - hurdleH, W * 0.012, hurdleH);
    ctx.fillRect(hx + hw, trackY - hurdleH, W * 0.012, hurdleH);
    ctx.fillStyle = '#fff';
    ctx.fillRect(hx, trackY - hurdleH, hw, hurdleH * 0.26);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(hx, trackY - hurdleH * 0.52, hw, hurdleH * 0.06);

    // Гофер бежит вприпрыжку, а после нажатия перелетает барьер
    const t = this.flyT;
    const runPhase = (this.time * 0.0005) % 1;
    const run = runPhase < 0.5 ? runPhase * 2 : 2 - runPhase * 2;
    const gx = t > 0 ? hx + (W * 0.20) * (1 - t) : W * 0.16 + (hx - W * 0.16) * run;
    const hop = t > 0 ? -Math.sin((1 - t) * Math.PI) * H * 0.17
                      : Math.abs(Math.sin(this.time * 0.008)) * H * 0.012;
    this.drawGopherAt(ctx, gx, trackY - H * 0.02 + hop, W * 0.17, 0);
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
      return this.goBack();
    }
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const t = btn.text || '';
      if (t.indexOf('Назад') !== -1) return this.goBack();
      // Подписи кнопок берём из дисциплины, а старые варианты оставляем
      // рабочими: на них опираются проверки и привычка игрока (v1.3.7)
      if (t === this.disc.action || t.indexOf('Прыгнуть') !== -1) return this.jump();
      if (t === this.disc.start || t.indexOf('Начать') !== -1) return this.payEntry();
      if (t === this.disc.finish || t.indexOf('Закончить') !== -1) return this.finish();
      return true;
    }
    return false;
  }
}

window.SportScene = SportScene;
window.AerialScene = SportScene;        // старое имя сцены осталось рабочим
window.SPORT_DISCIPLINES = SPORT_DISCIPLINES;
window.sportListFor = sportListFor;
