import Phaser from 'phaser';
import ProceduralAudio from '../audio/ProceduralAudio.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  // data may carry a reused audio instance from a returning GameOver scene
  init(data) {
    this._audio = data?.audio ?? new ProceduralAudio();
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 150, 'MANIC MINER', {
      font: 'bold 48px monospace', color: '#ffff00',
    }).setOrigin(0.5);

    this.add.text(cx, 220, 'A Manic Miner-inspired platformer', {
      font: '16px monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(cx, 290, 'Arrow keys / WASD  ·  Up to jump', {
      font: '13px monospace', color: '#666666',
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, 360, 'PRESS SPACE TO START', {
      font: '20px monospace', color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-SPACE', () => {
      // Resume AudioContext — this IS the required user gesture
      this._audio.resume();

      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Game', { levelIndex: 0, lives: 3, score: 0, audio: this._audio });
      });
    });
  }
}
