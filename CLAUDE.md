# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Browser-based 2D platformer inspired by Manic Miner (1983). Core loop: collect all items in a cavern, reach the portal before the oxygen runs out, avoid enemies. Built with JavaScript + Phaser 3 + Vite. Levels designed in Tiled and exported as JSON.

## Commands

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build → dist/
npm run preview      # Serve the dist/ folder locally
npm run gen-assets   # Regenerate placeholder PNG assets (node scripts/gen-assets.js)
```

No test runner is set up yet.

## Architecture

### Scene flow
```
Boot → Preload → Menu → Game (+ HUD overlay) → GameOver
                          ↑___________________________|
```
`HUD` is launched as a parallel scene above `Game` and is never destroyed on level reload. It receives updates via `this.game.events.emit('hud-update', { o2Ratio, lives, score })` from `Game`.

### Key files
| File | Purpose |
|---|---|
| `src/main.js` | Phaser game config and scene registry |
| `src/constants.js` | All numeric tunables (speed, gravity, oxygen duration, etc.) |
| `src/scenes/Game.js` | Core gameplay loop — ties all systems together |
| `src/scenes/HUD.js` | Overlay scene; listens to `hud-update` events |
| `src/entities/Player.js` | Arcade physics sprite; coyote-time jump, animations |
| `src/entities/Enemy.js` | Patrol AI with edge + wall detection via tilemap lookup |
| `src/systems/LevelManager.js` | Loads Tiled JSON map, spawns all objects |
| `src/systems/OxygenSystem.js` | Countdown timer; emits `oxygen-depleted` on the scene |

### Level data
Levels are Tiled JSON files in `public/assets/tilemaps/`. Each map must have these **named layers** (Phaser reads by name):

| Layer | Type | Notes |
|---|---|---|
| `Ground` | Tile | Solid collision — all non-empty tiles are collidable |
| `Decoration` | Tile | Non-collidable background tiles |
| `Collectibles` | Objects | Rectangle objects; all must be collected to open portal |
| `Enemies` | Objects | Rectangle objects; support custom `patrolDistance` (int, in tiles) property |
| `Portal` | Objects | Single rectangle object |
| `PlayerStart` | Objects | Single rectangle object; player spawns at center-x, top-y |

Object layer coordinates: Tiled shape objects store `y` at the **top** of the bounding box. `LevelManager` adds `height/2` to get center y for sprites.

### Placeholder assets
`scripts/gen-assets.js` generates all required PNG spritesheets and silent OGG stubs using only Node.js builtins (no extra packages). Run it once after cloning, then replace outputs with real art.

Expected asset paths (relative to `public/assets/`):
- `tilesets/tileset-cave.png` — 256×32, 8 tiles side-by-side
- `sprites/player.png` — spritesheet: 6 frames × 32×32 (idle, run×4, jump)
- `sprites/enemy.png` — spritesheet: 4 frames × 32×32
- `sprites/collectible.png`, `portal-closed.png`, `portal-open.png` — single images
- `audio/jump.ogg`, `collect.ogg`, `die.ogg`, `complete.ogg`, `music-game.ogg`
