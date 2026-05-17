/**
 * Defines all three levels as ASCII art and writes Tiled JSON files.
 * Run with: node scripts/design-levels.js
 *
 * ASCII legend:
 *   . or space  = empty tile
 *   X           = solid ground tile
 *   P           = player spawn (empty tile + object)
 *   C           = collectible  (empty tile + object)
 *   E           = enemy        (empty tile + object, uses default patrolDistance)
 *   e           = enemy        (empty tile + object, short patrol: 3 tiles)
 *   O           = portal exit  (empty tile + object)
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = join(__dir, '..', 'public', 'assets', 'tilemaps');

const TILE_W = 32;
const TILE_H = 32;
const SOLID  = 1; // GID in tileset

// ── Level definitions ──────────────────────────────────────────────────────

// Each level is an array of exactly-25-character strings (15 rows).
// Platform tier heights (with PLAYER_JUMP_VELOCITY = -480, max jump ≈ 192px = 6 tiles):
//   Items are placed ONE ROW ABOVE their platform so the player walks into them
//   without needing an extra jump (sprite centre matches item centre).
//   Vertical gap between consecutive tiers is 3 rows (96px) — comfortable.
//
//   Tier layout (row numbers):
//     Tier 0  Ground     rows 13-14  y=416 (standing surface)
//     Tier 1  row 11     y=352       gap from ground: 2 rows / 64px  ✓ easy
//     Tier 2  row 8      y=256       gap from T1:     3 rows / 96px  ✓ easy
//     Tier 3  row 5      y=160       gap from T2:     3 rows / 96px  ✓ easy
//     Tier 4  row 2      y=64        gap from T3:     3 rows / 96px  ✓ easy

const LEVELS = [
  {
    name: 'level-01',
    title: 'The Mine Entrance',
    o2Seconds: 90,
    map: [
      '.........................',  //  0
      '.........................',  //  1
      '.........................',  //  2
      '.........................',  //  3
      '..........C...........O..',  //  4  1 item + portal (same height as T3 platform surface)
      '.....XXXXXXXXXXXXXXXXXX..',  //  5  T3 platform  cols 5-22
      '.........................',  //  6
      '..C..............C.......',  //  7  2 items (same height as T2 platform surface)
      '.XXXXXXXX......XXXXXXXX..',  //  8  T2 platforms cols 1-8, cols 15-22
      '.........................',  //  9
      '.....C..........C........',  // 10  2 items (same height as T1 platform surface)
      '...XXXXXXX..XXXXXXXXXX...',  // 11  T1 platforms cols 3-11, cols 13-22
      'P...........E............',  // 12  player + enemy on ground
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 13
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 14
    ],
    enemyPatrols: [6],
  },

  {
    name: 'level-02',
    title: 'The Deep Shaft',
    o2Seconds: 60,
    map: [
      '.........................',  //  0
      '.........................',  //  1
      '.C....C.........C.....O..',  //  2  3 items + portal (T4 surface height)
      '.XXXXX...........XXXXXX..',  //  3  T4 platforms cols 1-5, cols 17-22
      '.........................',  //  4
      '....C............C.......',  //  5  2 items (T3 surface height)
      '...XXXXX.......XXXXXXXX..',  //  6  T3 platforms cols 3-7, cols 15-22
      '..E.............E........',  //  7  2 enemies — fall to T3 platforms
      '......C..........C.......',  //  8  2 items (T2 surface height)
      '.....XXXXXXX...XXXXXXXX..',  //  9  T2 platforms cols 5-11, cols 15-22
      '.........................',  // 10
      '.....E...................',  // 11  enemy on ground
      'P........................',  // 12  player
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 13
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 14
    ],
    enemyPatrols: [5, 5, 4],
  },

  {
    name: 'level-03',
    title: 'The Crystal Chamber',
    o2Seconds: 45,
    map: [
      '.........................',  //  0
      '.C...............C....O..',  //  1  2 items + portal (T4 surface height)
      '.XXXXX...........XXXXXX..',  //  2  T4 platforms cols 1-5, cols 17-22
      '.........................',  //  3
      '....C......C......C......',  //  4  3 items (T3 surface height)
      '...XXXXX..XXXXXX..XXXXX..',  //  5  T3 platforms cols 3-7, 10-15, 18-22
      '...E.......E.......E.....',  //  6  3 enemies — fall to T3 platforms
      '.................C.......',  //  7  1 item (T2 surface height)
      '........XXXXXXXXXX.......',  //  8  T2 platform   cols 8-17
      '....C.................C..',  //  9  2 items (T1 surface height)
      '...XXXXXX.......XXXXXXXX.',  // 10  T1 platforms cols 3-8, cols 16-23
      '.....E.........E.........',  // 11  2 enemies — fall to ground
      'P.........C...........C..',  // 12  player + 2 ground items
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 13
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 14
    ],
    enemyPatrols: [5, 5, 5, 4, 4],
  },
];

// ── ASCII → Tiled JSON ─────────────────────────────────────────────────────

function buildTiledJSON(level) {
  const rows = level.map;
  const height = rows.length;
  const width  = rows[0].length;

  if (rows.some(r => r.length !== width)) {
    throw new Error(`[${level.name}] All rows must be ${width} chars wide`);
  }

  // Tile layer data (Ground)
  const groundData = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      groundData.push(rows[r][c] === 'X' ? SOLID : 0);
    }
  }

  // Decoration layer — all zeros for now
  const decoData = new Array(width * height).fill(0);

  // Object layers
  const collectibles = [];
  const enemies      = [];
  let   portal       = null;
  let   playerStart  = null;
  let   objId        = 1;
  let   enemyIdx     = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const ch = rows[r][c];
      const x  = c * TILE_W;
      const y  = r * TILE_H;

      if (ch === 'C') {
        collectibles.push({ id: objId++, name: 'item', type: '', x, y, width: TILE_W, height: TILE_H, properties: [] });
      } else if (ch === 'E' || ch === 'e') {
        const patrol = ch === 'e' ? 3 : (level.enemyPatrols[enemyIdx] ?? 5);
        enemyIdx++;
        enemies.push({
          id: objId++, name: 'enemy', type: '', x, y, width: TILE_W, height: TILE_H,
          properties: [{ name: 'patrolDistance', type: 'int', value: patrol }],
        });
      } else if (ch === 'O') {
        portal = { id: objId++, name: 'portal', type: '', x, y, width: TILE_W, height: TILE_H, properties: [] };
      } else if (ch === 'P') {
        playerStart = { id: objId++, name: 'start', type: '', x, y, width: TILE_W, height: TILE_H, properties: [] };
      }
    }
  }

  if (!playerStart) throw new Error(`[${level.name}] Missing player start (P)`);
  if (!portal)      throw new Error(`[${level.name}] Missing portal (O)`);

  const o2Prop = { name: 'o2Seconds', type: 'int', value: level.o2Seconds };

  return {
    compressionlevel: -1,
    height,
    infinite: false,
    properties: [o2Prop],
    layers: [
      tileLayer('Decoration', decoData, width, height, 1),
      tileLayer('Ground',     groundData, width, height, 2),
      objectLayer('Collectibles', collectibles, 3),
      objectLayer('Enemies',      enemies, 4),
      objectLayer('Portal',       [portal], 5),
      objectLayer('PlayerStart',  [playerStart], 6),
    ],
    nextlayerid: 7,
    nextobjectid: objId,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.0',
    tileheight: TILE_H,
    tilesets: [{
      columns: 8,
      firstgid: 1,
      image: '../tilesets/tileset-cave.png',
      imageheight: TILE_H,
      imagewidth: TILE_W * 8,
      margin: 0,
      name: 'tileset-cave',
      spacing: 0,
      tilecount: 8,
      tileheight: TILE_H,
      tilewidth: TILE_W,
    }],
    tilewidth: TILE_W,
    type: 'map',
    version: '1.10',
    width,
  };
}

function tileLayer(name, data, width, height, id) {
  return { data, height, id, name, opacity: 1, type: 'tilelayer', visible: true, width, x: 0, y: 0 };
}

function objectLayer(name, objects, id) {
  return { draworder: 'topdown', id, name, objects, opacity: 1, type: 'objectgroup', visible: true, x: 0, y: 0 };
}

// ── Write files ────────────────────────────────────────────────────────────

for (const level of LEVELS) {
  const json = buildTiledJSON(level);
  const path = join(OUT, `${level.name}.json`);
  writeFileSync(path, JSON.stringify(json, null, 2));
  const items   = json.layers.find(l => l.name === 'Collectibles').objects.length;
  const enemies = json.layers.find(l => l.name === 'Enemies').objects.length;
  console.log(`✓ ${level.name}.json  "${level.title}"  —  ${items} items, ${enemies} enemies, ${level.o2Seconds}s O₂`);
}
