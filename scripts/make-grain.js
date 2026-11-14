// Pre-renders the grain tiles that give sections their two-colour dither look.
// Replaces the old assets/dither.js, which painted a full-size PNG per section in the browser.
//
// Each tile is 256x256 random pixels, half in the gradient's start colour, half in its end
// colour, at alpha A. CSS lays the tile (1 CSS px per pixel, image-rendering: pixelated)
// over a linear gradient whose ends are shifted so the average colour is still exactly the
// original gradient. A = 0.408 matches the old script's average noise (strength .5).
//
// Run: node scripts/make-grain.js  (writes src/assets/grain-*.png and prints the CSS gradients)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;
const A = 0.408;
const PALETTES = {
  teal: ['#173637', '#005a5d'],
  copper: ['#9c4330', '#79271a'],
};

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const out = path.join(__dirname, '..', 'src', 'assets');
for (const [name, [from, to]] of Object.entries(PALETTES)) {
  seed = name === 'teal' ? 7 : 108;
  const a = hex(from), b = hex(to);
  const alpha = Math.round(A * 255);
  const buf = Buffer.alloc(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const c = rnd() < 0.5 ? a : b;
    buf[i * 4] = c[0]; buf[i * 4 + 1] = c[1]; buf[i * 4 + 2] = c[2]; buf[i * 4 + 3] = alpha;
  }
  fs.writeFileSync(path.join(out, `grain-${name}.png`), png(SIZE, SIZE, buf));
  const m = a.map((v, i) => (v + b[i]) / 2);
  const comp = (c) => c.map((v, i) => (v - A * m[i]) / (1 - A));
  console.log(`${name}: url(grain-${name}.png) over linear-gradient(180deg, ${toHex(comp(a))}, ${toHex(comp(b))})`);
}
