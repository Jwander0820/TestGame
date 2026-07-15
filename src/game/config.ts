import Phaser from 'phaser';
import type { InputController } from './input/InputController';
import { VerticalSliceScene } from './scenes/VerticalSliceScene';
import type { ProgressStore } from './state/progress';

export interface GameDependencies {
  readonly inputController: InputController;
  readonly progressStore: ProgressStore;
}

export function createGame(dependencies: GameDependencies): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-root',
    width: 960,
    height: 540,
    backgroundColor: '#ddf4ff',
    pixelArt: false,
    antialias: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1150 },
        fixedStep: true,
        fps: 60,
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 540,
    },
    scene: [new VerticalSliceScene(dependencies)],
  });
}
