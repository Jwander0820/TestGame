import { drawHero } from './heroPixels';
import { paintGroundTile } from './forestPainting';
import { graphicsPainter } from './pixelPainter';
import Phaser from 'phaser';
import {
  LEVEL_ONE_COLORS,
  LEVEL_ONE_COMPONENT_COLORS,
  PIXEL_PALETTE,
} from '../content/levelOneVisuals';

export const PLATFORM_TEXTURE_WIDTH = 96;

function createSourceTexture(
  scene: Phaser.Scene,
  sourceKey: string,
  textureKey: string,
  crop: readonly [number, number, number, number],
  width: number,
  height: number,
): boolean {
  if (!scene.textures.exists(sourceKey)) return false;
  const texture = scene.textures.createCanvas(textureKey, width, height);
  if (texture === null) return false;
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  texture.context.imageSmoothingEnabled = false;
  texture.context.drawImage(source, ...crop, 0, 0, width, height);
  texture.refresh();
  return true;
}

function createPlayerTexture(scene: Phaser.Scene): void {
  const poses = [
    { pose: 'idle', crop: [0, 15, 543, 640] },
    { pose: 'stride', crop: [543, 30, 543, 660] },
    { pose: 'pass', crop: [1086, 30, 543, 640] },
    { pose: 'jump', crop: [1629, 50, 543, 674] },
  ] as const;
  for (const { pose, crop } of poses) {
    const key = pose === 'idle' ? 'player' : `player-${pose}`;
    if (createSourceTexture(scene, 'hero-source', key, crop, 40, 48)) continue;
    const graphic = scene.make.graphics({ x: 0, y: 0 });
    drawHero(graphicsPainter(graphic), 0, 0, 2, pose);
    graphic.generateTexture(key, 32, 48);
    graphic.destroy();
  }
  if (!scene.anims.exists('hero-run')) {
    scene.anims.create({ key: 'hero-run', frames: [
      { key: 'player-stride' }, { key: 'player-pass' }, { key: 'player' }, { key: 'player-pass' },
    ], frameRate: 10, repeat: -1 });
  }
}
function createPlatformTexture(scene: Phaser.Scene): void {
  const platformColors = LEVEL_ONE_COMPONENT_COLORS.platform;
  const platform = scene.make.graphics({ x: 0, y: 0 });
  platform.fillStyle(platformColors.outline, 1);
  platform.fillRect(0, 0, PLATFORM_TEXTURE_WIDTH, 24);
  platform.fillStyle(platformColors.face, 1);
  platform.fillRect(2, 9, PLATFORM_TEXTURE_WIDTH - 4, 13);
  platform.fillStyle(platformColors.shadow, 1);
  platform.fillRect(2, 18, PLATFORM_TEXTURE_WIDTH - 4, 4);
  platform.fillStyle(platformColors.top, 1);
  platform.fillRect(2, 3, PLATFORM_TEXTURE_WIDTH - 4, 8);
  platform.fillStyle(PIXEL_PALETTE.grass200, 1);
  for (const x of [4, 18, 36, 58, 78, 88]) {
    platform.fillRect(x, 1, 4, 5);
  }
  platform.fillStyle(PIXEL_PALETTE.stone800, 1);
  for (const x of [31, 63]) {
    platform.fillRect(x, 12, 2, 10);
  }
  platform.generateTexture('platform', PLATFORM_TEXTURE_WIDTH, 24);
  platform.clear();
  if (scene.textures.exists('ground-source')) {
    const ground = scene.textures.createCanvas('forest-ground', 480, 54);
    if (ground !== null) {
      const source = scene.textures.get('ground-source').getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      ground.context.fillStyle = `#${PIXEL_PALETTE.stone800.toString(16).padStart(6, '0')}`;
      ground.context.fillRect(0, 0, 480, 54);
      ground.context.imageSmoothingEnabled = false;
      ground.context.drawImage(source, 80, 295, 1614, 370, 0, 0, 240, 54);
      // Mirror the second half so both the internal join and repeated outer edge match.
      ground.context.save();
      ground.context.translate(480, 0);
      ground.context.scale(-1, 1);
      ground.context.drawImage(source, 80, 295, 1614, 370, 0, 0, 240, 54);
      ground.context.restore();
      ground.refresh();
    }
  }
  if (!scene.textures.exists('forest-ground')) {
    paintGroundTile(graphicsPainter(platform));
    platform.generateTexture('forest-ground', PLATFORM_TEXTURE_WIDTH, 54);
  }
  platform.destroy();
}

