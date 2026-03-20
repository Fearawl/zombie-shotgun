export class AmmoPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, options.textureKey ?? "ammo-box");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spawnPoint = new Phaser.Math.Vector2(x, y);
    this.ammoAmount = options.ammoAmount ?? 10;
    this.respawnDelayMs = options.respawnDelayMs ?? 5000;
    this.shouldRespawn = options.shouldRespawn ?? true;
    this.pickupType = options.pickupType ?? "shotgunAmmo";
    this.iconTextureKey = options.iconTextureKey ?? "shell-icon";

    this.setImmovable(true);
    this.body.allowGravity = false;
    this.setDepth(4);

    this.iconLeft = scene.add.image(x - 10, y, this.iconTextureKey).setDepth(5);
    this.iconRight = scene.add.image(x + 10, y, this.iconTextureKey).setDepth(5);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    const bob = Math.sin(time * 0.004 + this.x * 0.01) * 4;
    this.setY(this.spawnPoint.y + bob);
    this.iconLeft.setPosition(this.x - 10, this.y);
    this.iconRight.setPosition(this.x + 10, this.y);
  }

  consume() {
    this.iconLeft.destroy();
    this.iconRight.destroy();
    this.destroy();
  }
}
