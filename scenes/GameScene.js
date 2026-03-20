import { AmmoPickup } from "../src/entities/AmmoPickup.js";
import { Zombie } from "../src/entities/Zombie.js";

const ROUND_DURATION_MS = 60000;
const PLAYER_SPEED = 250;
const PLAYER_MAX_AMMO = 8;
const SHOT_DAMAGE = 5;
const SHOT_COOLDOWN_MS = 280;
const SHOT_PELLET_COUNT = 8;
const SHOT_SPREAD = 0.34;
const SHOT_TRAVEL_DISTANCE = Math.round(960 * 0.3);
const SHOT_SPEED = 900;
const SHOT_LIFETIME_MS = Math.round((SHOT_TRAVEL_DISTANCE / SHOT_SPEED) * 1000);
const ZOMBIE_COUNT = 18;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.kills = 0;
    this.lastShotAt = 0;
    this.isRoundFinished = false;
    this.shotSequence = 0;
  }

  create() {
    this.kills = 0;
    this.isRoundFinished = false;
    this.roundEndsAt = this.time.now + ROUND_DURATION_MS;
    this.lastShotAt = -SHOT_COOLDOWN_MS;
    this.shotSequence = 0;

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
  }

  createGroups() {
    this.pellets = this.physics.add.group();
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
    this.player.ammo = PLAYER_MAX_AMMO;
    this.player.facingAngle = 0;

    this.playerShadow = this.add.ellipse(this.player.x + 6, this.player.y + 24, 44, 18, 0x000000, 0.24);
    this.playerGun = this.add.graphics();
  }

  createPickups() {
    const positions = [
      [520, 340],
      [600, 420],
      [470, 500],
    ];

    positions.forEach(([x, y]) => {
      const pickup = new AmmoPickup(this, x, y);
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
      const zombie = new Zombie(this, x + offsetX, y + offsetY);
      this.zombies.add(zombie);
    }
  }

  createUi() {
    this.ui = this.add.container(18, 18).setScrollFactor(0).setDepth(20);

    const panel = this.add.graphics();
    panel.fillStyle(0x09131a, 0.85);
    panel.lineStyle(2, 0x305164, 1);
    panel.fillRoundedRect(0, 0, 248, 118, 16);
    panel.strokeRoundedRect(0, 0, 248, 118, 16);
    this.ui.add(panel);

    this.ammoText = this.add.text(20, 16, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#fce7b4",
    });
    this.killsText = this.add.text(20, 48, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#b9f0c4",
    });
    this.timerText = this.add.text(20, 80, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "20px",
      color: "#b7dfff",
    });

    this.ui.add([this.ammoText, this.killsText, this.timerText]);
    this.updateUi();
  }

  setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 2200, 1600);
    this.cameras.main.setZoom(1.05);
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys("W,A,S,D");
    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.tryShoot(pointer);
      }
    });
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.pickups, this.handlePickup, undefined, this);
    this.physics.add.overlap(this.pellets, this.zombies, this.handlePelletHit, undefined, this);
  }

  update() {
    if (this.isRoundFinished) {
      return;
    }

    this.updatePlayerMovement();
    this.updateAim();
    this.updatePlayerVisuals();
    this.updateUi();

    if (this.time.now >= this.roundEndsAt) {
      this.finishRound();
    }
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
    const secondsLeft = Math.max(0, Math.ceil((this.roundEndsAt - this.time.now) / 1000));
    this.ammoText.setText(`Ammo: ${this.player.ammo}/${PLAYER_MAX_AMMO}`);
    this.killsText.setText(`Zombies down: ${this.kills}`);
    this.timerText.setText(`Time: ${secondsLeft}s`);
  }

  tryShoot(pointer) {
    if (this.isRoundFinished) {
      return;
    }

    if (this.time.now - this.lastShotAt < SHOT_COOLDOWN_MS) {
      return;
    }

    if (this.player.ammo <= 0) {
      this.flashUi("#ff8b7d");
      return;
    }

    this.lastShotAt = this.time.now;
    this.shotSequence += 1;
    this.player.ammo -= 1;

    const targetX = pointer.worldX;
    const targetY = pointer.worldY;
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);

    for (let i = 0; i < SHOT_PELLET_COUNT; i += 1) {
      const t = SHOT_PELLET_COUNT === 1 ? 0.5 : i / (SHOT_PELLET_COUNT - 1);
      const angle = baseAngle + Phaser.Math.Linear(-SHOT_SPREAD, SHOT_SPREAD, t);
      const pellet = this.physics.add.image(
        this.player.x + Math.cos(angle) * 30,
        this.player.y + Math.sin(angle) * 30,
        "pellet"
      );
      pellet.setDepth(5);
      pellet.setVelocity(Math.cos(angle) * SHOT_SPEED, Math.sin(angle) * SHOT_SPEED);
      pellet.body.allowGravity = false;
      pellet.damage = SHOT_DAMAGE;
      pellet.shotId = this.shotSequence;
      this.pellets.add(pellet);

      this.time.delayedCall(SHOT_LIFETIME_MS, () => {
        if (pellet.active) {
          pellet.destroy();
        }
      });
    }

    this.showMuzzleFlash(baseAngle);
    this.cameras.main.shake(65, 0.0025);
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

    const addedAmmo = Math.min(PLAYER_MAX_AMMO - player.ammo, pickup.ammoAmount);
    if (addedAmmo <= 0) {
      return;
    }

    player.ammo += addedAmmo;
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

  handlePelletHit(pellet, zombie) {
    if (!pellet.active || !zombie.active) {
      return;
    }

    if (zombie.lastHitShotId === pellet.shotId) {
      pellet.destroy();
      return;
    }

    zombie.lastHitShotId = pellet.shotId;
    pellet.destroy();
    const died = zombie.takeDamage(pellet.damage);

    if (died) {
      this.kills += 1;
    }
  }

  flashUi(color) {
    const previousColors = [
      this.ammoText.style.color,
      this.killsText.style.color,
      this.timerText.style.color,
    ];

    this.ammoText.setColor(color);
    this.killsText.setColor(color);
    this.timerText.setColor(color);

    this.time.delayedCall(120, () => {
      this.ammoText.setColor(previousColors[0]);
      this.killsText.setColor(previousColors[1]);
      this.timerText.setColor(previousColors[2]);
    });
  }

  finishRound() {
    if (this.isRoundFinished) {
      return;
    }

    this.isRoundFinished = true;
    this.player.setVelocity(0, 0);
    this.scene.start("ResultScene", {
      kills: this.kills,
      elapsedSeconds: 60,
    });
  }

  spawnZombieAmmoDrop(x, y) {
    const pickup = new AmmoPickup(this, x, y, {
      ammoAmount: 2,
      shouldRespawn: false,
    });
    this.pickups.add(pickup);
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
