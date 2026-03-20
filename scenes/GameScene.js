import { gameConfig } from "../src/config/gameConfig.js";
import { EventBus } from "../src/core/EventBus.js";
import { GameSession } from "../src/core/GameSession.js";
import { Hero } from "../src/entities/Hero.js";
import { EnemyActor } from "../src/entities/EnemyActor.js";
import { EnemyFactory } from "../src/systems/EnemyFactory.js";
import { CombatSystem } from "../src/systems/CombatSystem.js";
import { HeroBuildSystem } from "../src/systems/HeroBuildSystem.js";
import { LootSystem } from "../src/systems/LootSystem.js";
import { PickupSystem } from "../src/systems/PickupSystem.js";
import { PresentationSystem } from "../src/systems/PresentationSystem.js";
import { ProgressionSystem } from "../src/systems/ProgressionSystem.js";
import { SpawnSystem } from "../src/systems/SpawnSystem.js";
import { UiSystem } from "../src/systems/UiSystem.js";
import { WaveSystem } from "../src/systems/WaveSystem.js";
import { WeaponSystem } from "../src/systems/WeaponSystem.js";

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
    this.heroBuildSystem = new HeroBuildSystem(gameConfig, this.weaponSystem);
    this.presentationSystem = new PresentationSystem(gameConfig);
    this.enemyFactory = new EnemyFactory(gameConfig, this.weaponSystem, this.presentationSystem);
    this.waveSystem = new WaveSystem(gameConfig, this.eventBus, this.enemyFactory);
    this.spawnSystem = new SpawnSystem(gameConfig);
    this.combatSystem = new CombatSystem(gameConfig);
    this.lootSystem = new LootSystem(gameConfig);
    this.pickupSystem = new PickupSystem(gameConfig, this.lootSystem);
    this.progressionSystem = new ProgressionSystem(gameConfig);
    this.uiSystem = new UiSystem(this, gameConfig);
    const initialHeroState = this.heroBuildSystem.resolveHeroProgression(this.hero.parameterStacks);
    this.hero.stats = initialHeroState.stats;
    this.hero.weaponProfiles = initialHeroState.weaponProfiles;

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
    this.lastHeroPistolAt = -300;
    this.lastHeroMeleeAt = -600;
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
    this.enemies = this.physics.add.group({ runChildUpdate: true });
    this.pickups = this.physics.add.group({ runChildUpdate: true });
  }

  createHeroSprite() {
    const heroConfig = gameConfig.runtime.hero;
    this.player = this.physics.add.sprite(heroConfig.spawnX, heroConfig.spawnY, "player-body");
    this.player.setCircle(heroConfig.bodyRadius, 4, 4);
    this.player.setCollideWorldBounds(true);
    this.player.healthPoints = gameConfig.hero.base.health;
    this.player.maxHealth = gameConfig.hero.base.health;

    this.playerShadow = this.add.ellipse(this.player.x + 8, this.player.y + 24, 48, 18, 0x000000, 0.24);
    this.playerWeaponSprite = this.add.image(this.player.x, this.player.y, "shotgun-icon").setDepth(8.5);
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
    this.uiSystem.createHud();
    this.uiSystem.createLevelUpOverlay((index) => this.selectUpgradeCard(index));
    this.uiSystem.createPauseOverlay({
      onContinue: () => this.closePauseMenu(),
      onRestart: () => this.scene.start("GameScene"),
      onExit: () => this.scene.start("StartScene"),
    });
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys("W,A,S,D");
    this.input.keyboard.on("keydown-ESC", () => this.handleEscapePressed());
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
    this.updateHeroCombat();
    this.updateEnemyCombat();
    this.tickWaveTimer();
  }

  updateHeroCombat() {
    this.combatSystem.updateHeroAttacks(this);
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
    const offset = 22;
    this.playerWeaponSprite.setPosition(
      this.player.x + Math.cos(angle) * offset,
      this.player.y + Math.sin(angle) * offset * 0.7
    );
    this.playerWeaponSprite.setRotation(angle);
    this.playerWeaponSprite.setTexture(this.resolveHeroWeaponTexture());
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
    this.pickupSystem.updateActors(this.time.now, this.pickups, (pickup) => this.destroyPickup(pickup));
  }

  updateUi() {
    const wave = this.session.currentWave;
    if (!wave) {
      return;
    }

    this.uiSystem.updateHud(
      this.presentationSystem.formatHeroHud(this.player, this.session, this.kills, this.bossesSpawned),
      this.presentationSystem.formatWaveCounter(wave.waveNumber, this.waveRemainingSeconds),
      this.presentationSystem.formatWaveTitle(wave.waveTitle)
    );
  }

  updateEnemyCombat() {
    const projectileKill = this.combatSystem.updateEnemyProjectiles(this);
    if (projectileKill) {
      this.handleHeroDeath();
      return;
    }

    const attackKill = this.combatSystem.updateEnemyAttacks(this);
    if (attackKill) {
      this.handleHeroDeath();
    }
  }

  handleEnemyTouch(player, enemy) {
    const heroDied = this.combatSystem.handleEnemyTouch(this, player, enemy);
    if (heroDied) {
      this.handleHeroDeath();
    }
  }

  handlePickupCollect(player, pickup) {
    const result = this.pickupSystem.collect(this, player, pickup, this.session);
    if (result.leveledUp) {
      this.showLevelUpChoices();
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
    const point = this.spawnSystem.getOffscreenSpawnPoint(this.cameras.main.worldView);
    this.spawnEnemyActor(descriptor, point.x, point.y, false);
  }

  spawnBossForCurrentWave() {
    const descriptor = this.session.currentBoss;
    const point = this.spawnSystem.getNearHeroSpawnPoint(this.player, gameConfig.runtime.world);
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
      tint: descriptor.visuals.bodyTint,
      outlineTint: descriptor.visuals.outlineTint,
      weaponVfxTint: descriptor.visuals.weaponVfxTint,
      weaponTexture: this.resolveWeaponTexture(descriptor.visuals.weaponId),
      dropType: descriptor.isBoss ? "boss_burst" : "rolled_loot",
    };

    const enemy = new EnemyActor(this, x, y, this.resolveEnemyTexture(descriptor.visuals.shape), {
      ...options,
      descriptor,
      armorValue: descriptor.stats.armor,
      scale: descriptor.isBoss ? 1.35 : 1,
      onDeath: (deadEnemy, deathPosition) => this.handleEnemyDeath(deadEnemy, deathPosition),
    });
    if (options.tint) {
      enemy.setTint(options.tint);
    }
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

  showWaveBanner(text) {
    this.uiSystem.updateHud(
      this.presentationSystem.formatHeroHud(this.player, this.session, this.kills, this.bossesSpawned),
      this.presentationSystem.formatWaveCounter(this.session.currentWave.waveNumber, this.waveRemainingSeconds),
      this.presentationSystem.formatWaveTitle(text)
    );
    this.uiSystem.animateWaveTitle();
  }

  handleEnemyDeath(enemy, deathPosition) {
    this.pickupSystem.spawnDrop(
      this,
      this.pickups,
      this.session.waveNumber,
      deathPosition.x,
      deathPosition.y,
      enemy.isBoss ? "boss_burst" : "rolled_loot"
    );
  }

  destroyPickup(pickup) {
    pickup.destroy();
  }

  handleHeroDeath() {
    this.scene.start("ResultScene", {
      kills: this.kills,
      survivedSeconds: Math.floor(this.time.now / 1000),
      bossesSpawned: this.bossesSpawned,
    });
  }

  showLevelUpChoices() {
    this.currentUpgradeCards = this.progressionSystem.createUpgradeOffer();
    this.uiSystem.showLevelUpCards(this.currentUpgradeCards);
    this.setGameplayPaused(true, "level_up");
  }

  selectUpgradeCard(index) {
    if (!this.currentUpgradeCards || !this.currentUpgradeCards[index]) {
      return;
    }

    const previousMaxHealth = this.player.maxHealth;
    this.heroBuildSystem.applyUpgrade(this.hero, this.currentUpgradeCards[index].key);
    this.player.maxHealth = this.hero.stats.health;
    if (this.player.maxHealth > previousMaxHealth) {
      this.player.healthPoints += this.player.maxHealth - previousMaxHealth;
    }
    this.player.healthPoints = Math.min(this.player.healthPoints, this.player.maxHealth);
    this.currentUpgradeCards = null;
    this.uiSystem.hideLevelUpCards();
    this.setGameplayPaused(false, null);
  }

  setGameplayPaused(isPaused, reason) {
    this.isGameplayPaused = isPaused;
    if (isPaused) {
      this.session.setPauseReason(reason ?? "gameplay");
    } else {
      this.session.clearPauseReason();
    }

    if (isPaused) {
      this.physics.world.pause();
      this.tweens.pauseAll();
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
    this.tweens.resumeAll();
    if (this.waveSpawnEvent) {
      this.waveSpawnEvent.paused = false;
    }
  }

  handleEscapePressed() {
    if (this.session.pauseReason === "level_up") {
      return;
    }
    if (this.session.pauseReason === "pause_menu") {
      this.closePauseMenu();
      return;
    }
    this.openPauseMenu();
  }

  openPauseMenu() {
    this.uiSystem.showPauseMenu();
    this.setGameplayPaused(true, "pause_menu");
  }

  closePauseMenu() {
    this.uiSystem.hidePauseMenu();
    this.setGameplayPaused(false, null);
  }

  resolveWeaponTexture(weaponId) {
    const map = {
      melee: "melee-icon",
      pistol: "pistol-icon",
      shotgun: "shotgun-icon",
      grenade: "grenade-icon",
    };
    return map[weaponId] ?? "shotgun-icon";
  }

  resolveHeroWeaponTexture() {
    return "shotgun-icon";
  }
}
