// ============ ТИХИЕ ИГРЫ («чем заняться, пока гофер спит») ============
// Спокойные занятия без таймеров, без проигрышей и без затрат энергии:
//   1) Созвездие — соедини звёзды по порядку;
//   2) Раскраска — раскрась картинку цветами;
//   3) Тихая рыбалка — дождись поклёвки и тяни.
// Пока гофер спит, энергия копится (+10% в минуту) — об этом написано на экране.

// Большие обитатели подводного мира (v1.3.11). Раньше их было один-два случайных
// из семи, и заказчик справедливо заметил: «из всех этих существ я вижу кроме рыб
// только медузу, не увидел ни одной акулы, черепахи или осьминога». Теперь в воде
// одновременно три РАЗНЫХ обитателя, а раз в 14–22 секунды один уплывает к краю и
// на его место приходит следующий по кругу — за пару минут видно всех семерых.
const SEA_FRIENDS_IN_WATER = 3;
const FRIEND_SWAP_MIN = 14;
const FRIEND_SWAP_MAX = 22;

class QuietScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.mode = 'select';   // select | stars | color | fish
    this.result = '';
    this.resultTimer = 0;
    this.initStars();
    this.initColor();
    this.initFish();
  }

  init() {
    this.time = 0;
    this.mode = 'select';
    this.buttons = [];
    this.result = '';
    this.resultTimer = 0;
    this.initStars();
    this.initColor();
    this.initFish();
  }

  // ---------- 1. СОЗВЕЗДИЕ ----------
  // Рисунок каждый раз новый: раньше созвездие было одно и то же, и игра
  // быстро надоедала. Строим «путь» из 9 звёзд: каждая следующая на
  // расстоянии 70–125 px от предыдущей, с плавным поворотом, так что
  // получается похоже на созвездие, а не на прямую линию. Минимальный
  // зазор — 56 px: по звёздам легко попадать пальцем (радиус попадания 24).
  initStars() {
    const W = (this.game && this.game.width) || 540;
    const H = (this.game && this.game.height) || 960;
    const area = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const padX = 26, padY = 34;
    let minGap = 56;

    const pts = [];
    let cur = {
      x: randFloat(area.x + padX, area.x + area.w * 0.35),
      y: randFloat(area.y + padY, area.y + area.h - padY)
    };
    pts.push(cur);
    let dir = randFloat(-0.6, 0.6);          // идём в основном вправо
    let guard = 0;
    while (pts.length < 9 && guard++ < 500) {
      const step = randFloat(70, 125);
      dir += randFloat(-0.9, 0.9);
      let nx = cur.x + Math.cos(dir) * step;
      let ny = cur.y + Math.sin(dir) * step;
      // У края области разворачиваемся, чтобы созвездие осталось внутри
      if (nx < area.x + padX || nx > area.x + area.w - padX) {
        dir = Math.PI - dir;
        nx = clamp(cur.x + Math.cos(dir) * step, area.x + padX, area.x + area.w - padX);
      }
      if (ny < area.y + padY || ny > area.y + area.h - padY) {
        dir = -dir;
        ny = clamp(cur.y + Math.sin(dir) * step, area.y + padY, area.y + area.h - padY);
      }
      const tooClose = pts.some(p => Math.hypot(p.x - nx, p.y - ny) < minGap);
      if (tooClose) {
        if (guard > 250) minGap = Math.max(42, minGap - 2);   // страховка от затора
        continue;
      }
      cur = { x: nx, y: ny };
      pts.push(cur);
    }
    // Доли области — в таком виде звёзды рисует и проверяет игра
    const points = pts.map(p => [(p.x - area.x) / area.w, (p.y - area.y) / area.h]);
    this.stars = { points: points, next: 0, done: false };
  }

  // ---------- 2. РАСКРАСКА ----------
  initColor() {
    this.paint = {
      colors: ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#C39BD3', '#FF8C42'],
      picked: 0,
      done: false,
      parts: [
        { id: 'body', kind: 'ellipse', cx: 0.50, cy: 0.60, rx: 0.26, ry: 0.20, fill: null },
        { id: 'head', kind: 'circle', cx: 0.50, cy: 0.32, r: 0.15, fill: null },
        { id: 'earL', kind: 'circle', cx: 0.38, cy: 0.19, r: 0.07, fill: null },
        { id: 'earR', kind: 'circle', cx: 0.62, cy: 0.19, r: 0.07, fill: null },
        { id: 'tail', kind: 'circle', cx: 0.79, cy: 0.68, r: 0.08, fill: null },
        { id: 'grass', kind: 'rect', x: 0.08, y: 0.80, w: 0.84, h: 0.13, fill: null }
      ]
    };
  }

  // ---------- 3. РЫБАЛКА ----------
  // Куда опущен крючок с наживкой: чуть ниже поплавка, при поклёвке — ниже
  fishHookY() {
    const w = this.fishWater();
    const bite = !!(this.fish && this.fish.state === 'bite');
    const dip = bite ? 12 + Math.sin(this.time * 0.03) * 4 : 0;
    return w.top + 66 + dip;
  }

  // Границы воды: сверху — поверхность, снизу — дно
  fishWater() {
    const W = (this.game && this.game.width) || 540;
    const H = (this.game && this.game.height) || 960;
    return { x0: W * 0.05, x1: W * 0.95, top: H * 0.40, bottom: H * 0.80 };
  }

  // Новый житель воды: kind 'fish' — кого ловим, 'friend' — кого только смотрим.
  // species можно передать явно (нужно для больших обитателей, v1.3.11)
  makeSwimmer(kind, W, H, species) {
    const w = this.fishWater();
    const friend = (kind === 'friend');
    const sp = species || (friend
      ? (typeof SEA_FRIENDS !== 'undefined' ? SEA_FRIENDS[Math.floor(Math.random() * SEA_FRIENDS.length)] : null)
      : (typeof randomFishSpecies === 'function' ? randomFishSpecies() : null));
    if (!sp) return null;
    return {
      kind: kind, id: sp.id, data: sp,
      x: randFloat(w.x0, w.x1),
      y: randFloat(w.top + 30, w.bottom - 30),
      dir: Math.random() < 0.5 ? -1 : 1,
      speed: (friend ? randFloat(12, 22) : randFloat(22, 50)) * (0.7 + sp.size * 0.5),
      phase: randFloat(0, Math.PI * 2),
      bob: randFloat(0.4, 1.3),
      nibble: 0,                 // сколько уже «пробует» крючок
      alpha: friend ? 0.92 : 1
    };
  }

  // Кто из больших обитателей придёт следующим: виды идут по кругу, поэтому за
  // пару минут видно всех семерых, а не одних медуз (заказчик v1.3.11: «из всех
  // этих существ я вижу кроме рыб только медузу»). inWater — кого уже не надо:
  // в воде не бывает двух одинаковых (кроме случая, когда выбора не осталось).
  nextFriendSpecies(inWater) {
    const all = (typeof SEA_FRIENDS !== 'undefined') ? SEA_FRIENDS : [];
    if (!all.length) return null;
    if (typeof this.friendCursor !== 'number') this.friendCursor = Math.floor(Math.random() * all.length);
    for (let i = 0; i < all.length * 2; i++) {
      const sp = all[this.friendCursor % all.length];
      this.friendCursor = (this.friendCursor + 1) % all.length;
      if (!inWater || inWater.indexOf(sp.id) === -1) return sp;
    }
    return all[0];
  }

  // Подводный мир: стайка рыбок + большие обитатели, все разные
  spawnSea(W, H, count) {
    const list = [];
    for (let i = 0; i < (count || 9); i++) {
      const s = this.makeSwimmer('fish', W, H);
      if (s) list.push(s);
    }
    const used = [];
    for (let i = 0; i < SEA_FRIENDS_IN_WATER; i++) {
      const sp = this.nextFriendSpecies(used);
      if (!sp) break;
      used.push(sp.id);
      const s = this.makeSwimmer('friend', W, H, sp);
      if (s) list.push(s);
    }
    return list;
  }

  initFish() {
    const W = (this.game && this.game.width) || 540;
    const H = (this.game && this.game.height) || 960;
    this.fish = {
      state: 'wait',           // wait | bite
      timer: randFloat(2.5, 5.5),
      biteWindow: 0,
      caught: 0,
      target: 3,
      swimmers: this.spawnSea(W, H),
      biteFish: null,          // кто сейчас тянется к крючку
      splash: 0,               // всплеск после удачной подсечки
      friendHint: 0,           // таймер подсказки «больших не ловим»
      friendHintText: '',
      friendSwap: randFloat(FRIEND_SWAP_MIN, FRIEND_SWAP_MAX),  // когда менять состав (v1.3.11)
      friendSwapWanted: false, // пора менять: ждём, когда обитатель дойдёт до края
      lastCatch: null          // { id, name, fact, times } — для текста после поимки
    };
  }

  // Кто клюнет: ближайшая к крючку рыбка. Большие обитатели не клюют — их не ловят
  pickBiter() {
    const W = this.game.width, hy = this.fishHookY();
    const near = (s) => Math.abs(s.x - W / 2) + Math.abs(s.y - hy);
    const list = (this.fish.swimmers || []).filter(s => s.kind === 'fish' && typeof s.caughtAnim !== 'number');
    if (!list.length) return null;
    return list.slice().sort((a, b) => near(a) - near(b))[0];
  }

  startGame(id) {
    if (id === 'stars') this.initStars();
    else if (id === 'color') this.initColor();
    else this.initFish();
    this.mode = id;
    AudioSys.play('click');
  }

  // Награда за спокойную игру: монеты, опыт, больше спокойствия, без затрат энергии
  reward(gameId, title) {
    const meta = (typeof QUIET_GAMES !== 'undefined') ? QUIET_GAMES.find(g => g.id === gameId) : null;
    const coins = meta ? meta.reward : 8;
    System.countAction('quiet');
    System.earnCoins(coins);
    System.addXP(6);
    System.relax(4);
    System.saveGame();
    AudioSys.play('success');
    this.result = title + '  🪙+' + coins + '  😌+4 спокойствия';
    this.resultTimer = 4.5;
    System.showAchievement('✨', title);
  }

  update(dt) {
    this.time += dt;
    const sec = dt / 1000;
    if (this.resultTimer > 0) this.resultTimer -= sec;

    if (this.mode === 'fish') {
      const f = this.fish;
      const W = this.game.width;
      const w = this.fishWater();
      const hookY = this.fishHookY();

      // Кто плавает под водой: рыбки идут туда-сюда, покачиваются по синусу и
      // разворачиваются у краёв — это и есть «видно, как они плавают» (v1.3.9)
      (f.swimmers || []).forEach(s => {
        s.phase += sec * (1.2 + s.speed * 0.03);
        if (typeof s.caughtAnim === 'number') {
          // Поймали: рыбку тянет к поплавку и она растворяется в всплеске
          s.caughtAnim -= sec;
          s.x += (W / 2 - s.x) * Math.min(1, sec * 6);
          s.y += (hookY - 26 - s.y) * Math.min(1, sec * 4);
          s.alpha = Math.max(0, s.caughtAnim / 0.8);
          return;
        }
        if (f.state === 'bite' && f.biteFish === s) {
          // Клюнула: подплывает к наживке и «пробует» её — видно, как цепляется
          const dx = W / 2 - s.x, dy = (hookY + 4) - s.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          s.x += (dx / d) * 78 * sec;
          s.y += (dy / d) * 78 * sec;
          s.nibble += sec;
        } else {
          // Большие обитатели обходят крючок стороной: «черепашкам не навредить»
          if (s.kind === 'friend' && Math.abs(s.x - W / 2) < 92 && Math.abs(s.y - hookY) < 74) {
            s.x += (s.dir > 0 ? 1 : -1) * 46 * sec;
            if (f.friendHint <= 0 && typeof seaFriendHint === 'function') {
              const hint = seaFriendHint(s.id);
              if (hint) { f.friendHint = 3.6; f.friendHintText = hint; }
            }
          } else {
            s.x += s.dir * s.speed * sec;
          }
          s.y += Math.sin(s.phase) * s.bob * sec * 9;
        }
        if (s.y < w.top + 16) s.y = w.top + 16;
        if (s.y > w.bottom - 16) s.y = w.bottom - 16;
        if (s.x < w.x0) { s.x = w.x0; s.dir = 1; }
        if (s.x > w.x1) { s.x = w.x1; s.dir = -1; }

        // Состав больших обитателей меняется (v1.3.11): заказчик видел одних медуз,
        // а хотел черепаху, акулу и осьминога. Меняем вид только у самого края —
        // получается, будто один уплыл, а другой приплыл, без телепорта посередине.
        if (s.kind === 'friend' && f.friendSwapWanted &&
            (s.x <= w.x0 + 3 || s.x >= w.x1 - 3)) {
          const others = (f.swimmers || [])
            .filter(x => x.kind === 'friend' && x !== s).map(x => x.id);
          const sp = this.nextFriendSpecies(others);
          if (sp) {
            s.id = sp.id;
            s.data = sp;
            s.speed = randFloat(12, 22) * (0.7 + sp.size * 0.5);
            s.y = randFloat(w.top + 40, w.bottom - 40);
            f.friendSwapWanted = false;
            f.friendSwap = randFloat(FRIEND_SWAP_MIN, FRIEND_SWAP_MAX);
          }
        }
      });

      // Уплывшие (пойманные) рыбки заменяются новыми — мир не пустеет
      const gone = (f.swimmers || []).filter(s => typeof s.caughtAnim === 'number' && s.caughtAnim <= 0);
      if (gone.length) {
        f.swimmers = f.swimmers.filter(s => !(typeof s.caughtAnim === 'number' && s.caughtAnim <= 0));
        gone.forEach(() => {
          const ns = this.makeSwimmer('fish', W, this.game.height);
          if (ns) f.swimmers.push(ns);
        });
        f.splash = 0.6;
      }

      if (f.friendHint > 0) f.friendHint -= sec;
      if (f.splash > 0) f.splash -= sec;
      // Пора менять состав больших обитателей: ждём, когда кто-то дойдёт до края
      if (f.friendSwap > 0) {
        f.friendSwap -= sec;
        if (f.friendSwap <= 0) f.friendSwapWanted = true;
      }

      if (f.state === 'wait') {
        f.timer -= sec;
        if (f.timer <= 0) {
          f.state = 'bite';
          f.biteWindow = 2.4;
          f.biteFish = this.pickBiter();
          AudioSys.play('coin');
        }
      } else if (f.state === 'bite') {
        f.biteWindow -= sec;
        if (f.biteWindow <= 0) {
          if (f.biteFish) f.biteFish.nibble = 0;      // рыбка уплыла — попробуем снова
          f.biteFish = null;
          f.state = 'wait';
          f.timer = randFloat(2.0, 4.5);
        }
      }
    }
  }
  // ================= ОТРИСОВКА =================
  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;

    // Ночь и покой — фон всегда спокойный
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#141433');
    grad.addColorStop(1, '#243055');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * 12.9) * 0.5 + 0.5) * W;
      const sy = (Math.cos(i * 7.3) * 0.5 + 0.5) * H * 0.7;
      const tw = 0.5 + 0.5 * Math.sin(this.time * 0.002 + i);
      ctx.globalAlpha = 0.25 + tw * 0.45;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawHeader(ctx, W, H);

    if (this.mode === 'select') this.drawSelect(ctx, W, H);
    else if (this.mode === 'stars') this.drawStars(ctx, W, H);
    else if (this.mode === 'color') this.drawColor(ctx, W, H);
    else this.drawFish(ctx, W, H);

    if (this.resultTimer > 0) {
      // Факты о рыбах длинные, и в одну строку они превращались в нечитаемые
      // 9 px (замечание заказчика, v1.3.10). Теперь подбираем размер и переносим
      // текст по словам: до четырёх строк, плашка растёт вместе с текстом.
      const bw = Math.min(W * 0.92, 380);
      const pad = 14;
      const baseSize = Math.min(W * 0.034, 14), minSize = 10.5;
      let size = baseSize, lines = [];
      while (size >= minSize) {
        ctx.font = 'bold ' + size + 'px Arial, sans-serif';
        const probe = wrapLines(ctx, this.result, bw - pad * 2, 4);
        if (probe.every(l => ctx.measureText(l).width <= bw - pad * 2)) { lines = probe; break; }
        size -= 0.5;
      }
      if (!lines.length) {
        ctx.font = 'bold ' + minSize + 'px Arial, sans-serif';
        lines = wrapLines(ctx, this.result, bw - pad * 2, 4);
      }
      const lh = size + 5.5;
      const bh = Math.max(42, lines.length * lh + pad + 4);
      const by = H * 0.44 - (bh - 44) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.74)';
      roundRect(ctx, (W - bw) / 2, by, bw, bh, 12);
      ctx.fill();
      ctx.fillStyle = '#FFD93D';
      ctx.font = 'bold ' + size + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => ctx.fillText(line, W / 2, by + pad / 2 + lh * (i + 0.5)));
      ctx.textBaseline = 'alphabetic';
    }

    this.buttons.push(createButton(ctx, 10, 10, 88, 34, '← Назад', {
      bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 9
    }));
  }

  // Состояние гофера: спит — энергия копится; не спит — просто тихая игра
  drawHeader(ctx, W, H) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.055, 24)}px Arial`;
    ctx.fillText('🤫 Тихие игры', W / 2, H * 0.055);

    const status = System.isSleeping
      ? '{Pet} спит 💤  энергия ' + Math.round(System.stats.energy) + '% (+10% в минуту)'
      : '{Pet} не спит. Тихие игры не тратят энергию и не мешают отдыху';
    const size = fitFontSize(ctx, status, W - 30, Math.min(W * 0.029, 12.5), 8.5, false);
    ctx.fillStyle = System.isSleeping ? '#9be3b0' : '#c9cfe0';
    ctx.font = `${size}px Arial`;
    ctx.fillText(status, W / 2, H * 0.095);
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- Выбор игры ----------
  drawSelect(ctx, W, H) {
    const games = (typeof QUIET_GAMES !== 'undefined') ? QUIET_GAMES : [];
    const cardW = Math.min(W * 0.86, 330);
    const cardH = Math.min(H * 0.13, 88);
    const x0 = (W - cardW) / 2;
    const y0 = H * 0.15;

    games.forEach((g, i) => {
      const y = y0 + i * (cardH + 12);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, x0, y, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x0, y, cardW, cardH, 14);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(cardH * 0.5, 38)}px Arial`;
      ctx.fillText(g.emoji, x0 + 14, y + cardH / 2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.042, 17)}px Arial`;
      ctx.fillText(g.name, x0 + 66, y + cardH / 2 - 11);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.min(W * 0.030, 12.5)}px Arial`;
      ctx.fillText(g.desc, x0 + 66, y + cardH / 2 + 11);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(W * 0.030, 12.5)}px Arial`;
      ctx.fillText('🪙+' + g.reward, x0 + cardW - 14, y + cardH - 15);

      this.buttons.push({ x: x0, y: y, w: cardW, h: cardH, action: 'quiet:' + g.id });
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
    ctx.fillText('Проиграть нельзя — можно только отдохнуть 😌', W / 2, H - 26);
  }
  // ---------- 1. Созвездие ----------
  drawStars(ctx, W, H) {
    const a = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const pts = this.stars.points.map(p => ({ x: a.x + a.w * p[0], y: a.y + a.h * p[1] }));

    ctx.strokeStyle = 'rgba(255,217,61,0.85)';
    ctx.lineWidth = 2;
    for (let i = 1; i < this.stars.next; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    pts.forEach((p, i) => {
      const done = i < this.stars.next;
      const isNext = i === this.stars.next && !this.stars.done;
      const pulse = isNext ? 1 + Math.sin(this.time * 0.006) * 0.22 : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (isNext ? 13 : 9) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = done ? '#FFD93D' : (isNext ? '#8FE3FF' : 'rgba(255,255,255,0.35)');
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isNext ? '#0d1024' : 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), p.x, p.y + 0.5);
      ctx.textBaseline = 'alphabetic';
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.030, 13)}px Arial`;
    ctx.fillText(this.stars.done ? 'Созвездие готово! ✨' : 'Нажимай звёзды по порядку: 1, 2, 3…', W / 2, H * 0.80);

    this.buttons.push(createButton(ctx, W * 0.30, H * 0.84, W * 0.40, 38,
      this.stars.done ? '✨ Ещё раз' : '🔄 Заново', {
        bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 14, radius: 10
      }));
  }

  // ---------- 2. Раскраска ----------
  drawColor(ctx, W, H) {
    const p = this.paint;
    const a = { x: W * 0.12, y: H * 0.14, w: W * 0.76, h: H * 0.54 };

    p.parts.forEach(part => {
      ctx.beginPath();
      if (part.kind === 'circle') {
        ctx.arc(a.x + a.w * part.cx, a.y + a.h * part.cy, a.w * part.r, 0, Math.PI * 2);
      } else if (part.kind === 'ellipse') {
        ctx.ellipse(a.x + a.w * part.cx, a.y + a.h * part.cy, a.w * part.rx, a.h * part.ry, 0, 0, Math.PI * 2);
      } else if (part.kind === 'rect') {
        roundRect(ctx, a.x + a.w * part.x, a.y + a.h * part.y, a.w * part.w, a.h * part.h, 8);
      }
      ctx.fillStyle = part.fill || 'rgba(255,255,255,0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });

    // мордочка, чтобы картинка читалась
    const hx = a.x + a.w * 0.50, hy = a.y + a.h * 0.32;
    ctx.fillStyle = '#1b1b26';
    ctx.beginPath(); ctx.arc(hx - a.w * 0.05, hy, a.w * 0.014, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + a.w * 0.05, hy, a.w * 0.014, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx, hy + a.h * 0.045, a.w * 0.02, a.h * 0.015, 0, 0, Math.PI * 2); ctx.fill();

    // палитра
    const sw = Math.min((W - 40) / p.colors.length, 54);
    const y = H * 0.73;
    p.colors.forEach((c, i) => {
      const x = (W - sw * p.colors.length) / 2 + i * sw;
      ctx.fillStyle = c;
      roundRect(ctx, x + 2, y, sw - 4, sw * 0.55, 8);
      ctx.fill();
      if (i === p.picked) {
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 3;
        roundRect(ctx, x + 2, y, sw - 4, sw * 0.55, 8);
        ctx.stroke();
      }
      this.buttons.push({ x: x + 2, y: y, w: sw - 4, h: sw * 0.55, action: 'paint:' + i });
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9cfe0';
    ctx.font = `${Math.min(W * 0.030, 13)}px Arial`;
    ctx.fillText(p.done ? 'Картинка раскрашена! 🎨' : 'Выбери цвет и нажимай на части картинки', W / 2, H * 0.69);

    this.buttons.push(createButton(ctx, W * 0.32, H * 0.85, W * 0.36, 36, '🔄 Новая', {
      bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 13, radius: 10
    }));
  }

  // ---------- 3. Тихая рыбалка ----------
  drawFish(ctx, W, H) {
    const f = this.fish;
    const waterTop = H * 0.46;
    const w = this.fishWater();

    // Вода: светлая у поверхности, глубокая внизу — «виден подводный мир»
    const wg = ctx.createLinearGradient(0, w.top - 30, 0, H * 0.86);
    wg.addColorStop(0, '#2f8fb8');
    wg.addColorStop(0.45, '#1d5b86');
    wg.addColorStop(1, '#0b2b45');
    ctx.fillStyle = wg;
    ctx.fillRect(0, w.top - 30, W, H * 0.86 - (w.top - 30));

    // Лучи солнца сквозь воду
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
      const bx = (i + 0.5) * W / 5 + Math.sin(this.time * 0.0007 + i) * 14;
      ctx.beginPath();
      ctx.moveTo(bx - 16, w.top - 30);
      ctx.lineTo(bx + 16, w.top - 30);
      ctx.lineTo(bx + 62, H * 0.84);
      ctx.lineTo(bx + 18, H * 0.84);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Волны на поверхности
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = w.top - 18 + i * 12 + Math.sin((x * 0.03) + this.time * 0.002 + i) * 3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Дно: песок, камни и водоросли
    ctx.fillStyle = '#c8b27a';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.84);
    for (let x = 0; x <= W; x += 24) {
      ctx.lineTo(x, H * 0.84 + Math.sin(x * 0.02) * 4);
    }
    ctx.lineTo(W, H * 0.90);
    ctx.lineTo(0, H * 0.90);
    ctx.closePath();
    ctx.fill();
    // Водоросли качаются на течении
    for (let i = 0; i < 9; i++) {
      const sx = (i * 97 % W), sway = Math.sin(this.time * 0.0016 + i) * 7;
      ctx.beginPath();
      ctx.moveTo(sx, H * 0.845);
      ctx.quadraticCurveTo(sx + sway, H * 0.79, sx + sway * 0.6 + 6, H * 0.75);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(120,160,80,0.85)';
      ctx.stroke();
    }
    // Камни: небольшие, у самого дна (раньше радиус считался с ошибкой и они
    // заливали половину экрана — нашлось на кадре 07_fishing.jpg, v1.3.9)
    ctx.fillStyle = 'rgba(90,80,70,0.55)';
    [[0.12, 0.05], [0.36, 0.035], [0.68, 0.055], [0.88, 0.035]].forEach(([rx, rr]) => {
      ctx.beginPath();
      ctx.ellipse(W * rx, H * 0.86, W * rr, W * rr * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Пузырьки поднимаются вверх
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      const bx = (i * 137 % W);
      const t = (this.time * 0.02 + i * 90) % 260;
      const by = w.bottom - 10 - ((t / 260) * (w.bottom - w.top - 20));
      ctx.globalAlpha = 0.5 - (t / 260) * 0.35;
      ctx.beginPath();
      ctx.arc(bx, by, 1.6 + (i % 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Жители воды: сначала большие (фон), потом рыбки — их хорошо видно
    const order = (f.swimmers || []).slice().sort((a, b) => (a.kind === 'friend' ? -1 : 1) - (b.kind === 'friend' ? -1 : 1));
    order.forEach(s => {
      if (s.kind === 'friend') this.drawSeaFriend(ctx, s);
      else this.drawSeaFish(ctx, s);
    });

    // Поплавок на поверхности, ниже — крючок с наживкой: видно, как рыбка
    // подплывает к наживке и цепляется (v1.3.9)
    const dip = (f.state === 'bite') ? 14 + Math.sin(this.time * 0.03) * 4 : 0;
    const bx = W / 2, by = w.top + 14 + dip;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, H * 0.16);
    ctx.lineTo(bx, by - 10);
    ctx.stroke();
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(bx, by + 5, 6, 0, Math.PI); ctx.fill();

    const hy = this.fishHookY();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + 8);
    ctx.lineTo(bx, hy + 8);
    ctx.stroke();
    ctx.strokeStyle = '#cfd8e3';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(bx, hy + 13, 7, Math.PI * 0.15, Math.PI * 1.15);
    ctx.stroke();
    ctx.fillStyle = '#F6C177';
    ctx.beginPath(); ctx.arc(bx, hy + 6, 4.5, 0, Math.PI * 2); ctx.fill();

    if (f.state === 'bite') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(bx, w.top + 2, r * 15, r * 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (f.splash > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(0.8, f.splash).toFixed(2) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(bx, w.top + 4, 26 + (0.6 - f.splash) * 70, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    // Строка состояния — на тёмной плашке: без неё текст теряется на песочном дне
    ctx.fillStyle = 'rgba(8,18,32,0.66)';
    roundRect(ctx, W / 2 - Math.min(W * 0.44, 232), H * 0.881, Math.min(W * 0.88, 464), 27, 10);
    ctx.fill();
    ctx.fillStyle = f.state === 'bite' ? '#FFD93D' : '#c9cfe0';
    ctx.font = `bold ${Math.min(W * 0.036, 15)}px Arial`;
    ctx.fillText(f.state === 'bite' ? 'КЛЮЁТ! Нажимай — тяни!' : 'Ждём поклёвку… тихо-тихо 🎣', W / 2, H * 0.900);

    ctx.font = `${Math.min(W * 0.030, 12.5)}px Arial`;
    ctx.fillStyle = '#9be3b0';
    const species = (typeof System !== 'undefined' && System.fishSpeciesCount) ? System.fishSpeciesCount() : 0;
    const all = (typeof FISH_SPECIES !== 'undefined') ? FISH_SPECIES.length : 0;
    ctx.fillText('Поймано: ' + f.caught + ' / ' + f.target + ' 🐟   Видов: ' + species + ' / ' + all, W / 2, H * 0.94);

    // Подсказка про больших обитателей появляется только тогда, когда кто-то из
    // них проходит рядом с крючком: постоянной надписи внизу экрана нет —
    // заказчик v1.3.11 попросил её убрать («явно не нужная»).
    ctx.font = `${Math.min(W * 0.026, 11)}px Arial`;
    if (f.friendHint > 0) {
      ctx.fillStyle = '#ffd9a0';
      ctx.fillText(f.friendHintText, W / 2, H * 0.965);
    }

    this.buttons.push(createButton(ctx, W * 0.32, H * 0.79, W * 0.36, 40,
      f.state === 'bite' ? '🎣 Тянуть!' : '⏳ Ждём…', {
        bgColor: f.state === 'bite' ? '#6BCB77' : 'rgba(255,255,255,0.18)',
        fgColor: f.state === 'bite' ? '#0d1024' : '#fff', fontSize: 14, radius: 10
      }));
  }

  // Рыбка: тело, хвост-веер, плавник и глаз. Хвост машет — видно, что она плывёт.
  drawSeaFish(ctx, s) {
    const d = s.data || {};
    const base = Math.min(this.game.width * 0.046, 25);
    const L = base * (d.size || 1) * 1.5;
    const hgt = base * (d.size || 1) * 0.9;
    const wig = Math.sin(this.time * 0.012 + s.x * 0.05) * (hgt * 0.22);
    ctx.save();
    ctx.globalAlpha = (s.alpha === undefined ? 1 : s.alpha);
    ctx.translate(s.x, s.y);
    ctx.scale(s.dir || 1, 1);

    // хвост
    ctx.fillStyle = d.color || '#8ab4ff';
    ctx.beginPath();
    ctx.moveTo(-L * 0.42, 0);
    ctx.lineTo(-L * 0.78, -hgt * 0.52 + wig);
    ctx.lineTo(-L * 0.70, wig);
    ctx.lineTo(-L * 0.78, hgt * 0.52 + wig);
    ctx.closePath();
    ctx.fill();

    // тело: сверху светлое брюшко, снизу цвет вида
    const g = ctx.createLinearGradient(0, -hgt * 0.55, 0, hgt * 0.55);
    g.addColorStop(0, d.belly || '#ffffff');
    g.addColorStop(1, d.color || '#8ab4ff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, L * 0.5, hgt * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // верхний плавник
    ctx.fillStyle = d.color || '#8ab4ff';
    ctx.beginPath();
    ctx.moveTo(-L * 0.06, -hgt * 0.42);
    ctx.lineTo(L * 0.16, -hgt * 0.76);
    ctx.lineTo(L * 0.27, -hgt * 0.40);
    ctx.closePath();
    ctx.fill();

    // глаз
    ctx.fillStyle = '#0e1a2b';
    ctx.beginPath(); ctx.arc(L * 0.3, -hgt * 0.1, Math.max(1.4, hgt * 0.12), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(L * 0.32, -hgt * 0.14, Math.max(0.7, hgt * 0.05), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Большие обитатели: черепаха, акула, осьминог, медуза, краб, морская звезда,
  // морской конёк. Они не клюют — их только рассматривают (v1.3.9).
  drawSeaFriend(ctx, s) {
    const d = s.data || {}, k = d.kind || 'turtle';
    const base = Math.min(this.game.width * 0.05, 28) * (d.size || 1);
    const t = this.time * 0.002;
    ctx.save();
    ctx.globalAlpha = (s.alpha === undefined ? 0.92 : s.alpha);
    ctx.translate(s.x, s.y);
    ctx.scale(s.dir || 1, 1);

    if (k === 'shark') {
      ctx.fillStyle = '#6b7f92';
      ctx.beginPath(); ctx.ellipse(0, 0, base * 1.15, base * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(base * 0.1, -base * 0.2); ctx.lineTo(base * 0.42, -base * 0.78); ctx.lineTo(base * 0.5, -base * 0.16);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-base * 0.95, 0.5); ctx.lineTo(-base * 1.5, -base * 0.5); ctx.lineTo(-base * 1.4, base * 0.34);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#eef3f7';
      ctx.beginPath(); ctx.ellipse(base * 0.25, base * 0.2, base * 0.7, base * 0.2, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#0e1a2b';
      ctx.beginPath(); ctx.arc(base * 0.75, -base * 0.1, base * 0.07, 0, Math.PI * 2); ctx.fill();
    } else if (k === 'octopus') {
      ctx.fillStyle = '#c96f8f';
      ctx.beginPath(); ctx.ellipse(0, -base * 0.15, base * 0.62, base * 0.55, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c96f8f';
      ctx.lineWidth = Math.max(2.4, base * 0.13);
      for (let i = 0; i < 4; i++) {
        const x0 = -base * 0.45 + i * base * 0.3;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.quadraticCurveTo(x0 + Math.sin(t + i) * base * 0.3, base * 0.5,
          x0 + Math.sin(t + i) * base * 0.5, base * 0.95);
        ctx.stroke();
      }
      ctx.fillStyle = '#3a2230';
      ctx.beginPath(); ctx.arc(-base * 0.2, -base * 0.28, base * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(base * 0.2, -base * 0.28, base * 0.09, 0, Math.PI * 2); ctx.fill();
    } else if (k === 'jellyfish') {
      ctx.fillStyle = 'rgba(180,220,255,0.75)';
      ctx.beginPath(); ctx.ellipse(0, -base * 0.15, base * 0.6, base * 0.45, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fill();
      ctx.strokeStyle = 'rgba(210,235,255,0.8)';
      ctx.lineWidth = Math.max(1.6, base * 0.07);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * base * 0.22, 0);
        ctx.quadraticCurveTo(i * base * 0.26 + Math.sin(t * 2 + i) * base * 0.14, base * 0.45,
          i * base * 0.2 + Math.sin(t * 2 + i) * base * 0.2, base * 0.8);
        ctx.stroke();
      }
    } else if (k === 'turtle') {
      ctx.fillStyle = '#5f8f56';
      ctx.beginPath(); ctx.ellipse(base * 0.72, base * 0.02, base * 0.24, base * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(base * 0.3, base * 0.42, base * 0.3, base * 0.14, -0.5 + Math.sin(t) * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-base * 0.3, base * 0.4, base * 0.28, base * 0.13, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d6e4a';
      ctx.beginPath(); ctx.ellipse(0, 0, base * 0.8, base * 0.58, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(90,70,45,0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, base * 0.42, base * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#12331f';
      ctx.beginPath(); ctx.arc(base * 0.85, -base * 0.06, base * 0.05, 0, Math.PI * 2); ctx.fill();
    } else if (k === 'crab') {
      ctx.fillStyle = '#d05a4a';
      ctx.beginPath(); ctx.ellipse(0, 0, base * 0.62, base * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d05a4a';
      ctx.lineWidth = Math.max(2, base * 0.1);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-base * 0.4, base * 0.14 + i * base * 0.12);
        ctx.lineTo(-base * 0.85, base * 0.3 + i * base * 0.16);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(base * 0.4, base * 0.14 + i * base * 0.12);
        ctx.lineTo(base * 0.85, base * 0.3 + i * base * 0.16);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(-base * 0.62, -base * 0.3, base * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(base * 0.62, -base * 0.3, base * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#12212b';
      ctx.beginPath(); ctx.arc(-base * 0.2, -base * 0.2, base * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(base * 0.2, -base * 0.2, base * 0.09, 0, Math.PI * 2); ctx.fill();
    } else if (k === 'starfish') {
      ctx.fillStyle = '#e08a3c';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rr = (i % 2 === 0) ? base * 0.6 : base * 0.26;
        const a = -Math.PI / 2 + i * Math.PI / 5 + Math.sin(t + i) * 0.05;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(0, 0, base * 0.12, 0, Math.PI * 2); ctx.fill();
    } else {
      // морской конёк: изогнутое тело, мордочка и плавник
      ctx.strokeStyle = '#e0b04a';
      ctx.lineWidth = Math.max(3, base * 0.2);
      ctx.beginPath();
      ctx.moveTo(0, -base * 0.5);
      ctx.quadraticCurveTo(base * 0.55, -base * 0.1, base * 0.15, base * 0.55);
      ctx.stroke();
      ctx.fillStyle = '#e0b04a';
      ctx.beginPath(); ctx.ellipse(-base * 0.1, -base * 0.62, base * 0.3, base * 0.2, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-base * 0.3, -base * 0.58); ctx.lineTo(-base * 0.72, -base * 0.5); ctx.lineTo(-base * 0.3, -base * 0.42);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#12212b';
      ctx.beginPath(); ctx.arc(-base * 0.16, -base * 0.66, base * 0.05, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ================= НАЖАТИЯ =================
  handleClick(mx, my) {
    // «Назад» — всегда последняя кнопка в массиве
    const back = this.buttons[this.buttons.length - 1];
    if (back && back.text && back.text.indexOf('Назад') !== -1 &&
        isPointInRect(mx, my, back.x, back.y, back.w, back.h)) {
      AudioSys.play('click');
      if (this.mode === 'select') this.game.transitionTo('home');
      else this.init();
      return true;
    }

    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const a = btn.action || '';
      const t = btn.text || '';
      if (a.indexOf('quiet:') === 0) { this.startGame(a.slice(6)); return true; }
      if (a.indexOf('paint:') === 0) {
        this.paint.picked = parseInt(a.slice(6), 10);
        AudioSys.play('click');
        return true;
      }
      if (t.indexOf('Заново') !== -1 || t.indexOf('Ещё раз') !== -1) { this.startGame('stars'); return true; }
      if (t.indexOf('Новая') !== -1) { this.startGame('color'); return true; }
      if (t.indexOf('Тянуть') !== -1 || t.indexOf('Ждём') !== -1) { return this.tryFish(); }
      return true;
    }

    if (this.mode === 'stars') return this.clickStars(mx, my);
    if (this.mode === 'color') return this.clickColor(mx, my);
    if (this.mode === 'fish') return this.tryFish();
    return false;
  }

  clickStars(mx, my) {
    const W = this.game.width, H = this.game.height;
    const a = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.54 };
    const pts = this.stars.points.map(p => ({ x: a.x + a.w * p[0], y: a.y + a.h * p[1] }));
    for (let i = 0; i < pts.length; i++) {
      const dx = mx - pts[i].x, dy = my - pts[i].y;
      if (Math.sqrt(dx * dx + dy * dy) <= 24) {
        if (this.stars.done) return true;
        if (i === this.stars.next) {
          this.stars.next++;
          AudioSys.play('click');
          if (this.stars.next >= pts.length) {
            this.stars.done = true;
            this.reward('stars', 'Созвездие собрано ✨');
          }
        } else {
          AudioSys.play('fail');
          this.result = 'Эта звезда ещё не следующая — ищи номер ' + (this.stars.next + 1);
          this.resultTimer = 2.2;
        }
        return true;
      }
    }
    return false;
  }

  // Попадает ли точка в часть картинки
  paintHit(part, a, mx, my) {
    if (part.kind === 'circle') {
      const cx = a.x + a.w * part.cx, cy = a.y + a.h * part.cy;
      const dx = mx - cx, dy = my - cy;
      return Math.sqrt(dx * dx + dy * dy) <= a.w * part.r;
    }
    if (part.kind === 'ellipse') {
      const dx = (mx - (a.x + a.w * part.cx)) / (a.w * part.rx);
      const dy = (my - (a.y + a.h * part.cy)) / (a.h * part.ry);
      return (dx * dx + dy * dy) <= 1;
    }
    return isPointInRect(mx, my, a.x + a.w * part.x, a.y + a.h * part.y, a.w * part.w, a.h * part.h);
  }

  clickColor(mx, my) {
    const W = this.game.width, H = this.game.height;
    const p = this.paint;
    const a = { x: W * 0.12, y: H * 0.14, w: W * 0.76, h: H * 0.54 };
    // Части перекрывают друг друга, поэтому сначала ищем незакрашенную под
    // пальцем: так картинку всегда можно довести до конца. Если все под
    // пальцем уже раскрашены — перекрашиваем верхнюю (ребёнок видит отклик).
    const hits = p.parts.filter(part => this.paintHit(part, a, mx, my));
    if (!hits.length) return false;
    const target = hits.find(x => !x.fill) || hits[hits.length - 1];
    target.fill = p.colors[p.picked];
    AudioSys.play('click');
    if (p.parts.every(x => x.fill)) {
      p.done = true;
      this.reward('color', 'Картинка раскрашена 🎨');
    }
    return true;
  }

  tryFish() {
    const f = this.fish;
    if (f.state === 'bite' && f.biteFish) {
      const s = f.biteFish;
      const d = s.data || {};
      const before = (typeof System !== 'undefined' && System.fishCaughtTimes) ? System.fishCaughtTimes(d.id) : 0;
      const isNew = (before === 0);
      if (typeof System !== 'undefined' && System.markFishCaught) System.markFishCaught(d.id);
      s.caughtAnim = 0.8;         // рыбку тянет к поплавку, потом её место занимает новая
      s.alpha = 1;
      f.biteFish = null;
      f.caught++;
      f.lastCatch = { id: d.id, name: d.name, fact: d.fact, isNew: isNew };
      AudioSys.play('success');
      const nowCount = (typeof System !== 'undefined' && System.fishSpeciesCount) ? System.fishSpeciesCount() : 0;
      const all = (typeof FISH_SPECIES !== 'undefined') ? FISH_SPECIES.length : 0;
      const head = isNew ? '🐟 Новый вид: ' : '🐟 ';
      if (f.caught >= f.target) {
        f.caught = 0;
        this.reward('fish', head + d.name + '! Рыбалка удалась 🎣');
        this.result = head + d.name + ' — ' + d.fact + '  (видов ' + nowCount + ' из ' + all + ')';
        this.resultTimer = 6;
      } else {
        this.result = head + d.name + ' — ' + d.fact +
          '  (' + f.caught + '/' + f.target + ', видов ' + nowCount + ' из ' + all + ')';
        this.resultTimer = 5;
      }
    } else if (f.state === 'bite') {
      // Клюнуло, но рыбка уже уплыла — честно говорим, что торопиться не надо
      f.state = 'wait';
      f.timer = randFloat(2.0, 4.5);
      this.result = 'Рано! Дождись, когда рыбка возьмёт наживку';
      this.resultTimer = 2.2;
    } else {
      this.result = 'Рано! Дождись, когда поплавок нырнёт';
      this.resultTimer = 2.0;
    }
    return true;
  }
}
window.QuietScene = QuietScene;
