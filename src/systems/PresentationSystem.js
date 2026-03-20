export class PresentationSystem {
  constructor(config) {
    this.config = config;
  }

  buildEnemyVisuals(parameterStacks, dominantWeapon, isBoss) {
    const baseVisual = this.config.enemy.baseVisual;
    const vitalityStacks = parameterStacks.vitality ?? 0;
    const armorStacks = parameterStacks.armor ?? 0;
    const reloadStacks = parameterStacks.reload ?? 0;

    return {
      shape: dominantWeapon.shape,
      weaponId: dominantWeapon.weaponId,
      bodyTint: isBoss
        ? 0xc84a42
        : this.shiftToward(this.hexToRgb(baseVisual.color), { r: 142, g: 109, b: 78 }, vitalityStacks * 0.17),
      outlineTint: isBoss
        ? 0xff9f98
        : this.shiftToward(this.hexToRgb(baseVisual.outlineColor), { r: 120, g: 196, b: 224 }, armorStacks * 0.22),
      weaponVfxTint: this.shiftToward(
        this.hexToRgb(baseVisual.weaponVfxColor),
        { r: 255, g: 255, b: 255 },
        reloadStacks * 0.18
      ),
    };
  }

  formatHeroHud(player, session, kills, bossesSpawned) {
    return [
      `HP: ${player.healthPoints}/${player.maxHealth}`,
      `SG: ${player.shotgunAmmo ?? 0}/${player.shotgunMagazineSize ?? 0}${player.isReloading ? " (Reloading)" : ""}`,
      `LV: ${session.heroLevel}   XP: ${session.heroXp}/${session.nextLevelXp}`,
      `Kills: ${kills}`,
      `Bosses: ${bossesSpawned}`,
    ].join("\n");
  }

  formatWaveCounter(waveNumber, secondsRemaining) {
    return `Wave ${waveNumber} | ${Math.max(0, Math.ceil(secondsRemaining))}s`;
  }

  formatWaveTitle(waveTitle) {
    return waveTitle;
  }

  hexToRgb(hexColor) {
    const normalized = hexColor.replace("#", "");
    const value = parseInt(normalized, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  shiftToward(source, target, amount) {
    const t = Phaser.Math.Clamp(amount, 0, 0.92);
    const color = {
      r: Math.round(Phaser.Math.Linear(source.r, target.r, t)),
      g: Math.round(Phaser.Math.Linear(source.g, target.g, t)),
      b: Math.round(Phaser.Math.Linear(source.b, target.b, t)),
    };
    return (color.r << 16) | (color.g << 8) | color.b;
  }
}
