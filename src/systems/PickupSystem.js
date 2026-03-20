import { PickupActor } from "../entities/PickupActor.js";

export class PickupSystem {
  constructor(config, lootSystem) {
    this.config = config;
    this.lootSystem = lootSystem;
  }

  updateActors(timeNow, pickupsGroup, destroyPickup) {
    pickupsGroup.getChildren().forEach((pickup) => {
      if (!pickup.active) {
        return;
      }

      const isAlive = pickup.updatePresentation(timeNow);
      if (!isAlive) {
        destroyPickup(pickup);
      }
    });
  }

  spawnDrop(scene, pickupsGroup, waveNumber, x, y, dropType) {
    if (dropType === "boss_burst") {
      const pickups = this.lootSystem.createBossXpBurst(waveNumber);
      pickups.forEach((pickupData) => {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(12, this.config.enemy.drops.bossStarScatterRadius);
        this.createActor(scene, pickupsGroup, pickupData, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
      });
      return;
    }

    if (Math.random() < this.config.enemy.drops.medkitChance) {
      this.createActor(scene, pickupsGroup, this.lootSystem.createMedkitPickup(), x, y);
    }
    if (Math.random() < this.config.enemy.drops.xpStarChance) {
      this.createActor(
        scene,
        pickupsGroup,
        this.lootSystem.createXpPickup(),
        x + Phaser.Math.Between(-18, 18),
        y + Phaser.Math.Between(-18, 18)
      );
    }
  }

  createActor(scene, pickupsGroup, pickupData, x, y) {
    const texture = pickupData.type === "medkit" ? "medkit-pickup" : "xp-star";
    const pickup = new PickupActor(scene, x, y, texture, pickupData);
    if (pickupData.type === "xp_star") {
      pickup.setScale(0.9);
    }
    pickupsGroup.add(pickup);
    return pickup;
  }

  collect(scene, player, pickup, session) {
    if (!pickup.active || scene.isGameplayPaused) {
      return { leveledUp: false };
    }

    if (pickup.pickupData.type === "medkit") {
      const healAmount = Math.max(1, Math.round(player.maxHealth * pickup.value));
      player.healthPoints = Math.min(player.maxHealth, player.healthPoints + healAmount);
      return { leveledUp: false, healed: true };
    }

    if (pickup.pickupData.type === "xp_star") {
      const leveledUp = session.addHeroXp(pickup.value);
      return { leveledUp, healed: false };
    }

    return { leveledUp: false };
  }
}
