export class WeaponSystem {
  constructor(config) {
    this.config = config;
  }

  buildWeaponProfiles(parameterStacks, options = {}) {
    const damageGrowthMultiplier = options.damageGrowthMultiplier ?? 1;
    const profiles = {};
    const weaponDefs = [
      ["meleeWeapon", "melee"],
      ["pistolWeapon", "pistol"],
      ["shotgunWeapon", "shotgun"],
      ["grenadeWeapon", "grenade"],
    ];

    const baseMelee = this.config.enemy.baseWeapons.melee;
    profiles.melee = {
      id: "melee",
      damage: baseMelee.damage,
      radius: baseMelee.radius,
      cooldownSeconds: baseMelee.cooldownSeconds,
      vfx: baseMelee.vfx,
      bonusCount: 1,
    };

    for (const [parameterKey, weaponId] of weaponDefs) {
      const count = parameterStacks[parameterKey] ?? 0;
      if (count <= 0) {
        continue;
      }

      const parameter = this.config.parameters[parameterKey];
      const profile = profiles[weaponId] ?? {
        id: weaponId,
        damage: 0,
        radius: 0,
        cooldownSeconds: this.config.enemy.baseStats.attackCooldownSeconds,
        projectileSpeed: 0,
        pellets: parameter.pellets ?? 1,
        grenadesPerVolley: 1,
        vfx: parameter.vfx,
        bonusCount: 0,
      };

      profile.damage += (parameter.damageBonus ?? 0) * damageGrowthMultiplier * count;
      profile.radius += (parameter.radiusBonus ?? 0) * count;
      profile.projectileSpeed = (profile.projectileSpeed ?? 0) + (parameter.projectileSpeedBonus ?? 0) * count;
      profile.grenadesPerVolley =
        (profile.grenadesPerVolley ?? 1) + (parameter.grenadesPerVolleyBonus ?? 0) * count;
      profile.pellets = parameter.pellets ?? profile.pellets ?? 1;
      profile.vfx = parameter.vfx ?? profile.vfx;
      profile.bonusCount += count;
      profiles[weaponId] = profile;
    }

    return profiles;
  }

  buildHeroWeaponProfiles(parameterStacks) {
    const reloadStacks = parameterStacks.reload ?? 0;
    const shotgunStacks = parameterStacks.shotgunWeapon ?? 0;
    const pistolStacks = parameterStacks.pistolWeapon ?? 0;
    const grenadeStacks = parameterStacks.grenadeWeapon ?? 0;
    const shotgunRuntime = this.config.runtime.hero.shotgun;
    const profiles = {
      shotgun: {
        id: "shotgun",
        magazineSize: shotgunRuntime.magazineSize,
        pellets: shotgunRuntime.pellets,
        damagePerPellet:
          shotgunRuntime.damagePerPellet +
          shotgunStacks * this.config.parameters.shotgunWeapon.damageBonus,
        radius:
          shotgunRuntime.range +
          shotgunStacks * this.config.parameters.shotgunWeapon.radiusBonus,
        spreadRadians: shotgunRuntime.spreadRadians,
        cooldownMs: Math.max(
          80,
          shotgunRuntime.cooldownMs -
            reloadStacks * this.config.parameters.reload.cooldownReductionSeconds * 1000
        ),
        reloadMs: shotgunRuntime.reloadMs,
        projectileSpeed:
          shotgunRuntime.projectileSpeed +
          shotgunStacks * this.config.parameters.shotgunWeapon.projectileSpeedBonus,
        bonusCount: 1 + shotgunStacks,
      },
    };

    if (pistolStacks > 0) {
      profiles.pistol = {
        id: "pistol",
        damage: pistolStacks * this.config.parameters.pistolWeapon.damageBonus,
        radius: 260 + pistolStacks * this.config.parameters.pistolWeapon.radiusBonus,
        cooldownMs: Math.max(
          90,
          240 - reloadStacks * this.config.parameters.reload.cooldownReductionSeconds * 1000
        ),
        projectileSpeed: 760 + pistolStacks * this.config.parameters.pistolWeapon.projectileSpeedBonus * 18,
        bonusCount: pistolStacks,
      };
    }

    if (grenadeStacks > 0) {
      profiles.grenade = {
        id: "grenade",
        damage: grenadeStacks * this.config.parameters.grenadeWeapon.damageBonus,
        radius: 200 + grenadeStacks * this.config.parameters.grenadeWeapon.radiusBonus,
        cooldownMs: Math.max(
          500,
          900 - reloadStacks * this.config.parameters.reload.cooldownReductionSeconds * 1000
        ),
        projectileSpeed: 420,
        grenadesPerVolley: 1 + grenadeStacks * this.config.parameters.grenadeWeapon.grenadesPerVolleyBonus,
        bonusCount: grenadeStacks,
      };
    }

    const meleeStacks = parameterStacks.meleeWeapon ?? 0;
    if (meleeStacks > 0) {
      const baseMelee = this.config.enemy.baseWeapons.melee;
      profiles.melee = {
        id: "melee",
        damage: baseMelee.damage * 2 + meleeStacks * this.config.parameters.meleeWeapon.damageBonus,
        radius: baseMelee.radius * 6 + 20,
        cooldownMs: Math.max(
          220,
          baseMelee.cooldownSeconds * 1000 -
            reloadStacks * this.config.parameters.reload.cooldownReductionSeconds * 1000
        ),
        bonusCount: meleeStacks,
      };
    }

    return profiles;
  }

  getDominantWeapon(parameterStacks) {
    const candidates = [
      ["meleeWeapon", "melee", "circle", 1],
      ["pistolWeapon", "pistol", "oval", 0],
      ["shotgunWeapon", "shotgun", "triangle", 0],
      ["grenadeWeapon", "grenade", "square", 0],
    ];

    let best = candidates[0];
    for (const candidate of candidates) {
      const [parameterKey, , , baseCount] = candidate;
      const count = (parameterStacks[parameterKey] ?? 0) + baseCount;
      const bestCount = (parameterStacks[best[0]] ?? 0) + best[3];
      if (count > bestCount) {
        best = candidate;
      }
    }

    return {
      parameterKey: best[0],
      weaponId: best[1],
      shape: best[2],
    };
  }
}
