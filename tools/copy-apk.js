#!/usr/bin/env node
/* Выкладывает подписанный release-APK на рабочий стол под именем Gopher.apk
   и сверяет контрольные суммы. Запуск: node tools/copy-apk.js */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const DEST_NAME = 'Gopher.apk';
const DEST = path.join(os.homedir(), 'Desktop', DEST_NAME);

if (!fs.existsSync(SRC)) {
  console.error('❌ Нет собранного release-APK: ' + path.relative(ROOT, SRC));
  console.error('   Сначала: npm run build');
  process.exit(1);
}

fs.copyFileSync(SRC, DEST);

const md5 = p => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
const a = md5(SRC), b = md5(DEST);

if (a !== b) {
  console.error('❌ Контрольные суммы разошлись — файл повреждён');
  process.exit(1);
}

const kb = (fs.statSync(DEST).size / 1024).toFixed(0);
console.log('✅ ' + DEST);
console.log('   размер: ' + kb + ' КБ   md5: ' + b);
