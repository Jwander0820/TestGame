import Phaser from 'phaser';
import { publishGameStatus } from '../events';
import type { InputController } from '../input/InputController';
import type { ProgressStore } from '../state/progress';
import { IdleTrigger } from '../state/IdleTrigger';
import { createSpikeTextures } from '../visuals/createTextures';

interface SpikeSceneDependencies {
  readonly inputController: InputController;
  readonly progressStore: ProgressStore;
}

export class SpikeScene extends Phaser.Scene {
  private readonly moveSpeed = 240;
  private readonly jumpSpeed = 470;
  private readonly spawn = new Phaser.Math.Vector2(110, 350);

  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private dying = false;
  private readonly idleTrigger = new IdleTrigger(8_000);

  private readonly resetIdleClock = (): void => {
    this.idleTrigger.reset();
  };

  constructor(private readonly dependencies: SpikeSceneDependencies) {
    super('SpikeScene');
  }

  create(): void {
    createSpikeTextures(this);
    this.drawWorld();
    this.createPlatforms();
    this.createPlayer();
    this.createHazards();

    document.addEventListener('visibilitychange', this.resetIdleClock);
    window.addEventListener('focus', this.resetIdleClock);
    window.addEventListener('blur', this.resetIdleClock);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.resetIdleClock);
      window.removeEventListener('focus', this.resetIdleClock);
      window.removeEventListener('blur', this.resetIdleClock);
    });

    const deaths = this.dependencies.progressStore.snapshot.totalDeaths;
    publishGameStatus({
      deaths,
      message: deaths === 0 ? '方向鍵或 A／D 移動，空白鍵跳躍。' : '它還記得你之前死過。真貼心。',
    });
  }

  override update(): void {
    if (this.dying) {
      return;
    }

    const actions = this.dependencies.inputController.actions;
    const horizontal = Number(actions.isDown('right')) - Number(actions.isDown('left'));
    this.player.setVelocityX(horizontal * this.moveSpeed);

    if (actions.isAnyDown()) {
      this.resetIdleClock();
    }

    if (horizontal !== 0) {
      this.player.setFlipX(horizontal < 0);
    }

    const body = this.player.body;
    if (actions.consumeJumpPressed() && body?.blocked.down === true) {
      this.player.setVelocityY(-this.jumpSpeed);
    }

    if (this.player.y > 590) {
      this.beginDeath('你找到世界的底了。那裡什麼都沒有。');
    }

    this.updateIdleEgg();
  }

  private drawWorld(): void {
    this.cameras.main.setBackgroundColor('#ddf4ff');

    const paperGrid = this.add.graphics();
    paperGrid.lineStyle(1, 0x9fd5e8, 0.35);
    for (let x = 0; x <= 960; x += 48) {
      paperGrid.lineBetween(x, 0, x, 540);
    }
    for (let y = 0; y <= 540; y += 48) {
      paperGrid.lineBetween(0, y, 960, y);
    }

    this.add
      .text(42, 38, '請安全抵達右邊。\n（我們應該沒有動手腳）', {
        color: '#1d2a33',
        fontFamily: 'Nunito, Noto Sans TC, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        lineSpacing: 6,
      })
      .setAlpha(0.86);

    this.add
      .text(752, 390, '技術尖峰\n終點 →', {
        align: 'center',
        backgroundColor: '#fff9e8',
        color: '#1d2a33',
        fontFamily: 'Nunito, Noto Sans TC, sans-serif',
        fontSize: '18px',
        padding: { x: 12, y: 8 },
      })
      .setRotation(-0.03);
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(96, 420, 3.15);
    this.addPlatform(430, 370, 1.4);
    this.addPlatform(610, 300, 1.05);
    this.addPlatform(780, 370, 2.1);
  }

  private addPlatform(x: number, y: number, scaleX: number): void {
    const platform = this.platforms.create(x, y, 'platform') as Phaser.Physics.Arcade.Sprite;
    platform.setScale(scaleX, 1).refreshBody();
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(this.moveSpeed, 780);
    this.player.body?.setSize(28, 39, true);
    this.physics.add.collider(this.player, this.platforms);
  }

  private createHazards(): void {
    const danger = this.add.rectangle(552, 510, 150, 44, 0xe95d5d, 1);
    danger.setStrokeStyle(4, 0x1d2a33, 1);
    this.physics.add.existing(danger, true);
    this.add
      .text(552, 510, '完全安全', {
        color: '#fff9e8',
        fontFamily: 'Nunito, Noto Sans TC, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.physics.add.overlap(this.player, danger, () => {
      this.beginDeath('紅色通常代表安全。這次例外。');
    });
  }

  private beginDeath(message: string): void {
    if (this.dying) {
      return;
    }

    this.dying = true;
    this.resetIdleClock();
    this.player.setTint(0xb9382c);
    this.player.setVelocity(0, -180);
    this.player.body!.enable = false;

    const state = this.dependencies.progressStore.recordDeath();
    publishGameStatus({ deaths: state.totalDeaths, message });

    const annotation = this.add
      .text(this.player.x, Math.max(80, this.player.y - 62), '這次真的算。', {
        color: '#b9382c',
        fontFamily: 'Fredoka, Noto Sans TC, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        stroke: '#fff9e8',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setRotation(-0.06);

    this.time.delayedCall(900, () => {
      annotation.destroy();
      this.respawn();
    });
  }

  private respawn(): void {
    this.player.clearTint();
    this.player.setPosition(this.spawn.x, this.spawn.y);
    this.player.setVelocity(0, 0);
    this.player.body!.enable = true;
    this.dying = false;
    this.resetIdleClock();
    publishGameStatus({
      deaths: this.dependencies.progressStore.snapshot.totalDeaths,
      message: '好，當作什麼都沒發生。',
    });
  }

  private updateIdleEgg(): void {
    const eligible =
      document.visibilityState === 'visible' &&
      document.hasFocus() &&
      this.player.body?.blocked.down === true &&
      !this.dependencies.inputController.actions.isAnyDown();

    if (!this.idleTrigger.update(performance.now(), eligible)) {
      return;
    }

    publishGameStatus({
      deaths: this.dependencies.progressStore.snapshot.totalDeaths,
      message: '你是在等遊戲先道歉嗎？',
    });

    const annotation = this.add
      .text(this.player.x + 18, this.player.y - 72, '……要我先走？', {
        color: '#b9382c',
        fontFamily: 'Fredoka, Noto Sans TC, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
        stroke: '#fff9e8',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setRotation(-0.05);

    this.time.delayedCall(2_400, () => annotation.destroy());
  }
}
