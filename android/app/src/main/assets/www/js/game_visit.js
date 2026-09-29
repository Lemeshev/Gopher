// ============ СЦЕНА ПОСЕЩЕНИЯ ЛОКАЦИИ ============
// Музеи — это ХАБ: сначала выбираем музей, потом осматриваем экспонаты.
// Каждое посещение показывает свежую подборку из общей базы контента
// (приоритет отдаётся тем предметам, что ещё не попадались).

const MUSEUM_KEYS = ['art_museum', 'nature_museum', 'space_museum', 'history_museum'];

const VISIT_DATA = {
  // ----- ХАБ МУЗЕЕВ -----
  museums: {
    name: '🏛️ Музеи', bg: '#12122a', kind: 'hub',
    intro: 'Какой музей посетим?',
    sub: [
      { id: 'art_museum', emoji: '🖼️', name: 'Художественный', desc: 'Живопись и скульптура', color: '#E91E63' },
      { id: 'nature_museum', emoji: '🦕', name: 'Музей природы', desc: 'Животные и минералы', color: '#4CAF50' },
      { id: 'space_museum', emoji: '🚀', name: 'Космический', desc: 'Планеты, звёзды, ракеты', color: '#3F51B5' },
      { id: 'history_museum', emoji: '🏺', name: 'Исторический', desc: 'Артефакты и эпохи', color: '#8D6E63' }
    ]
  },

  // ----- МУЗЕИ -----
  art_museum: {
    name: '🖼️ Художественный музей', bg: '#1a1a2e', kind: 'browse',
    content: 'art_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за картину',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  nature_museum: {
    name: '🦕 Музей природы', bg: '#16301c', kind: 'browse',
    content: 'nature_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  space_museum: {
    name: '🚀 Космический музей', bg: '#0a0a2a', kind: 'browse',
    content: 'space_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  history_museum: {
    name: '🏺 Исторический музей', bg: '#2b1f14', kind: 'browse',
    content: 'history_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за артефакт',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },

  // ----- БИБЛИОТЕКА -----
  library: {
    name: '📚 Библиотека', bg: '#152a1b', kind: 'browse',
    content: 'library', count: 12, energyCost: 8,
    perItem: '+1 интеллект за книгу',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 8, label: 'Интеллект +8' }
  },

  // ----- РАБОТА -----
  work: {
    name: '💼 Работа', bg: '#1d2338', kind: 'work',
    content: 'work', count: 6, energyCost: 25,
    perItem: 'задание приносит монеты',
    reward: { stat: 'schoolSkill', amount: 0, label: 'Смена окончена' },
    xp: 12
  },

  // ----- УЧЁБА -----
  school: {
    name: '🎓 Учёба', bg: '#26224a', kind: 'browse',
    content: 'school', count: 12, energyCost: 20,
    perItem: '+1 интеллект за тему',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'schoolSkill', amount: 4, label: 'Учебный навык +4' }
  },

  // ----- РЕСТОРАН -----
  restaurant: {
    name: '🍽️ Ресторан', bg: '#2a1616', kind: 'eat',
    content: 'restaurant', count: 9,
    perItem: 'блюдо утоляет голод',
    perItemReward: { stat: 'hunger', amount: 5 },
    reward: { stat: 'hunger', amount: 25, label: 'Сытость +25' }
  },

  // ----- ПАРК -----
  park: {
    name: '🎢 Парк', bg: '#1b3a20', kind: 'browse',
    content: 'park', count: 12, energyCost: 18,
    perItem: '+1 счастье за аттракцион',
    perItemReward: { stat: 'happiness', amount: 1 },
    reward: { stat: 'happiness', amount: 15, label: 'Счастье +15' }
  },

  // ----- КИНО -----
  cinema: {
    name: '🎬 Кинотеатр', bg: '#0a0a18', kind: 'browse',
    content: 'cinema', count: 9, energyCost: 10,
    perItem: '+1 счастье за фильм',
    perItemReward: { stat: 'happiness', amount: 1 },
    reward: { stat: 'happiness', amount: 15, label: 'Счастье +15' }
  },

  // ----- БАССЕЙН -----
  pool: {
    name: '🏊 Бассейн', bg: '#0b2a3a', kind: 'browse',
    content: 'pool', count: 12, energyCost: 15,
    perItem: '+2 чистоты за занятие',
    perItemReward: { stat: 'cleanliness', amount: 2 },
    reward: { stat: 'cleanliness', amount: 20, label: 'Чистота +20' }
  },

  // ----- СПОРТЗАЛ -----
  gym: {
    name: '🏋️ Спортзал', bg: '#22222a', kind: 'browse',
    content: 'gym', count: 12, energyCost: 20,
    perItem: '+1 здоровье за упражнение',
    perItemReward: { stat: 'health', amount: 1 },
    reward: { stat: 'health', amount: 10, label: 'Здоровье +10' }
  }
};

class VisitScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.state = 'browse';       // 'hub' | 'browse' | 'fact'
    this.locationId = null;
    this.data = null;
    this.items = [];
    this.viewed = [];
    this.selected = null;
    this.rewardClaimed = false;
    this.animTime = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.backTarget = 'map';
    this.totalInBase = 0;
    this.freshCount = 0;
    this.page = 0;
  }

  init(locationKey) {
    this.buttons = [];
    this.locationId = locationKey;
    this.data = VISIT_DATA[locationKey] || null;
    this.items = [];
    this.viewed = [];
    this.selected = null;
    this.rewardClaimed = false;
    this.animTime = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.page = 0;

    if (!this.data) {
      this.data = {
        name: '📍 Локация', bg: '#242438', kind: 'browse', count: 0, content: null,
        reward: { stat: 'happiness', amount: 3, label: 'Счастье +3' }
      };
    }

    // Куда вернёмся по «Назад»: из музея — в хаб, из хаба и прочих — на карту
    const isMuseum = MUSEUM_KEYS.indexOf(locationKey) !== -1;
    this.backTarget = isMuseum ? 'museums' : 'map';

    if (this.data.kind === 'hub') {
      this.state = 'hub';
      return;
    }

    this.state = 'browse';
    this.loadItems();

    // Оплата энергией за посещение (один раз при входе)
    if (this.data.energyCost) {
      System.stats.energy = Math.max(0, System.stats.energy - this.data.energyCost);
      System.saveGame();
    }
  }

  // Загрузить случайную подборку предметов для этой локации
  loadItems() {
    const d = this.data;
    if (!d.content) { this.items = []; return; }
    this.totalInBase = (typeof contentSize === 'function') ? contentSize(d.content) : 0;
    const seen = System.getSeen(d.content);
    const picked = (typeof getRandomItems === 'function') ? getRandomItems(d.content, d.count || 12, seen) : [];
    this.items = picked;
    this.page = 0;
    this.freshCount = picked.filter(it => !System.hasSeen(d.content, it.id)).length;
  }

  setToast(msg) {
    this.toast = msg;
    this.toastTimer = 1.8;
  }

  update(dt) {
    this.animTime += dt;
    if (this.toastTimer > 0) {
      this.toastTimer -= dt / 1000;
      if (this.toastTimer <= 0) this.toast = '';
    }
  }

  // ================= ОТРИСОВКА =================
  draw(ctx) {
    const W = this.game.width, H = this.game.height;
    this.buttons = [];
    const d = this.data;

    ctx.fillStyle = d.bg || '#242438';
    ctx.fillRect(0, 0, W, H);

    // Фоновая полоса «пола»
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, H * 0.78, W, H * 0.22);

    const title = (d.name || 'Локация').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.048, 21)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, W / 2, 34);

    this.buttons.push(createButton(ctx, 10, 10, 78, 32, '← Назад', {
      bgColor: 'rgba(255,255,255,0.15)', fgColor: '#fff', fontSize: 13, radius: 8
    }));

    if (this.state === 'hub') {
      this.drawHub(ctx, W, H);
      return;
    }

    if (this.state === 'fact' && this.selected !== null) {
      this.drawGrid(ctx, W, H);
      this.drawFactOverlay(ctx, W, H);
      return;
    }

    this.drawGrid(ctx, W, H);
  }

  // ----- Хаб музеев -----
  drawHub(ctx, W, H) {
    const d = this.data;
    ctx.fillStyle = '#b9c3ff';
    ctx.font = `${Math.min(W * 0.036, 15)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(d.intro || 'Выбери:', W / 2, 62);

    const btnW = Math.min(W * 0.86, 320);
    const btnH = Math.min(H * 0.14, 92);
    const btnX = (W - btnW) / 2;
    const startY = 80;

    d.sub.forEach((m, i) => {
      const y = startY + i * (btnH + 14);
      ctx.fillStyle = m.color;
      roundRect(ctx, btnX, y, btnW, btnH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      roundRect(ctx, btnX, y, btnW, btnH, 16);
      ctx.stroke();

      ctx.font = `${Math.min(btnH * 0.46, 40)}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(m.emoji, btnX + 16, y + btnH / 2);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.042, 17)}px Arial`;
      ctx.fillText(m.name, btnX + 68, y + btnH / 2 - 10);

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.font = `${Math.min(W * 0.031, 13)}px Arial`;
      ctx.fillText(m.desc, btnX + 68, y + btnH / 2 + 12);

      const seen = System.seenCount(m.id);
      const total = (typeof contentSize === 'function') ? contentSize(m.id) : 0;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${Math.min(W * 0.028, 12)}px Arial`;
      ctx.fillText(seen + '/' + total, btnX + btnW - 14, y + btnH - 16);

      this.buttons.push({ x: btnX, y, w: btnW, h: btnH, text: 'museum_' + m.id });
    });
  }

  // ----- Сетка экспонатов/заданий -----
  drawGrid(ctx, W, H) {
    const d = this.data;
    const n = this.items.length;
    const viewed = this.viewed.length;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if (this.totalInBase > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
      ctx.fillText(`Новые: ${this.freshCount} · Всего в базе: ${this.totalInBase}`, W / 2, 50);
    }
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillText(`Изучено: ${viewed}/${n}`, W / 2, 67);

    // ---- Сцена локации: гофер в правильном виде ----
    const stageTop = 76;
    const stageH = Math.min(H * 0.23, 152);
    if (typeof LocationStage !== 'undefined') {
      LocationStage.draw(ctx, { x: 0, y: stageTop, w: W, h: stageH }, this.locationId, this.game.gopher, this.animTime);
    }

    if (n === 0) {
      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.034, 14)}px Arial`;
      ctx.fillText('Здесь пока нечего смотреть', W / 2, stageTop + stageH + 50);
      return;
    }

    const perPage = 6;
    const pages = Math.max(1, Math.ceil(n / perPage));
    if (this.page >= pages) this.page = 0;
    const from = this.page * perPage;
    const pageItems = this.items.slice(from, from + perPage);

    const cols = 3;
    const rows = Math.ceil(pageItems.length / cols);
    const gap = 8;
    const gridTop = stageTop + stageH + 10;
    // Внизу всегда живут кнопка награды, «другая подборка» и листание —
    // сетка не должна залезать на них (иначе клик открывает предмет вместо кнопки)
    const gridBottom = H - 140;
    const cellW = Math.min((W - 24 - (cols - 1) * gap) / cols, 130);
    // Не растягиваем карточки на весь экран и центрируем сетку по вертикали
    const cellH = Math.min((gridBottom - gridTop - (rows - 1) * gap) / Math.max(rows, 1), 132);
    const gridH = rows * cellH + (rows - 1) * gap;
    const gridY = gridTop + Math.max(0, (gridBottom - gridTop - gridH) / 2);
    const gridW = cols * cellW + (cols - 1) * gap;
    const startX = (W - gridW) / 2;

    pageItems.forEach((item, i) => {
      const gi = from + i;
      const col = i % cols, row = Math.floor(i / cols);
      const cx = startX + col * (cellW + gap);
      const cy = gridY + row * (cellH + gap);
      const isViewed = this.viewed.indexOf(gi) !== -1;
      const isNew = !System.hasSeen(d.content, item.id);

      ctx.fillStyle = isViewed ? 'rgba(107,203,119,0.22)' : 'rgba(255,255,255,0.10)';
      roundRect(ctx, cx, cy, cellW, cellH, 12);
      ctx.fill();
      ctx.strokeStyle = isViewed ? '#6BCB77' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = isViewed ? 2 : 1;
      roundRect(ctx, cx, cy, cellW, cellH, 12);
      ctx.stroke();

      if (isNew && d.kind === 'browse') {
        ctx.fillStyle = 'rgba(255,217,61,0.9)';
        roundRect(ctx, cx + 5, cy + 5, 22, 13, 6);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('NEW', cx + 8, cy + 15);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(cellW * 0.34, 30)}px Arial`;
      ctx.fillText(item.emoji, cx + cellW / 2, cy + cellH * 0.32);

      const nameSize = fitFontSize(ctx, item.name, cellW - 10, Math.min(cellW * 0.115, 12), 8, false);
      ctx.font = `${nameSize}px Arial`;
      ctx.fillStyle = isViewed ? '#9BE3A5' : '#fff';
      const lines = wrapLines(ctx, item.name, cellW - 10, 2);
      const firstLine = cy + cellH * (lines.length > 1 ? 0.58 : 0.64);
      lines.forEach((ln, li) => ctx.fillText(ln, cx + cellW / 2, firstLine + li * (nameSize + 1)));

      let sub = null;
      if (d.kind === 'work') sub = '🪙' + (item.coins || 12);
      if (sub) {
        ctx.fillStyle = '#FFD93D';
        ctx.font = `bold ${Math.min(cellW * 0.1, 11)}px Arial`;
        ctx.fillText(sub, cx + cellW / 2, cy + cellH - 12);
      }

      if (isViewed) {
        ctx.fillStyle = '#6BCB77';
        ctx.font = '13px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('✓', cx + cellW - 7, cy + cellH - 10);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      this.buttons.push({ x: cx, y: cy, w: cellW, h: cellH, text: 'item_' + gi });
    });

    // Итоговая награда
    if (viewed >= n && !this.rewardClaimed) {
      const label = '🎁 ' + (d.reward && d.reward.label ? d.reward.label : 'Награда');
      this.buttons.push(createButton(ctx, W / 2 - 100, H - 84, 200, 38, label, {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 14, radius: 12
      }));
    } else if (this.rewardClaimed) {
      ctx.fillStyle = '#6BCB77';
      ctx.font = `${Math.min(W * 0.033, 13)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('✅ Награда получена', W / 2, H - 62);
    }

    // Листание подборки
    if (pages > 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `bold ${Math.min(W * 0.031, 13)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Подборка ' + (this.page + 1) + ' / ' + pages, W / 2, H - 20);
      ctx.textBaseline = 'alphabetic';
      this.buttons.push(createButton(ctx, 14, H - 36, 48, 32, '◀', {
        bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 15, radius: 9
      }));
      this.buttons.push(createButton(ctx, W - 62, H - 36, 48, 32, '▶', {
        bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 15, radius: 9
      }));
    }

    // Всё посмотрели — можно взять другую подборку
    if (viewed >= n) {
      this.buttons.push(createButton(ctx, W / 2 - 92, H - 130, 184, 32,
        '🔄 Другая подборка', { bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 12, radius: 10 }));
    }

    if (this.toast) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      roundRect(ctx, W / 2 - 130, 40, 260, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(W * 0.03, 13)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.toast, W / 2, 58);
    }
  }

  drawFactOverlay(ctx, W, H) {
    const item = this.items[this.selected];
    if (!item) return;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);
    const panelW = Math.min(W * 0.86, 310);
    const panelH = 230;
    const px = (W - panelW) / 2, py = (H - panelH) / 2;
    ctx.fillStyle = '#1e2a4a';
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.fill();
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(panelW * 0.16, 44)}px Arial`;
    ctx.fillText(item.emoji, W / 2, py + 44);

    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(panelW * 0.058, 17)}px Arial`;
    const title = this.truncate(ctx, item.name, panelW - 30);
    ctx.fillText(title, W / 2, py + 82);

    ctx.fillStyle = '#e6e6f0';
    ctx.font = `${Math.min(panelW * 0.042, 13.5)}px Arial`;
    ctx.textBaseline = 'alphabetic';
    this.wrapText(ctx, item.fact || '', W / 2, py + 108, panelW - 34, 17);

    const d = this.data;
    if (d.kind === 'work') {
      ctx.fillStyle = '#6BCB77';
      ctx.font = `bold ${Math.min(panelW * 0.05, 14)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Оплата: 🪙' + (item.coins || 12) + (item.id && System.hasSeen(d.content, item.id) ? ' (повтор)' : ''), W / 2, py + panelH - 62);
    }

    this.buttons.push(createButton(ctx, px + 20, py + panelH - 48, panelW - 40, 38,
      (d.kind === 'work' ? '💼 Взять задание' : 'Понятно!'),
      { bgColor: '#6BCB77', fgColor: '#fff', fontSize: 14, radius: 10 }));
  }

  wrapText(ctx, text, x, y, maxW, lineH) {
    const words = String(text).split(' ');
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

  truncate(ctx, text, maxW) {
    let t = String(text == null ? '' : text);
    if (ctx.measureText(t).width <= maxW) return t;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) {
      t = t.slice(0, -1);
    }
    return t + '…';
  }

  // ================= ОБРАБОТКА НАЖАТИЙ =================
  handleClick(mx, my) {
    // Карточка экспоната перекрывает сетку: пока она открыта, сетка не кликается
    if (this.state === 'fact') {
      for (const b of this.buttons) {
        const bt = b.text || '';
        if (bt !== 'Понятно!' && bt.indexOf('Взять задание') === -1) continue;
        if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
        AudioSys.play('click');
        this.state = 'browse';
        this.selected = null;
        return true;
      }
      return true;
    }

    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const t = btn.text || '';

      if (t === '← Назад') {
        AudioSys.play('click');
        if (this.backTarget === 'museums') this.game.transitionTo('visit', 'museums');
        else this.game.transitionTo('map');
        return true;
      }

      // Выбор музея в хабе
      if (t.indexOf('museum_') === 0) {
        AudioSys.play('click');
        this.game.transitionTo('visit', t.slice(7));
        return true;
      }

      // Листание подборок
      if (t === '◀' || t === '▶') {
        AudioSys.play('click');
        const pages = Math.max(1, Math.ceil(this.items.length / 6));
        this.page = t === '◀' ? Math.max(0, this.page - 1) : Math.min(pages - 1, this.page + 1);
        return true;
      }

      // Новая подборка
      if (t === '🔄 Другая подборка') {
        AudioSys.play('click');
        this.viewed = [];
        this.rewardClaimed = false;
        this.loadItems();
        System.saveGame();
        return true;
      }

      // Открыть предмет
      if (t.indexOf('item_') === 0) {
        const idx = parseInt(t.split('_')[1], 10);
        if (!isNaN(idx) && this.items[idx]) {
          this.selected = idx;
          this.state = 'fact';
          AudioSys.play('click');
          if (this.viewed.indexOf(idx) === -1) this.viewed.push(idx);
          // Награда за сам предмет
          const item = this.items[idx];
          const d = this.data;
          if (d.kind === 'work' && item.coins) {
            System.earnCoins(item.coins);
            System.addXP(3);
            this.setToast('+' + item.coins + ' монет за задание');
          } else if (d.perItemReward) {
            const r = System.applyReward(d.perItemReward);
            if (r) this.setToast(r);
          }
          if (d.content && item.id) System.markSeen(d.content, item.id);
          System.saveGame();
        }
        return true;
      }

      // Закрыть карточку
      if (t === 'Понятно!' || t.indexOf('Взять задание') !== -1) {
        AudioSys.play('click');
        this.state = 'browse';
        this.selected = null;
        return true;
      }

      // Получить итоговую награду
      if (t.indexOf('🎁') === 0) {
        AudioSys.play('success');
        this.rewardClaimed = true;
        const d = this.data;
        const r = System.applyReward(d.reward);
        System.addXP(d.xp || 10);
        System.showAchievement(d.reward && d.reward.label ? '🎁' : '✅', r || (d.reward ? d.reward.label : 'Готово!'));
        System.saveGame();
        return true;
      }

      return true;
    }
    return false;
  }
}

window.VisitScene = VisitScene;
window.VISIT_DATA = VISIT_DATA;
window.MUSEUM_KEYS = MUSEUM_KEYS;
