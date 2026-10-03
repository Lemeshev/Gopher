#!/usr/bin/env node
/* Один шаг на релиз — чтобы ничего не забывалось.
   Делает по порядку:
     1) синхронизирует www/ с android-обёрткой;
     2) собирает подписанный release-APK;
     3) кладёт копию на рабочий стол (~/Desktop/Gopher.apk);
     4) печатает версию, размер, md5 и что с этим файлом делать дальше в RuStore.

   Запуск: npm run release            — сборка + копия + напоминание
           npm run release -- --check — то же плюс быстрые проверки (quickcheck)

   Заказчик 01.10.2026: «Ты не забываешь во-первых копировать новую версию на
   десктоп, а во-вторых — загружать её на рустор?» Копия на рабочий стол делалась
   всегда, а загрузка в RuStore упирается в их правило: пока у приложения нет
   ОПУБЛИКОВАННОЙ версии, API отвечает 404 «Not found active version». Поэтому
   скрипт честно печатает, что осталось сделать руками (первая публикация) и какой
   командой уедет всё остальное. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const wantCheck = process.argv.includes('--check');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function run(cmd, cwd) {
  console.log('\n▶️  ' + cmd);
  execSync(cmd, { cwd: cwd || ROOT, stdio: 'inherit' });
}

const version = (read('www/js/helpers.js').match(/GAME_VERSION = '([^']+)'/) || [])[1] || '?';
const code = (read('android/app/build.gradle').match(/versionCode (\d+)/) || [])[1] || '?';

console.log('🚀 Gopher Life — релиз ' + version + ' (versionCode ' + code + ')');

if (wantCheck) run('node tools/quickcheck.js');

run('node tools/sync-www.js');
run('./gradlew assembleRelease', path.join(ROOT, 'android'));
run('node tools/copy-apk.js');
run('node tools/gh-release.js');

const apk = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const desk = path.join(require('os').homedir(), 'Desktop', 'Gopher.apk');
const md5 = require('crypto').createHash('md5').update(fs.readFileSync(apk)).digest('hex');

console.log('\n────────────────────────────────────────────────────────────');
console.log('📦 Версия ' + version + ' (versionCode ' + code + ') готова');
console.log('   на рабочем столе: ' + desk);
console.log('   md5: ' + md5);
console.log('\n① GitHub (кнопка «Обновить приложение» в игре качает отсюда):');
console.log('   node tools/gh-release.js');
console.log('\n② Дальше — RuStore. Состояние смотрится командой:');
console.log('   node tools/rustore-publish.js status --go');
console.log('Пока у приложения нет ОПУБЛИКОВАННОЙ версии, RuStore не даёт создать новую');
console.log('(API отвечает 404 «Not found active version» — это их правило, а не ошибка');
console.log('данных). Два пути:');
console.log('   • загрузить этот APK вручную в веб-консоли — поля готовы в');
console.log('     store/CONSOLE_PASTE.txt (10 минут, версия ' + version + ', versionCode ' + code + ');');
console.log('   • дождаться публикации текущей версии и отправить всё одной командой:');
console.log('     node tools/rustore-publish.js all --go');
console.log('     (черновик с текстами + APK + 10 скриншотов + отправка на модерацию)');
console.log('────────────────────────────────────────────────────────────\n');