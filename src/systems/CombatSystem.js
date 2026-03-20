export class CombatSystem {
  constructor(config) {
    this.config = config;
  }

  buildHeroShotgunProfile(hero) {
    const runtimeShotgun = this.config.runtime.hero.shotgun;
    const shotgunStacks = hero.parameterStacks.shotgunWeapon ?? 0;
    const reloadStacks = hero.parameterStacks.reload ?? 0;

    return {
      pellets: runtimeShotgun.pellets,
      damagePerPellet:
        runtimeShotgun.damagePerPellet +
        shotgunStacks * this.config.parameters.shotgunWeapon.damageBonus,
      spreadRadians: runtimeShotgun.spreadRadians,
      range: runtimeShotgun.range + shotgunStacks * this.config.parameters.shotgunWeapon.radiusBonus,
      cooldownMs: Math.max(
        80,
        runtimeShotgun.cooldownMs -
          reloadStacks * this.config.parameters.reload.cooldownReductionSeconds * 1000
      ),
      projectileSpeed:
        runtimeShotgun.projectileSpeed +
        shotgunStacks * this.config.parameters.shotgunWeapon.projectileSpeedBonus,
    };
  }

  isTargetInsideShot(origin, target, angle, range, hitRadius) {
    const endX = origin.x + Math.cos(angle) * range;
    const endY = origin.y + Math.sin(angle) * range;
    const dx = endX - origin.x;
    const dy = endY - origin.y;
    const lengthSq = dx * dx + dy * dy;
    const t = Phaser.Math.Clamp(
      ((target.x - origin.x) * dx + (target.y - origin.y) * dy) / lengthSq,
      0,
      1
    );
    const nearestX = origin.x + dx * t;
    const nearestY = origin.y + dy * t;
    return Phaser.Math.Distance.Between(nearestX, nearestY, target.x, target.y) <= hitRadius;
  }

  fireHeroShotgun(scene, pointer) {
    const shotgun = this.buildHeroShotgunProfile(scene.hero);
    if (scene.time.now - scene.lastHeroShotAt < shotgun.cooldownMs) {
      return false;
    }

    scene.lastHeroShotAt = scene.time.now;
    const baseAngle = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, pointer.worldX, pointer.worldY);
    const duration = Math.round((shotgun.range / shotgun.projectileSpeed) * 1000);

    for (let i = 0; i < shotgun.pellets; i += 1) {
      const t = shotgun.pellets === 1 ? 0.5 : i / (shotgun.pellets - 1);
      const angle = baseAngle + Phaser.Math.Linear(-shotgun.spreadRadians, shotgun.spreadRadians, t);
      const pellet = scene.add
        .image(scene.player.x + Math.cos(angle) * 24, scene.player.y + Math.sin(angle) * 24, "pellet")
        .setDepth(6);
      scene.heroProjectiles.add(pellet);
      scene.tweens.add({
        targets: pellet,
        x: scene.player.x + Math.cos(angle) * shotgun.range,
        y: scene.player.y + Math.sin(angle) * shotgun.range,
        alpha: 0.15,
        duration,
        ease: "Linear",
        onComplete: () => pellet.destroy(),
      });
      this.applyHeroPelletDamage(scene, angle, shotgun.range, shotgun.damagePerPellet);
    }

    this.showMuzzleFlash(scene, baseAngle);
    scene.cameras.main.shake(60, 0.0025);
    return true;
  }

  applyHeroPelletDamage(scene, angle, range, damage) {
    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }
      if (!this.isTargetInsideShot(scene.player, enemy, angle, range, 18)) {
        return;
      }

      const inflictedDamage = Math.max(1, damage - (enemy.armorValue ?? 0));
      const died = enemy.takeDamage(inflictedDamage);
      if (died) {
        scene.kills += 1;
      }
    });
  }

  handleEnemyTouch(scene, player, enemy) {
    if (scene.isGameplayPaused || !enemy.active || !enemy.canMove) {
      return false;
    }
    if (!enemy.canAttack(scene.time.now)) {
      return false;
    }

    enemy.recordAttack(scene.time.now);
    player.healthPoints = Math.max(0, player.healthPoints - this.config.runtime.enemy.attackDamage);
    scene.cameras.main.shake(80, 0.003);
    return player.healthPoints <= 0;
  }

  showMuzzleFlash(scene, angle) {
    const flash = scene.add.graphics();
    const x = scene.player.x + Math.cos(angle) * 46;
    const y = scene.player.y + Math.sin(angle) * 46;
    flash.fillStyle(0xffd36a, 0.95);
    flash.fillTriangle(
      x,
      y,
      x + Math.cos(angle + 0.34) * 30,
      y + Math.sin(angle + 0.34) * 30,
      x + Math.cos(angle - 0.34) * 30,
      y + Math.sin(angle - 0.34) * 30
    );
    scene.time.delayedCall(70, () => flash.destroy());
  }
}
