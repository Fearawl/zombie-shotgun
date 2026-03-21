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
const AKM_CLIP_SIZE = 30;
const AKM_STARTER_RESERVE = 180;
const AKM_DAMAGE = 4;
const SHOT_COOLDOWN_MS = 700;
const PISTOL_COOLDOWN_MS = 500;
const AKM_COOLDOWN_MS = 110;
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
const ZOMBIE_ATTACK_DAMAGE_MIN = 1;
const ZOMBIE_ATTACK_DAMAGE_MAX = 3;
const ZOMBIE_ATTACK_COOLDOWN_MS = 2000;
const FAST_ZOMBIE_CHANCE = 0.28;
const BLUE_ZOMBIE_CHANCE = 0.18;
const GRENADE_DAMAGE = 45;
const GRENADE_RADIUS = 120;
const MAX_ACTIVE_ZOMBIES = 48;
const MAX_DROPPED_PICKUPS = 24;
const DROPPED_PICKUP_LIFETIME_MS = 18000;
const SMALL_ZOMBIE_MEDKIT_CHANCE = 0.3;
const MEDKIT_HEAL_AMOUNT = 5;
const ENERGY_DRINK_CHANCE = 0.12;
const ENERGY_BOOST_MS = 5000;
const ENERGY_SPEED_MULTIPLIER = 1.5;
const HOUSE_BREACH_DELAY_MS = 15000;
const HOUSE_LOOT_WEAPON_CHANCE = 0.45;
const ACID_POOL_DAMAGE_PER_TICK = 0.5;
const ACID_POOL_TICK_MS = 1000;
const ACID_POOL_LIFETIME_MS = 5000;
const BASE_GATE_HEALTH = 20;
const WORLD_WIDTH = 4200;
const WORLD_HEIGHT = 2800;
const SURVIVAL_GOAL_MS = 7 * 60 * 1000;
const EXTRACTION_HOLD_MS = 5000;
const EXTRACTION_RADIUS = 58;
const EXTRACTION_POINT = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
const RANGE_PRESETS = [
  { label: "Short", screenRatio: 0.22, color: 0xa0d8ff },
  { label: "Medium", screenRatio: 0.3, color: 0xf3d57d },
  { label: "Long", screenRatio: 0.38, color: 0xffa970 },
];

