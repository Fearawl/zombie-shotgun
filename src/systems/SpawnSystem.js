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

  getOffscreenSpawnPoint(worldView) {
    const padding = this.config.runtime.enemy.offscreenSpawnPadding;
    const side = Phaser.Math.Between(0, 3);

    if (side === 0) {
      return { x: worldView.left - padding, y: Phaser.Math.Between(worldView.top, worldView.bottom) };
    }
    if (side === 1) {
      return { x: worldView.right + padding, y: Phaser.Math.Between(worldView.top, worldView.bottom) };
    }
    if (side === 2) {
      return { x: Phaser.Math.Between(worldView.left, worldView.right), y: worldView.top - padding };
    }

    return { x: Phaser.Math.Between(worldView.left, worldView.right), y: worldView.bottom + padding };
  }

  getNearHeroSpawnPoint(hero, worldBounds) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(
      this.config.runtime.enemy.bossSpawnMinDistance,
      this.config.runtime.enemy.bossSpawnMaxDistance
    );

    return {
      x: Phaser.Math.Clamp(hero.x + Math.cos(angle) * distance, 80, worldBounds.width - 80),
      y: Phaser.Math.Clamp(hero.y + Math.sin(angle) * distance, 80, worldBounds.height - 80),
    };
  }
}
