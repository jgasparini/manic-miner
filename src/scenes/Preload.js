import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LEVELS } from '../constants.js';

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this._buildProgressBar();

    // Tilemaps
    for (const level of LEVELS) {
      this.load.tilemapTiledJSON(`map-${level}`, `assets/tilemaps/${level}.json`);
    }

    // Tilesets
    this.load.image('tileset-cave', 'assets/tilesets/tileset-cave.png');

    // Sprites
    this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('collectible', 'assets/sprites/collectible.png');
    this.load.image('portal-closed', 'assets/sprites/portal-closed.png');
    this.load.image('portal-open', 'assets/sprites/portal-open.png');

    // Audio
    this.load.audio('sfx-jump', 'assets/audio/jump.ogg');
    this.load.audio('sfx-collect', 'assets/audio/collect.ogg');
    this.load.audio('sfx-die', 'assets/audio/die.ogg');
    this.load.audio('sfx-complete', 'assets/audio/complete.ogg');
    this.load.audio('music-game', 'assets/audio/music-game.ogg');
  }

  create() {
    this.scene.start('Menu');
  }

  _buildProgressBar() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const border = this.add.rectangle(cx, cy, 402, 22).setStrokeStyle(2, 0xffffff);
    const bar = this.add.rectangle(cx - 200, cy, 0, 18, 0x00ff88).setOrigin(0, 0.5);
    this.add.text(cx, cy - 30, 'LOADING…', { font: '16px monospace', color: '#ffffff' }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 400 * value;
    });
  }
}
