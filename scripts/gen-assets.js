/**
 * Generates pixel-art PNG assets for Manic Miner.
 * Run with: node scripts/gen-assets.js
 *
 * Sprites are designed on a 16×16 logical grid (one char = one pixel)
 * and rendered at 2× scale → 32×32 output.
 * Tileset is drawn algorithmically.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = join(__dir, '..', 'public', 'assets');

// ── CRC32 + PNG encoder ────────────────────────────────────────────────────

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
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function makePNG(width, height, pixels) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0;
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 3, d = y * (1 + width * 3) + 1 + x * 3;
      raw[d] = pixels[s]; raw[d+1] = pixels[s+1]; raw[d+2] = pixels[s+2];
    }
  }
  const idat = deflateSync(raw, { level: 1 });
  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii'), len = Buffer.alloc(4), cv = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    cv.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, cv]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Colour palette  (single char → [R,G,B]) ───────────────────────────────

const PAL = {
  '_': [12,  10,  15],   // background / black
  'W': [255, 255, 255],  // white
  'H': [255, 240, 110],  // helmet highlight
  'Y': [238, 198,   0],  // yellow (helmet)
  'y': [162, 132,   0],  // dark yellow
  'S': [240, 178,  98],  // skin
  's': [182, 120,  60],  // dark skin / shadow
  'B': [ 48, 104, 220],  // blue (overalls)
  'b': [ 22,  55, 145],  // dark blue
  'N': [122,  68,  28],  // brown (boots / belt)
  'n': [ 68,  36,  12],  // dark brown
  'R': [212,  44,  44],  // red (enemy)
  'r': [138,  18,  18],  // dark red
  'A': [255, 158,   0],  // amber (enemy detail)
  'V': [185,  55, 228],  // violet (gem)
  'v': [100,  22, 140],  // dark violet
  'G': [100, 220, 100],  // lime (gem highlight)
  'E': [ 28, 226, 132],  // emerald (portal open)
  'e': [  0, 145,  78],  // dark emerald
  'C': [ 80, 210, 255],  // cyan (portal glow)
  'K': [182, 182, 200],  // light grey (portal frame)
  'k': [108, 108, 128],  // medium grey
  'D': [ 28,  22,  36],  // dark door interior
};

function p(ch) { return PAL[ch] ?? PAL['_']; }

// ── Sprite renderer ────────────────────────────────────────────────────────
// frame: array of strings (each char = 1 logical pixel)
// Rendered at `scale`× into `pixels` at horizontal offset `ox`.

function blit(pixels, sheetW, ox, frame, scale) {
  for (let row = 0; row < frame.length; row++) {
    for (let col = 0; col < frame[row].length; col++) {
      const [r, g, b] = p(frame[row][col]);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const idx = ((row * scale + dy) * sheetW + ox + col * scale + dx) * 3;
          pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b;
        }
      }
    }
  }
}

function makeSheet(frames, logW, logH, scale = 2) {
  const fw = logW * scale, fh = logH * scale;
  const totalW = fw * frames.length;
  const px = new Uint8Array(totalW * fh * 3);
  frames.forEach((frame, i) => blit(px, totalW, i * fw, frame, scale));
  return makePNG(totalW, fh, px);
}

function makeImage(frame, scale = 2) {
  return makeSheet([frame], frame[0].length, frame.length, scale);
}

// ── Sprite data ────────────────────────────────────────────────────────────
// All sprites are 16×16 logical pixels → 32×32 px at 2× scale.
// Rows 0-11 are identical for all player frames; only the leg rows differ.

const PLAYER_TOP = [
  '________________',  // 0
  '________________',  // 1
  '___HHHHHH_______',  // 2  helmet highlight
  '__HYYyYYYY______',  // 3  helmet
  '__HYYYYYYYH_____',  // 4  helmet
  '__YYSSSSYYY_____',  // 5  helmet brim + face top
  '__YSSSSSSSY_____',  // 6  face
  '__YSWs_sWSY_____',  // 7  eyes
  '__YSSSSSSSY_____',  // 8  face lower
  '__YNBBBBBBNY____',  // 9  belt
  '___BBBBBBB______',  // 10 overalls
  '___BBBBBBB______',  // 11 overalls
];

const PLAYER_FRAMES = [
  // Frame 0 — idle
  [...PLAYER_TOP,
    '___bBb_bBb______',  // 12
    '___NNN_NNN______',  // 13
    '___nnn_nnn______',  // 14
    '________________',  // 15
  ],
  // Frame 1 — run1 (left leg forward)
  [...PLAYER_TOP,
    '__NbBb___bb_____',  // 12
    '__NNN____bN_____',  // 13
    '_________nN_____',  // 14
    '________________',  // 15
  ],
  // Frame 2 — run2 (legs together)
  [...PLAYER_TOP,
    '___bBBBBb_______',  // 12
    '___NnNnNn_______',  // 13
    '________________',  // 14
    '________________',  // 15
  ],
  // Frame 3 — run3 (right leg forward)
  [...PLAYER_TOP,
    '_____bb___bBbN__',  // 12
    '_____bN___NNN___',  // 13
    '_____nN_________',  // 14
    '________________',  // 15
  ],
  // Frame 4 — run4 (legs together, repeat)
  [...PLAYER_TOP,
    '___bBBBBb_______',  // 12
    '___NnNnNn_______',  // 13
    '________________',  // 14
    '________________',  // 15
  ],
  // Frame 5 — jump (knees out)
  [...PLAYER_TOP,
    '__NbBb_bBbN_____',  // 12
    '__Nn_____nN_____',  // 13
    '________________',  // 14
    '________________',  // 15
  ],
];

// Enemy — red bat.  Wings vary per frame; body rows 5-9 are constant.
const ENEMY_BODY = [
  '___RRAAAARR_____',  // 5  upper body / shoulders
  '___RWWRRWWR_____',  // 6  eyes (W)
  '___RRRRRRRR_____',  // 7  body
  '____RRRRRR______',  // 8  lower body
  '___R_RRRR_R_____',  // 9  legs / tail
];
const ENEMY_LOWER = Array(6).fill('________________'); // rows 10-15

const ENEMY_WINGS = [
  // Frame 0 — wings up
  ['__r________r____', '_rR________Rr___', '_rRRR____RRRr___', '_RRRRRRRRRRR____', '________________'],
  // Frame 1 — wings mid-up
  ['________________', '__r________r____', '_rRRR____RRRr___', '_RRRRRRRRRRR____', '________________'],
  // Frame 2 — wings level
  ['________________', '________________', '_rRRRRRRRRRRr___', '_RRRRRRRRRRR____', '________________'],
  // Frame 3 — wings mid-down
  ['________________', '________________', '__r________r____', '_rRRRRRRRRRr____', '_RRRRRRRRRRR____'],
];

const ENEMY_FRAMES = ENEMY_WINGS.map(w => [...w, ...ENEMY_BODY, ...ENEMY_LOWER]);

// Gem collectible — 12×12 logical → 24×24
const GEM = [
  '____________',
  '_____v______',
  '____vVv_____',
  '___vVVVv____',
  '__vVGGVVv___',
  '_vVGGGGVVv__',
  '__vVGGVVv___',
  '___vVVVv____',
  '____vVv_____',
  '_____v______',
  '____________',
  '____________',
];

// Portal — 16×24 logical → 32×48
const PORTAL_CLOSED = [
  '________________',  // 0
  '___KKKKKKKKK____',  // 1  arch crown
  '__KkkkkkkkkkK___',  // 2  arch inner top
  '_Kk__________kK_',  // 3
  '_KD__________DK_',  // 4
  '_KD__________DK_',  // 5
  '_KD__________DK_',  // 6
  '_KD__________DK_',  // 7
  '_KD__________DK_',  // 8
  '_KD__________DK_',  // 9
  '_KD__________DK_',  // 10
  '_KD__________DK_',  // 11
  '_KD__________DK_',  // 12
  '_KD__________DK_',  // 13
  '_KD__________DK_',  // 14
  '_KD__________DK_',  // 15
  '_KD__________DK_',  // 16
  '_KD__________DK_',  // 17
  '_KD__________DK_',  // 18
  '_KD__________DK_',  // 19
  '_KkkkkkkkkkkkkK_',  // 20  base top
  '_KkkkkkkkkkkkKK_',  // 21  base
  '_KKKKKKKKKKKKK__',  // 22  base bottom
  '________________',  // 23
];

const PORTAL_OPEN = [
  '________________',
  '___KEEEEEEEEK___',  // 1  glowing arch crown
  '__KeCCCCCCCeK___',  // 2  cyan inner arch
  '_Ke__________eK_',  // 3
  '_KE__________EK_',  // 4
  '_KE__________EK_',  // 5
  '_KE__________EK_',  // 6
  '_KE__________EK_',  // 7
  '_KE__________EK_',  // 8
  '_KE__________EK_',  // 9
  '_KE__________EK_',  // 10
  '_KE__________EK_',  // 11
  '_KE__________EK_',  // 12
  '_KE__________EK_',  // 13
  '_KE__________EK_',  // 14
  '_KE__________EK_',  // 15
  '_KE__________EK_',  // 16
  '_KE__________EK_',  // 17
  '_KE__________EK_',  // 18
  '_KE__________EK_',  // 19
  '_KeeeeeeeeeeeeK_',  // 20
  '_KeeeeeeeeeeKEK_',  // 21
  '_KKKKKKKKKKKKK__',  // 22
  '________________',  // 23
];

// ── Cave stone tileset (256×32, 8 tiles of 32×32) ─────────────────────────
// Drawn algorithmically: brick pattern with mortar lines and pixel variation.

function makeTileset() {
  const TW = 32, TH = 32, COLS = 8;
  const W = TW * COLS;
  const px = new Uint8Array(W * TH * 3);

  for (let ti = 0; ti < COLS; ti++) {
    const ox = ti * TW;

    // Tile 0 (map GID 1 → first tile) is the solid cave-stone wall.
    // Tiles 1-7 are darker/lighter variants for future decoration use.
    const tint = ti === 0 ? 0 : (ti % 2 === 0 ? -12 : 12);

    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        // Brick layout: alternating offset per row-band
        const brickH  = 11;
        const rowBand = Math.floor(y / brickH);
        const offset  = (rowBand % 2) * 15;
        const bx      = (x + offset) % TW;
        const by      = y % brickH;

        // Mortar lines
        const isMortar = by === brickH - 1 || bx <= 1;

        let r, g, b;
        if (isMortar) {
          r = 30 + tint; g = 24; b = 18;
        } else {
          // Deterministic stone texture
          const hash = ((x * 11 + y * 17 + ti * 31) >>> 2) % 12;
          const v    = [0,-8,8,-6,6,-4,4,-2,2,-10,10,-3][hash];
          r = Math.min(255, Math.max(0, 82 + v + tint));
          g = Math.min(255, Math.max(0, 67 + v));
          b = Math.min(255, Math.max(0, 55 + v));
        }

        // Top edge: lighter surface / grass streak
        if (y === 0)      { r = 110; g = 130; b = 72; }   // bright mossy top
        else if (y === 1) { r =  82; g =  96; b = 52; }   // dark moss
        else if (y === 2) { r =  88; g =  72; b = 58; }   // stone edge

        const idx = (y * W + ox + x) * 3;
        px[idx] = r; px[idx+1] = g; px[idx+2] = b;
      }
    }
  }
  return makePNG(W, TH, px);
}

// ── Validate sprite widths ─────────────────────────────────────────────────

function validate(name, frames, expW, expH) {
  for (const [fi, frame] of frames.entries()) {
    if (frame.length !== expH)
      throw new Error(`${name} frame ${fi}: expected ${expH} rows, got ${frame.length}`);
    for (const [ri, row] of frame.entries())
      if (row.length !== expW)
        throw new Error(`${name} frame ${fi} row ${ri}: expected ${expW} chars, got ${row.length} ("${row}")`);
  }
}

validate('PLAYER',      PLAYER_FRAMES, 16, 16);
validate('ENEMY',       ENEMY_FRAMES,  16, 16);
validate('GEM',         [GEM],         12, 12);
validate('PORTAL_CL',  [PORTAL_CLOSED],16, 24);
validate('PORTAL_OP',  [PORTAL_OPEN],  16, 24);

// ── Write files ────────────────────────────────────────────────────────────

mkdirSync(join(OUT, 'tilesets'), { recursive: true });
mkdirSync(join(OUT, 'sprites'),  { recursive: true });
mkdirSync(join(OUT, 'audio'),    { recursive: true });

writeFileSync(join(OUT, 'tilesets', 'tileset-cave.png'), makeTileset());
console.log('✓ tilesets/tileset-cave.png  (256×32, brick cave stone)');

writeFileSync(join(OUT, 'sprites', 'player.png'), makeSheet(PLAYER_FRAMES, 16, 16));
console.log('✓ sprites/player.png         (192×32, 6-frame miner)');

writeFileSync(join(OUT, 'sprites', 'enemy.png'), makeSheet(ENEMY_FRAMES, 16, 16));
console.log('✓ sprites/enemy.png          (128×32, 4-frame bat)');

writeFileSync(join(OUT, 'sprites', 'collectible.png'), makeImage(GEM));
console.log('✓ sprites/collectible.png    (24×24, diamond gem)');

writeFileSync(join(OUT, 'sprites', 'portal-closed.png'), makeImage(PORTAL_CLOSED));
console.log('✓ sprites/portal-closed.png  (32×48, stone archway)');

writeFileSync(join(OUT, 'sprites', 'portal-open.png'), makeImage(PORTAL_OPEN));
console.log('✓ sprites/portal-open.png    (32×48, glowing archway)');

// Silent audio stubs — replaced by ProceduralAudio at runtime
const silentOgg = Buffer.from(
  'T2dnUwACAAAAAAAAAABFkgAAAAAAAA3a6AEDdm9yYmlzAAAAAACkAAAAAAAAVgFAAAAAAACZAU9nZ1MAAAA' +
  'AAAAAAAAAACWSAAAAAAAAIJIiDQAAAAAAAAAAAFZvcmJpcw==', 'base64');
for (const name of ['jump', 'collect', 'die', 'complete', 'music-game']) {
  writeFileSync(join(OUT, 'audio', `${name}.ogg`), silentOgg);
}
console.log('✓ audio/*.ogg                (silent stubs — audio is procedural)');
console.log('\nAll pixel-art assets generated.');
