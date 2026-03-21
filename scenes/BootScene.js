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
    this.makeGrenadeTexture("grenade-orb", 28);
    this.makeRoundedRectTexture("ammo-box", 50, 34, 8, 0xca8b4d, 0x5f3a1d);
    this.makeRoundedRectTexture("pistol-ammo-box", 50, 34, 8, 0x6f8fd8, 0x23385d);
    this.makeRoundedRectTexture("grenade-box", 50, 34, 8, 0x7b6a8b, 0x332348);
    this.makeRoundedRectTexture("medkit-box", 50, 34, 8, 0xb45252, 0x5d1f1f);
    this.makeRoundedRectTexture("energy-box", 50, 34, 8, 0x46a6d1, 0x154d68);
    this.makeRoundedRectTexture("shell-icon", 12, 28, 4, 0xd6ab5d, 0x6b471f);
    this.makeRoundedRectTexture("pistol-icon", 12, 20, 3, 0xd9edf9, 0x4d6f87);
    this.makeGrenadeTexture("grenade-icon", 18);
    this.makeMedkitIconTexture("medkit-icon", 18);
    this.makeEnergyIconTexture("energy-icon", 18);
    this.makeRoundedRectTexture("wall-block", 16, 16, 3, 0x7e858b, 0x43484d);
    this.makeHouseTexture("house", 110, 86);
    this.makeTreeTexture("tree", 70, 96);
    this.makeGraveTexture("grave", 46, 58);
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

  makeGrenadeTexture(key, size) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const cx = size * 0.46;
    const cy = size * 0.58;
    const bodyWidth = size * 0.52;
    const bodyHeight = size * 0.62;

    graphics.fillStyle(0x7b7b35, 1);
    graphics.lineStyle(Math.max(2, Math.floor(size * 0.09)), 0x111417, 1);
    graphics.fillEllipse(cx, cy, bodyWidth, bodyHeight);
    graphics.strokeEllipse(cx, cy, bodyWidth, bodyHeight);

    graphics.lineBetween(cx - bodyWidth * 0.26, cy - bodyHeight * 0.24, cx + bodyWidth * 0.26, cy - bodyHeight * 0.24);
    graphics.lineBetween(cx - bodyWidth * 0.3, cy, cx + bodyWidth * 0.3, cy);
    graphics.lineBetween(cx - bodyWidth * 0.24, cy + bodyHeight * 0.22, cx + bodyWidth * 0.24, cy + bodyHeight * 0.22);
    graphics.lineBetween(cx - bodyWidth * 0.16, cy - bodyHeight * 0.38, cx - bodyWidth * 0.32, cy + bodyHeight * 0.32);
    graphics.lineBetween(cx + bodyWidth * 0.02, cy - bodyHeight * 0.42, cx - bodyWidth * 0.12, cy + bodyHeight * 0.36);
    graphics.lineBetween(cx + bodyWidth * 0.2, cy - bodyHeight * 0.34, cx + bodyWidth * 0.08, cy + bodyHeight * 0.3);

    graphics.fillStyle(0xcfd7de, 1);
    graphics.fillRoundedRect(size * 0.46, size * 0.1, size * 0.16, size * 0.14, 3);
    graphics.lineStyle(Math.max(2, Math.floor(size * 0.07)), 0x111417, 1);
    graphics.strokeCircle(size * 0.58, size * 0.28, size * 0.13);
    graphics.lineBetween(size * 0.67, size * 0.34, size * 0.88, size * 0.72);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  makeHouseTexture(key, width, height) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x202020, 0.24);
    graphics.fillEllipse(width / 2, height - 8, width * 0.78, 20);

    graphics.fillStyle(0x555a5f, 1);
    graphics.lineStyle(5, 0x2a2f33, 1);
    graphics.fillRoundedRect(10, 24, width - 20, height - 30, 8);
    graphics.strokeRoundedRect(10, 24, width - 20, height - 30, 8);

    graphics.fillStyle(0x7a4343, 1);
    graphics.fillTriangle(width / 2, 4, width - 6, 30, 6, 30);
    graphics.lineStyle(4, 0x442121, 1);
    graphics.strokeTriangle(width / 2, 4, width - 6, 30, 6, 30);

    graphics.fillStyle(0x8f969d, 1);
    graphics.fillRoundedRect(18, 32, 28, 18, 4);
    graphics.fillRoundedRect(52, 32, 40, 18, 4);
    graphics.fillRoundedRect(18, 54, 36, 22, 4);
    graphics.fillRoundedRect(58, 54, 34, 22, 4);

    graphics.lineStyle(4, 0xc3c8cd, 1);
    graphics.lineBetween(50, 28, 50, 78);
    graphics.lineBetween(16, 52, 94, 52);
    graphics.lineBetween(56, 52, 56, 78);

    graphics.lineStyle(3, 0xf5e8ba, 0.95);
    graphics.lineBetween(69, 61, 84, 70);
    graphics.lineStyle(5, 0x6f4b29, 1);
    graphics.lineBetween(66, 58, 82, 68);
    graphics.lineStyle(2, 0xb2855b, 1);
    graphics.lineBetween(72, 57, 86, 66);

    graphics.fillStyle(0xe5d8a9, 0.95);
    graphics.fillRoundedRect(width / 2 - 10, height - 28, 20, 22, 4);
    graphics.fillStyle(0xcfe2f2, 0.85);
    graphics.fillRoundedRect(22, 36, 12, 8, 3);
    graphics.fillRoundedRect(66, 36, 12, 8, 3);
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

  makeMedkitIconTexture(key, size) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xf5efe8, 1);
    graphics.lineStyle(2, 0x7b1f1f, 1);
    graphics.fillRoundedRect(size * 0.18, size * 0.18, size * 0.64, size * 0.64, 4);
    graphics.strokeRoundedRect(size * 0.18, size * 0.18, size * 0.64, size * 0.64, 4);
    graphics.fillStyle(0xbe2d2d, 1);
    graphics.fillRect(size * 0.42, size * 0.28, size * 0.16, size * 0.44);
    graphics.fillRect(size * 0.28, size * 0.42, size * 0.44, size * 0.16);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  makeGraveTexture(key, width, height) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x141719, 0.2);
    graphics.fillEllipse(width / 2, height - 6, width * 0.82, 14);
    graphics.fillStyle(0x71767b, 1);
    graphics.lineStyle(3, 0x3d4146, 1);
    graphics.fillRoundedRect(8, 14, width - 16, height - 24, 10);
    graphics.strokeRoundedRect(8, 14, width - 16, height - 24, 10);
    graphics.fillStyle(0x81878c, 1);
    graphics.fillRect(width * 0.32, height - 16, width * 0.36, 8);
    graphics.lineStyle(2, 0x949a9f, 0.55);
    graphics.lineBetween(width / 2, 24, width / 2, height - 24);
    graphics.lineBetween(width * 0.34, 34, width * 0.66, 34);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  makeEnergyIconTexture(key, size) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x8de7ff, 1);
    graphics.lineStyle(2, 0x18465f, 1);
    graphics.fillRoundedRect(size * 0.3, size * 0.12, size * 0.4, size * 0.76, 4);
    graphics.strokeRoundedRect(size * 0.3, size * 0.12, size * 0.4, size * 0.76, 4);
    graphics.fillStyle(0xdaf7ff, 1);
    graphics.fillRect(size * 0.4, size * 0.04, size * 0.2, size * 0.08);
    graphics.fillStyle(0xf8f3a6, 1);
    graphics.fillTriangle(size * 0.56, size * 0.24, size * 0.42, size * 0.54, size * 0.58, size * 0.54);
    graphics.fillTriangle(size * 0.46, size * 0.54, size * 0.62, size * 0.54, size * 0.42, size * 0.84);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }
}

export const gameScenes = [BootScene, StartScene, GameScene, ResultScene];
