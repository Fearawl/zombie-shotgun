export class PresentationSystem {
  constructor(config) {
    this.config = config;
  }

  formatWaveSummary(wave) {
    return [
      `Wave: ${wave.waveNumber}`,
      `Title: ${wave.waveTitle}`,
      `Spawn every: ${wave.spawnIntervalSeconds.toFixed(2)}s`,
      `Boss health: ${wave.boss.stats.health}`,
    ];
  }

  formatEnemySummary(unit) {
    const weapons = Object.keys(unit.weaponProfiles).join(", ");
    return [
      `Health: ${unit.stats.health}`,
      `Move speed: ${unit.stats.moveSpeed}`,
      `Attack cooldown: ${unit.stats.attackCooldownSeconds.toFixed(2)}s`,
      `Armor: ${unit.stats.armor}`,
      `Shape: ${unit.visuals.shape}`,
      `Weapons: ${weapons}`,
    ];
  }
}
