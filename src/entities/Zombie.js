export class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, "zombie-body");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.isBoss = options.isBoss ?? false;
    this.isFast = options.isFast ?? false;
    this.maxHealth = options.maxHealth ?? 10;
    this.healthPoints = this.maxHealth;
    this.baseMoveSpeed = options.moveSpeed ?? Phaser.Math.Between(34, 52);
    this.speedMultiplier = options.speedMultiplier ?? 1;
    this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier;
    this.aggroRadius = options.aggroRadius ?? 96;
    this.attackCooldownMs = options.attackCooldownMs ?? 2000;
    this.lastAttackAt = -this.attackCooldownMs;
    this.changeDirectionAt = 0;
    this.walkDirection = new Phaser.Math.Vector2(1, 0);
    this.canMove = true;
    this.baseY = y;
    this.dropType = options.dropType ?? "shotgunAmmo";

    this.setCollideWorldBounds(true);
    this.setBounce(1, 1);
    this.setCircle(this.isBoss ? 22 : 16, this.isBoss ? 6 : 4, this.isBoss ? 6 : 4);
    this.setDepth(4);
    this.body.allowGravity = false;
    if ((this.isBoss || this.isFast) && options.tint) {
      this.setTint(options.tint);
      this.setScale(this.isBoss ? 1.35 : 1.05);
    }

    this.shadow = scene.add
      .ellipse(
        this.x + 6,
        this.y + (this.isBoss ? 24 : 20),
        this.isBoss ? 58 : this.isFast ? 46 : 42,
        this.isBoss ? 22 : 16,
        0x000000,
        0.2
      )
      .setDepth(3);
    this.healthBar = scene.add.graphics().setDepth(6);

    this.pickNewDirection(0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.active) {
      return;
    }

    if (!this.canMove) {
      this.setVelocity(0, 0);
      if (this.shadow) {
        this.shadow.setPosition(this.x + 6, this.y + (this.isBoss ? 24 : 18));
      }
      this.drawHealthBar();
      return;
    }

    const player = this.scene.player;
    const playerDistance = player
      ? Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
      : Number.MAX_SAFE_INTEGER;

    if (player && playerDistance <= this.aggroRadius) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
    } else {
      if (time >= this.changeDirectionAt) {
        this.pickNewDirection(time);
      }
      this.setVelocity(this.walkDirection.x * this.moveSpeed, this.walkDirection.y * this.moveSpeed);
    }

    if (this.shadow) {
      this.shadow.setPosition(this.x + 6, this.y + (this.isBoss ? 24 : 18));
    }
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
    this.setScale(this.isBoss ? 1 : 0.7);
    this.setY(this.y + (this.isBoss ? 38 : 28));

    const dirt = this.scene.add
      .ellipse(this.x, this.baseY + 18, this.isBoss ? 78 : 52, this.isBoss ? 28 : 22, 0x4c2d17, 0.8)
      .setDepth(2);
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
      scaleX: this.isBoss ? 1.35 : 1,
      scaleY: this.isBoss ? 1.35 : 1,
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
      if (!this.active) {
        return;
      }
      if (this.isBoss) {
        this.setTint(0xc84a42);
      } else if (this.isFast) {
        this.setTint(0xd58a35);
      } else {
        this.clearTint();
      }
    });

    if (this.healthPoints <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  canAttack(timeNow) {
    return timeNow - this.lastAttackAt >= this.attackCooldownMs;
  }

  recordAttack(timeNow) {
    this.lastAttackAt = timeNow;
  }

  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
    this.moveSpeed = this.baseMoveSpeed * this.speedMultiplier;
  }

  getDropPosition() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  drawHealthBar() {
    if (!this.healthBar) {
      return;
    }

    const width = this.isBoss ? 56 : this.isFast ? 44 : 40;
    this.healthBar.clear();
    this.healthBar.fillStyle(0x371718, 0.9);
    this.healthBar.fillRoundedRect(this.x - width / 2, this.y - (this.isBoss ? 48 : 34), width, 6, 3);
    this.healthBar.fillStyle(this.isBoss ? 0xff6a62 : this.isFast ? 0xffc36a : 0x72de78, 1);
    this.healthBar.fillRoundedRect(
      this.x - width / 2,
      this.y - (this.isBoss ? 48 : 34),
      width * Phaser.Math.Clamp(this.healthPoints / this.maxHealth, 0, 1),
      6,
      3
    );
  }

  die() {
    const dropPosition = this.getDropPosition();
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }

    const stain = this.scene.add
      .ellipse(this.x, this.y + 14, this.isBoss ? 60 : 42, this.isBoss ? 24 : 18, 0x2a0f10, 0.65)
      .setDepth(2);
    this.scene.tweens.add({
      targets: stain,
      alpha: 0.3,
      duration: 1800,
      onComplete: () => stain.destroy(),
    });

    if (this.scene && this.scene.spawnZombieDrop) {
      this.scene.spawnZombieDrop(dropPosition.x, dropPosition.y, this.dropType);
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
