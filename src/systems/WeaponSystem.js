export class WeaponSystem {
  constructor(config) {
    this.config = config;
  }

  buildWeaponProfiles(parameterStacks) {
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

      profile.damage += (parameter.damageBonus ?? 0) * count;
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

  getDominantWeapon(parameterStacks) {
    const candidates = [
      ["meleeWeapon", "circle", 1],
      ["pistolWeapon", "oval", 0],
      ["shotgunWeapon", "triangle", 0],
      ["grenadeWeapon", "square", 0],
    ];

    let best = candidates[0];
    for (const candidate of candidates) {
      const [parameterKey, shape, baseCount] = candidate;
      const count = (parameterStacks[parameterKey] ?? 0) + baseCount;
      const bestCount = (parameterStacks[best[0]] ?? 0) + best[2];
      if (count > bestCount) {
        best = candidate;
      }
    }

    return {
      parameterKey: best[0],
      shape: best[1],
    };
  }
}
