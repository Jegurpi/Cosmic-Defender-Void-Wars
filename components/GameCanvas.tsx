import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_HEIGHT, 
  CANVAS_WIDTH, 
  COLORS, 
  ENEMY_SPAWN_RATE_BASE, 
  KEYS, 
  MISSION_DURATION,
  PLAYER_Y_POS, 
  POWERUP_DURATION, 
  POWERUP_SPAWN_CHANCE, 
  STAR_COUNT,
  COMBO_TIMEOUT 
} from '../constants';
import { 
  Bullet, 
  Enemy, 
  EnemyType, 
  Entity, 
  GameStats, 
  Particle, 
  Player, 
  PowerUp, 
  PowerUpType, 
  SHIP_STATS, 
  ShipClass, 
  UpgradeOption,
  FloatingText 
} from '../types';

interface GameCanvasProps {
  selectedClass: ShipClass;
  gameMode: 'SINGLE' | 'COOP';
  onGameOver: (score: number) => void;
  onExit: () => void;
}

interface PlayerHudState {
    hp: number;
    maxHp: number;
    skillReady: boolean;
    skillCooldown: number;
    skillMaxCooldown: number;
    buffs: PowerUpType[];
    isDead: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ selectedClass, gameMode, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const playersRef = useRef<Player[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const shakeRef = useRef<number>(0); // Screenshake intensity
  
  const gameStatsRef = useRef<GameStats>({
    score: 0,
    levelScore: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
    bossActive: false,
    missionTimeRemaining: MISSION_DURATION,
    isLevelComplete: false,
    combo: 0,
    comboTimer: 0
  });
  
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);

  // React State for UI
  const [hudStats, setHudStats] = useState<GameStats>(gameStatsRef.current);
  const [playersHud, setPlayersHud] = useState<PlayerHudState[]>([]);
  const [bossHpData, setBossHpData] = useState<{current: number, max: number, name: string} | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

  // --- Initialization ---

  const createPlayer = (id: string, startX: number): Player => {
      const stats = SHIP_STATS[selectedClass];
      return {
        id: id,
        pos: { x: startX, y: PLAYER_Y_POS },
        velocity: { x: 0, y: 0 },
        width: stats.width,
        height: stats.height,
        color: stats.color,
        hp: stats.hp,
        maxHp: stats.hp,
        shipClass: selectedClass,
        fireRate: stats.fireRate,
        lastShotTime: 0,
        speed: stats.speed,
        shieldActive: false,
        markedForDeletion: false,
        powerUps: [],
        collisionResistance: stats.collisionResist,
        damageMultiplier: 1,
        skillReady: true,
        skillCooldownRemaining: 0,
        skillActiveTimeRemaining: 0
      };
  };

