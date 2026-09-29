#!/usr/bin/env node
/* Рендер маскота из gopher.js в SVG (перехват команд canvas 2D).
   Нужен, чтобы ГЛАЗАМИ проверить, как выглядит гофер в игре.
   Запуск: node tools/render-gopher.js <файл.svg> [выражение] [экипировка] [предмет] [--char=id]
   Примеры:
     node tools/render-gopher.js /tmp/go.svg happy
     node tools/render-gopher.js /tmp/milka.svg happy - - --char=milka   */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WWW = path.join(__dirname, '..', 'www');
const outFile = process.argv[2] || '/tmp/gopher.svg';
const expression = process.argv[3] || 'happy';
const outfit = process.argv[4] || null;
const held = process.argv[5] || null;
const charArg = (process.argv.find(a => a.indexOf('--char=') === 0) || '').split('=')[1] || null;

const el = [];
let state = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, font: '10px Arial', textAlign: 'left', textBaseline: 'alphabetic' };
let tf = [];
let stack = [];
let pending = null;
let d = '';

const styleOf = mode => {
  const a = [];
  if (mode === 'fill') a.push('fill="' + (state.fillStyle || 'none') + '"');
  else { a.push('fill="none"', 'stroke="' + (state.strokeStyle || 'none') + '"', 'stroke-width="' + (state.lineWidth || 1) + '"', 'stroke-linecap="' + (state.lineCap || 'butt') + '"', 'stroke-linejoin="' + (state.lineJoin || 'miter') + '"'); }
  if (state.globalAlpha !== 1) a.push('opacity="' + state.globalAlpha + '"');
  return a.join(' ');
};
const wrap = (attr, inner) => {
  let html = inner;
  for (let i = clipStack.length - 1; i >= 0; i--) {
    html = '<g clip-path="url(#' + clipStack[i] + ')">' + html + '</g>';
  }
  el.push('<g transform="' + tf.join(' ') + '" ' + attr + '>' + html + '</g>');
};
const num = v => (Math.round(Number(v) * 100) / 100);

const ctx = {
  get fillStyle() { return state.fillStyle; }, set fillStyle(v) { state.fillStyle = v; },
  get strokeStyle() { return state.strokeStyle; }, set strokeStyle(v) { state.strokeStyle = v; },
  get lineWidth() { return state.lineWidth; }, set lineWidth(v) { state.lineWidth = v; },
  get lineCap() { return state.lineCap; }, set lineCap(v) { state.lineCap = v; },
  get lineJoin() { return state.lineJoin; }, set lineJoin(v) { state.lineJoin = v; },
  get globalAlpha() { return state.globalAlpha; }, set globalAlpha(v) { state.globalAlpha = v; },
  get font() { return state.font; }, set font(v) { state.font = v; },
  get textAlign() { return state.textAlign; }, set textAlign(v) { state.textAlign = v; },
  get textBaseline() { return state.textBaseline; }, set textBaseline(v) { state.textBaseline = v; },

  save() { stack.push(Object.assign({}, state, { tf: tf.slice(), clip: clipStack.slice() })); },
  restore() { const s = stack.pop(); if (s) { state = Object.assign({}, s); tf = s.tf; clipStack = s.clip ? s.clip.slice() : []; } },
  translate(x, y) { tf.push('translate(' + num(x) + ',' + num(y) + ')'); },
  rotate(r) { tf.push('rotate(' + num(r * 180 / Math.PI) + ')'); },
  scale(x, y) { tf.push('scale(' + num(x) + ',' + num(y) + ')'); },
  setTransform() {},
  beginPath() { pending = null; d = ''; lastShape = null; },
  moveTo(x, y) { d += ' M' + num(x) + ',' + num(y); },
  lineTo(x, y) { d += ' L' + num(x) + ',' + num(y); },
  quadraticCurveTo(cx, cy, x, y) { d += ' Q' + num(cx) + ',' + num(cy) + ' ' + num(x) + ',' + num(y); },
  closePath() { d += ' Z'; },
  arc(cx, cy, r, a0, a1, acw) {
    const FULL = Math.PI * 2;
    const start = (a0 == null) ? 0 : a0;
    let sweepDelta = ((a1 == null) ? FULL : a1) - start;
    if (!acw) { while (sweepDelta < 0) sweepDelta += FULL; }
    else { while (sweepDelta > 0) sweepDelta -= FULL; }
    // полный круг рисуем как эллипс
    if (Math.abs(sweepDelta) >= FULL - 1e-6) {
      pending = { kind: 'c', cx: cx, cy: cy, rx: r, ry: r };
      return;
    }
    const end = start + sweepDelta;
    const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end), ey = cy + r * Math.sin(end);
    const large = Math.abs(sweepDelta) > Math.PI ? 1 : 0;
    const sweep = sweepDelta > 0 ? 1 : 0;
    if (!d) d += ' M' + num(sx) + ',' + num(sy);
    d += ' A' + num(r) + ',' + num(r) + ' 0 ' + large + ' ' + sweep + ' ' + num(ex) + ',' + num(ey);
  },
  ellipse(cx, cy, rx, ry, rot) { pending = { kind: 'c', cx: cx, cy: cy, rx: rx, ry: ry, rot: rot }; },
  roundRect(x, y, w, h, r) { pending = { kind: 'r', x: x, y: y, w: w, h: h, r: (typeof r === 'number' ? r : (r && r.tl) || 0) }; },
  rect(x, y, w, h) { pending = { kind: 'r', x: x, y: y, w: w, h: h, r: 0 }; },
  fillRect(x, y, w, h) { wrap(styleOf('fill'), '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"/>'); },
  clearRect() {},
  clip() {
    const shape = pending || (d ? { kind: 'path', d: d } : lastShape);
    if (!shape) return;
    const id = 'clip' + (++clipSeq);
    let inner;
    if (shape.kind === 'path') inner = '<path d="' + shape.d.trim() + '"/>';
    else if (shape.kind === 'c') inner = '<ellipse cx="' + num(shape.cx) + '" cy="' + num(shape.cy) + '" rx="' + num(shape.rx) + '" ry="' + num(shape.ry) + '"/>';
    else inner = '<rect x="' + num(shape.x) + '" y="' + num(shape.y) + '" width="' + num(shape.w) + '" height="' + num(shape.h) + '" rx="' + num(shape.r) + '"/>';
    // clipPath в тех же координатах, что и фигура — учитываем текущий transform
    // Координаты фигуры уже в локальной системе ссылающегося элемента → transform не нужен
    defs.push('<clipPath id="' + id + '" clipPathUnits="userSpaceOnUse">' + inner + '</clipPath>');
    clipStack.push(id);
    pending = null; d = '';
  },
  createLinearGradient() { return { addColorStop() {} }; },
  createRadialGradient() { return { addColorStop() {} }; },
  measureText(t) { return { width: String(t).length * 6 }; },

  fill() { commit('fill'); },
  stroke() { commit('stroke'); },
  fillText(t, x, y) {
    const anchor = state.textAlign === 'center' ? 'middle' : (state.textAlign === 'right' ? 'end' : 'start');
    wrap('', '<text x="' + num(x) + '" y="' + num(y) + '" font-family="Arial, sans-serif" font-size="' + (parseInt(state.font, 10) || 10) + '" text-anchor="' + anchor + '" dominant-baseline="middle" fill="' + state.fillStyle + '">' + String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text>');
  }
};

