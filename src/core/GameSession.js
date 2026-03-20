export class GameSession {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.waveNumber = 0;
    this.currentWave = null;
    this.currentBoss = null;
    this.heroLevel = 1;
    this.heroXp = 0;
    this.nextLevelXp = Math.round(this.config.progression.xp.firstLevelCost);
    this.pauseReason = null;
  }

  setWaveState(wave) {
    this.waveNumber = wave.waveNumber;
    this.currentWave = wave;
  }

  setBossState(boss) {
    this.currentBoss = boss;
  }

  addHeroXp(amount) {
    this.heroXp = Math.round(this.heroXp + amount);
    const leveledUp = this.heroXp >= this.nextLevelXp;
    if (!leveledUp) {
      return false;
    }

    this.heroXp = Math.round(this.heroXp - this.nextLevelXp);
    this.heroLevel += 1;
    this.nextLevelXp = Math.max(
      this.nextLevelXp + 1,
      Math.round(this.nextLevelXp * this.config.progression.xp.levelCostMultiplier)
    );
    return true;
  }

  setPauseReason(reason) {
    this.pauseReason = reason;
  }

  clearPauseReason() {
    this.pauseReason = null;
  }
}
