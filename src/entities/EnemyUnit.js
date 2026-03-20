export class EnemyUnit {
  constructor({ kind, waveNumber, isBoss, parameterStacks, stats, weaponProfiles, visuals, titleParts }) {
    this.kind = kind;
    this.waveNumber = waveNumber;
    this.isBoss = isBoss;
    this.parameterStacks = parameterStacks;
    this.stats = stats;
    this.weaponProfiles = weaponProfiles;
    this.visuals = visuals;
    this.titleParts = titleParts;
  }
}
