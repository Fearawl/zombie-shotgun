const sharedBaseUnitStats = {
  health: 5,
  moveSpeed: 5,
};

export const gameConfig = {
  version: "preproduction-022",
  runtime: {
    world: {
      width: 2200,
      height: 1600,
    },
    hero: {
      spawnX: 360,
      spawnY: 300,
      bodyRadius: 18,
      shotgun: {
        magazineSize: 8,
        pellets: 8,
        damagePerPellet: 2,
        spreadRadians: 0.34,
        range: 290,
        cooldownMs: 2000,
        projectileSpeed: 900,
        reloadMs: 2000,
      },
      contactDamageGraceMs: 450,
    },
    enemy: {
      offscreenSpawnPadding: 100,
      bossSpawnMinDistance: 140,
      bossSpawnMaxDistance: 220,
      attackDamage: 1,
      attackCooldownMs: 2000,
      defaultAggroRadius: 99999,
    },
    ui: {
      waveBannerDurationMs: 1800,
    },
  },
  progression: {
    baseSpawnIntervalSeconds: 1,
    waveDurationSeconds: 30,
    spawnAccelerationPerWave: 0.1,
    bossMultiplier: 5,
    randomParametersPerWaveFormula: "wave_number",
    rebuildEnemyParametersEachWave: true,
    xp: {
      firstLevelCost: 30,
      levelCostMultiplier: 1.1,
      bossStarXpValue: 10,
      smallStarXpValue: 10,
    },
  },
  hero: {
    base: {
      health: sharedBaseUnitStats.health,
      moveSpeed: sharedBaseUnitStats.moveSpeed,
    },
    levelUp: {
      cardsPerLevel: 3,
      pauseOnLevelUp: true,
      parameterPoolSource: "shared_with_enemies",
      duplicateCardsAllowedPerOffer: false,
    },
  },
  enemy: {
    baseVisual: {
      color: "#6fb26d",
      outlineColor: "#6fb26d",
      shape: "circle",
      weaponVfxColor: "#f1cf58",
    },
    baseStats: {
      health: sharedBaseUnitStats.health,
      moveSpeed: sharedBaseUnitStats.moveSpeed,
      attackCooldownSeconds: 2,
    },
    baseWeapons: {
      melee: {
        damage: 1,
        radius: 10,
        cooldownSeconds: 2,
        vfx: "half_arc",
      },
    },
    balance: {
      damageGrowthMultiplier: 0.1,
    },
    spawn: {
      preferOffscreenSpawn: true,
      undergroundSpawnTypes: ["zombie", "boss"],
      bossSpawnNearPlayer: true,
    },
    drops: {
      medkitChance: 0.02,
      medkitHealPercent: 0.25,
      xpStarChance: 0.1,
      bossStarsPerWaveRule: "wave_number",
      bossStarScatterRadius: 48,
      lifetimeSeconds: 20,
      blinkStartSecondsRemaining: 5,
    },
  },
  boss: {
    useSeparateRandomRoll: true,
    multiplier: 5,
    moveSpeedMultiplier: 1,
  },
  parameters: {
    naming: {
      tier3Formula: "stacks_minus_2",
    },
    weapons: {
      dominantWeaponRule: "highest_bonus_count_including_base",
      mixedWeaponBehavior: "parallel_cooldowns",
      duplicateWeaponBehavior: "stack_same_weapon_bonuses",
    },
    vitality: {
      type: "stat",
      healthBonus: 5,
      namingTiers: ["хилые", "живучие", "бессмертные X"],
      visualEffect: "base_color_browner",
    },
    speed: {
      type: "stat",
      moveSpeedBonus: 5,
      namingTiers: ["медленные", "шустрые", "скоростные X"],
      visualEffect: "none",
    },
    armor: {
      type: "defense",
      incomingDamageReduction: 1,
      namingTiers: ["толстокожие", "бронявые", "непробиваемые X"],
      visualEffect: "outline_toward_cyan",
    },
    reload: {
      type: "cadence",
      cooldownReductionSeconds: 0.2,
      namingTiers: ["неуклюжие", "ловкие", "юркие X"],
      visualEffect: "weapon_vfx_whitens",
    },
    meleeWeapon: {
      type: "weapon",
      weaponId: "melee",
      damageBonus: 3,
      namingTiers: ["безоружные", "бьющие", "накаутирующие X"],
      dominantShape: "circle",
    },
    pistolWeapon: {
      type: "weapon",
      weaponId: "pistol",
      damageBonus: 5,
      radiusBonus: 50,
      projectileSpeedBonus: 10,
      namingTiers: ["метающие", "стреляющие", "расстреливающие X"],
      dominantShape: "oval",
      vfx: "three_lines",
    },
    shotgunWeapon: {
      type: "weapon",
      weaponId: "shotgun",
      pellets: 8,
      damageBonus: 2,
      radiusBonus: 20,
      projectileSpeedBonus: 10,
      namingTiers: ["дробьющие", "картечьные", "пушечные X"],
      dominantShape: "triangle",
      vfx: "cone",
    },
    grenadeWeapon: {
      type: "weapon",
      weaponId: "grenade",
      damageBonus: 10,
      grenadesPerVolleyBonus: 1,
      radiusBonus: 20,
      namingTiers: ["гранатные", "миномётные", "ядерные X"],
      dominantShape: "square",
      vfx: "smoke_circles",
    },
  },
  naming: {
    order: ["vitality", "speed", "armor", "reload", "weapon"],
    wavePrefix: "Wave",
    unitNoun: "zombies",
  },
  ui: {
    showWaveBanner: true,
    showWaveCounterTop: true,
    showHealthValueInsideBar: true,
    showDevParameterOverlay: true,
  },
};
