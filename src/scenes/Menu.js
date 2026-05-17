import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 160, 'MANIC MINER', {
      font: 'bold 48px monospace',
      color: '#ffff00',
    }).setOrigin(0.5);

    this.add.text(cx, 230, 'A Manic Miner-inspired platformer', {
      font: '16px monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, 340, 'PRESS SPACE TO START', {
      font: '20px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Game', { levelIndex: 0, lives: 3, score: 0 });
      });
    });
  }
}
