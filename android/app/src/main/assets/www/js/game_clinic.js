// ============ СЦЕНА ПОЛИКЛИНИКИ ============
// Требование заказчика: «должно быть видно, как гофера лечат».
// Поэтому здесь не картинка, а пошаговая процедура: врач слушает дыхание,
// пишет рецепт, ставит укол, проверяет зрение по таблице, делает снимок,
// перевязывает лапу, смотрит зубы, меряет температуру или даёт витамины.
// Каждая процедура — своя анимация и три подписанных шага.
class ClinicScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.status = 'waiting';   // waiting | treating | done
    this.examProgress = 0;
    this.treatment = null;     // факт из базы контента (карточка внизу)
    this.procedure = null;     // что именно делают (анимация и шаги)
  }

  init() {
    this.time = 0;
    this.status = 'waiting';
    this.examProgress = 0;
    this.buttons = [];
    this.treatment = this.pickTreatment();
    this.procedure = this.pickProcedure();
    this.isSickAtStart = System.isSick;
  }

  // Факт из базы контента: сначала те, что ещё не попадались
  pickTreatment() {
    if (typeof getRandomItems !== 'function') return null;
    const seen = System.getSeen('clinic');
    const picked = getRandomItems('clinic', 1, seen);
    return picked[0] || null;
  }

  // Процедура: по кругу, чтобы за несколько визитов ребёнок увидел все восемь
  pickProcedure() {
    if (typeof CLINIC_PROCEDURES === 'undefined' || !CLINIC_PROCEDURES.length) return null;
    const seen = System.getSeen('clinicAnim');
    const fresh = CLINIC_PROCEDURES.filter(p => seen.indexOf('clinicAnim:' + p.id) === -1);
    const pool = fresh.length ? fresh : CLINIC_PROCEDURES;
    return pool[randInt(0, pool.length - 1)];
  }

  update(dt) {
    this.time += dt;
    if (this.status === 'treating') {
      this.examProgress += dt * 0.00028;      // вся процедура ≈ 3.5 секунды
      if (this.examProgress >= 1) {
        this.examProgress = 1;
        this.status = 'done';
        AudioSys.play('success');
      }
    }
  }

  // Текущий шаг процедуры (0..2) — по нему выбирается анимация
  stepIndex() {
    const p = this.procedure;
    const steps = (p && p.steps) ? p.steps.length : 3;
    return Math.min(steps - 1, Math.floor(this.examProgress * steps * 0.999));
  }
  // ================= ОТРИСОВКА =================
  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;

    // Фон кабинета
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#EAF6FB');
    grad.addColorStop(1, '#D3E9F2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Кафель на стене
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1;
    const tile = Math.max(18, W * 0.07);
    for (let x = 0; x < W; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.5); ctx.stroke();
    }
    for (let y = 0; y < H * 0.5; y += tile) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Пол
    ctx.fillStyle = '#BFD9E4';
    ctx.fillRect(0, H * 0.5, W, H);

    // Заголовок и XP
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1565A0';
    ctx.font = `bold ${Math.min(W * 0.052, 24)}px Arial`;
    ctx.fillText('🏥 Поликлиника', W / 2, H * 0.055);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1565A0';
    ctx.font = `bold ${Math.min(W * 0.026, 12)}px Arial`;
    ctx.fillText('⭐ Ур.' + System.level, 10, H * 0.095);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(21,101,160,0.75)';
    ctx.fillText('🏥 Здоровье: ' + Math.floor(System.stats.health) + '%', W - 10, H * 0.095);

    // Кушетка, стол и шкаф с лекарствами
    const bedY = H * 0.60;
    ctx.fillStyle = '#F4FAFD';
    roundRect(ctx, W * 0.38, bedY - H * 0.035, W * 0.52, H * 0.05, 8);
    ctx.fill();
    ctx.strokeStyle = '#9DBECD';
    ctx.lineWidth = 2;
    roundRect(ctx, W * 0.38, bedY - H * 0.035, W * 0.52, H * 0.05, 8);
    ctx.stroke();
    ctx.fillStyle = '#8FB3C4';
    ctx.fillRect(W * 0.40, bedY + H * 0.014, W * 0.03, H * 0.045);
    ctx.fillRect(W * 0.85, bedY + H * 0.014, W * 0.03, H * 0.045);

    ctx.fillStyle = '#E8F4F8';
    roundRect(ctx, W * 0.60, H * 0.35, W * 0.34, H * 0.12, 8);
    ctx.fill();
    ctx.strokeStyle = '#9DBECD';
    roundRect(ctx, W * 0.60, H * 0.35, W * 0.34, H * 0.12, 8);
    ctx.stroke();
    // медикаменты на полке
    ['💊', '🩹', '💉'].forEach((e, i) => {
      ctx.font = `${Math.min(W * 0.05, 22)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e, W * 0.67 + i * W * 0.08, H * 0.41);
    });
    ctx.textBaseline = 'alphabetic';

    // Врач и пациент
    const doctorX = W * 0.20, patientX = W * 0.62;
    const baseY = bedY + H * 0.005;
    this.drawDoctor(ctx, doctorX, H * 0.30, W);
    this.drawPatient(ctx, patientX, baseY - H * 0.075, W);
    this.drawProcedure(ctx, W, H, patientX, baseY);

    // Шаги и прогресс
    this.drawSteps(ctx, W, H);
    this.drawFact(ctx, W, H);

    // Кнопки
    if (this.status === 'waiting') {
      this.buttons.push(createButton(ctx, W * 0.1, H - 46, W * 0.8, 40, '💊 Пойти к врачу', {
        bgColor: '#E74C3C', fgColor: '#fff', fontSize: 16, radius: 15
      }));
    } else if (this.status === 'done') {
      this.buttons.push(createButton(ctx, W * 0.1, H - 46, W * 0.8, 40, '✅ Забрать лечение', {
        bgColor: '#6BCB77', fgColor: '#fff', fontSize: 16, radius: 15
      }));
    }

    this.buttons.push(createButton(ctx, 10, 10, 80, 32, '← Назад', {
      bgColor: 'rgba(0,0,0,0.2)', fgColor: '#fff', fontSize: 13, radius: 8
    }));
  }

  // Врач — тот же персонаж, но в белом халате и шапочке
  drawDoctor(ctx, x, y, W) {
    const g = this.game.gopher;
    if (!g) return;
    const prevHat = g.hat, prevOutfit = g.outfit;
    g.hat = 'scientist';
    g.outfit = null;
    g.setExpression('happy', 8);
    g.draw(ctx, x, y, (W * 0.24) / g.size);

    // Халат ложится на нижнюю часть тела (а не висит отдельной коробкой)
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = '#9DBECD';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x - W * 0.075, y + W * 0.004, W * 0.15, W * 0.072, W * 0.018);
    ctx.fill(); ctx.stroke();
    // воротник и стетоскоп
    ctx.strokeStyle = '#C9DEE9';
    ctx.beginPath();
    ctx.moveTo(x, y + W * 0.008);
    ctx.lineTo(x, y + W * 0.072);
    ctx.stroke();
    ctx.font = `${Math.min(W * 0.045, 20)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🩺', x + W * 0.045, y + W * 0.045);
    ctx.textBaseline = 'alphabetic';
    g.hat = prevHat;
    g.outfit = prevOutfit;
  }

  // Что именно делает врач: своя анимация для каждой процедуры
  drawProcedure(ctx, W, H, px, py) {
    const anim = this.procedure ? this.procedure.anim : 'recipe';
    const step = this.stepIndex();
    const bob = Math.sin(this.time * 0.004) * 4;

    if (anim === 'recipe') {
      // Рецепт: листок со строчками, потом листок летит к пациенту
      const fly = step === 2 ? Math.min(1, this.examProgress * 3 - 2) : 0;
      const x = W * 0.40 + fly * W * 0.20;
      const y = H * 0.40 + bob + fly * H * 0.10;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#9DBECD';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, W * 0.20, H * 0.13, 6);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5B7C8D';
      ctx.lineWidth = 1.5;
      const lines = step === 0 ? 2 : 5;
      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        ctx.moveTo(x + W * 0.02, y + H * 0.025 + i * H * 0.018);
        ctx.lineTo(x + W * 0.18 - (i % 2 ? W * 0.05 : 0), y + H * 0.025 + i * H * 0.018);
        ctx.stroke();
      }
      ctx.font = `${Math.min(W * 0.05, 22)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📝', x + W * 0.10, y - H * 0.02);
      ctx.textBaseline = 'alphabetic';
    } else if (anim === 'injection') {
      // Укол: шприц подходит к лапе, после — пластырь
      const push = step === 0 ? Math.sin(this.time * 0.006) * 6 : (step === 1 ? 14 : 0);
      const sx = px - W * 0.16 + push, sy = py - H * 0.03;
      ctx.fillStyle = '#E8F4F8';
      ctx.strokeStyle = '#7C97A6';
      ctx.lineWidth = 2;
      roundRect(ctx, sx - W * 0.07, sy, W * 0.07, H * 0.022, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#CFE9F5';
      roundRect(ctx, sx, sy, W * 0.05, H * 0.022, 3);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#8FA6B3';
      ctx.beginPath();
      ctx.moveTo(sx - W * 0.07, sy + H * 0.011);
      ctx.lineTo(sx - W * 0.10, sy + H * 0.011);
      ctx.stroke();
      if (step >= 1) {
        ctx.font = `${Math.min(W * 0.045, 20)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🩹', px - W * 0.02, py - H * 0.05);
        ctx.textBaseline = 'alphabetic';
      }
    } else if (anim === 'eyes') {
      // Таблица для проверки зрения и указка врача
      const chW = W * 0.30, chX = W * 0.06, chY = H * 0.32;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#9DBECD';
      ctx.lineWidth = 2;
      roundRect(ctx, chX, chY, chW, H * 0.22, 6);
      ctx.fill(); ctx.stroke();
      const rows = ['Ш', 'Б', 'М', 'Н', 'К', 'Ы'];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      rows.forEach((ch, i) => {
        const size = Math.max(7, Math.min(W * 0.055, 22) - i * 1.8);
        ctx.fillStyle = '#2B3A45';
        ctx.font = `bold ${size}px Arial`;
        ctx.fillText(ch + ' ' + ch, chX + chW / 2, chY + H * 0.025 + i * H * 0.032);
      });
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(chX + chW + W * 0.03, chY + H * 0.03 + H * 0.032 * (step % 6), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.textBaseline = 'alphabetic';
    } else if (anim === 'xray') {
      // Снимок: тёмный экран и светящаяся лапка
      ctx.fillStyle = 'rgba(20,30,45,0.92)';
      roundRect(ctx, W * 0.06, H * 0.31, W * 0.30, H * 0.24, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,220,255,0.9)';
      ctx.lineWidth = 3;
      const gx = W * 0.21, gy = H * 0.43;
      ctx.beginPath();
      ctx.moveTo(gx - W * 0.05, gy - H * 0.04);
      ctx.lineTo(gx - W * 0.03, gy + H * 0.04);
      ctx.moveTo(gx + W * 0.05, gy - H * 0.04);
      ctx.lineTo(gx + W * 0.03, gy + H * 0.04);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(gx, gy - H * 0.05, W * 0.055, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.time * 0.006);
      ctx.fillStyle = 'rgba(180,230,255,0.35)';
      roundRect(ctx, W * 0.06, H * 0.31, W * 0.30, H * 0.24, 8);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (anim === 'bandage') {
      // Перевязка: бинт обматывает лапу
      const wraps = Math.min(4, step + 1);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(4, W * 0.02);
      for (let i = 0; i < wraps; i++) {
        ctx.beginPath();
        ctx.ellipse(px + W * 0.05, py - H * 0.03 + i * H * 0.014, W * 0.045, H * 0.010, -0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (step === 2) {
        ctx.font = `${Math.min(W * 0.045, 20)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎀', px + W * 0.05, py - H * 0.055);
        ctx.textBaseline = 'alphabetic';
      }
    } else if (anim === 'teeth') {
      // Осмотр зубов: фонарик и зеркальце
      ctx.fillStyle = 'rgba(255,240,150,0.45)';
      ctx.beginPath();
      ctx.moveTo(px - W * 0.02, py - H * 0.09);
      ctx.lineTo(px + W * 0.14, py - H * 0.02);
      ctx.lineTo(px + W * 0.05, py - H * 0.01);
      ctx.closePath(); ctx.fill();
      ctx.font = `${Math.min(W * 0.05, 22)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔦', px - W * 0.09 + bob * 0.5, py - H * 0.05);
      ctx.fillText('🦷', px + W * 0.06, py - H * 0.055 + bob);
      ctx.textBaseline = 'alphabetic';
    } else if (anim === 'vitamins') {
      // Витаминки: баночка и горошинки, которые летят к пациенту
      ctx.fillStyle = '#FFB84D';
      roundRect(ctx, W * 0.33, H * 0.40, W * 0.11, H * 0.10, 6);
      ctx.fill();
      ctx.strokeStyle = '#C98A22';
      ctx.lineWidth = 2;
      roundRect(ctx, W * 0.33, H * 0.40, W * 0.11, H * 0.10, 6);
      ctx.stroke();
      const n = Math.min(4, step + 2);
      for (let i = 0; i < n; i++) {
        const p2 = ((this.time * 0.001 + i * 0.25) % 1);
        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.arc(W * 0.45 + p2 * W * 0.14, H * 0.44 - Math.sin(p2 * Math.PI) * H * 0.08, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Градусник: шкала ползёт от 37.2 к 36.6
      const start = 37.2, end = 36.6;
      const val = start + (end - start) * (this.status === 'done' ? 1 : this.examProgress);
      ctx.fillStyle = '#E8F4F8';
      roundRect(ctx, px + W * 0.02, py - H * 0.05, W * 0.04, H * 0.09, 6);
      ctx.fill();
      ctx.strokeStyle = '#7C97A6';
      ctx.lineWidth = 2;
      roundRect(ctx, px + W * 0.02, py - H * 0.05, W * 0.04, H * 0.09, 6);
      ctx.stroke();
      const fillH = H * 0.09 * ((37.4 - val) / 1.0);
      ctx.fillStyle = val > 37 ? '#E74C3C' : '#6BCB77';
      roundRect(ctx, px + W * 0.028, py + H * 0.04 - fillH, W * 0.024, fillH, 4);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2B3A45';
      ctx.font = `bold ${Math.min(W * 0.032, 13)}px Arial`;
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(1) + '°', px - W * 0.06, py - H * 0.02);
      ctx.textBaseline = 'alphabetic';
    }
  }

  // Пациент на кушетке
  drawPatient(ctx, x, y, W) {
    const g = this.game.gopher;
    if (!g) return;
    g.setExpression((System.isSick || this.status !== 'done') ? 'sick' : 'happy', 8);
    g.outfit = null;
    g.heldEmoji = this.status === 'done' ? null : '🤒';
    g.draw(ctx, x, y, (W * 0.24) / g.size);
    g.heldEmoji = null;
  }

  // Три шага процедуры + полоса прогресса
  drawSteps(ctx, W, H) {
    const p = this.procedure;
    const steps = (p && p.steps) ? p.steps : ['Смотрим', 'Лечим', 'Готово'];
    const cur = this.status === 'done' ? steps.length - 1 : this.stepIndex();
    const y = H * 0.665;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    steps.forEach((s, i) => {
      const done = this.status === 'done' || i < cur;
      const now = !done && i === cur && this.status === 'treating';
      ctx.fillStyle = done ? '#2E7D32' : (now ? '#E67E22' : '#7C97A6');
      ctx.font = `${now ? 'bold ' : ''}${Math.min(W * 0.03, 13)}px Arial`;
      ctx.fillText((done ? '✓ ' : (i + 1) + '. ') + s, W / 2, y + i * (H * 0.026));
    });

    const barW = W * 0.72, barH = 12, barX = (W - barW) / 2, barY = H * 0.755;
    ctx.fillStyle = 'rgba(21,101,160,0.18)';
    roundRect(ctx, barX, barY, barW, barH, 6);
    ctx.fill();
    const pct = this.status === 'done' ? 1 : (this.status === 'treating' ? this.examProgress : 0);
    if (pct > 0) {
      ctx.fillStyle = '#3FA9F5';
      roundRect(ctx, barX, barY, Math.max(6, barW * pct), barH, 6);
      ctx.fill();
    }
  }

  // Карточка: что сделали и интересный факт
  drawFact(ctx, W, H) {
    const py = H * 0.79, panelH = H * 0.10;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, W * 0.05, py, W * 0.90, panelH, 12);
    ctx.fill();
    ctx.strokeStyle = '#9DBECD';
    ctx.lineWidth = 1.5;
    roundRect(ctx, W * 0.05, py, W * 0.90, panelH, 12);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1565A0';
    ctx.font = `bold ${Math.min(W * 0.036, 14)}px Arial`;
    const title = this.procedure ? (this.procedure.emoji + ' ' + this.procedure.name) : '🏥 Осмотр';
    ctx.fillText(title, W / 2, py + panelH * 0.30);

    ctx.fillStyle = '#5B7C8D';
    ctx.font = `${Math.min(W * 0.030, 12)}px Arial`;
    const fact = this.treatment ? this.treatment.fact : 'Врач осмотрел гофера и всё проверил.';
    wrapLines(ctx, fact, W * 0.84, 2).forEach((l, i) => {
      ctx.fillText(l, W / 2, py + panelH * 0.62 + i * 13);
    });
    ctx.textBaseline = 'alphabetic';
  }

  wrapText(ctx, text, x, y, maxW, lineH) {
    wrapLines(ctx, text, maxW, 4).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  }

  // ================= НАЖАТИЯ =================
  handleClick(mx, my) {
    const backBtn = this.buttons[this.buttons.length - 1];
    if (backBtn && isPointInRect(mx, my, backBtn.x, backBtn.y, backBtn.w, backBtn.h)) {
      AudioSys.play('click');
      this.game.transitionTo('map');
      return true;
    }

    for (let i = 0; i < this.buttons.length - 1; i++) {
      const btn = this.buttons[i];
      if (!btn || !isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      AudioSys.play('click');

      if (this.status === 'waiting') {
        this.status = 'treating';
        this.examProgress = 0;
      } else if (this.status === 'done') {
        // Применяем лечение
        System.stats.health = Math.min(100, System.stats.health + 30);
        System.stats.happiness = Math.min(100, System.stats.happiness + 10);
        System.relax(15);
        System.isSick = false;
        if (this.treatment) System.markSeen('clinic', this.treatment.id);
        if (this.procedure) System.markSeen('clinicAnim', 'clinicAnim:' + this.procedure.id);
        System.addXP(10);
        System.saveGame();
        const label = this.procedure ? (this.procedure.emoji + ' ' + this.procedure.name) : '💊 Лечение';
        System.showAchievement(label, 'Здоровье восстановлено!');
        this.game.transitionTo('map');
      }
      return true;
    }
    return false;
  }
}
window.ClinicScene = ClinicScene;
