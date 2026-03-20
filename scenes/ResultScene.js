export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  create(data) {
    const { width, height } = this.scale;
    const kills = data?.kills ?? 0;

    this.cameras.main.setBackgroundColor("#101922");
    this.drawBackdrop(width, height);

    this.add
      .text(width / 2, 110, "Round Complete", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "40px",
        color: "#fff1cf",
        stroke: "#24170f",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 220, `Zombies eliminated: ${kills}`, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "30px",
        color: "#bfeec5",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 270, "Time limit: 60 seconds", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "20px",
        color: "#c0d5e6",
      })
      .setOrigin(0.5);

    const button = this.createButton(width / 2, height - 120, 280, 70, "RETRY");
    button.on("pointerup", () => {
      this.scene.start("GameScene");
    });
  }

  drawBackdrop(width, height) {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x111c22, 0x111c22, 0x05080d, 0x05080d, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(0x193426, 0.65);
    graphics.fillEllipse(width / 2, height * 0.74, width * 0.72, 160);

    graphics.fillStyle(0x203745, 0.35);
    for (let i = 0; i < 20; i += 1) {
      const x = 40 + i * 48;
      graphics.fillCircle(x, 60 + (i % 3) * 18, 3);
    }
  }

  createButton(x, y, width, height, label) {
    const container = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0x3ea96f, 1);
    background.lineStyle(4, 0x143320, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
    container.add(background);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "26px",
        color: "#effff5",
      })
      .setOrigin(0.5);
    container.add(text);

    const zone = this.add
      .zone(x, y, width, height)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerover", () => container.setScale(1.04));
    zone.on("pointerout", () => container.setScale(1));
    zone.on("pointerdown", () => container.setScale(0.98));
    zone.on("pointerup", () => container.setScale(1.04));

    return zone;
  }
}
