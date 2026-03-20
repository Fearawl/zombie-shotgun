import { Pickup } from "../entities/Pickup.js";

export class LootSystem {
  constructor(config) {
    this.config = config;
  }

  createMedkitPickup() {
    return new Pickup({
      type: "medkit",
      value: this.config.enemy.drops.medkitHealPercent,
      lifetimeSeconds: this.config.enemy.drops.lifetimeSeconds,
      blinkStartSecondsRemaining: this.config.enemy.drops.blinkStartSecondsRemaining,
    });
  }

  createXpPickup() {
    return new Pickup({
      type: "xp_star",
      value: this.config.progression.xp.smallStarXpValue,
      lifetimeSeconds: this.config.enemy.drops.lifetimeSeconds,
      blinkStartSecondsRemaining: this.config.enemy.drops.blinkStartSecondsRemaining,
    });
  }

  createBossXpBurst(waveNumber) {
    return Array.from({ length: waveNumber }, () => this.createXpPickup());
  }
}
