import Phaser from 'phaser';

export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load only what's needed to show a progress bar in Preload
  }

  create() {
    this.scene.start('Preload');
  }
}
