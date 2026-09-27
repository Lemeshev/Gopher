// ============ СЦЕНА ПОЛИКЛИНИКИ ============
class ClinicScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.time = 0;
    this.doctorExpression = 'neutral';
    this.status = 'waiting'; // waiting, examining, treating, done
    this.examProgress = 0;
  }

  init() {
    this.time = 0;
    this.status = 'waiting';
    this.examProgress = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.status === 'examining') {
      this.examProgress += dt * 0.002;
      if (this.examProgress >= 1) {
        this.examProgress = 1;
        this.status = 'done';
      }
    }
  }

  draw(ctx) {
    this.buttons = [];
    const W = this.game.width;
    const H = this.game.height;
    this.buttons = [];

    // Background
    ctx.fillStyle = '#E8F4F8';
    roundRect(ctx, 0, 0, W, H, 0);
    ctx.fill();

    // Walls with cross pattern
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 0, W, H * 0.3);

    // Medical cross
    ctx.fillStyle = '#E74C3C';
    const crossSize = 15;
    for (let i = 0; i < 4; i++) {
      const cx = W * 0.15 + i * W * 0.22;
      ctx.fillRect(cx - crossSize / 6, H * 0.05 - crossSize / 2, crossSize / 3, crossSize);
      ctx.fillRect(cx - crossSize / 2, H * 0.05 - crossSize / 6, crossSize, crossSize / 3);
    }

    // Title
    ctx.fillStyle = '#E74C3C';
    ctx.font = `bold ${Math.min(W * 0.055, 26)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🏥 Поликлиника', W / 2, H * 0.1);

    // === XP ПРОГРЕСС-БАР В КЛИНИКЕ ===
    const clinicXpPct = System.xp / System.xpToNext;
    const clinicXpBarY = H * 0.12;
    const clinicXpBarW = W - 20;
    const clinicXpBarH = 12;

    ctx.font = `bold ${Math.min(W * 0.025, 11)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText('⭐ Ур.' + System.level, 10, clinicXpBarY);

    ctx.font = `${Math.min(W * 0.02, 9)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(231,76,60,0.6)';
    ctx.fillText(System.xp + '/' + System.xpToNext, W - 10, clinicXpBarY);

    ctx.fillStyle = 'rgba(231,76,60,0.1)';
    roundRect(ctx, 10, clinicXpBarY + 4, clinicXpBarW, clinicXpBarH, 6);
    ctx.fill();

    if (clinicXpPct > 0) {
      ctx.fillStyle = '#E74C3C';
      roundRect(ctx, 10, clinicXpBarY + 4, clinicXpBarW * clinicXpPct, clinicXpBarH, 6);
      ctx.fill();
    }

    // Doctor
    const doctorY = H * 0.25;
    ctx.fillStyle = '#fff';
    roundRect(ctx, W * 0.3, doctorY - 60, W * 0.4, 120, 20);
    ctx.fill();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    roundRect(ctx, W * 0.3, doctorY - 60, W * 0.4, 120, 20);
    ctx.stroke();

    // Doctor face
    this.game.gopher.setExpression('happy', 30);
    const gs = Math.min(W * 0.2, 80);
    ctx.save();
    ctx.translate(W / 2, doctorY);
    ctx.scale(0.6, 0.6);
    this.game.gopher.hat = 'scientist';
    this.game.gopher.draw(ctx, 0, 0, gs / this.game.gopher.size);
    ctx.restore();
    this.game.gopher.hat = null;

    // Doctor name
    ctx.fillStyle = '#333';
    ctx.font = `bold ${Math.min(W * 0.035, 15)}px Arial`;
    ctx.fillText('Доктор Гофер', W / 2, doctorY + 75);

    // Gopher patient
    if (this.game.gopher) {
      const gopherY = H * 0.6;
      this.game.gopher.setExpression(System.isSick ? 'sick' : 'sad', 30);
      const gs2 = Math.min(W * 0.35, 140);
      this.game.gopher.draw(ctx, W * 0.5, gopherY, gs2 / this.game.gopher.size);
    }

    // Status text
    if (this.status === 'waiting') {
      ctx.fillStyle = '#333';
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
      ctx.fillText('Гофер выглядит неважно...', W / 2, H * 0.75);
    } else if (this.status === 'examining') {
      ctx.fillStyle = '#4D96FF';
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
      ctx.fillText('Докторexamинирует...', W / 2, H * 0.75);
    } else if (this.status === 'done') {
      ctx.fillStyle = '#6BCB77';
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px Arial`;
      ctx.fillText('Лечение завершено! 💊', W / 2, H * 0.75);
    }

    // Health bar
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.03, 14)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('🏥 Здоровье: ' + Math.floor(System.stats.health) + '%', W * 0.1, H * 0.85);
    drawProgressBar(ctx, W * 0.1, H * 0.87, W * 0.8, 18, System.stats.health, 100, 'rgba(0,0,0,0.1)', '#E74C3C');

    // Buttons
    if (this.status === 'waiting') {
      this.buttons.push(createButton(ctx, W * 0.1, H * 0.9, W * 0.8, 45, '💊 Пойти к врачу', {
        bgColor: '#E74C3C',
        fontSize: 16,
        radius: 15
      }));
    } else if (this.status === 'done') {
      this.buttons.push(createButton(ctx, W * 0.1, H * 0.9, W * 0.8, 45, '✅ Выход', {
        bgColor: '#6BCB77',
        fontSize: 16,
        radius: 15
      }));
    }

    // Back button always
    this.buttons.push(createButton(ctx, 10, 10, 80, 36, '← Назад', {
      bgColor: 'rgba(0,0,0,0.2)',
      fgColor: '#fff',
      fontSize: 14,
      radius: 10
    }));
  }

  handleClick(mx, my) {
    AudioSys.play('click');

    // Check clinic buttons
    for (let i = 1; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (!btn) continue;
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        if (this.status === 'waiting') {
          this.status = 'examining';
          this.examProgress = 0;
          AudioSys.play('success');
        } else if (this.status === 'done') {
          System.stats.health = Math.min(100, System.stats.health + 30);
          System.isSick = false;
          System.stats.happiness = Math.min(100, System.stats.happiness + 10);
          System.addXP(10);
          System.saveGame();
          this.game.transitionTo('map');
          return true;
        }
        return true;
      }
    }

    // Back button
    if (this.buttons[0]) {
      const btn = this.buttons[0];
      if (isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        this.game.transitionTo('map');
        return true;
      }
    }

    return false;
  }
}
window.ClinicScene = ClinicScene;
