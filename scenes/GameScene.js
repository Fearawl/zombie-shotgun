import { AmmoPickup } from "../src/entities/AmmoPickup.js";
import { Zombie } from "../src/entities/Zombie.js";

const PLAYER_SPEED = 250;
const PLAYER_MAX_HEALTH = 10;
const BAT_DAMAGE = 4;
const BAT_COOLDOWN_MS = 420;
const BAT_RADIUS = 92;
const BAT_ARC = 1.55;
const SHOTGUN_CLIP_SIZE = 6;
const SHOTGUN_STARTER_RESERVE = 6;
const SHOTGUN_DAMAGE = 5;
const PISTOL_CLIP_SIZE = 15;
const PISTOL_STARTER_RESERVE = 15;
const PISTOL_DAMAGE = 8;
const SHOT_COOLDOWN_MS = 280;
const PISTOL_COOLDOWN_MS = 150;
const GRENADE_COOLDOWN_MS = 450;
const SHOTGUN_PELLET_COUNT = 8;
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
const FAST_ZOMBIE_CHANCE = 0.28;
const GRENADE_DAMAGE = 45;
const GRENADE_RADIUS = 120;
const MAX_ACTIVE_ZOMBIES = 48;
const MAX_DROPPED_PICKUPS = 24;
const DROPPED_PICKUP_LIFETIME_MS = 18000;
const HOUSE_LOOT_WEAPON_CHANCE = 0.45;
const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2200;
const RANGE_PRESETS = [
  { label: "Short", screenRatio: 0.22, color: 0xa0d8ff },
  { label: "Medium", screenRatio: 0.3, color: 0xf3d57d },
  { label: "Long", screenRatio: 0.38, color: 0xffa970 },
];

