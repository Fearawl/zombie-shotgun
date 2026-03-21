export class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, "zombie-body");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.isBoss = options.isBoss ?? false;
    this.isFast = options.isFast ?? false;
    this.isBlue = options.isBlue ?? false;
    this.isSmall = options.isSmall ?? false;
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
    this.variantScale = options.scale ?? (this.isBoss ? 1.35 : this.isSmall ? 0.7 : this.isBlue ? 1.06 : this.isFast ? 1.05 : 1);

    this.setCollideWorldBounds(true);
    this.setBounce(1, 1);
    this.setCircle(
      this.isBoss ? 22 : this.isSmall ? 11 : 16,
      this.isBoss ? 6 : this.isSmall ? 8 : 4,
      this.isBoss ? 6 : this.isSmall ? 8 : 4
    );
    this.setDepth(4);
    this.body.allowGravity = false;
    if (options.tint) {
      this.setTint(options.tint);
      this.setScale(this.variantScale);
    }

    this.shadow = scene.add
      .ellipse(
        this.x + 6,
        this.y + (this.isBoss ? 24 : this.isSmall ? 15 : 20),
        this.isBoss ? 58 : this.isSmall ? 28 : this.isFast ? 46 : 42,
        this.isBoss ? 22 : this.isSmall ? 12 : 16,
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
        this.shadow.setPosition(this.x + 6, this.y + (this.isBoss ? 24 : this.isSmall ? 14 : 18));
      }
      this.drawHealthBar();
      return;
    }

    const player = this.scene.player;
    const playerHouse = this.scene && this.scene.getHouseAtPoint
      ? this.scene.getHouseAtPoint(player.x, player.y)
      : null;
    const zombieHouse = this.scene && this.scene.getHouseAtPoint
      ? this.scene.getHouseAtPoint(this.x, this.y)
      : null;
    const playerDistance = player
      ? Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
      : Number.MAX_SAFE_INTEGER;

    if (player && playerDistance <= this.aggroRadius && (!playerHouse || zombieHouse === playerHouse)) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const nextX = this.x + Math.cos(angle) * this.moveSpeed * Math.max(delta, 16) / 1000;
      const nextY = this.y + Math.sin(angle) * this.moveSpeed * Math.max(delta, 16) / 1000;
      const nextHouse = this.scene && this.scene.getHouseAtPoint
        ? this.scene.getHouseAtPoint(nextX, nextY)
        : null;

      if (!zombieHouse && nextHouse) {
        this.setVelocity(0, 0);
      } else {
        this.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
      }
    } else {
      if (time >= this.changeDirectionAt) {
        this.pickNewDirection(time);
      }
      const nextX = this.x + this.walkDirection.x * this.moveSpeed * Math.max(delta, 16) / 1000;
      const nextY = this.y + this.walkDirection.y * this.moveSpeed * Math.max(delta, 16) / 1000;
      const nextHouse = this.scene && this.scene.getHouseAtPoint
        ? this.scene.getHouseAtPoint(nextX, nextY)
        : null;

      if (!zombieHouse && nextHouse) {
        this.pickNewDirection(time + 120);
        this.setVelocity(0, 0);
      } else {
        this.setVelocity(this.walkDirection.x * this.moveSpeed, this.walkDirection.y * this.moveSpeed);
      }
    }

    if (this.shadow) {
      this.shadow.setPosition(this.x + 6, this.y + (this.isBoss ? 24 : this.isSmall ? 14 : 18));
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
    this.setScale(this.isBoss ? 1 : this.isSmall ? 0.35 : 0.7);
    this.setY(this.y + (this.isBoss ? 38 : this.isSmall ? 18 : 28));

    const dirt = this.scene.add
      .ellipse(this.x, this.baseY + 18, this.isBoss ? 78 : this.isSmall ? 34 : 52, this.isBoss ? 28 : this.isSmall ? 14 : 22, 0x4c2d17, 0.8)
      .setDepth(2);
    this.scene.tweens.add({
      targets: dirt,
      scaleX: 1.2,
      scaleY: 1.15,
      alpha: 0.28,
      duration,
      onComplete: () => {
        if (dirt && dirt.active) {
          dirt.destroy();
        }
      },
    });

    this.scene.tweens.add({
      targets: this,
      y: this.baseY,
      alpha: 1,
      scaleX: this.variantScale,
      scaleY: this.variantScale,
      duration,
      ease: "Sine.Out",
      onComplete: () => {
        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive() || !this.active) {
          return;
        }
        this.canMove = true;
        this.pickNewDirection(this.scene.time.now);
      },
    });
  }

  takeDamage(amount) {
    this.healthPoints -= amount;
    this.setTintFill(0xffd5d5);
    this.scene.time.delayedCall(70, () => {
      if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) {
        return;
      }
      if (!this.active) {
        return;
      }
      if (this.isBoss) {
        this.setTint(0xc84a42);
      } else if (this.isBlue) {
        this.setTint(0x4a8ed9);
      } else if (this.isSmall) {
        this.setTint(0x9fd680);
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

    const width = this.isBoss ? 56 : this.isSmall ? 28 : this.isBlue ? 46 : this.isFast ? 44 : 40;
    this.healthBar.clear();
    this.healthBar.fillStyle(0x371718, 0.9);
    this.healthBar.fillRoundedRect(this.x - width / 2, this.y - (this.isBoss ? 48 : this.isSmall ? 28 : 34), width, 6, 3);
    this.healthBar.fillStyle(this.isBoss ? 0xff6a62 : this.isBlue ? 0x7eb7ff : this.isFast ? 0xffc36a : this.isSmall ? 0xc6f18a : 0x72de78, 1);
    this.healthBar.fillRoundedRect(
      this.x - width / 2,
      this.y - (this.isBoss ? 48 : this.isSmall ? 28 : 34),
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
      onComplete: () => {
        if (stain && stain.active) {
          stain.destroy();
        }
      },
    });

    if (this.scene && this.scene.handleZombieDefeat) {
      this.scene.handleZombieDefeat(this, dropPosition);
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
