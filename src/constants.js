export const TILE_SIZE = 32;
export const GRAVITY = 600;

// Player
export const PLAYER_SPEED = 160;
export const PLAYER_JUMP_VELOCITY = -380;
export const COYOTE_TIME = 80; // ms after leaving a platform where jump still registers

// Oxygen
export const O2_DURATION = 60; // seconds per level

// Lives
export const STARTING_LIVES = 3;

// Score
export const SCORE_PER_ITEM = 100;
export const SCORE_TIME_BONUS_PER_SECOND = 10;

// Game dimensions (logical resolution — Phaser scales to fit)
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;

// Level registry (ordered)
export const LEVELS = [
  'level-01',
  'level-02',
  'level-03',
];

export const LEVEL_TITLES = [
  'The Mine Entrance',
  'The Deep Shaft',
  'The Crystal Chamber',
];
