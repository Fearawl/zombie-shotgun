export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#13212b");
    this.drawBackground(width, height);
    this.drawPoster(width, height);

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
      .text(width - 26, 24, "v029", {
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

    graphics.fillStyle(0x1d3c31, 0.42);
    graphics.fillEllipse(width * 0.22, height * 0.74, 520, 150);
    graphics.fillStyle(0x10261d, 0.82);
    graphics.fillEllipse(width * 0.82, height * 0.84, 620, 170);

    graphics.lineStyle(2, 0x23495c, 0.35);
    for (let x = -200; x < width + 240; x += 70) {
      graphics.lineBetween(x, height * 0.55, x + 260, height);
    }
  }

  drawPoster(width, height) {
    this.add
      .image(width / 2, height * 0.58, "start-poster")
      .setDisplaySize(760, 490)
      .setAlpha(0.98);
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
