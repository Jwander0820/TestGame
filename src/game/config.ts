import Phaser from 'phaser';
import { LEVEL_ONE_PLAYER_PHYSICS } from './content/levelOneLayout';
import type { InputController } from './input/InputController';
import { VerticalSliceScene } from './scenes/VerticalSliceScene';
import { BackstageScene } from './scenes/BackstageScene';
import { LevelTwoScene } from './scenes/LevelTwoScene';
import type { ProgressStore } from './state/progress';
import type { PlaytestDriver } from './testing/PlaytestDriver';
import { GAME_RENDERING } from './rendering';

export interface GameDependencies {
  readonly initialLevelId?: 'level-one' | 'level-two';
  readonly inputController: InputController;
  readonly progressStore: ProgressStore;
  readonly playtestDriver?: PlaytestDriver;
}

export function createGame(dependencies: GameDependencies): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-root',
    width: 960,
    height: 540,
    backgroundColor: '#ddf4ff',
    ...GAME_RENDERING,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: LEVEL_ONE_PLAYER_PHYSICS.gravityY },
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
    scene: dependencies.initialLevelId === 'level-two'
      ? [new LevelTwoScene(dependencies), new VerticalSliceScene(dependencies), new BackstageScene(dependencies)]
      : [new VerticalSliceScene(dependencies), new BackstageScene(dependencies), new LevelTwoScene(dependencies)],
  });
}
