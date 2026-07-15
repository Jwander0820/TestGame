import Phaser from 'phaser';

export function createGameTextures(scene: Phaser.Scene): void {
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

  if (!scene.textures.exists('spring')) {
    const spring = scene.make.graphics({ x: 0, y: 0 });
    spring.fillStyle(0xffd447, 1);
    spring.fillRoundedRect(0, 0, 54, 14, 5);
    spring.lineStyle(3, 0x1d2a33, 1);
    spring.strokeRoundedRect(1.5, 1.5, 51, 11, 4);
    spring.lineStyle(4, 0xb9382c, 1);
    spring.lineBetween(10, 14, 18, 28);
    spring.lineBetween(18, 28, 27, 14);
    spring.lineBetween(27, 14, 36, 28);
    spring.lineBetween(36, 28, 44, 14);
    spring.generateTexture('spring', 54, 30);
    spring.destroy();
  }

  if (!scene.textures.exists('tape-platform')) {
    const tape = scene.make.graphics({ x: 0, y: 0 });
    tape.fillStyle(0xfff1b2, 1);
    tape.fillRoundedRect(0, 0, 96, 20, 4);
    tape.lineStyle(3, 0xb9382c, 1);
    tape.strokeRoundedRect(1.5, 1.5, 93, 17, 3);
    tape.lineStyle(2, 0xb9382c, 0.55);
    tape.lineBetween(12, 4, 26, 16);
    tape.lineBetween(48, 4, 62, 16);
    tape.lineBetween(78, 4, 90, 15);
    tape.generateTexture('tape-platform', 96, 20);
    tape.destroy();
  }
}
