# Manic Miner

A browser-based 2D platformer inspired by the classic 1983 ZX Spectrum game by Matthew Smith. Collect all the items in each cavern, reach the portal before your oxygen runs out, and don't touch the enemies.

Built with JavaScript + Phaser 3, bundled with Vite.

## Play

```bash
npm install
npm run gen-assets   # generate placeholder sprites (run once)
npm run dev          # open http://localhost:5173
```

Controls: **Arrow keys** or **WASD** to move, **Up / W** to jump.

## Development

```bash
npm run build        # production build → dist/
npm run preview      # serve the dist/ folder locally
npm run gen-assets   # regenerate placeholder PNG assets
```

## Project structure

```
src/
  scenes/       Boot, Preload, Menu, Game, HUD, GameOver
  entities/     Player, Enemy
  systems/      LevelManager (Tiled JSON loader), OxygenSystem
  constants.js  All tunable values (speed, gravity, oxygen timer, etc.)
public/
  assets/
    tilemaps/   Tiled JSON level files (level-01 → level-03)
    tilesets/   Tileset PNG images
    sprites/    Player, enemy, collectible, portal sprites
    audio/      SFX and music (OGG)
scripts/
  gen-assets.js Generates placeholder PNG/OGG files for development
```

## Levels

Levels are designed in [Tiled](https://www.mapeditor.org/) and exported as JSON. Each map requires these named layers:

| Layer | Type | Purpose |
|---|---|---|
| `Ground` | Tile | Solid collision |
| `Decoration` | Tile | Non-collidable background |
| `Collectibles` | Objects | Items the player must collect |
| `Enemies` | Objects | Patrol enemies (support `patrolDistance` int property) |
| `Portal` | Objects | Exit — unlocks when all items collected |
| `PlayerStart` | Objects | Player spawn point |

## Tech stack

- [Phaser 3](https://phaser.io/) — game framework
- [Vite](https://vitejs.dev/) — dev server and bundler
- [Tiled](https://www.mapeditor.org/) — level editor

## Roadmap

- [x] Player movement with coyote-time jump
- [x] Tiled level loading
- [x] Collectibles + portal mechanic
- [x] Oxygen countdown timer
- [x] Patrol enemies with edge detection
- [x] Lives, score, HUD overlay
- [x] Menu and Game Over screens
- [ ] Real pixel art and tileset
- [ ] 3 complete levels
- [ ] Sound effects and music
- [ ] Deploy to GitHub Pages
