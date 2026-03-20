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
    this.makeRoundedRectTexture("ammo-box", 50, 34, 8, 0xca8b4d, 0x5f3a1d);
    this.makeRoundedRectTexture("shell-icon", 12, 28, 4, 0xd6ab5d, 0x6b471f);
  }

  makeCircleTexture(key, size, fillColor, strokeColor) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(4, strokeColor, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 4);
    graphics.strokeCircle(size / 2, size / 2, size / 2 - 4);
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
}

export const gameScenes = [BootScene, StartScene, GameScene, ResultScene];
