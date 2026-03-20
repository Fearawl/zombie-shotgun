export class PickupActor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, pickupData) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.pickupData = pickupData;
    this.value = pickupData.value;
    this.lifetimeSeconds = pickupData.lifetimeSeconds;
    this.blinkStartSecondsRemaining = pickupData.blinkStartSecondsRemaining;
    this.spawnedAt = scene.time.now;
    this.baseY = y;
    this.floatOffset = Phaser.Math.Between(0, 600);

    this.setDepth(5);
    this.body.allowGravity = false;
    this.body.setImmovable(true);

    this.shadow = scene.add.ellipse(x + 3, y + 11, 24, 10, 0x000000, 0.18).setDepth(4);
  }

  updatePresentation(timeNow) {
    const ageSeconds = (timeNow - this.spawnedAt) / 1000;
    const timeLeft = this.lifetimeSeconds - ageSeconds;
    if (timeLeft <= 0) {
      return false;
    }

    const bobOffset = Math.sin((timeNow + this.floatOffset) / 170) * 3;
    this.setY(this.baseY + bobOffset);
    this.shadow.setPosition(this.x + 3, this.baseY + 11);

    if (timeLeft <= this.blinkStartSecondsRemaining) {
      this.setAlpha(Math.sin(timeNow / 65) > 0 ? 1 : 0.25);
    } else {
      this.setAlpha(1);
    }

    return true;
  }

  destroy(fromScene) {
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    super.destroy(fromScene);
  }
}
