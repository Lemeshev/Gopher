#!/usr/bin/env node
/* Ревьюер реального рендера: запускает игру в настоящем Chrome (headless),
   снимает статистику пикселей канваса и падает, если кадр пустой.

   Запуск: node tools/render-check.js [--shots=dir] [--json]
   Зачем: тесты на заглушке canvas проверяют только логику — «чёрный экран»
   они не видят. Этот ревьюер смотрит на реальные пиксели.

   Про кадры (--shots=dir): имя файла — это хэш сцены, в котором «@», «#» и «:»
   заменены на «_»; так имя остаётся валидным и переносимым. После съёмки кадр
   ОБЯЗАН оказаться на диске (проверяется размер файла) — иначе это ошибка
   проверки: ровно так кадры с «:» в имени однажды молча пропали (само-ревью v1.3.2). */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TIMEOUT_MS = 25000;
const SCENES = [
  { hash: 'menu',               minColors: 25, minNonBg: 3 },
  { hash: 'map',                minColors: 25, minNonBg: 3 },
  { hash: 'map@sleeping',       minColors: 25, minNonBg: 3 },
  { hash: 'home',               minColors: 25, minNonBg: 3 },
  { hash: 'home@sleeping',      minColors: 25, minNonBg: 3 },
  { hash: 'home@feed',          minColors: 25, minNonBg: 3 },
  { hash: 'home@bathe',         minColors: 25, minNonBg: 3 },
  { hash: 'home@play',          minColors: 25, minNonBg: 3 },
  { hash: 'home@sleep',         minColors: 25, minNonBg: 3 },
  { hash: 'home@decorToggle',   minColors: 25, minNonBg: 3 },
  { hash: 'shop',               minColors: 20, minNonBg: 3 },
  { hash: 'shop@decor',         minColors: 20, minNonBg: 3 },
  { hash: 'shop@clothes',       minColors: 20, minNonBg: 3 },
  { hash: 'stats',              minColors: 20, minNonBg: 3 },
  { hash: 'stats@ach',          minColors: 20, minNonBg: 3 },
  { hash: 'minigames',          minColors: 20, minNonBg: 3 },
  { hash: 'minigames@sleeping', minColors: 20, minNonBg: 3 },
  { hash: 'clinic',             minColors: 20, minNonBg: 3 },
  { hash: 'visit~museums',      minColors: 20, minNonBg: 3 },
  { hash: 'visit~art_museum',   minColors: 20, minNonBg: 3 },
  { hash: 'visit~library',      minColors: 20, minNonBg: 3 },
  { hash: 'visit~work',         minColors: 20, minNonBg: 3 },
  { hash: 'visit~restaurant',   minColors: 20, minNonBg: 3 },
  { hash: 'visit~pool',         minColors: 20, minNonBg: 3 },
  { hash: 'visit~gym',          minColors: 20, minNonBg: 3 },
  { hash: 'visit~school',       minColors: 20, minNonBg: 3 },
  { hash: 'visit~cinema',       minColors: 20, minNonBg: 3 },
  { hash: 'home@bedroom',       minColors: 25, minNonBg: 3 },
  { hash: 'home@kitchen',       minColors: 25, minNonBg: 3 },
  { hash: 'home@bathroom',      minColors: 25, minNonBg: 3 },
  { hash: 'home@help',          minColors: 20, minNonBg: 3 },
  // Наряды на всех героях (v1.3): видно, что кепка/бантик/шарф/рюкзак/плащ
  // садятся и на гофера, и на мишку, зайку, котёнка, робота и Милку.
  { hash: 'home~look=char:milka,hat:cap,neck:scarf,back:backpack', minColors: 25, minNonBg: 3 },
  { hash: 'home~look=char:bunny,hat:bow,neck:bowtie,back:cape',   minColors: 25, minNonBg: 3 },
  { hash: 'home~look=char:bunny,hat:crown,glasses:nerd',          minColors: 25, minNonBg: 3 },
  { hash: 'home~look=char:robot,hat:scientist,glasses:cool,back:backpack', minColors: 25, minNonBg: 3 },
  { hash: 'home~look=char:bear,hat:chef,neck:scarf,fur:lemon',    minColors: 25, minNonBg: 3 },
  { hash: 'home~look=char:cat,hat:cap,back:cape,fur:mint',        minColors: 25, minNonBg: 3 },
  { hash: 'home~look=char:milka,hat:bow,glasses:cool,neck:bowtie', minColors: 25, minNonBg: 3 },
  { hash: 'home~look=char:milka,back:backpack,fur:sky',           minColors: 25, minNonBg: 3 },
  // Имя героя в текстах (v1.3.4). Заказчик: «все персонажи назывались Гоферами».
  // На этих кадрах герой — Мишка и Милка, поэтому кадр ОБЯЗАН показать их имя,
  // а шаблон «{pet…}» не должен попасть на экран (проверяет needText/petLeftover).
  { hash: 'menu~look=char:milka',       minColors: 20, minNonBg: 3, needText: ['Милка'] , forbidText: ['гофер'] },
  { hash: 'menu~look=char:bear',        minColors: 20, minNonBg: 3, needText: ['Мишка'] , forbidText: ['гофер'] },
  { hash: 'menu@profiles~look=char:milka', minColors: 20, minNonBg: 3, needText: ['Новый питомец'] , forbidText: ['гофер'] },
  { hash: 'home~look=char:milka',       minColors: 25, minNonBg: 3 , forbidText: ['гофер'] },
  { hash: 'home~look=char:milka,stats=calm-15', minColors: 25, minNonBg: 3, forbidText: ['гофер'] },
  { hash: 'home@help~look=char:milka',  minColors: 20, minNonBg: 3, needText: ['Милке'] , forbidText: ['гофер'] },
  { hash: 'minigames~look=char:milka',  minColors: 20, minNonBg: 3, needText: ['Милки'] , forbidText: ['гофер'] },
  { hash: 'minigames@sleeping~look=char:milka', minColors: 20, minNonBg: 3, needText: ['Милка'] , forbidText: ['гофер'] },
  { hash: 'quiet~look=char:bear',       minColors: 20, minNonBg: 3, needText: ['Мишка'] , forbidText: ['гофер'] },
  { hash: 'stats~look=char:milka',      minColors: 20, minNonBg: 3 , forbidText: ['гофер'] },
  { hash: 'home@music',         minColors: 25, minNonBg: 3 },
  { hash: 'quiet',              minColors: 20, minNonBg: 3 },
  { hash: 'quiet@stars',        minColors: 20, minNonBg: 3 },
  { hash: 'quiet@color',        minColors: 20, minNonBg: 3 },
  { hash: 'quiet@fish',         minColors: 20, minNonBg: 3, needText: ['Видов', 'Рыбок ловим'] },
  { hash: 'aerial',             minColors: 20, minNonBg: 3 },
  { hash: 'aerial@swing',       minColors: 20, minNonBg: 3 },
  // v1.3.7: четыре спортивные дисциплины и десять музеев — смотрим пиксели всех
  { hash: 'sport~rings',        minColors: 20, minNonBg: 3 },
  { hash: 'sport~silks',        minColors: 20, minNonBg: 3 },
  { hash: 'sport~swim',         minColors: 20, minNonBg: 3 },
  { hash: 'sport~hurdles',      minColors: 20, minNonBg: 3 },
  { hash: 'visit~museums',      minColors: 20, minNonBg: 3, needText: ['Музеев: 10'] },
  { hash: 'visit~rail_museum',  minColors: 20, minNonBg: 3 },
  { hash: 'visit~navy_museum',  minColors: 20, minNonBg: 3 },
  { hash: 'visit~tech_museum',  minColors: 20, minNonBg: 3 },
  { hash: 'visit~music_museum', minColors: 20, minNonBg: 3 },
  { hash: 'visit~toy_museum',   minColors: 20, minNonBg: 3 },
  { hash: 'visit~palace_museum', minColors: 20, minNonBg: 3, needText: ['Всего в базе: 100'] },
  { hash: 'clinic@врачу',       minColors: 20, minNonBg: 3 },
  { hash: 'shop@decor:walls',   minColors: 20, minNonBg: 3 },
  { hash: 'shop@decor:floors',  minColors: 20, minNonBg: 3 },
  { hash: 'menu@Персонаж',     minColors: 20, minNonBg: 3 },
  { hash: 'friends@codes',     minColors: 20, minNonBg: 3 },
  { hash: 'friends@codes+open_add',        minColors: 20, minNonBg: 3 },
  { hash: 'friends@visit_0',    minColors: 20, minNonBg: 3 },
  { hash: 'menu@profiles',      minColors: 20, minNonBg: 3 },
  { hash: 'menu@settings',      minColors: 20, minNonBg: 3, needText: ['Мелодия'] },
  // Шкалы в крайних состояниях (v1.3.2): все полоски устроены одинаково
  // («чем больше, тем лучше»), поэтому и выглядят одинаково.
  // Внимание: значения разделяем «-», а не «:» — двоеточие в имени файла кадра
  // в macOS ломает сохранение (файл молча не появлялся, нашло само-ревью).
  { hash: 'home~stats=calm-15,hunger-20,cleanliness-25', minColors: 25, minNonBg: 3 },
  { hash: 'home~stats=calm-100,hunger-100,energy-100,health-100,cleanliness-100,happiness-100',
    minColors: 25, minNonBg: 3 },
  // Настройки с выключенной музыкой (v1.3.1): видно, что галочки работают
  { hash: 'menu@settings+toggle_music', minColors: 20, minNonBg: 3 },
  { hash: 'menu@settings+toggle_music+toggle_sound', minColors: 20, minNonBg: 3 },
  { hash: 'menu@settings+Об авторе', minColors: 20, minNonBg: 3 },
  { hash: 'friends',            minColors: 20, minNonBg: 3 },
  { hash: 'menu@@tutorial',     minColors: 20, minNonBg: 3 }
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      // keep-alive держим коротким: иначе закрытие сервера ждёт Chrome (v1.3.5)
      const rel = decodeURIComponent(req.url.split('?')[0].replace(/^\/+/, ''));
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.keepAliveTimeout = 1000;
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

function chrome(hash, port, shotPath, timeoutMs) {
  return new Promise(resolve => {
    // Профиль Chrome создаётся на каждый запуск и удаляется после: без уборки
    // в /tmp за один прогон остаётся 50 папок и Chrome начинает тормозить.
    const profileDir = '/tmp/chrome-render-' + process.pid + '-' + Math.random().toString(36).slice(2, 7);
    const args = [
      '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
      '--user-data-dir=' + profileDir,
      '--window-size=390,844', '--virtual-time-budget=1500'
    ];
    if (shotPath) { args.push('--screenshot=' + shotPath); } else { args.push('--dump-dom'); }
    args.push('http://127.0.0.1:' + port + '/tools/shots/harness.html#' + encodeURIComponent(hash));

    const p = spawn(CHROME, args);
    let out = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { p.kill('SIGKILL'); } catch (e) {}
      try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (e) {}
      const unesc = t => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      const m = out.match(/<pre id="report">([\s\S]*?)<\/pre>/);
      let json = null;
      if (m) { try { json = JSON.parse(unesc(m[1])); } catch (e) { json = null; } }
      const sm = out.match(/<pre id="shot">([\s\S]*?)<\/pre>/);
      const dataUrl = sm && sm[1].indexOf('data:image/png;base64,') === 0 ? unesc(sm[1]) : null;
      resolve({ json, dataUrl });
    };
    const timer = setTimeout(finish, timeoutMs);
    p.stdout.on('data', d => { out += d; });
    p.on('close', finish);
    p.on('error', finish);
  });
}

