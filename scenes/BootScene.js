import { StartScene } from "./StartScene.js";
import { GameScene } from "./GameScene.js";
import { ResultScene } from "./ResultScene.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("start-poster", "assets/start-poster.svg");
    this.createTextures();
  }

  create() {
    this.scene.start("StartScene");
  }

  createTextures() {
    this.makeCircleTexture("player-body", 44, 0x6fcf97, 0x1f7a46);
    this.makeCircleTexture("zombie-body", 40, 0x7fb36b, 0x2c5132);
    this.makeCircleTexture("pellet", 8, 0xffe08c, 0x7f5a23);
    this.makeCircleTexture("pistol-bullet", 6, 0xfff4bf, 0x85672f);
    this.makeCircleTexture("grenade-orb", 18, 0x4f5962, 0x1d242b);
    this.makeRoundedRectTexture("ammo-box", 50, 34, 8, 0xca8b4d, 0x5f3a1d);
    this.makeRoundedRectTexture("pistol-ammo-box", 50, 34, 8, 0x6f8fd8, 0x23385d);
    this.makeRoundedRectTexture("grenade-box", 50, 34, 8, 0x7b6a8b, 0x332348);
    this.makeRoundedRectTexture("shell-icon", 12, 28, 4, 0xd6ab5d, 0x6b471f);
    this.makeRoundedRectTexture("pistol-icon", 12, 20, 3, 0xd9edf9, 0x4d6f87);
    this.makeCircleTexture("grenade-icon", 12, 0xb4c0ca, 0x42505e);
    this.makeHouseTexture("house", 110, 86);
    this.makeTreeTexture("tree", 70, 96);
  }

  makeCircleTexture(key, size, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const lineWidth = Math.max(1, Math.min(4, Math.floor(size * 0.18)));
    const radius = Math.max(1, size / 2 - lineWidth);
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(lineWidth, strokeColor, 1);
    graphics.fillCircle(size / 2, size / 2, radius);
    graphics.strokeCircle(size / 2, size / 2, radius);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  makeRoundedRectTexture(key, width, height, radius, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(4, strokeColor, 1);
    graphics.fillRoundedRect(2, 2, width - 4, height - 4, radius);
    graphics.strokeRoundedRect(2, 2, width - 4, height - 4, radius);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  makeHouseTexture(key, width, height) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x2e2118, 0.26);
    graphics.fillEllipse(width / 2, height - 10, width * 0.72, 20);
    graphics.fillStyle(0xb97e4b, 1);
    graphics.lineStyle(4, 0x5a3518, 1);
    graphics.fillRoundedRect(12, 28, width - 24, height - 34, 8);
    graphics.strokeRoundedRect(12, 28, width - 24, height - 34, 8);
    graphics.fillStyle(0x6b3a25, 1);
    graphics.fillTriangle(width / 2, 4, width - 6, 34, 6, 34);
    graphics.lineStyle(4, 0x3a1f12, 1);
    graphics.strokeTriangle(width / 2, 4, width - 6, 34, 6, 34);
    graphics.fillStyle(0xf3cf7b, 0.95);
    graphics.fillRoundedRect(width / 2 - 12, height - 34, 24, 28, 5);
    graphics.fillStyle(0xbfd7f1, 0.92);
    graphics.fillRoundedRect(24, 40, 18, 16, 4);
    graphics.fillRoundedRect(width - 42, 40, 18, 16, 4);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  makeTreeTexture(key, width, height) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x112015, 0.22);
    graphics.fillEllipse(width / 2, height - 10, width * 0.58, 18);
    graphics.fillStyle(0x6b4424, 1);
    graphics.fillRoundedRect(width / 2 - 8, height - 34, 16, 28, 5);
    graphics.fillStyle(0x2b6a3b, 1);
    graphics.lineStyle(3, 0x1a4124, 1);
    graphics.fillCircle(width / 2, 40, 24);
    graphics.strokeCircle(width / 2, 40, 24);
    graphics.fillCircle(width / 2 - 18, 52, 18);
    graphics.strokeCircle(width / 2 - 18, 52, 18);
    graphics.fillCircle(width / 2 + 18, 52, 18);
    graphics.strokeCircle(width / 2 + 18, 52, 18);
    graphics.fillCircle(width / 2, 62, 20);
    graphics.strokeCircle(width / 2, 62, 20);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}

export const gameScenes = [BootScene, StartScene, GameScene, ResultScene];
