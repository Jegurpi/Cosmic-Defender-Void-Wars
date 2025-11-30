export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const ENEMY_SPAWN_RATE_BASE = 1500; // ms
export const POWERUP_SPAWN_CHANCE = 0.05; // 5% chance on enemy kill
export const POWERUP_DURATION = 5000; // 5 seconds
export const LEVEL_SCORE_THRESHOLD = 2000; // Deprecated by Time but kept for reference
export const MISSION_DURATION = 60000; // 60 seconds per level
export const COMBO_TIMEOUT = 2500; // ms to keep combo alive

export const STAR_COUNT = 100;
export const PLAYER_Y_POS = CANVAS_HEIGHT - 80;

// Colors
export const COLORS = {
  BULLET_PLAYER: '#fbbf24', // Amber
  BULLET_ENEMY: '#f472b6', // Pink
  BULLET_BOSS: '#ef4444', // Red
  PARTICLE_EXPLOSION: '#fcd34d',
  TEXT_PRIMARY: '#ffffff',
  HUD_BG: 'rgba(15, 23, 42, 0.8)',
  
  ENEMY_BASIC: '#a855f7',
  ENEMY_FAST: '#38bdf8',
  ENEMY_TANK: '#65a30d',
  ENEMY_MINIBOSS: '#fb923c',
  ENEMY_BOSS: '#dc2626',
  ENEMY_ASTEROID: '#64748b', // Slate for rocks

  TEXT_DAMAGE: '#ffffff',
  TEXT_CRIT: '#ef4444',
  TEXT_HEAL: '#22c55e',

  SKILL_READY: '#22c55e',
  SKILL_CD: '#475569'
};

export const KEYS = {
  // P1
  W: 'w',
  A: 'a',
  S: 's',
  D: 'd',
  SPACE: ' ',
  E: 'e', // Skill P1

  // P2
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  ENTER: 'Enter',
  SHIFT: 'Shift', // Skill P2
  
  // System
  P: 'p',
  ESC: 'Escape'
};