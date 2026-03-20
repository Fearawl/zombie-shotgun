export class CombatSystem {
  constructor(config) {
    this.config = config;
  }

  buildHeroShotgunProfile(hero) {
    return hero.weaponProfiles.shotgun;
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

  updateHeroAttacks(scene) {
    if (scene.isGameplayPaused || !scene.player?.active) {
      return;
    }

    const pointer = scene.input.activePointer.positionToCamera(scene.cameras.main);
    if (scene.input.activePointer.leftButtonDown()) {
      this.fireHeroShotgun(scene, { worldX: pointer.x, worldY: pointer.y });
      this.fireHeroPistol(scene, { worldX: pointer.x, worldY: pointer.y });
      this.throwHeroGrenades(scene, { worldX: pointer.x, worldY: pointer.y });
    }

    this.triggerHeroMelee(scene);
  }

  fireHeroShotgun(scene, pointer) {
    const shotgun = this.buildHeroShotgunProfile(scene.hero);
    if (!shotgun) {
      return false;
    }
    if (scene.player.isReloading || scene.player.shotgunAmmo <= 0) {
      return false;
    }
    if (scene.time.now - scene.lastHeroShotAt < shotgun.cooldownMs) {
      return false;
    }

    scene.lastHeroShotAt = scene.time.now;
    scene.player.shotgunAmmo -= 1;
    const baseAngle = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, pointer.worldX, pointer.worldY);
    const duration = Math.round((shotgun.radius / shotgun.projectileSpeed) * 1000);

    for (let i = 0; i < shotgun.pellets; i += 1) {
      const t = shotgun.pellets === 1 ? 0.5 : i / (shotgun.pellets - 1);
      const angle = baseAngle + Phaser.Math.Linear(-shotgun.spreadRadians, shotgun.spreadRadians, t);
      const pellet = scene.add
        .image(scene.player.x + Math.cos(angle) * 24, scene.player.y + Math.sin(angle) * 24, "pellet")
        .setDepth(6);
      scene.heroProjectiles.add(pellet);
      scene.tweens.add({
        targets: pellet,
        x: scene.player.x + Math.cos(angle) * shotgun.radius,
        y: scene.player.y + Math.sin(angle) * shotgun.radius,
        alpha: 0.15,
        duration,
        ease: "Linear",
        onComplete: () => pellet.destroy(),
      });
      this.applyHeroPelletDamage(scene, angle, shotgun.radius, shotgun.damagePerPellet, shotgun.projectileSpeed);
    }

    this.showMuzzleFlash(scene, baseAngle);
    if (scene.player.shotgunAmmo <= 0) {
      scene.tryReloadShotgun();
    }
    scene.cameras.main.shake(60, 0.0025);
    return true;
  }

  fireHeroPistol(scene, pointer) {
    const pistol = scene.hero.weaponProfiles.pistol;
    if (!pistol) {
      return false;
    }
    if (scene.time.now - scene.lastHeroPistolAt < pistol.cooldownMs) {
      return false;
    }

    scene.lastHeroPistolAt = scene.time.now;
    const angle = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, pointer.worldX, pointer.worldY);
    const projectile = scene.add
      .image(scene.player.x + Math.cos(angle) * 18, scene.player.y + Math.sin(angle) * 18, "pistol-bullet")
      .setDepth(6)
      .setScale(1.05);
    scene.heroProjectiles.add(projectile);
    const hitTarget = this.findHeroPistolTarget(scene, angle, pistol.radius);
    const hitDistance = hitTarget
      ? Phaser.Math.Distance.Between(scene.player.x, scene.player.y, hitTarget.x, hitTarget.y)
      : pistol.radius;
    const hitDuration = Math.round((hitDistance / pistol.projectileSpeed) * 1000);
    scene.tweens.add({
      targets: projectile,
      x: scene.player.x + Math.cos(angle) * hitDistance,
      y: scene.player.y + Math.sin(angle) * hitDistance,
      alpha: 0.1,
      duration: hitDuration,
      ease: "Linear",
      onComplete: () => projectile.destroy(),
    });

    this.applyHeroPistolDamage(scene, hitTarget, pistol.damage, hitDuration);
    return true;
  }

  triggerHeroMelee(scene) {
    const melee = scene.hero.weaponProfiles.melee;
    if (!melee) {
      return false;
    }
    if (scene.time.now - scene.lastHeroMeleeAt < melee.cooldownMs) {
      return false;
    }

    let bestTarget = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
      if (distance <= melee.radius && distance < bestDistance) {
        bestTarget = enemy;
        bestDistance = distance;
      }
    });

    scene.lastHeroMeleeAt = scene.time.now;
    if (bestTarget) {
      const died = bestTarget.takeDamage(Math.max(1, melee.damage - (bestTarget.armorValue ?? 0)));
      if (died) {
        scene.kills += 1;
      }
    }
    this.showHeroMeleeSwing(scene, bestTarget, melee.radius);
    return Boolean(bestTarget);
  }

  throwHeroGrenades(scene, pointer) {
    const grenade = scene.hero.weaponProfiles.grenade;
    if (!grenade) {
      return false;
    }
    if (scene.time.now - scene.lastHeroGrenadeAt < grenade.cooldownMs) {
      return false;
    }

    scene.lastHeroGrenadeAt = scene.time.now;
    const volleyCount = Math.max(1, grenade.grenadesPerVolley ?? 1);
    for (let i = 0; i < volleyCount; i += 1) {
      const spreadX = Phaser.Math.Between(-36, 36);
      const spreadY = Phaser.Math.Between(-36, 36);
      const targetX = pointer.worldX + spreadX;
      const targetY = pointer.worldY + spreadY;
      const orb = scene.add
        .image(scene.player.x, scene.player.y - 4, "grenade-orb")
        .setDepth(6.2)
        .setScale(0.78)
        .setTint(0xd8dde3);
      scene.heroProjectiles.add(orb);
      let lastTrailAt = -100;
      scene.tweens.add({
        targets: orb,
        x: targetX,
        y: targetY,
        duration: 420,
        ease: "Sine.Out",
        onUpdate: () => {
          if (scene.time.now - lastTrailAt < 45) {
            return;
          }
          lastTrailAt = scene.time.now;
          this.spawnGrenadeTrailPuff(scene, orb.x, orb.y, 0xc9d0d6, 0.42);
        },
        onComplete: () => {
          orb.destroy();
          this.resolveHeroGrenadeExplosion(
            scene,
            targetX,
            targetY,
            grenade.damage,
            Math.max(34, grenade.radius * 0.34)
          );
        },
      });
    }

    return true;
  }

  applyHeroPelletDamage(scene, angle, range, damage, projectileSpeed) {
    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }
      if (!this.isTargetInsideShot(scene.player, enemy, angle, range, 18)) {
        return;
      }
      const hitDelay = Math.round(
        (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y) / projectileSpeed) * 1000
      );
      this.scheduleHeroDamage(scene, enemy, damage, hitDelay);
    });
  }

  findHeroPistolTarget(scene, angle, range) {
    let bestTarget = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }
      if (!this.isTargetInsideShot(scene.player, enemy, angle, range, 14)) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTarget = enemy;
      }
    });

    return bestTarget;
  }

  applyHeroPistolDamage(scene, target, damage, hitDelay) {
    if (!target) {
      return;
    }

    this.scheduleHeroDamage(scene, target, damage, hitDelay);
  }

  scheduleHeroDamage(scene, enemy, damage, delayMs) {
    scene.time.delayedCall(delayMs, () => {
      if (!enemy?.active) {
        return;
      }
      const inflictedDamage = Math.max(1, damage - (enemy.armorValue ?? 0));
      const died = enemy.takeDamage(inflictedDamage);
      if (died) {
        scene.kills += 1;
      }
    });
  }

  resolveHeroGrenadeExplosion(scene, x, y, damage, radius) {
    const smoke = scene.add.graphics().setDepth(6.3);
    smoke.fillStyle(0xd9d6ce, 0.72);
    smoke.fillCircle(x, y, radius * 0.42);
    smoke.fillStyle(0xb9bcc2, 0.48);
    smoke.fillCircle(x + 14, y - 10, radius * 0.34);
    smoke.fillCircle(x - 12, y + 8, radius * 0.3);
    scene.tweens.add({
      targets: smoke,
      alpha: 0,
      scaleX: 1.38,
      scaleY: 1.38,
      duration: 260,
      onComplete: () => smoke.destroy(),
    });

    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > radius) {
        return;
      }

      const died = enemy.takeDamage(Math.max(1, damage - (enemy.armorValue ?? 0)));
      if (died) {
        scene.kills += 1;
      }
    });
  }

  handleEnemyTouch(scene, player, enemy) {
    if (scene.isGameplayPaused || !enemy.active || !enemy.canMove) {
      return false;
    }
    const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
    enemy.x += Math.cos(angle) * 3;
    enemy.y += Math.sin(angle) * 3;
    return false;
  }

  updateEnemyAttacks(scene) {
    if (scene.isGameplayPaused || !scene.player?.active) {
      return false;
    }

    let heroDied = false;
    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active || !enemy.canMove || heroDied) {
        return;
      }
      heroDied = this.executeEnemyWeapons(scene, enemy) || heroDied;
    });
    return heroDied;
  }

  executeEnemyWeapons(scene, enemy) {
    const profiles = enemy.descriptor?.weaponProfiles ?? {};
    const hero = scene.player;
    const distanceToHero = Phaser.Math.Distance.Between(enemy.x, enemy.y, hero.x, hero.y);

    for (const weapon of Object.values(profiles)) {
      const cooldownMs = Math.max(
        120,
        ((weapon.cooldownSeconds ?? enemy.attackCooldownMs / 1000) * 1000) /
          Math.max(0.2, scene.enemyAttackCadenceScale ?? 1)
      );
      if (!enemy.canUseWeapon(weapon.id, scene.time.now, cooldownMs)) {
        continue;
      }

      if (weapon.id === "melee") {
        if (distanceToHero > weapon.radius) {
          continue;
        }
        enemy.recordWeaponUse(weapon.id, scene.time.now);
        if (this.applyDamageToHero(scene, weapon.damage)) {
          return true;
        }
        this.showMeleeSwing(scene, enemy, hero);
        continue;
      }

      if (weapon.id === "pistol") {
        if (distanceToHero > weapon.radius) {
          continue;
        }
        enemy.recordWeaponUse(weapon.id, scene.time.now);
        this.fireEnemyPistol(scene, enemy, weapon);
        continue;
      }

      if (weapon.id === "shotgun") {
        if (distanceToHero > weapon.radius) {
          continue;
        }
        enemy.recordWeaponUse(weapon.id, scene.time.now);
        this.fireEnemyShotgun(scene, enemy, weapon);
        continue;
      }

      if (weapon.id === "grenade") {
        if (distanceToHero > weapon.radius) {
          continue;
        }
        enemy.recordWeaponUse(weapon.id, scene.time.now);
        this.throwEnemyGrenades(scene, enemy, weapon);
      }
    }

    return false;
  }

  applyDamageToHero(scene, damage) {
    scene.player.healthPoints = Math.max(0, scene.player.healthPoints - Math.max(1, Math.round(damage)));
    scene.cameras.main.shake(70, 0.0024);
    return scene.player.healthPoints <= 0;
  }

  fireEnemyPistol(scene, enemy, weapon) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
    this.showEnemyMuzzleFlash(scene, enemy.x, enemy.y, angle, enemy.weaponVfxTint, 22);
    this.spawnEnemyProjectile(scene, {
      x: enemy.x + Math.cos(angle) * 18,
      y: enemy.y + Math.sin(angle) * 18,
      angle,
      speed: 160 + (weapon.projectileSpeed ?? 0) * 8,
      range: weapon.radius,
      damage: weapon.damage,
      texture: "enemy-bullet",
      scale: 1.15,
      tint: enemy.weaponVfxTint,
    });
  }

  fireEnemyShotgun(scene, enemy, weapon) {
    const baseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
    this.showEnemyMuzzleFlash(scene, enemy.x, enemy.y, baseAngle, enemy.weaponVfxTint, 30);
    const pellets = weapon.pellets ?? 8;
    for (let i = 0; i < pellets; i += 1) {
      const t = pellets === 1 ? 0.5 : i / (pellets - 1);
      const angle = baseAngle + Phaser.Math.Linear(-0.32, 0.32, t);
      this.spawnEnemyProjectile(scene, {
        x: enemy.x + Math.cos(angle) * 18,
        y: enemy.y + Math.sin(angle) * 18,
        angle,
        speed: 150 + (weapon.projectileSpeed ?? 0) * 7,
        range: weapon.radius,
        damage: weapon.damage,
        texture: "pellet",
        scale: 0.9,
        tint: enemy.weaponVfxTint,
      });
    }
  }

  throwEnemyGrenades(scene, enemy, weapon) {
    const volleyCount = Math.max(1, weapon.grenadesPerVolley ?? 1);
    for (let i = 0; i < volleyCount; i += 1) {
      const spreadX = Phaser.Math.Between(-36, 36);
      const spreadY = Phaser.Math.Between(-36, 36);
      const targetX = scene.player.x + spreadX;
      const targetY = scene.player.y + spreadY;
      const orb = scene.add.image(enemy.x, enemy.y - 4, "grenade-orb").setDepth(6).setScale(0.75);
      let lastTrailAt = -100;
      scene.tweens.add({
        targets: orb,
        x: targetX,
        y: targetY,
        duration: 520,
        ease: "Sine.Out",
        onUpdate: () => {
          if (scene.time.now - lastTrailAt < 50) {
            return;
          }
          lastTrailAt = scene.time.now;
          this.spawnGrenadeTrailPuff(scene, orb.x, orb.y, enemy.weaponVfxTint, 0.38);
        },
        onComplete: () => {
          orb.destroy();
          this.resolveEnemyGrenadeExplosion(
            scene,
            targetX,
            targetY,
            weapon.damage,
            Math.max(28, weapon.radius * 0.34),
            enemy.weaponVfxTint
          );
        },
      });
    }
  }

  resolveEnemyGrenadeExplosion(scene, x, y, damage, radius, tint) {
    const smoke = scene.add.graphics().setDepth(6);
    smoke.fillStyle(tint, 0.75);
    smoke.fillCircle(x, y, radius * 0.4);
    smoke.fillStyle(tint, 0.45);
    smoke.fillCircle(x + 12, y - 8, radius * 0.32);
    smoke.fillCircle(x - 10, y + 6, radius * 0.28);
    scene.tweens.add({
      targets: smoke,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 260,
      onComplete: () => smoke.destroy(),
    });

    if (Phaser.Math.Distance.Between(x, y, scene.player.x, scene.player.y) <= radius) {
      this.applyDamageToHero(scene, damage);
    }
  }

  spawnGrenadeTrailPuff(scene, x, y, tint, scale) {
    const smoke = scene.add.graphics().setDepth(5.8);
    smoke.fillStyle(tint, 0.28);
    smoke.fillCircle(x, y, 8 * scale);
    smoke.fillStyle(tint, 0.16);
    smoke.fillCircle(x - 5, y + 3, 11 * scale);
    scene.tweens.add({
      targets: smoke,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 180,
      onComplete: () => smoke.destroy(),
    });
  }

  spawnEnemyProjectile(scene, { x, y, angle, speed, range, damage, texture, scale, tint }) {
    const projectile = scene.physics.add.image(x, y, texture);
    projectile.setDepth(6);
    projectile.setScale(scale ?? 1);
    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    projectile.body.allowGravity = false;
    projectile.damage = damage;
    projectile.spawnX = x;
    projectile.spawnY = y;
    projectile.maxRange = range;
    projectile.isEnemyProjectile = true;
    if (tint) {
      projectile.setTint(tint);
    }
    scene.enemyProjectiles.add(projectile);
    return projectile;
  }

  updateEnemyProjectiles(scene) {
    let heroDied = false;
    scene.enemyProjectiles.getChildren().forEach((projectile) => {
      if (!projectile.active || heroDied) {
        return;
      }
      const travelled = Phaser.Math.Distance.Between(
        projectile.spawnX,
        projectile.spawnY,
        projectile.x,
        projectile.y
      );
      if (travelled >= projectile.maxRange) {
        projectile.destroy();
        return;
      }
      if (Phaser.Math.Distance.Between(projectile.x, projectile.y, scene.player.x, scene.player.y) <= 18) {
        projectile.destroy();
        heroDied = this.applyDamageToHero(scene, projectile.damage) || heroDied;
      }
    });
    return heroDied;
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

  showEnemyMuzzleFlash(scene, originX, originY, angle, tint, radius) {
    const flash = scene.add.graphics().setDepth(6.2);
    const x = originX + Math.cos(angle) * 22;
    const y = originY + Math.sin(angle) * 22;
    flash.fillStyle(tint ?? 0xffd36a, 0.88);
    flash.fillTriangle(
      x,
      y,
      x + Math.cos(angle + 0.34) * radius,
      y + Math.sin(angle + 0.34) * radius,
      x + Math.cos(angle - 0.34) * radius,
      y + Math.sin(angle - 0.34) * radius
    );
    scene.time.delayedCall(70, () => flash.destroy());
  }

  showMeleeSwing(scene, enemy, hero) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, hero.x, hero.y);
    const arc = scene.add.graphics().setDepth(6);
    arc.fillStyle(enemy.weaponVfxTint, 0.12);
    arc.slice(enemy.x, enemy.y, 26, angle - Math.PI / 2, angle + Math.PI / 2, false);
    arc.fillPath();
    arc.lineStyle(4, enemy.weaponVfxTint, 0.95);
    arc.beginPath();
    arc.arc(enemy.x, enemy.y, 26, angle - Math.PI / 2, angle + Math.PI / 2, false);
    arc.strokePath();
    scene.tweens.add({
      targets: arc,
      alpha: 0,
      duration: 140,
      onComplete: () => arc.destroy(),
    });
  }

  showHeroMeleeSwing(scene, target, radius) {
    const pointer = scene.input.activePointer.positionToCamera(scene.cameras.main);
    const angle = target
      ? Phaser.Math.Angle.Between(scene.player.x, scene.player.y, target.x, target.y)
      : Phaser.Math.Angle.Between(scene.player.x, scene.player.y, pointer.x, pointer.y);
    const arc = scene.add.graphics().setDepth(8.6);
    arc.fillStyle(0xd9a55c, 0.12);
    arc.slice(scene.player.x, scene.player.y, radius, angle - Math.PI / 2, angle + Math.PI / 2, false);
    arc.fillPath();
    arc.lineStyle(5, 0xe8bb72, 0.95);
    arc.beginPath();
    arc.arc(scene.player.x, scene.player.y, radius, angle - Math.PI / 2, angle + Math.PI / 2, false);
    arc.strokePath();
    scene.tweens.add({
      targets: arc,
      alpha: 0,
      duration: 150,
      onComplete: () => arc.destroy(),
    });
  }
}
