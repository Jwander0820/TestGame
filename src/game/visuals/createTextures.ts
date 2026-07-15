import Phaser from 'phaser';

export function createSpikeTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('player')) {
    const player = scene.make.graphics({ x: 0, y: 0 });
    player.fillStyle(0xffd447, 1);
    player.fillRoundedRect(0, 0, 34, 42, 10);
    player.lineStyle(4, 0x1d2a33, 1);
    player.strokeRoundedRect(2, 2, 30, 38, 8);
    player.fillStyle(0x1d2a33, 1);
    player.fillCircle(11, 17, 2.5);
    player.fillCircle(23, 17, 2.5);
    player.lineStyle(2, 0x1d2a33, 1);
    player.beginPath();
    player.arc(17, 24, 6, 0.2, Math.PI - 0.2, false);
    player.strokePath();
    player.generateTexture('player', 34, 42);
    player.destroy();
  }

  if (!scene.textures.exists('platform')) {
    const platform = scene.make.graphics({ x: 0, y: 0 });
    platform.fillStyle(0x1faf9d, 1);
    platform.fillRect(0, 0, 96, 24);
    platform.fillStyle(0x147b70, 1);
    platform.fillRect(0, 16, 96, 8);
    platform.lineStyle(3, 0x1d2a33, 1);
    platform.strokeRect(1.5, 1.5, 93, 21);
    platform.generateTexture('platform', 96, 24);
    platform.destroy();
  }
}
