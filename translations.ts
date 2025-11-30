
export type Language = 'RU' | 'EN';

export const TRANSLATIONS = {
  RU: {
    // Menu
    GAME_TITLE: 'VOID WARS',
    GAME_SUBTITLE: 'ЗАЩИТНИКИ ГАЛАКТИКИ',
    SELECT_CLASS: 'ВЫБЕРИТЕ КЛАСС КОРАБЛЯ',
    BTN_SINGLE: 'ОДИНОЧНАЯ',
    BTN_COOP: '2 ИГРОКА (CO-OP)',
    BTN_ACHIEVEMENTS: 'ДОСТИЖЕНИЯ',
    HOW_TO_PLAY_P1: 'ИГРОК 1',
    HOW_TO_PLAY_P2: 'ИГРОК 2',
    MOVE: 'ДВИЖЕНИЕ',
    FIRE: 'ОГОНЬ',
    SKILL: 'НАВЫК',
    PAUSE_INFO: 'ПАУЗА / МЕНЮ',
    OR: 'или',
    TIP: 'Уничтожайте врагов, копите комбо и побеждайте боссов. Не забывайте собирать улучшения!',
    
    // Stats
    STAT_ARMOR: 'Броня',
    STAT_SPEED: 'Скор.',
    STAT_DMG: 'Урон',
    
    // Game Over
    GAME_OVER_TITLE: 'МИССИЯ ПРОВАЛЕНА',
    SCORE_FINAL: 'Итоговый счет',
    BTN_RETRY: 'ПОВТОРИТЬ',
    BTN_MENU: 'В МЕНЮ',

    // Pause / Level Up
    PAUSE_TITLE: 'ПАУЗА',
    BTN_RESUME: 'ПРОДОЛЖИТЬ',
    LEVEL_COMPLETE: 'МИССИЯ ВЫПОЛНЕНА',
    LEVEL_COMPLETE_SUB: 'Системы корабля готовы к модернизации',
    BTN_INSTALL: 'УСТАНОВИТЬ',
    
    // HUD
    HUD_SCORE: 'СЧЕТ',
    HUD_LVL: 'УР',
    HUD_OBJ: 'ЦЕЛЬ',
    HUD_KILL: 'УНИЧТОЖИТЬ',
    HUD_ARMOR: 'БРОНЯ',
    BOSS_LVL: 'БОСС УРОВНЯ',
    BOSS_ELITE: 'ЭЛИТНЫЙ СТРАЖ',

    // Upgrades
    UPG_DMG_NAME: 'Усилитель плазмы',
    UPG_DMG_DESC: '+20% к урону (Команда)',
    UPG_HP_NAME: 'Нано-броня',
    UPG_HP_DESC: '+30% Макс HP (Команда)',
    UPG_RATE_NAME: 'Система охлаждения',
    UPG_RATE_DESC: '+15% скорострельности (Команда)',
    UPG_SPEED_NAME: 'Ионный двигатель',
    UPG_SPEED_DESC: '+15% скорости (Команда)',
    UPG_HEAL_NAME: 'Ремкомплект',
    UPG_HEAL_DESC: 'Полное восстановление HP',

    // Achievements
    ACH_FIRST_BLOOD: 'Первая кровь',
    ACH_FIRST_BLOOD_DESC: 'Убить 10 врагов за игру',
    ACH_SURVIVOR: 'Выживший',
    ACH_SURVIVOR_DESC: 'Продержаться 2 минуты',
    ACH_COLLECTOR: 'Собиратель',
    ACH_COLLECTOR_DESC: 'Собрать 5 бонусов',
    ACH_BOSS_KILLER: 'Убийца Боссов',
    ACH_BOSS_KILLER_DESC: 'Победить Босса Уровня',
    ACH_RAMPAGE: 'Безумие',
    ACH_RAMPAGE_DESC: 'Достичь комбо x10',
    ACH_VETERAN: 'Ветеран',
    ACH_VETERAN_DESC: 'Накопить 500 убийств (Всего)',
    ACH_UNLOCKED: 'ДОСТИЖЕНИЕ!',

    // Ships
    SHIP_INTERCEPTOR_NAME: 'Перехватчик',
    SHIP_INTERCEPTOR_DESC: 'Быстрый, скорострельный. Навык: Гипер-драйв.',
    SKILL_INTERCEPTOR_NAME: 'Гипер-драйв',
    SKILL_INTERCEPTOR_DESC: 'Скорострельность x3 на 3 сек.',

    SHIP_CRUISER_NAME: 'Крейсер',
    SHIP_CRUISER_DESC: 'Сбалансированный. Навык: Ракетный залп.',
    SKILL_CRUISER_NAME: 'Ракетный залп',
    SKILL_CRUISER_DESC: 'Выпускает веер самонаводящихся ракет.',

    SHIP_DESTROYER_NAME: 'Разрушитель',
    SHIP_DESTROYER_DESC: 'Мощный. Навык: Мега-луч.',
    SKILL_DESTROYER_NAME: 'Мега-луч',
    SKILL_DESTROYER_DESC: 'Уничтожает все пули и наносит огромный урон.',

    SHIP_SPECTRE_NAME: 'Призрак',
    SHIP_SPECTRE_DESC: 'Снайпер. Навык: Фазировка.',
    SKILL_SPECTRE_NAME: 'Фазировка',
    SKILL_SPECTRE_DESC: 'Неуязвимость и ускорение на 3 сек.',

    SHIP_TITAN_NAME: 'Титан',
    SHIP_TITAN_DESC: 'Танк. Навык: Ремонтные дроны.',
    SKILL_TITAN_NAME: 'Ремонт',
    SKILL_TITAN_DESC: 'Восстанавливает 30% HP и создает щит.'
  },
  EN: {
    // Menu
    GAME_TITLE: 'VOID WARS',
    GAME_SUBTITLE: 'GALACTIC DEFENDERS',
    SELECT_CLASS: 'SELECT SHIP CLASS',
    BTN_SINGLE: 'SINGLE PLAYER',
    BTN_COOP: '2 PLAYERS (CO-OP)',
    BTN_ACHIEVEMENTS: 'ACHIEVEMENTS',
    HOW_TO_PLAY_P1: 'PLAYER 1',
    HOW_TO_PLAY_P2: 'PLAYER 2',
    MOVE: 'MOVE',
    FIRE: 'FIRE',
    SKILL: 'SKILL',
    PAUSE_INFO: 'PAUSE / MENU',
    OR: 'or',
    TIP: 'Destroy enemies, build combo, and defeat bosses. Don\'t forget to collect upgrades!',

    // Stats
    STAT_ARMOR: 'Armor',
    STAT_SPEED: 'Spd.',
    STAT_DMG: 'Dmg.',

    // Game Over
    GAME_OVER_TITLE: 'MISSION FAILED',
    SCORE_FINAL: 'Final Score',
    BTN_RETRY: 'RETRY',
    BTN_MENU: 'MAIN MENU',

    // Pause / Level Up
    PAUSE_TITLE: 'PAUSED',
    BTN_RESUME: 'RESUME',
    LEVEL_COMPLETE: 'MISSION COMPLETE',
    LEVEL_COMPLETE_SUB: 'Ship systems ready for upgrade',
    BTN_INSTALL: 'INSTALL',

    // HUD
    HUD_SCORE: 'SCORE',
    HUD_LVL: 'LVL',
    HUD_OBJ: 'OBJ',
    HUD_KILL: 'DESTROY',
    HUD_ARMOR: 'ARMOR',
    BOSS_LVL: 'LEVEL BOSS',
    BOSS_ELITE: 'ELITE GUARD',

    // Upgrades
    UPG_DMG_NAME: 'Plasma Amplifier',
    UPG_DMG_DESC: '+20% Damage (Team)',
    UPG_HP_NAME: 'Nano-Plating',
    UPG_HP_DESC: '+30% Max HP (Team)',
    UPG_RATE_NAME: 'Cooling System',
    UPG_RATE_DESC: '+15% Fire Rate (Team)',
    UPG_SPEED_NAME: 'Ion Engine',
    UPG_SPEED_DESC: '+15% Speed (Team)',
    UPG_HEAL_NAME: 'Repair Kit',
    UPG_HEAL_DESC: 'Full HP Restoration',

    // Achievements
    ACH_FIRST_BLOOD: 'First Blood',
    ACH_FIRST_BLOOD_DESC: 'Kill 10 enemies in one game',
    ACH_SURVIVOR: 'Survivor',
    ACH_SURVIVOR_DESC: 'Survive for 2 minutes',
    ACH_COLLECTOR: 'Collector',
    ACH_COLLECTOR_DESC: 'Collect 5 powerups',
    ACH_BOSS_KILLER: 'Boss Killer',
    ACH_BOSS_KILLER_DESC: 'Defeat a Level Boss',
    ACH_RAMPAGE: 'Rampage',
    ACH_RAMPAGE_DESC: 'Reach 10x Combo',
    ACH_VETERAN: 'Veteran',
    ACH_VETERAN_DESC: 'Accumulate 500 total kills',
    ACH_UNLOCKED: 'UNLOCKED!',

    // Ships
    SHIP_INTERCEPTOR_NAME: 'Interceptor',
    SHIP_INTERCEPTOR_DESC: 'Fast, rapid fire. Skill: Overdrive.',
    SKILL_INTERCEPTOR_NAME: 'Overdrive',
    SKILL_INTERCEPTOR_DESC: 'Fire rate x3 for 3 sec.',

    SHIP_CRUISER_NAME: 'Cruiser',
    SHIP_CRUISER_DESC: 'Balanced. Skill: Missile Swarm.',
    SKILL_CRUISER_NAME: 'Missile Swarm',
    SKILL_CRUISER_DESC: 'Fires homing missiles.',

    SHIP_DESTROYER_NAME: 'Destroyer',
    SHIP_DESTROYER_DESC: 'Heavy Hitter. Skill: Mega Beam.',
    SKILL_DESTROYER_NAME: 'Mega Beam',
    SKILL_DESTROYER_DESC: 'Obliterates everything in path.',

    SHIP_SPECTRE_NAME: 'Spectre',
    SHIP_SPECTRE_DESC: 'Sniper. Skill: Phase Shift.',
    SKILL_SPECTRE_NAME: 'Phase Shift',
    SKILL_SPECTRE_DESC: 'Invulnerability & speed boost.',

    SHIP_TITAN_NAME: 'Titan',
    SHIP_TITAN_DESC: 'Tank. Skill: Repair Drones.',
    SKILL_TITAN_NAME: 'Repair',
    SKILL_TITAN_DESC: 'Heals 30% HP and creates shield.'
  }
};

export const t = (key: string, lang: Language): string => {
  // @ts-ignore
  return TRANSLATIONS[lang][key] || key;
};