let lastShape = null;
let defs = [];
let clipStack = [];
let clipSeq = 0;

function commit(mode) {
  if (pending) { lastShape = pending; }
  else if (d) { lastShape = { kind: 'path', d: d }; }
  if (!pending && !d && lastShape) { pending = lastShape; }
  if (pending) {
    if (pending.kind === 'path') {
      wrap(styleOf(mode), '<path d="' + pending.d.trim() + '"/>');
    } else if (pending.kind === 'c') {
      const rotDeg = pending.rot ? num(pending.rot * 180 / Math.PI) : 0;
      const inner = '<ellipse cx="' + num(pending.cx) + '" cy="' + num(pending.cy) + '" rx="' + num(pending.rx) + '" ry="' + num(pending.ry) + '"' + (rotDeg ? ' transform="rotate(' + rotDeg + ' ' + num(pending.cx) + ' ' + num(pending.cy) + ')"' : '') + '/>';
      wrap(styleOf(mode), inner);
    } else {
      const inner = '<rect x="' + num(pending.x) + '" y="' + num(pending.y) + '" width="' + num(pending.w) + '" height="' + num(pending.h) + '" rx="' + num(pending.r) + '"' + (pending.r * 2 > Math.min(pending.w, pending.h) ? ' ry="' + num(Math.min(pending.w, pending.h) / 2) + '"' : '') + '/>';
      wrap(styleOf(mode), inner);
    }
  } else if (d) {
    wrap(styleOf(mode), '<path d="' + d.trim() + '"/>');
  }
  pending = null; d = '';
}

const sandbox = { window: {}, Math: Math, console: console };
sandbox.window = sandbox;
vm.createContext(sandbox);
// helpers.js даёт roundRect/clamp/randInt — gopher.js использует roundRect
vm.runInContext(fs.readFileSync(path.join(WWW, 'js/helpers.js'), 'utf8'), sandbox, { filename: 'helpers.js' });
vm.runInContext(fs.readFileSync(path.join(WWW, 'js/gopher.js'), 'utf8'), sandbox, { filename: 'gopher.js' });
vm.runInContext(fs.readFileSync(path.join(WWW, 'js/characters.js'), 'utf8'), sandbox, { filename: 'characters.js' });

const g = charArg ? sandbox.createCharacter(charArg, 100) : new sandbox.Gopher(null, 100);
for (let i = 0; i < 30; i++) g.draw(ctx, 0, 0, 1);      // разогрев анимации
el.length = 0; tf = []; stack = []; pending = null; d = '';   // очистка
g.expression = expression;
if (outfit && outfit !== '-') g.outfit = outfit;
if (held && held !== '-') g.heldEmoji = held;
g.shower = 0;
g.blinking = false;
g.draw(ctx, 0, 0, 1);

const size = 320;
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="-80 -80 160 160"><defs>' + defs.join('') + '</defs>' +
  '<rect x="-80" y="-80" width="160" height="160" fill="#16213e"/>' +
  '<g transform="translate(0,10)">' + el.join('') + '</g></svg>';
fs.writeFileSync(outFile, svg);
console.log('Сохранено: ' + outFile + '  (элементов: ' + el.length + ', выражение: ' + expression + ')');
