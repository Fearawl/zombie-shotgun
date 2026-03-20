export class UiSystem {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.levelCardViews = [];
    this.pauseButtons = [];
  }

  createHud() {
    const { width } = this.scene.scale;
    this.topUi = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(20);

    const leftPanel = this.scene.add.graphics();
    leftPanel.fillStyle(0x09131a, 0.86);
    leftPanel.lineStyle(2, 0x315166, 1);
    leftPanel.fillRoundedRect(16, 16, 320, 146, 16);
    leftPanel.strokeRoundedRect(16, 16, 320, 146, 16);

    this.heroUiText = this.scene.add.text(34, 28, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "18px",
      color: "#f3d686",
      lineSpacing: 6,
    });

    this.waveCounterText = this.scene.add
      .text(width / 2, 18, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "26px",
        color: "#f3ead1",
        stroke: "#15222b",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0);

    this.waveTitleText = this.scene.add
      .text(width / 2, 56, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "24px",
        color: "#bdeec1",
        stroke: "#102219",
        strokeThickness: 6,
        align: "center",
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(1);

    this.topUi.add([leftPanel, this.heroUiText, this.waveCounterText, this.waveTitleText]);
  }

  createLevelUpOverlay(onCardSelected) {
    const { width, height } = this.scene.scale;
    this.levelUpOverlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(50).setVisible(false);
    const dim = this.scene.add.rectangle(0, 0, width, height, 0x051016, 0.88).setOrigin(0, 0);
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x10212b, 0.96);
    panel.lineStyle(3, 0x3c6075, 1);
    panel.fillRoundedRect(width / 2 - 420, height / 2 - 170, 840, 340, 22);
    panel.strokeRoundedRect(width / 2 - 420, height / 2 - 170, 840, 340, 22);
    const title = this.scene.add
      .text(width / 2, height / 2 - 132, "Level Up", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "34px",
        color: "#f7eed0",
        stroke: "#162028",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const subtitle = this.scene.add
      .text(width / 2, height / 2 - 88, "Choose one upgrade for the hero", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#bdd0db",
      })
      .setOrigin(0.5);

    this.levelUpOverlay.add([dim, panel, title, subtitle]);

    this.levelCardViews = [];
    for (let i = 0; i < this.config.hero.levelUp.cardsPerLevel; i += 1) {
      const cardX = width / 2 - 260 + i * 260;
      const card = this.createUpgradeCard(cardX, height / 2 + 14, i, onCardSelected);
      this.levelCardViews.push(card);
      this.levelUpOverlay.add(card.container);
    }
  }

  createPauseOverlay({ onContinue, onRestart, onExit }) {
    const { width, height } = this.scene.scale;
    this.pauseOverlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(70).setVisible(false);
    const pauseDim = this.scene.add.rectangle(0, 0, width, height, 0x040b10, 0.82).setOrigin(0, 0);
    const pausePanel = this.scene.add.graphics();
    pausePanel.fillStyle(0x10212b, 0.98);
    pausePanel.lineStyle(3, 0x466c81, 1);
    pausePanel.fillRoundedRect(width / 2 - 250, height / 2 - 140, 500, 280, 22);
    pausePanel.strokeRoundedRect(width / 2 - 250, height / 2 - 140, 500, 280, 22);
    const pauseTitle = this.scene.add
      .text(width / 2, height / 2 - 92, "Paused", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "34px",
        color: "#f7eed0",
        stroke: "#162028",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.pauseOverlay.add([pauseDim, pausePanel, pauseTitle]);

    this.pauseButtons = [
      this.createPauseButton(width / 2, height / 2 - 18, 0, "Continue", onContinue),
      this.createPauseButton(width / 2, height / 2 + 36, 1, "Restart", onRestart),
      this.createPauseButton(width / 2, height / 2 + 90, 2, "Exit", onExit),
    ];
    this.pauseButtons.forEach((button) => this.pauseOverlay.add(button.container));
  }

  createUpgradeCard(x, y, index, onCardSelected) {
    const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(52);
    const background = this.scene.add.graphics();
    background.fillStyle(0x18303c, 1);
    background.lineStyle(3, 0x4a7388, 1);
    background.fillRoundedRect(-110, -86, 220, 172, 18);
    background.strokeRoundedRect(-110, -86, 220, 172, 18);

    const title = this.scene.add
      .text(0, -42, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "24px",
        color: "#ffe4a3",
        align: "center",
        wordWrap: { width: 180 },
      })
      .setOrigin(0.5);

    const description = this.scene.add
      .text(0, 16, "", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "15px",
        color: "#d8e3ea",
        align: "center",
        wordWrap: { width: 182 },
      })
      .setOrigin(0.5);

    const buttonHint = this.scene.add
      .text(0, 58, "Pick", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "18px",
        color: "#9ee59f",
      })
      .setOrigin(0.5);

    const hitZone = this.scene.add
      .zone(x, y, 220, 172)
      .setScrollFactor(0)
      .setDepth(53)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    hitZone.input.enabled = false;

    hitZone.on("pointerover", () => container.setScale(1.03));
    hitZone.on("pointerout", () => container.setScale(1));
    hitZone.on("pointerdown", () => container.setScale(0.98));
    hitZone.on("pointerup", () => {
      container.setScale(1.03);
      onCardSelected(index);
    });

    container.add([background, title, description, buttonHint]);
    return { container, title, description, buttonHint, hitZone };
  }

  createPauseButton(x, y, index, label, onClick) {
    const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(72);
    const background = this.scene.add.graphics();
    background.fillStyle(index === 2 ? 0x5b2e2e : 0x18303c, 1);
    background.lineStyle(3, 0x4a7388, 1);
    background.fillRoundedRect(-90, -22, 180, 44, 14);
    background.strokeRoundedRect(-90, -22, 180, 44, 14);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "20px",
        color: "#f4ebd0",
      })
      .setOrigin(0.5);
    const hitZone = this.scene.add
      .zone(x, y, 180, 44)
      .setScrollFactor(0)
      .setDepth(73)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    hitZone.input.enabled = false;
    hitZone.on("pointerover", () => container.setScale(1.03));
    hitZone.on("pointerout", () => container.setScale(1));
    hitZone.on("pointerdown", () => container.setScale(0.98));
    hitZone.on("pointerup", () => {
      container.setScale(1.03);
      onClick();
    });
    container.add([background, text]);
    return { container, hitZone };
  }

  updateHud(heroHudText, waveCounterText, waveTitleText) {
    this.heroUiText.setText(heroHudText);
    this.waveCounterText.setText(waveCounterText);
    this.waveTitleText.setText(waveTitleText);
  }

  animateWaveTitle() {
    this.waveTitleText.setAlpha(1);
    this.waveTitleText.setScale(1.06);
    this.scene.tweens.killTweensOf(this.waveTitleText);
    this.scene.tweens.add({
      targets: this.waveTitleText,
      scaleX: 1,
      scaleY: 1,
      duration: 240,
      ease: "Sine.Out",
    });
  }

  showLevelUpCards(cards) {
    this.levelCardViews.forEach((view, index) => {
      const card = cards[index];
      view.title.setText(card?.title ?? "");
      view.description.setText(card?.description ?? "");
      view.buttonHint.setText(card ? "Pick" : "");
      view.container.setVisible(Boolean(card));
      view.hitZone.setVisible(Boolean(card));
      view.hitZone.input.enabled = Boolean(card);
      view.container.setScale(1);
    });
    this.levelUpOverlay.setVisible(true);
  }

  hideLevelUpCards() {
    this.levelCardViews.forEach((view) => {
      view.hitZone.setVisible(false);
      view.hitZone.input.enabled = false;
      view.container.setScale(1);
    });
    this.levelUpOverlay.setVisible(false);
  }

  showPauseMenu() {
    this.pauseButtons.forEach((button) => {
      button.hitZone.setVisible(true);
      button.hitZone.input.enabled = true;
      button.container.setScale(1);
    });
    this.pauseOverlay.setVisible(true);
  }

  hidePauseMenu() {
    this.pauseButtons.forEach((button) => {
      button.hitZone.setVisible(false);
      button.hitZone.input.enabled = false;
      button.container.setScale(1);
    });
    this.pauseOverlay.setVisible(false);
  }
}
