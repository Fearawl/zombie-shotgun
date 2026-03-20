import { gameConfig } from "../src/config/gameConfig.js";
import { EventBus } from "../src/core/EventBus.js";
import { GameSession } from "../src/core/GameSession.js";
import { Hero } from "../src/entities/Hero.js";
import { EnemyFactory } from "../src/systems/EnemyFactory.js";
import { LootSystem } from "../src/systems/LootSystem.js";
import { PresentationSystem } from "../src/systems/PresentationSystem.js";
import { ProgressionSystem } from "../src/systems/ProgressionSystem.js";
import { SpawnSystem } from "../src/systems/SpawnSystem.js";
import { WaveSystem } from "../src/systems/WaveSystem.js";
import { WeaponSystem } from "../src/systems/WeaponSystem.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.bootstrapArchitecture();
    this.cameras.main.setBackgroundColor("#12202a");
    this.drawBackdrop();
    this.createPanels();
    this.createControls();
    this.refreshDashboard();
  }

  bootstrapArchitecture() {
    this.eventBus = new EventBus();
    this.session = new GameSession(gameConfig);
    this.hero = new Hero(gameConfig);
    this.weaponSystem = new WeaponSystem(gameConfig);
    this.enemyFactory = new EnemyFactory(gameConfig, this.weaponSystem);
    this.waveSystem = new WaveSystem(gameConfig, this.eventBus, this.enemyFactory);
    this.spawnSystem = new SpawnSystem(gameConfig);
    this.lootSystem = new LootSystem(gameConfig);
    this.progressionSystem = new ProgressionSystem(gameConfig);
    this.presentationSystem = new PresentationSystem(gameConfig);

    this.eventBus.on("wave:created", (wave) => {
      this.session.setWaveState(wave);
      this.session.setBossState(wave.boss);
    });

    this.advanceWave();
    this.currentUpgradeCards = this.progressionSystem.createUpgradeOffer();
  }

  drawBackdrop() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x163142, 0x163142, 0x081017, 0x081017, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.lineStyle(1, 0x2f5c4f, 0.35);
    for (let y = 0; y < height; y += 38) {
      graphics.lineBetween(0, y, width, y);
    }
    for (let x = 0; x < width; x += 38) {
      graphics.lineBetween(x, 0, x, height);
    }
  }

  createPanels() {
    const { width, height } = this.scale;
    this.titleText = this.add
      .text(width / 2, 20, "Preproduction Architecture Board", {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "28px",
        color: "#f5efd8",
      })
      .setOrigin(0.5, 0);

    this.subtitleText = this.add
      .text(width / 2, 58, "The old prototype is now reference only. This scene validates systems and data flow.", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "16px",
        color: "#bcd0de",
      })
      .setOrigin(0.5, 0);

    this.wavePanel = this.createPanel(24, 104, 420, 356, "Wave Preview");
    this.bossPanel = this.createPanel(470, 104, 220, 356, "Boss Preview");
    this.upgradePanel = this.createPanel(714, 104, 222, 356, "Hero Upgrade Cards");
    this.footerPanel = this.createPanel(24, 478, 912, 38, "Current Architecture Slice");

    this.waveText = this.add.text(42, 146, "", this.panelTextStyle());
    this.bossText = this.add.text(488, 146, "", this.panelTextStyle());
    this.cardsText = this.add.text(732, 146, "", this.panelTextStyle());
    this.footerText = this.add.text(42, 492, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "15px",
      color: "#cfe2c3",
    });
  }

  createControls() {
    const buttons = [
      { x: 96, y: 78, label: "Next Wave", onClick: () => this.advanceWave() },
      { x: 248, y: 78, label: "Reroll Cards", onClick: () => this.rerollCards() },
      { x: 420, y: 78, label: "Simulate XP", onClick: () => this.simulateLevelXp() },
      { x: 820, y: 78, label: "Back To Start", onClick: () => this.scene.start("StartScene") },
    ];

    buttons.forEach((button) => this.createButton(button));
  }

  createButton({ x, y, label, onClick }) {
    const width = 132;
    const height = 40;
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xd0632f, 1);
    bg.lineStyle(3, 0x5a2410, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial Black, sans-serif",
        fontSize: "16px",
        color: "#fff3de",
      })
      .setOrigin(0.5);
    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => container.setScale(1.03));
    zone.on("pointerout", () => container.setScale(1));
    zone.on("pointerdown", () => container.setScale(0.98));
    zone.on("pointerup", () => {
      container.setScale(1.03);
      onClick();
    });
    container.add([bg, text, zone]);
  }

  createPanel(x, y, width, height, title) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x081018, 0.9);
    graphics.lineStyle(2, 0x375d74, 1);
    graphics.fillRoundedRect(x, y, width, height, 16);
    graphics.strokeRoundedRect(x, y, width, height, 16);

    this.add.text(x + 18, y + 14, title, {
      fontFamily: "Arial Black, sans-serif",
      fontSize: "18px",
      color: "#f4e8ca",
    });

    return graphics;
  }

  panelTextStyle() {
    return {
      fontFamily: "Consolas, monospace",
      fontSize: "15px",
      color: "#d6e6f0",
      lineSpacing: 6,
      wordWrap: { width: 380 },
    };
  }

  advanceWave() {
    const nextWave = this.waveSystem.createNextWave(this.session.waveNumber);
    this.spawnProfile = this.spawnSystem.getWaveSpawnProfile(nextWave);
    this.currentDropsPreview = {
      medkit: this.lootSystem.createMedkitPickup(),
      xpStar: this.lootSystem.createXpPickup(),
      bossStars: this.lootSystem.createBossXpBurst(nextWave.waveNumber),
    };
    this.refreshDashboard();
  }

  rerollCards() {
    this.currentUpgradeCards = this.progressionSystem.createUpgradeOffer();
    this.refreshDashboard();
  }

  simulateLevelXp() {
    const leveledUp = this.session.addHeroXp(this.session.nextLevelXp);
    if (leveledUp) {
      this.currentUpgradeCards = this.progressionSystem.createUpgradeOffer();
    }
    this.refreshDashboard();
  }

  refreshDashboard() {
    if (!this.session.currentWave) {
      return;
    }

    const wave = this.session.currentWave;
    const boss = this.session.currentBoss;

    const waveSummary = this.presentationSystem.formatWaveSummary(wave);
    const waveDescriptor = this.formatParameterStacks(wave.descriptor.parameterStacks);
    const spawnSummary = [
      `Spawn mode: ${this.spawnProfile.regularSpawnMode}`,
      `Boss spawn: ${this.spawnProfile.bossSpawnMode}`,
      `Underground: ${this.spawnProfile.undergroundTypes.join(", ")}`,
      `Drop lifetime: ${gameConfig.enemy.drops.lifetimeSeconds}s`,
      `Blink window: last ${gameConfig.enemy.drops.blinkStartSecondsRemaining}s`,
    ];
    this.waveText.setText([...waveSummary, "", "Parameters:", waveDescriptor, "", "Spawn:", ...spawnSummary].join("\n"));

    const bossSummary = this.presentationSystem.formatEnemySummary(boss);
    const bossTitle = boss.titleParts.length > 0 ? boss.titleParts.join(", ") : "base boss";
    this.bossText.setText([`Boss title: ${bossTitle}`, "", ...bossSummary].join("\n"));

    const cards = this.currentUpgradeCards
      .map((card, index) => `${index + 1}. ${card.title}\n${card.description}`)
      .join("\n\n");
    this.cardsText.setText(
      [
        `Hero level: ${this.session.heroLevel}`,
        `XP: ${this.session.heroXp}/${this.session.nextLevelXp}`,
        "",
        cards,
      ].join("\n")
    );

    this.footerText.setText(
      [
        "Modules online: GameSession, EventBus, Hero, EnemyFactory, WaveSystem, SpawnSystem, WeaponSystem, LootSystem, ProgressionSystem, PresentationSystem",
      ].join("")
    );
  }

  formatParameterStacks(parameterStacks) {
    const entries = Object.entries(parameterStacks);
    if (entries.length === 0) {
      return "- none";
    }

    return entries
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");
  }
}
