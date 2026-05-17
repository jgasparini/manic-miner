import { O2_DURATION } from '../constants.js';

export default class OxygenSystem {
  constructor(scene, durationSeconds = O2_DURATION) {
    this._scene = scene;
    this._remaining = durationSeconds * 1000; // ms
    this._total = durationSeconds * 1000;
    this._active = true;
  }

  get ratio() {
    return this._remaining / this._total;
  }

  update(delta) {
    if (!this._active) return;

    this._remaining -= delta;
    this._scene.game.events.emit('hud-update', { o2Ratio: this.ratio });

    if (this._remaining <= 0) {
      this._active = false;
      this._scene.events.emit('oxygen-depleted');
    }
  }

  stop() {
    this._active = false;
  }

  timeBonus() {
    return Math.floor((this._remaining / 1000));
  }
}