const WEAPONS = {
  bat: { key: "bat", label: "Bat" },
  shotgun: { key: "shotgun", label: "Shotgun", clipSize: SHOTGUN_CLIP_SIZE },
  pistol: { key: "pistol", label: "Pistol", clipSize: PISTOL_CLIP_SIZE },
  akm: { key: "akm", label: "AKM", clipSize: AKM_CLIP_SIZE },
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
    this.extractionReady = false;
    this.extractionHoldStartedAt = 0;
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
    this.createMobileControls();
    this.setupCamera();
    this.setupInput();
    this.setupCollisions();
    this.setupSpawnTimers();
  }

  createGroups() {
    this.projectiles = this.add.group();
    this.obstacles = this.physics.add.staticGroup();
    this.houses = [];
    this.graves = [];
    this.acidPools = [];
    this.militaryBase = null;
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
    this.player.speedBoostUntil = 0;
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
      akm: {
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
    this.createMilitaryBase();
    this.createGraves();
    this.createBoundaryTrees();
    this.createScatteredTrees();
    this.createExtractionZone();
  }

  createExtractionZone() {
    const { x, y } = EXTRACTION_POINT;
    this.extractionMarker = this.add.container(x, y).setDepth(2.2);

    const ring = this.add.graphics();
    ring.lineStyle(5, 0xcfd8de, 0.95);
    ring.strokeCircle(0, 0, 54);
    ring.lineStyle(3, 0xb64d4d, 0.9);
    ring.strokeCircle(0, 0, 38);
    ring.lineStyle(2, 0xd5e6f2, 0.55);
    ring.lineBetween(-46, 0, 46, 0);
    ring.lineBetween(0, -46, 0, 46);

    const sosText = this.add.text(0, -8, "SOS", {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "30px",
      color: "#fff1e0",
      stroke: "#7a1e1e",
      strokeThickness: 6,
    }).setOrigin(0.5);

    const padText = this.add.text(0, 30, "Helipad", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "14px",
      color: "#d2e2ee",
      stroke: "#16232c",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.extractionMarker.add([ring, sosText, padText]);
  }

  createGraves() {
    const graves = [
      [320, 240, 0.9],
      [680, 250, 1],
      [1180, 250, 0.95],
      [1520, 340, 1],
      [1960, 280, 0.92],
      [2450, 360, 1.04],
      [2860, 300, 0.96],
      [320, 760, 0.95],
      [610, 960, 1],
      [1260, 980, 0.92],
      [1880, 920, 1.02],
      [2220, 1080, 1],
      [2750, 980, 0.94],
      [420, 1380, 1],
      [1160, 1500, 1.05],
      [1720, 1500, 0.92],
      [2320, 1460, 1],
      [2940, 1420, 0.94],
      [760, 1880, 0.96],
      [1480, 1880, 1],
      [2080, 1900, 0.9],
      [2740, 1860, 1.02],
    ];

    graves.forEach(([x, y, scale]) => this.addGrave(x, y, scale));
  }

  createMilitaryBase() {
    const x = 3380;
    const y = 760;
    const width = 520;
    const height = 360;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const wallThickness = 14;
    const doorWidth = 120;
    const doorY = y + halfHeight - wallThickness / 2;
    const leftGateWidth = (width - doorWidth) / 2;
    const leftGateCenterX = x - doorWidth / 2 - leftGateWidth / 2;
    const rightGateCenterX = x + doorWidth / 2 + leftGateWidth / 2;

    const floor = this.add.graphics().setDepth(1.8);
    floor.fillStyle(0x4d594c, 0.55);
    floor.fillRect(x - halfWidth + 10, y - halfHeight + 10, width - 20, height - 20);
    floor.lineStyle(3, 0x69756a, 0.35);
    floor.strokeRect(x - halfWidth + 18, y - halfHeight + 18, width - 36, height - 36);

    const roomLines = this.add.graphics().setDepth(2);
    roomLines.lineStyle(4, 0x8b988c, 0.8);
    roomLines.lineBetween(x - 40, y - halfHeight + 14, x - 40, y + 20);
    roomLines.lineBetween(x + 70, y - 28, x + halfWidth - 24, y - 28);
    roomLines.lineBetween(x + 70, y + 52, x + halfWidth - 24, y + 52);

    const roof = this.add.graphics().setDepth(5);
    roof.fillStyle(0x5c665d, 1);
    roof.fillRect(x - halfWidth, y - halfHeight, width, height);
    roof.lineStyle(6, 0x2c332d, 1);
    roof.strokeRect(x - halfWidth, y - halfHeight, width, height);
    roof.fillStyle(0x9eb3a0, 0.3);
    roof.fillRect(x - 40, y - halfHeight + 32, 140, 42);
    roof.fillRect(x + 120, y - halfHeight + 92, 110, 38);

    this.addWall(x, y - halfHeight + wallThickness / 2, width, wallThickness);
    this.addWall(x - halfWidth + wallThickness / 2, y, wallThickness, height);
    this.addWall(x + halfWidth - wallThickness / 2, y, wallThickness, height);
    this.addWall(leftGateCenterX, doorY, leftGateWidth, wallThickness);
    this.addWall(rightGateCenterX, doorY, leftGateWidth, wallThickness);
    this.addWall(x - 40, y - halfHeight / 2 + 10, wallThickness, halfHeight + 10);
    this.addWall(x + width * 0.23, y - 28, width * 0.28, wallThickness);
    this.addWall(x + width * 0.23, y + 52, width * 0.28, wallThickness);

    const gate = this.obstacles.create(x, doorY, "wall-block");
    gate.setDisplaySize(doorWidth, wallThickness + 6);
    gate.setDepth(3.2);
    gate.refreshBody();
    gate.baseGate = true;
    gate.gateHealth = BASE_GATE_HEALTH;

    const loot = {
      type: "weapon",
      weaponKey: WEAPONS.akm.key,
      label: "Found AKM",
    };
    const lootPosition = new Phaser.Math.Vector2(x + 128, y - 74);
    const lootVisual = this.createHouseLootVisual(loot, lootPosition.x, lootPosition.y);
    lootVisual.setVisible(false);

    this.militaryBase = {
      x,
      y,
      width,
      height,
      roof,
      floor,
      roomLines,
      gate,
      gateBroken: false,
      interiorBounds: new Phaser.Geom.Rectangle(x - halfWidth + 18, y - halfHeight + 18, width - 36, height - 36),
      loot,
      lootVisual,
      lootPosition,
      collected: false,
    };

    this.spawnZombie(x - 100, y - 60, { emerge: false, isAcid: true, maxHealth: 26, moveSpeed: 50 });
    this.spawnZombie(x + 54, y - 20, { emerge: false, isAcid: true, maxHealth: 24, moveSpeed: 48 });
    this.spawnZombie(x + 110, y + 88, { emerge: false, isAcid: true, maxHealth: 24, moveSpeed: 50 });
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

    const guaranteedHouseIndex = Phaser.Math.Between(0, houses.length - 1);
    const guaranteedWeaponKey = Phaser.Utils.Array.GetRandom([WEAPONS.shotgun.key, WEAPONS.pistol.key]);

    houses.forEach(([x, y, width, height], index) =>
      this.addHouse(
        x,
        y,
        width,
        height,
        index === guaranteedHouseIndex
          ? {
              type: "weapon",
              weaponKey: guaranteedWeaponKey,
              label: `Found ${WEAPONS[guaranteedWeaponKey].label}`,
            }
          : null
      )
    );
  }

  addTree(x, y, scale = 1) {
    if (this.isPointInsideAnyHouse(x, y, 42) || this.isPointInsideMilitaryBase(x, y, 48)) {
      return null;
    }

    const tree = this.add.image(x, y, "tree");
    tree.setScale(scale);
    tree.setDepth(3);
    return tree;
  }

  addGrave(x, y, scale = 1) {
    if (this.isPointInsideAnyHouse(x, y, 44) || this.isPointInsideMilitaryBase(x, y, 54)) {
      return null;
    }

    const grave = this.add.image(x, y, "grave");
    grave.setScale(scale);
    grave.setDepth(2.5);
    this.graves.push(grave);
    return grave;
  }

  addHouse(x, y, width, height, forcedLoot = null) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const wallThickness = 12;
    const doorWidth = 108;
    const roofInset = 12;
    const floorTop = y - halfHeight + roofInset;
    const bottomWallWidth = (width - doorWidth) / 2;
    const bottomWallOffset = doorWidth / 2 + bottomWallWidth / 2;
    const interiorLeft = x - halfWidth + 16;
    const interiorTop = floorTop + 8;
    const interiorWidth = width - 32;
    const interiorHeight = height - roofInset - 24;

    const loot = forcedLoot ?? this.rollHouseLoot();
    const lootX = x + 68;
    const lootY = floorTop + 104;
    const lootVisual = this.createHouseLootVisual(loot, lootX, lootY);
    const roomLines = this.add.graphics().setDepth(2.1);
    roomLines.lineStyle(4, 0x7a858d, 0.9);
    roomLines.strokeRect(interiorLeft, interiorTop, interiorWidth, interiorHeight);

    const partitionX = x - width * 0.14;
    const verticalTopHeight = interiorHeight * 0.56;
    const horizontalY = interiorTop + interiorHeight * 0.38;
    const horizontalStartX = partitionX + 54;
    const horizontalEndX = x + halfWidth - 28;

    roomLines.lineStyle(3, 0x8d989f, 0.75);
    roomLines.lineBetween(partitionX, interiorTop, partitionX, interiorTop + verticalTopHeight);
    roomLines.lineBetween(horizontalStartX, horizontalY, horizontalEndX, horizontalY);

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
    this.addWall(partitionX, interiorTop + verticalTopHeight / 2, wallThickness, verticalTopHeight);
    this.addWall(
      (horizontalStartX + horizontalEndX) / 2,
      horizontalY,
      horizontalEndX - horizontalStartX,
      wallThickness
    );

    this.houses.push({
      x,
      y,
      width,
      height,
      interiorBounds: new Phaser.Geom.Rectangle(interiorLeft, interiorTop, interiorWidth, interiorHeight),
      roof,
      roomLines,
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

    if (loot.type === "weapon" && loot.weaponKey === WEAPONS.akm.key) {
      visual.lineStyle(6, 0x23282b, 1);
      visual.lineBetween(x - 24, y - 4, x + 22, y - 4);
      visual.lineStyle(4, 0x3e474d, 1);
      visual.lineBetween(x - 22, y - 6, x + 20, y - 6);
      visual.lineStyle(5, 0x6d4c2f, 1);
      visual.lineBetween(x - 12, y + 1, x - 2, y + 16);
      visual.lineStyle(4, 0x1e2327, 1);
      visual.lineBetween(x + 2, y + 2, x + 6, y + 14);
      return visual;
    }

    if (loot.type === "weapon" && loot.weaponKey === WEAPONS.grenade.key) {
      visual.fillStyle(0x7b7b35, 1);
      visual.lineStyle(4, 0x101316, 1);
      visual.fillEllipse(x, y + 2, 20, 26);
      visual.strokeEllipse(x, y + 2, 20, 26);
      visual.lineBetween(x - 5, y - 2, x + 5, y - 2);
      visual.lineBetween(x - 6, y + 4, x + 6, y + 4);
      visual.lineBetween(x - 4, y + 10, x + 4, y + 10);
      visual.strokeCircle(x + 7, y - 8, 5);
      visual.lineBetween(x + 10, y - 5, x + 18, y + 9);
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

  isPointInsideMilitaryBase(x, y, padding = 0) {
    if (!this.militaryBase) {
      return false;
    }

    const base = this.militaryBase;
    const bounds = new Phaser.Geom.Rectangle(
      base.x - base.width / 2 - padding,
      base.y - base.height / 2 - padding,
      base.width + padding * 2,
      base.height + padding * 2
    );
    return Phaser.Geom.Rectangle.Contains(bounds, x, y);
  }

  getHouseAtPoint(x, y) {
    return this.houses.find((house) => Phaser.Geom.Rectangle.Contains(house.interiorBounds, x, y)) ?? null;
  }

  canZombiesEnterHouse(house) {
    if (!house || !this.playerHouseStay) {
      return false;
    }

    return this.playerHouseStay.house === house && this.time.now - this.playerHouseStay.enteredAt >= HOUSE_BREACH_DELAY_MS;
  }

  addWall(x, y, width, height) {
    const wall = this.obstacles.create(x, y, "wall-block");
    wall.setDisplaySize(width, height);
    wall.setDepth(3);
    wall.refreshBody();
    return wall;
  }

  createZombies() {
    for (let i = 0; i < ZOMBIE_COUNT; i += 1) {
      const grave = this.graves[i % this.graves.length];
      const x = grave ? grave.x + Phaser.Math.Between(-10, 10) : 820 + i * 24;
      const y = grave ? grave.y + Phaser.Math.Between(-10, 10) : 400 + i * 18;
      this.spawnZombie(x, y, {
        emerge: false,
        isFast: i % 7 === 0,
        isBlue: i % 9 === 0,
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
    this.reloadText = this.add.text(20, 194, "1 Bat  2 Shotgun  3 Pistol  4 AKM  5 Grenade  E Take  R Reload", {
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

  createMobileControls() {
    this.isMobile = this.sys.game.device.input.touch;
    this.mobile = {
      movePointerId: null,
      aimPointerId: null,
      moveVector: new Phaser.Math.Vector2(),
      firing: false,
      aimScreenX: this.scale.width * 0.76,
      aimScreenY: this.scale.height * 0.54,
      blockedZones: [],
    };

    if (!this.isMobile) {
      return;
    }

    this.mobileUi = this.add.container(0, 0).setScrollFactor(0).setDepth(60);

    const leftBaseX = 112;
    const leftBaseY = this.scale.height - 108;

    const moveBase = this.add.circle(leftBaseX, leftBaseY, 54, 0x0d1820, 0.34).setStrokeStyle(3, 0x5a7a90, 0.55);
    const moveKnob = this.add.circle(leftBaseX, leftBaseY, 24, 0xc7d6e0, 0.38).setStrokeStyle(2, 0xe9f5ff, 0.6);
    const moveZone = this.add.zone(leftBaseX, leftBaseY, 144, 144).setInteractive();
    this.mobile.blockedZones.push(new Phaser.Geom.Rectangle(leftBaseX - 78, leftBaseY - 78, 156, 156));

    const reloadButton = this.createMobileButton(710, this.scale.height - 76, 84, 38, "R", () => this.reloadWeapon());
    const interactButton = this.createMobileButton(804, this.scale.height - 76, 84, 38, "E", () => this.tryPickupCurrentHouseLoot());
    const rangeButton = this.createMobileButton(898, this.scale.height - 76, 84, 38, "RNG", () => this.cycleShotRange());

    const batButton = this.createMobileButton(360, this.scale.height - 54, 72, 34, "BAT", () => this.selectWeapon(WEAPONS.bat.key));
    const shotgunButton = this.createMobileButton(440, this.scale.height - 54, 72, 34, "SG", () => this.selectWeapon(WEAPONS.shotgun.key));
    const pistolButton = this.createMobileButton(520, this.scale.height - 54, 72, 34, "PI", () => this.selectWeapon(WEAPONS.pistol.key));
    const akmButton = this.createMobileButton(600, this.scale.height - 54, 72, 34, "AK", () => this.selectWeapon(WEAPONS.akm.key));
    const grenadeButton = this.createMobileButton(680, this.scale.height - 54, 72, 34, "GR", () => this.selectWeapon(WEAPONS.grenade.key));

    moveZone.on("pointerdown", (pointer) => {
      this.mobile.movePointerId = pointer.id;
      this.updateMobileMove(pointer, leftBaseX, leftBaseY, moveKnob);
    });

    this.input.on("pointermove", (pointer) => {
      if (pointer.id === this.mobile.movePointerId) {
        this.updateMobileMove(pointer, leftBaseX, leftBaseY, moveKnob);
      }
      if (pointer.id === this.mobile.aimPointerId) {
        this.updateMobileAim(pointer);
      }
    });

    this.input.on("pointerup", (pointer) => {
      if (pointer.id === this.mobile.movePointerId) {
        this.mobile.movePointerId = null;
        this.mobile.moveVector.set(0, 0);
        moveKnob.setPosition(leftBaseX, leftBaseY);
      }
      if (pointer.id === this.mobile.aimPointerId) {
        this.mobile.aimPointerId = null;
        this.mobile.firing = false;
      }
    });

    this.mobileUi.add([
      moveBase,
      moveKnob,
      moveZone,
      reloadButton,
      interactButton,
      rangeButton,
      batButton,
      shotgunButton,
      pistolButton,
      akmButton,
      grenadeButton,
    ]);
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

  createMobileButton(x, y, width, height, label, onClick) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1820, 0.86);
    bg.lineStyle(2, 0x4f7388, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "16px",
      color: "#f0ead2",
    }).setOrigin(0.5);
    const hit = this.add.zone(0, 0, width, height).setInteractive();
    hit.on("pointerdown", () => {
      if (this.isPaused) {
        return;
      }
      container.setScale(0.96);
      onClick();
    });
    hit.on("pointerup", () => container.setScale(1));
    hit.on("pointerout", () => container.setScale(1));
    container.add([bg, text, hit]);
    if (this.mobile) {
      this.mobile.blockedZones.push(new Phaser.Geom.Rectangle(x - width / 2 - 6, y - height / 2 - 6, width + 12, height + 12));
    }
    return container;
  }

  updateMobileMove(pointer, baseX, baseY, knob) {
    const dx = pointer.x - baseX;
    const dy = pointer.y - baseY;
    const vector = new Phaser.Math.Vector2(dx, dy);
    const maxRadius = 40;
    if (vector.length() > maxRadius) {
      vector.setLength(maxRadius);
    }
    knob.setPosition(baseX + vector.x, baseY + vector.y);
    this.mobile.moveVector.set(vector.x / maxRadius, vector.y / maxRadius);
  }

  updateMobileAim(pointer) {
    this.mobile.aimScreenX = pointer.x;
    this.mobile.aimScreenY = pointer.y;
  }

  isPointerOnMobileUi(pointer) {
    if (!this.isMobile || !this.mobile) {
      return false;
    }

    return this.mobile.blockedZones.some((zone) => Phaser.Geom.Rectangle.Contains(zone, pointer.x, pointer.y));
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
    this.cameras.main.setZoom(this.isMobile ? 1.05 : 0.82);
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys("W,A,S,D,R,E,P,ESC,ONE,TWO,THREE,FOUR,FIVE");
    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }
    this.game.canvas.oncontextmenu = (event) => event.preventDefault();
    this.input.on("pointerdown", (pointer) => {
      if (this.isPaused) {
        return;
      }

      if (this.isMobile && !this.isPointerOnMobileUi(pointer) && pointer.id !== this.mobile.movePointerId) {
        this.mobile.aimPointerId = pointer.id;
        this.mobile.firing = true;
        this.updateMobileAim(pointer);

        if (this.canCurrentWeaponFire()) {
          const aimPoint = this.getAimWorldPoint();
          this.useCurrentWeapon({
            worldX: aimPoint.x,
            worldY: aimPoint.y,
          });
        } else {
          this.handleEmptyTrigger();
        }
        return;
      }

      if (pointer.rightButtonDown()) {
        this.cycleShotRange();
      }
    });
    this.input.keyboard.on("keydown-R", () => this.reloadWeapon());
    this.input.keyboard.on("keydown-E", () => this.tryPickupCurrentHouseLoot());
    this.input.keyboard.on("keydown-P", () => this.toggleDevConsole());
    this.input.keyboard.on("keydown-ESC", () => this.togglePauseMenu());
    this.input.keyboard.on("keydown-ONE", () => this.selectWeapon(WEAPONS.bat.key));
    this.input.keyboard.on("keydown-TWO", () => this.selectWeapon(WEAPONS.shotgun.key));
    this.input.keyboard.on("keydown-THREE", () => this.selectWeapon(WEAPONS.pistol.key));
    this.input.keyboard.on("keydown-FOUR", () => this.selectWeapon(WEAPONS.akm.key));
    this.input.keyboard.on("keydown-FIVE", () => this.selectWeapon(WEAPONS.grenade.key));
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
    this.updateMilitaryBase();
    this.updateAcidPools();
    this.updateExtractionObjective();
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

    if (this.isMobile && this.mobile) {
      moveX += this.mobile.moveVector.x;
      moveY += this.mobile.moveVector.y;
    }

    const direction = new Phaser.Math.Vector2(moveX, moveY);
    const speedMultiplier =
      this.player.speedBoostUntil && this.time.now < this.player.speedBoostUntil
        ? ENERGY_SPEED_MULTIPLIER
        : 1;
    if (direction.lengthSq() > 0) {
      direction.normalize().scale(PLAYER_SPEED * speedMultiplier);
    }

    this.player.setVelocity(direction.x, direction.y);
  }

  updateAim() {
    const worldPoint = this.getAimWorldPoint();
    this.player.facingAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      worldPoint.x,
      worldPoint.y
    );
  }

  getAimWorldPoint() {
    if (this.isMobile && this.mobile) {
      return this.cameras.main.getWorldPoint(this.mobile.aimScreenX, this.mobile.aimScreenY);
    }
    return this.input.activePointer.positionToCamera(this.cameras.main);
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
      const grenadeX = originX + Math.cos(angle) * 16;
      const grenadeY = originY + Math.sin(angle) * 16;
      this.playerGun.fillStyle(0x7b7b35, 1);
      this.playerGun.lineStyle(4, 0x101316, 1);
      this.playerGun.fillEllipse(grenadeX, grenadeY, 18, 24);
      this.playerGun.strokeEllipse(grenadeX, grenadeY, 18, 24);
      this.playerGun.lineBetween(grenadeX - 4, grenadeY - 5, grenadeX + 4, grenadeY - 5);
      this.playerGun.lineBetween(grenadeX - 5, grenadeY + 1, grenadeX + 5, grenadeY + 1);
      this.playerGun.lineBetween(grenadeX - 3, grenadeY + 7, grenadeX + 3, grenadeY + 7);
      this.playerGun.strokeCircle(grenadeX + 6, grenadeY - 10, 4);
      this.playerGun.lineBetween(grenadeX + 8, grenadeY - 7, grenadeX + 16, grenadeY + 8);
      return;
    }
    if (this.player.currentWeapon === WEAPONS.akm.key) {
      const stockBackX = originX - Math.cos(angle) * 24;
      const stockBackY = originY - Math.sin(angle) * 24;
      const receiverBackX = originX - Math.cos(angle) * 2;
      const receiverBackY = originY - Math.sin(angle) * 2;
      const muzzleX = originX + Math.cos(angle) * 46;
      const muzzleY = originY + Math.sin(angle) * 46;
      const downAngle = angle + Math.PI / 2;
      const upAngle = angle - Math.PI / 2;

      this.playerGun.lineStyle(9, 0x202529, 1);
      this.playerGun.lineBetween(receiverBackX, receiverBackY, muzzleX, muzzleY);
      this.playerGun.lineStyle(3, 0x3d464c, 1);
      this.playerGun.lineBetween(receiverBackX, receiverBackY, muzzleX, muzzleY);
      this.playerGun.lineStyle(8, 0x2b2017, 1);
      this.playerGun.lineBetween(stockBackX, stockBackY, receiverBackX, receiverBackY);
      this.playerGun.lineStyle(3, 0x6f543c, 1);
      this.playerGun.lineBetween(stockBackX, stockBackY, receiverBackX, receiverBackY);
      this.playerGun.lineStyle(4, 0x22272b, 1);
      this.playerGun.lineBetween(
        originX + Math.cos(angle) * 4 + Math.cos(downAngle) * 3,
        originY + Math.sin(angle) * 4 + Math.sin(downAngle) * 3,
        originX + Math.cos(angle) * 9 + Math.cos(downAngle) * 12,
        originY + Math.sin(angle) * 9 + Math.sin(downAngle) * 12
      );
      this.playerGun.lineStyle(5, 0x1d2327, 1);
      this.playerGun.lineBetween(
        muzzleX - Math.cos(angle) * 20 + Math.cos(downAngle) * 4,
        muzzleY - Math.sin(angle) * 20 + Math.sin(downAngle) * 4,
        muzzleX - Math.cos(angle) * 6 + Math.cos(downAngle) * 4,
        muzzleY - Math.sin(angle) * 6 + Math.sin(downAngle) * 4
      );
      this.playerGun.lineStyle(2, 0x515a61, 1);
      this.playerGun.lineBetween(
        receiverBackX + Math.cos(upAngle) * 4,
        receiverBackY + Math.sin(upAngle) * 4,
        receiverBackX + Math.cos(upAngle) * 8,
        receiverBackY + Math.sin(upAngle) * 8
      );
      this.playerGun.fillStyle(0x111417, 1);
      this.playerGun.fillCircle(muzzleX, muzzleY, 2.5);
      return;
    }
    if (this.player.currentWeapon === WEAPONS.shotgun.key) {
      const stockBackX = originX - Math.cos(angle) * 26;
      const stockBackY = originY - Math.sin(angle) * 26;
      const receiverBackX = originX - Math.cos(angle) * 2;
      const receiverBackY = originY - Math.sin(angle) * 2;
      const muzzleX = originX + Math.cos(angle) * 54;
      const muzzleY = originY + Math.sin(angle) * 54;
      const foreFrontX = originX + Math.cos(angle) * 26;
      const foreFrontY = originY + Math.sin(angle) * 26;
      const foreBackX = originX + Math.cos(angle) * 8;
      const foreBackY = originY + Math.sin(angle) * 8;
      const downAngle = angle + Math.PI / 2;
      const upAngle = angle - Math.PI / 2;
      const gripRootX = originX - Math.cos(angle) * 10;
      const gripRootY = originY - Math.sin(angle) * 10;

      this.playerGun.lineStyle(11, 0x15191c, 1);
      this.playerGun.lineBetween(receiverBackX, receiverBackY, muzzleX, muzzleY);
      this.playerGun.lineStyle(3, 0x2f3539, 1);
      this.playerGun.lineBetween(receiverBackX, receiverBackY, muzzleX, muzzleY);

      this.playerGun.lineStyle(8, 0x0f1316, 1);
      this.playerGun.lineBetween(
        receiverBackX + Math.cos(downAngle) * 5,
        receiverBackY + Math.sin(downAngle) * 5,
        muzzleX + Math.cos(downAngle) * 5,
        muzzleY + Math.sin(downAngle) * 5
      );

      this.playerGun.lineStyle(15, 0x24292d, 1);
      this.playerGun.lineBetween(foreBackX, foreBackY, foreFrontX, foreFrontY);
      this.playerGun.lineStyle(3, 0x3b4247, 1);
      this.playerGun.lineBetween(foreBackX, foreBackY, foreFrontX, foreFrontY);

      for (let i = 0; i < 7; i += 1) {
        const notchX = foreFrontX - Math.cos(angle) * (3 + i * 3.4);
        const notchY = foreFrontY - Math.sin(angle) * (3 + i * 3.4);
        this.playerGun.lineStyle(2, 0x32383d, 1);
        this.playerGun.lineBetween(
          notchX + Math.cos(downAngle) * 5,
          notchY + Math.sin(downAngle) * 5,
          notchX + Math.cos(upAngle) * 5,
          notchY + Math.sin(upAngle) * 5
        );
      }

      this.playerGun.lineStyle(15, 0x1a1f23, 1);
      this.playerGun.lineBetween(stockBackX, stockBackY, receiverBackX, receiverBackY);
      this.playerGun.lineStyle(4, 0x31373c, 1);
      this.playerGun.lineBetween(stockBackX, stockBackY, receiverBackX, receiverBackY);

      this.playerGun.lineStyle(11, 0x171b1f, 1);
      this.playerGun.lineBetween(
        gripRootX + Math.cos(downAngle) * 6,
        gripRootY + Math.sin(downAngle) * 6,
        gripRootX + Math.cos(downAngle) * 23,
        gripRootY + Math.sin(downAngle) * 23
      );
      this.playerGun.lineStyle(3, 0x2d3337, 1);
      this.playerGun.lineBetween(
        gripRootX + Math.cos(downAngle) * 6,
        gripRootY + Math.sin(downAngle) * 6,
        gripRootX + Math.cos(downAngle) * 23,
        gripRootY + Math.sin(downAngle) * 23
      );

      this.playerGun.lineStyle(2, 0x3e4448, 1);
      this.playerGun.lineBetween(
        receiverBackX + Math.cos(upAngle) * 4,
        receiverBackY + Math.sin(upAngle) * 4,
        receiverBackX + Math.cos(upAngle) * 10,
        receiverBackY + Math.sin(upAngle) * 10
      );

      this.playerGun.lineStyle(2, 0x30363a, 1);
      this.playerGun.lineBetween(
        receiverBackX + Math.cos(angle) * 5 + Math.cos(upAngle) * 4,
        receiverBackY + Math.sin(angle) * 5 + Math.sin(upAngle) * 4,
        receiverBackX + Math.cos(angle) * 16 + Math.cos(upAngle) * 4,
        receiverBackY + Math.sin(angle) * 16 + Math.sin(upAngle) * 4
      );

      this.playerGun.fillStyle(0x0d1012, 1);
      this.playerGun.fillCircle(muzzleX, muzzleY, 3);
      return;
    }
    if (this.player.currentWeapon === WEAPONS.pistol.key) {
      const gripBackX = originX - Math.cos(angle) * 11;
      const gripBackY = originY - Math.sin(angle) * 11;
      const slideBackX = originX - Math.cos(angle) * 1;
      const slideBackY = originY - Math.sin(angle) * 1;
      const muzzleX = originX + Math.cos(angle) * 31;
      const muzzleY = originY + Math.sin(angle) * 31;
      const downAngle = angle + Math.PI / 2;
      const upAngle = angle - Math.PI / 2;
      const sightX = muzzleX - Math.cos(angle) * 8;
      const sightY = muzzleY - Math.sin(angle) * 8;

      this.playerGun.lineStyle(10, 0x22272b, 1);
      this.playerGun.lineBetween(slideBackX, slideBackY, muzzleX, muzzleY);
      this.playerGun.lineStyle(3, 0x3a4045, 1);
      this.playerGun.lineBetween(slideBackX, slideBackY, muzzleX, muzzleY);

      for (let i = 0; i < 4; i += 1) {
        const notchX = muzzleX - Math.cos(angle) * (9 + i * 4);
        const notchY = muzzleY - Math.sin(angle) * (7 + i * 4);
        this.playerGun.lineStyle(2, 0x454c51, 1);
        this.playerGun.lineBetween(
          notchX + Math.cos(downAngle) * 3.5,
          notchY + Math.sin(downAngle) * 3.5,
          notchX + Math.cos(upAngle) * 3.5,
          notchY + Math.sin(upAngle) * 3.5
        );
      }

      this.playerGun.lineStyle(11, 0x171b1f, 1);
      this.playerGun.lineBetween(
        gripBackX + Math.cos(downAngle) * 5,
        gripBackY + Math.sin(downAngle) * 5,
        gripBackX + Math.cos(downAngle) * 20,
        gripBackY + Math.sin(downAngle) * 20
      );
      this.playerGun.lineStyle(3, 0x343a3f, 1);
      this.playerGun.lineBetween(
        gripBackX + Math.cos(downAngle) * 5,
        gripBackY + Math.sin(downAngle) * 5,
        gripBackX + Math.cos(downAngle) * 20,
        gripBackY + Math.sin(downAngle) * 20
      );

      this.playerGun.lineStyle(2, 0x111418, 1);
      this.playerGun.lineBetween(
        gripBackX + Math.cos(downAngle) * 6,
        gripBackY + Math.sin(downAngle) * 4,
        gripBackX + Math.cos(downAngle) * 13,
        gripBackY + Math.sin(downAngle) * 16
      );

      this.playerGun.lineStyle(2, 0x111418, 1);
      this.playerGun.lineBetween(
        originX - Math.cos(angle) * 1 + Math.cos(downAngle) * 7,
        originY - Math.sin(angle) * 1 + Math.sin(downAngle) * 7,
        originX + Math.cos(downAngle) * 12,
        originY + Math.sin(downAngle) * 12
      );

      this.playerGun.lineStyle(3, 0x191d20, 1);
      this.playerGun.lineBetween(
        gripBackX + Math.cos(upAngle) * 3,
        gripBackY + Math.sin(upAngle) * 3,
        gripBackX + Math.cos(upAngle) * 8,
        gripBackY + Math.sin(upAngle) * 8
      );

      this.playerGun.lineStyle(2, 0x5d6468, 1);
      this.playerGun.lineBetween(
        sightX + Math.cos(upAngle) * 2.5,
        sightY + Math.sin(upAngle) * 2.5,
        sightX + Math.cos(upAngle) * 5.5,
        sightY + Math.sin(upAngle) * 5.5
      );

      this.playerGun.fillStyle(0x0f1215, 1);
      this.playerGun.fillCircle(slideBackX + Math.cos(upAngle) * 1.2, slideBackY + Math.sin(upAngle) * 1.2, 2.2);
      this.playerGun.fillStyle(0x0d1012, 1);
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
    this.playerHealthLabel.setText(`${this.formatHealthValue(this.player.healthPoints)}/${PLAYER_MAX_HEALTH}`);
  }

  updateContinuousFire() {
    const pointer = this.input.activePointer;
    const mobileFiring = this.isMobile && this.mobile && this.mobile.firing;
    if ((!pointer || !pointer.leftButtonDown()) && !mobileFiring) {
      return;
    }

    if (!this.canCurrentWeaponFire()) {
      this.handleEmptyTrigger();
      return;
    }

    const aimPoint = this.getAimWorldPoint();
    this.useCurrentWeapon({
      worldX: aimPoint.x,
      worldY: aimPoint.y,
    });
  }

  updateUi() {
    const bossSecondsLeft = this.bossTimer
      ? Math.max(0, Math.ceil(this.bossTimer.getRemaining() / 1000))
      : Math.ceil(this.settings.bossSpawnIntervalMs / 1000);
    const survivalSecondsLeft = Math.max(
      0,
      Math.ceil((SURVIVAL_GOAL_MS - (this.time.now - this.roundStartedAt)) / 1000)
    );
    const shotgun = this.player.weapons.shotgun;
    const pistol = this.player.weapons.pistol;
    const akm = this.player.weapons.akm;
    const grenade = this.player.weapons.grenade;
    const extractionHoldLeft = this.extractionHoldStartedAt
      ? Math.max(0, Math.ceil((EXTRACTION_HOLD_MS - (this.time.now - this.extractionHoldStartedAt)) / 1000))
      : EXTRACTION_HOLD_MS / 1000;
    this.healthText.setText(`HP: ${this.formatHealthValue(this.player.healthPoints)}/${PLAYER_MAX_HEALTH}`);
    this.weaponText.setText(`Weapon: ${WEAPONS[this.player.currentWeapon].label}`);
    this.ammoText.setText(
      `BT ready  SG ${this.formatRangedAmmo(shotgun)}  PI ${this.formatRangedAmmo(pistol)}  AK ${this.formatRangedAmmo(akm)}  GR ${this.formatGrenadeAmmo(grenade)}`
    );
    this.killsText.setText(`Zombies down: ${this.kills}`);
    this.bossText.setText(
      this.extractionReady
        ? `SOS: hold ${extractionHoldLeft}s  Boss in: ${bossSecondsLeft}s`
        : `Evac in: ${survivalSecondsLeft}s  Boss in: ${bossSecondsLeft}s`
    );
    this.rangeText.setText(
      this.extractionReady
        ? `Reach SOS and stand still-ish for extraction  Range: ${this.getCurrentRangePreset().label}`
        : `Range: ${this.getCurrentRangePreset().label} (RMB)  Base: break gate with bat`
    );
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

    if (this.player.currentWeapon === WEAPONS.akm.key) {
      this.fireAkm(pointer);
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

    if (this.player.currentWeapon === WEAPONS.akm.key) {
      return this.player.weapons.akm.unlocked && this.player.weapons.akm.clipAmmo > 0;
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

    this.tryDamageBaseGate(swingAngle);
  }

  tryDamageBaseGate(swingAngle) {
    if (!this.militaryBase || this.militaryBase.gateBroken || !this.militaryBase.gate?.active) {
      return;
    }

    const gate = this.militaryBase.gate;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, gate.x, gate.y);
    if (distance > BAT_RADIUS) {
      return;
    }

    const angleToGate = Phaser.Math.Angle.Between(this.player.x, this.player.y, gate.x, gate.y);
    const angleDelta = Phaser.Math.Angle.Wrap(angleToGate - swingAngle);
    if (Math.abs(angleDelta) > BAT_ARC / 2) {
      return;
    }

    gate.gateHealth -= BAT_DAMAGE;
    this.flashUi("#f0d28f");
    if (gate.gateHealth <= 0) {
      this.militaryBase.gateBroken = true;
      gate.destroy();
      this.showHouseLootText(this.militaryBase.x, this.militaryBase.y + this.militaryBase.height / 2 - 18, "Base gate broken");
    }
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

  fireAkm(pointer) {
    if (this.isRoundFinished || this.isPaused) {
      return;
    }

    if (this.time.now - this.lastShotAt < AKM_COOLDOWN_MS) {
      return;
    }

    if (!this.player.weapons.akm.unlocked || this.player.weapons.akm.clipAmmo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    this.lastShotAt = this.time.now;
    this.player.weapons.akm.clipAmmo -= 1;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const spreadAngle = angle + Phaser.Math.FloatBetween(-0.05, 0.05);
    const rangeDistance = Math.round(this.scale.width * 0.6);
    const shotLifetimeMs = Math.round((rangeDistance / 1400) * 1000);
    this.spawnProjectileVisual("rifle-bullet", spreadAngle, rangeDistance, shotLifetimeMs, 0.15);
    this.applySingleBulletDamage(spreadAngle, rangeDistance, AKM_DAMAGE, 12);
    this.showMuzzleFlash(spreadAngle);
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
    const loadedAmmo =
      this.player.currentWeapon === WEAPONS.shotgun.key
        ? Math.min(1, neededAmmo, weapon.reserveAmmo)
        : Math.min(neededAmmo, weapon.reserveAmmo);
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

    this.extractionTimer = this.time.addEvent({
      delay: SURVIVAL_GOAL_MS,
      loop: false,
      callback: () => {
        if (!this.isRoundFinished) {
          this.extractionReady = true;
          this.extractionHoldStartedAt = 0;
          this.showHouseLootText(EXTRACTION_POINT.x, EXTRACTION_POINT.y - 88, "Reach SOS and hold");
          this.flashUi("#8fe7ff");
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

  spawnAcidPool(x, y) {
    const pool = this.add.graphics().setDepth(2.4);
    pool.fillStyle(0x9be94e, 0.32);
    pool.lineStyle(3, 0x5e9f2c, 0.8);
    pool.fillEllipse(x, y + 10, 62, 34);
    pool.strokeEllipse(x, y + 10, 62, 34);

    this.acidPools.push({
      x,
      y: y + 10,
      radius: 34,
      graphics: pool,
      expiresAt: this.time.now + ACID_POOL_LIFETIME_MS,
      nextTickAt: this.time.now + ACID_POOL_TICK_MS,
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
    } else if (pickup.pickupType === "medkit") {
      player.healthPoints = Math.min(PLAYER_MAX_HEALTH, player.healthPoints + pickup.ammoAmount);
    } else if (pickup.pickupType === "energyDrink") {
      player.speedBoostUntil = this.time.now + ENERGY_BOOST_MS;
    }
    pickup.consume();
    this.flashUi(pickup.pickupType === "medkit" ? "#97efaa" : pickup.pickupType === "energyDrink" ? "#8fe7ff" : "#f9d27b");

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
    const currentHouse = this.getHouseAtPoint(this.player.x, this.player.y);
    if (!currentHouse) {
      this.playerHouseStay = null;
    } else if (!this.playerHouseStay || this.playerHouseStay.house !== currentHouse) {
      this.playerHouseStay = {
        house: currentHouse,
        enteredAt: this.time.now,
      };
    }

    this.houses.forEach((house) => {
      const isInside = Phaser.Geom.Rectangle.Contains(house.interiorBounds, this.player.x, this.player.y);
      house.roof.setAlpha(isInside ? 0.16 : 1);
      if (house.roomLines) {
        house.roomLines.setAlpha(isInside ? 1 : 0.22);
      }

      if (house.lootVisual) {
        house.lootVisual.setVisible(!house.collected && isInside);
      }

    });
  }

  updateMilitaryBase() {
    if (!this.militaryBase) {
      return;
    }

    const base = this.militaryBase;
    const isInside = Phaser.Geom.Rectangle.Contains(base.interiorBounds, this.player.x, this.player.y);
    base.roof.setAlpha(isInside ? 0.18 : 1);
    base.roomLines.setAlpha(isInside ? 1 : 0.2);
    if (base.lootVisual) {
      base.lootVisual.setVisible(!base.collected && isInside && base.gateBroken);
    }
  }

  updateAcidPools() {
    if (!this.acidPools.length) {
      return;
    }

    this.acidPools = this.acidPools.filter((pool) => {
      if (!pool || !pool.graphics || !pool.graphics.active) {
        return false;
      }

      if (this.time.now >= pool.expiresAt) {
        pool.graphics.destroy();
        return false;
      }

      if (this.time.now >= pool.nextTickAt) {
        pool.nextTickAt += ACID_POOL_TICK_MS;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pool.x, pool.y);
        if (distance <= pool.radius) {
          this.player.healthPoints = Math.max(0, this.player.healthPoints - ACID_POOL_DAMAGE_PER_TICK);
          this.flashUi("#b4f56d");
          if (this.player.healthPoints <= 0) {
            this.finishRound();
          }
        }
      }

      return true;
    });
  }

  tryPickupCurrentHouseLoot() {
    const currentHouse = this.getHouseAtPoint(this.player.x, this.player.y);
    if (currentHouse && !currentHouse.collected) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        currentHouse.lootPosition.x,
        currentHouse.lootPosition.y
      );
      if (distance <= 82) {
        currentHouse.collected = true;
        this.applyHouseLoot(currentHouse.loot);
        if (currentHouse.lootVisual) {
          currentHouse.lootVisual.destroy();
          currentHouse.lootVisual = null;
        }
        this.showHouseLootText(currentHouse.x, currentHouse.y - currentHouse.height / 2 - 24, currentHouse.loot.label);
        this.flashUi(currentHouse.loot.type === "weapon" ? "#9cd4ff" : "#f9d27b");
        return;
      }
    }

    if (!this.militaryBase || !this.militaryBase.gateBroken || this.militaryBase.collected) {
      return;
    }

    const base = this.militaryBase;
    const isInsideBase = Phaser.Geom.Rectangle.Contains(base.interiorBounds, this.player.x, this.player.y);
    const distanceToLoot = Phaser.Math.Distance.Between(this.player.x, this.player.y, base.lootPosition.x, base.lootPosition.y);
    if (!isInsideBase || distanceToLoot > 88) {
      return;
    }

    base.collected = true;
    this.unlockWeapon(base.loot.weaponKey);
    if (base.lootVisual) {
      base.lootVisual.destroy();
      base.lootVisual = null;
    }
    this.showHouseLootText(base.x, base.y - base.height / 2 - 24, base.loot.label);
    this.flashUi("#9cd4ff");
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

    if (weaponKey === WEAPONS.akm.key) {
      weapon.clipAmmo = AKM_CLIP_SIZE;
      weapon.reserveAmmo += AKM_STARTER_RESERVE;
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

    const playerHouse = this.getHouseAtPoint(player.x, player.y);
    const zombieHouse = this.getHouseAtPoint(zombie.x, zombie.y);
    if (playerHouse && zombieHouse !== playerHouse) {
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
    player.healthPoints = Math.max(0, player.healthPoints - this.getZombieAttackDamage());
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
    if (this.extractionTimer) {
      this.extractionTimer.remove(false);
      this.extractionTimer = null;
    }
    this.scene.start("ResultScene", {
      kills: this.kills,
      survivedSeconds: Math.floor((this.time.now - this.roundStartedAt) / 1000),
      bossesSpawned: this.bossesSpawned,
    });
  }

  getZombieAttackDamage() {
    const progress = Phaser.Math.Clamp((this.time.now - this.roundStartedAt) / SURVIVAL_GOAL_MS, 0, 1);
    return Math.round(
      Phaser.Math.Linear(ZOMBIE_ATTACK_DAMAGE_MIN, ZOMBIE_ATTACK_DAMAGE_MAX, progress)
    );
  }

  updateExtractionObjective() {
    if (!this.extractionReady || this.isRoundFinished) {
      return;
    }

    const distanceToExtraction = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      EXTRACTION_POINT.x,
      EXTRACTION_POINT.y
    );

    if (distanceToExtraction > EXTRACTION_RADIUS) {
      this.extractionHoldStartedAt = 0;
      return;
    }

    if (!this.extractionHoldStartedAt) {
      this.extractionHoldStartedAt = this.time.now;
      return;
    }

    if (this.time.now - this.extractionHoldStartedAt >= EXTRACTION_HOLD_MS) {
      this.startExtractionSequence();
    }
  }

  startExtractionSequence() {
    if (this.isRoundFinished) {
      return;
    }

    this.isRoundFinished = true;
    this.clearPauseState();
    this.player.setVelocity(0, 0);
    this.zombies.getChildren().forEach((zombie) => {
      if (zombie && zombie.active) {
        zombie.setVelocity(0, 0);
        zombie.canMove = false;
      }
    });
    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
      this.spawnTimer = null;
    }
    if (this.bossTimer) {
      this.bossTimer.remove(false);
      this.bossTimer = null;
    }
    if (this.extractionTimer) {
      this.extractionTimer.remove(false);
      this.extractionTimer = null;
    }

    this.showHouseLootText(EXTRACTION_POINT.x, EXTRACTION_POINT.y - 88, "Helicopter inbound");
    const helicopter = this.createHelicopter(EXTRACTION_POINT.x - 520, EXTRACTION_POINT.y - 260);

    this.tweens.add({
      targets: helicopter,
      x: EXTRACTION_POINT.x,
      y: EXTRACTION_POINT.y - 28,
      duration: 3200,
      ease: "Sine.Out",
      onComplete: () => {
        if (!this.isSceneActive()) {
          return;
        }
        this.showHouseLootText(EXTRACTION_POINT.x, EXTRACTION_POINT.y - 112, "Evacuated");
        this.time.delayedCall(1200, () => {
          if (!this.isSceneActive()) {
            return;
          }
          helicopter.destroy();
          this.scene.start("ResultScene", {
            kills: this.kills,
            survivedSeconds: Math.floor((this.time.now - this.roundStartedAt) / 1000),
            bossesSpawned: this.bossesSpawned,
            victory: true,
          });
        });
      },
    });
  }

  createHelicopter(x, y) {
    const helicopter = this.add.container(x, y).setDepth(8);
    const body = this.add.graphics();
    body.fillStyle(0x3c4b52, 1);
    body.lineStyle(3, 0x1b2428, 1);
    body.fillRoundedRect(-44, -14, 88, 28, 10);
    body.strokeRoundedRect(-44, -14, 88, 28, 10);
    body.fillStyle(0x86b8d5, 0.9);
    body.fillRoundedRect(-18, -10, 24, 14, 5);
    body.fillStyle(0x2f3b40, 1);
    body.fillTriangle(34, -8, 60, -2, 34, 8);
    body.lineStyle(4, 0x161d20, 1);
    body.lineBetween(-56, -22, 56, -22);
    body.lineBetween(54, 0, 80, 0);
    body.lineBetween(-18, 18, -30, 32);
    body.lineBetween(18, 18, 30, 32);
    body.lineBetween(-36, 32, 36, 32);
    helicopter.add(body);

    const rotor = this.add.graphics();
    rotor.lineStyle(5, 0xdfe7ee, 0.95);
    rotor.lineBetween(-72, 0, 72, 0);
    rotor.setY(-24);
    helicopter.add(rotor);

    this.tweens.add({
      targets: rotor,
      angle: 360,
      duration: 160,
      repeat: -1,
    });

    return helicopter;
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

  handleZombieDefeat(zombie, dropPosition) {
    if (zombie.isBlue) {
      const spawnCount = Phaser.Math.Between(1, 2);
      for (let i = 0; i < spawnCount; i += 1) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(18, 34);
        this.spawnZombie(
          Phaser.Math.Clamp(dropPosition.x + Math.cos(angle) * distance, 64, WORLD_WIDTH - 64),
          Phaser.Math.Clamp(dropPosition.y + Math.sin(angle) * distance, 64, WORLD_HEIGHT - 64),
          {
            emerge: true,
            isSmall: true,
          }
        );
      }
    }

    if (zombie.isSmall) {
      if (Math.random() < SMALL_ZOMBIE_MEDKIT_CHANCE) {
        this.spawnZombieDrop(dropPosition.x, dropPosition.y, "medkit");
      }
      return;
    }

    if (Math.random() < ENERGY_DRINK_CHANCE) {
      this.spawnZombieDrop(dropPosition.x, dropPosition.y, "energyDrink");
      return;
    }

    if (zombie.dropType && zombie.dropType !== "none") {
      this.spawnZombieDrop(dropPosition.x, dropPosition.y, zombie.dropType);
    }
  }

  buildPickupOptions(pickupType) {
    if (pickupType === "energyDrink") {
      return {
        pickupType,
        textureKey: "energy-box",
        iconTextureKey: "energy-icon",
        ammoAmount: 1,
      };
    }

    if (pickupType === "medkit") {
      return {
        pickupType,
        textureKey: "medkit-box",
        iconTextureKey: "medkit-icon",
        ammoAmount: MEDKIT_HEAL_AMOUNT,
      };
    }

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

  formatHealthValue(value) {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
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
    const isBlue = options.isBlue ?? false;
    const isSmall = options.isSmall ?? false;
    const isAcid = options.isAcid ?? false;
    const dropType = isSmall
      ? "none"
      : isAcid
        ? "energyDrink"
      : isFast
        ? (Math.random() < 0.5 ? "pistolAmmo" : "grenade")
        : "shotgunAmmo";
    const zombie = new Zombie(this, x, y, {
      isBoss: options.isBoss ?? false,
      maxHealth: options.maxHealth ?? (isSmall ? 6 : isAcid ? 26 : isBlue ? 22 : options.isBoss ? 140 : 18),
      isFast,
      isBlue,
      isSmall,
      isAcid,
      moveSpeed: options.moveSpeed ?? (isSmall ? 92 : isAcid ? 52 : isFast ? 74 : isBlue ? 54 : undefined),
      tint: options.tint ?? (isSmall ? 0x9fd680 : isAcid ? 0x92e447 : isBlue ? 0x4a8ed9 : isFast ? 0xd58a35 : undefined),
      aggroRadius: this.settings.aggroRadius,
      attackCooldownMs: ZOMBIE_ATTACK_COOLDOWN_MS,
      speedMultiplier: 1,
      dropType,
      scale: options.scale ?? (isSmall ? 0.7 : isAcid ? 1.02 : isBlue ? 1.06 : undefined),
    });
    this.zombies.add(zombie);

    if (options.emerge !== false) {
      zombie.emergeFromGround(options.isBoss ? 700 : isSmall ? 280 : isFast ? 360 : isBlue ? 460 : 420);
    }

    return zombie;
  }

  spawnZombieNearPlayer(isBoss) {
    if (!isBoss && this.zombies.countActive(true) >= MAX_ACTIVE_ZOMBIES) {
      return;
    }

    if (!isBoss && this.graves.length > 0) {
      const grave = Phaser.Utils.Array.GetRandom(this.graves);
      const x = Phaser.Math.Clamp(grave.x + Phaser.Math.Between(-10, 10), 64, WORLD_WIDTH - 64);
      const y = Phaser.Math.Clamp(grave.y + Phaser.Math.Between(-6, 6), 64, WORLD_HEIGHT - 64);
      const isBlue = Math.random() < BLUE_ZOMBIE_CHANCE;
      this.spawnZombie(x, y, {
        emerge: true,
        isBlue,
        isFast: !isBlue && Math.random() < FAST_ZOMBIE_CHANCE,
      });
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
      this.spawnZombie(x, y, {
        emerge: true,
        isBoss: true,
        maxHealth: 140,
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
