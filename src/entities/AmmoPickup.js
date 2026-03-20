export class AmmoPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "ammo-box");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spawnPoint = new Phaser.Math.Vector2(x, y);
    this.ammoAmount = 4;

    this.setImmovable(true);
    this.body.allowGravity = false;
    this.setDepth(4);

    this.shellLeft = scene.add.image(x - 10, y, "shell-icon").setDepth(5);
    this.shellRight = scene.add.image(x + 10, y, "shell-icon").setDepth(5);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    const bob = Math.sin(time * 0.004 + this.x * 0.01) * 4;
    this.setY(this.spawnPoint.y + bob);
    this.shellLeft.setPosition(this.x - 10, this.y);
    this.shellRight.setPosition(this.x + 10, this.y);
  }

  consume() {
    this.shellLeft.destroy();
    this.shellRight.destroy();
    this.destroy();
  }
}
