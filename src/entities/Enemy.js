import Phaser from 'phaser';

const ENEMY_SPEED = 80;

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolDistance, groundLayer) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(28, 28).setOffset(2, 4);
    this.setCollideWorldBounds(true);

    this._groundLayer = groundLayer;
    this._startX = x;
    this._halfPatrol = (patrolDistance ?? 5) * 32 / 2; // tiles → px, half-range each side
    this._dir = 1; // 1 = right, -1 = left

    this._buildAnimations(scene);
    this.anims.play('enemy-walk', true);
  }

  update() {
    const nextX = this.x + this._dir * (ENEMY_SPEED * (1 / 60) + 2);

    // Reverse at patrol boundary
    const atBoundary = Math.abs(nextX - this._startX) >= this._halfPatrol;

    // Reverse if the tile ahead at foot level is empty (edge detection)
    const tileAhead = this._groundLayer.getTileAtWorldXY(
      this.x + this._dir * 20,
      this.y + this.height / 2 + 4,
    );
    const atEdge = !tileAhead;

    // Reverse if a wall is immediately ahead
    const wallAhead = this._dir === 1 ? this.body.blocked.right : this.body.blocked.left;

    if (atBoundary || atEdge || wallAhead) {
      this._dir *= -1;
    }

    this.setVelocityX(this._dir * ENEMY_SPEED);
    this.setFlipX(this._dir < 0);
  }

  _buildAnimations(scene) {
    if (scene.anims.exists('enemy-walk')) return;

    scene.anims.create({
      key: 'enemy-walk',
      frames: scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }
}
