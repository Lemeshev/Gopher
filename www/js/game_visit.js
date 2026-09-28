// ============ СЦЕНА ПОСЕЩЕНИЯ ЛОКАЦИИ (интерьер + интерактив) ============

const VISIT_DATA = {
  art_museum: {
    name: 'Художественный музей', bg: '#1a1a2e',
    items: [
      { emoji: '🖼️', name: 'Мона Лиза', fact: 'Написана Леонардо да Винчи ~1503 г. Хранится в Лувре.' },
      { emoji: '🌅', name: 'Звёздная ночь', fact: 'Ван Гог, 1889 г. Вид из окна санатория в Сен-Реми.' },
      { emoji: '🌊', name: 'Волна', fact: 'Хокусай, ~1831 г. Деревянная гравюра, 30 млн копий продано.' },
      { emoji: '🎵', name: 'Девушка с жемчужной серёжкой', fact: 'Вермеер, ~1665 г. «Голландская Мона Лиза».' },
      { emoji: '👟', name: 'Кеды Конверс', fact: 'Энди Уорхол, 1964 г. Поп-арт ирония над массовой культурой.' },
      { emoji: '🍎', name: 'Яблоки и апельсины', fact: 'Сезанн, ~1899 г. Предтеча кубизма.' }
    ],
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  nature_museum: {
    name: 'Музей природы', bg: '#2d4a2d',
    items: [
      { emoji: '🦕', name: 'Тираннозавр', fact: 'Жил 68–66 млн лет назад. Длина 12 м, вес 8 тонн.' },
      { emoji: '💎', name: 'Алмаз', fact: 'Образуется на глубине 150 км при давлении 5 ГПа.' },
      { emoji: '🦋', name: 'Бабочка Монарх', fact: 'Мигрирует 4000 км из Канады в Мексику.' },
      { emoji: '🌋', name: 'Вулкан', fact: 'Температура лавы 700–1200 °C. На Земле ~1500 действующих.' },
      { emoji: '🦑', name: 'Гигантский кальмар', fact: 'Длина до 13 м. Глаза размером с тарелку!' },
      { emoji: '🧬', name: 'ДНК', fact: '3 млрд пар оснований. Если растянуть — 2 м длиной.' }
    ],
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  space_museum: {
    name: 'Космический музей', bg: '#0a0a2a',
    items: [
      { emoji: '🪐', name: 'Сатурн', fact: '82 спутника. Кольца из льда и камней, ширина 282 000 км.' },
      { emoji: '🌍', name: 'Земля', fact: '4,54 млрд лет. Единственная планета с подтверждённой жизнью.' },
      { emoji: '🔴', name: 'Марс', fact: 'Олимп — высочайшая гора Солнечной системы, 21,9 км.' },
      { emoji: '🚀', name: 'Ракета Сатурн V', fact: 'Вывела человека на Луну. Высота 111 м, вес 2970 т.' },
      { emoji: '🛸', name: 'МКС', fact: 'Облетает Землю за 90 мин. Скорость 27 600 км/ч.' },
      { emoji: '☄️', name: 'Комета', fact: 'Хвост всегда направлен от Солнца, длина до 150 млн км.' }
    ],
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  history_museum: {
    name: 'Исторический музей', bg: '#3a2a1a',
    items: [
      { emoji: '🏺', name: 'Амфора', fact: 'Древняя Греция, V в. до н.э. Для вина и масла.' },
      { emoji: '⚔️', name: 'Меч рыцаря', fact: 'XV век, сталь. Вес 1–2 кг, длина 90–110 см.' },
      { emoji: '📜', name: 'Свиток', fact: 'Папирус, Египет, ~2000 до н.э. Предшественник книги.' },
      { emoji: '👑', name: 'Корона', fact: 'Корона Священной Римской империи, X век.' },
      { emoji: '🪙', name: 'Золотой динар', fact: 'Византия, VI в. Первая мировая валюта.' },
      { emoji: '🏛️', name: 'Фрагмент Парфенона', fact: 'Афины, 447 до н.э. Ионический ордер.' }
    ],
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  library: {
    name: 'Библиотека', bg: '#1a2a1a',
    items: [
      { emoji: '📕', name: '«Война и мир»', fact: 'Лев Толстой, 1869. 1225 страниц, 580 персонажей.' },
      { emoji: '📗', name: '«Гарри Поттер»', fact: 'Дж.К. Роулинг, 1997. 500 млн экземпляров продано.' },
      { emoji: '📘', name: '«1984»', fact: 'Джордж Оруэлл, 1949. «Большой Брат следит за тобой».' },
      { emoji: '📙', name: '«Маленький принц»', fact: 'Экзюпери, 1943. 300 языков, 200 млн экз.' },
      { emoji: '📓', name: '«Алиса в Стране чудес»', fact: 'Кэрролл, 1865. Популярна у математиков и детей.' },
      { emoji: '📔', name: '«Винни-Пух»', fact: 'Милн, 1926. Переведён на 50 языков включая латынь.' }
    ],
    reward: { stat: 'intelligence', amount: 8, label: 'Интеллект +8' }
  },
  restaurant: {
    name: 'Ресторан', bg: '#2a1a1a',
    items: [
      { emoji: '🍕', name: 'Пицца Маргарита', fact: 'Неаполь, 1889. Помидоры + моцарелла + базилик = цвета Италии.' },
      { emoji: '🍣', name: 'Суши', fact: 'Япония, VIII век. Первоначально — способ хранения рыбы.' },
      { emoji: '🥗', name: 'Цезарь', fact: 'Тихуана, Мексика, 1924. Придуман итальянцем Цезарем Кардини.' },
      { emoji: '🍝', name: 'Паста Карбонара', fact: 'Рим, ~1944. Яйца + гуанчиале + пекорино.' },
      { emoji: '🥩', name: 'Стейк', fact: 'Температура внутри 71 °C. Идеально для безопасности.' },
      { emoji: '🍰', name: 'Тирамису', fact: 'Венето, 1960-е. «Подними мне настроение» по-итальянски.' }
    ],
    reward: { stat: 'satiety', amount: 25, label: 'Сытость +25' }
  },
  pool: {
    name: 'Бассейн', bg: '#1a3a5a',
    items: [
      { emoji: '🏊', name: 'Поплавать!', fact: '30 минут плавания сжигает ~250 ккал.' },
      { emoji: '🤿', name: 'Нырнуть с маской', fact: 'Задержка дыхания: мировой рекорд 24 мин!' },
      { emoji: '🏊‍♀️', name: 'Баттерфляй', fact: 'Самый сложный стиль. Скорость ~2 м/с.' },
      { emoji: '🎽', name: 'Водное поло', fact: 'Олимпийский вид с 1900 года.' }
    ],
    reward: { stat: 'happiness', amount: 15, label: 'Счастье +15' }
  },
  park: {
    name: 'Парк', bg: '#2a4a1a',
    items: [
      { emoji: '🦆', name: 'Покормить уток', fact: 'Утки живут 5–10 лет. Хлеб им вреден — лучше овсянку!' },
      { emoji: '🪑', name: 'Посидеть на скамейке', fact: 'Парк снижает стресс за 20 мин по данным Стэндфорда.' },
      { emoji: '🌳', name: 'Обнять дерево', fact: 'Деревья общаются через грибную сеть («древесный интернет»).' },
      { emoji: '🌷', name: 'Полить цветы', fact: 'Тюльпаны были дороже золота в Голландии, 1637 г.' },
      { emoji: '🏃', name: 'Побегать', fact: 'Бег продлевает жизнь на 3 года по обзору 55 исследований.' }
    ],
    reward: { stat: 'happiness', amount: 10, label: 'Счастье +10' }
  },
  work: {
    name: 'Работа', bg: '#2a2a3a',
    items: [
      { emoji: '💻', name: 'Написать код', fact: 'Программист пишет ~10 строк продакшн-кода в день.' },
      { emoji: '📊', name: 'Сделать отчёт', fact: 'Excel: 750 млн пользователей по всему миру.' },
      { emoji: '📧', name: 'Ответить на письма', fact: 'Средний офисный работник получает 121 письмо в день.' },
      { emoji: '☕', name: 'Кофе-брейк', fact: 'Финляндия — #1 по потреблению кофе: 12 кг/чел/год.' },
      { emoji: '📝', name: 'Планёрка', fact: 'Средний сотрудник проводит 31 час в месяц на совещаниях.' }
    ],
    reward: { stat: 'money', amount: 30, label: 'Монеты +30' }
  },
  school: {
    name: 'Школа', bg: '#2a2a4a',
    items: [
      { emoji: '📐', name: 'Геометрия', fact: 'Теорема Пифагора: a² + b² = c². Известна 4000 лет.' },
      { emoji: '🧪', name: 'Химия', fact: 'H₂O — единственное вещество в 3 состояниях при обычных условиях.' },
      { emoji: '📖', name: 'Литература', fact: '«Евгений Онегин» — роман в стихах, 389 строф.' },
      { emoji: '🌍', name: 'География', fact: 'Марианская впадина: 10 994 м. Эверест: 8 849 м.' },
      { emoji: '🔢', name: 'Арифметика', fact: '1729 — число Рамануджана: сумма кубов двумя способами.' }
    ],
    reward: { stat: 'intelligence', amount: 6, label: 'Интеллект +6' }
  },
  cinema: {
    name: 'Кинотеатр', bg: '#0a0a1a',
    items: [
      { emoji: '🎬', name: 'Мультфильм', fact: '«Шрек» (2001) — первый фильм, получивший Оскар за анимацию.' },
      { emoji: '🦸', name: 'Супергеройский', fact: 'Marvel MCU: 32 фильма, $29 млрд сборов.' },
      { emoji: '🚀', name: 'Фантастика', fact: '«Интерстеллар» — консультант Кип Торн, Нобелевский лауреат.' },
      { emoji: '😂', name: 'Комедия', fact: 'Смех на 15 мин продлевает жизнь как 2 км прогулки.' }
    ],
    reward: { stat: 'happiness', amount: 12, label: 'Счастье +12' }
  }
};

class VisitScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.locationId = null;
    this.data = null;
    this.viewedItems = [];
    this.selectedItem = null;
    this.showFact = false;
    this.rewardClaimed = false;
    this.animTime = 0;
  }

  init(locationId) {
    this.locationId = locationId;
    this.data = VISIT_DATA[locationId];
    this.viewedItems = [];
    this.selectedItem = null;
    this.showFact = false;
    this.rewardClaimed = false;
    this.animTime = 0;
    this.buttons = [];
    if (!this.data) {
      this.data = {
        name: 'Локация', bg: '#2a2a3a',
        items: [{ emoji: '📍', name: 'Осмотреться', fact: 'Пока тут пусто, но скоро будет интересно!' }],
        reward: { stat: 'happiness', amount: 3, label: 'Счастье +3' }
      };
    }
  }

  update(dt) { this.animTime += dt; }

  draw(ctx, W, H) {
    this.buttons = [];
    const d = this.data;
    ctx.fillStyle = d.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, H * 0.75, W, H * 0.25);
    ctx.fillStyle = '#FFD93D'; ctx.font = `bold ${Math.min(W * 0.05, 22)}px Arial`; ctx.textAlign = 'center';
    ctx.fillText(d.name, W / 2, 36);
    const total = d.items.length, viewed = this.viewedItems.length;
    ctx.fillStyle = '#aaa'; ctx.font = `${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillText(`Осмотрено: ${viewed}/${total}`, W / 2, 56);
    this.buttons.push(createButton(ctx, 10, 10, 80, 32, '← Назад', { bgColor: 'rgba(255,255,255,0.15)', fgColor: '#fff', fontSize: 13, radius: 8 }));

    if (this.showFact && this.selectedItem !== null) { this.drawFactOverlay(ctx, W, H); return; }

    const cols = Math.min(3, d.items.length);
    const rows = Math.ceil(d.items.length / cols);
    const cellW = Math.min((W - 40) / cols, 130);
    const cellH = Math.min((H * 0.55) / rows, 110);
    const gridW = cols * cellW + (cols - 1) * 10;
    const startX = (W - gridW) / 2;
    const startY = 70;

    d.items.forEach((item, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = startX + col * (cellW + 10), cy = startY + row * (cellH + 10);
      const isViewed = this.viewedItems.includes(i);
      ctx.fillStyle = isViewed ? 'rgba(107,203,119,0.2)' : 'rgba(255,255,255,0.1)';
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 12); ctx.fill();
      ctx.strokeStyle = isViewed ? '#6BCB77' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = isViewed ? 2 : 1;
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 12); ctx.stroke();
      ctx.font = `${Math.min(cellW * 0.35, 36)}px Arial`; ctx.textAlign = 'center';
      ctx.fillText(item.emoji, cx + cellW / 2, cy + cellH * 0.45);
      ctx.fillStyle = isViewed ? '#6BCB77' : '#fff'; ctx.font = `${Math.min(cellW * 0.09, 11)}px Arial`;
      ctx.fillText(item.name, cx + cellW / 2, cy + cellH * 0.80);
      if (isViewed) { ctx.fillStyle = '#6BCB77'; ctx.font = '14px Arial'; ctx.fillText('✓', cx + cellW - 14, cy + 16); }
      this.buttons.push({ x: cx, y: cy, w: cellW, h: cellH, text: `item_${i}`, _isItem: true });
    });

    if (viewed >= total && !this.rewardClaimed) {
      this.buttons.push(createButton(ctx, W / 2 - 100, H - 70, 200, 44, `🎁 ${d.reward.label}`, { bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 15, radius: 12 }));
    } else if (this.rewardClaimed) {
      ctx.fillStyle = '#6BCB77'; ctx.font = `${Math.min(W * 0.035, 15)}px Arial`; ctx.textAlign = 'center';
      ctx.fillText('✅ Награда получена!', W / 2, H - 45);
    }
  }

  drawFactOverlay(ctx, W, H) {
    const item = this.data.items[this.selectedItem];
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    const panelW = Math.min(W * 0.85, 300), panelH = 200;
    const px = (W - panelW) / 2, py = (H - panelH) / 2;
    ctx.fillStyle = '#1e2a4a'; ctx.beginPath(); ctx.roundRect(px, py, panelW, panelH, 16); ctx.fill();
    ctx.strokeStyle = '#FFD93D'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(px, py, panelW, panelH, 16); ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = `${Math.min(panelW * 0.15, 40)}px Arial`;
    ctx.fillText(item.emoji, W / 2, py + 45);
    ctx.fillStyle = '#FFD93D'; ctx.font = `bold ${Math.min(panelW * 0.06, 18)}px Arial`;
    ctx.fillText(item.name, W / 2, py + 70);
    ctx.fillStyle = '#ddd'; ctx.font = `${Math.min(panelW * 0.04, 13)}px Arial`;
    this.wrapText(ctx, item.fact, W / 2, py + 95, panelW - 30, 16);
    this.buttons.push(createButton(ctx, px + 20, py + panelH - 50, panelW - 40, 38, 'Понятно!', { bgColor: '#6BCB77', fgColor: '#fff', fontSize: 14, radius: 10 }));
  }

  wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' '); let line = '', cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line.length > 0) { ctx.fillText(line.trim(), x, cy); line = word + ' '; cy += lineH; } else { line = test; }
    }
    ctx.fillText(line.trim(), x, cy);
  }

  handleClick(mx, my) {
    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      AudioSys.play('click');
      const t = btn.text || '';
      if (t === '← Назад') { this.game.transitionTo('map'); return true; }
      if (t.startsWith('item_')) { const idx = parseInt(t.split('_')[1]); this.selectedItem = idx; this.showFact = true; if (!this.viewedItems.includes(idx)) this.viewedItems.push(idx); return true; }
      if (t.indexOf('Понятно') !== -1) { this.showFact = false; this.selectedItem = null; return true; }
      if (t.indexOf(this.data.reward.label) !== -1 && !this.rewardClaimed) {
        this.rewardClaimed = true; const r = this.data.reward;
        if (r.stat === 'money') { System.money += r.amount; } else if (System.stats[r.stat] !== undefined) { System.stats[r.stat] = Math.min(100, System.stats[r.stat] + r.amount); }
        System.saveGame(); return true;
      }
      return true;
    }
    return false;
  }
}

window.VisitScene = VisitScene;
window.VISIT_DATA = VISIT_DATA;
