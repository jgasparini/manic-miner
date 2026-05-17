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
const LEVELS = [
  {
    name: 'level-01',
    title: 'The Mine Entrance',
    o2Seconds: 90,
    // 25 cols × 15 rows
    map: [
      '.........................',  // 0
      '.........................',  // 1
      '.........................',  // 2
      '......C..................',  // 3  high collectible, top platform
      '.....XXXXX...............',  // 4
      '.........................',  // 5
      '.C...........C...........',  // 6  mid collectibles
      '.XXX......XXXXXXX.......O',  // 7  mid platforms + portal top-right
      '.........................',  // 8
      '..........E..............',  // 9  enemy patrols ground
      '.........................',  // 10
      '....C.........C..........',  // 11 lower collectibles
      'P..XXXXXXXXXXXXXXXXXX....',  // 12 player start, big platform
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 13 solid floor
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 14 solid floor
    ],
    // Custom patrol distances for enemies (by encounter order, default = 5 tiles)
    enemyPatrols: [6],
  },

  {
    name: 'level-02',
    title: 'The Deep Shaft',
    o2Seconds: 60,
    map: [
      '.........................',  // 0
      '..C......................',  // 1  top item, hard to reach
      '.XXXXXXX.................',  // 2  top-left platform
      '...............C.........',  // 3  item on right
      '.......XXXXXXXXXX........',  // 4  mid-right platform
      '.........................',  // 5
      '...C.......C.........C...',  // 6  three items on mid platforms
      '..XXXXX...XXXXXXX...XXXX.',  // 7  three mid platforms
      '.........................',  // 8
      '.C.....E.........E...C...',  // 9  two enemies, two items
      '.XXXXXXXXXXXXXXXXXXXXXXX.',  // 10 near-full-width platform
      '.........................',  // 11
      '.....E..............O....',  // 12 third enemy near portal
      'P.XXXXXXXXXXXXXXXXXXXXXXX',  // 13 player start, ground
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 14 solid floor
    ],
    enemyPatrols: [5, 5, 4],
  },

  {
    name: 'level-03',
    title: 'The Crystal Chamber',
    o2Seconds: 45,
    map: [
      '.....................O...',  // 0  portal is up high — must climb
      'C..........C.........XXXX',  // 1  top items on high shelf
      'XXXXX.....XXXXX..........',  // 2  top platforms
      '.........................',  // 3
      '..C.........C.........C..',  // 4  mid-high items
      '.XXXXXX...XXXXXXX...XXXXX',  // 5  mid platforms
      '.........................',  // 6
      '.....C...........C.......',  // 7  mid items
      '....XXXXXXXX...XXXXXXXX..',  // 8  lower-mid platforms
      '..E...........E..........',  // 9  two enemies on big platform
      '.XXXXXXXXXXXXXXXXXXXXXXX.',  // 10 big platform
      '.........................',  // 11
      'E.........E.........E....',  // 12 three enemies on ground
      'PXXXXXXXXXXXXXXXXXXXXXXXX',  // 13 player on left, solid ground
      'XXXXXXXXXXXXXXXXXXXXXXXXX',  // 14 solid floor
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
