export class SpawnSystem {
  constructor(config) {
    this.config = config;
  }

  getWaveSpawnProfile(wave) {
    return {
      durationSeconds: wave.durationSeconds,
      spawnIntervalSeconds: wave.spawnIntervalSeconds,
      regularSpawnMode: "offscreen_toward_hero",
      undergroundTypes: this.config.enemy.spawn.undergroundSpawnTypes,
      bossSpawnMode: "near_hero_underground",
    };
  }
}