  const initGame = useCallback(() => {
    // Create Players based on Mode
    playersRef.current = [];
    if (gameMode === 'SINGLE') {
        playersRef.current.push(createPlayer('p1', CANVAS_WIDTH / 2 - SHIP_STATS[selectedClass].width / 2));
    } else {
        playersRef.current.push(createPlayer('p1', CANVAS_WIDTH / 3)); // Left side
        playersRef.current.push(createPlayer('p2', (CANVAS_WIDTH / 3) * 2)); // Right side
    }

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];
    gameStatsRef.current = { 
      score: 0, 
      levelScore: 0, 
      level: 1, 
      isGameOver: false, 
      isPaused: false, 
      bossActive: false,
      missionTimeRemaining: MISSION_DURATION,
      isLevelComplete: false,
      combo: 0,
      comboTimer: 0
    };
    
    starsRef.current = Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1
    }));
    
    setHudStats({ ...gameStatsRef.current });
    setBossHpData(null);
    setUpgradeOptions([]);
  }, [selectedClass, gameMode]);

  // --- Helpers ---

  const addShake = (amount: number) => {
    shakeRef.current = amount;
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string, scale: number = 1) => {
      floatingTextsRef.current.push({
          id: Math.random().toString(),
          x,
          y,
          text,
          color,
          life: 1.0,
          velocity: { x: (Math.random() - 0.5) * 1, y: -2 },
          scale
      });
  };

  const addCombo = () => {
      gameStatsRef.current.combo++;
      gameStatsRef.current.comboTimer = COMBO_TIMEOUT;
  };

  // --- Upgrade System ---

  const generateUpgrades = () => {
    const baseUpgrades: UpgradeOption[] = [
      {
        id: 'dmg_boost',
        name: 'Усилитель плазмы',
        description: '+20% к урону (Команда)',
        rarity: 'COMMON',
        apply: (p) => { p.damageMultiplier += 0.2; }
      },
      {
        id: 'hp_boost',
        name: 'Нано-броня',
        description: '+30% Макс HP (Команда)',
        rarity: 'COMMON',
        apply: (p) => { 
          p.maxHp *= 1.3; 
          p.hp = Math.min(p.hp + p.maxHp * 0.3, p.maxHp);
        }
      },
      {
        id: 'fire_rate',
        name: 'Система охлаждения',
        description: '+15% скорострельности (Команда)',
        rarity: 'RARE',
        apply: (p) => { p.fireRate *= 0.85; }
      },
      {
        id: 'speed_boost',
        name: 'Ионный двигатель',
        description: '+15% скорости (Команда)',
        rarity: 'COMMON',
        apply: (p) => { p.speed *= 1.15; }
      },
      {
        id: 'full_restore',
        name: 'Ремкомплект',
        description: 'Полное восстановление HP',
        rarity: 'RARE',
        apply: (p) => { p.hp = p.maxHp; }
      }
    ];
    
    // Pick 3 random
    const shuffled = baseUpgrades.sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
  };

  const selectUpgrade = (upgrade: UpgradeOption) => {
    // Apply to ALL players, revive dead ones with partial HP
    playersRef.current.forEach(p => {
        if (p.hp <= 0) p.hp = p.maxHp * 0.5; // Revive mechanism
        upgrade.apply(p);
    });
    
    // Start next level
    gameStatsRef.current.level++;
    gameStatsRef.current.missionTimeRemaining = MISSION_DURATION;
    gameStatsRef.current.bossActive = false;
    gameStatsRef.current.isLevelComplete = false;
    gameStatsRef.current.isPaused = false;
    gameStatsRef.current.combo = 0;
    
    setUpgradeOptions([]);
  };

  // --- Game Loop Helpers ---

  const spawnParticle = (x: number, y: number, color: string, count: number = 5, speed: number = 5) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        velocity: { x: (Math.random() - 0.5) * speed, y: (Math.random() - 0.5) * speed },
        width: 3,
        height: 3,
        color: color,
        life: 1.0,
        maxLife: 1.0,
        alpha: 1,
        markedForDeletion: false
      });
    }
  };

  const spawnBoss = (isMiniBoss: boolean, timestamp: number) => {
    gameStatsRef.current.bossActive = true;
    addShake(20);
    
    enemiesRef.current.forEach(e => {
        if (e.type !== EnemyType.ASTEROID) {
            spawnParticle(e.pos.x + e.width/2, e.pos.y + e.height/2, e.color, 5);
            e.markedForDeletion = true;
        }
    });

    const level = gameStatsRef.current.level;
    const coopMulti = gameMode === 'COOP' ? 1.5 : 1; 
    const hpMultiplier = isMiniBoss ? 15 : 50;
    const hp = (level * 100 + hpMultiplier * level * 2) * coopMulti;
    const width = isMiniBoss ? 60 : 120;
    const height = isMiniBoss ? 50 : 80;
    
    enemiesRef.current.push({
      id: isMiniBoss ? 'miniboss' : 'boss',
      type: isMiniBoss ? EnemyType.MINIBOSS : EnemyType.BOSS,
      pos: { x: CANVAS_WIDTH / 2 - width / 2, y: -100 },
      velocity: { x: 0, y: 1 },
      width: width,
      height: height,
      color: isMiniBoss ? COLORS.ENEMY_MINIBOSS : COLORS.ENEMY_BOSS,
      hp: hp,
      maxHp: hp,
      markedForDeletion: false,
      scoreValue: isMiniBoss ? 500 * level : 5000 * level,
      shootTimer: timestamp + 2000,
      initialY: 80 
    });
  };

  const spawnEnemy = (timestamp: number) => {
    if (gameStatsRef.current.bossActive || gameStatsRef.current.missionTimeRemaining <= 0) return;

    const level = gameStatsRef.current.level;
    const rand = Math.random();
    
    // Asteroid Logic (Starts from Level 2, increases chance)
    const asteroidChance = level > 1 ? Math.min(0.2 + (level * 0.05), 0.5) : 0;
    
    if (Math.random() < asteroidChance) {
        // Spawn Asteroid
        const size = 40 + Math.random() * 40;
        enemiesRef.current.push({
            id: Math.random().toString(),
            type: EnemyType.ASTEROID,
            pos: { x: Math.random() * (CANVAS_WIDTH - size), y: -100 },
            velocity: { x: (Math.random() - 0.5) * 1, y: 1 + Math.random() * 2 },
            width: size,
            height: size,
            color: COLORS.ENEMY_ASTEROID,
            hp: 9999,
            maxHp: 9999,
            markedForDeletion: false,
            scoreValue: 0,
            shootTimer: 0,
            rotation: 0
        });
        return;
    }

    let type = EnemyType.BASIC;
    let size = 30;
    let hpBase = 20;
    let color = COLORS.ENEMY_BASIC;
    let speedY = 1 + (level * 0.2);

    if (rand > 0.8) {
        type = EnemyType.TANK;
        size = 45;
        hpBase = 60;
        color = COLORS.ENEMY_TANK;
        speedY = 0.5 + (level * 0.1);
    } else if (rand > 0.6) {
        type = EnemyType.FAST;
        size = 25;
        hpBase = 15;
        color = COLORS.ENEMY_FAST;
        speedY = 2 + (level * 0.3);
    }

    const coopHP = gameMode === 'COOP' ? 1.3 : 1;

    enemiesRef.current.push({
      id: Math.random().toString(),
      type: type,
      pos: { x: Math.random() * (CANVAS_WIDTH - size), y: -50 },
      velocity: { x: type === EnemyType.FAST ? (Math.random() > 0.5 ? 2 : -2) : 0, y: speedY },
      width: size,
      height: size,
      color: color,
      hp: hpBase * level * coopHP,
      maxHp: hpBase * level * coopHP,
      markedForDeletion: false,
      scoreValue: 10 * level * (type === EnemyType.TANK ? 3 : type === EnemyType.FAST ? 2 : 1),
      shootTimer: timestamp + Math.random() * 2000,
      timeOffset: Math.random() * 1000
    });
  };

  const spawnPowerUp = (x: number, y: number) => {
    const types = Object.values(PowerUpType);
    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push({
      id: Math.random().toString(),
      pos: { x, y },
      velocity: { x: 0, y: 2 },
      width: 20,
      height: 20,
      color: '#fff',
      type: type,
      markedForDeletion: false
    });
  };

  const activateSkill = (player: Player, timestamp: number) => {
      const stats = SHIP_STATS[player.shipClass];
      if (!player.skillReady) return;

      player.skillReady = false;
      player.skillCooldownRemaining = stats.skillCooldown;
      player.skillActiveTimeRemaining = stats.skillDuration;
      
      addShake(5);

      // Immediate Effects
      if (player.shipClass === ShipClass.CRUISER) {
          // Missile Swarm
          for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              bulletsRef.current.push({
                id: `missile-${i}-${player.id}`,
                pos: { x: player.pos.x + player.width/2, y: player.pos.y + player.height/2 },
                velocity: { x: Math.cos(angle) * 5, y: Math.sin(angle) * 5 - 5 },
                width: 8,
                height: 8,
                color: '#8b5cf6',
                damage: stats.damage * 2 * player.damageMultiplier,
                isEnemy: false,
                markedForDeletion: false
              });
          }
      } else if (player.shipClass === ShipClass.DESTROYER) {
          // Mega Beam
           addShake(15);
           bulletsRef.current.push({
                id: `megabeam-${timestamp}-${player.id}`,
                pos: { x: player.pos.x + player.width/2 - 25, y: 0 },
                velocity: { x: 0, y: 0 },
                width: 50,
                height: player.pos.y, 
                color: '#ef4444',
                damage: 200 * player.damageMultiplier, 
                isEnemy: false,
                markedForDeletion: false,
                piercing: true
            });
            spawnParticle(player.pos.x + player.width/2, player.pos.y, '#ef4444', 30, 10);
      } else if (player.shipClass === ShipClass.TITAN) {
          // Heal & Shield
          const healAmount = Math.floor(player.maxHp * 0.3);
          player.hp = Math.min(player.hp + healAmount, player.maxHp);
          spawnFloatingText(player.pos.x, player.pos.y - 20, `+${healAmount}`, COLORS.TEXT_HEAL, 1.5);
          player.powerUps.push({
              type: PowerUpType.SHIELD,
              expiresAt: timestamp + 5000 // 5 sec shield
          });
      }
  };

  // --- Update Loop ---

  const update = (timestamp: number, dt: number) => {
    if (gameStatsRef.current.isPaused || gameStatsRef.current.isGameOver || gameStatsRef.current.isLevelComplete) return;
    
    // Screen Shake Decay
    if (shakeRef.current > 0) {
        shakeRef.current *= 0.9;
        if (shakeRef.current < 0.5) shakeRef.current = 0;
    }

    // Combo Decay
    if (gameStatsRef.current.combo > 0) {
        gameStatsRef.current.comboTimer -= dt;
        if (gameStatsRef.current.comboTimer <= 0) {
            gameStatsRef.current.combo = 0;
        }
    }

    // 0. Timers
    if (gameStatsRef.current.missionTimeRemaining > 0 && !gameStatsRef.current.bossActive) {
        gameStatsRef.current.missionTimeRemaining -= dt;
        if (gameStatsRef.current.missionTimeRemaining <= 0) {
            gameStatsRef.current.missionTimeRemaining = 0;
            spawnBoss(false, timestamp);
        }
    }

    // 1. Players Logic
    playersRef.current.forEach((player, index) => {
        if (player.hp <= 0) return; // Skip dead players

        // Skill Timers
        if (!player.skillReady) {
            player.skillCooldownRemaining -= dt;
            if (player.skillCooldownRemaining <= 0) {
                player.skillReady = true;
                player.skillCooldownRemaining = 0;
            }
        }
        if (player.skillActiveTimeRemaining > 0) {
            player.skillActiveTimeRemaining -= dt;
        }

        // Input & Movement
        let dx = 0;
        let dy = 0;
        let fire = false;
        let skill = false;

        const isP1 = index === 0;
        const isP2 = index === 1;

        if (isP1) {
             if (keysPressed.current.has(KEYS.A)) dx = -1;
             if (keysPressed.current.has(KEYS.D)) dx = 1;
             if (keysPressed.current.has(KEYS.W)) dy = -1;
             if (keysPressed.current.has(KEYS.S)) dy = 1;
             if (keysPressed.current.has(KEYS.SPACE)) fire = true;
             if (keysPressed.current.has(KEYS.E)) skill = true;
        } else if (isP2) {
             if (keysPressed.current.has(KEYS.LEFT.toLowerCase()) || keysPressed.current.has(KEYS.LEFT)) dx = -1;
             if (keysPressed.current.has(KEYS.RIGHT.toLowerCase()) || keysPressed.current.has(KEYS.RIGHT)) dx = 1;
             if (keysPressed.current.has(KEYS.UP.toLowerCase()) || keysPressed.current.has(KEYS.UP)) dy = -1;
             if (keysPressed.current.has(KEYS.DOWN.toLowerCase()) || keysPressed.current.has(KEYS.DOWN)) dy = 1;
             if (keysPressed.current.has(KEYS.ENTER.toLowerCase()) || keysPressed.current.has(KEYS.ENTER)) fire = true;
             if (keysPressed.current.has(KEYS.SHIFT.toLowerCase()) || keysPressed.current.has(KEYS.SHIFT)) skill = true;
        }

        // Modifiers
        const hasSpeedBuff = player.powerUps.some(p => p.type === PowerUpType.SPEED);
        const isInterceptorOverdrive = player.shipClass === ShipClass.INTERCEPTOR && player.skillActiveTimeRemaining > 0;
        const isSpectrePhase = player.shipClass === ShipClass.SPECTRE && player.skillActiveTimeRemaining > 0;

        let currentSpeed = player.speed;
        if (hasSpeedBuff) currentSpeed *= 1.5;
        if (isSpectrePhase) currentSpeed *= 1.5;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        player.pos.x += dx * currentSpeed;
        player.pos.y += dy * currentSpeed;
        player.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.pos.x));
        player.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.pos.y));

        // Skill
        if (skill) activateSkill(player, timestamp);

        // Shooting
        const hasRapidFire = player.powerUps.some(p => p.type === PowerUpType.RAPID_FIRE);
        let currentFireRate = player.fireRate;
        if (hasRapidFire) currentFireRate /= 2;
        if (isInterceptorOverdrive) currentFireRate /= 3;

        if (fire && timestamp - player.lastShotTime > currentFireRate) {
            const shipStats = SHIP_STATS[player.shipClass];
            bulletsRef.current.push({
                id: Math.random().toString(),
                pos: { x: player.pos.x + player.width / 2 - 2, y: player.pos.y },
                velocity: { x: 0, y: -12 },
                width: 4,
                height: 12,
                color: COLORS.BULLET_PLAYER,
                damage: shipStats.damage * player.damageMultiplier,
                isEnemy: false,
                markedForDeletion: false
            });
            player.lastShotTime = timestamp;
        }

        // PowerUps updates
        player.powerUps = player.powerUps.filter(buff => buff.expiresAt > timestamp);
    });

    // 2. Projectiles Updates
    bulletsRef.current.forEach(b => {
      // Homing Missiles logic
      if (!b.isEnemy && b.id.startsWith('missile')) {
         const target = enemiesRef.current.find(e => !e.markedForDeletion && e.type !== EnemyType.ASTEROID);
         if (target) {
             const dx = (target.pos.x + target.width/2) - b.pos.x;
             const dy = (target.pos.y + target.height/2) - b.pos.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist > 0) {
                 b.velocity.x += (dx/dist) * 0.5;
                 b.velocity.y += (dy/dist) * 0.5;
                 const speed = 8;
                 const vMag = Math.sqrt(b.velocity.x**2 + b.velocity.y**2);
                 b.velocity.x = (b.velocity.x / vMag) * speed;
                 b.velocity.y = (b.velocity.y / vMag) * speed;
             }
         }
      }
      
      if (b.id.startsWith('megabeam')) {
          b.markedForDeletion = true; // Instant
      } else {
        b.pos.x += b.velocity.x;
        b.pos.y += b.velocity.y;
        if (b.pos.y < -50 || b.pos.y > CANVAS_HEIGHT + 50) b.markedForDeletion = true;
      }
    });

    // 3. Enemy AI
    let activeBoss: Enemy | null = null;
    enemiesRef.current.forEach(e => {
      if (e.type === EnemyType.ASTEROID) {
          e.pos.x += e.velocity.x;
          e.pos.y += e.velocity.y;
          if (e.rotation !== undefined) e.rotation += 0.02;
      } else if (e.type === EnemyType.BOSS || e.type === EnemyType.MINIBOSS) {
        activeBoss = e;
        if (e.pos.y < (e.initialY || 50)) {
            e.pos.y += 2;
        } else {
            const time = timestamp * 0.001;
            const speed = e.type === EnemyType.MINIBOSS ? 3 : 2;
            e.velocity.x = Math.sin(time) * speed;
            e.pos.x += e.velocity.x;
            e.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - e.width, e.pos.x));
        }
      } else if (e.type === EnemyType.FAST) {
          if (e.pos.x <= 0 || e.pos.x + e.width >= CANVAS_WIDTH) e.velocity.x *= -1;
          e.pos.x += e.velocity.x;
          e.pos.y += e.velocity.y;
      } else {
          e.pos.x += e.velocity.x;
          e.pos.y += e.velocity.y;
      }
      
      if (e.pos.y > CANVAS_HEIGHT) e.markedForDeletion = true;

      // Enemy Shooting
      if (e.type !== EnemyType.ASTEROID && timestamp > e.shootTimer) {
         if (e.type === EnemyType.BOSS) {
            for(let i = -2; i <= 2; i++) {
                bulletsRef.current.push({
                    id: Math.random().toString(),
                    pos: { x: e.pos.x + e.width / 2, y: e.pos.y + e.height },
                    velocity: { x: i * 2, y: 6 },
                    width: 8,
                    height: 16,
                    color: COLORS.BULLET_BOSS,
                    damage: 20,
                    isEnemy: true,
                    markedForDeletion: false
                });
            }
            e.shootTimer = timestamp + 1500;
        } else if (e.type === EnemyType.MINIBOSS) {
             for(let i = -1; i <= 1; i++) {
                bulletsRef.current.push({
                    id: Math.random().toString(),
                    pos: { x: e.pos.x + e.width / 2, y: e.pos.y + e.height },
                    velocity: { x: i, y: 7 },
                    width: 6,
                    height: 14,
                    color: COLORS.BULLET_BOSS,
                    damage: 15,
                    isEnemy: true,
                    markedForDeletion: false
                });
            }
            e.shootTimer = timestamp + 1200;
        } else {
            // Basic Enemy Shoot
            bulletsRef.current.push({
                id: Math.random().toString(),
                pos: { x: e.pos.x + e.width / 2, y: e.pos.y + e.height },
                velocity: { x: 0, y: 5 + gameStatsRef.current.level },
                width: 6,
                height: 12,
                color: COLORS.BULLET_ENEMY,
                damage: 10 * gameStatsRef.current.level,
                isEnemy: true,
                markedForDeletion: false
            });
            const rate = e.type === EnemyType.TANK ? 3000 : 2000;
            e.shootTimer = timestamp + rate + Math.random() * 1000;
        }
      }
    });

    if (activeBoss) {
        setBossHpData({
            current: activeBoss!.hp,
            max: activeBoss!.maxHp,
            name: activeBoss!.type === EnemyType.BOSS ? `БОСС УРОВНЯ ${gameStatsRef.current.level}` : 'ЭЛИТНЫЙ СТРАЖ'
        });
    } else {
        setBossHpData(null);
    }

    powerUpsRef.current.forEach(p => {
        p.pos.y += p.velocity.y;
        if (p.pos.y > CANVAS_HEIGHT) p.markedForDeletion = true;
    });

    // 4. Collision
    const checkRectCollide = (r1: Entity, r2: Entity) => {
      return (
        r1.pos.x < r2.pos.x + r2.width &&
        r1.pos.x + r1.width > r2.pos.x &&
        r1.pos.y < r2.pos.y + r2.height &&
        r1.pos.y + r1.height > r2.pos.y
      );
    };

    // Bullets vs Enemies/Players
    bulletsRef.current.forEach(b => {
      if (b.markedForDeletion && !b.piercing) return;

      if (!b.isEnemy) {
        enemiesRef.current.forEach(e => {
          if (!e.markedForDeletion && checkRectCollide(b, e)) {
            if (e.type === EnemyType.ASTEROID) {
                // Asteroids reflect bullets
                b.markedForDeletion = true;
                spawnParticle(b.pos.x, b.pos.y, '#ccc', 2);
                return;
            }

            if (!b.piercing) b.markedForDeletion = true;
            
            // Damage calc
            const isCrit = Math.random() < 0.1;
            const finalDmg = Math.floor(b.damage * (isCrit ? 1.5 : 1));
            e.hp -= finalDmg;

            spawnFloatingText(e.pos.x + e.width/2, e.pos.y, `${finalDmg}${isCrit ? '!' : ''}`, isCrit ? COLORS.TEXT_CRIT : COLORS.TEXT_DAMAGE, isCrit ? 1.5 : 1.0);
            spawnParticle(b.pos.x, b.pos.y, COLORS.PARTICLE_EXPLOSION, b.piercing ? 10 : 2);
            
            if (e.hp <= 0) {
              e.markedForDeletion = true;
              
              // Combo Logic
              addCombo();
              const comboMultiplier = 1 + (gameStatsRef.current.combo * 0.1);
              const score = Math.floor(e.scoreValue * comboMultiplier);
              
              gameStatsRef.current.score += score;
              gameStatsRef.current.levelScore += score;
              spawnParticle(e.pos.x + e.width/2, e.pos.y + e.height/2, e.color, 10);
              
              if (e.type === EnemyType.BOSS) {
                  gameStatsRef.current.isLevelComplete = true;
                  gameStatsRef.current.isPaused = true;
                  addShake(30);
                  generateUpgrades();
              } else if (e.type === EnemyType.MINIBOSS) {
                  gameStatsRef.current.bossActive = false;
                  addShake(15);
                  spawnPowerUp(e.pos.x, e.pos.y);
              }

              if (Math.random() < POWERUP_SPAWN_CHANCE) spawnPowerUp(e.pos.x, e.pos.y);
            }
          }
        });
      } else {
        // Enemy bullet vs Players
        playersRef.current.forEach(player => {
            if (player.hp <= 0) return;
            const hasShield = player.powerUps.some(p => p.type === PowerUpType.SHIELD);
            const isSpectrePhase = player.shipClass === ShipClass.SPECTRE && player.skillActiveTimeRemaining > 0;
            
            if (!hasShield && !isSpectrePhase && checkRectCollide(b, player)) {
                b.markedForDeletion = true;
                player.hp -= b.damage;
                addShake(5);
                spawnFloatingText(player.pos.x, player.pos.y, `-${b.damage}`, COLORS.TEXT_CRIT);
                spawnParticle(player.pos.x + player.width/2, player.pos.y + player.height/2, '#ef4444', 3);
            }
        });
      }
    });

    // Powerups vs Players
    powerUpsRef.current.forEach(p => {
        if (p.markedForDeletion) return;
        playersRef.current.forEach(player => {
            if (player.hp <= 0) return;
            if (checkRectCollide(p, player)) {
                p.markedForDeletion = true;
                spawnFloatingText(player.pos.x, player.pos.y - 20, p.type, COLORS.TEXT_HEAL);
                if (p.type === PowerUpType.HEALTH) {
                    player.hp = Math.min(player.hp + 30, player.maxHp);
                } else {
                    player.powerUps = player.powerUps.filter(buff => buff.type !== p.type);
                    player.powerUps.push({
                        type: p.type,
                        expiresAt: timestamp + POWERUP_DURATION
                    });
                }
            }
        });
    });

    // Enemies vs Players (Collision)
    enemiesRef.current.forEach(e => {
        if (e.markedForDeletion) return;
        playersRef.current.forEach(player => {
            if (player.hp <= 0) return;
            if (checkRectCollide(e, player)) {
                 const hasShield = player.powerUps.some(p => p.type === PowerUpType.SHIELD);
                 const isSpectrePhase = player.shipClass === ShipClass.SPECTRE && player.skillActiveTimeRemaining > 0;
            
                 if (!hasShield && !isSpectrePhase) {
                    const rawDamage = e.type === EnemyType.ASTEROID ? 50 : 30;
                    const damageTaken = Math.floor(rawDamage * (1 - player.collisionResistance));
                    
                    player.hp -= damageTaken;
                    addShake(10);
                    spawnFloatingText(player.pos.x, player.pos.y, `-${damageTaken}`, COLORS.TEXT_CRIT, 1.2);
                    spawnParticle(player.pos.x, player.pos.y, '#ef4444', 10);
                    
                    if (e.type === EnemyType.ASTEROID) {
                        e.markedForDeletion = true; // Asteroid breaks on impact
                        spawnParticle(e.pos.x, e.pos.y, '#aaa', 15);
                    } else if (e.type !== EnemyType.BOSS && e.type !== EnemyType.MINIBOSS) {
                         e.markedForDeletion = true;
                    } else {
                        e.hp -= 20;
                    }
                 } else {
                     if (e.type !== EnemyType.BOSS && e.type !== EnemyType.MINIBOSS) {
                        e.markedForDeletion = true;
                     }
                     spawnParticle(e.pos.x, e.pos.y, e.color, 5);
                 }
            }
        });
    });

    // Game Over Check
    if (playersRef.current.every(p => p.hp <= 0)) {
        gameStatsRef.current.isGameOver = true;
        onGameOver(gameStatsRef.current.score);
    }

    // Cleanup
    particlesRef.current.forEach(p => {
      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;
      p.life -= 0.05;
      p.alpha = p.life;
      if (p.life <= 0) p.markedForDeletion = true;
    });

    floatingTextsRef.current.forEach(t => {
        t.y += t.velocity.y;
        t.life -= 0.02;
        if (t.life <= 0) {
            // Remove logic handled by filter below but we can mark it
        }
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(t => t.life > 0);

    bulletsRef.current = bulletsRef.current.filter(b => !b.markedForDeletion);
    enemiesRef.current = enemiesRef.current.filter(e => !e.markedForDeletion);
    particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);
    powerUpsRef.current = powerUpsRef.current.filter(p => !p.markedForDeletion);
    
    // Spawn
    const spawnRate = gameMode === 'COOP' ? ENEMY_SPAWN_RATE_BASE * 0.7 : ENEMY_SPAWN_RATE_BASE;
    if (timestamp - spawnTimerRef.current > (spawnRate / Math.sqrt(gameStatsRef.current.level))) {
      spawnEnemy(timestamp);
      spawnTimerRef.current = timestamp;
    }

    // Update UI Stats
    setHudStats({ ...gameStatsRef.current });
    setPlayersHud(playersRef.current.map(p => ({
        hp: p.hp,
        maxHp: p.maxHp,
        skillReady: p.skillReady,
        skillCooldown: p.skillCooldownRemaining,
        skillMaxCooldown: SHIP_STATS[p.shipClass].skillCooldown,
        buffs: p.powerUps.map(pu => pu.type),
        isDead: p.hp <= 0
    })));
  };

  // --- Draw Loop ---

  const drawEntityShape = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, type: string, color: string, rotation?: number) => {
      ctx.fillStyle = color;
      
      if (rotation !== undefined) {
          ctx.save();
          ctx.translate(x + w/2, y + h/2);
          ctx.rotate(rotation);
          ctx.translate(-(x + w/2), -(y + h/2));
      }

      ctx.beginPath();
      // ... (Shape logic maintained) ...
      // Simplified mapping for brevity as shape code was long, ensuring standard shapes
      if (type.includes('INTERCEPTOR')) {
          ctx.moveTo(x + w/2, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
      } else if (type.includes('CRUISER')) {
          ctx.moveTo(x + w/2, y); ctx.lineTo(x + w, y + h*0.8); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h*0.8);
      } else if (type.includes('DESTROYER')) {
          ctx.rect(x, y + h/2, w, h/2); ctx.moveTo(x + w/2, y); ctx.lineTo(x + w * 0.8, y + h/2); ctx.lineTo(x + w * 0.2, y + h/2);
      } else if (type.includes('SPECTRE')) {
          ctx.moveTo(x + w/2, y); ctx.lineTo(x + w * 0.8, y + h); ctx.lineTo(x + w/2, y + h * 0.8); ctx.lineTo(x + w * 0.2, y + h);
      } else if (type.includes('TITAN')) {
          ctx.moveTo(x + w * 0.3, y); ctx.lineTo(x + w * 0.7, y); ctx.lineTo(x + w, y + h * 0.6); ctx.lineTo(x + w * 0.8, y + h); ctx.lineTo(x + w * 0.2, y + h); ctx.lineTo(x, y + h * 0.6);
      } else if (type === EnemyType.BASIC) {
          ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w/2, y + h);
      } else if (type === EnemyType.FAST) {
          ctx.moveTo(x + w/2, y); ctx.lineTo(x + w, y + h/2); ctx.lineTo(x + w/2, y + h); ctx.lineTo(x, y + h/2);
      } else if (type === EnemyType.TANK) {
          ctx.rect(x, y, w, h * 0.7); ctx.moveTo(x + w * 0.2, y + h * 0.7); ctx.lineTo(x + w/2, y + h); ctx.lineTo(x + w * 0.8, y + h * 0.7);
      } else if (type === EnemyType.MINIBOSS) {
          ctx.moveTo(x + w/2, y); ctx.lineTo(x + w, y + h * 0.3); ctx.lineTo(x + w, y + h * 0.7); ctx.lineTo(x + w/2, y + h); ctx.lineTo(x, y + h * 0.7); ctx.lineTo(x, y + h * 0.3);
      } else if (type === EnemyType.BOSS) {
          ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h * 0.6); ctx.lineTo(x + w/2, y + h); ctx.lineTo(x, y + h * 0.6);
      } else if (type === EnemyType.ASTEROID) {
          // Irregular rock
           ctx.moveTo(x + w * 0.5, y); 
           ctx.lineTo(x + w, y + h * 0.4); 
           ctx.lineTo(x + w * 0.7, y + h); 
           ctx.lineTo(x + w * 0.2, y + h * 0.9); 
           ctx.lineTo(x, y + h * 0.4);
      } else {
          ctx.rect(x, y, w, h);
      }
      ctx.closePath();
      ctx.fill();

      if (rotation !== undefined) {
          ctx.restore();
      }
  }

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Screenshake Application
    ctx.save();
    if (shakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * shakeRef.current;
        const dy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(dx, dy);
    }

    // Stars (Parallax)
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
      ctx.globalAlpha = star.speed * 0.5; // Faster stars are brighter
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      star.y += star.speed;
      if (star.y > CANVAS_HEIGHT) star.y = 0;
    });
    ctx.globalAlpha = 1;

    // PowerUps
    powerUpsRef.current.forEach(p => {
        const color = p.type === PowerUpType.HEALTH ? '#22c55e' : 
                     p.type === PowerUpType.SPEED ? '#3b82f6' : 
                     p.type === PowerUpType.RAPID_FIRE ? '#f59e0b' : '#eab308';
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
        
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.type[0], p.pos.x + 10, p.pos.y + 15);
        ctx.shadowBlur = 0;
    });

    // Enemies
    enemiesRef.current.forEach(e => {
      if (e.type !== EnemyType.ASTEROID) {
          ctx.shadowBlur = 5;
          ctx.shadowColor = e.color;
      }
      drawEntityShape(ctx, e.pos.x, e.pos.y, e.width, e.height, e.type, e.color, e.rotation);
      ctx.shadowBlur = 0;
    });

    // Players
    playersRef.current.forEach(player => {
        if (player.hp > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = player.color;
            const isPhase = player.shipClass === ShipClass.SPECTRE && player.skillActiveTimeRemaining > 0;
            if (isPhase) ctx.globalAlpha = 0.5;
            
            drawEntityShape(ctx, player.pos.x, player.pos.y, player.width, player.height, `PLAYER_${player.shipClass}`, player.color);
            
            // P1/P2 Marker
            ctx.font = '10px monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(player.id === 'p1' ? 'P1' : 'P2', player.pos.x + player.width/2, player.pos.y + player.height + 12);

            if (isPhase) ctx.globalAlpha = 1;
            if (player.powerUps.some(p => p.type === PowerUpType.SHIELD)) {
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(player.pos.x + player.width/2, player.pos.y + player.height/2, player.width, 0, Math.PI*2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }
    });

    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.pos.x, b.pos.y, b.width, b.height);
    });

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
    });
    ctx.globalAlpha = 1;

    // Floating Text
    floatingTextsRef.current.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = `bold ${16 * t.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    });

    // Restore context from screenshake
    ctx.restore();
  };

  const loop = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    update(timestamp, dt);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }

    if (!gameStatsRef.current.isGameOver) {
      requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    initGame();
    const animId = requestAnimationFrame(loop);
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'p' || e.key === 'Escape') {
             if (!gameStatsRef.current.isLevelComplete) {
                gameStatsRef.current.isPaused = !gameStatsRef.current.isPaused;
             }
        }
        keysPressed.current.add(e.key.toLowerCase());
        keysPressed.current.add(e.key); 
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
        keysPressed.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initGame]);

  return (
    <div className="relative w-full h-screen flex justify-center items-center bg-gray-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-slate-700 bg-black shadow-2xl rounded-lg"
      />
      
      {/* Combo Meter */}
      {hudStats.combo > 1 && (
          <div className="absolute top-24 right-4 z-20 flex flex-col items-end animate-bounce">
              <div className="text-4xl font-black italic text-yellow-400 drop-shadow-lg">
                  x{hudStats.combo}
              </div>
              <div className="text-sm font-bold text-yellow-200 tracking-widest uppercase">Combo</div>
              <div className="w-24 h-1 bg-slate-700 mt-1">
                  <div 
                      className="h-full bg-yellow-400 transition-all duration-75"
                      style={{ width: `${(hudStats.comboTimer / COMBO_TIMEOUT) * 100}%` }}
                  />
              </div>
          </div>
      )}

      {/* Boss Health Bar */}
      {bossHpData && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[500px] z-20">
              <div className="text-center text-red-500 font-bold mb-1 tracking-[0.2em] animate-pulse text-shadow-lg">{bossHpData.name}</div>
              <div className="w-full h-4 bg-slate-900 border border-red-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600 transition-all duration-100 ease-linear"
                    style={{ width: `${(bossHpData.current / bossHpData.max) * 100}%` }}
                  />
              </div>
          </div>
      )}

      {/* Mission Timer / Central HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className={`text-3xl font-mono font-bold tracking-widest ${hudStats.missionTimeRemaining < 10000 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {hudStats.bossActive ? 'УНИЧТОЖИТЬ ЦЕЛЬ' : (hudStats.missionTimeRemaining / 1000).toFixed(1)}
        </div>
        
        {/* Score/Level Centered */}
        <div className="flex gap-4 mt-2">
            <div className="text-yellow-400 font-bold font-mono text-sm border border-slate-700 bg-slate-900/80 px-2 py-1 rounded">SCORE: {hudStats.score}</div>
            <div className="text-cyan-400 font-bold font-mono text-sm border border-slate-700 bg-slate-900/80 px-2 py-1 rounded">LVL: {hudStats.level}</div>
        </div>
      </div>

      {/* HUD P1 (LEFT) */}
      <div className="absolute top-4 left-4 w-64">
         {playersHud[0] && (
         <div className={`transition-opacity duration-300 ${playersHud[0].isDead ? 'opacity-50 grayscale' : 'opacity-100'}`}>
            <div className="text-xs text-cyan-400 font-bold mb-1">ИГРОК 1</div>
             <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm mb-2">
                <div className="flex justify-between text-xs text-slate-400 uppercase mb-1">
                    <span>Броня</span>
                    <span>{Math.ceil(Math.max(0, playersHud[0].hp))} / {Math.ceil(playersHud[0].maxHp)}</span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${playersHud[0].hp < playersHud[0].maxHp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(Math.max(0, playersHud[0].hp) / playersHud[0].maxHp) * 100}%` }}
                    />
                </div>
             </div>

             <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm flex items-center gap-3">
                 <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm border-2 ${playersHud[0].skillReady ? 'border-green-400 text-green-400' : 'border-slate-500 text-slate-500'}`}>
                     E
                 </div>
                 <div className="flex-1">
                     <div className="text-[10px] text-slate-300 font-bold mb-1">{SHIP_STATS[selectedClass].skillName}</div>
                     {!playersHud[0].skillReady && (
                         <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-slate-400"
                                style={{ width: `${(1 - playersHud[0].skillCooldown / playersHud[0].skillMaxCooldown) * 100}%` }}
                             />
                         </div>
                     )}
                 </div>
             </div>
             
             <div className="flex gap-1 mt-2">
                {playersHud[0].buffs.map((buff, i) => {
                     const color = buff === PowerUpType.HEALTH ? '#22c55e' : 
                         buff === PowerUpType.SPEED ? '#3b82f6' : 
                         buff === PowerUpType.RAPID_FIRE ? '#f59e0b' : '#eab308';
                     return (
                        <div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-black shadow-lg" style={{ backgroundColor: color }}>
                            {buff[0]}
                        </div>
                    );
                })}
             </div>
         </div>
         )}
      </div>

      {/* HUD P2 (RIGHT) - Only show if Coop */}
      {gameMode === 'COOP' && playersHud[1] && (
      <div className="absolute top-4 right-4 w-64 text-right">
         <div className={`transition-opacity duration-300 ${playersHud[1].isDead ? 'opacity-50 grayscale' : 'opacity-100'}`}>
             <div className="text-xs text-fuchsia-400 font-bold mb-1">ИГРОК 2</div>
             <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm mb-2">
                <div className="flex justify-between text-xs text-slate-400 uppercase mb-1">
                    <span>{Math.ceil(Math.max(0, playersHud[1].hp))} / {Math.ceil(playersHud[1].maxHp)}</span>
                    <span>Броня</span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden relative">
                    <div 
                        className={`absolute right-0 top-0 h-full transition-all duration-300 ${playersHud[1].hp < playersHud[1].maxHp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(Math.max(0, playersHud[1].hp) / playersHud[1].maxHp) * 100}%` }}
                    />
                </div>
             </div>

             <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm flex flex-row-reverse items-center gap-3">
                 <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[10px] border-2 ${playersHud[1].skillReady ? 'border-green-400 text-green-400' : 'border-slate-500 text-slate-500'}`}>
                     SHFT
                 </div>
                 <div className="flex-1">
                     <div className="text-[10px] text-slate-300 font-bold mb-1">{SHIP_STATS[selectedClass].skillName}</div>
                     {!playersHud[1].skillReady && (
                         <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden relative">
                             <div 
                                className="absolute right-0 top-0 h-full bg-slate-400"
                                style={{ width: `${(1 - playersHud[1].skillCooldown / playersHud[1].skillMaxCooldown) * 100}%` }}
                             />
                         </div>
                     )}
                 </div>
             </div>

             <div className="flex gap-1 mt-2 justify-end">
                {playersHud[1].buffs.map((buff, i) => {
                     const color = buff === PowerUpType.HEALTH ? '#22c55e' : 
                         buff === PowerUpType.SPEED ? '#3b82f6' : 
                         buff === PowerUpType.RAPID_FIRE ? '#f59e0b' : '#eab308';
                     return (
                        <div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-black shadow-lg" style={{ backgroundColor: color }}>
                            {buff[0]}
                        </div>
                    );
                })}
             </div>
         </div>
      </div>
      )}
      
       {/* Pause Menu */}
      {hudStats.isPaused && !hudStats.isGameOver && !hudStats.isLevelComplete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-600 p-8 rounded-xl shadow-2xl text-center">
                <h2 className="text-3xl font-bold text-white mb-6 tracking-widest">ПАУЗА</h2>
                <button 
                    onClick={() => { gameStatsRef.current.isPaused = false; }}
                    className="block w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold mb-4 transition"
                >
                    Продолжить
                </button>
                <button 
                    onClick={onExit}
                    className="block w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition"
                >
                    Выйти в меню
                </button>
            </div>
        </div>
      )}

      {/* Level Complete / Upgrade Menu */}
      {hudStats.isLevelComplete && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
              <div className="max-w-4xl w-full p-8">
                  <h2 className="text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 uppercase">Миссия Выполнена</h2>
                  <p className="text-center text-slate-400 mb-10">Системы корабля готовы к модернизации</p>
                  
                  <div className="grid grid-cols-3 gap-6">
                      {upgradeOptions.map((opt) => (
                          <button 
                            key={opt.id}
                            onClick={() => selectUpgrade(opt)}
                            className={`group relative p-6 rounded-xl border-2 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] text-left flex flex-col justify-between h-64
                                ${opt.rarity === 'LEGENDARY' ? 'bg-purple-900/40 border-purple-500 hover:bg-purple-900/60' : 
                                  opt.rarity === 'RARE' ? 'bg-blue-900/40 border-blue-500 hover:bg-blue-900/60' : 
                                  'bg-slate-800 border-slate-600 hover:bg-slate-700'}
                            `}
                          >
                              <div>
                                <div className="text-xs font-bold opacity-70 mb-2 tracking-widest">{opt.rarity}</div>
                                <div className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-300">{opt.name}</div>
                                <div className="text-slate-300 leading-relaxed">{opt.description}</div>
                              </div>
                              <div className="mt-4 text-center py-2 bg-white/10 rounded font-bold text-sm uppercase group-hover:bg-white/20">
                                  Установить
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};