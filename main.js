import { gameScenes } from "./scenes/BootScene.js";

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "game",
  backgroundColor: "#182028",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: gameScenes,
};

new Phaser.Game(config);
