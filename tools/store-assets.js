#!/usr/bin/env node
/* ============================================================
   МАГАЗИННЫЕ МАТЕРИАЛЫ ДЛЯ RUSTORE И GOOGLE PLAY
   Готовит то, что просят карточки магазинов, и ругается, если
   что-то не влезает в лимиты:

     store/icon-512.png          512×512   иконка (Play: 32-bit PNG ≤1024 КБ)
     store/feature-graphic.png   1024×500  баннер карточки (Play: JPEG, без альфы)
     store/screens-9x16/*.jpg    1080×1920 скриншоты (9:16, JPEG без альфы)
     store/card.txt              тексты карточки с проверкой лимитов
     store/README.txt            памятка: что куда заливать

   Запуск:  node tools/store-assets.js [--no-shots] [--only=shots]
   Требуется установленный Chrome (путь можно задать через CHROME_BIN).
   ============================================================ */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STORE = path.join(ROOT, 'store');
const SHOTS_DIR = path.join(STORE, 'screens-9x16');
const CHROME = process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const onlyShots = args.includes('--only=shots');
const noShots = args.includes('--no-shots');
// Пересобрать один кадр: --shot=08 (по началу имени файла)
const shotFilter = (args.find(a => a.indexOf('--shot=') === 0) || '').split('=')[1] || null;

// Скриншоты карточки: 8 кадров, которые показывают игру целиком.
// Размер окна 540×960 = 9:16, масштаб 2 → картинка 1080×1920 (как просят
// оба магазина для витрины), а интерфейс игры остаётся «телефонного» размера.
const SHOTS = [
  { file: '01_menu.jpg',         hash: 'menu@jpeg@hires',            title: 'Главное меню и персонажи' },
  { file: '02_map.jpg',          hash: 'map@jpeg@hires',             title: 'Карта из 15 локаций' },
  { file: '03_home.jpg',         hash: 'home@kitchen@jpeg@hires',    title: 'Дом из четырёх комнат' },
  { file: '04_achievements.jpg', hash: 'stats@ach@jpeg@hires',       title: 'Достижения со ступенями' },
  { file: '05_shop.jpg',         hash: 'shop@jpeg@hires',            title: 'Магазин: мебель и еда' },
  { file: '06_games.jpg',        hash: 'minigames@jpeg@hires',       title: 'Мини-игры' },
  { file: '07_clinic.jpg',       hash: 'clinic@jpeg@hires',          title: 'Поликлиника: видно лечение' },
  { file: '08_museum.jpg',       hash: 'visit~art_museum@jpeg@hires', title: 'Музеи и коллекции' },
  { file: '09_outfits.jpg',      hash: 'home~look=char:milka,hat:cap,neck:scarf,back:backpack@jpeg@hires',
    title: 'Наряды для всех героев' },
  // Настройки звука: видно, что музыку и звуки родитель может выключить (v1.3.1)
  { file: '10_settings.jpg',     hash: 'menu@settings@jpeg@hires',
    title: 'Настройки: музыка и звуки' }
];

const SHOT_W = 540, SHOT_H = 960;

/* ---------- мини-сервер: отдаём папку проекта, как render-check ---------- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0].replace(/^\/+/, ''));
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

/* ---------- Chrome: открыть страницу и забрать data-URL + диагностику ---------- */
function chromePage(url, width, height, scale, timeoutMs) {
  return new Promise(resolve => {
    // Профиль Chrome удаляем после запуска — иначе /tmp растёт с каждым кадром
    const profileDir = '/tmp/chrome-store-' + process.pid + '-' + Math.random().toString(36).slice(2, 7);
    const chromeArgs = [
      '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
      '--user-data-dir=' + profileDir,
      '--window-size=' + width + ',' + height,
      '--force-device-scale-factor=' + (scale || 1),
      '--virtual-time-budget=4000', '--dump-dom', url
    ];
    const p = spawn(CHROME, chromeArgs);
    let out = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { p.kill('SIGKILL'); } catch (e) {}
      try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (e) {}
      const unesc = t => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      const grab = id => {
        const m = out.match(new RegExp('<pre id="' + id + '">([\\s\\S]*?)<\\/pre>'));
        return m ? unesc(m[1]).trim() : '';
      };
      const url2 = grab('out') || grab('shot');
      let report = null;
      const rawReport = grab('report');
      if (rawReport && rawReport.indexOf('{') === 0) { try { report = JSON.parse(rawReport); } catch (e) {} }
      resolve({ dataUrl: url2.indexOf('data:') === 0 ? url2 : null, diag: grab('diag'), report: report });
    };
    const timer = setTimeout(finish, timeoutMs || 30000);
    p.stdout.on('data', d => { out += d; });
    p.on('close', finish);
    p.on('error', finish);
  });
}

