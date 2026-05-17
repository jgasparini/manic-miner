import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  // data: { won, score, levelIndex, lives, hasNextLevel, audio }
  create(data) {
    const cx    = GAME_WIDTH / 2;
    const cy    = GAME_HEIGHT / 2;
    const audio = data.audio ?? null;

    const title      = data.won ? 'LEVEL COMPLETE!' : 'GAME OVER';
    const titleColor = data.won ? '#00ff88'         : '#ff4444';

    this.add.rectangle(cx, cy, 420, 240, 0x000000, 0.88).setOrigin(0.5);

    this.add.text(cx, cy - 80, title, {
      font: 'bold 32px monospace', color: titleColor,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, `SCORE: ${data.score ?? 0}`, {
      font: '20px monospace', color: '#ffffff',
    }).setOrigin(0.5);

    if (data.won && data.hasNextLevel) {
      this._addButton(cx, cy + 40, 'NEXT LEVEL', () => {
        this.scene.start('Game', {
          levelIndex: data.levelIndex + 1,
          lives: data.lives,
          score: data.score,
          audio,
        });
      });
    } else if (data.won) {
      this.add.text(cx, cy + 40, 'YOU WIN!', {
        font: 'bold 22px monospace', color: '#ffff00',
      }).setOrigin(0.5);
      this._addButton(cx, cy + 90, 'MAIN MENU', () => this.scene.start('Menu', { audio }));
    } else {
      this._addButton(cx, cy + 40, 'TRY AGAIN', () => {
        this.scene.start('Game', {
          levelIndex: data.levelIndex,
          lives: 3, score: 0, audio,
        });
      });
      this._addButton(cx, cy + 85, 'MAIN MENU', () => this.scene.start('Menu', { audio }));
    }
  }

  _addButton(x, y, label, onClick) {
    const text = this.add.text(x, y, label, {
      font: '18px monospace', color: '#aaffaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerover', () => text.setColor('#ffffff'));
    text.on('pointerout',  () => text.setColor('#aaffaa'));
    text.on('pointerdown', onClick);
  }
}
