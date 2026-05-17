import Phaser from 'phaser';
import { GAME_WIDTH, STARTING_LIVES } from '../constants.js';

const BAR_X = 10;
const BAR_Y = 10;
const BAR_W = 200;
const BAR_H = 14;

const LOW_O2_THRESHOLD = 0.25; // bar flashes below this ratio

export default class HUD extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD', active: false });
  }

  create() {
    // Oxygen bar border
    this.add.rectangle(BAR_X + BAR_W / 2, BAR_Y + BAR_H / 2, BAR_W + 2, BAR_H + 2)
      .setStrokeStyle(1, 0xffffff).setScrollFactor(0);

    this._o2Bar = this.add.rectangle(BAR_X, BAR_Y, BAR_W, BAR_H, 0x00ccff)
      .setOrigin(0, 0).setScrollFactor(0);

    this.add.text(BAR_X, BAR_Y + BAR_H + 2, 'O₂', {
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

    // Low-oxygen warning label (hidden until needed)
    this._warnText = this.add.text(GAME_WIDTH / 2, BAR_Y + BAR_H + 4, '!! LOW OXYGEN !!', {
      font: 'bold 12px monospace', color: '#ff4400',
    }).setOrigin(0.5, 0).setScrollFactor(0).setAlpha(0);

    this._lowO2Active = false;
    this._warnTween   = null;

    this.game.events.on('hud-update', this._onUpdate, this);
    this.events.once('shutdown', () => {
      this.game.events.off('hud-update', this._onUpdate, this);
      if (this._warnTween) this._warnTween.stop();
    });
  }

  _onUpdate({ o2Ratio, lives, score }) {
    if (o2Ratio !== undefined) {
      const w = BAR_W * Math.max(0, o2Ratio);
      this._o2Bar.width = w;

      const isLow = o2Ratio < LOW_O2_THRESHOLD;
      this._o2Bar.setFillStyle(isLow ? 0xff4400 : 0x00ccff);

      if (isLow && !this._lowO2Active) {
        this._lowO2Active = true;
        this._startLowO2Warning();
      } else if (!isLow && this._lowO2Active) {
        this._lowO2Active = false;
        this._stopLowO2Warning();
      }
    }

    if (lives !== undefined) {
      this._livesText.setText(`LIVES: ${lives}`);
      // Flash lives counter red on loss
      if (lives < STARTING_LIVES) {
        this._livesText.setColor('#ff4444');
        this.time.delayedCall(400, () => this._livesText.setColor('#ffffff'));
      }
    }

    if (score !== undefined) this._scoreText.setText(`SCORE: ${score}`);
  }

  _startLowO2Warning() {
    this._warnTween = this.tweens.add({
      targets: this._warnText,
      alpha: 1,
      duration: 250,
      yoyo: true,
      repeat: -1,
    });

    // Also pulse the bar itself
    this._barTween = this.tweens.add({
      targets: this._o2Bar,
      scaleY: 1.3,
      duration: 250,
      yoyo: true,
      repeat: -1,
    });
  }

  _stopLowO2Warning() {
    if (this._warnTween) { this._warnTween.stop(); this._warnTween = null; }
    if (this._barTween)  { this._barTween.stop();  this._barTween  = null; }
    this._warnText.setAlpha(0);
    this._o2Bar.setScale(1);
  }
}
