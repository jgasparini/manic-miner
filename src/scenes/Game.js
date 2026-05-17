import Phaser from 'phaser';
import Player from '../entities/Player.js';
import LevelManager from '../systems/LevelManager.js';
import OxygenSystem from '../systems/OxygenSystem.js';
import ProceduralAudio from '../audio/ProceduralAudio.js';
import {
  SCORE_PER_ITEM, SCORE_TIME_BONUS_PER_SECOND,
  STARTING_LIVES, LEVELS, LEVEL_TITLES,
  GAME_WIDTH, GAME_HEIGHT,
} from '../constants.js';

const DEATH_DELAY = 900;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  // data: { levelIndex, lives, score, audio }
  init(data) {
    this._levelIndex = data.levelIndex ?? 0;
    this._lives      = data.lives  ?? STARTING_LIVES;
    this._score      = data.score  ?? 0;
    this._itemsLeft  = 0;
    this._dying      = false;
    // Reuse the ProceduralAudio instance across scene restarts so the
    // AudioContext is never recreated (browsers block new contexts silently).
    this._audio = data.audio ?? new ProceduralAudio();
  }

  create() {
    // Resume AudioContext on first create (needs a prior user gesture from Menu)
    this._audio.resume();

    if (!this.scene.isActive('HUD')) {
      this.scene.launch('HUD');
    }

    const levelMgr = new LevelManager(this, this.physics);
    const level    = levelMgr.load(this._levelIndex);

    this._groundLayer  = level.groundLayer;
    this._collectibles = level.collectibles;
    this._enemies      = level.enemies;
    this._portal       = level.portal;
    this._itemsLeft    = level.totalItems;

    // Player — pass audio so it can trigger jump/die SFX directly
    this._player = new Player(this, level.playerStart.x, level.playerStart.y, this._audio);

    // Collisions
    this.physics.add.collider(this._player, this._groundLayer);
    this.physics.add.collider(this._enemies, this._groundLayer);

    // Overlaps
    this.physics.add.overlap(this._player, this._collectibles, this._onCollect, null, this);
    this.physics.add.overlap(this._player, this._portal,       this._onPortal,  null, this);
    this.physics.add.overlap(this._player, this._enemies,      this._onEnemyHit,null, this);

    // Oxygen
    this._oxygen = new OxygenSystem(this, level.o2Seconds);
    this.events.on('oxygen-depleted', () => this._triggerDeath());

    // Camera
    this.cameras.main.startFollow(this._player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // White flash overlay (used for death)
    this._flash = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff,
    ).setScrollFactor(0).setDepth(10).setAlpha(0);

    // Music
    this._audio.startMusic();

    this._emitHUD();

    // Level title card (fires after camera fade-in completes)
    this.cameras.main.once('camerafadeincomplete', () => this._showTitleCard());
  }

  update(time, delta) {
    if (this._dying) return;
    this._player.update(time, delta);
    for (const enemy of this._enemies.getChildren()) enemy.update();
    this._oxygen.update(delta);
  }

  // ── Overlap callbacks ────────────────────────────────────────────────────

  _onCollect(player, item) {
    const { x, y } = item;
    item.destroy();
    this._itemsLeft--;
    this._score += SCORE_PER_ITEM;

    this._audio.playCollect();

    // Particle burst
    const emitter = this.add.particles(x, y, 'collectible', {
      speed: { min: 50, max: 130 },
      lifespan: 380,
      scale: { start: 0.7, end: 0 },
      quantity: 10,
      emitting: false,
    });
    emitter.explode(10);
    this.time.delayedCall(450, () => emitter.destroy());

    // Score popup
    this._scorePopup(x, y);

    if (this._itemsLeft <= 0) {
      this._openPortal();
    }

    this._emitHUD();
  }

  _onPortal(player, portal) {
    if (this._itemsLeft > 0 || this._dying) return;
    this._winning();
  }

  _onEnemyHit() {
    this._triggerDeath();
  }

  // ── Visual helpers ───────────────────────────────────────────────────────

  _showTitleCard() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(cx, cy - 20, 520, 80, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(9).setAlpha(0);

    const levelNum = this.add.text(cx, cy - 44, `LEVEL ${this._levelIndex + 1}`, {
      font: 'bold 14px monospace', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9).setAlpha(0);

    const title = this.add.text(cx, cy - 26, LEVEL_TITLES[this._levelIndex] ?? '', {
      font: 'bold 26px monospace', color: '#ffff00',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9).setAlpha(0);

    const targets = [bg, levelNum, title];

    this.tweens.add({
      targets,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.time.delayedCall(1400, () => {
          this.tweens.add({ targets, alpha: 0, duration: 400, onComplete: () => targets.forEach(t => t.destroy()) });
        });
      },
    });
  }

  _openPortal() {
    this._portal.setTexture('portal-open');
    this._portal.refreshBody();

    // Pulse effect: scale up then settle
    this.tweens.add({
      targets: this._portal,
      scaleX: 1.3, scaleY: 1.3,
      duration: 180,
      yoyo: true,
      repeat: 2,
    });
  }

  _scorePopup(x, y) {
    const txt = this.add.text(x, y - 8, `+${SCORE_PER_ITEM}`, {
      font: 'bold 14px monospace', color: '#ffff00',
    }).setOrigin(0.5, 1).setDepth(8);

    this.tweens.add({
      targets: txt,
      y: y - 48,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  _flashWhite() {
    this.tweens.add({
      targets: this._flash,
      alpha: 0.7,
      duration: 80,
      yoyo: true,
      onComplete: () => { this._flash.setAlpha(0); },
    });
  }

  // ── State transitions ────────────────────────────────────────────────────

  _triggerDeath() {
    if (this._dying) return;
    this._dying = true;
    this._oxygen.stop();

    this._audio.playDie();
    this._flashWhite();
    this._player.die();

    this._lives--;
    this._emitHUD();

    this.time.delayedCall(DEATH_DELAY, () => {
      this._audio.stopMusic();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this._lives <= 0) {
          this.scene.stop('HUD');
          this.scene.start('GameOver', {
            won: false, score: this._score,
            levelIndex: this._levelIndex, lives: 0,
          });
        } else {
          this.scene.start('Game', {
            levelIndex: this._levelIndex,
            lives: this._lives,
            score: this._score,
            audio: this._audio,
          });
        }
      });
    });
  }

  _winning() {
    this._dying = true;
    this._oxygen.stop();

    const timeBonus = this._oxygen.timeBonus() * SCORE_TIME_BONUS_PER_SECOND;
    this._score += timeBonus;

    this._audio.stopMusic();
    this._audio.playComplete();
    this._emitHUD();

    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const hasNextLevel = this._levelIndex + 1 < LEVELS.length;
        this.scene.stop('HUD');
        this.scene.start('GameOver', {
          won: true, score: this._score,
          levelIndex: this._levelIndex,
          lives: this._lives, hasNextLevel,
          audio: this._audio,
        });
      });
    });
  }

  _emitHUD() {
    this.game.events.emit('hud-update', {
      o2Ratio: this._oxygen.ratio,
      lives: this._lives,
      score: this._score,
    });
  }
}
