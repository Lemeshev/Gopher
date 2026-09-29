#!/usr/bin/env node
/* Генерация иконок приложения и превью маскота.
   1) собирает tools/ic_launcher_source.xml из android vector (круглый фон + гофер)
   2) рендерит mipmap-PNG всех плотностей из этого vector
   3) обновляет preview/ (иконка + гофер в разных состояниях)

   Запуск: node tools/gen-icons.js   (нужен rsvg-convert) */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const FG = path.join(RES, 'drawable', 'ic_launcher_foreground.xml');
const SRC = path.join(__dirname, 'ic_launcher_source.xml');
const PREVIEW = path.join(ROOT, 'preview');
const DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const GO_BLUE = '#00ADD8';

function sh(cmd, args) {
  cp.execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });
}

// --- 1. ic_launcher_source.xml: круглый фон + тот же гофер, что и в foreground ---
const fgXml = fs.readFileSync(FG, 'utf8');
const groupStart = fgXml.indexOf('<group');
const groupEnd = fgXml.lastIndexOf('</group>');
if (groupStart === -1 || groupEnd === -1) throw new Error('В foreground не найден <group> с маскотом');
const group = fgXml.slice(groupStart, groupEnd + '</group>'.length)
  .replace(/android:scaleX="[\d.]+"\s+android:scaleY="[\d.]+"\s+android:pivotX="[\d.]+"\s+android:pivotY="[\d.]+"/,
           'android:scaleX="0.72" android:scaleY="0.72" android:pivotX="54" android:pivotY="54"');

const sourceXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">

    <!-- Круглый фон: фирменный Go-синий -->
    <path
        android:fillColor="${GO_BLUE}"
        android:pathData="M54,54 m-52,0 a52,52 0 1,0 104,0 a52,52 0 1,0 -104,0 Z" />

${group.split('\n').map(l => (l.trim() ? '    ' + l : l)).join('\n')}
</vector>
`;
fs.writeFileSync(SRC, sourceXml);
console.log('источник иконки: ' + path.relative(ROOT, SRC));

// --- 2. mipmap PNG ---
const tmpSvg = path.join(os.tmpdir(), 'gopher-icon-' + process.pid + '.svg');
sh('node', [path.join(__dirname, 'vector-to-svg.js'), SRC, tmpSvg]);
for (const [density, px] of Object.entries(DENSITIES)) {
  const out = path.join(RES, 'mipmap-' + density, 'ic_launcher.png');
  sh('rsvg-convert', ['-w', String(px), '-h', String(px), tmpSvg, '-o', out]);
}
console.log('mipmap-PNG: ' + Object.keys(DENSITIES).join(', '));

// --- 3. превью ---
sh('rsvg-convert', ['-w', '288', '-h', '288', tmpSvg, '-o', path.join(PREVIEW, 'launcher-icon.png')]);
sh('rsvg-convert', ['-w', '48', '-h', '48', tmpSvg, '-o', path.join(PREVIEW, 'launcher-icon-48.png')]);
sh('rsvg-convert', ['-w', '288', '-h', '288', tmpSvg, '-o', path.join(PREVIEW, 'launcher-icon-adaptive.png')]);

for (const expr of ['happy', 'sleeping']) {
  const svg = path.join(PREVIEW, 'gopher-' + expr + '.svg');
  sh('node', [path.join(__dirname, 'render-gopher.js'), svg, expr]);
  sh('rsvg-convert', ['-w', '480', '-h', '480', svg, '-o', path.join(PREVIEW, 'gopher-' + expr + '.png')]);
}
console.log('превью обновлены');
