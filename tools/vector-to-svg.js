#!/usr/bin/env node
/* Конвертер Android VectorDrawable -> SVG.
   Запуск: node tools/vector-to-svg.js <drawable.xml> <out.svg> [--bg=#RRGGBB]
   Нужен, чтобы рендерить иконки в PNG (rsvg-convert) и глазами проверять результат. */
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const bgArg = process.argv.find(a => a.startsWith('--bg='));

if (!src || !out) {
  console.error('Использование: node tools/vector-to-svg.js <in.xml> <out.svg> [--bg=#RRGGBB]');
  process.exit(1);
}

const xml = fs.readFileSync(src, 'utf8');
const vw = parseFloat((xml.match(/android:viewportWidth="([\d.]+)"/) || [, '108'])[1]);
const vh = parseFloat((xml.match(/android:viewportHeight="([\d.]+)"/) || [, '108'])[1]);

// <group> в android несёт scale/translate/pivot — переносим в SVG transform
const groupTransforms = [];
const groupRe = /<group([^>]*?)\/?>/g;
let gm;
while ((gm = groupRe.exec(xml)) !== null) {
  const attrs = gm[1];
  const g = a => { const r = attrs.match(new RegExp(a + '="([^"]*)"')); return r ? parseFloat(r[1]) : null; };
  const sx = g('android:scaleX') || 1, sy = g('android:scaleY') || 1;
  const px = g('android:pivotX') || 0, py = g('android:pivotY') || 0;
  const tx = g('android:translateX') || 0, ty = g('android:translateY') || 0;
  groupTransforms.push(
    'translate(' + (px + tx) + ',' + (py + ty) + ') scale(' + sx + ',' + sy + ') translate(' + (-px) + ',' + (-py) + ')'
  );
}

let body = '';
const paths = [...xml.matchAll(/<path\b([\s\S]*?)\/>/g)].map(m => m[1]);
for (const a of paths) {
  const get = n => { const m = a.match(new RegExp(n + '="([^"]*)"')); return m ? m[1] : null; };
  const d = get('android:pathData');
  if (!d) continue;
  const fill = get('android:fillColor') || 'none';
  const stroke = get('android:strokeColor');
  const sw = get('android:strokeWidth');
  const alpha = get('android:fillAlpha');
  const attrs = ['d="' + d + '"', 'fill="' + (fill === '#00000000' ? 'none' : fill) + '"'];
  if (stroke) { attrs.push('stroke="' + stroke + '"', 'stroke-width="' + (sw || 1) + '"'); }
  if (alpha) attrs.push('fill-opacity="' + alpha + '"');
  body += '<path ' + attrs.join(' ') + '/>';
}

let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + vw + ' ' + vh + '" width="' + vw + '" height="' + vh + '">';
if (bgArg) svg += '<rect width="' + vw + '" height="' + vh + '" fill="' + bgArg.split('=')[1] + '"/>';
svg += groupTransforms.length ? '<g transform="' + groupTransforms.join(' ') + '">' + body + '</g>' : body;
svg += '</svg>';

fs.writeFileSync(out, svg);
console.log('SVG: ' + out + '  (path: ' + paths.length + ', групп: ' + groupTransforms.length + ')');
