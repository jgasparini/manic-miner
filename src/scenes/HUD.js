import Phaser from 'phaser';
import { GAME_WIDTH, O2_DURATION, STARTING_LIVES } from '../constants.js';

const BAR_X = 10;
const BAR_Y = 10;
const BAR_W = 200;
const BAR_H = 14;

export default class HUD extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD', active: false });
  }

  create() {
    // Oxygen bar background
    this.add.rectangle(BAR_X + BAR_W / 2, BAR_Y + BAR_H / 2, BAR_W + 2, BAR_H + 2)
      .setStrokeStyle(1, 0xffffff)
      .setScrollFactor(0);

    this._o2Bar = this.add.rectangle(BAR_X, BAR_Y, BAR_W, BAR_H, 0x00ccff)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this._o2Label = this.add.text(BAR_X, BAR_Y + BAR_H + 2, 'O₂', {
      font: '10px monospace', color: '#00ccff',
    }).setScrollFactor(0);

    // Lives
    this._livesText = this.add.text(GAME_WIDTH - 10, BAR_Y, `LIVES: ${STARTING_LIVES}`, {
      font: '14px monospace', color: '#ffffff',
    }).setOrigin(1, 0).setScrollFactor(0);

    // Score
    this._scoreText = this.add.text(GAME_WIDTH / 2, BAR_Y, 'SCORE: 0', {
      font: '14px monospace', color: '#ffff00',
    }).setOrigin(0.5, 0).setScrollFactor(0);

    // Listen for updates from Game scene
    this.game.events.on('hud-update', this._onUpdate, this);
    this.events.once('shutdown', () => {
      this.game.events.off('hud-update', this._onUpdate, this);
    });
  }

  _onUpdate({ o2Ratio, lives, score }) {
    if (o2Ratio !== undefined) {
      this._o2Bar.width = BAR_W * Math.max(0, o2Ratio);
      const colour = o2Ratio > 0.3 ? 0x00ccff : 0xff4400;
      this._o2Bar.setFillStyle(colour);
    }
    if (lives !== undefined) this._livesText.setText(`LIVES: ${lives}`);
    if (score !== undefined) this._scoreText.setText(`SCORE: ${score}`);
  }
}
