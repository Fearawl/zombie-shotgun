export class HeroBuildSystem {
  constructor(config, weaponSystem) {
    this.config = config;
    this.weaponSystem = weaponSystem;
  }

  resolveHeroProgression(parameterStacks) {
    const stats = {
      health:
        this.config.hero.base.health +
        (parameterStacks.vitality ?? 0) * this.config.parameters.vitality.healthBonus,
      moveSpeed:
        this.config.hero.base.moveSpeed +
        (parameterStacks.speed ?? 0) * this.config.parameters.speed.moveSpeedBonus,
    };

    return {
      stats,
      weaponProfiles: this.weaponSystem.buildHeroWeaponProfiles(parameterStacks),
    };
  }

  applyUpgrade(hero, parameterKey) {
    hero.applyUpgrade(parameterKey, (stacks) => this.resolveHeroProgression(stacks));
    return hero.stats;
  }
}
