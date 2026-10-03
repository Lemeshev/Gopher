#!/usr/bin/env node
/* Копирует www/ в android/app/src/main/assets/ (корень assets, не assets/www).
   MainActivity грузит file:///android_asset/index.html.
   Без этого шага APK собирается из устаревших файлов — именно так был получен
   «чёрный экран» (в APK лежал старый index.html без new Game().init()). */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'www');
const DST = path.join(ROOT, 'android/app/src/main/assets');

function walk(dir, rel) {
  rel = rel || '';
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) out = out.concat(walk(path.join(dir, e.name), r));
    else out.push(r);
  }
  return out;
}

if (!fs.existsSync(SRC)) {
  console.error('❌ Нет папки www/ — нечего синхронизировать');
  process.exit(1);
}

const files = walk(SRC);
for (const rel of files) {
  const to = path.join(DST, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(SRC, rel), to);
}

// Убираем из assets всё, чего больше нет в www/ (иначе остаются мёртвые файлы)
let removed = 0;
if (fs.existsSync(DST)) {
  for (const rel of walk(DST)) {
    if (!fs.existsSync(path.join(SRC, rel))) {
      fs.unlinkSync(path.join(DST, rel));
      removed++;
    }
  }
}

console.log('✅ Синхронизировано ' + files.length + ' файлов: www/ → assets/' +
  (removed ? ' (удалено устаревших: ' + removed + ')' : ''));
