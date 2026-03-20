export class UiSystem {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.levelCardViews = [];
    this.pauseButtons = [];
    this.settingsRows = [];
    this.settingsScrollY = 0;
    this.settingsScrollMin = 0;
    this.settingsScrollMax = 0;
    this.activeSlider = null;
  }

  createHud() {
    const { width } = this.scene.scale;
    this.topUi = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(20);

    const leftPanel = this.scene.add.graphics();
    leftPanel.fillStyle(0x09131a, 0.86);
    leftPanel.lineStyle(2, 0x315166, 1);
    leftPanel.fillRoundedRect(14, 14, 270, 112, 14);
    leftPanel.strokeRoundedRect(14, 14, 270, 112, 14);

    this.heroUiText = this.scene.add.text(28, 24, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "14px",
      color: "#f3d686",
      lineSpacing: 4,
    });

    this.waveCounterText = this.scene.add
      .text(width / 2, 14, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "22px",
        color: "#f3ead1",
        stroke: "#15222b",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    this.waveTitleText = this.scene.add
      .text(width / 2, 44, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "19px",
        color: "#bdeec1",
        stroke: "#102219",
        strokeThickness: 5,
        align: "center",
        wordWrap: { width: 680 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(1);

    const settingsButton = this.createHudButton(width - 48, 34, 64, 34, "P");
    this.settingsButton = settingsButton;
    this.topUi.add([leftPanel, this.heroUiText, this.waveCounterText, this.waveTitleText, settingsButton.container]);
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

  createSettingsOverlay(definitions, { onClose }) {
    const { width, height } = this.scene.scale;
    this.settingsOverlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(85).setVisible(false);
    this.settingsDefinitions = definitions;

    const dim = this.scene.add.rectangle(0, 0, width, height, 0x051016, 0.84).setOrigin(0, 0);
    const panel = this.scene.add.graphics();
    const panelWidth = 600;
    const panelHeight = 430;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;
    panel.fillStyle(0x10212b, 0.98);
    panel.lineStyle(3, 0x466c81, 1);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 22);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 22);

    const title = this.scene.add
      .text(width / 2, panelY + 30, "Settings", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "30px",
        color: "#f7eed0",
        stroke: "#162028",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0);

    const subtitle = this.scene.add
      .text(width / 2, panelY + 68, "Tune live gameplay values", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "15px",
        color: "#bdd0db",
      })
      .setOrigin(0.5, 0);

    const closeButton = this.createHudButton(panelX + panelWidth - 30, panelY + 28, 28, 28, "X");
    closeButton.hitZone.on("pointerup", () => onClose());
    this.settingsCloseButton = closeButton;

    this.settingsViewport = {
      x: panelX + 26,
      y: panelY + 106,
      width: panelWidth - 52,
      height: panelHeight - 132,
    };

    const viewportMaskGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    viewportMaskGraphics.fillRect(
      this.settingsViewport.x,
      this.settingsViewport.y,
      this.settingsViewport.width,
      this.settingsViewport.height
    );
    this.settingsMask = viewportMaskGraphics.createGeometryMask();

    this.settingsContent = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(86);
    this.settingsContent.setMask(this.settingsMask);
    this.settingsRows = definitions.map((definition, index) =>
      this.createSettingsRow(definition, this.settingsViewport.x + 10, this.settingsViewport.y + 8 + index * 78)
    );
    this.settingsRows.forEach((row) => this.settingsContent.add(row.container));
    this.recalculateSettingsScrollBounds();

    closeButton.hitZone.setVisible(false);
    closeButton.hitZone.input.enabled = false;

    this.settingsOverlay.add([
      dim,
      panel,
      title,
      subtitle,
      this.settingsContent,
      closeButton.container,
      closeButton.hitZone,
    ]);

    this.scene.input.on("pointermove", (pointer) => {
      if (!this.activeSlider || !this.settingsOverlay.visible) {
        return;
      }
      this.updateSliderFromPointer(this.activeSlider, pointer);
    });

    this.scene.input.on("pointerup", () => {
      this.activeSlider = null;
    });

    this.scene.input.on(
      "wheel",
      (pointer, _gameObjects, _dx, dy) => {
        if (!this.settingsOverlay.visible) {
          return;
        }
        if (!this.isPointerInsideSettingsViewport(pointer.x, pointer.y)) {
          return;
        }
        this.setSettingsScroll(this.settingsScrollY - dy * 0.35);
      },
      this
    );
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

  createHudButton(x, y, width, height, label) {
    const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(25);
    const background = this.scene.add.graphics();
    background.fillStyle(0x16303d, 0.98);
    background.lineStyle(2, 0x4a7388, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "16px",
        color: "#f4ebd0",
      })
      .setOrigin(0.5);
    const hitZone = this.scene.add
      .zone(x, y, width, height)
      .setScrollFactor(0)
      .setDepth(26)
      .setInteractive({ useHandCursor: true });
    hitZone.on("pointerover", () => container.setScale(1.04));
    hitZone.on("pointerout", () => container.setScale(1));
    hitZone.on("pointerdown", () => container.setScale(0.97));
    hitZone.on("pointerup", () => container.setScale(1.04));
    container.add([background, text]);
    return { container, hitZone };
  }

  createSettingsRow(definition, x, y) {
    const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(86);
    const label = this.scene.add.text(0, 0, definition.label, {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "18px",
      color: "#f2e2b4",
    });
    const description = this.scene.add.text(0, 22, definition.description, {
      fontFamily: "Verdana, sans-serif",
      fontSize: "13px",
      color: "#c3d1d9",
      wordWrap: { width: this.settingsViewport.width - 120 },
    });
    const valueText = this.scene.add
      .text(this.settingsViewport.width - 86, 0, "", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "16px",
        color: "#8fe4ff",
      })
      .setOrigin(1, 0);
    const trackY = 54;
    const trackWidth = this.settingsViewport.width - 28;
    const track = this.scene.add.graphics();
    const fill = this.scene.add.graphics();
    const handle = this.scene.add.circle(0, trackY, 9, 0xf3ead1, 1).setStrokeStyle(2, 0x4a7388, 1);
    const hitZone = this.scene.add
      .zone(trackWidth / 2, trackY, trackWidth, 24)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const row = { definition, container, label, description, valueText, track, fill, handle, hitZone, trackWidth, x };
    hitZone.on("pointerdown", (pointer) => {
      this.activeSlider = row;
      this.updateSliderFromPointer(row, pointer);
    });

    container.add([label, description, valueText, track, fill, handle, hitZone]);
    this.redrawSettingsRow(row);
    return row;
  }

  redrawSettingsRow(row) {
    const normalized = Phaser.Math.Clamp(
      (row.definition.getValue() - row.definition.min) / Math.max(0.0001, row.definition.max - row.definition.min),
      0,
      1
    );
    const trackY = 54;
    row.track.clear();
    row.track.fillStyle(0x223947, 1);
    row.track.fillRoundedRect(0, trackY - 4, row.trackWidth, 8, 4);
    row.fill.clear();
    row.fill.fillStyle(0x6ec9df, 1);
    row.fill.fillRoundedRect(0, trackY - 4, row.trackWidth * normalized, 8, 4);
    row.handle.setPosition(row.trackWidth * normalized, trackY);
    row.valueText.setText(row.definition.format(row.definition.getValue()));
  }

  updateSliderFromPointer(row, pointer) {
    const localX = Phaser.Math.Clamp(
      pointer.x - (this.settingsViewport.x + 10),
      0,
      row.trackWidth
    );
    const normalized = localX / row.trackWidth;
    const rawValue = row.definition.min + (row.definition.max - row.definition.min) * normalized;
    const stepped =
      Math.round(rawValue / row.definition.step) * row.definition.step;
    const clamped = Phaser.Math.Clamp(stepped, row.definition.min, row.definition.max);
    row.definition.setValue(Number(clamped.toFixed(3)));
    this.redrawSettingsRow(row);
  }

  recalculateSettingsScrollBounds() {
    const totalHeight = Math.max(0, this.settingsRows.length * 78);
    this.settingsScrollMax = Math.max(0, totalHeight - this.settingsViewport.height + 14);
    this.settingsScrollMin = 0;
    this.setSettingsScroll(this.settingsScrollY);
  }

  setSettingsScroll(value) {
    this.settingsScrollY = Phaser.Math.Clamp(value, this.settingsScrollMin, this.settingsScrollMax);
    if (this.settingsContent) {
      this.settingsContent.setY(-this.settingsScrollY);
    }
  }

  isPointerInsideSettingsViewport(x, y) {
    return (
      x >= this.settingsViewport.x &&
      x <= this.settingsViewport.x + this.settingsViewport.width &&
      y >= this.settingsViewport.y &&
      y <= this.settingsViewport.y + this.settingsViewport.height
    );
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

  bindSettingsButton(onOpen) {
    this.settingsButton.hitZone.on("pointerup", onOpen);
  }

  showSettingsPanel() {
    this.settingsRows.forEach((row) => this.redrawSettingsRow(row));
    this.settingsScrollY = 0;
    this.setSettingsScroll(0);
    this.settingsOverlay.setVisible(true);
    this.settingsCloseButton.hitZone.setVisible(true);
    this.settingsCloseButton.hitZone.input.enabled = true;
  }

  hideSettingsPanel() {
    this.activeSlider = null;
    this.settingsOverlay.setVisible(false);
    this.settingsCloseButton.hitZone.setVisible(false);
    this.settingsCloseButton.hitZone.input.enabled = false;
  }
}
