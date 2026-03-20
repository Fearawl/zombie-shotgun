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
const ZOMBIE_SPAWN_INTERVAL_MS = 2000;
const ZOMBIE_SPAWN_MIN_RADIUS = 220;
const ZOMBIE_SPAWN_MAX_RADIUS = 360;
const BOSS_SPAWN_INTERVAL_MS = 60000;
const BOSS_HEALTH = 100;
const PELLET_HIT_RADIUS = 22;
const AGGRO_RADIUS = Math.round(960 * 0.1);
const PLAYER_HIT_RADIUS = 34;
const ZOMBIE_ATTACK_DAMAGE = 5;
const ZOMBIE_ATTACK_COOLDOWN_MS = 2000;
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
  }

  create() {
    this.kills = 0;
    this.isRoundFinished = false;
    this.lastShotAt = -SHOT_COOLDOWN_MS;
    this.rangePresetIndex = 1;
    this.bossesSpawned = 0;
    this.roundStartedAt = this.time.now;

    this.physics.world.setBounds(0, 0, 2200, 1600);
    this.cameras.main.setBackgroundColor("#17261b");

    this.drawArena();
    this.createGroups();
    this.createPlayer();
    this.createPickups();
    this.createZombies();
    this.createUi();
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

  setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 2200, 1600);
    this.cameras.main.setZoom(1.05);
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys("W,A,S,D,R");
    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }
    this.game.canvas.oncontextmenu = (event) => event.preventDefault();
    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.tryShoot(pointer);
        return;
      }

      if (pointer.rightButtonDown()) {
        this.cycleShotRange();
      }
    });
    this.input.keyboard.on("keydown-R", () => this.reloadWeapon());
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.pickups, this.handlePickup, undefined, this);
    this.physics.add.overlap(this.player, this.zombies, this.handleZombieAttack, undefined, this);
  }

  setupSpawnTimers() {
    this.spawnTimer = this.time.addEvent({
      delay: ZOMBIE_SPAWN_INTERVAL_MS,
      loop: true,
      callback: () => {
        if (!this.isRoundFinished) {
          this.spawnZombieNearPlayer(false);
        }
      },
    });

    this.bossTimer = this.time.addEvent({
      delay: BOSS_SPAWN_INTERVAL_MS,
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
    if (this.isRoundFinished) {
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
    const bossSecondsLeft = Math.max(0, Math.ceil((this.bossTimer.getRemainingSeconds?.() ?? 0)));
    this.healthText.setText(`HP: ${this.player.healthPoints}/${PLAYER_MAX_HEALTH}`);
    this.ammoText.setText(`Ammo: ${this.player.clipAmmo}/${this.player.reserveAmmo}`);
    this.killsText.setText(`Zombies down: ${this.kills}`);
    this.bossText.setText(`Boss in: ${bossSecondsLeft}s`);
    this.rangeText.setText(`Range: ${this.getCurrentRangePreset().label} (RMB)`);
  }

  tryShoot(pointer) {
    if (this.isRoundFinished) {
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
    if (this.isRoundFinished) {
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
      aggroRadius: AGGRO_RADIUS,
      attackCooldownMs: ZOMBIE_ATTACK_COOLDOWN_MS,
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
}
