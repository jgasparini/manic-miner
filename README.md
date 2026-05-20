# Manic Miner

A browser-based 2D platformer inspired by the classic 1983 ZX Spectrum game by Matthew Smith. Collect all the items in each cavern, reach the portal before your oxygen runs out, and don't touch the enemies.

Built with JavaScript + Phaser 3, bundled with Vite. All sound is generated procedurally — no audio files required.

**[▶ Play it now](https://jgasparini.github.io/manic-miner)** 

First project using, and getting familiar with, Claude Code.

## Play

```bash
npm install
npm run gen-assets   # generate pixel art sprites (run once)
npm run dev          # open http://localhost:5173
```

Controls: **Arrow keys** or **WASD** to move, **Up / W** to jump (hold longer to jump higher).

## Development

```bash
npm run build        # production build → dist/
npm run preview      # serve the dist/ folder locally
npm run gen-assets   # regenerate pixel art PNG sprites
npm run gen-levels   # regenerate Tiled JSON from ASCII level designs
npm run deploy       # build and publish to GitHub Pages
```

## Project structure

```
src/
  audio/        ProceduralAudio — Web Audio API SFX + chiptune music
  scenes/       Boot, Preload, Menu, Game, HUD, GameOver
  entities/     Player, Enemy
  systems/      LevelManager (Tiled JSON loader), OxygenSystem
  constants.js  All tunable values (speed, gravity, jump, oxygen timer…)
public/
  assets/
    tilemaps/   Tiled JSON level files (level-01 → level-06)
    tilesets/   Tileset PNG images
    sprites/    Player, enemy, collectible, portal sprites
    audio/      Silent OGG stubs (all audio is procedural at runtime)
scripts/
  gen-assets.js    Generates pixel art PNGs and silent OGG stubs
  design-levels.js Defines levels as ASCII art and writes Tiled JSON
```

## Levels

Levels are defined as ASCII art in `scripts/design-levels.js` and compiled to Tiled JSON with `npm run gen-levels`. Each map uses a consistent 3-row tier system — every platform is 96px (3 tiles) above the previous one, well within the player's jump range.

| Layer | Type | Purpose |
|---|---|---|
| `Ground` | Tile | Solid collision |
| `Decoration` | Tile | Non-collidable background |
| `Collectibles` | Objects | Items the player must collect |
| `Enemies` | Objects | Patrol enemies (`patrolDistance` int property, in tiles) |
| `Portal` | Objects | Exit — unlocks when all items collected |
| `PlayerStart` | Objects | Player spawn point |

| Level | Title | Items | Enemies | Oxygen |
|---|---|---|---|---|
| 1 | The Mine Entrance | 5 | 1 | 90s |
| 2 | The Deep Shaft | 7 | 3 | 60s |
| 3 | The Crystal Chamber | 10 | 5 | 45s |
| 4 | The Drowned Gallery | 12 | 7 | 40s |
| 5 | The Obsidian Vaults | 14 | 9 | 30s |
| 6 | The Final Descent | 16 | 11 | 25s |

## Audio

All sound is generated at runtime using the Web Audio API — no external files needed. `ProceduralAudio` provides jump, collect, die, and level-complete SFX, plus a looping chiptune melody with bass. The `AudioContext` is created on the first Space key press (browser user-gesture requirement) and reused across all scene transitions.

## Tech stack

- [Phaser 3](https://phaser.io/) — game framework
- [Vite](https://vitejs.dev/) — dev server and bundler
- Web Audio API — procedural SFX and music

## Roadmap

- [x] Player movement with coyote-time jump
- [x] Tiled level loading
- [x] Collectibles + portal mechanic
- [x] Oxygen countdown timer with low-O₂ warning
- [x] Patrol enemies with edge detection
- [x] Lives, score, HUD overlay
- [x] Menu and Game Over screens
- [x] 6 complete levels with escalating difficulty
- [x] Procedural audio (SFX + chiptune music)
- [x] Visual polish (title cards, score popups, portal pulse, death flash)
- [x] Pixel art assets (miner, bat enemy, gem, portal, cave stone tileset)
- [x] Deploy to GitHub Pages — https://jgasparini.github.io/manic-miner