const WEAPONS = {
  bat: { key: "bat", label: "Bat" },
  shotgun: { key: "shotgun", label: "Shotgun", clipSize: SHOTGUN_CLIP_SIZE },
  pistol: { key: "pistol", label: "Pistol", clipSize: PISTOL_CLIP_SIZE },
  grenade: { key: "grenade", label: "Grenade" },
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.kills = 0;
    this.lastShotAt = 0;
    this.lastEmptyTriggerAt = 0;
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
    this.lastEmptyTriggerAt = -SHOT_COOLDOWN_MS;
    this.rangePresetIndex = 1;
    this.bossesSpawned = 0;
    this.roundStartedAt = this.time.now;
    this.settings = {
      zombieSpawnIntervalMs: DEFAULT_ZOMBIE_SPAWN_INTERVAL_MS,
      aggroRadius: DEFAULT_AGGRO_RADIUS,
      bossSpawnIntervalMs: DEFAULT_BOSS_SPAWN_INTERVAL_MS,
    };
    this.zombieSpeedMultiplier = 1;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#17261b");

    this.drawArena();
    this.createGroups();
    this.createPlayer();
    this.createWorldProps();
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
    this.projectiles = this.add.group();
    this.obstacles = this.physics.add.staticGroup();
    this.houses = [];
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
    this.player.weapons = {
      bat: {
        unlocked: true,
      },
      shotgun: {
        unlocked: false,
        clipAmmo: 0,
        reserveAmmo: 0,
      },
      pistol: {
        unlocked: false,
        clipAmmo: 0,
        reserveAmmo: 0,
      },
      grenade: {
        unlocked: false,
        ammo: 0,
      },
    };
    this.player.currentWeapon = WEAPONS.bat.key;

    this.playerShadow = this.add.ellipse(this.player.x + 6, this.player.y + 24, 44, 18, 0x000000, 0.24);
    this.playerHealthBar = this.add.graphics().setDepth(6);
    this.playerHealthLabel = this.add.text(this.player.x, this.player.y - 46, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "12px",
      color: "#f7f3dc",
      stroke: "#102018",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(7);
    this.shotRangeGraphics = this.add.graphics().setDepth(1);
    this.playerGun = this.add.graphics();
  }

  createWorldProps() {
    this.createHouses();
    this.createBoundaryTrees();
    this.createScatteredTrees();
  }

  createBoundaryTrees() {
    const bounds = this.physics.world.bounds;
    const spacing = 92;

    for (let x = 40; x <= bounds.width - 40; x += spacing) {
      this.addTree(x, 34, 1.08);
      this.addTree(x, bounds.height - 34, 1.08);
    }

    for (let y = 110; y <= bounds.height - 110; y += spacing) {
      this.addTree(34, y, 1.08);
      this.addTree(bounds.width - 34, y, 1.08);
    }
  }

  createScatteredTrees() {
    const trees = [
      [710, 250, 0.92],
      [920, 270, 1.06],
      [1180, 420, 0.88],
      [1460, 310, 1.02],
      [1710, 520, 0.96],
      [640, 760, 1.1],
      [1020, 890, 0.94],
      [1380, 980, 1.12],
      [1750, 980, 0.9],
      [860, 1280, 1],
      [1540, 1240, 1.06],
      [2140, 560, 1.04],
      [2380, 840, 0.96],
      [2660, 1180, 1.1],
      [2860, 1560, 1.02],
      [2260, 1820, 0.94],
    ];

    trees.forEach(([x, y, scale]) => this.addTree(x, y, scale));
  }

  createHouses() {
    const houses = [
      [530, 370, 360, 264],
      [910, 610, 388, 280],
      [1260, 470, 348, 252],
      [1470, 830, 404, 292],
      [870, 1060, 360, 264],
      [1640, 1180, 396, 284],
      [2260, 760, 396, 284],
      [2550, 1160, 420, 304],
      [2850, 1620, 396, 284],
    ];

    houses.forEach(([x, y, width, height]) => this.addHouse(x, y, width, height));
  }

  addTree(x, y, scale = 1) {
    if (this.isPointInsideAnyHouse(x, y, 42)) {
      return null;
    }

    const tree = this.add.image(x, y, "tree");
    tree.setScale(scale);
    tree.setDepth(3);
    return tree;
  }

  addHouse(x, y, width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const wallThickness = 12;
    const doorWidth = 108;
    const roofInset = 12;
    const floorTop = y - halfHeight + roofInset;
    const bottomWallWidth = (width - doorWidth) / 2;
    const bottomWallOffset = doorWidth / 2 + bottomWallWidth / 2;

    const loot = this.rollHouseLoot();
    const lootX = x + 68;
    const lootY = floorTop + 104;
    const lootVisual = this.createHouseLootVisual(loot, lootX, lootY);

    const roof = this.add.graphics().setDepth(5);
    roof.fillStyle(0x575c62, 1);
    roof.fillRect(x - halfWidth, y - halfHeight, width, height);
    roof.lineStyle(5, 0x2a2f33, 1);
    roof.strokeRect(x - halfWidth, y - halfHeight, width, height);
    roof.fillStyle(0xbcdcf1, 0.34);
    roof.fillRoundedRect(x - halfWidth + 32, y - halfHeight + 34, 54, 30, 6);
    roof.fillRoundedRect(x + halfWidth - 86, y - halfHeight + 34, 54, 30, 6);
    roof.fillRoundedRect(x - 28, y - halfHeight + 58, 56, 34, 6);
    roof.lineStyle(2, 0xe8f6ff, 0.28);
    roof.strokeRoundedRect(x - halfWidth + 32, y - halfHeight + 34, 54, 30, 6);
    roof.strokeRoundedRect(x + halfWidth - 86, y - halfHeight + 34, 54, 30, 6);
    roof.strokeRoundedRect(x - 28, y - halfHeight + 58, 56, 34, 6);

    this.addWall(x, y - halfHeight + wallThickness / 2, width, wallThickness);
    this.addWall(x - halfWidth + wallThickness / 2, y, wallThickness, height);
    this.addWall(x + halfWidth - wallThickness / 2, y, wallThickness, height);
    this.addWall(
      x - bottomWallOffset,
      y + halfHeight - wallThickness / 2,
      bottomWallWidth,
      wallThickness
    );
    this.addWall(
      x + bottomWallOffset,
      y + halfHeight - wallThickness / 2,
      bottomWallWidth,
      wallThickness
    );

    this.houses.push({
      x,
      y,
      width,
      height,
      interiorBounds: new Phaser.Geom.Rectangle(
        x - halfWidth + 16,
        floorTop + 8,
        width - 32,
        height - roofInset - 24
      ),
      roof,
      loot,
      lootVisual,
      lootPosition: new Phaser.Math.Vector2(lootX, lootY),
      collected: false,
    });
  }

  createHouseLootVisual(loot, x, y) {
    const visual = this.add.graphics().setDepth(2);

    if (loot.type === "weapon" && loot.weaponKey === WEAPONS.shotgun.key) {
      visual.lineStyle(6, 0x1f2326, 1);
      visual.lineBetween(x - 24, y + 6, x + 28, y - 4);
      visual.lineStyle(2, 0x454c51, 1);
      visual.lineBetween(x - 24, y + 6, x + 28, y - 4);
      return visual;
    }

    if (loot.type === "weapon" && loot.weaponKey === WEAPONS.pistol.key) {
      visual.lineStyle(7, 0xb8bec3, 1);
      visual.lineBetween(x - 14, y - 2, x + 16, y - 5);
      visual.lineStyle(4, 0x1c2024, 1);
      visual.lineBetween(x - 8, y + 4, x - 2, y + 16);
      return visual;
    }

    if (loot.type === "weapon" && loot.weaponKey === WEAPONS.grenade.key) {
      visual.fillStyle(0x5d646a, 1);
      visual.fillCircle(x, y, 10);
      visual.lineStyle(3, 0x23292d, 1);
      visual.strokeCircle(x, y, 10);
      return visual;
    }

    if (loot.pickupType === "shotgunAmmo") {
      visual.fillStyle(0xca8b4d, 1);
      visual.fillRoundedRect(x - 14, y - 10, 28, 20, 5);
      return visual;
    }

    if (loot.pickupType === "pistolAmmo") {
      visual.fillStyle(0x6f8fd8, 1);
      visual.fillRoundedRect(x - 14, y - 10, 28, 20, 5);
      return visual;
    }

    visual.fillStyle(0x7b6a8b, 1);
    visual.fillRoundedRect(x - 12, y - 12, 24, 24, 6);
    return visual;
  }

  isPointInsideAnyHouse(x, y, padding = 0) {
    return this.houses.some((house) => {
      const bounds = new Phaser.Geom.Rectangle(
        house.x - house.width / 2 - padding,
        house.y - house.height / 2 - padding,
        house.width + padding * 2,
        house.height + padding * 2
      );
      return Phaser.Geom.Rectangle.Contains(bounds, x, y);
    });
  }

  isPlayerInsideHouse() {
    return this.houses.some((house) =>
      Phaser.Geom.Rectangle.Contains(house.interiorBounds, this.player.x, this.player.y)
    );
  }

  addWall(x, y, width, height) {
    const wall = this.obstacles.create(x, y, "wall-block");
    wall.setDisplaySize(width, height);
    wall.setDepth(3);
    wall.refreshBody();
    return wall;
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
      this.spawnZombie(x + offsetX, y + offsetY, {
        emerge: false,
        isFast: i % 6 === 0,
      });
    }
  }

  createUi() {
    this.ui = this.add.container(18, 18).setScrollFactor(0).setDepth(20);

    const panel = this.add.graphics();
    panel.fillStyle(0x09131a, 0.85);
    panel.lineStyle(2, 0x305164, 1);
    panel.fillRoundedRect(0, 0, 372, 220, 16);
    panel.strokeRoundedRect(0, 0, 372, 220, 16);
    this.ui.add(panel);

    this.healthText = this.add.text(20, 16, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#ffb2b2",
    });
    this.weaponText = this.add.text(20, 46, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "18px",
      color: "#f3efcf",
    });
    this.ammoText = this.add.text(20, 72, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#fce7b4",
    });
    this.killsText = this.add.text(20, 108, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#b9f0c4",
    });
    this.bossText = this.add.text(20, 138, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#ff9f7c",
    });
    this.rangeText = this.add.text(20, 168, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "18px",
      color: "#f2cfa4",
    });
    this.reloadText = this.add.text(20, 194, "1 Bat  2 Shotgun  3 Pistol  4 Grenade  E Take  R Reload", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "14px",
      color: "#9fc2d7",
    });

    this.ui.add([
      this.healthText,
      this.weaponText,
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
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(1.05);
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys("W,A,S,D,R,E,P,ESC,ONE,TWO,THREE");
    this.keys.FOUR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }
    this.game.canvas.oncontextmenu = (event) => event.preventDefault();
    this.input.on("pointerdown", (pointer) => {
      if (this.isPaused) {
        return;
      }

      if (pointer.rightButtonDown()) {
        this.cycleShotRange();
      }
    });
    this.input.keyboard.on("keydown-R", () => this.reloadWeapon());
    this.input.keyboard.on("keydown-P", () => this.toggleDevConsole());
    this.input.keyboard.on("keydown-ESC", () => this.togglePauseMenu());
    this.input.keyboard.on("keydown-ONE", () => this.selectWeapon(WEAPONS.bat.key));
    this.input.keyboard.on("keydown-TWO", () => this.selectWeapon(WEAPONS.shotgun.key));
    this.input.keyboard.on("keydown-THREE", () => this.selectWeapon(WEAPONS.pistol.key));
    this.input.keyboard.on("keydown-FOUR", () => this.selectWeapon(WEAPONS.grenade.key));
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.pickups, this.handlePickup, undefined, this);
    this.physics.add.overlap(this.player, this.zombies, this.handleZombieAttack, undefined, this);
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.zombies, this.obstacles);
  }

  setupSpawnTimers() {
    this.spawnTimer = this.time.addEvent({
      delay: this.settings.zombieSpawnIntervalMs,
      loop: true,
      callback: () => {
        if (!this.isRoundFinished && !this.isPaused) {
          this.spawnZombieNearPlayer(false);
        }
      },
    });

    this.bossTimer = this.time.addEvent({
      delay: this.settings.bossSpawnIntervalMs,
      loop: true,
      callback: () => {
        if (!this.isRoundFinished && !this.isPaused) {
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
    this.updateContinuousFire();
    this.updatePlayerVisuals();
    this.updatePlayerHealthIndicator();
    this.updateHouses();
    this.updateShotRangeIndicator();
    this.updateUi();
  }

  isSceneActive() {
    return Boolean(this.sys && this.sys.isActive());
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
    const barrelLength =
      this.player.currentWeapon === WEAPONS.pistol.key
        ? 28
        : this.player.currentWeapon === WEAPONS.grenade.key
          ? 18
          : 34;
    const gripLength = 14;
    const barrelX = originX + Math.cos(angle) * barrelLength;
    const barrelY = originY + Math.sin(angle) * barrelLength;
    const buttX = originX - Math.cos(angle) * gripLength;
    const buttY = originY - Math.sin(angle) * gripLength;
    const sideAngle = angle + Math.PI / 2;

    this.playerGun.clear();
    if (this.player.currentWeapon === WEAPONS.bat.key) {
      const batTipX = originX + Math.cos(angle) * 42;
      const batTipY = originY + Math.sin(angle) * 42;
      const batEndX = originX - Math.cos(angle) * 18;
      const batEndY = originY - Math.sin(angle) * 18;
      const handleTopX = originX - Math.cos(angle) * 4;
      const handleTopY = originY - Math.sin(angle) * 4;

      this.playerGun.lineStyle(10, 0xa5abb0, 1);
      this.playerGun.lineBetween(handleTopX, handleTopY, batTipX, batTipY);
      this.playerGun.lineStyle(3, 0xd6dbe0, 1);
      this.playerGun.lineBetween(handleTopX, handleTopY, batTipX, batTipY);

      this.playerGun.lineStyle(10, 0x1b2230, 1);
      this.playerGun.lineBetween(batEndX, batEndY, handleTopX, handleTopY);
      this.playerGun.lineStyle(3, 0x394356, 1);
      this.playerGun.lineBetween(batEndX, batEndY, handleTopX, handleTopY);

      this.playerGun.lineStyle(15, 0x4f0608, 0.95);
      this.playerGun.lineBetween(
        originX + Math.cos(angle) * 24,
        originY + Math.sin(angle) * 24,
        batTipX,
        batTipY
      );

      this.playerGun.fillStyle(0x3b4146, 1);
      this.playerGun.fillCircle(batTipX, batTipY, 6);
      this.playerGun.fillStyle(0x7a8087, 1);
      this.playerGun.fillCircle(batEndX, batEndY, 4);
      return;
    }
    if (this.player.currentWeapon === WEAPONS.grenade.key) {
      this.playerGun.fillStyle(0x46525e, 1);
      this.playerGun.fillCircle(barrelX, barrelY, 9);
      return;
    }
    if (this.player.currentWeapon === WEAPONS.shotgun.key) {
      const stockBackX = originX - Math.cos(angle) * 36;
      const stockBackY = originY - Math.sin(angle) * 36;
      const receiverBackX = originX - Math.cos(angle) * 4;
      const receiverBackY = originY - Math.sin(angle) * 4;
      const muzzleX = originX + Math.cos(angle) * 50;
      const muzzleY = originY + Math.sin(angle) * 50;
      const foreFrontX = originX + Math.cos(angle) * 28;
      const foreFrontY = originY + Math.sin(angle) * 28;
      const foreBackX = originX + Math.cos(angle) * 6;
      const foreBackY = originY + Math.sin(angle) * 6;
      const downAngle = angle + Math.PI / 2;
      const upAngle = angle - Math.PI / 2;

      this.playerGun.lineStyle(10, 0x161a1d, 1);
      this.playerGun.lineBetween(receiverBackX, receiverBackY, muzzleX, muzzleY);
      this.playerGun.lineStyle(4, 0x2e3438, 1);
      this.playerGun.lineBetween(receiverBackX, receiverBackY, muzzleX, muzzleY);

      this.playerGun.lineStyle(8, 0x111518, 1);
      this.playerGun.lineBetween(
        receiverBackX + Math.cos(downAngle) * 5,
        receiverBackY + Math.sin(downAngle) * 5,
        foreFrontX + Math.cos(downAngle) * 5,
        foreFrontY + Math.sin(downAngle) * 5
      );

      this.playerGun.lineStyle(12, 0x202529, 1);
      this.playerGun.lineBetween(foreBackX, foreBackY, foreFrontX, foreFrontY);
      this.playerGun.lineStyle(4, 0x343b40, 1);
      this.playerGun.lineBetween(foreBackX, foreBackY, foreFrontX, foreFrontY);

      this.playerGun.lineStyle(13, 0x1b2024, 1);
      this.playerGun.lineBetween(stockBackX, stockBackY, receiverBackX, receiverBackY);
      this.playerGun.lineStyle(4, 0x31383d, 1);
      this.playerGun.lineBetween(stockBackX, stockBackY, receiverBackX, receiverBackY);

      this.playerGun.lineStyle(9, 0x15191c, 1);
      this.playerGun.lineBetween(
        stockBackX + Math.cos(downAngle) * 10,
        stockBackY + Math.sin(downAngle) * 10,
        stockBackX + Math.cos(downAngle) * 23,
        stockBackY + Math.sin(downAngle) * 23
      );
      this.playerGun.lineStyle(3, 0x2d3337, 1);
      this.playerGun.lineBetween(
        stockBackX + Math.cos(downAngle) * 10,
        stockBackY + Math.sin(downAngle) * 10,
        stockBackX + Math.cos(downAngle) * 23,
        stockBackY + Math.sin(downAngle) * 23
      );

      this.playerGun.lineStyle(3, 0x23282c, 1);
      this.playerGun.lineBetween(
        receiverBackX + Math.cos(upAngle) * 3,
        receiverBackY + Math.sin(upAngle) * 3,
        receiverBackX + Math.cos(downAngle) * 7,
        receiverBackY + Math.sin(downAngle) * 7
      );

      this.playerGun.fillStyle(0x0d1012, 1);
      this.playerGun.fillCircle(muzzleX, muzzleY, 3);
      return;
    }
    if (this.player.currentWeapon === WEAPONS.pistol.key) {
      const gripBackX = originX - Math.cos(angle) * 12;
      const gripBackY = originY - Math.sin(angle) * 12;
      const slideBackX = originX - Math.cos(angle) * 4;
      const slideBackY = originY - Math.sin(angle) * 4;
      const muzzleX = originX + Math.cos(angle) * 34;
      const muzzleY = originY + Math.sin(angle) * 34;
      const downAngle = angle + Math.PI / 2;
      const upAngle = angle - Math.PI / 2;

      this.playerGun.lineStyle(10, 0xbfc5ca, 1);
      this.playerGun.lineBetween(slideBackX, slideBackY, muzzleX, muzzleY);
      this.playerGun.lineStyle(3, 0x737b82, 1);
      this.playerGun.lineBetween(slideBackX, slideBackY, muzzleX, muzzleY);

      for (let i = 0; i < 4; i += 1) {
        const notchX = muzzleX - Math.cos(angle) * (8 + i * 4);
        const notchY = muzzleY - Math.sin(angle) * (8 + i * 4);
        this.playerGun.lineStyle(2, 0x8b9298, 1);
        this.playerGun.lineBetween(
          notchX + Math.cos(downAngle) * 4,
          notchY + Math.sin(downAngle) * 4,
          notchX + Math.cos(upAngle) * 4,
          notchY + Math.sin(upAngle) * 4
        );
      }

      this.playerGun.lineStyle(7, 0x191d20, 1);
      this.playerGun.lineBetween(
        gripBackX + Math.cos(downAngle) * 6,
        gripBackY + Math.sin(downAngle) * 6,
        gripBackX + Math.cos(downAngle) * 22,
        gripBackY + Math.sin(downAngle) * 22
      );
      this.playerGun.lineStyle(3, 0x30363b, 1);
      this.playerGun.lineBetween(
        gripBackX + Math.cos(downAngle) * 6,
        gripBackY + Math.sin(downAngle) * 6,
        gripBackX + Math.cos(downAngle) * 22,
        gripBackY + Math.sin(downAngle) * 22
      );

      this.playerGun.lineStyle(3, 0x20252a, 1);
      this.playerGun.lineBetween(
        gripBackX + Math.cos(downAngle) * 8,
        gripBackY + Math.sin(downAngle) * 2,
        gripBackX + Math.cos(downAngle) * 14,
        gripBackY + Math.sin(downAngle) * 14
      );

      this.playerGun.lineStyle(2, 0x0f1113, 1);
      this.playerGun.lineBetween(
        originX - Math.cos(angle) * 2 + Math.cos(downAngle) * 8,
        originY - Math.sin(angle) * 2 + Math.sin(downAngle) * 8,
        originX + Math.cos(downAngle) * 14,
        originY + Math.sin(downAngle) * 14
      );

      this.playerGun.fillStyle(0xd3d7db, 1);
      this.playerGun.fillCircle(
        slideBackX + Math.cos(upAngle) * 2,
        slideBackY + Math.sin(upAngle) * 2,
        3
      );
      this.playerGun.fillStyle(0x101316, 1);
      this.playerGun.fillCircle(muzzleX, muzzleY, 2);
      return;
    }
    this.playerGun.lineStyle(this.player.currentWeapon === WEAPONS.pistol.key ? 5 : 8, 0x44352d, 1);
    this.playerGun.lineBetween(buttX, buttY, barrelX, barrelY);
    this.playerGun.lineStyle(this.player.currentWeapon === WEAPONS.pistol.key ? 3 : 4, 0x946a3a, 1);
    this.playerGun.lineBetween(
      originX + Math.cos(sideAngle) * 4,
      originY + Math.sin(sideAngle) * 4,
      barrelX + Math.cos(sideAngle) * 2,
      barrelY + Math.sin(sideAngle) * 2
    );
  }

  updatePlayerHealthIndicator() {
    if (!this.playerHealthBar || !this.playerHealthLabel) {
      return;
    }

    const width = 52;
    const ratio = Phaser.Math.Clamp(this.player.healthPoints / PLAYER_MAX_HEALTH, 0, 1);
    const x = this.player.x - width / 2;
    const y = this.player.y - 38;

    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0x2b1215, 0.9);
    this.playerHealthBar.fillRoundedRect(x, y, width, 7, 3);
    this.playerHealthBar.fillStyle(0x7ae07e, 1);
    this.playerHealthBar.fillRoundedRect(x, y, width * ratio, 7, 3);

    this.playerHealthLabel.setPosition(this.player.x, this.player.y - 48);
    this.playerHealthLabel.setText(`${this.player.healthPoints}/${PLAYER_MAX_HEALTH}`);
  }

  updateContinuousFire() {
    const pointer = this.input.activePointer;
    if (!pointer || !pointer.leftButtonDown()) {
      return;
    }

    if (!this.canCurrentWeaponFire()) {
      this.handleEmptyTrigger();
      return;
    }

    this.useCurrentWeapon(pointer);
  }

  updateUi() {
    const bossSecondsLeft = this.bossTimer
      ? Math.max(0, Math.ceil(this.bossTimer.getRemaining() / 1000))
      : Math.ceil(this.settings.bossSpawnIntervalMs / 1000);
    const shotgun = this.player.weapons.shotgun;
    const pistol = this.player.weapons.pistol;
    const grenade = this.player.weapons.grenade;
    this.healthText.setText(`HP: ${this.player.healthPoints}/${PLAYER_MAX_HEALTH}`);
    this.weaponText.setText(`Weapon: ${WEAPONS[this.player.currentWeapon].label}`);
    this.ammoText.setText(
      `BT ready  SG ${this.formatRangedAmmo(shotgun)}  PI ${this.formatRangedAmmo(pistol)}  GR ${this.formatGrenadeAmmo(grenade)}`
    );
    this.killsText.setText(`Zombies down: ${this.kills}`);
    this.bossText.setText(`Boss in: ${bossSecondsLeft}s`);
    this.rangeText.setText(`Range: ${this.getCurrentRangePreset().label} (RMB)  Houses: loot weapon or ammo`);
  }

  useCurrentWeapon(pointer) {
    if (this.player.currentWeapon === WEAPONS.bat.key) {
      this.swingBat(pointer);
      return;
    }

    if (this.player.currentWeapon === WEAPONS.shotgun.key) {
      this.fireShotgun(pointer);
      return;
    }

    if (this.player.currentWeapon === WEAPONS.pistol.key) {
      this.firePistol(pointer);
      return;
    }

    this.throwGrenade(pointer);
  }

  canCurrentWeaponFire() {
    if (this.player.currentWeapon === WEAPONS.bat.key) {
      return true;
    }

    if (this.player.currentWeapon === WEAPONS.shotgun.key) {
      return this.player.weapons.shotgun.unlocked && this.player.weapons.shotgun.clipAmmo > 0;
    }

    if (this.player.currentWeapon === WEAPONS.pistol.key) {
      return this.player.weapons.pistol.unlocked && this.player.weapons.pistol.clipAmmo > 0;
    }

    return this.player.weapons.grenade.unlocked && this.player.weapons.grenade.ammo > 0;
  }

  handleEmptyTrigger() {
    if (this.time.now - this.lastEmptyTriggerAt < 180) {
      return;
    }

    this.lastEmptyTriggerAt = this.time.now;
    this.flashUi("#ff8b7d");
  }

  swingBat(pointer) {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.time.now - this.lastShotAt < BAT_COOLDOWN_MS) {
      return;
    }

    this.lastShotAt = this.time.now;

    const swingAngle = pointer
      ? Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY)
      : this.player.facingAngle;

    this.showBatSwing(swingAngle);

    this.zombies.getChildren().forEach((zombie) => {
      if (!zombie.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zombie.x, zombie.y);
      if (distance > BAT_RADIUS) {
        return;
      }

      const angleToZombie = Phaser.Math.Angle.Between(this.player.x, this.player.y, zombie.x, zombie.y);
      const angleDelta = Phaser.Math.Angle.Wrap(angleToZombie - swingAngle);
      if (Math.abs(angleDelta) > BAT_ARC / 2) {
        return;
      }

      const died = zombie.takeDamage(BAT_DAMAGE);
      if (died) {
        this.kills += 1;
      }
    });
  }

  fireShotgun(pointer) {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.time.now - this.lastShotAt < SHOT_COOLDOWN_MS) {
      return;
    }

    if (!this.player.weapons.shotgun.unlocked || this.player.weapons.shotgun.clipAmmo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    this.lastShotAt = this.time.now;
    this.player.weapons.shotgun.clipAmmo -= 1;

    const targetX = pointer.worldX;
    const targetY = pointer.worldY;
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const rangeDistance = this.getCurrentShotDistance();
    const shotLifetimeMs = Math.round((rangeDistance / 900) * 1000);

    for (let i = 0; i < SHOTGUN_PELLET_COUNT; i += 1) {
      const t = SHOTGUN_PELLET_COUNT === 1 ? 0.5 : i / (SHOTGUN_PELLET_COUNT - 1);
      const angle = baseAngle + Phaser.Math.Linear(-SHOT_SPREAD, SHOT_SPREAD, t);
      this.spawnProjectileVisual("pellet", angle, rangeDistance, shotLifetimeMs, 0.1);
    }

    this.applyShotgunDamage(baseAngle, rangeDistance);
    this.showMuzzleFlash(baseAngle);
    this.cameras.main.shake(65, 0.0025);
  }

  firePistol(pointer) {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.time.now - this.lastShotAt < PISTOL_COOLDOWN_MS) {
      return;
    }

    if (!this.player.weapons.pistol.unlocked || this.player.weapons.pistol.clipAmmo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    this.lastShotAt = this.time.now;
    this.player.weapons.pistol.clipAmmo -= 1;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const rangeDistance = Math.round(this.scale.width * 0.46);
    const shotLifetimeMs = Math.round((rangeDistance / 1100) * 1000);
    this.spawnProjectileVisual("pistol-bullet", angle, rangeDistance, shotLifetimeMs, 0.2);
    this.applySingleBulletDamage(angle, rangeDistance, PISTOL_DAMAGE, 14);
    this.showMuzzleFlash(angle);
  }

  throwGrenade(pointer) {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.time.now - this.lastShotAt < GRENADE_COOLDOWN_MS) {
      return;
    }

    if (!this.player.weapons.grenade.unlocked || this.player.weapons.grenade.ammo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    this.lastShotAt = this.time.now;
    this.player.weapons.grenade.ammo -= 1;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const distance = Math.min(
      Phaser.Math.Distance.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY),
      280
    );
    const targetX = this.player.x + Math.cos(angle) * distance;
    const targetY = this.player.y + Math.sin(angle) * distance;
    const grenade = this.add.image(this.player.x, this.player.y, "grenade-orb").setDepth(5);
    this.projectiles.add(grenade);

    this.tweens.add({
      targets: grenade,
      x: targetX,
      y: targetY,
      duration: 420,
      ease: "Quad.Out",
      onComplete: () => {
        grenade.destroy();
        this.explodeGrenade(targetX, targetY);
      },
    });
  }

  reloadWeapon() {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.player.currentWeapon === WEAPONS.bat.key || this.player.currentWeapon === WEAPONS.grenade.key) {
      this.flashUi("#ff8b7d");
      return;
    }

    const weapon = this.player.weapons[this.player.currentWeapon];
    const clipSize = WEAPONS[this.player.currentWeapon].clipSize;

    if (!weapon.unlocked || weapon.clipAmmo >= clipSize || weapon.reserveAmmo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    const neededAmmo = clipSize - weapon.clipAmmo;
    const loadedAmmo = Math.min(neededAmmo, weapon.reserveAmmo);
    weapon.clipAmmo += loadedAmmo;
    weapon.reserveAmmo -= loadedAmmo;
    this.flashUi("#a7efc5");
  }

  selectWeapon(weaponKey) {
    if (this.isRoundFinished) {
      return;
    }

    if (weaponKey !== WEAPONS.bat.key && !this.player.weapons[weaponKey].unlocked) {
      this.flashUi("#ff8b7d");
      return;
    }

    this.player.currentWeapon = weaponKey;
    this.flashUi("#9cd4ff");
  }

  showBatSwing(angle) {
    const arc = this.add.graphics().setDepth(5);
    arc.lineStyle(6, 0xf0d28f, 0.9);
    arc.beginPath();
    arc.arc(this.player.x, this.player.y, BAT_RADIUS, angle - BAT_ARC / 2, angle + BAT_ARC / 2, false);
    arc.strokePath();
    this.time.delayedCall(90, () => {
      if (arc && arc.active) {
        arc.destroy();
      }
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

    this.time.delayedCall(70, () => {
      if (flash && flash.active) {
        flash.destroy();
      }
    });
  }

  spawnProjectileVisual(textureKey, angle, distance, duration, targetAlpha) {
    const projectile = this.add.image(
      this.player.x + Math.cos(angle) * 24,
      this.player.y + Math.sin(angle) * 24,
      textureKey
    );
    projectile.setDepth(5);
    this.projectiles.add(projectile);

    this.tweens.add({
      targets: projectile,
      x: this.player.x + Math.cos(angle) * distance,
      y: this.player.y + Math.sin(angle) * distance,
      alpha: targetAlpha,
      duration,
      ease: "Linear",
      onComplete: () => {
        if (projectile && projectile.active) {
          projectile.destroy();
        }
      },
    });
  }

  explodeGrenade(x, y) {
    const blast = this.add.graphics().setDepth(4);
    blast.fillStyle(0xffc76a, 0.4);
    blast.fillCircle(x, y, GRENADE_RADIUS);
    blast.lineStyle(4, 0xff7a37, 0.75);
    blast.strokeCircle(x, y, GRENADE_RADIUS);
    this.time.delayedCall(120, () => {
      if (blast && blast.active) {
        blast.destroy();
      }
    });
    this.cameras.main.shake(140, 0.004);

    this.zombies.getChildren().forEach((zombie) => {
      if (!zombie.active) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(x, y, zombie.x, zombie.y);
      if (distance > GRENADE_RADIUS) {
        return;
      }
      const falloff = 1 - distance / GRENADE_RADIUS;
      const died = zombie.takeDamage(Math.max(12, Math.round(GRENADE_DAMAGE * falloff)));
      if (died) {
        this.kills += 1;
      }
    });
  }

  handlePickup(player, pickup) {
    if (!pickup.active) {
      return;
    }

    if (pickup.pickupType === "shotgunAmmo") {
      player.weapons.shotgun.reserveAmmo += pickup.ammoAmount;
    } else if (pickup.pickupType === "pistolAmmo") {
      player.weapons.pistol.reserveAmmo += pickup.ammoAmount;
    } else if (pickup.pickupType === "grenade") {
      player.weapons.grenade.ammo += pickup.ammoAmount;
    }
    pickup.consume();
    this.flashUi("#f9d27b");

    if (!pickup.shouldRespawn) {
      return;
    }

    this.time.delayedCall(pickup.respawnDelayMs, () => {
      if (!this.isSceneActive()) {
        return;
      }
      if (!pickup.scene || pickup.active) {
        return;
      }
      const respawned = new AmmoPickup(this, pickup.spawnPoint.x, pickup.spawnPoint.y, {
        ...this.buildPickupOptions(pickup.pickupType),
        respawnDelayMs: pickup.respawnDelayMs,
        shouldRespawn: pickup.shouldRespawn,
      });
      this.pickups.add(respawned);
    });
  }

  updateHouses() {
    this.houses.forEach((house) => {
      const isInside = Phaser.Geom.Rectangle.Contains(house.interiorBounds, this.player.x, this.player.y);
      house.roof.setAlpha(isInside ? 0.16 : 1);

      if (house.lootVisual) {
        house.lootVisual.setVisible(!house.collected && isInside);
      }

      if (!house.collected && isInside && Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          house.lootPosition.x,
          house.lootPosition.y
        );

        if (distance <= 82) {
          house.collected = true;
          this.applyHouseLoot(house.loot);
          if (house.lootVisual) {
            house.lootVisual.destroy();
            house.lootVisual = null;
          }
          this.showHouseLootText(house.x, house.y - house.height / 2 - 24, house.loot.label);
          this.flashUi(house.loot.type === "weapon" ? "#9cd4ff" : "#f9d27b");
        }
      }
    });
  }

  rollHouseLoot() {
    const lockedWeapons = [WEAPONS.shotgun.key, WEAPONS.pistol.key, WEAPONS.grenade.key].filter(
      (weaponKey) => !this.player.weapons[weaponKey].unlocked
    );

    const shouldGiveWeapon = lockedWeapons.length > 0 && Math.random() < HOUSE_LOOT_WEAPON_CHANCE;
    if (shouldGiveWeapon) {
      const weaponKey = Phaser.Utils.Array.GetRandom(lockedWeapons);
      return {
        type: "weapon",
        weaponKey,
        label: `Found ${WEAPONS[weaponKey].label}`,
      };
    }

    const pickupType = Phaser.Utils.Array.GetRandom(["shotgunAmmo", "pistolAmmo", "grenade"]);
    const ammoLabel =
      pickupType === "shotgunAmmo"
        ? "Found shotgun ammo"
        : pickupType === "pistolAmmo"
          ? "Found pistol ammo"
          : "Found grenade";

    return {
      type: "ammo",
      pickupType,
      label: ammoLabel,
    };
  }

  applyHouseLoot(loot) {
    if (loot.type === "weapon") {
      this.unlockWeapon(loot.weaponKey);
      return;
    }

    if (loot.pickupType === "shotgunAmmo") {
      this.player.weapons.shotgun.reserveAmmo += 10;
      return;
    }

    if (loot.pickupType === "pistolAmmo") {
      this.player.weapons.pistol.reserveAmmo += 15;
      return;
    }

    this.player.weapons.grenade.ammo += 1;
  }

  unlockWeapon(weaponKey) {
    const weapon = this.player.weapons[weaponKey];
    if (!weapon || weapon.unlocked) {
      return;
    }

    weapon.unlocked = true;
    if (weaponKey === WEAPONS.shotgun.key) {
      weapon.clipAmmo = SHOTGUN_CLIP_SIZE;
      weapon.reserveAmmo += SHOTGUN_STARTER_RESERVE;
      return;
    }

    if (weaponKey === WEAPONS.pistol.key) {
      weapon.clipAmmo = PISTOL_CLIP_SIZE;
      weapon.reserveAmmo += PISTOL_STARTER_RESERVE;
      return;
    }

    weapon.ammo += 2;
  }

  showHouseLootText(x, y, label) {
    const text = this.add.text(x, y, label, {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "16px",
      color: "#fff2c7",
      stroke: "#2d1b0a",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8);

    this.tweens.add({
      targets: text,
      y: y - 26,
      alpha: 0,
      duration: 900,
      ease: "Sine.Out",
      onComplete: () => {
        if (text && text.active) {
          text.destroy();
        }
      },
    });
  }

  handleZombieAttack(player, zombie) {
    if (!zombie.active || !zombie.canMove) {
      return;
    }

    if (this.isPlayerInsideHouse()) {
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
      if (!this.isSceneActive()) {
        return;
      }
      if (!this.healthText || !this.ammoText || !this.killsText || !this.bossText) {
        return;
      }
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

  spawnZombieDrop(x, y, pickupType) {
    this.trimDroppedPickups();
    const pickup = new AmmoPickup(this, x, y, {
      ...this.buildPickupOptions(pickupType),
      shouldRespawn: false,
    });
    this.pickups.add(pickup);

    this.time.delayedCall(DROPPED_PICKUP_LIFETIME_MS, () => {
      if (!this.isSceneActive()) {
        return;
      }
      if (pickup.active) {
        pickup.consume();
      }
    });
  }

  buildPickupOptions(pickupType) {
    if (pickupType === "pistolAmmo") {
      return {
        pickupType,
        textureKey: "pistol-ammo-box",
        iconTextureKey: "pistol-icon",
        ammoAmount: 15,
      };
    }

    if (pickupType === "grenade") {
      return {
        pickupType,
        textureKey: "grenade-box",
        iconTextureKey: "grenade-icon",
        ammoAmount: 1,
      };
    }

    return {
      pickupType: "shotgunAmmo",
      textureKey: "ammo-box",
      iconTextureKey: "shell-icon",
      ammoAmount: 10,
    };
  }

  cycleShotRange() {
    this.rangePresetIndex = (this.rangePresetIndex + 1) % RANGE_PRESETS.length;
    this.flashUi("#ffd78e");
  }

  formatRangedAmmo(weapon) {
    if (!weapon.unlocked) {
      return `LOCK/${weapon.reserveAmmo}`;
    }
    return `${weapon.clipAmmo}/${weapon.reserveAmmo}`;
  }

  formatGrenadeAmmo(weapon) {
    if (!weapon.unlocked) {
      return `LOCK/${weapon.ammo}`;
    }
    return `${weapon.ammo}`;
  }

  getCurrentRangePreset() {
    return RANGE_PRESETS[this.rangePresetIndex];
  }

  getCurrentShotDistance() {
    return Math.round(this.scale.width * this.getCurrentRangePreset().screenRatio);
  }

  updateShotRangeIndicator() {
    this.shotRangeGraphics.clear();
    if (this.player.currentWeapon !== WEAPONS.shotgun.key) {
      return;
    }

    const angle = this.player.facingAngle;
    const distance = this.getCurrentShotDistance();
    const preset = this.getCurrentRangePreset();
    const points = [];
    const segments = 12;
    const startAngle = angle - SHOT_SPREAD;
    const endAngle = angle + SHOT_SPREAD;
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

  applyShotgunDamage(baseAngle, rangeDistance) {
    const pelletAngles = [];
    for (let i = 0; i < SHOTGUN_PELLET_COUNT; i += 1) {
      const t = SHOTGUN_PELLET_COUNT === 1 ? 0.5 : i / (SHOTGUN_PELLET_COUNT - 1);
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

      const died = zombie.takeDamage(hitCount * SHOTGUN_DAMAGE);
      if (died) {
        this.kills += 1;
      }
    });
  }

  applySingleBulletDamage(angle, rangeDistance, damage, hitRadius) {
    let closestZombie = null;
    let closestDistance = Number.MAX_SAFE_INTEGER;

    this.zombies.getChildren().forEach((zombie) => {
      if (!zombie.active) {
        return;
      }

      if (!this.isZombieHitByPellet(zombie, angle, rangeDistance, hitRadius)) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zombie.x, zombie.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestZombie = zombie;
      }
    });

    if (!closestZombie) {
      return;
    }

    const died = closestZombie.takeDamage(damage);
    if (died) {
      this.kills += 1;
    }
  }

  isZombieHitByPellet(zombie, angle, rangeDistance, hitRadius = PELLET_HIT_RADIUS) {
    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * rangeDistance;
    const endY = startY + Math.sin(angle) * rangeDistance;
    const distanceToSegment = this.getDistanceToSegment(startX, startY, endX, endY, zombie.x, zombie.y);

    return distanceToSegment <= hitRadius;
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
    const isFast = options.isFast ?? false;
    const dropType = isFast ? (Math.random() < 0.5 ? "pistolAmmo" : "grenade") : "shotgunAmmo";
    const zombie = new Zombie(this, x, y, {
      isBoss: options.isBoss ?? false,
      maxHealth: options.maxHealth ?? 10,
      isFast,
      moveSpeed: options.moveSpeed ?? (isFast ? 78 : undefined),
      tint: options.tint ?? (isFast ? 0xd58a35 : undefined),
      aggroRadius: this.settings.aggroRadius,
      attackCooldownMs: ZOMBIE_ATTACK_COOLDOWN_MS,
      speedMultiplier: this.zombieSpeedMultiplier,
      dropType,
    });
    this.zombies.add(zombie);

    if (options.emerge !== false) {
      zombie.emergeFromGround(options.isBoss ? 700 : isFast ? 360 : 420);
    }

    return zombie;
  }

  spawnZombieNearPlayer(isBoss) {
    if (!isBoss && this.zombies.countActive(true) >= MAX_ACTIVE_ZOMBIES) {
      return;
    }

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

    this.spawnZombie(x, y, {
      emerge: true,
      isFast: Math.random() < FAST_ZOMBIE_CHANCE,
    });
  }

  trimDroppedPickups() {
    const droppedPickups = this.pickups.getChildren().filter((pickup) => pickup.active && !pickup.shouldRespawn);
    if (droppedPickups.length < MAX_DROPPED_PICKUPS) {
      return;
    }

    droppedPickups
      .slice(0, droppedPickups.length - MAX_DROPPED_PICKUPS + 1)
      .forEach((pickup) => pickup.consume());
  }

  drawArena() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x203629, 1);
    graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    graphics.lineStyle(1, 0x2b523a, 0.9);
    for (let y = 0; y < WORLD_HEIGHT; y += 72) {
      graphics.lineBetween(0, y, WORLD_WIDTH, y);
    }
    for (let x = 0; x < WORLD_WIDTH; x += 72) {
      graphics.lineBetween(x, 0, x, WORLD_HEIGHT);
    }

    graphics.lineStyle(2, 0x3a6b4d, 0.4);
    for (let x = -500; x < WORLD_WIDTH + 120; x += 140) {
      graphics.lineBetween(x, 0, x + 560, WORLD_HEIGHT);
    }

    graphics.fillStyle(0x43633b, 0.9);
    graphics.fillEllipse(560, 460, 520, 200);
    graphics.fillEllipse(1480, 1080, 620, 220);
    graphics.fillEllipse(1780, 420, 420, 170);
    graphics.fillEllipse(2360, 920, 560, 220);
    graphics.fillEllipse(2820, 1540, 620, 240);
    graphics.fillEllipse(1080, 1820, 720, 250);
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
          if (!this.isRoundFinished && !this.isPaused) {
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
          if (!this.isRoundFinished && !this.isPaused) {
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
