/**
 * Generates placeholder PNG assets for development.
 * Run with: node scripts/gen-assets.js
 * Replace outputs with real art at any time — paths are the same.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'assets');

// ── CRC32 ──────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ── Minimal PNG encoder (RGB, 8-bit) ───────────────────────────────────────

function makePNG(width, height, pixels) {
  // pixels: Uint8Array of length width*height*3 (RGB)

  // Filter bytes (None = 0) prepended to each row
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3;
      const dst = y * (1 + width * 3) + 1 + x * 3;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }
  const idat = deflateSync(raw, { level: 1 });

  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcVal]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function solidRect(w, h, r, g, b) {
  const px = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    px[i * 3]     = r;
    px[i * 3 + 1] = g;
    px[i * 3 + 2] = b;
  }
  return makePNG(w, h, px);
}

/** Sheet of N frames side-by-side, each frame a different color from palette */
function spriteSheet(fw, fh, colors) {
  const w = fw * colors.length;
  const px = new Uint8Array(w * fh * 3);
  for (let fi = 0; fi < colors.length; fi++) {
    const [r, g, b] = colors[fi];
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        const edge = x === 0 || x === fw - 1 || y === 0 || y === fh - 1;
        const idx = (y * w + fi * fw + x) * 3;
        px[idx]     = edge ? 255 : r;
        px[idx + 1] = edge ? 255 : g;
        px[idx + 2] = edge ? 255 : b;
      }
    }
  }
  return makePNG(w, fh, px);
}

/** Tileset: single row of 8 32×32 tiles with distinct colors */
function tileset(cols, tileW, tileH) {
  const colors = [
    [60,  60,  80],  // 0 – empty (should not appear)
    [80,  60,  40],  // 1 – solid ground
    [100, 80,  60],  // 2
    [120, 100, 80],  // 3
    [60,  80,  60],  // 4
    [40,  60,  80],  // 5
    [80,  40,  60],  // 6
    [60,  80,  80],  // 7
  ];
  const w = cols * tileW;
  const px = new Uint8Array(w * tileH * 3);
  for (let c = 0; c < cols; c++) {
    const [r, g, b] = colors[c] ?? [128, 128, 128];
    for (let y = 0; y < tileH; y++) {
      for (let x = 0; x < tileW; x++) {
        const edge = x === 0 || x === tileW - 1 || y === 0 || y === tileH - 1;
        const idx = (y * w + c * tileW + x) * 3;
        px[idx]     = edge ? Math.min(r + 60, 255) : r;
        px[idx + 1] = edge ? Math.min(g + 60, 255) : g;
        px[idx + 2] = edge ? Math.min(b + 60, 255) : b;
      }
    }
  }
  return makePNG(w, tileH, px);
}

// ── Generate assets ────────────────────────────────────────────────────────

mkdirSync(join(OUT, 'tilesets'), { recursive: true });
mkdirSync(join(OUT, 'sprites'),  { recursive: true });
mkdirSync(join(OUT, 'audio'),    { recursive: true });

// Tileset – 8 tiles × 32px wide, 32px tall
writeFileSync(join(OUT, 'tilesets', 'tileset-cave.png'), tileset(8, 32, 32));
console.log('✓ tilesets/tileset-cave.png');

// Player spritesheet – 6 frames (idle, run×4, jump)
const playerColors = [
  [0, 180, 255],   // idle
  [0, 200, 255],   // run 1
  [0, 220, 255],   // run 2
  [0, 200, 220],   // run 3
  [0, 180, 220],   // run 4
  [255, 220, 0],   // jump
];
writeFileSync(join(OUT, 'sprites', 'player.png'), spriteSheet(32, 32, playerColors));
console.log('✓ sprites/player.png');

// Enemy spritesheet – 4 frames
const enemyColors = [
  [220, 50,  50],
  [240, 70,  50],
  [220, 50,  70],
  [240, 70,  70],
];
writeFileSync(join(OUT, 'sprites', 'enemy.png'), spriteSheet(32, 32, enemyColors));
console.log('✓ sprites/enemy.png');

// Collectible – gold star placeholder
writeFileSync(join(OUT, 'sprites', 'collectible.png'), solidRect(24, 24, 255, 220, 0));
console.log('✓ sprites/collectible.png');

// Portal – closed (grey), open (green)
writeFileSync(join(OUT, 'sprites', 'portal-closed.png'), solidRect(32, 48, 100, 100, 140));
console.log('✓ sprites/portal-closed.png');

writeFileSync(join(OUT, 'sprites', 'portal-open.png'),   solidRect(32, 48, 0, 255, 120));
console.log('✓ sprites/portal-open.png');

// Silent audio stubs (empty OGG-ish files — Phaser will log a warning but won't crash)
// Real audio files should replace these.
const silentOgg = Buffer.from(
  // Minimal valid OGG file (just header pages, no audio data)
  'T2dnUwACAAAAAAAAAABFkgAAAAAAAA3a6AEDdm9yYmlzAAAAAACkAAAAAAAAVgFAAAAAAACZAU9nZ1MAAAA' +
  'AAAAAAAAAACWSAAAAAAAAIJIiDQAAAAAAAAAAAFZvcmJpcw==',
  'base64',
);
for (const name of ['jump', 'collect', 'die', 'complete', 'music-game']) {
  writeFileSync(join(OUT, 'audio', `${name}.ogg`), silentOgg);
  console.log(`✓ audio/${name}.ogg (silent stub)`);
}

console.log('\nAll placeholder assets generated. Replace with real art when ready.');
