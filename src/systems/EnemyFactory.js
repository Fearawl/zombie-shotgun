import { EnemyUnit } from "../entities/EnemyUnit.js";

export class EnemyFactory {
  constructor(config, weaponSystem) {
    this.config = config;
    this.weaponSystem = weaponSystem;
    this.parameterKeys = [
      "vitality",
      "speed",
      "armor",
      "reload",
      "meleeWeapon",
      "pistolWeapon",
      "shotgunWeapon",
      "grenadeWeapon",
    ];
  }

  createWaveDescriptor(waveNumber) {
    return this.createUnitDescriptor({
      waveNumber,
      isBoss: false,
      parameterRolls: waveNumber,
    });
  }

  createBossDescriptor(waveNumber) {
    return this.createUnitDescriptor({
      waveNumber,
      isBoss: true,
      parameterRolls: waveNumber,
    });
  }

  createUnitDescriptor({ waveNumber, isBoss, parameterRolls }) {
    const parameterStacks = this.rollParameterStacks(parameterRolls);
    const stats = this.buildStats(parameterStacks, isBoss);
    const weaponProfiles = this.weaponSystem.buildWeaponProfiles(parameterStacks);
    const visuals = this.buildVisuals(parameterStacks);
    const titleParts = this.buildTitleParts(parameterStacks);

    return new EnemyUnit({
      kind: "zombie",
      waveNumber,
      isBoss,
      parameterStacks,
      stats,
      weaponProfiles,
      visuals,
      titleParts,
    });
  }

  rollParameterStacks(parameterRolls) {
    const stacks = {};
    for (let i = 0; i < parameterRolls; i += 1) {
      const parameterKey = Phaser.Utils.Array.GetRandom(this.parameterKeys);
      stacks[parameterKey] = (stacks[parameterKey] ?? 0) + 1;
    }
    return stacks;
  }

  buildStats(parameterStacks, isBoss) {
    const baseStats = this.config.enemy.baseStats;
    let health = baseStats.health;
    let moveSpeed = baseStats.moveSpeed;
    let attackCooldownSeconds = baseStats.attackCooldownSeconds;
    let armor = 0;

    health += (parameterStacks.vitality ?? 0) * this.config.parameters.vitality.healthBonus;
    moveSpeed += (parameterStacks.speed ?? 0) * this.config.parameters.speed.moveSpeedBonus;
    attackCooldownSeconds -=
      (parameterStacks.reload ?? 0) * this.config.parameters.reload.cooldownReductionSeconds;
    armor += (parameterStacks.armor ?? 0) * this.config.parameters.armor.incomingDamageReduction;

    if (isBoss) {
      health *= this.config.boss.multiplier;
      moveSpeed *= this.config.boss.multiplier;
      attackCooldownSeconds /= this.config.boss.multiplier;
      armor *= this.config.boss.multiplier;
    }

    return {
      health,
      moveSpeed,
      attackCooldownSeconds: Math.max(0.1, attackCooldownSeconds),
      armor,
    };
  }

  buildVisuals(parameterStacks) {
    const dominant = this.weaponSystem.getDominantWeapon(parameterStacks);
    return {
      baseColor: this.config.enemy.baseVisual.color,
      outlineColor: this.config.enemy.baseVisual.outlineColor,
      weaponVfxColor: this.config.enemy.baseVisual.weaponVfxColor,
      shape: dominant.shape,
    };
  }

  buildTitleParts(parameterStacks) {
    const ordered = [
      "vitality",
      "speed",
      "armor",
      "reload",
      "meleeWeapon",
      "pistolWeapon",
      "shotgunWeapon",
      "grenadeWeapon",
    ];

    return ordered
      .filter((key) => (parameterStacks[key] ?? 0) > 0)
      .map((key) => this.resolveParameterLabel(this.config.parameters[key].namingTiers, parameterStacks[key]));
  }

  resolveParameterLabel(namingTiers, stackCount) {
    if (stackCount === 1) {
      return namingTiers[0];
    }
    if (stackCount === 2) {
      return namingTiers[1];
    }
    return namingTiers[2].replace("X", String(stackCount - 2));
  }
}
