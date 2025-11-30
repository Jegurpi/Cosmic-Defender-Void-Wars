
export enum ShipClass {
  INTERCEPTOR = 'INTERCEPTOR',
  CRUISER = 'CRUISER',
  DESTROYER = 'DESTROYER',
  SPECTRE = 'SPECTRE',
  TITAN = 'TITAN'
}

export enum PowerUpType {
  HEALTH = 'HEALTH',
  SPEED = 'SPEED',
  RAPID_FIRE = 'RAPID_FIRE',
  SHIELD = 'SHIELD'
}

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  TANK = 'TANK',
  MINIBOSS = 'MINIBOSS',
  BOSS = 'BOSS',
  ASTEROID = 'ASTEROID'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  color: string;
  markedForDeletion: boolean;
  rotation?: number; // For visual rotation
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  alpha: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  velocity: Vector2;
  scale: number;
}

export interface Bullet extends Entity {
  damage: number;
  isEnemy: boolean;
  piercing?: boolean; // For Destroyer skill
}

export interface PowerUp extends Entity {
  type: PowerUpType;
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  scoreValue: number;
  shootTimer: number;
  initialY?: number;
  timeOffset?: number;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  shipClass: ShipClass;
  fireRate: number;
  lastShotTime: number;
  speed: number;
  damageMultiplier: number; // For upgrades
  shieldActive: boolean;
  collisionResistance: number; // 0 to 1 (1 = immunity)
  powerUps: { type: PowerUpType; expiresAt: number }[];
  
  // Active Skill
  skillReady: boolean;
  skillCooldownRemaining: number;
  skillActiveTimeRemaining: number;
}

export interface GameStats {
  score: number;
  levelScore: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  bossActive: boolean;
  missionTimeRemaining: number; // in ms
  isLevelComplete: boolean;
  combo: number;
  comboTimer: number;
}

export interface UpgradeOption {
  id: string;
  nameKey: string;
  descKey: string;
  apply: (player: Player) => void;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
}

export interface Achievement {
  id: string;
  nameKey: string;
  descKey: string;
  isUnlocked: boolean;
  condition: (stats: GameStats, globalStats: GlobalStats, sessionStats: any) => boolean;
  type: 'SESSION' | 'CUMULATIVE';
}

export interface GlobalStats {
  totalKills: number;
}

export const SHIP_STATS = {
  [ShipClass.INTERCEPTOR]: {
    nameKey: 'SHIP_INTERCEPTOR_NAME',
    descKey: 'SHIP_INTERCEPTOR_DESC',
    hp: 60,
    speed: 7,
    fireRate: 150,
    damage: 12,
    color: '#06b6d4',
    width: 30,
    height: 30,
    collisionResist: 0,
    skillNameKey: 'SKILL_INTERCEPTOR_NAME',
    skillDescKey: 'SKILL_INTERCEPTOR_DESC',
    skillCooldown: 10000,
    skillDuration: 3000
  },
  [ShipClass.CRUISER]: {
    nameKey: 'SHIP_CRUISER_NAME',
    descKey: 'SHIP_CRUISER_DESC',
    hp: 100,
    speed: 5,
    fireRate: 250,
    damage: 25,
    color: '#8b5cf6',
    width: 40,
    height: 40,
    collisionResist: 0.1,
    skillNameKey: 'SKILL_CRUISER_NAME',
    skillDescKey: 'SKILL_CRUISER_DESC',
    skillCooldown: 8000,
    skillDuration: 0
  },
  [ShipClass.DESTROYER]: {
    nameKey: 'SHIP_DESTROYER_NAME',
    descKey: 'SHIP_DESTROYER_DESC',
    hp: 180,
    speed: 3,
    fireRate: 400,
    damage: 50,
    color: '#ef4444',
    width: 50,
    height: 50,
    collisionResist: 0.2,
    skillNameKey: 'SKILL_DESTROYER_NAME',
    skillDescKey: 'SKILL_DESTROYER_DESC',
    skillCooldown: 15000,
    skillDuration: 1000 // visual duration
  },
  [ShipClass.SPECTRE]: {
    nameKey: 'SHIP_SPECTRE_NAME',
    descKey: 'SHIP_SPECTRE_DESC',
    hp: 40,
    speed: 9,
    fireRate: 600,
    damage: 80,
    color: '#10b981',
    width: 25,
    height: 35,
    collisionResist: 0,
    skillNameKey: 'SKILL_SPECTRE_NAME',
    skillDescKey: 'SKILL_SPECTRE_DESC',
    skillCooldown: 12000,
    skillDuration: 3000
  },
  [ShipClass.TITAN]: {
    nameKey: 'SHIP_TITAN_NAME',
    descKey: 'SHIP_TITAN_DESC',
    hp: 300,
    speed: 2,
    fireRate: 300,
    damage: 35,
    color: '#f59e0b',
    width: 60,
    height: 60,
    collisionResist: 0.7, // 70% resistance to collisions
    skillNameKey: 'SKILL_TITAN_NAME',
    skillDescKey: 'SKILL_TITAN_DESC',
    skillCooldown: 20000,
    skillDuration: 0
  }
};
