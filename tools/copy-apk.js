#!/usr/bin/env node
/* Выкладывает подписанный release-APK на рабочий стол под именем Gopher.apk
   и сверяет контрольные суммы. Запуск: node tools/copy-apk.js */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const DESK = path.join(os.homedir(), 'Desktop');
const DEST = path.join(DESK, 'Gopher.apk');

if (!fs.existsSync(SRC)) {
  console.error('❌ Нет собранного release-APK: ' + path.relative(ROOT, SRC));
  console.error('   Сначала: npm run build');
  process.exit(1);
}

// Запись поверх старого Gopher.apk иногда зависает (файл держит Рабочий стол
// или iCloud). Дочерний процесс обрываем через 8 секунд и кладём копию рядом.
function copyFile(src, dest) {
  const r = spawnSync(process.execPath, ['-e',
    'require("fs").copyFileSync(process.argv[1], process.argv[2])', src, dest],
    { timeout: 8000 });
  return r.status === 0 && !r.error;
}

let saved = DEST;
if (!copyFile(SRC, DEST)) {
  const ver = ((fs.readFileSync(path.join(ROOT, 'www/js/helpers.js'), 'utf8')
    .match(/GAME_VERSION = '([^']+)'/) || [])[1]) || 'new';
  saved = path.join(DESK, 'Gopher-' + ver + '.apk');
  if (!copyFile(SRC, saved)) {
    console.error('❌ Не удалось записать APK на рабочий стол');
    console.error('   Готовый файл: ' + SRC);
    process.exit(1);
  }
  console.error('⚠️  Gopher.apk на столе занят, записал ' + saved);
}

const md5 = p => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
const a = md5(SRC), b = md5(saved);

if (a !== b) {
  console.error('❌ Контрольные суммы разошлись — файл повреждён');
  process.exit(1);
}

const kb = (fs.statSync(saved).size / 1024).toFixed(0);
console.log('✅ ' + saved);
console.log('   размер: ' + kb + ' КБ   md5: ' + b);
