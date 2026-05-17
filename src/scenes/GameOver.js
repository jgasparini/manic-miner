import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  // data: { won, score, levelIndex, lives }
  create(data) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const title = data.won ? 'LEVEL COMPLETE!' : 'GAME OVER';
    const titleColour = data.won ? '#00ff88' : '#ff4444';

    this.add.rectangle(cx, cy, 400, 220, 0x000000, 0.85).setOrigin(0.5);

    this.add.text(cx, cy - 70, title, {
      font: 'bold 32px monospace', color: titleColour,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, `SCORE: ${data.score ?? 0}`, {
      font: '20px monospace', color: '#ffffff',
    }).setOrigin(0.5);

    if (data.won && data.hasNextLevel) {
      this._addButton(cx, cy + 50, 'NEXT LEVEL', () => {
        this.scene.stop('HUD');
        this.scene.start('Game', {
          levelIndex: data.levelIndex + 1,
          lives: data.lives,
          score: data.score,
        });
      });
    } else if (data.won) {
      this.add.text(cx, cy + 50, 'YOU WIN! 🎉', {
        font: '18px monospace', color: '#ffff00',
      }).setOrigin(0.5);
      this._addButton(cx, cy + 90, 'MAIN MENU', () => {
        this.scene.stop('HUD');
        this.scene.start('Menu');
      });
    } else {
      this._addButton(cx, cy + 50, 'TRY AGAIN', () => {
        this.scene.stop('HUD');
        this.scene.start('Game', {
          levelIndex: data.levelIndex,
          lives: 3,
          score: 0,
        });
      });
      this._addButton(cx, cy + 90, 'MAIN MENU', () => {
        this.scene.stop('HUD');
        this.scene.start('Menu');
      });
    }
  }

  _addButton(x, y, label, onClick) {
    const text = this.add.text(x, y, label, {
      font: '18px monospace', color: '#aaffaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerover', () => text.setColor('#ffffff'));
    text.on('pointerout', () => text.setColor('#aaffaa'));
    text.on('pointerdown', onClick);
  }
}
