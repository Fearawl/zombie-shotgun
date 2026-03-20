export class Hero {
  constructor(config) {
    this.config = config;
    this.level = 1;
    this.experience = 0;
    this.stats = {
      health: config.hero.base.health,
      moveSpeed: config.hero.base.moveSpeed,
    };
    this.parameterStacks = {};
    this.weaponProfiles = {};
  }

  applyUpgrade(parameterKey, resolver) {
    this.parameterStacks[parameterKey] = (this.parameterStacks[parameterKey] ?? 0) + 1;
    const resolved = resolver(this.parameterStacks);
    this.stats = resolved.stats;
    this.weaponProfiles = resolved.weaponProfiles;
  }
}
