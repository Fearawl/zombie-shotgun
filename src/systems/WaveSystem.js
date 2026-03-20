export class WaveSystem {
  constructor(config, eventBus, enemyFactory) {
    this.config = config;
    this.eventBus = eventBus;
    this.enemyFactory = enemyFactory;
  }

  createNextWave(currentWaveNumber) {
    const waveNumber = currentWaveNumber + 1;
    const descriptor = this.enemyFactory.createWaveDescriptor(waveNumber);
    const boss = this.enemyFactory.createBossDescriptor(waveNumber);
    const spawnIntervalSeconds = this.getSpawnIntervalSeconds(waveNumber);
    const waveTitle = this.buildWaveTitle(waveNumber, descriptor.titleParts);

    const wave = {
      waveNumber,
      descriptor,
      boss,
      durationSeconds: this.config.progression.waveDurationSeconds,
      spawnIntervalSeconds,
      waveTitle,
    };

    this.eventBus.emit("wave:created", wave);
    return wave;
  }

  getSpawnIntervalSeconds(waveNumber) {
    const baseSeconds = 1;
    const multiplier = Math.pow(1 - this.config.progression.spawnAccelerationPerWave, waveNumber - 1);
    return Math.max(0.15, baseSeconds * multiplier);
  }

  buildWaveTitle(waveNumber, titleParts) {
    const adjectiveChain = titleParts.length > 0 ? titleParts.join(", ") : "базовые";
    return `Волна ${waveNumber}. ${adjectiveChain} зомби`;
  }
}
