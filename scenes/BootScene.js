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
    this.makeCircleTexture("enemy-circle", 40, 0x7fb36b, 0x2c5132);
    this.makeOvalTexture("enemy-oval", 50, 34, 0x7fb36b, 0x2c5132);
    this.makeTriangleTexture("enemy-triangle", 46, 0x7fb36b, 0x2c5132);
    this.makeSquareTexture("enemy-square", 42, 0x7fb36b, 0x2c5132);
    this.makeCircleTexture("pellet", 8, 0xffe08c, 0x7f5a23);
    this.makeCircleTexture("pistol-bullet", 6, 0xfff4bf, 0x85672f);
    this.makeCircleTexture("grenade-orb", 18, 0x4f5962, 0x1d242b);
    this.makeRoundedRectTexture("ammo-box", 50, 34, 8, 0xca8b4d, 0x5f3a1d);
    this.makeRoundedRectTexture("pistol-ammo-box", 50, 34, 8, 0x6f8fd8, 0x23385d);
    this.makeRoundedRectTexture("grenade-box", 50, 34, 8, 0x7b6a8b, 0x332348);
    this.makeRoundedRectTexture("shell-icon", 12, 28, 4, 0xd6ab5d, 0x6b471f);
    this.makeRoundedRectTexture("pistol-icon", 12, 20, 3, 0xd9edf9, 0x4d6f87);
    this.makeCircleTexture("grenade-icon", 12, 0xb4c0ca, 0x42505e);
    this.makeShotgunIconTexture("shotgun-icon", 34, 14, 0x7a532d, 0x24140b);
    this.makeMeleeIconTexture("melee-icon", 24, 10, 0xc89657, 0x5a3112);
    this.makeMedkitTexture("medkit-pickup", 30);
    this.makeStarTexture("xp-star", 28, 0xf8e37b, 0xa5791f);
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

  makeOvalTexture(key, width, height, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(4, strokeColor, 1);
    graphics.fillEllipse(width / 2, height / 2, width - 6, height - 6);
    graphics.strokeEllipse(width / 2, height / 2, width - 6, height - 6);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  makeTriangleTexture(key, size, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(4, strokeColor, 1);
    graphics.fillTriangle(size / 2, 4, size - 4, size - 4, 4, size - 4);
    graphics.strokeTriangle(size / 2, 4, size - 4, size - 4, 4, size - 4);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  makeSquareTexture(key, size, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(4, strokeColor, 1);
    graphics.fillRoundedRect(4, 4, size - 8, size - 8, 6);
    graphics.strokeRoundedRect(4, 4, size - 8, size - 8, 6);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  makeMedkitTexture(key, size) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xefe7d6, 1);
    graphics.lineStyle(3, 0x6e241f, 1);
    graphics.fillRoundedRect(2, 4, size - 4, size - 8, 6);
    graphics.strokeRoundedRect(2, 4, size - 4, size - 8, 6);
    graphics.fillStyle(0xc94a3d, 1);
    graphics.fillRect(size / 2 - 3, 8, 6, size - 16);
    graphics.fillRect(8, size / 2 - 3, size - 16, 6);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  makeStarTexture(key, size, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const points = [];
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size / 2 - 3;
    const innerRadius = outerRadius * 0.45;
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (Math.PI / 5) * i;
      points.push(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    }
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(3, strokeColor, 1);
    graphics.beginPath();
    graphics.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      graphics.lineTo(points[i], points[i + 1]);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  makeShotgunIconTexture(key, width, height, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.fillRoundedRect(2, height / 2 - 3, width - 6, 6, 3);
    graphics.strokeRoundedRect(2, height / 2 - 3, width - 6, 6, 3);
    graphics.fillRoundedRect(7, height / 2 - 1, 7, 9, 2);
    graphics.strokeRoundedRect(7, height / 2 - 1, 7, 9, 2);
    graphics.fillRect(width - 6, height / 2 - 2, 4, 4);
    graphics.generateTexture(key, width, height + 8);
    graphics.destroy();
  }

  makeMeleeIconTexture(key, width, height, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.fillRoundedRect(2, height / 2 - 2, width - 10, 4, 2);
    graphics.strokeRoundedRect(2, height / 2 - 2, width - 10, 4, 2);
    graphics.fillCircle(width - 7, height / 2, 4);
    graphics.strokeCircle(width - 7, height / 2, 4);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}

export const gameScenes = [BootScene, StartScene, GameScene, ResultScene];
