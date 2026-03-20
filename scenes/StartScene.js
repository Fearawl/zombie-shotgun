export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#13212b");
    this.drawBackground(width, height);
    this.drawHeroArt(width, height);

    this.add
      .text(width / 2, 72, "Zombie Shotgun", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "42px",
        color: "#f7f4dd",
        stroke: "#1d120b",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 124, "Survive, reload, and face a new boss every 60 seconds", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#bfd3e1",
      })
      .setOrigin(0.5);

    this.add
      .text(width - 26, 24, "v002", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "26px",
        color: "#ffe59f",
        stroke: "#2d1709",
        strokeThickness: 4,
      })
      .setOrigin(1, 0);

    const button = this.createButton(width / 2, height - 92, 240, 68, "START");
    button.on("pointerup", () => {
      this.scene.start("GameScene");
    });
  }

  drawBackground(width, height) {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x183141, 0x183141, 0x081117, 0x081117, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(0x1d3c31, 0.7);
    graphics.fillEllipse(width * 0.32, height * 0.75, 620, 180);
    graphics.fillStyle(0x10261d, 0.95);
    graphics.fillEllipse(width * 0.78, height * 0.82, 540, 150);

    graphics.lineStyle(2, 0x23495c, 0.35);
    for (let x = -200; x < width + 240; x += 70) {
      graphics.lineBetween(x, height * 0.55, x + 260, height);
    }
  }

  drawHeroArt(width, height) {
    const graphics = this.add.graphics();
    const heroX = width * 0.28;
    const heroY = height * 0.58;

    graphics.fillStyle(0xffc86e, 1);
    graphics.fillCircle(heroX, heroY - 126, 26);
    graphics.fillStyle(0x4ca0d8, 1);
    graphics.fillRoundedRect(heroX - 36, heroY - 98, 72, 98, 18);
    graphics.fillStyle(0x293746, 1);
    graphics.fillRect(heroX - 18, heroY - 12, 14, 98);
    graphics.fillRect(heroX + 4, heroY - 12, 14, 98);
    graphics.fillRect(heroX - 88, heroY - 88, 54, 14);
    graphics.fillRect(heroX + 34, heroY - 70, 124, 16);
    graphics.fillStyle(0x7f4c2a, 1);
    graphics.fillRect(heroX + 106, heroY - 76, 20, 28);

    graphics.fillStyle(0xf6c45b, 0.9);
    for (let i = 0; i < 7; i += 1) {
      const spreadY = heroY - 62 + Phaser.Math.Between(-22, 22);
      graphics.fillTriangle(
        heroX + 154,
        spreadY,
        heroX + 256 + i * 16,
        spreadY - 22,
        heroX + 256 + i * 16,
        spreadY + 22
      );
    }

    this.drawZombie(graphics, width * 0.72, height * 0.62, 1);
    this.drawZombie(graphics, width * 0.84, height * 0.7, 0.82);
    this.drawZombie(graphics, width * 0.64, height * 0.76, 0.74);
  }

  drawZombie(graphics, x, y, scale) {
    graphics.fillStyle(0x99bd6d, 1);
    graphics.fillCircle(x, y - 72 * scale, 20 * scale);
    graphics.fillStyle(0x5f7f49, 1);
    graphics.fillRoundedRect(x - 24 * scale, y - 56 * scale, 48 * scale, 64 * scale, 10 * scale);
    graphics.fillStyle(0x36433a, 1);
    graphics.fillRect(x - 18 * scale, y + 6 * scale, 10 * scale, 44 * scale);
    graphics.fillRect(x + 8 * scale, y + 6 * scale, 10 * scale, 44 * scale);
    graphics.fillRect(x - 44 * scale, y - 42 * scale, 24 * scale, 10 * scale);
    graphics.fillRect(x + 20 * scale, y - 42 * scale, 24 * scale, 10 * scale);
  }

  createButton(x, y, width, height, label) {
    const container = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0xd8612f, 1);
    background.lineStyle(4, 0x4f1a08, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
    container.add(background);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "26px",
        color: "#fff5dd",
      })
      .setOrigin(0.5);
    container.add(text);

    const zone = this.add
      .zone(x, y, width, height)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerover", () => {
      container.setScale(1.04);
    });

    zone.on("pointerout", () => {
      container.setScale(1);
    });

    zone.on("pointerdown", () => {
      container.setScale(0.98);
    });

    zone.on("pointerup", () => {
      container.setScale(1.04);
    });

    return zone;
  }
}
