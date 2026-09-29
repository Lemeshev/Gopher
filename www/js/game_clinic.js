// ============ СЦЕНА ПОЛИКЛИНИКИ ============
// Каждый визит — НОВОЕ лечение (случайное из базы контента).
class ClinicScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.status = 'waiting'; // waiting, examining, done
    this.examProgress = 0;
    this.treatment = null;
  }

  init() {
    this.time = 0;
    this.status = 'waiting';
    this.examProgress = 0;
    this.buttons = [];
    this.treatment = this.pickTreatment();
  }

  // Случайное лечение: сначала те, что ещё не назначали
  pickTreatment() {
    if (typeof getRandomItems !== 'function') return null;
    const seen = System.getSeen('clinic');
    const picked = getRandomItems('clinic', 1, seen);
    return picked[0] || null;
  }

  update(dt) {
    this.time += dt;
    if (this.status === 'examining') {
      this.examProgress += dt * 0.002;
      if (this.examProgress >= 1) {
        this.examProgress = 1;
        this.status = 'done';
        AudioSys.play('success');
      }
    }
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;

    // Фон
    ctx.fillStyle = '#E8F4F8';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 0, W, H * 0.3);

    // Медицинские крестики
    ctx.fillStyle = '#E74C3C';
    const crossSize = 15;
    for (let i = 0; i < 4; i++) {
      const cx = W * 0.15 + i * W * 0.22;
      ctx.fillRect(cx - crossSize / 6, H * 0.05 - crossSize / 2, crossSize / 3, crossSize);
      ctx.fillRect(cx - crossSize / 2, H * 0.05 - crossSize / 6, crossSize, crossSize / 3);
    }

    ctx.fillStyle = '#E74C3C';
    ctx.font = `bold ${Math.min(W * 0.055, 26)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('🏥 Поликлиника', W / 2, H * 0.1);

    // XP-бар
    const xpPct = System.xp / System.xpToNext;
    const xpBarY = H * 0.12;
    const xpBarW = W - 20;
    ctx.font = `bold ${Math.min(W * 0.025, 11)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText('⭐ Ур.' + System.level, 10, xpBarY);
    ctx.font = `${Math.min(W * 0.02, 9)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(231,76,60,0.6)';
    ctx.fillText(System.xp + '/' + System.xpToNext, W - 10, xpBarY);
    ctx.fillStyle = 'rgba(231,76,60,0.1)';
    roundRect(ctx, 10, xpBarY + 4, xpBarW, 12, 6);
    ctx.fill();
    if (xpPct > 0) {
      ctx.fillStyle = '#E74C3C';
      roundRect(ctx, 10, xpBarY + 4, xpBarW * xpPct, 12, 6);
      ctx.fill();
    }

    // Доктор
    const doctorY = H * 0.26;
    ctx.fillStyle = '#fff';
    roundRect(ctx, W * 0.28, doctorY - 62, W * 0.44, 124, 20);
    ctx.fill();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    roundRect(ctx, W * 0.28, doctorY - 62, W * 0.44, 124, 20);
    ctx.stroke();

    if (this.game.gopher) {
      this.game.gopher.setExpression('happy', 30);
      const gs = Math.min(W * 0.2, 80);
      ctx.save();
      ctx.translate(W / 2, doctorY);
      ctx.scale(0.6, 0.6);
      this.game.gopher.hat = 'scientist';
      this.game.gopher.draw(ctx, 0, 0, gs / this.game.gopher.size);
      ctx.restore();
      this.game.gopher.hat = null;
    }

    ctx.fillStyle = '#333';
    ctx.font = `bold ${Math.min(W * 0.035, 15)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Доктор Гофер', W / 2, doctorY + 78);

    // Пациент: приболевший вид и градусник в лапе
    if (this.game.gopher) {
      const gopherY = H * 0.58;
      const g = this.game.gopher;
      g.setExpression(System.isSick ? 'sick' : 'sad', 30);
      g.outfit = null;
      g.heldEmoji = '🌡️';
      g.heldTimer = 5;
      const gs2 = Math.min(W * 0.32, 130);
      g.draw(ctx, W * 0.5, gopherY, gs2 / g.size);
      g.heldEmoji = null;
      g.heldTimer = 0;
    }

    // Статус
    ctx.textAlign = 'center';
    if (this.status === 'waiting') {
      ctx.fillStyle = '#333';
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
      ctx.fillText('Гофер выглядит неважно...', W / 2, H * 0.76);
      if (this.treatment) {
        ctx.fillStyle = '#888';
        ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
        ctx.fillText('Врач подготовил: ' + this.treatment.name, W / 2, H * 0.80);
      }
    } else if (this.status === 'examining') {
      ctx.fillStyle = '#4D96FF';
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
      ctx.fillText('Доктор осматривает...', W / 2, H * 0.76);
      drawProgressBar(ctx, W * 0.2, H * 0.79, W * 0.6, 12, this.examProgress * 100, 100, 'rgba(0,0,0,0.1)', '#4D96FF');
    } else if (this.status === 'done') {
      // Карточка лечения
      const panelW = Math.min(W * 0.86, 310);
      const panelH = 128;
      const px = (W - panelW) / 2;
      const py = H * 0.72 - panelH / 2;
      ctx.fillStyle = '#fff';
      roundRect(ctx, px, py, panelW, panelH, 16);
      ctx.fill();
      ctx.strokeStyle = '#6BCB77';
      ctx.lineWidth = 2;
      roundRect(ctx, px, py, panelW, panelH, 16);
      ctx.stroke();

      if (this.treatment) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.min(panelW * 0.16, 42)}px Arial`;
        ctx.fillText(this.treatment.emoji || '💊', W / 2, py + 34);
        ctx.fillStyle = '#1a1a2e';
        ctx.font = `bold ${Math.min(panelW * 0.06, 16)}px Arial`;
        ctx.fillText(this.treatment.name, W / 2, py + 66);
        ctx.fillStyle = '#666';
        ctx.font = `${Math.min(panelW * 0.042, 12)}px Arial`;
        ctx.textBaseline = 'alphabetic';
        this.wrapText(ctx, this.treatment.fact, W / 2, py + 86, panelW - 30, 15);
      } else {
        ctx.fillStyle = '#6BCB77';
        ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
        ctx.fillText('Лечение завершено! 💊', W / 2, py + panelH / 2);
      }
    }

    // Здоровье
    ctx.fillStyle = '#333';
    ctx.font = `bold ${Math.min(W * 0.03, 14)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('🏥 Здоровье: ' + Math.floor(System.stats.health) + '%', W * 0.1, H * 0.885);
    drawProgressBar(ctx, W * 0.1, H * 0.9, W * 0.8, 16, System.stats.health, 100, 'rgba(0,0,0,0.1)', '#E74C3C');

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

  wrapText(ctx, text, x, y, maxW, lineH) {
    const words = String(text || '').split(' ');
    let line = '', cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, cy);
  }

  handleClick(mx, my) {
    // «Назад» — последняя кнопка в массиве
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
        this.status = 'examining';
        this.examProgress = 0;
      } else if (this.status === 'done') {
        // Применяем лечение
        System.stats.health = Math.min(100, System.stats.health + 30);
        System.stats.happiness = Math.min(100, System.stats.happiness + 10);
        System.stats.stress = Math.max(0, System.stats.stress - 15);
        System.isSick = false;
        if (this.treatment) System.markSeen('clinic', this.treatment.id);
        System.addXP(10);
        const label = this.treatment ? (this.treatment.emoji + ' ' + this.treatment.name) : '💊 Лечение';
        System.showAchievement(label, 'Здоровье восстановлено!');
        System.saveGame();
        this.game.transitionTo('map');
      }
      return true;
    }
    return false;
  }
}
window.ClinicScene = ClinicScene;
