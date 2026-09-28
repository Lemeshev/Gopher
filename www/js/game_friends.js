// ============ СЦЕНА ДРУЗЕЙ (коды обмена для визитов) ============
class FriendsScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.tab = 'list'; // 'list' | 'mycode' | 'add' | 'visit'
    this.inputText = '';
    this.inputCursor = 0;
    this.friendVisitData = null;
    this.notification = null;
    this.notifTimer = 0;
  }

  init() {
    this.buttons = [];
    this.tab = 'list';
    this.inputText = '';
    this.notification = null;
    this.notifTimer = 0;
    this.friendVisitData = null;
  }

  update(dt) {
    if (this.notifTimer > 0) { this.notifTimer -= dt; if (this.notifTimer <= 0) this.notification = null; }
  }

  showNotif(text) { this.notification = text; this.notifTimer = 2000; }

  draw(ctx, W, H) {
    this.buttons = [];

    // Background
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#FFD93D'; ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`; ctx.textAlign = 'center';
    ctx.fillText('🧑‍🤝‍🧑 Друзья', W / 2, 36);

    // Back
    this.buttons.push(createButton(ctx, 10, 10, 80, 32, '← Назад', { bgColor: 'rgba(255,255,255,0.15)', fgColor: '#fff', fontSize: 13, radius: 8 }));

    if (this.tab === 'mycode') { this.drawMyCode(ctx, W, H); return; }
    if (this.tab === 'add') { this.drawAddFriend(ctx, W, H); return; }
    if (this.tab === 'visit' && this.friendVisitData) { this.drawFriendHome(ctx, W, H); return; }

    // List tab
    const friends = System.friends || [];
    const btnW = Math.min(W * 0.8, 260);
    const btnX = (W - btnW) / 2;

    // My Code button
    this.buttons.push(createButton(ctx, btnX, 60, btnW, 42, '📋 Мой код', { bgColor: '#4D96FF', fgColor: '#fff', fontSize: 14, radius: 10 }));

    // Add Friend button
    this.buttons.push(createButton(ctx, btnX, 110, btnW, 42, '➕ Добавить друга', { bgColor: '#6BCB77', fgColor: '#fff', fontSize: 14, radius: 10 }));

    // Friends list
    if (friends.length === 0) {
      ctx.fillStyle = '#888'; ctx.font = `${Math.min(W * 0.035, 14)}px Arial`; ctx.textAlign = 'center';
      ctx.fillText('Пока нет друзей', W / 2, 180);
      ctx.fillText('Обменяйтесь кодами, чтобы подружиться!', W / 2, 200);
    } else {
      let fy = 170;
      ctx.fillStyle = '#aaa'; ctx.font = `${Math.min(W * 0.03, 12)}px Arial`; ctx.textAlign = 'center';
      ctx.fillText(`Друзей: ${friends.length}`, W / 2, fy - 10);
      friends.forEach((f, i) => {
        if (fy + 45 > H - 20) return;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.roundRect(btnX, fy, btnW, 40, 10); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `${Math.min(W * 0.035, 14)}px Arial`; ctx.textAlign = 'left';
        ctx.fillText(`🐹 ${f.name || 'Гофер'} (Ур.${f.level || 1})`, btnX + 12, fy + 25);
        // Visit button
        this.buttons.push(createButton(ctx, btnX + btnW - 80, fy + 5, 70, 30, '🏠 В гости', { bgColor: '#FF8C42', fgColor: '#fff', fontSize: 11, radius: 8 }));
        fy += 48;
      });
    }
  }

  drawMyCode(ctx, W, H) {
    const code = System.getMyCode();
    const panelW = Math.min(W * 0.85, 300);
    const panelH = 200;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1e2a4a'; ctx.beginPath(); ctx.roundRect(px, py, panelW, panelH, 16); ctx.fill();
    ctx.strokeStyle = '#4D96FF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(px, py, panelW, panelH, 16); ctx.stroke();

    ctx.fillStyle = '#4D96FF'; ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`; ctx.textAlign = 'center';
    ctx.fillText('📋 Ваш код', W / 2, py + 35);

    ctx.fillStyle = '#FFD93D'; ctx.font = `${Math.min(W * 0.025, 10)}px Arial`;
    // Show code in chunks
    const chunkSize = 20;
    for (let i = 0; i < code.length; i += chunkSize) {
      const row = Math.floor(i / chunkSize);
      ctx.fillText(code.substring(i, i + chunkSize), W / 2, py + 60 + row * 14);
    }

    this.buttons.push(createButton(ctx, px + 20, py + panelH - 90, panelW - 40, 36, '📋 Копировать', { bgColor: '#4D96FF', fgColor: '#fff', fontSize: 13, radius: 10 }));
    this.buttons.push(createButton(ctx, px + 20, py + panelH - 48, panelW - 40, 36, '← Закрыть', { bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 10 }));
  }

  drawAddFriend(ctx, W, H) {
    const panelW = Math.min(W * 0.85, 300);
    const panelH = 180;
    const px = (W - panelW) / 2;
    const py = (H - panelH) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1e2a4a'; ctx.beginPath(); ctx.roundRect(px, py, panelW, panelH, 16); ctx.fill();
    ctx.strokeStyle = '#6BCB77'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(px, py, panelW, panelH, 16); ctx.stroke();

    ctx.fillStyle = '#6BCB77'; ctx.font = `bold ${Math.min(W * 0.045, 18)}px Arial`; ctx.textAlign = 'center';
    ctx.fillText('➕ Введите код друга', W / 2, py + 35);

    // Input field
    ctx.fillStyle = '#0a0a1a'; ctx.beginPath(); ctx.roundRect(px + 20, py + 50, panelW - 40, 36, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `${Math.min(W * 0.025, 11)}px Arial`; ctx.textAlign = 'left';
    const displayText = this.inputText.length > 30 ? '...' + this.inputText.slice(-27) : this.inputText;
    ctx.fillText(displayText || 'Вставьте код здесь...', px + 28, py + 73);

    this.buttons.push(createButton(ctx, px + 20, py + 100, (panelW - 50) / 2, 34, '📋 Вставить', { bgColor: '#6BCB77', fgColor: '#fff', fontSize: 13, radius: 10 }));
    this.buttons.push(createButton(ctx, px + 30 + (panelW - 50) / 2, py + 100, (panelW - 50) / 2, 34, '✅ Добавить', { bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 13, radius: 10 }));
    this.buttons.push(createButton(ctx, px + 20, py + panelH - 48, panelW - 40, 36, '← Закрыть', { bgColor: 'rgba(255,255,255,0.2)', fgColor: '#fff', fontSize: 13, radius: 10 }));
  }

  drawFriendHome(ctx, W, H) {
    const f = this.friendVisitData;
    ctx.fillStyle = '#2a3a2a'; ctx.fillRect(0, 0, W, H);

    // Floor
    ctx.fillStyle = '#D2B48C'; ctx.fillRect(0, H * 0.56, W, H * 0.44);

    // Friend name
    ctx.fillStyle = '#FFD93D'; ctx.font = `bold ${Math.min(W * 0.045, 20)}px Arial`; ctx.textAlign = 'center';
    ctx.fillText(`🏠 Дом ${f.name || 'Гофера'}`, W / 2, 50);

    // Level + stats
    ctx.fillStyle = '#aaa'; ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillText(`Уровень ${f.level || 1} | 🪙 ${f.coins || 0}`, W / 2, 72);

    // Stats bars
    if (f.stats) {
      const barW = Math.min(W * 0.6, 180);
      const barX = (W - barW) / 2;
      let sy = 90;
      const statLabels = [
        { key: 'happiness', label: '😊', color: '#FFD93D' },
        { key: 'hunger', label: '🍔', color: '#FF8C42' },
        { key: 'energy', label: '⚡', color: '#4D96FF' },
        { key: 'health', label: '❤️', color: '#E74C3C' }
      ];
      statLabels.forEach(s => {
        const val = f.stats[s.key] || 0;
        ctx.fillStyle = '#555'; ctx.beginPath(); ctx.roundRect(barX, sy, barW, 14, 7); ctx.fill();
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.roundRect(barX, sy, barW * val / 100, 14, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '11px Arial'; ctx.textAlign = 'left';
        ctx.fillText(`${s.label} ${Math.round(val)}`, barX + 4, sy + 11);
        sy += 20;
      });
    }

    // Decor
    if (f.homeDecor && f.homeDecor.length > 0) {
      const floorY = H * 0.56;
      const floorH = H * 0.44;
      const cols = Math.ceil(Math.sqrt(f.homeDecor.length));
      const rows = Math.ceil(f.homeDecor.length / cols);
      const cellW = W / cols;
      const cellH = floorH / rows;
      f.homeDecor.forEach((d, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = col * cellW + cellW / 2, cy = floorY + row * cellH + cellH / 2;
        ctx.font = `${Math.min(cellW * 0.5, cellH * 0.5, 28)}px Arial`; ctx.textAlign = 'center';
        ctx.fillText(d.emoji, cx, cy + 6);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `${Math.min(cellW * 0.12, 9)}px Arial`;
        ctx.fillText(d.name, cx, cy + 20);
      });
    } else {
      ctx.fillStyle = '#888'; ctx.font = `${Math.min(W * 0.035, 14)}px Arial`; ctx.textAlign = 'center';
      ctx.fillText('Пока пусто...', W / 2, H * 0.7);
    }

    // Notification
    if (this.notification) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = '#FFD93D'; ctx.font = `${Math.min(W * 0.035, 14)}px Arial`; ctx.textAlign = 'center';
      ctx.fillText(this.notification, W / 2, H - 25);
    }

    this.buttons.push(createButton(ctx, 10, 10, 80, 32, '← Назад', { bgColor: 'rgba(255,255,255,0.15)', fgColor: '#fff', fontSize: 13, radius: 8 }));
  }

  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      AudioSys.play('click');
      const t = btn.text || '';

      if (t === '← Назад') {
        if (this.tab !== 'list') { this.tab = 'list'; this.friendVisitData = null; }
        else { this.game.transitionTo('map'); }
        return true;
      }
      if (t === '← Закрыть') { this.tab = 'list'; return true; }
      if (t === '📋 Мой код') { this.tab = 'mycode'; return true; }
      if (t === '➕ Добавить друга') { this.tab = 'add'; this.inputText = ''; return true; }
      if (t === '📋 Копировать') {
        const code = System.getMyCode();
        if (navigator.clipboard) { navigator.clipboard.writeText(code).then(() => this.showNotif('Скопировано!')); }
        else { this.showNotif('Код: скопируйте вручную'); }
        return true;
      }
      if (t === '📋 Вставить') {
        if (navigator.clipboard) { navigator.clipboard.readText().then(t => { this.inputText = t; }).catch(() => this.showNotif('Нет доступа к буферу')); }
        return true;
      }
      if (t === '✅ Добавить') {
        if (this.inputText.trim()) {
          const ok = System.addFriend(this.inputText.trim());
          if (ok) { this.showNotif('Друг добавлен!'); this.tab = 'list'; }
          else { this.showNotif('Неверный код или друг уже есть'); }
        }
        return true;
      }
      if (t === '🏠 В гости') {
        // Find which friend by button position
        const friends = System.friends || [];
        const btnW = Math.min(this.game.width * 0.8, 260);
        const btnX = (this.game.width - btnW) / 2;
        let fy = 170;
        for (let i = 0; i < friends.length; i++) {
          if (Math.abs(btn.y - (fy + 5)) < 5 && Math.abs(btn.x - (btnX + btnW - 80)) < 5) {
            this.friendVisitData = friends[i];
            this.tab = 'visit';
            break;
          }
          fy += 48;
        }
        return true;
      }
      return true;
    }
    return false;
  }
}

window.FriendsScene = FriendsScene;
