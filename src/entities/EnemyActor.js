export class EnemyActor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, options = {}) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.descriptor = options.descriptor ?? null;
    this.isBoss = options.isBoss ?? false;
    this.maxHealth = options.maxHealth ?? 5;
    this.healthPoints = this.maxHealth;
    this.baseMoveSpeed = options.moveSpeed ?? 60;
    this.moveSpeed = this.baseMoveSpeed;
    this.aggroRadius = options.aggroRadius ?? 99999;
    this.attackCooldownMs = options.attackCooldownMs ?? 2000;
    this.lastAttackAt = -this.attackCooldownMs;
    this.armorValue = options.armorValue ?? 0;
    this.baseTint = options.tint ?? null;
    this.canMove = true;
    this.baseY = y;
    this.onDeath = options.onDeath ?? null;
    this.changeDirectionAt = 0;
    this.walkDirection = new Phaser.Math.Vector2(1, 0);

    this.setCollideWorldBounds(true);
    this.setDepth(4);
    this.body.allowGravity = false;
    this.setCircle(this.isBoss ? 22 : 16, this.isBoss ? 6 : 4, this.isBoss ? 6 : 4);

    if (this.baseTint) {
      this.setTint(this.baseTint);
    }
    if (options.scale) {
      this.setScale(options.scale);
    }

    this.shadow = scene.add
      .ellipse(
        this.x + 6,
        this.y + (this.isBoss ? 24 : 18),
        this.isBoss ? 58 : 42,
        this.isBoss ? 22 : 16,
        0x000000,
        0.2
      )
      .setDepth(3);
    this.healthBar = scene.add.graphics().setDepth(6);
    this.healthText = scene.add
      .text(this.x, this.y, "", {
        fontFamily: "Verdana, sans-serif",
        fontSize: this.isBoss ? "11px" : "10px",
        color: "#f7f4dd",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(7);

    this.pickNewDirection(0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.active) {
      return;
    }

    if (!this.canMove) {
      this.setVelocity(0, 0);
      this.updatePresentation();
      return;
    }

    const hero = this.scene.player;
    const heroDistance = hero
      ? Phaser.Math.Distance.Between(this.x, this.y, hero.x, hero.y)
      : Number.MAX_SAFE_INTEGER;

    if (hero && heroDistance <= this.aggroRadius) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, hero.x, hero.y);
      this.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
    } else {
      if (time >= this.changeDirectionAt) {
        this.pickNewDirection(time);
      }
      this.setVelocity(this.walkDirection.x * this.moveSpeed, this.walkDirection.y * this.moveSpeed);
    }

    this.updatePresentation();
  }

  updatePresentation() {
    this.shadow.setPosition(this.x + 6, this.y + (this.isBoss ? 24 : 18));
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
    const restingScaleX = this.scaleX || 1;
    const restingScaleY = this.scaleY || 1;

    this.setAlpha(0);
    this.setScale(restingScaleX * 0.72, restingScaleY * 0.72);
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
      scaleX: restingScaleX,
      scaleY: restingScaleY,
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
      this.clearTint();
      if (this.baseTint) {
        this.setTint(this.baseTint);
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

  drawHealthBar() {
    const width = this.isBoss ? 58 : 42;
    const heightOffset = this.isBoss ? 50 : 36;
    const ratio = Phaser.Math.Clamp(this.healthPoints / this.maxHealth, 0, 1);
    this.healthBar.clear();
    this.healthBar.fillStyle(0x371718, 0.9);
    this.healthBar.fillRoundedRect(this.x - width / 2, this.y - heightOffset, width, 7, 3);
    this.healthBar.fillStyle(this.isBoss ? 0xff6a62 : 0x72de78, 1);
    this.healthBar.fillRoundedRect(this.x - width / 2, this.y - heightOffset, width * ratio, 7, 3);
    this.healthText.setText(`${Math.max(0, Math.ceil(this.healthPoints))}`);
    this.healthText.setPosition(this.x, this.y - heightOffset + 3.5);
  }

  die() {
    const deathPosition = { x: this.x, y: this.y };
    const stain = this.scene.add
      .ellipse(this.x, this.y + 14, this.isBoss ? 60 : 42, this.isBoss ? 24 : 18, 0x2a0f10, 0.65)
      .setDepth(2);

    this.scene.tweens.add({
      targets: stain,
      alpha: 0.3,
      duration: 1800,
      onComplete: () => stain.destroy(),
    });

    if (typeof this.onDeath === "function") {
      this.onDeath(this, deathPosition);
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
    if (this.healthText) {
      this.healthText.destroy();
      this.healthText = null;
    }
    super.destroy(fromScene);
  }
}
