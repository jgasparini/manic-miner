import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  COYOTE_TIME,
} from '../constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, audio = null) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(24, 28).setOffset(4, 4);

    this._keys  = scene.input.keyboard.createCursorKeys();
    this._wasd  = scene.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' });
    this._audio = audio;

    this._coyoteTimer = 0;
    this._isDead      = false;

    this._buildAnimations(scene);
  }

  get isDead() { return this._isDead; }

  update(time, delta) {
    if (this._isDead) return;

    const keys = this._keys;
    const wasd = this._wasd;
    const onGround = this.body.blocked.down;

    // Coyote time tracking
    if (onGround) {
      this._coyoteTimer = COYOTE_TIME;
      this._wasOnGround = true;
    } else {
      this._coyoteTimer = Math.max(0, this._coyoteTimer - delta);
    }

    const canJump = this._coyoteTimer > 0;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(keys.up) ||
                        Phaser.Input.Keyboard.JustDown(wasd.up);

    // Horizontal
    const left = keys.left.isDown || wasd.left.isDown;
    const right = keys.right.isDown || wasd.right.isDown;

    if (left) {
      this.setVelocityX(-PLAYER_SPEED);
      this.setFlipX(true);
    } else if (right) {
      this.setVelocityX(PLAYER_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Jump
    if (jumpPressed && canJump) {
      this.setVelocityY(PLAYER_JUMP_VELOCITY);
      this._coyoteTimer = 0;
      this._audio?.playJump();
    }

    // Cut jump short on release (variable height)
    if (!keys.up.isDown && !wasd.up.isDown && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * 0.85);
    }

    // Animations
    if (!onGround) {
      this.anims.play('player-jump', true);
    } else if (left || right) {
      this.anims.play('player-run', true);
    } else {
      this.anims.play('player-idle', true);
    }
  }

  die() {
    if (this._isDead) return;
    this._isDead = true;
    this.setVelocity(0, -180);
    this.body.setAllowGravity(false);
    this.setTint(0xff4444);
    this.scene.cameras.main.shake(280, 0.012);
  }

  _buildAnimations(scene) {
    if (scene.anims.exists('player-idle')) return;

    scene.anims.create({
      key: 'player-idle',
      frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1,
    });
    scene.anims.create({
      key: 'player-run',
      frames: scene.anims.generateFrameNumbers('player', { start: 1, end: 4 }),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: 'player-jump',
      frames: scene.anims.generateFrameNumbers('player', { start: 5, end: 5 }),
      frameRate: 1,
      repeat: -1,
    });
  }
}
