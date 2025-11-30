
import { Achievement } from './types';

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

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_blood',
    nameKey: 'ACH_FIRST_BLOOD',
    descKey: 'ACH_FIRST_BLOOD_DESC',
    isUnlocked: false,
    type: 'SESSION',
    condition: (stats, global, session) => session.kills >= 10
  },
  {
    id: 'survivor',
    nameKey: 'ACH_SURVIVOR',
    descKey: 'ACH_SURVIVOR_DESC',
    isUnlocked: false,
    type: 'SESSION',
    condition: (stats, global, session) => session.timeAlive >= 120000 // 2 min
  },
  {
    id: 'collector',
    nameKey: 'ACH_COLLECTOR',
    descKey: 'ACH_COLLECTOR_DESC',
    isUnlocked: false,
    type: 'SESSION',
    condition: (stats, global, session) => session.powerupsCollected >= 5
  },
  {
    id: 'boss_killer',
    nameKey: 'ACH_BOSS_KILLER',
    descKey: 'ACH_BOSS_KILLER_DESC',
    isUnlocked: false,
    type: 'SESSION',
    condition: (stats, global, session) => session.bossKilled
  },
  {
    id: 'rampage',
    nameKey: 'ACH_RAMPAGE',
    descKey: 'ACH_RAMPAGE_DESC',
    isUnlocked: false,
    type: 'SESSION',
    condition: (stats) => stats.combo >= 10
  },
  {
    id: 'veteran',
    nameKey: 'ACH_VETERAN',
    descKey: 'ACH_VETERAN_DESC',
    isUnlocked: false,
    type: 'CUMULATIVE',
    condition: (stats, global) => global.totalKills >= 500
  }
];
