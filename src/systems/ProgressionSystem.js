export class ProgressionSystem {
  constructor(config) {
    this.config = config;
    this.parameterKeys = [
      "vitality",
      "speed",
      "armor",
      "reload",
      "meleeWeapon",
      "pistolWeapon",
      "shotgunWeapon",
      "grenadeWeapon",
    ];
  }

  getXpThreshold(level) {
    const { firstLevelCost, levelCostMultiplier } = this.config.progression.xp;
    return firstLevelCost * Math.pow(levelCostMultiplier, Math.max(0, level - 1));
  }

  createUpgradeOffer() {
    const pool = [...this.parameterKeys];
    const cards = [];

    while (cards.length < this.config.hero.levelUp.cardsPerLevel && pool.length > 0) {
      const index = Phaser.Math.Between(0, pool.length - 1);
      const parameterKey = pool.splice(index, 1)[0];
      const parameter = this.config.parameters[parameterKey];
      cards.push({
        key: parameterKey,
        title: this.getCardTitle(parameterKey),
        description: this.getCardDescription(parameterKey, parameter),
      });
    }

    return cards;
  }

  getCardTitle(parameterKey) {
    const titleMap = {
      vitality: "Живучесть",
      speed: "Скорость",
      armor: "Броня",
      reload: "Перезарядка",
      meleeWeapon: "Удар",
      pistolWeapon: "Пистолет",
      shotgunWeapon: "Дробовик",
      grenadeWeapon: "Граната",
    };
    return titleMap[parameterKey] ?? parameterKey;
  }

  getCardDescription(parameterKey, parameter) {
    if (parameter.type === "weapon") {
      return `Усиливает ${this.getCardTitle(parameterKey)} и его боевые свойства.`;
    }
    return `Добавляет бонус параметра ${this.getCardTitle(parameterKey)}.`;
  }
}
