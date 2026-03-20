import { gameConfig } from "../src/config/gameConfig.js";
import { EventBus } from "../src/core/EventBus.js";
import { GameSession } from "../src/core/GameSession.js";
import { Hero } from "../src/entities/Hero.js";
import { EnemyFactory } from "../src/systems/EnemyFactory.js";
import { LootSystem } from "../src/systems/LootSystem.js";
import { ProgressionSystem } from "../src/systems/ProgressionSystem.js";
import { SpawnSystem } from "../src/systems/SpawnSystem.js";
import { WaveSystem } from "../src/systems/WaveSystem.js";
import { WeaponSystem } from "../src/systems/WeaponSystem.js";
import { Zombie } from "../src/entities/Zombie.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.bootstrapArchitecture();
    this.bootstrapRuntimeState();
    this.buildWorld();
    this.createHeroSprite();
    this.createUi();
    this.setupInput();
    this.setupCollisions();
    this.beginNextWave();
  }

  bootstrapArchitecture() {
    this.eventBus = new EventBus();
    this.session = new GameSession(gameConfig);
    this.hero = new Hero(gameConfig);
    this.weaponSystem = new WeaponSystem(gameConfig);
    this.enemyFactory = new EnemyFactory(gameConfig, this.weaponSystem);
    this.waveSystem = new WaveSystem(gameConfig, this.eventBus, this.enemyFactory);
    this.spawnSystem = new SpawnSystem(gameConfig);
    this.lootSystem = new LootSystem(gameConfig);
    this.progressionSystem = new ProgressionSystem(gameConfig);

    this.eventBus.on("wave:created", (wave) => {
      this.session.setWaveState(wave);
      this.session.setBossState(wave.boss);
    });
  }

  bootstrapRuntimeState() {
    this.kills = 0;
    this.bossesSpawned = 0;
    this.waveRemainingSeconds = 0;
    this.isGameplayPaused = false;
    this.lastHeroShotAt = -gameConfig.runtime.hero.shotgun.cooldownMs;
    this.physics.world.setBounds(0, 0, gameConfig.runtime.world.width, gameConfig.runtime.world.height);
  }

  buildWorld() {
    const { width, height } = gameConfig.runtime.world;
    this.cameras.main.setBackgroundColor("#183227");

    const graphics = this.add.graphics();
    graphics.fillStyle(0x203629, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(1, 0x2b523a, 0.75);
    for (let y = 0; y < height; y += 72) {
      graphics.lineBetween(0, y, width, y);
    }
    for (let x = 0; x < width; x += 72) {
      graphics.lineBetween(x, 0, x, height);
    }
    graphics.lineStyle(2, 0x3a6b4d, 0.25);
    for (let x = -500; x < width + 100; x += 140) {
      graphics.lineBetween(x, 0, x + 560, height);
    }
    graphics.fillStyle(0x43633b, 0.85);
    graphics.fillEllipse(560, 460, 520, 200);
    graphics.fillEllipse(1480, 1080, 620, 220);
    graphics.fillEllipse(1780, 420, 420, 170);

    this.enemyProjectiles = this.add.group();
    this.heroProjectiles = this.add.group();
    this.enemies = this.physics.add.group({ classType: Zombie, runChildUpdate: true });
    this.pickups = this.physics.add.group();
  }

  createHeroSprite() {
    const heroConfig = gameConfig.runtime.hero;
    this.player = this.physics.add.sprite(heroConfig.spawnX, heroConfig.spawnY, "player-body");
    this.player.setCircle(heroConfig.bodyRadius, 4, 4);
    this.player.setCollideWorldBounds(true);
    this.player.healthPoints = gameConfig.hero.base.health;
    this.player.maxHealth = gameConfig.hero.base.health;

    this.playerShadow = this.add.ellipse(this.player.x + 8, this.player.y + 24, 48, 18, 0x000000, 0.24);
    this.playerGun = this.add.graphics();
    this.playerHealthBar = this.add.graphics().setDepth(8);
    this.playerHealthText = this.add
      .text(this.player.x, this.player.y, "", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "12px",
        color: "#f7f4dd",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(9);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, gameConfig.runtime.world.width, gameConfig.runtime.world.height);
    this.cameras.main.setZoom(1.05);
  }

  createUi() {
    const { width, height } = this.scale;
    this.topUi = this.add.container(0, 0).setScrollFactor(0).setDepth(20);

    const leftPanel = this.add.graphics();
    leftPanel.fillStyle(0x09131a, 0.86);
    leftPanel.lineStyle(2, 0x315166, 1);
    leftPanel.fillRoundedRect(16, 16, 320, 146, 16);
    leftPanel.strokeRoundedRect(16, 16, 320, 146, 16);

    this.heroUiText = this.add.text(34, 28, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "18px",
      color: "#f3d686",
      lineSpacing: 6,
    });

    this.waveCounterText = this.add
      .text(width / 2, 18, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "26px",
        color: "#f3ead1",
        stroke: "#15222b",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0);

    this.waveBannerText = this.add
      .text(width / 2, 56, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "24px",
        color: "#bdeec1",
        stroke: "#102219",
        strokeThickness: 6,
        align: "center",
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    this.topUi.add([leftPanel, this.heroUiText, this.waveCounterText, this.waveBannerText]);

    this.levelUpOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(50).setVisible(false);
    const dim = this.add.rectangle(0, 0, width, height, 0x051016, 0.88).setOrigin(0, 0);
    const panel = this.add.graphics();
    panel.fillStyle(0x10212b, 0.96);
    panel.lineStyle(3, 0x3c6075, 1);
    panel.fillRoundedRect(width / 2 - 420, height / 2 - 170, 840, 340, 22);
    panel.strokeRoundedRect(width / 2 - 420, height / 2 - 170, 840, 340, 22);
    const title = this.add
      .text(width / 2, height / 2 - 132, "Level Up", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "34px",
        color: "#f7eed0",
        stroke: "#162028",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(width / 2, height / 2 - 88, "Choose one upgrade for the hero", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#bdd0db",
      })
      .setOrigin(0.5);

    this.levelCardViews = [];
    for (let i = 0; i < gameConfig.hero.levelUp.cardsPerLevel; i += 1) {
      const cardX = width / 2 - 260 + i * 260;
      const card = this.createUpgradeCard(cardX, height / 2 + 14, i);
      this.levelCardViews.push(card);
      this.levelUpOverlay.add(card.container);
    }

    this.levelUpOverlay.add([dim, panel, title, subtitle]);
  }

  createUpgradeCard(x, y, index) {
    const container = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0x18303c, 1);
    background.lineStyle(3, 0x4a7388, 1);
    background.fillRoundedRect(-110, -86, 220, 172, 18);
    background.strokeRoundedRect(-110, -86, 220, 172, 18);

    const title = this.add
      .text(0, -42, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "24px",
        color: "#ffe4a3",
        align: "center",
        wordWrap: { width: 180 },
      })
      .setOrigin(0.5);

    const description = this.add
      .text(0, 16, "", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "15px",
        color: "#d8e3ea",
        align: "center",
        wordWrap: { width: 182 },
      })
      .setOrigin(0.5);

    const buttonHint = this.add
      .text(0, 58, "Pick", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "18px",
        color: "#9ee59f",
      })
      .setOrigin(0.5);

    const zone = this.add.zone(0, 0, 220, 172).setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => container.setScale(1.03));
    zone.on("pointerout", () => container.setScale(1));
    zone.on("pointerdown", () => container.setScale(0.98));
    zone.on("pointerup", () => {
      container.setScale(1.03);
      this.selectUpgradeCard(index);
    });

    container.add([background, title, description, buttonHint, zone]);
    return { container, title, description, buttonHint };
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys("W,A,S,D");
    this.input.on("pointerdown", (pointer) => {
      if (!this.isGameplayPaused && pointer.leftButtonDown()) {
        this.fireHeroShotgun(pointer);
      }
    });
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.enemies, this.handleEnemyTouch, undefined, this);
    this.physics.add.overlap(this.player, this.pickups, this.handlePickupCollect, undefined, this);
  }

  update() {
    if (this.isGameplayPaused) {
      return;
    }

    this.updateHeroMovement();
    this.updateHeroVisuals();
    this.updateHeroHealthBar();
    this.updatePickups();
    this.updateUi();
    this.tickWaveTimer();
  }

  updateHeroMovement() {
    let moveX = 0;
    let moveY = 0;
    if (this.keys.A.isDown) moveX -= 1;
    if (this.keys.D.isDown) moveX += 1;
    if (this.keys.W.isDown) moveY -= 1;
    if (this.keys.S.isDown) moveY += 1;

    const direction = new Phaser.Math.Vector2(moveX, moveY);
    if (direction.lengthSq() > 0) {
      direction.normalize().scale(this.hero.stats.moveSpeed * 20);
    }
    this.player.setVelocity(direction.x, direction.y);
  }

  updateHeroVisuals() {
    this.playerShadow.setPosition(this.player.x + 8, this.player.y + 24);
    const pointer = this.input.activePointer.positionToCamera(this.cameras.main);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
    const barrelLength = 34;
    const gripLength = 14;
    const barrelX = this.player.x + Math.cos(angle) * barrelLength;
    const barrelY = this.player.y + Math.sin(angle) * barrelLength;
    const buttX = this.player.x - Math.cos(angle) * gripLength;
    const buttY = this.player.y - Math.sin(angle) * gripLength;
    const sideAngle = angle + Math.PI / 2;

    this.playerGun.clear();
    this.playerGun.lineStyle(8, 0x44352d, 1);
    this.playerGun.lineBetween(buttX, buttY, barrelX, barrelY);
    this.playerGun.lineStyle(4, 0x946a3a, 1);
    this.playerGun.lineBetween(
      this.player.x + Math.cos(sideAngle) * 4,
      this.player.y + Math.sin(sideAngle) * 4,
      barrelX + Math.cos(sideAngle) * 2,
      barrelY + Math.sin(sideAngle) * 2
    );
  }

  updateHeroHealthBar() {
    const width = 54;
    const ratio = Phaser.Math.Clamp(this.player.healthPoints / this.player.maxHealth, 0, 1);
    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0x321414, 0.9);
    this.playerHealthBar.fillRoundedRect(this.player.x - width / 2, this.player.y - 48, width, 8, 4);
    this.playerHealthBar.fillStyle(0x6be47a, 1);
    this.playerHealthBar.fillRoundedRect(this.player.x - width / 2, this.player.y - 48, Math.max(0, width * ratio), 8, 4);
    this.playerHealthText.setText(`${this.player.healthPoints}/${this.player.maxHealth}`);
    this.playerHealthText.setPosition(this.player.x, this.player.y - 60);
  }

  updatePickups() {
    this.pickups.getChildren().forEach((pickup) => {
      if (!pickup.active) {
        return;
      }

      const ageSeconds = (this.time.now - pickup.spawnedAt) / 1000;
      const timeLeft = pickup.lifetimeSeconds - ageSeconds;
      if (timeLeft <= 0) {
        this.destroyPickup(pickup);
        return;
      }

      const bobOffset = Math.sin((this.time.now + pickup.floatOffset) / 170) * 3;
      pickup.setY(pickup.baseY + bobOffset);
      pickup.shadow.setPosition(pickup.x + 3, pickup.baseY + 11);

      if (timeLeft <= pickup.blinkStartSecondsRemaining) {
        pickup.setAlpha(Math.sin(this.time.now / 65) > 0 ? 1 : 0.25);
      } else {
        pickup.setAlpha(1);
      }
    });
  }

  updateUi() {
    const wave = this.session.currentWave;
    if (!wave) {
      return;
    }

    this.heroUiText.setText(
      [
        `HP: ${this.player.healthPoints}/${this.player.maxHealth}`,
        `LV: ${this.session.heroLevel}   XP: ${this.session.heroXp}/${this.session.nextLevelXp}`,
        `Kills: ${this.kills}`,
        `Bosses: ${this.bossesSpawned}`,
      ].join("\n")
    );

    this.waveCounterText.setText(`Wave ${wave.waveNumber} | ${Math.max(0, Math.ceil(this.waveRemainingSeconds))}s`);
  }

  fireHeroShotgun(pointer) {
    const shotgun = this.getHeroShotgunProfile();
    if (this.time.now - this.lastHeroShotAt < shotgun.cooldownMs) {
      return;
    }

    this.lastHeroShotAt = this.time.now;
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const duration = Math.round((shotgun.range / shotgun.projectileSpeed) * 1000);

    for (let i = 0; i < shotgun.pellets; i += 1) {
      const t = shotgun.pellets === 1 ? 0.5 : i / (shotgun.pellets - 1);
      const angle = baseAngle + Phaser.Math.Linear(-shotgun.spreadRadians, shotgun.spreadRadians, t);
      const pellet = this.add
        .image(this.player.x + Math.cos(angle) * 24, this.player.y + Math.sin(angle) * 24, "pellet")
        .setDepth(6);
      this.heroProjectiles.add(pellet);
      this.tweens.add({
        targets: pellet,
        x: this.player.x + Math.cos(angle) * shotgun.range,
        y: this.player.y + Math.sin(angle) * shotgun.range,
        alpha: 0.15,
        duration,
        ease: "Linear",
        onComplete: () => pellet.destroy(),
      });
      this.applyPelletDamage(angle, shotgun.range, shotgun.damagePerPellet);
    }

    this.showMuzzleFlash(baseAngle);
    this.cameras.main.shake(60, 0.0025);
  }

  getHeroShotgunProfile() {
    const runtimeShotgun = gameConfig.runtime.hero.shotgun;
    const shotgunStacks = this.hero.parameterStacks.shotgunWeapon ?? 0;
    const reloadStacks = this.hero.parameterStacks.reload ?? 0;
    return {
      pellets: runtimeShotgun.pellets,
      damagePerPellet:
        runtimeShotgun.damagePerPellet +
        shotgunStacks * gameConfig.parameters.shotgunWeapon.damageBonus,
      spreadRadians: runtimeShotgun.spreadRadians,
      range:
        runtimeShotgun.range +
        shotgunStacks * gameConfig.parameters.shotgunWeapon.radiusBonus,
      cooldownMs: Math.max(
        80,
        runtimeShotgun.cooldownMs - reloadStacks * gameConfig.parameters.reload.cooldownReductionSeconds * 1000
      ),
      projectileSpeed:
        runtimeShotgun.projectileSpeed +
        shotgunStacks * gameConfig.parameters.shotgunWeapon.projectileSpeedBonus,
    };
  }

  applyPelletDamage(angle, range, damage) {
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }
      if (!this.isTargetInsideShot(enemy, angle, range, 18)) {
        return;
      }

      const inflictedDamage = Math.max(1, damage - (enemy.armorValue ?? 0));
      const died = enemy.takeDamage(inflictedDamage);
      if (died) {
        this.kills += 1;
      }
    });
  }

  isTargetInsideShot(target, angle, range, hitRadius) {
    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * range;
    const endY = startY + Math.sin(angle) * range;
    const dx = endX - startX;
    const dy = endY - startY;
    const lengthSq = dx * dx + dy * dy;
    const t = Phaser.Math.Clamp(((target.x - startX) * dx + (target.y - startY) * dy) / lengthSq, 0, 1);
    const nearestX = startX + dx * t;
    const nearestY = startY + dy * t;
    return Phaser.Math.Distance.Between(nearestX, nearestY, target.x, target.y) <= hitRadius;
  }

  handleEnemyTouch(player, enemy) {
    if (this.isGameplayPaused) {
      return;
    }
    if (!enemy.active || !enemy.canMove) {
      return;
    }
    if (!enemy.canAttack(this.time.now)) {
      return;
    }

    enemy.recordAttack(this.time.now);
    player.healthPoints = Math.max(0, player.healthPoints - gameConfig.runtime.enemy.attackDamage);
    this.cameras.main.shake(80, 0.003);

    if (player.healthPoints <= 0) {
      this.scene.start("ResultScene", {
        kills: this.kills,
        survivedSeconds: Math.floor(this.time.now / 1000),
        bossesSpawned: this.bossesSpawned,
      });
    }
  }

  handlePickupCollect(player, pickup) {
    if (!pickup.active || this.isGameplayPaused) {
      return;
    }

    if (pickup.pickupData.type === "medkit") {
      const healAmount = Math.max(1, Math.round(player.maxHealth * pickup.value));
      player.healthPoints = Math.min(player.maxHealth, player.healthPoints + healAmount);
    }

    if (pickup.pickupData.type === "xp_star") {
      const leveledUp = this.session.addHeroXp(pickup.value);
      if (leveledUp) {
        this.showLevelUpChoices();
      }
    }

    this.destroyPickup(pickup);
  }

  beginNextWave() {
    const nextWave = this.waveSystem.createNextWave(this.session.waveNumber);
    this.spawnProfile = this.spawnSystem.getWaveSpawnProfile(nextWave);
    this.waveRemainingSeconds = nextWave.durationSeconds;
    this.showWaveBanner(nextWave.waveTitle);
    this.startWaveSpawner();
  }

  tickWaveTimer() {
    if (!this.session.currentWave) {
      return;
    }

    this.waveRemainingSeconds -= this.game.loop.delta / 1000;
    if (this.waveRemainingSeconds > 0) {
      return;
    }

    this.spawnBossForCurrentWave();
    this.beginNextWave();
  }

  startWaveSpawner() {
    if (this.waveSpawnEvent) {
      this.waveSpawnEvent.remove(false);
    }

    this.waveSpawnEvent = this.time.addEvent({
      delay: this.session.currentWave.spawnIntervalSeconds * 1000,
      loop: true,
      callback: () => this.spawnRegularEnemy(),
    });
  }

  spawnRegularEnemy() {
    const descriptor = this.session.currentWave.descriptor;
    const point = this.getOffscreenSpawnPoint();
    this.spawnEnemyActor(descriptor, point.x, point.y, false);
  }

  spawnBossForCurrentWave() {
    const descriptor = this.session.currentBoss;
    const point = this.getNearHeroSpawnPoint();
    this.spawnEnemyActor(descriptor, point.x, point.y, true);
    this.bossesSpawned += 1;
  }

  spawnEnemyActor(descriptor, x, y, emerge) {
    const options = {
      isBoss: descriptor.isBoss,
      isFast: descriptor.stats.moveSpeed > gameConfig.enemy.baseStats.moveSpeed,
      maxHealth: descriptor.stats.health,
      moveSpeed: descriptor.stats.moveSpeed * 12,
      aggroRadius: gameConfig.runtime.enemy.defaultAggroRadius,
      attackCooldownMs: descriptor.stats.attackCooldownSeconds * 1000,
      tint: this.resolveEnemyTint(descriptor),
      dropType: descriptor.isBoss ? "boss_burst" : "rolled_loot",
    };

    const enemy = new Zombie(this, x, y, options);
    enemy.descriptor = descriptor;
    enemy.armorValue = descriptor.stats.armor;
    enemy.setTexture(this.resolveEnemyTexture(descriptor.visuals.shape));
    this.enemies.add(enemy);

    if (emerge) {
      enemy.emergeFromGround(descriptor.isBoss ? 700 : 420);
    }
  }

  resolveEnemyTexture(shape) {
    const map = {
      circle: "enemy-circle",
      oval: "enemy-oval",
      triangle: "enemy-triangle",
      square: "enemy-square",
    };
    return map[shape] ?? "enemy-circle";
  }

  resolveEnemyTint(descriptor) {
    if (descriptor.isBoss) {
      return 0xc84a42;
    }
    if (descriptor.parameterStacks.armor) {
      return 0x86a7bc;
    }
    if (descriptor.parameterStacks.vitality) {
      return 0x8c7b58;
    }
    return 0x7fb36b;
  }

  getOffscreenSpawnPoint() {
    const padding = gameConfig.runtime.enemy.offscreenSpawnPadding;
    const bounds = this.cameras.main.worldView;
    const side = Phaser.Math.Between(0, 3);

    if (side === 0) {
      return { x: bounds.left - padding, y: Phaser.Math.Between(bounds.top, bounds.bottom) };
    }
    if (side === 1) {
      return { x: bounds.right + padding, y: Phaser.Math.Between(bounds.top, bounds.bottom) };
    }
    if (side === 2) {
      return { x: Phaser.Math.Between(bounds.left, bounds.right), y: bounds.top - padding };
    }

    return { x: Phaser.Math.Between(bounds.left, bounds.right), y: bounds.bottom + padding };
  }

  getNearHeroSpawnPoint() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(
      gameConfig.runtime.enemy.bossSpawnMinDistance,
      gameConfig.runtime.enemy.bossSpawnMaxDistance
    );

    return {
      x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 80, gameConfig.runtime.world.width - 80),
      y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 80, gameConfig.runtime.world.height - 80),
    };
  }

  showWaveBanner(text) {
    this.waveBannerText.setText(text);
    this.waveBannerText.setAlpha(1);
    this.tweens.killTweensOf(this.waveBannerText);
    this.tweens.add({
      targets: this.waveBannerText,
      alpha: 0,
      delay: gameConfig.runtime.ui.waveBannerDurationMs,
      duration: 500,
    });
  }

  showMuzzleFlash(angle) {
    const flash = this.add.graphics();
    const x = this.player.x + Math.cos(angle) * 46;
    const y = this.player.y + Math.sin(angle) * 46;
    flash.fillStyle(0xffd36a, 0.95);
    flash.fillTriangle(
      x,
      y,
      x + Math.cos(angle + 0.34) * 30,
      y + Math.sin(angle + 0.34) * 30,
      x + Math.cos(angle - 0.34) * 30,
      y + Math.sin(angle - 0.34) * 30
    );
    this.time.delayedCall(70, () => flash.destroy());
  }

  spawnZombieDrop(x, y, dropType) {
    if (dropType === "boss_burst") {
      const pickups = this.lootSystem.createBossXpBurst(this.session.waveNumber);
      pickups.forEach((pickupData) => {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(12, gameConfig.enemy.drops.bossStarScatterRadius);
        this.createPickupActor(pickupData, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
      });
      return;
    }

    if (Math.random() < gameConfig.enemy.drops.medkitChance) {
      this.createPickupActor(this.lootSystem.createMedkitPickup(), x, y);
    }
    if (Math.random() < gameConfig.enemy.drops.xpStarChance) {
      this.createPickupActor(
        this.lootSystem.createXpPickup(),
        x + Phaser.Math.Between(-18, 18),
        y + Phaser.Math.Between(-18, 18)
      );
    }
  }

  createPickupActor(pickupData, x, y) {
    const texture = pickupData.type === "medkit" ? "medkit-pickup" : "xp-star";
    const pickup = this.physics.add.sprite(x, y, texture);
    pickup.body.allowGravity = false;
    pickup.body.setImmovable(true);
    pickup.setDepth(5);
    pickup.pickupData = pickupData;
    pickup.value = pickupData.value;
    pickup.lifetimeSeconds = pickupData.lifetimeSeconds;
    pickup.blinkStartSecondsRemaining = pickupData.blinkStartSecondsRemaining;
    pickup.spawnedAt = this.time.now;
    pickup.baseY = y;
    pickup.floatOffset = Phaser.Math.Between(0, 600);
    pickup.shadow = this.add.ellipse(x + 3, y + 11, 24, 10, 0x000000, 0.18).setDepth(4);
    if (pickupData.type === "xp_star") {
      pickup.setScale(0.9);
    }
    this.pickups.add(pickup);
    return pickup;
  }

  destroyPickup(pickup) {
    if (pickup.shadow) {
      pickup.shadow.destroy();
      pickup.shadow = null;
    }
    pickup.destroy();
  }

  showLevelUpChoices() {
    this.currentUpgradeCards = this.progressionSystem.createUpgradeOffer();
    this.levelCardViews.forEach((view, index) => {
      const card = this.currentUpgradeCards[index];
      view.title.setText(card?.title ?? "");
      view.description.setText(card?.description ?? "");
      view.buttonHint.setText(card ? "Pick" : "");
      view.container.setVisible(Boolean(card));
      view.container.setScale(1);
    });
    this.levelUpOverlay.setVisible(true);
    this.setGameplayPaused(true);
  }

  selectUpgradeCard(index) {
    if (!this.currentUpgradeCards || !this.currentUpgradeCards[index]) {
      return;
    }

    const previousMaxHealth = this.player.maxHealth;
    this.hero.applyUpgrade(this.currentUpgradeCards[index].key, (stacks) => this.resolveHeroProgression(stacks));
    this.player.maxHealth = this.hero.stats.health;
    if (this.player.maxHealth > previousMaxHealth) {
      this.player.healthPoints += this.player.maxHealth - previousMaxHealth;
    }
    this.player.healthPoints = Math.min(this.player.healthPoints, this.player.maxHealth);
    this.currentUpgradeCards = null;
    this.levelUpOverlay.setVisible(false);
    this.setGameplayPaused(false);
  }

  resolveHeroProgression(parameterStacks) {
    const stats = {
      health:
        gameConfig.hero.base.health +
        (parameterStacks.vitality ?? 0) * gameConfig.parameters.vitality.healthBonus,
      moveSpeed:
        gameConfig.hero.base.moveSpeed +
        (parameterStacks.speed ?? 0) * gameConfig.parameters.speed.moveSpeedBonus,
    };

    return {
      stats,
      weaponProfiles: this.weaponSystem.buildWeaponProfiles(parameterStacks),
    };
  }

  setGameplayPaused(isPaused) {
    this.isGameplayPaused = isPaused;

    if (isPaused) {
      this.physics.world.pause();
      if (this.waveSpawnEvent) {
        this.waveSpawnEvent.paused = true;
      }
      this.enemies.getChildren().forEach((enemy) => {
        if (enemy.active) {
          enemy.setVelocity(0, 0);
        }
      });
      return;
    }

    this.physics.world.resume();
    if (this.waveSpawnEvent) {
      this.waveSpawnEvent.paused = false;
    }
  }
}
