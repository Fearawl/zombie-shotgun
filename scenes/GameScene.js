import { AmmoPickup } from "../src/entities/AmmoPickup.js";
import { Zombie } from "../src/entities/Zombie.js";

const PLAYER_SPEED = 250;
const PLAYER_MAX_HEALTH = 10;
const CLIP_SIZE = 6;
const STARTING_RESERVE_AMMO = 10;
const SHOT_DAMAGE = 5;
const SHOT_COOLDOWN_MS = 280;
const SHOT_PELLET_COUNT = 8;
const SHOT_SPREAD = 0.34;
const ZOMBIE_COUNT = 18;
const DEFAULT_ZOMBIE_SPAWN_INTERVAL_MS = 1000;
const ZOMBIE_SPAWN_MIN_RADIUS = 220;
const ZOMBIE_SPAWN_MAX_RADIUS = 360;
const DEFAULT_BOSS_SPAWN_INTERVAL_MS = 20000;
const BOSS_HEALTH = 100;
const PELLET_HIT_RADIUS = 22;
const DEFAULT_AGGRO_RADIUS = Math.round(960 * 0.3);
const PLAYER_HIT_RADIUS = 34;
const ZOMBIE_ATTACK_DAMAGE = 5;
const ZOMBIE_ATTACK_COOLDOWN_MS = 2000;
const ZOMBIE_SPEED_BOOST_PER_BOSS = 1.2;
const RANGE_PRESETS = [
  { label: "Short", screenRatio: 0.22, color: 0xa0d8ff },
  { label: "Medium", screenRatio: 0.3, color: 0xf3d57d },
  { label: "Long", screenRatio: 0.38, color: 0xffa970 },
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.kills = 0;
    this.lastShotAt = 0;
    this.isRoundFinished = false;
    this.rangePresetIndex = 1;
    this.bossesSpawned = 0;
    this.isPaused = false;
    this.isDevConsoleOpen = false;
    this.isPauseMenuOpen = false;
  }

  create() {
    this.kills = 0;
    this.isRoundFinished = false;
    this.lastShotAt = -SHOT_COOLDOWN_MS;
    this.rangePresetIndex = 1;
    this.bossesSpawned = 0;
    this.roundStartedAt = this.time.now;
    this.settings = {
      zombieSpawnIntervalMs: DEFAULT_ZOMBIE_SPAWN_INTERVAL_MS,
      aggroRadius: DEFAULT_AGGRO_RADIUS,
      bossSpawnIntervalMs: DEFAULT_BOSS_SPAWN_INTERVAL_MS,
    };
    this.zombieSpeedMultiplier = 1;

    this.physics.world.setBounds(0, 0, 2200, 1600);
    this.cameras.main.setBackgroundColor("#17261b");

    this.drawArena();
    this.createGroups();
    this.createPlayer();
    this.createPickups();
    this.createZombies();
    this.createUi();
    this.createPauseButton();
    this.createDevConsole();
    this.createPauseMenu();
    this.setupCamera();
    this.setupInput();
    this.setupCollisions();
    this.setupSpawnTimers();
  }

  createGroups() {
    this.pellets = this.add.group();
    this.zombies = this.physics.add.group({
      classType: Zombie,
      runChildUpdate: true,
    });
    this.pickups = this.physics.add.group({
      classType: AmmoPickup,
      runChildUpdate: false,
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(360, 300, "player-body");
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(18, 4, 4);
    this.player.facingAngle = 0;
    this.player.healthPoints = PLAYER_MAX_HEALTH;
    this.player.clipAmmo = CLIP_SIZE;
    this.player.reserveAmmo = STARTING_RESERVE_AMMO - CLIP_SIZE;

    this.playerShadow = this.add.ellipse(this.player.x + 6, this.player.y + 24, 44, 18, 0x000000, 0.24);
    this.shotRangeGraphics = this.add.graphics().setDepth(1);
    this.playerGun = this.add.graphics();
  }

  createPickups() {
    const positions = [
      [520, 340],
      [600, 420],
      [470, 500],
    ];

    positions.forEach(([x, y]) => {
      const pickup = new AmmoPickup(this, x, y, { ammoAmount: 10 });
      this.pickups.add(pickup);
    });
  }

  createZombies() {
    const points = [
      [820, 400],
      [1040, 540],
      [1240, 760],
      [880, 860],
      [1420, 520],
      [1540, 900],
      [1680, 610],
      [1320, 1120],
      [980, 1180],
      [640, 980],
      [1710, 1180],
      [1880, 760],
    ];

    for (let i = 0; i < ZOMBIE_COUNT; i += 1) {
      const [x, y] = points[i % points.length];
      const offsetX = Math.floor(i / points.length) * 58;
      const offsetY = (i % 2 === 0 ? 1 : -1) * Math.floor(i / points.length) * 44;
      this.spawnZombie(x + offsetX, y + offsetY, { emerge: false });
    }
  }

  createUi() {
    this.ui = this.add.container(18, 18).setScrollFactor(0).setDepth(20);

    const panel = this.add.graphics();
    panel.fillStyle(0x09131a, 0.85);
    panel.lineStyle(2, 0x305164, 1);
    panel.fillRoundedRect(0, 0, 340, 186, 16);
    panel.strokeRoundedRect(0, 0, 340, 186, 16);
    this.ui.add(panel);

    this.healthText = this.add.text(20, 16, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#ffb2b2",
    });
    this.ammoText = this.add.text(20, 46, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#fce7b4",
    });
    this.killsText = this.add.text(20, 76, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#b9f0c4",
    });
    this.bossText = this.add.text(20, 106, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#ff9f7c",
    });
    this.rangeText = this.add.text(20, 136, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "18px",
      color: "#f2cfa4",
    });
    this.reloadText = this.add.text(20, 160, "Reload: R", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "16px",
      color: "#9fc2d7",
    });

    this.ui.add([
      this.healthText,
      this.ammoText,
      this.killsText,
      this.bossText,
      this.rangeText,
      this.reloadText,
    ]);
    this.updateUi();
  }

  createPauseButton() {
    const x = 18;
    const y = this.scale.height - 64;
    const button = this.add.container(x, y).setScrollFactor(0).setDepth(21);
    const bg = this.add.graphics();
    bg.fillStyle(0x0b1720, 0.92);
    bg.lineStyle(2, 0x38617a, 1);
    bg.fillRoundedRect(0, 0, 148, 46, 14);
    bg.strokeRoundedRect(0, 0, 148, 46, 14);
    const text = this.add.text(16, 11, "Dev Console (P)", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "16px",
      color: "#f3e7bf",
    });
    const hit = this.add.zone(0, 0, 148, 46).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.on("pointerdown", () => this.toggleDevConsole());
    button.add([bg, text, hit]);
    this.devConsoleButton = button;
  }

  createDevConsole() {
    const panelWidth = 340;
    const panelHeight = 220;
    const x = 18;
    const y = this.scale.height - panelHeight - 18;

    this.settingsUi = this.add.container(x, y).setScrollFactor(0).setDepth(30).setVisible(false);

    const panel = this.add.graphics();
    panel.fillStyle(0x081018, 0.88);
    panel.lineStyle(2, 0x36596e, 1);
    panel.fillRoundedRect(0, 0, panelWidth, panelHeight, 16);
    panel.strokeRoundedRect(0, 0, panelWidth, panelHeight, 16);
    this.settingsUi.add(panel);

    const title = this.add.text(18, 12, "Developer Console", {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "18px",
      color: "#f0ead2",
    });
    this.settingsUi.add(title);

    const hint = this.add.text(18, 34, "P or click button to open/close", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "13px",
      color: "#92afc2",
    });
    this.settingsUi.add(hint);

    this.settingsSliders = [
      this.createSliderControl({
        parent: this.settingsUi,
        x: 18,
        y: 66,
        width: 286,
        label: "Zombie Spawn",
        min: 0.5,
        max: 3,
        step: 0.1,
        initial: this.settings.zombieSpawnIntervalMs / 1000,
        formatValue: (value) => `${value.toFixed(1)}s`,
        onChange: (value) => this.updateZombieSpawnInterval(value * 1000),
      }),
      this.createSliderControl({
        parent: this.settingsUi,
        x: 18,
        y: 118,
        width: 286,
        label: "Aggro Radius",
        min: 120,
        max: 520,
        step: 10,
        initial: this.settings.aggroRadius,
        formatValue: (value) => `${Math.round(value)}`,
        onChange: (value) => this.updateAggroRadius(value),
      }),
      this.createSliderControl({
        parent: this.settingsUi,
        x: 18,
        y: 170,
        width: 286,
        label: "Boss Timer",
        min: 10,
        max: 90,
        step: 1,
        initial: this.settings.bossSpawnIntervalMs / 1000,
        formatValue: (value) => `${Math.round(value)}s`,
        onChange: (value) => this.updateBossSpawnInterval(value * 1000),
      }),
    ];
  }

  createPauseMenu() {
    const { width, height } = this.scale;
    this.pauseOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(40).setVisible(false);

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.55);
    dim.fillRect(0, 0, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0x081018, 0.94);
    panel.lineStyle(2, 0x44697d, 1);
    panel.fillRoundedRect(width / 2 - 170, height / 2 - 130, 340, 260, 18);
    panel.strokeRoundedRect(width / 2 - 170, height / 2 - 130, 340, 260, 18);

    const title = this.add.text(width / 2, height / 2 - 82, "Paused", {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "34px",
      color: "#f8efd7",
    }).setOrigin(0.5);

    const continueButton = this.createOverlayButton(width / 2, height / 2 - 12, 220, 52, "CONTINUE", () => {
      this.closePauseMenu();
    });
    const restartButton = this.createOverlayButton(width / 2, height / 2 + 52, 220, 52, "RESTART", () => {
      this.scene.start("GameScene");
    });
    const exitButton = this.createOverlayButton(width / 2, height / 2 + 116, 220, 52, "EXIT", () => {
      this.scene.start("StartScene");
    });

    this.pauseOverlay.add([dim, panel, title, continueButton, restartButton, exitButton]);
  }

  createOverlayButton(x, y, width, height, label, onClick) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xd8612f, 1);
    bg.lineStyle(3, 0x4f1a08, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "22px",
      color: "#fff5dd",
    }).setOrigin(0.5);
    const hit = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => container.setScale(1.03));
    hit.on("pointerout", () => container.setScale(1));
    hit.on("pointerdown", () => container.setScale(0.98));
    hit.on("pointerup", () => {
      container.setScale(1.03);
      onClick();
    });
    container.add([bg, text, hit]);
    return container;
  }

  createSliderControl({ parent, x, y, width, label, min, max, step, initial, formatValue, onChange }) {
    const labelText = this.add.text(x, y, label, {
      fontFamily: "Verdana, sans-serif",
      fontSize: "15px",
      color: "#c6d9e5",
    });
    const valueText = this.add.text(x + width + 8, y, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "15px",
      color: "#ffd791",
    });
    const track = this.add.graphics();
    const fill = this.add.graphics();
    const knob = this.add.circle(0, 0, 8, 0xffc26b).setStrokeStyle(2, 0x5b3715);
    knob.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(knob);

    const slider = {
      min,
      max,
      step,
      value: initial,
      x,
      y,
      width,
      track,
      fill,
      knob,
      valueText,
      formatValue,
      onChange,
    };

    const updateVisuals = () => {
      const progress = (slider.value - min) / (max - min);
      const knobX = x + progress * width;
      const trackY = y + 24;

      track.clear();
      track.fillStyle(0x1c2b36, 1);
      track.fillRoundedRect(x, trackY, width, 8, 4);

      fill.clear();
      fill.fillStyle(0xd06f3e, 1);
      fill.fillRoundedRect(x, trackY, Math.max(8, progress * width), 8, 4);

      knob.setPosition(knobX, trackY + 4);
      valueText.setText(formatValue(slider.value)).setPosition(x + width + 8, y);
    };

    const setValueFromPointer = (pointerX) => {
      const progress = Phaser.Math.Clamp((pointerX - x) / width, 0, 1);
      const rawValue = min + progress * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      slider.value = Phaser.Math.Clamp(steppedValue, min, max);
      updateVisuals();
      onChange(slider.value);
    };

    knob.on("drag", (pointer, dragX) => {
      setValueFromPointer(dragX);
    });

    const hitArea = this.add.zone(x, y + 16, width, 24).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hitArea.on("pointerdown", (pointer) => {
      setValueFromPointer(pointer.x);
    });

    updateVisuals();

    parent.add([labelText, valueText, track, fill, hitArea, knob]);
    return slider;
  }

  setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 2200, 1600);
    this.cameras.main.setZoom(1.05);
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys("W,A,S,D,R,P,ESC");
    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }
    this.game.canvas.oncontextmenu = (event) => event.preventDefault();
    this.input.on("pointerdown", (pointer) => {
      if (this.isPaused) {
        return;
      }
      if (pointer.leftButtonDown()) {
        this.tryShoot(pointer);
        return;
      }

      if (pointer.rightButtonDown()) {
        this.cycleShotRange();
      }
    });
    this.input.keyboard.on("keydown-R", () => this.reloadWeapon());
    this.input.keyboard.on("keydown-P", () => this.toggleDevConsole());
    this.input.keyboard.on("keydown-ESC", () => this.togglePauseMenu());
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.pickups, this.handlePickup, undefined, this);
    this.physics.add.overlap(this.player, this.zombies, this.handleZombieAttack, undefined, this);
  }

  setupSpawnTimers() {
    this.spawnTimer = this.time.addEvent({
      delay: this.settings.zombieSpawnIntervalMs,
      loop: true,
      callback: () => {
        if (!this.isRoundFinished) {
          this.spawnZombieNearPlayer(false);
        }
      },
    });

    this.bossTimer = this.time.addEvent({
      delay: this.settings.bossSpawnIntervalMs,
      loop: true,
      callback: () => {
        if (!this.isRoundFinished) {
          this.spawnZombieNearPlayer(true);
          this.bossesSpawned += 1;
        }
      },
    });
  }

  update() {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    this.updatePlayerMovement();
    this.updateAim();
    this.updatePlayerVisuals();
    this.updateShotRangeIndicator();
    this.updateUi();
  }

  updatePlayerMovement() {
    let moveX = 0;
    let moveY = 0;

    if (this.keys.A.isDown) {
      moveX -= 1;
    }
    if (this.keys.D.isDown) {
      moveX += 1;
    }
    if (this.keys.W.isDown) {
      moveY -= 1;
    }
    if (this.keys.S.isDown) {
      moveY += 1;
    }

    const direction = new Phaser.Math.Vector2(moveX, moveY);
    if (direction.lengthSq() > 0) {
      direction.normalize().scale(PLAYER_SPEED);
    }

    this.player.setVelocity(direction.x, direction.y);
  }

  updateAim() {
    const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
    this.player.facingAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      worldPoint.x,
      worldPoint.y
    );
  }

  updatePlayerVisuals() {
    this.playerShadow.setPosition(this.player.x + 8, this.player.y + 22);

    const angle = this.player.facingAngle;
    const originX = this.player.x;
    const originY = this.player.y - 2;
    const barrelLength = 34;
    const gripLength = 14;
    const barrelX = originX + Math.cos(angle) * barrelLength;
    const barrelY = originY + Math.sin(angle) * barrelLength;
    const buttX = originX - Math.cos(angle) * gripLength;
    const buttY = originY - Math.sin(angle) * gripLength;
    const sideAngle = angle + Math.PI / 2;

    this.playerGun.clear();
    this.playerGun.lineStyle(8, 0x44352d, 1);
    this.playerGun.lineBetween(buttX, buttY, barrelX, barrelY);
    this.playerGun.lineStyle(4, 0x946a3a, 1);
    this.playerGun.lineBetween(
      originX + Math.cos(sideAngle) * 4,
      originY + Math.sin(sideAngle) * 4,
      barrelX + Math.cos(sideAngle) * 2,
      barrelY + Math.sin(sideAngle) * 2
    );
  }

  updateUi() {
    const bossSecondsLeft = this.bossTimer
      ? Math.max(0, Math.ceil(this.bossTimer.getRemaining() / 1000))
      : Math.ceil(this.settings.bossSpawnIntervalMs / 1000);
    this.healthText.setText(`HP: ${this.player.healthPoints}/${PLAYER_MAX_HEALTH}`);
    this.ammoText.setText(`Ammo: ${this.player.clipAmmo}/${this.player.reserveAmmo}`);
    this.killsText.setText(`Zombies down: ${this.kills}`);
    this.bossText.setText(`Boss in: ${bossSecondsLeft}s`);
    this.rangeText.setText(`Range: ${this.getCurrentRangePreset().label} (RMB)`);
  }

  tryShoot(pointer) {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.time.now - this.lastShotAt < SHOT_COOLDOWN_MS) {
      return;
    }

    if (this.player.clipAmmo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    this.lastShotAt = this.time.now;
    this.player.clipAmmo -= 1;

    const targetX = pointer.worldX;
    const targetY = pointer.worldY;
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const rangeDistance = this.getCurrentShotDistance();
    const shotLifetimeMs = Math.round((rangeDistance / 900) * 1000);

    for (let i = 0; i < SHOT_PELLET_COUNT; i += 1) {
      const t = SHOT_PELLET_COUNT === 1 ? 0.5 : i / (SHOT_PELLET_COUNT - 1);
      const angle = baseAngle + Phaser.Math.Linear(-SHOT_SPREAD, SHOT_SPREAD, t);
      const pellet = this.add.image(
        this.player.x + Math.cos(angle) * 30,
        this.player.y + Math.sin(angle) * 30,
        "pellet"
      );
      pellet.setDepth(5);
      this.pellets.add(pellet);

      this.tweens.add({
        targets: pellet,
        x: this.player.x + Math.cos(angle) * rangeDistance,
        y: this.player.y + Math.sin(angle) * rangeDistance,
        alpha: 0.1,
        duration: shotLifetimeMs,
        ease: "Linear",
        onComplete: () => pellet.destroy(),
      });
    }

    this.applyShotDamage(baseAngle, rangeDistance);
    this.showMuzzleFlash(baseAngle);
    this.cameras.main.shake(65, 0.0025);
  }

  reloadWeapon() {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.player.clipAmmo >= CLIP_SIZE || this.player.reserveAmmo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    const neededAmmo = CLIP_SIZE - this.player.clipAmmo;
    const loadedAmmo = Math.min(neededAmmo, this.player.reserveAmmo);
    this.player.clipAmmo += loadedAmmo;
    this.player.reserveAmmo -= loadedAmmo;
    this.flashUi("#a7efc5");
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

  handlePickup(player, pickup) {
    if (!pickup.active) {
      return;
    }

    player.reserveAmmo += pickup.ammoAmount;
    pickup.consume();
    this.flashUi("#f9d27b");

    if (!pickup.shouldRespawn) {
      return;
    }

    this.time.delayedCall(pickup.respawnDelayMs, () => {
      if (!pickup.scene || pickup.active) {
        return;
      }
      const respawned = new AmmoPickup(this, pickup.spawnPoint.x, pickup.spawnPoint.y, {
        ammoAmount: pickup.ammoAmount,
        respawnDelayMs: pickup.respawnDelayMs,
        shouldRespawn: pickup.shouldRespawn,
      });
      this.pickups.add(respawned);
    });
  }

  handleZombieAttack(player, zombie) {
    if (!zombie.active || !zombie.canMove) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(player.x, player.y, zombie.x, zombie.y);
    if (distance > PLAYER_HIT_RADIUS) {
      return;
    }

    if (!zombie.canAttack(this.time.now)) {
      return;
    }

    zombie.recordAttack(this.time.now);
    player.healthPoints = Math.max(0, player.healthPoints - ZOMBIE_ATTACK_DAMAGE);
    this.cameras.main.shake(90, 0.003);
    this.flashUi("#ff8b7d");

    if (player.healthPoints <= 0) {
      this.finishRound();
    }
  }

  flashUi(color) {
    const previousColors = [
      this.healthText.style.color,
      this.ammoText.style.color,
      this.killsText.style.color,
      this.bossText.style.color,
    ];

    this.healthText.setColor(color);
    this.ammoText.setColor(color);
    this.killsText.setColor(color);
    this.bossText.setColor(color);

    this.time.delayedCall(120, () => {
      this.healthText.setColor(previousColors[0]);
      this.ammoText.setColor(previousColors[1]);
      this.killsText.setColor(previousColors[2]);
      this.bossText.setColor(previousColors[3]);
    });
  }

  finishRound() {
    if (this.isRoundFinished) {
      return;
    }

    this.isRoundFinished = true;
    this.clearPauseState();
    this.player.setVelocity(0, 0);
    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
      this.spawnTimer = null;
    }
    if (this.bossTimer) {
      this.bossTimer.remove(false);
      this.bossTimer = null;
    }
    this.scene.start("ResultScene", {
      kills: this.kills,
      survivedSeconds: Math.floor((this.time.now - this.roundStartedAt) / 1000),
      bossesSpawned: this.bossesSpawned,
    });
  }

  spawnZombieAmmoDrop(x, y) {
    const pickup = new AmmoPickup(this, x, y, {
      ammoAmount: 10,
      shouldRespawn: false,
    });
    this.pickups.add(pickup);
  }

  cycleShotRange() {
    this.rangePresetIndex = (this.rangePresetIndex + 1) % RANGE_PRESETS.length;
    this.flashUi("#ffd78e");
  }

  getCurrentRangePreset() {
    return RANGE_PRESETS[this.rangePresetIndex];
  }

  getCurrentShotDistance() {
    return Math.round(this.scale.width * this.getCurrentRangePreset().screenRatio);
  }

  updateShotRangeIndicator() {
    const angle = this.player.facingAngle;
    const distance = this.getCurrentShotDistance();
    const preset = this.getCurrentRangePreset();
    const points = [];
    const segments = 12;
    const startAngle = angle - SHOT_SPREAD;
    const endAngle = angle + SHOT_SPREAD;

    this.shotRangeGraphics.clear();
    this.shotRangeGraphics.fillStyle(preset.color, 0.12);
    this.shotRangeGraphics.lineStyle(2, preset.color, 0.38);

    points.push(new Phaser.Geom.Point(this.player.x, this.player.y));
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const currentAngle = Phaser.Math.Linear(startAngle, endAngle, t);
      points.push(
        new Phaser.Geom.Point(
          this.player.x + Math.cos(currentAngle) * distance,
          this.player.y + Math.sin(currentAngle) * distance
        )
      );
    }

    this.shotRangeGraphics.beginPath();
    this.shotRangeGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      this.shotRangeGraphics.lineTo(points[i].x, points[i].y);
    }
    this.shotRangeGraphics.closePath();
    this.shotRangeGraphics.fillPath();
    this.shotRangeGraphics.strokePath();
  }

  applyShotDamage(baseAngle, rangeDistance) {
    const pelletAngles = [];
    for (let i = 0; i < SHOT_PELLET_COUNT; i += 1) {
      const t = SHOT_PELLET_COUNT === 1 ? 0.5 : i / (SHOT_PELLET_COUNT - 1);
      pelletAngles.push(baseAngle + Phaser.Math.Linear(-SHOT_SPREAD, SHOT_SPREAD, t));
    }

    this.zombies.getChildren().forEach((zombie) => {
      if (!zombie.active) {
        return;
      }

      let hitCount = 0;
      for (const angle of pelletAngles) {
        if (this.isZombieHitByPellet(zombie, angle, rangeDistance)) {
          hitCount += 1;
        }
      }

      if (hitCount <= 0) {
        return;
      }

      const died = zombie.takeDamage(hitCount * SHOT_DAMAGE);
      if (died) {
        this.kills += 1;
      }
    });
  }

  isZombieHitByPellet(zombie, angle, rangeDistance) {
    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * rangeDistance;
    const endY = startY + Math.sin(angle) * rangeDistance;
    const distanceToSegment = this.getDistanceToSegment(startX, startY, endX, endY, zombie.x, zombie.y);

    return distanceToSegment <= PELLET_HIT_RADIUS;
  }

  getDistanceToSegment(x1, y1, x2, y2, px, py) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return Phaser.Math.Distance.Between(x1, y1, px, py);
    }

    const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1);
    const nearestX = x1 + dx * t;
    const nearestY = y1 + dy * t;

    return Phaser.Math.Distance.Between(nearestX, nearestY, px, py);
  }

  spawnZombie(x, y, options = {}) {
    const zombie = new Zombie(this, x, y, {
      isBoss: options.isBoss ?? false,
      maxHealth: options.maxHealth ?? 10,
      moveSpeed: options.moveSpeed,
      tint: options.tint,
      aggroRadius: this.settings.aggroRadius,
      attackCooldownMs: ZOMBIE_ATTACK_COOLDOWN_MS,
      speedMultiplier: this.zombieSpeedMultiplier,
    });
    this.zombies.add(zombie);

    if (options.emerge !== false) {
      zombie.emergeFromGround(options.isBoss ? 700 : 420);
    }

    return zombie;
  }

  spawnZombieNearPlayer(isBoss) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(ZOMBIE_SPAWN_MIN_RADIUS, ZOMBIE_SPAWN_MAX_RADIUS);
    const x = Phaser.Math.Clamp(
      this.player.x + Math.cos(angle) * distance,
      80,
      this.physics.world.bounds.width - 80
    );
    const y = Phaser.Math.Clamp(
      this.player.y + Math.sin(angle) * distance,
      80,
      this.physics.world.bounds.height - 80
    );

    if (isBoss) {
      this.boostZombieSpeed();
      this.spawnZombie(x, y, {
        emerge: true,
        isBoss: true,
        maxHealth: BOSS_HEALTH,
        moveSpeed: 42,
        tint: 0xc84a42,
      });
      return;
    }

    this.spawnZombie(x, y, { emerge: true });
  }

  drawArena() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x203629, 1);
    graphics.fillRect(0, 0, 2200, 1600);

    graphics.lineStyle(1, 0x2b523a, 0.9);
    for (let y = 0; y < 1600; y += 72) {
      graphics.lineBetween(0, y, 2200, y);
    }
    for (let x = 0; x < 2200; x += 72) {
      graphics.lineBetween(x, 0, x, 1600);
    }

    graphics.lineStyle(2, 0x3a6b4d, 0.4);
    for (let x = -500; x < 2300; x += 140) {
      graphics.lineBetween(x, 0, x + 560, 1600);
    }

    graphics.fillStyle(0x43633b, 0.9);
    graphics.fillEllipse(560, 460, 520, 200);
    graphics.fillEllipse(1480, 1080, 620, 220);
    graphics.fillEllipse(1780, 420, 420, 170);
  }

  boostZombieSpeed() {
    this.zombieSpeedMultiplier *= ZOMBIE_SPEED_BOOST_PER_BOSS;
    this.zombies.getChildren().forEach((zombie) => {
      zombie.setSpeedMultiplier(this.zombieSpeedMultiplier);
    });
  }

  updateZombieSpawnInterval(delayMs) {
    this.settings.zombieSpawnIntervalMs = delayMs;
    if (this.spawnTimer) {
      this.spawnTimer.reset({
        delay: this.settings.zombieSpawnIntervalMs,
        loop: true,
        callback: () => {
          if (!this.isRoundFinished) {
            this.spawnZombieNearPlayer(false);
          }
        },
      });
    }
  }

  updateAggroRadius(radius) {
    this.settings.aggroRadius = radius;
    this.zombies.getChildren().forEach((zombie) => {
      zombie.aggroRadius = radius;
    });
  }

  updateBossSpawnInterval(delayMs) {
    this.settings.bossSpawnIntervalMs = delayMs;
    if (this.bossTimer) {
      this.bossTimer.reset({
        delay: this.settings.bossSpawnIntervalMs,
        loop: true,
        callback: () => {
          if (!this.isRoundFinished) {
            this.spawnZombieNearPlayer(true);
            this.bossesSpawned += 1;
          }
        },
      });
    }
  }

  toggleDevConsole() {
    if (this.isRoundFinished) {
      return;
    }

    if (this.isPauseMenuOpen) {
      return;
    }

    this.isDevConsoleOpen = !this.isDevConsoleOpen;
    this.settingsUi.setVisible(this.isDevConsoleOpen);
    this.syncPauseState();
  }

  togglePauseMenu() {
    if (this.isRoundFinished) {
      return;
    }

    if (this.isDevConsoleOpen) {
      this.isDevConsoleOpen = false;
      this.settingsUi.setVisible(false);
    }

    this.isPauseMenuOpen = !this.isPauseMenuOpen;
    this.pauseOverlay.setVisible(this.isPauseMenuOpen);
    this.syncPauseState();
  }

  closePauseMenu() {
    this.isPauseMenuOpen = false;
    this.pauseOverlay.setVisible(false);
    this.syncPauseState();
  }

  syncPauseState() {
    const shouldPause = this.isDevConsoleOpen || this.isPauseMenuOpen;
    this.isPaused = shouldPause;
    if (shouldPause) {
      this.physics.world.pause();
      this.player.setVelocity(0, 0);
    } else {
      this.physics.world.resume();
    }
  }

  clearPauseState() {
    this.isPaused = false;
    this.isDevConsoleOpen = false;
    this.isPauseMenuOpen = false;
    if (this.settingsUi) {
      this.settingsUi.setVisible(false);
    }
    if (this.pauseOverlay) {
      this.pauseOverlay.setVisible(false);
    }
    this.physics.world.resume();
  }
}
