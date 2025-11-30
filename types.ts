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
  name: string;
  description: string;
  apply: (player: Player) => void;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
}

export const SHIP_STATS = {
  [ShipClass.INTERCEPTOR]: {
    name: 'Перехватчик',
    description: 'Быстрый, скорострельный. Навык: Гипер-драйв.',
    hp: 60,
    speed: 7,
    fireRate: 150,
    damage: 12,
    color: '#06b6d4',
    width: 30,
    height: 30,
    collisionResist: 0,
    skillName: 'Гипер-драйв',
    skillDesc: 'Скорострельность x3 на 3 сек.',
    skillCooldown: 10000,
    skillDuration: 3000
  },
  [ShipClass.CRUISER]: {
    name: 'Крейсер',
    description: 'Сбалансированный. Навык: Ракетный залп.',
    hp: 100,
    speed: 5,
    fireRate: 250,
    damage: 25,
    color: '#8b5cf6',
    width: 40,
    height: 40,
    collisionResist: 0.1,
    skillName: 'Ракетный залп',
    skillDesc: 'Выпускает веер самонаводящихся ракет.',
    skillCooldown: 8000,
    skillDuration: 0
  },
  [ShipClass.DESTROYER]: {
    name: 'Разрушитель',
    description: 'Мощный. Навык: Мега-луч.',
    hp: 180,
    speed: 3,
    fireRate: 400,
    damage: 50,
    color: '#ef4444',
    width: 50,
    height: 50,
    collisionResist: 0.2,
    skillName: 'Мега-луч',
    skillDesc: 'Уничтожает все пули и наносит огромный урон.',
    skillCooldown: 15000,
    skillDuration: 1000 // visual duration
  },
  [ShipClass.SPECTRE]: {
    name: 'Призрак',
    description: 'Снайпер. Навык: Фазировка.',
    hp: 40,
    speed: 9,
    fireRate: 600,
    damage: 80,
    color: '#10b981',
    width: 25,
    height: 35,
    collisionResist: 0,
    skillName: 'Фазировка',
    skillDesc: 'Неуязвимость и ускорение на 3 сек.',
    skillCooldown: 12000,
    skillDuration: 3000
  },
  [ShipClass.TITAN]: {
    name: 'Титан',
    description: 'Танк. Навык: Ремонтные дроны.',
    hp: 300,
    speed: 2,
    fireRate: 300,
    damage: 35,
    color: '#f59e0b',
    width: 60,
    height: 60,
    collisionResist: 0.7, // 70% resistance to collisions
    skillName: 'Ремонт',
    skillDesc: 'Восстанавливает 30% HP и создает щит.',
    skillCooldown: 20000,
    skillDuration: 0
  }
};