(async () => {
  const shotArg = process.argv.find(a => a.startsWith('--shots='));
  const shotDir = shotArg ? shotArg.split('=')[1] : null;
  const asJson = process.argv.includes('--json');

  if (!fs.existsSync(CHROME)) {
    console.error('❌ Не найден Chrome: ' + CHROME + '\n   Укажите путь через CHROME_BIN');
    process.exit(2);
  }
  if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

  const { srv, port } = await serve();
  const results = [];
  let failed = 0;

  async function runOne(scene) {
    // В имени файла кадра не должно быть «:» (macOS не может записать такой файл,
    // и кадр молча пропадал — нашло само-ревью v1.3.2). Прочие служебные знаки
    // тоже заменяем, чтобы имя всегда было валидным.
    const shot = shotDir ? path.join(shotDir, scene.hash.replace(/[@#:]/g, '_') + '.png') : null;

    // Chrome иногда не успевает ответить (машина занята) — это ложный провал,
    // поэтому делаем до 3 попыток, а не падаем сразу.
    let rep = null, dataUrl = null;
    for (let attempt = 1; attempt <= 3 && !rep; attempt++) {
      const r = await chrome(scene.hash, port, null, TIMEOUT_MS);
      rep = r.json;
      dataUrl = r.dataUrl;
      if (!rep && attempt < 3) await new Promise(r2 => setTimeout(r2, 1500));
    }
    if (shot && dataUrl) fs.writeFileSync(shot, Buffer.from(dataUrl.split(',')[1], 'base64'));

    const problems = [];
    if (!rep) problems.push('нет отчёта (страница не ответила)');
    else {
      if (rep.bootFail) problems.push('ошибка запуска: ' + rep.bootFail);
      if (rep.drawFail) problems.push('ошибка отрисовки: ' + rep.drawFail);
      if (rep.errors && rep.errors.length) problems.push('ошибки JS: ' + rep.errors.join(' | '));
      if (rep.distinctColors < scene.minColors) problems.push('слишком мало цветов: ' + rep.distinctColors + ' < ' + scene.minColors);
      if (rep.nonBackgroundPct < scene.minNonBg) problems.push('кадр почти пустой: нефон ' + rep.nonBackgroundPct + '% < ' + scene.minNonBg + '%');
      // Имя героя в подписях (v1.3.3): на кадре должен быть именно герой, а
      // шаблон «{pet…}» не имеет права попасть на экран ни в одном кадре.
      const drawn = Array.isArray(rep.drawn) ? rep.drawn : [];
      (scene.needText || []).forEach(t => {
        if (!drawn.some(s => s.indexOf(t) !== -1)) problems.push('нет надписи «' + t + '» (герой не назван своим именем)');
      });
      (rep.petLeftover || []).forEach(s => problems.push('на экран попал шаблон: ' + s));
      (scene.forbidText || []).forEach(t => {
        const hit = drawn.filter(s => s.toLowerCase().indexOf(t.toLowerCase()) !== -1)[0];
        if (hit) problems.push('на кадре лишнее слово «' + t + '»: ' + hit);
      });
    }
    // Кадр обязан реально лечь на диск: раньше имя с «:» молча не сохранялось,
    // а проверка этого не замечала (казалось, что кадры есть).
    if (shot) {
      const size = fs.existsSync(shot) ? fs.statSync(shot).size : 0;
      if (size < 1000) problems.push('кадр не записан на диск: ' + path.basename(shot));
    }

    return { hash: scene.hash, report: rep, problems, shot };
  }

  const onlyArg = process.argv.find(a => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.split('=')[1].split(',') : null;
  // --only=подстрока[,ещё]: рендерим только нужные сцены (например
  // --only=look= — все кадры с нарядами). Это ускоряет проверку глазами.
  const scenes = only ? SCENES.filter(s => only.some(o => s.hash.indexOf(o) !== -1)) : SCENES;

  const CONCURRENCY = 3;
  const queue = scenes.slice();
  const out = [];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const scene = queue.shift();
      out.push(await runOne(scene));
    }
  }));
  out.sort((a, b) => SCENES.findIndex(s => s.hash === a.hash) - SCENES.findIndex(s => s.hash === b.hash));

  for (const r of out) {
    const { hash, report: rep, problems, shot } = r;
    results.push({ hash, report: rep, problems, shot });
    if (problems.length) failed++;

    if (!asJson) {
      const ok = problems.length === 0;
      const rp = rep || {};
      console.log(
        (ok ? '  ✅ ' : '  ❌ ') + hash.padEnd(16) +
        ' цвета=' + String(rp.distinctColors === undefined ? '?' : rp.distinctColors).padEnd(4) +
        ' нефон=' + String(rp.nonBackgroundPct === undefined ? '?' : rp.nonBackgroundPct).padEnd(4) + '%' +
        ' яркость=' + String(rp.meanLuminance === undefined ? '?' : rp.meanLuminance).padEnd(4) +
        (ok ? '' : '  ← ' + problems.join('; '))
      );
    }
  }

  // Закрываем сервер ЖЁСТКО: Chrome держит keep-alive соединения, а srv.close()
  // ждёт их закрытия и может ждать вечно — прогон выглядел «зависшим» уже после
  // отрисовки всех кадров (нашло само-ревью v1.3.5).
  if (typeof srv.closeAllConnections === 'function') srv.closeAllConnections();
  srv.close();
  // process.exit() обрывает незакрытый вывод: при 70+ кадрах JSON (сотни КБ)
  // не успевал уйти в пайп, verify.js не мог его разобрать и терял ВСЕ проверки
  // кадров, показывая одну строку «Command failed» (нашло само-ревью v1.3.5).
  // Поэтому не выходим принудительно: даём потоку закрыться, а код возврата
  // ставим через exitCode.
  // Вывод обязательно досылаем (verify.js читает его из пайпа) и только потом
  // выходим: без явного exit процесс мог остаться жить из-за висящих дескрипторов
  // Chrome, а с прежним process.exit() — наоборот, терял хвост JSON (v1.3.5).
  const done = () => process.exit(failed ? 1 : 0);
  if (asJson) process.stdout.write(JSON.stringify(results, null, 2) + '\n', done);
  else done();
})();
