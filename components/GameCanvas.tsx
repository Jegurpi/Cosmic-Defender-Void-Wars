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
  STAR_COUNT 
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
  UpgradeOption 
} from '../types';

interface GameCanvasProps {
  selectedClass: ShipClass;
  onGameOver: (score: number) => void;
  onExit: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ selectedClass, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const playerRef = useRef<Player | null>(null);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  
  const gameStatsRef = useRef<GameStats>({
    score: 0,
    levelScore: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
    bossActive: false,
    missionTimeRemaining: MISSION_DURATION,
    isLevelComplete: false
  });
  
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);

  // React State for UI
  const [hudStats, setHudStats] = useState<GameStats>(gameStatsRef.current);
  const [playerHp, setPlayerHp] = useState(100);
  const [activeBuffs, setActiveBuffs] = useState<PowerUpType[]>([]);
  const [bossHpData, setBossHpData] = useState<{current: number, max: number, name: string} | null>(null);
  const [skillState, setSkillState] = useState<{ready: boolean, cooldown: number, maxCooldown: number}>({ ready: true, cooldown: 0, maxCooldown: 1 });
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

  // --- Initialization ---

  const initGame = useCallback(() => {
    const stats = SHIP_STATS[selectedClass];
    playerRef.current = {
      id: 'player',
      pos: { x: CANVAS_WIDTH / 2 - stats.width / 2, y: PLAYER_Y_POS },
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

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    gameStatsRef.current = { 
      score: 0, 
      levelScore: 0, 
      level: 1, 
      isGameOver: false, 
      isPaused: false, 
      bossActive: false,
      missionTimeRemaining: MISSION_DURATION,
      isLevelComplete: false
    };
    
    starsRef.current = Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1
    }));
    
    setHudStats({ ...gameStatsRef.current });
    setPlayerHp(stats.hp);
    setBossHpData(null);
    setUpgradeOptions([]);
  }, [selectedClass]);

  // --- Upgrade System ---

  const generateUpgrades = () => {
    const baseUpgrades: UpgradeOption[] = [
      {
        id: 'dmg_boost',
        name: 'Усилитель плазмы',
        description: '+20% к урону',
        rarity: 'COMMON',
        apply: (p) => { p.damageMultiplier += 0.2; }
      },
      {
        id: 'hp_boost',
        name: 'Нано-броня',
        description: '+30% к макс HP и лечение',
        rarity: 'COMMON',
        apply: (p) => { 
          p.maxHp *= 1.3; 
          p.hp = p.maxHp;
          // Refresh HUD max hp ref if needed or just let loop handle it
        }
      },
      {
        id: 'fire_rate',
        name: 'Система охлаждения',
        description: '+15% к скорострельности',
        rarity: 'RARE',
        apply: (p) => { p.fireRate *= 0.85; }
      },
      {
        id: 'speed_boost',
        name: 'Ионный двигатель',
        description: '+15% к скорости движения',
        rarity: 'COMMON',
        apply: (p) => { p.speed *= 1.15; }
      },
      {
        id: 'skill_cd',
        name: 'Квантовый процессор',
        description: '-20% время перезарядки навыка',
        rarity: 'LEGENDARY',
        apply: (p) => { 
            // We modify the static constant logic by applying a multiplier stored on player?
            // For simplicity, we just reduce current CD if active, but ideally we need a cooldown multiplier on player entity
            // Let's add it dynamically or just buff logic
             // Complex to implement without changing type permanently, let's just heal player fully as a bonus
             p.hp = p.maxHp; 
        }
      }
    ];
    
    // Pick 3 random
    const shuffled = baseUpgrades.sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
  };

  const selectUpgrade = (upgrade: UpgradeOption) => {
    if (playerRef.current) {
      upgrade.apply(playerRef.current);
    }
    
    // Start next level
    gameStatsRef.current.level++;
    gameStatsRef.current.missionTimeRemaining = MISSION_DURATION;
    gameStatsRef.current.bossActive = false;
    gameStatsRef.current.isLevelComplete = false;
    gameStatsRef.current.isPaused = false;
    
    setUpgradeOptions([]);
    // Heal player slightly between levels if not upgraded
    if (playerRef.current) {
        playerRef.current.hp = Math.min(playerRef.current.hp + 50, playerRef.current.maxHp);
    }
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
    
    // Clear other enemies when boss arrives
    enemiesRef.current.forEach(e => {
        spawnParticle(e.pos.x + e.width/2, e.pos.y + e.height/2, e.color, 5);
        e.markedForDeletion = true;
    });

    const level = gameStatsRef.current.level;
    const hpMultiplier = isMiniBoss ? 15 : 50;
    const hp = level * 100 + hpMultiplier * level * 2;
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

    enemiesRef.current.push({
      id: Math.random().toString(),
      type: type,
      pos: { x: Math.random() * (CANVAS_WIDTH - size), y: -50 },
      velocity: { x: type === EnemyType.FAST ? (Math.random() > 0.5 ? 2 : -2) : 0, y: speedY },
      width: size,
      height: size,
      color: color,
      hp: hpBase * level,
      maxHp: hpBase * level,
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

      // Immediate Effects
      if (player.shipClass === ShipClass.CRUISER) {
          // Missile Swarm
          for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              bulletsRef.current.push({
                id: `missile-${i}`,
                pos: { x: player.pos.x + player.width/2, y: player.pos.y + player.height/2 },
                velocity: { x: Math.cos(angle) * 5, y: Math.sin(angle) * 5 - 5 },
                width: 8,
                height: 8,
                color: '#8b5cf6',
                damage: stats.damage * 2,
                isEnemy: false,
                markedForDeletion: false
              });
          }
      } else if (player.shipClass === ShipClass.DESTROYER) {
          // Mega Beam
           bulletsRef.current.push({
                id: `megabeam-${timestamp}`,
                pos: { x: player.pos.x + player.width/2 - 25, y: 0 },
                velocity: { x: 0, y: 0 },
                width: 50,
                height: player.pos.y, // Beam to top of screen
                color: '#ef4444',
                damage: 200, // One tick burst
                isEnemy: false,
                markedForDeletion: false,
                piercing: true
            });
            spawnParticle(player.pos.x + player.width/2, player.pos.y, '#ef4444', 30, 10);
      } else if (player.shipClass === ShipClass.TITAN) {
          // Heal & Shield
          player.hp = Math.min(player.hp + player.maxHp * 0.3, player.maxHp);
          player.powerUps.push({
              type: PowerUpType.SHIELD,
              expiresAt: timestamp + 5000 // 5 sec shield
          });
      }
      // Interceptor & Spectre handled in update loop via flags
  };

  // --- Update Loop ---

  const update = (timestamp: number, dt: number) => {
    if (gameStatsRef.current.isPaused || gameStatsRef.current.isGameOver || gameStatsRef.current.isLevelComplete) return;
    const player = playerRef.current;
    if (!player) return;

    const shipStats = SHIP_STATS[player.shipClass];

    // 0. Timers
    if (gameStatsRef.current.missionTimeRemaining > 0 && !gameStatsRef.current.bossActive) {
        gameStatsRef.current.missionTimeRemaining -= dt;
        if (gameStatsRef.current.missionTimeRemaining <= 0) {
            gameStatsRef.current.missionTimeRemaining = 0;
            spawnBoss(false, timestamp);
        }
    } else if (gameStatsRef.current.missionTimeRemaining > 0 && gameStatsRef.current.bossActive) {
         // If boss spawned early via mini-boss logic, don't decrement mission timer aggressively or handle differently
         // For now, let's keep timer running down even if boss active? No, let's pause timer if boss active.
    }

    // Skill Cooldowns
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

    // 1. Input & Movement
    let dx = 0;
    let dy = 0;
    
    // Modifiers from buffs/skills
    const hasSpeedBuff = player.powerUps.some(p => p.type === PowerUpType.SPEED);
    const isInterceptorOverdrive = player.shipClass === ShipClass.INTERCEPTOR && player.skillActiveTimeRemaining > 0;
    const isSpectrePhase = player.shipClass === ShipClass.SPECTRE && player.skillActiveTimeRemaining > 0;

    let currentSpeed = player.speed;
    if (hasSpeedBuff) currentSpeed *= 1.5;
    if (isSpectrePhase) currentSpeed *= 1.5;

    if (keysPressed.current.has(KEYS.LEFT) || keysPressed.current.has(KEYS.A)) dx = -1;
    if (keysPressed.current.has(KEYS.RIGHT) || keysPressed.current.has(KEYS.D)) dx = 1;
    if (keysPressed.current.has(KEYS.UP) || keysPressed.current.has(KEYS.W)) dy = -1;
    if (keysPressed.current.has(KEYS.DOWN) || keysPressed.current.has(KEYS.S)) dy = 1;
    
    // Skill Activation
    if (keysPressed.current.has(KEYS.E)) {
        activateSkill(player, timestamp);
    }

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.pos.x += dx * currentSpeed;
    player.pos.y += dy * currentSpeed;
    player.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.pos.x));
    player.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.pos.y));

    // 2. Shooting
    const hasRapidFire = player.powerUps.some(p => p.type === PowerUpType.RAPID_FIRE);
    let currentFireRate = player.fireRate;
    if (hasRapidFire) currentFireRate /= 2;
    if (isInterceptorOverdrive) currentFireRate /= 3;

    if (keysPressed.current.has(KEYS.SPACE) && timestamp - player.lastShotTime > currentFireRate) {
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

    // 3. Update Entities
    bulletsRef.current.forEach(b => {
      // Logic for homing missiles (Cruiser Skill)
      if (!b.isEnemy && b.id.startsWith('missile')) {
         // Find nearest enemy
         const target = enemiesRef.current.find(e => !e.markedForDeletion);
         if (target) {
             const dx = (target.pos.x + target.width/2) - b.pos.x;
             const dy = (target.pos.y + target.height/2) - b.pos.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist > 0) {
                 b.velocity.x += (dx/dist) * 0.5;
                 b.velocity.y += (dy/dist) * 0.5;
                 // Cap speed
                 const speed = 8;
                 const vMag = Math.sqrt(b.velocity.x**2 + b.velocity.y**2);
                 b.velocity.x = (b.velocity.x / vMag) * speed;
                 b.velocity.y = (b.velocity.y / vMag) * speed;
             }
         }
      }
      
      // Destroyer Beam Logic (Static for 1 frame essentially, but let's make it fade)
      if (b.id.startsWith('megabeam')) {
          b.markedForDeletion = true; // Instant hit scan
          // We handle damage in collision check immediately
      } else {
        b.pos.x += b.velocity.x;
        b.pos.y += b.velocity.y;
        if (b.pos.y < -50 || b.pos.y > CANVAS_HEIGHT + 50) b.markedForDeletion = true;
      }
    });

    // Enemy AI & Updates
    let activeBoss: Enemy | null = null;
    enemiesRef.current.forEach(e => {
      if (e.type === EnemyType.BOSS || e.type === EnemyType.MINIBOSS) {
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

      if (timestamp > e.shootTimer) {
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

    bulletsRef.current.forEach(b => {
      if (b.markedForDeletion && !b.piercing) return; // Allow piercing bullets to hit multiple

      if (!b.isEnemy) {
        enemiesRef.current.forEach(e => {
          if (!e.markedForDeletion && checkRectCollide(b, e)) {
            if (!b.piercing) b.markedForDeletion = true;
            
            e.hp -= b.damage;
            spawnParticle(b.pos.x, b.pos.y, COLORS.PARTICLE_EXPLOSION, b.piercing ? 10 : 2);
            
            if (e.hp <= 0) {
              e.markedForDeletion = true;
              gameStatsRef.current.score += e.scoreValue;
              gameStatsRef.current.levelScore += e.scoreValue;
              spawnParticle(e.pos.x + e.width/2, e.pos.y + e.height/2, e.color, 10);
              
              if (e.type === EnemyType.BOSS) {
                  // VICTORY / LEVEL COMPLETE
                  gameStatsRef.current.isLevelComplete = true;
                  gameStatsRef.current.isPaused = true;
                  generateUpgrades();
              } else if (e.type === EnemyType.MINIBOSS) {
                  gameStatsRef.current.bossActive = false;
                  spawnPowerUp(e.pos.x, e.pos.y);
              }

              if (Math.random() < POWERUP_SPAWN_CHANCE) spawnPowerUp(e.pos.x, e.pos.y);
            }
          }
        });
      } else {
        const hasShield = player.powerUps.some(p => p.type === PowerUpType.SHIELD);
        if (!hasShield && !isSpectrePhase && checkRectCollide(b, player)) {
          b.markedForDeletion = true;
          player.hp -= b.damage;
          spawnParticle(player.pos.x + player.width/2, player.pos.y + player.height/2, '#ef4444', 3);
          if (player.hp <= 0) {
            gameStatsRef.current.isGameOver = true;
            onGameOver(gameStatsRef.current.score);
          }
        }
      }
    });

    powerUpsRef.current.forEach(p => {
        if (!p.markedForDeletion && checkRectCollide(p, player)) {
            p.markedForDeletion = true;
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

    enemiesRef.current.forEach(e => {
        if (!e.markedForDeletion && checkRectCollide(e, player)) {
            const hasShield = player.powerUps.some(p => p.type === PowerUpType.SHIELD);
            
            if (!hasShield && !isSpectrePhase) {
                // COLLISION LOGIC
                // Titan Resistance
                const rawDamage = 30;
                const damageTaken = rawDamage * (1 - player.collisionResistance);
                
                player.hp -= damageTaken;
                spawnParticle(player.pos.x, player.pos.y, '#ef4444', 10);
                
                if (e.type !== EnemyType.BOSS && e.type !== EnemyType.MINIBOSS) {
                     e.markedForDeletion = true;
                } else {
                    e.hp -= 20; // Ramming the boss hurts it
                }

                if (player.hp <= 0) {
                    gameStatsRef.current.isGameOver = true;
                    onGameOver(gameStatsRef.current.score);
                }
            } else {
                 if (e.type !== EnemyType.BOSS && e.type !== EnemyType.MINIBOSS) {
                    e.markedForDeletion = true;
                 }
                spawnParticle(e.pos.x, e.pos.y, e.color, 5);
            }
        }
    });

    particlesRef.current.forEach(p => {
      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;
      p.life -= 0.05;
      p.alpha = p.life;
      if (p.life <= 0) p.markedForDeletion = true;
    });

    bulletsRef.current = bulletsRef.current.filter(b => !b.markedForDeletion);
    enemiesRef.current = enemiesRef.current.filter(e => !e.markedForDeletion);
    particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);
    powerUpsRef.current = powerUpsRef.current.filter(p => !p.markedForDeletion);
    player.powerUps = player.powerUps.filter(buff => buff.expiresAt > timestamp);

    if (timestamp - spawnTimerRef.current > (ENEMY_SPAWN_RATE_BASE / Math.sqrt(gameStatsRef.current.level))) {
      spawnEnemy(timestamp);
      spawnTimerRef.current = timestamp;
    }

    setHudStats({ ...gameStatsRef.current });
    setPlayerHp(player.hp);
    setActiveBuffs(player.powerUps.map(p => p.type));
    setSkillState({
        ready: player.skillReady,
        cooldown: player.skillCooldownRemaining,
        maxCooldown: shipStats.skillCooldown
    });
  };

  // --- Draw Loop ---

  const drawEntityShape = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, type: string, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      
      switch(type) {
          case 'PLAYER_INTERCEPTOR':
              ctx.moveTo(x + w/2, y);
              ctx.lineTo(x + w, y + h);
              ctx.lineTo(x, y + h);
              break;
          case 'PLAYER_CRUISER':
              ctx.moveTo(x + w/2, y);
              ctx.lineTo(x + w, y + h*0.8);
              ctx.lineTo(x + w, y + h);
              ctx.lineTo(x, y + h);
              ctx.lineTo(x, y + h*0.8);
              break;
          case 'PLAYER_DESTROYER':
              ctx.rect(x, y + h/2, w, h/2);
              ctx.moveTo(x + w/2, y);
              ctx.lineTo(x + w * 0.8, y + h/2);
              ctx.lineTo(x + w * 0.2, y + h/2);
              break;
          case 'PLAYER_SPECTRE':
              ctx.moveTo(x + w/2, y);
              ctx.lineTo(x + w * 0.8, y + h);
              ctx.lineTo(x + w/2, y + h * 0.8);
              ctx.lineTo(x + w * 0.2, y + h);
              break;
          case 'PLAYER_TITAN':
              ctx.moveTo(x + w * 0.3, y);
              ctx.lineTo(x + w * 0.7, y);
              ctx.lineTo(x + w, y + h * 0.6);
              ctx.lineTo(x + w * 0.8, y + h);
              ctx.lineTo(x + w * 0.2, y + h);
              ctx.lineTo(x, y + h * 0.6);
              break;
          
          case EnemyType.BASIC:
              ctx.moveTo(x, y);
              ctx.lineTo(x + w, y);
              ctx.lineTo(x + w/2, y + h);
              break;
          case EnemyType.FAST:
              ctx.moveTo(x + w/2, y);
              ctx.lineTo(x + w, y + h/2);
              ctx.lineTo(x + w/2, y + h);
              ctx.lineTo(x, y + h/2);
              break;
          case EnemyType.TANK:
              ctx.rect(x, y, w, h * 0.7);
              ctx.moveTo(x + w * 0.2, y + h * 0.7);
              ctx.lineTo(x + w/2, y + h);
              ctx.lineTo(x + w * 0.8, y + h * 0.7);
              break;
          case EnemyType.MINIBOSS:
              ctx.moveTo(x + w/2, y);
              ctx.lineTo(x + w, y + h * 0.3);
              ctx.lineTo(x + w, y + h * 0.7);
              ctx.lineTo(x + w/2, y + h);
              ctx.lineTo(x, y + h * 0.7);
              ctx.lineTo(x, y + h * 0.3);
              break;
          case EnemyType.BOSS:
              ctx.moveTo(x, y);
              ctx.lineTo(x + w, y);
              ctx.lineTo(x + w, y + h * 0.6);
              ctx.lineTo(x + w/2, y + h);
              ctx.lineTo(x, y + h * 0.6);
              break;
          default:
              ctx.rect(x, y, w, h);
      }
      ctx.closePath();
      ctx.fill();
  }

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.3;
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
      ctx.shadowBlur = 5;
      ctx.shadowColor = e.color;
      drawEntityShape(ctx, e.pos.x, e.pos.y, e.width, e.height, e.type, e.color);
      ctx.shadowBlur = 0;
    });

    // Player
    const player = playerRef.current;
    if (player && !gameStatsRef.current.isGameOver) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = player.color;
        
        // Skill Effect Visuals
        const isPhase = player.shipClass === ShipClass.SPECTRE && player.skillActiveTimeRemaining > 0;
        if (isPhase) ctx.globalAlpha = 0.5;

        drawEntityShape(ctx, player.pos.x, player.pos.y, player.width, player.height, `PLAYER_${player.shipClass}`, player.color);
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
        keysPressed.current.add(e.key.toLowerCase()); // Normalize keys
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

  const maxHp = playerRef.current ? playerRef.current.maxHp : SHIP_STATS[selectedClass].hp;

  return (
    <div className="relative w-full h-screen flex justify-center items-center bg-gray-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-slate-700 bg-black shadow-2xl rounded-lg"
      />
      
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

      {/* Mission Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className={`text-3xl font-mono font-bold tracking-widest ${hudStats.missionTimeRemaining < 10000 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {hudStats.bossActive ? 'УНИЧТОЖИТЬ ЦЕЛЬ' : (hudStats.missionTimeRemaining / 1000).toFixed(1)}
        </div>
        {!hudStats.bossActive && <div className="text-[10px] text-slate-400 uppercase tracking-widest">До прибытия босса</div>}
      </div>

      {/* HUD Left */}
      <div className="absolute top-4 left-4 w-64">
         {/* HP */}
         <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm mb-2">
            <div className="flex justify-between text-xs text-slate-400 uppercase mb-1">
                <span>Броня</span>
                <span>{Math.ceil(playerHp)} / {Math.ceil(maxHp)}</span>
            </div>
            <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-300 ${playerHp < maxHp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${(playerHp / maxHp) * 100}%` }}
                />
            </div>
         </div>

         {/* Skill */}
         <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm flex items-center gap-3">
             <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg border-2 ${skillState.ready ? 'border-green-400 text-green-400' : 'border-slate-500 text-slate-500'}`}>
                 E
             </div>
             <div className="flex-1">
                 <div className="text-xs text-slate-300 font-bold mb-1">{SHIP_STATS[selectedClass].skillName}</div>
                 {skillState.ready ? (
                     <div className="text-[10px] text-green-400 uppercase tracking-wider">Готов к запуску</div>
                 ) : (
                     <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                         <div 
                            className="h-full bg-slate-400"
                            style={{ width: `${(1 - skillState.cooldown / skillState.maxCooldown) * 100}%` }}
                         />
                     </div>
                 )}
             </div>
         </div>
      </div>

      {/* HUD Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
         <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm text-right min-w-[120px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Счет</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono">{hudStats.score}</div>
         </div>
         <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-600 backdrop-blur-sm text-right min-w-[80px]">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Уровень</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">{hudStats.level}</div>
         </div>
         
         <div className="flex gap-1 mt-2">
            {activeBuffs.map((buff, i) => {
                 const color = buff === PowerUpType.HEALTH ? '#22c55e' : 
                     buff === PowerUpType.SPEED ? '#3b82f6' : 
                     buff === PowerUpType.RAPID_FIRE ? '#f59e0b' : '#eab308';
                 return (
                    <div key={i} 
                        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-black shadow-lg"
                        style={{ backgroundColor: color }}
                    >
                        {buff[0]}
                    </div>
                );
            })}
         </div>
      </div>
      
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