function createSlimeTextures(scene: Phaser.Scene): void {
  createSourceTexture(scene, 'slime-square-source', 'slime-charger', [380, 385, 660, 430], 36, 28);
  createSourceTexture(scene, 'slime-round-source', 'slime-jumper', [1020, 230, 620, 530], 32, 32);
}

function createCoinTexture(scene: Phaser.Scene): void {
  createSourceTexture(scene, 'coin-source', 'crown-coin', [300, 300, 660, 640], 20, 20);
}

function createSlimeSpringTexture(scene: Phaser.Scene): void {
  const spring = scene.make.graphics({ x: 0, y: 0 });
  spring.fillStyle(LEVEL_ONE_COLORS.outline, 1);
  spring.fillRect(12, 5, 30, 3);
  spring.fillRect(8, 8, 38, 4);
  spring.fillRect(5, 12, 44, 12);
  spring.fillRect(9, 24, 36, 4);
  spring.fillStyle(LEVEL_ONE_COLORS.assist, 1);
  spring.fillRect(13, 8, 28, 3);
  spring.fillRect(9, 11, 36, 12);
  spring.fillRect(13, 23, 28, 3);
  spring.fillStyle(LEVEL_ONE_COLORS.assistHighlight, 1);
  spring.fillRect(13, 11, 12, 4);
  spring.fillStyle(LEVEL_ONE_COLORS.outline, 1);
  spring.fillRect(16, 15, 3, 4);
  spring.fillRect(34, 15, 3, 4);
  spring.fillRect(24, 21, 7, 2);
  spring.generateTexture('spring', 54, 30);
  spring.destroy();
}

function createMercyPlatformTexture(scene: Phaser.Scene): void {
  const bridge = LEVEL_ONE_COMPONENT_COLORS.mercyBridge;
  const platform = scene.make.graphics({ x: 0, y: 0 });
  platform.fillStyle(bridge.outline, 1);
  platform.fillRect(0, 0, PLATFORM_TEXTURE_WIDTH, 20);
  platform.fillStyle(bridge.plankShadow, 1);
  platform.fillRect(2, 4, PLATFORM_TEXTURE_WIDTH - 4, 14);
  platform.fillStyle(bridge.plank, 1);
  platform.fillRect(3, 3, 28, 11);
  platform.fillRect(34, 3, 28, 11);
  platform.fillRect(65, 3, 28, 11);
  platform.fillStyle(bridge.rope, 1);
  platform.fillRect(8, 1, 4, 18);
  platform.fillRect(84, 1, 4, 18);
  platform.generateTexture('mercy-platform', PLATFORM_TEXTURE_WIDTH, 20);
  platform.destroy();
}

export function createGameTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('player')) {
    createPlayerTexture(scene);
  }
  if (!scene.textures.exists('platform')) {
    createPlatformTexture(scene);
  }
  if (!scene.textures.exists('spring')) {
    createSlimeSpringTexture(scene);
  }
  if (!scene.textures.exists('mercy-platform')) {
    createMercyPlatformTexture(scene);
  }
  if (!scene.textures.exists('slime-charger') || !scene.textures.exists('slime-jumper')) {
    createSlimeTextures(scene);
  }
  if (!scene.textures.exists('crown-coin')) createCoinTexture(scene);
}
