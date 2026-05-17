import Phaser from 'phaser';
import Player from '../entities/Player.js';
import LevelManager from '../systems/LevelManager.js';
import OxygenSystem from '../systems/OxygenSystem.js';
import { SCORE_PER_ITEM, SCORE_TIME_BONUS_PER_SECOND, STARTING_LIVES, LEVELS } from '../constants.js';

const DEATH_DELAY = 800; // ms before respawn/game-over after player dies

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  // data: { levelIndex, lives, score }
  init(data) {
    this._levelIndex = data.levelIndex ?? 0;
    this._lives = data.lives ?? STARTING_LIVES;
    this._score = data.score ?? 0;
    this._itemsLeft = 0;
    this._dying = false;
  }

  create() {
    // Launch HUD as a parallel scene if not already running
    if (!this.scene.isActive('HUD')) {
      this.scene.launch('HUD');
    }

    const levelMgr = new LevelManager(this, this.physics);
    const level = levelMgr.load(this._levelIndex);

    this._groundLayer = level.groundLayer;
    this._collectibles = level.collectibles;
    this._enemies = level.enemies;
    this._portal = level.portal;
    this._itemsLeft = level.totalItems;

    // Player
    this._player = new Player(this, level.playerStart.x, level.playerStart.y);

    // Collisions
    this.physics.add.collider(this._player, this._groundLayer);
    this.physics.add.collider(this._enemies, this._groundLayer);

    // Overlaps
    this.physics.add.overlap(this._player, this._collectibles, this._onCollect, null, this);
    this.physics.add.overlap(this._player, this._portal, this._onPortal, null, this);
    this.physics.add.overlap(this._player, this._enemies, this._onEnemyHit, null, this);

    // Oxygen
    this._oxygen = new OxygenSystem(this);
    this.events.on('oxygen-depleted', () => this._triggerDeath());

    // Camera
    this.cameras.main.startFollow(this._player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Music
    if (!this.sound.get('music-game')?.isPlaying) {
      this._safePlay('music-game', { loop: true, volume: 0.3 });
    }

    // Push initial HUD state
    this._emitHUD();
  }

  update(time, delta) {
    if (this._dying) return;

    this._player.update(time, delta);

    for (const enemy of this._enemies.getChildren()) {
      enemy.update();
    }

    this._oxygen.update(delta);
  }

  // --- Overlap callbacks ---

  _onCollect(player, item) {
    item.destroy();
    this._itemsLeft--;
    this._score += SCORE_PER_ITEM;

    this._safePlay('sfx-collect', { volume: 0.5 });

    // Particle burst
    const particles = this.add.particles(item.x, item.y, 'collectible', {
      speed: { min: 40, max: 120 },
      lifespan: 400,
      scale: { start: 0.6, end: 0 },
      quantity: 8,
      emitting: false,
    });
    particles.explode(8);
    this.time.delayedCall(500, () => particles.destroy());

    if (this._itemsLeft <= 0) {
      this._portal.setTexture('portal-open');
      this._portal.refreshBody();
    }

    this._emitHUD();
  }

  _onPortal(player, portal) {
    if (this._itemsLeft > 0) return; // portal still locked
    if (this._dying) return;
    this._winning();
  }

  _onEnemyHit(player, enemy) {
    this._triggerDeath();
  }

  // --- State transitions ---

  _triggerDeath() {
    if (this._dying) return;
    this._dying = true;
    this._oxygen.stop();
    this._player.die();

    this._lives--;
    this._emitHUD();

    this.time.delayedCall(DEATH_DELAY, () => {
      this.sound.stopAll();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this._lives <= 0) {
          this.scene.stop('HUD');
          this.scene.start('GameOver', {
            won: false,
            score: this._score,
            levelIndex: this._levelIndex,
            lives: 0,
          });
        } else {
          // Restart this level with updated lives/score
          this.scene.start('Game', {
            levelIndex: this._levelIndex,
            lives: this._lives,
            score: this._score,
          });
        }
      });
    });
  }

  _winning() {
    this._dying = true; // lock input
    this._oxygen.stop();

    const timeBonus = this._oxygen.timeBonus() * SCORE_TIME_BONUS_PER_SECOND;
    this._score += timeBonus;

    this.sound.stopAll();
    this._safePlay('sfx-complete', { volume: 0.6 });
    this._emitHUD();

    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const hasNextLevel = this._levelIndex + 1 < LEVELS.length;
        this.scene.stop('HUD');
        this.scene.start('GameOver', {
          won: true,
          score: this._score,
          levelIndex: this._levelIndex,
          lives: this._lives,
          hasNextLevel,
        });
      });
    });
  }

  _safePlay(key, config) {
    try { this.sound.play(key, config); } catch (_) {}
  }

  _emitHUD() {
    this.game.events.emit('hud-update', {
      o2Ratio: this._oxygen.ratio,
      lives: this._lives,
      score: this._score,
    });
  }
}