/* ---------- размеры картинок читаем сами: PNG (IHDR) и JPEG (SOF) ---------- */
function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { type: 'png', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { type: 'jpg', h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return { type: '?', w: 0, h: 0 };
}

function writeDataUrl(dataUrl, file) {
  const comma = dataUrl.indexOf(',');
  const buf = Buffer.from(dataUrl.slice(comma + 1), 'base64');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  return buf;
}

let problems = 0;
const check = (name, ok, detail) => {
  if (!ok) problems++;
  console.log((ok ? '  ✅ ' : '  ❌ ') + name + (detail ? '  [' + detail + ']' : ''));
};

/* ---------- ТЕКСТЫ КАРТОЧКИ (проверяются на лимиты обоих магазинов) ---------- */
const CARD = {
  name: 'Gopher Life: питомец-гофер',
  short: 'Накорми, искупай и выгуляй гофера: дом, 15 локаций, наряды и 38 достижений',
  full: [
    'Gopher Life — добрая игра-питомец про гофера, которого ребёнок кормит, купает,',
    'укладывает спать и берёт с собой в походы по городу.',
    '',
    'ЧТО ЕСТЬ В ИГРЕ',
    '• Дом из четырёх комнат: гостиная, спальня, кухня и ванная. У каждой свои обои,',
    '  пол и мебель — 56 предметов от табурета до рояля, с перестановкой пальцем.',
    '• 15 локаций на карте: работа, учёба, бассейн, спортзал, парк, кино, пляж,',
    '  ресторан, библиотека, поликлиника, четыре музея и гости.',
    '• 890 предметов контента: у каждого экспоната, книги и задания есть свой факт,',
    '  поэтому «пойти в музей» каждый раз показывает что-то новое.',
    '• Живой питомец: ест с крошками, купается с пузырьками, играет мячом, спит —',
    '  и просыпается сам, когда выспится. Все полоски внизу экрана устроены',
    '  одинаково: чем полнее и зеленее, тем лучше. Спокойствие поднимают сон,',
    '  музыка, купание и тихие игры — по каждой шкале есть понятная справка.',
    '• Поликлиника, где видно лечение: восемь процедур по шагам — рецепт, укол,',
    '  проверка зрения, снимок, перевязка, зубы, витамины, градусник.',
    '• Наряды для всех шести героев: шапочки, очки, шарф, рюкзачок и плащ — и свой',
    '  голос у каждого: гофер пищит, мишка гудит, зайка тараторит, Милка поёт.',
    '• Тихая фоновая музыка и звуки: две отдельные галочки в настройках — музыку и',
    '  звуки можно выключить по отдельности, выбор запоминается на устройстве.',
    '• 38 достижений с четырьмя ступенями: что-то берётся в первый вечер, а «сто и',
    '  триста шестьдесят пять разных дней», «серия дней без пропусков» и «вся коллекция',
    '  музеев» — это долгие цели на месяцы, их не собрать за один вечер.',
    '• Друзья: короткий код из 16 знаков, который можно продиктовать, подарки и',
    '  гости — видно настоящую комнату друга с его обоями и мебелью.',
    '• Шесть персонажей на выбор: гофер, мишка, зайка, котёнок, робот и плюшевая',
    '  Милка с зелёными ушками и крылышками.',
    '',
    'ДЕТЯМ И РОДИТЕЛЯМ',
    '• Без рекламы и без покупок — все возможности открыты сразу.',
    '• Работает без интернета: игра полностью офлайн, прогресс хранится на устройстве.',
    '• Никаких персональных данных приложение не собирает и никуда не передаёт.',
    '• До четырёх профилей на устройстве — у каждого ребёнка свой питомец.',
    '• Звук под контролем: музыку и звуки можно выключить по отдельности —',
    '  например, оставить звуки, но убрать музыку или выключить всё сразу.',
    '• Игра не наказывает: в тихих играх нельзя проиграть, а походы не отнимают',
    '  последние силы.',
    '',
    'Игра сделана для семейного досуга: ребёнок сам решает, чем заняться, а питомец',
    'радуется любому вниманию.'
  ].join('\n'),
  whatsNew: [
    'Что нового в 1.3.2:',
    '• Все полоски теперь означают одно и то же: чем полнее и зеленее, тем лучше.',
    '  Вместо «Стресса» — понятное детям «Спокойствие»: его поднимают сон, музыка,',
    '  купание и тихие игры. Идеальные показатели выглядят полностью зелёными.',
    '• Подсказка «нажми на стресс» убрана: правило написано словами, а справка',
    '  открывается обычной кнопкой «❓» (раньше нажатие по стрессу не срабатывало).',
    '• Тихая фоновая музыка и две отдельные галочки «Музыка» и «Звуки» в настройках.'
  ].join('\n'),
  faq: [
    { q: 'Игра бесплатная?', a: 'Да, полностью: без рекламы, без покупок и без подписок.' },
    { q: 'Нужен интернет?', a: 'Нет. Игра работает офлайн, прогресс хранится на устройстве.' },
    { q: 'Сколько детей могут играть на одном устройстве?', a: 'До четырёх: у каждого свой профиль, свой питомец и свой прогресс.' },
    { q: 'Что будет, если закрыть приложение?', a: 'Прогресс сохраняется. Если питомец остался спать, за время отсутствия он выспится и проснётся бодрым.' },
    { q: 'Можно ли одеть питомца?', a: 'Да: 11 нарядов в четырёх слотах — на голову, глаза, шею и за спину. Наряд подходит любому герою и покупается один раз.' },
    { q: 'Что означают полоски внизу экрана?', a: 'Все полоски устроены одинаково: чем полнее и зеленее, тем лучше. «Спокойствие» — та же логика: его поднимают сон, музыка, купание, тихие игры и поход в поликлинику.' },
    { q: 'Можно ли выключить музыку и звуки?', a: 'Да: в настройках (шестерёнка в главном меню) две отдельные галочки — «Музыка» и «Звуки». Можно оставить только звуки или выключить всё сразу; выбор запоминается на устройстве.' },
    { q: 'Ребёнку хватит занятий надолго?', a: 'Да: есть короткие дела (покормить, искупать, поиграть) и долгие цели на месяцы — «Сто дней подряд», «Год без пропусков», «Гроссмейстер» и вся коллекция музеев.' }
  ]
};


/* ---------- карточка: сборка card.txt с проверкой лимитов ---------- */
function writeCard() {
  const lines = [];
  lines.push('ТЕКСТЫ КАРТОЧКИ GOPHER LIFE — готово к копипасту');
  lines.push('Лимиты: RuStore — название ≤50, краткое ≤80, полное ≤4000;');
  lines.push('        Google Play — название ≤30, краткое ≤80, полное ≤4000.');
  lines.push('');
  lines.push('=== НАЗВАНИЕ ===');
  lines.push(CARD.name);
  lines.push('');
  lines.push('=== КРАТКОЕ ОПИСАНИЕ ===');
  lines.push(CARD.short);
  lines.push('');
  lines.push('=== ПОЛНОЕ ОПИСАНИЕ ===');
  lines.push(CARD.full);
  lines.push('');
  lines.push('=== ЧТО НОВОГО (RuStore «Что нового?» / Google Play «Что нового») ===');
  lines.push(CARD.whatsNew);
  lines.push('');
  lines.push('=== ЧАСТЫЕ ВОПРОСЫ (RuStore: до 10 пар; вопрос ≤120, ответ ≤500) ===');
  CARD.faq.forEach((f, i) => {
    lines.push((i + 1) + ') ' + f.q);
    lines.push('   ' + f.a);
  });
  lines.push('');
  lines.push('=== КАТЕГОРИИ И РЕЙТИНГ ===');
  lines.push('RuStore:     тип «Игровое», категория «Для детей» или «Симуляторы», 0+');
  lines.push('Google Play: тип «Игра», категория «Обучающие»/«Симуляция», аудитория 5-8 и 9-12');
  lines.push('');
  lines.push('=== ЗАМЕТКА ДЛЯ МОДЕРАТОРА («Комментарий для модератора») ===');
  lines.push('Детская офлайн-игра про питомца-гофера. Авторизации нет, покупок нет, рекламы нет,');
  lines.push('интернет не используется. Весь контент (890 предметов, 15 локаций, 4 комнаты дома,');
  lines.push('38 достижений) находится внутри приложения. Прогресс хранится только на устройстве.');
  lines.push('');
  lines.push('=== ЧЕРНОВИК ПОЛИТИКИ КОНФИДЕНЦИАЛЬНОСТИ (нужна ссылка в обоих магазинах) ===');
  lines.push('Приложение «Gopher Life» не собирает и не передаёт персональные данные детей и');
  lines.push('взрослых: нет регистрации, нет аналитики, нет рекламы. Игровой прогресс (уровень,');
  lines.push('монеты, мебель, достижения) хранится только на устройстве и удаляется вместе с');
  lines.push('приложением. Приложение работает без доступа к интернету.');
  fs.writeFileSync(path.join(STORE, 'card.txt'), lines.join('\n') + '\n');

  check('Название влезает в Google Play (≤30) и RuStore (≤50)',
    CARD.name.length <= 30, CARD.name.length + ' символов');
  check('Краткое описание ≤80 символов', CARD.short.length <= 80, CARD.short.length + ' символов');
  check('Полное описание ≤4000 символов', CARD.full.length <= 4000, CARD.full.length + ' символов');
  const badFaq = CARD.faq.filter(f => f.q.length > 120 || f.a.length > 500);
  check('FAQ: пар ≤10, вопрос ≤120, ответ ≤500',
    badFaq.length === 0 && CARD.faq.length <= 10, CARD.faq.length + ' пары');
}

/* ---------- памятка в store/ ---------- */
function writeReadme(files) {
  const t = [
    'МАТЕРИАЛЫ ДЛЯ КАРТОЧЕК RUSTORE И GOOGLE PLAY',
    '(сгенерировано tools/store-assets.js — команда npm run store:assets)',
    '',
    'ЧТО ГДЕ ЗАЛИВАТЬ',
    '  icon-512.png            иконка: RuStore 512×512 (png/jpg), Google Play 512×512 (32-bit PNG)',
    '  feature-graphic.jpg     баннер: только Google Play, 1024×500, JPEG (без альфа-канала)',
    '  screens-9x16/*.jpg      скриншоты 1080×1920 (9:16), JPEG: RuStore (до 5 МБ) и Google Play',
    '  card.txt                тексты: название, краткое/полное описание, «что нового», FAQ',
    '',
    'ФАЙЛЫ (' + files.length + ' шт.)',
    '  ' + files.join('\n  '),
    '',
    'НАПОМИНАНИЯ',
    '  • Порядок скриншотов = порядок в карточке: сначала меню, карта и дом.',
    '  • Google Play не принимает PNG с альфа-каналом для скриншотов — у нас JPEG.',
    '  • RuStore обрезает картинки не в 9:16 — у нас ровно 9:16, обрезки не будет.',
    '  • Если игра изменилась — перегенерируйте: npm run store:assets',
    '  • Подробная инструкция по публикации — файл how_to.txt в папке gopher',
    '    (рядом с проектом gopher-life).'
  ].join('\n');
  fs.writeFileSync(path.join(STORE, 'README.txt'), t + '\n');
}


/* ---------- ГЛАВНОЕ ---------- */
(async () => {
  if (!fs.existsSync(CHROME)) {
    console.error('❌ Не найден Chrome: ' + CHROME + '\n   Укажите путь через CHROME_BIN');
    process.exit(2);
  }
  fs.mkdirSync(STORE, { recursive: true });
  const { srv, port } = await serve();
  const base = 'http://127.0.0.1:' + port + '/';
  const files = [];
  console.log('🛒 Gopher Life — материалы для RuStore и Google Play\n');

  if (!onlyShots) {
    console.log('Картинки карточки:');
    const icon = await chromePage(base + 'tools/shots/store-icon.html', 512, 512, 1);
    if (icon.dataUrl && icon.dataUrl.indexOf('image/png') !== -1) {
      const buf = writeDataUrl(icon.dataUrl, path.join(STORE, 'icon-512.png'));
      const sz = imageSize(buf);
      check('Иконка 512×512 (PNG, ≤1024 КБ для Google Play)',
        sz.w === 512 && sz.h === 512 && buf.length <= 1024 * 1024,
        sz.w + '×' + sz.h + ', ' + Math.round(buf.length / 1024) + ' КБ');
      check('На иконке видно маскота (не пустая подложка)',
        icon.diag.indexOf('OK') === 0, icon.diag || 'нет диагностики');
      files.push('store/icon-512.png');
    } else {
      check('Иконка 512×512 собрана', false, icon.diag || 'страница не отдала картинку');
    }

    const fg = await chromePage(base + 'tools/shots/store-feature.html', 1024, 500, 1);
    if (fg.dataUrl && fg.dataUrl.indexOf('image/jpeg') !== -1) {
      const buf = writeDataUrl(fg.dataUrl, path.join(STORE, 'feature-graphic.jpg'));
      const sz = imageSize(buf);
      check('Баннер карточки 1024×500 (JPEG без альфа-канала)',
        sz.w === 1024 && sz.h === 500, sz.w + '×' + sz.h + ', ' + Math.round(buf.length / 1024) + ' КБ');
      check('Надписи на баннере не обрезаны', fg.diag.indexOf('OK') === 0, fg.diag || 'нет диагностики');
      files.push('store/feature-graphic.jpg');
    } else {
      check('Баннер карточки собран', false, fg.diag || 'страница не отдала картинку');
    }
  }

  if (!noShots) {
    console.log('\nСкриншоты 9:16 (1080×1920):');
    const shots = shotFilter ? SHOTS.filter(s => s.file.indexOf(shotFilter) === 0) : SHOTS;
    if (!shots.length) console.log('  (кадров по фильтру "' + shotFilter + '" не найдено)');
    for (const shot of shots) {
      const page = await chromePage(base + 'tools/shots/harness.html#' + shot.hash, SHOT_W, SHOT_H, 1);
      if (!page.dataUrl) {
        check(shot.title + ' (' + shot.file + ')', false, 'кадр не получен');
        continue;
      }
      const buf = writeDataUrl(page.dataUrl, path.join(SHOTS_DIR, shot.file));
      const sz = imageSize(buf);
      const rep = page.report || {};
      const jsErrors = (rep.errors || []).length;
      check(shot.title + ' (' + shot.file + ')',
        sz.w === 1080 && sz.h === 1920 && buf.length <= 5 * 1024 * 1024 && jsErrors === 0 &&
        (rep.nonBackgroundPct || 0) >= 3,
        sz.w + '×' + sz.h + ' (' + (rep.canvas || '?') + '), ' + Math.round(buf.length / 1024) + ' КБ, нефон ' +
        (rep.nonBackgroundPct === undefined ? '?' : rep.nonBackgroundPct) + '%' +
        (jsErrors ? ', ошибок JS: ' + jsErrors : ''));
      files.push('store/screens-9x16/' + shot.file);
    }
  }

  console.log('\nТексты карточки:');
  writeCard();
  check('Тексты записаны в store/card.txt', fs.existsSync(path.join(STORE, 'card.txt')));
  writeReadme(files);
  check('Памятка записана в store/README.txt', fs.existsSync(path.join(STORE, 'README.txt')));

  srv.close();
  console.log('\n' + '─'.repeat(56));
  console.log(problems === 0 ? '✅ Магазинные материалы готовы: папка store/'
    : '❌ Есть замечания: ' + problems);
  process.exit(problems ? 1 : 0);
})().catch(e => {
  console.error('Ошибка генератора: ' + e.message);
  process.exit(1);
});

