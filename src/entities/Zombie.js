export class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "zombie-body");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHealth = 10;
    this.healthPoints = 10;
    this.moveSpeed = Phaser.Math.Between(34, 52);
    this.changeDirectionAt = 0;
    this.walkDirection = new Phaser.Math.Vector2(1, 0);
    this.canMove = true;
    this.baseY = y;

    this.setCollideWorldBounds(true);
    this.setBounce(1, 1);
    this.setCircle(16, 4, 4);
    this.setDepth(4);
    this.body.allowGravity = false;

    this.shadow = scene.add.ellipse(this.x + 6, this.y + 20, 42, 16, 0x000000, 0.2).setDepth(3);
    this.healthBar = scene.add.graphics().setDepth(6);

    this.pickNewDirection(0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.canMove) {
      this.setVelocity(0, 0);
      this.shadow.setPosition(this.x + 6, this.y + 18);
      this.drawHealthBar();
      return;
    }

    if (time >= this.changeDirectionAt) {
      this.pickNewDirection(time);
    }

    this.setVelocity(this.walkDirection.x * this.moveSpeed, this.walkDirection.y * this.moveSpeed);
    this.shadow.setPosition(this.x + 6, this.y + 18);
    this.drawHealthBar();
  }

  pickNewDirection(time) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.walkDirection.set(Math.cos(angle), Math.sin(angle));
    this.changeDirectionAt = time + Phaser.Math.Between(1100, 2600);
  }

  emergeFromGround(duration = 420) {
    this.canMove = false;
    this.baseY = this.y;
    this.setAlpha(0);
    this.setScale(0.7);
    this.setY(this.y + 28);

    const dirt = this.scene.add.ellipse(this.x, this.baseY + 18, 52, 22, 0x4c2d17, 0.8).setDepth(2);
    this.scene.tweens.add({
      targets: dirt,
      scaleX: 1.2,
      scaleY: 1.15,
      alpha: 0.28,
      duration,
      onComplete: () => dirt.destroy(),
    });

    this.scene.tweens.add({
      targets: this,
      y: this.baseY,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: "Sine.Out",
      onComplete: () => {
        this.canMove = true;
        this.pickNewDirection(this.scene.time.now);
      },
    });
  }

  takeDamage(amount) {
    this.healthPoints -= amount;
    this.setTintFill(0xffd5d5);
    this.scene.time.delayedCall(70, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.healthPoints <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  getDropPosition() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  drawHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0x371718, 0.9);
    this.healthBar.fillRoundedRect(this.x - 20, this.y - 34, 40, 6, 3);
    this.healthBar.fillStyle(0x72de78, 1);
    this.healthBar.fillRoundedRect(
      this.x - 20,
      this.y - 34,
      40 * Phaser.Math.Clamp(this.healthPoints / this.maxHealth, 0, 1),
      6,
      3
    );
  }

  die() {
    const dropPosition = this.getDropPosition();
    this.shadow.destroy();
    this.healthBar.destroy();

    const stain = this.scene.add.ellipse(this.x, this.y + 14, 42, 18, 0x2a0f10, 0.65).setDepth(2);
    this.scene.tweens.add({
      targets: stain,
      alpha: 0.3,
      duration: 1800,
    });

    if (this.scene && this.scene.spawnZombieAmmoDrop) {
      this.scene.spawnZombieAmmoDrop(dropPosition.x, dropPosition.y);
    }

    this.destroy();
  }

  destroy(fromScene) {
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    super.destroy(fromScene);
  }
}
