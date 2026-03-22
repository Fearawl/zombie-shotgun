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
    this.makeCircleTexture("rifle-bullet", 6, 0xffd58a, 0x8d4f1f);
    this.makeGrenadeTexture("grenade-orb", 28);
    this.makeRoundedRectTexture("ammo-box", 50, 34, 8, 0xca8b4d, 0x5f3a1d);
    this.makeRoundedRectTexture("pistol-ammo-box", 50, 34, 8, 0x6f8fd8, 0x23385d);
    this.makeRoundedRectTexture("akm-ammo-box", 50, 34, 8, 0xc88a48, 0x5a3314);
    this.makeRoundedRectTexture("grenade-box", 50, 34, 8, 0x7b6a8b, 0x332348);
    this.makeRoundedRectTexture("medkit-box", 50, 34, 8, 0xb45252, 0x5d1f1f);
    this.makeRoundedRectTexture("energy-box", 50, 34, 8, 0x46a6d1, 0x154d68);
    this.makeRoundedRectTexture("shell-icon", 12, 28, 4, 0xd6ab5d, 0x6b471f);
    this.makeRoundedRectTexture("pistol-icon", 12, 20, 3, 0xd9edf9, 0x4d6f87);
    this.makeRoundedRectTexture("akm-icon", 12, 24, 3, 0xffd9a3, 0x85552a);
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
    const centerX = size / 2;
    const centerY = size / 2;

    graphics.fillStyle(0x000000, 0.16);
    graphics.fillEllipse(centerX + size * 0.08, centerY + size * 0.26, radius * 1.55, radius * 0.72);

    graphics.fillStyle(this.shadeColor(fillColor, -34), 1);
    graphics.fillCircle(centerX, centerY + size * 0.08, radius);
    graphics.fillStyle(fillColor, 1);
    graphics.fillCircle(centerX, centerY - size * 0.05, radius * 0.92);
    graphics.fillStyle(this.shadeColor(fillColor, 24), 0.95);
    graphics.fillCircle(centerX - size * 0.12, centerY - size * 0.18, radius * 0.5);
    graphics.fillStyle(0xffffff, 0.14);
    graphics.fillCircle(centerX - size * 0.2, centerY - size * 0.23, radius * 0.22);
    graphics.lineStyle(lineWidth, strokeColor, 1);
    graphics.strokeCircle(size / 2, size / 2, radius);
    graphics.lineStyle(Math.max(1, lineWidth - 1), this.shadeColor(strokeColor, 18), 0.55);
    graphics.strokeCircle(centerX - size * 0.02, centerY - size * 0.04, radius * 0.82);
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
    graphics.fillStyle(0x161a1e, 0.26);
    graphics.fillEllipse(width / 2 + 4, height - 6, width * 0.82, 18);

    graphics.fillStyle(0x5f676d, 1);
    graphics.lineStyle(5, 0x2a3137, 1);
    graphics.fillRoundedRect(10, 26, width - 20, height - 32, 8);
    graphics.strokeRoundedRect(10, 26, width - 20, height - 32, 8);
    graphics.fillStyle(0xa2afb7, 0.26);
    graphics.fillRoundedRect(14, 30, width - 28, 18, 6);
    graphics.fillStyle(0x41484d, 0.55);
    graphics.fillRect(14, height - 18, width - 28, 8);

    graphics.fillStyle(0x874848, 1);
    graphics.fillTriangle(width / 2, 2, width - 4, 30, 4, 30);
    graphics.lineStyle(4, 0x462324, 1);
    graphics.strokeTriangle(width / 2, 2, width - 4, 30, 4, 30);
    graphics.lineStyle(2, 0xd4a5a5, 0.25);
    graphics.lineBetween(width / 2, 6, width / 2, 26);

    graphics.fillStyle(0xa1b0ba, 1);
    graphics.fillRoundedRect(18, 34, 28, 18, 4);
    graphics.fillRoundedRect(52, 34, 40, 18, 4);
    graphics.fillRoundedRect(18, 56, 36, 22, 4);
    graphics.fillRoundedRect(58, 56, 34, 22, 4);
    graphics.fillStyle(0xe8f7ff, 0.32);
    graphics.fillRoundedRect(20, 36, 24, 5, 3);
    graphics.fillRoundedRect(54, 36, 34, 5, 3);
    graphics.fillRoundedRect(20, 58, 28, 6, 3);
    graphics.fillRoundedRect(60, 58, 26, 6, 3);

    graphics.lineStyle(4, 0xcfd8de, 1);
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
    graphics.fillStyle(0x0d1610, 0.24);
    graphics.fillEllipse(width / 2 + 3, height - 8, width * 0.6, 16);
    graphics.fillStyle(0x704826, 1);
    graphics.fillRoundedRect(width / 2 - 8, height - 36, 16, 30, 5);
    graphics.fillStyle(0x8d5b31, 0.4);
    graphics.fillRoundedRect(width / 2 - 4, height - 34, 5, 24, 3);
    graphics.fillStyle(0x255533, 1);
    graphics.lineStyle(3, 0x163620, 1);
    graphics.fillCircle(width / 2 + 6, 40, 24);
    graphics.strokeCircle(width / 2 + 6, 40, 24);
    graphics.fillCircle(width / 2 - 16, 52, 18);
    graphics.strokeCircle(width / 2 - 16, 52, 18);
    graphics.fillCircle(width / 2 + 18, 52, 18);
    graphics.strokeCircle(width / 2 + 18, 52, 18);
    graphics.fillCircle(width / 2 + 2, 62, 20);
    graphics.strokeCircle(width / 2 + 2, 62, 20);
    graphics.fillStyle(0x78b96c, 0.2);
    graphics.fillCircle(width / 2 - 4, 32, 10);
    graphics.fillCircle(width / 2 - 20, 46, 8);
    graphics.fillCircle(width / 2 + 16, 46, 8);
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
    graphics.fillStyle(0x121619, 0.22);
    graphics.fillEllipse(width / 2 + 2, height - 6, width * 0.82, 14);
    graphics.fillStyle(0x767c82, 1);
    graphics.lineStyle(3, 0x41474d, 1);
    graphics.fillRoundedRect(8, 14, width - 16, height - 24, 10);
    graphics.strokeRoundedRect(8, 14, width - 16, height - 24, 10);
    graphics.fillStyle(0xa1a7ac, 0.25);
    graphics.fillRoundedRect(11, 18, width - 24, 10, 6);
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

  shadeColor(color, amount) {
    const r = Phaser.Math.Clamp(((color >> 16) & 0xff) + amount, 0, 255);
    const g = Phaser.Math.Clamp(((color >> 8) & 0xff) + amount, 0, 255);
    const b = Phaser.Math.Clamp((color & 0xff) + amount, 0, 255);
    return (r << 16) | (g << 8) | b;
  }
}

export const gameScenes = [BootScene, StartScene, GameScene, ResultScene];
