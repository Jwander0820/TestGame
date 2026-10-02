import Phaser from 'phaser';
import type { GameDependencies } from '../config';
import { BACKSTAGE, BACKSTAGE_COPY } from '../content/backstage';
import { LEVEL_ONE_PLAYER_PHYSICS as physics } from '../content/levelOneLayout';
import { publishGameStatus } from '../events';
import { BackstageSign } from '../state/BackstageState';
import { BackstageDialogue } from '../state/BackstageDialogue';
import { BackstageSlimeWorker, BackstageSpring } from '../state/BackstageWorkshop';
import { PIXEL_PALETTE as p } from '../content/levelOneVisuals';
import { drawBackstage } from '../visuals/backstageVisuals';

export class BackstageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private art!: ReturnType<typeof drawBackstage>;
  private sign = new BackstageSign();
  private dialogue = new BackstageDialogue();
  private spring = new BackstageSpring();
  private slimeWorker = new BackstageSlimeWorker();
  private seen = new Set<string>();
  private recovering = false;
  private leaving = false;
  private elapsed = 0;
  constructor(private readonly dependencies: GameDependencies) { super(BACKSTAGE.scene); }

  create(): void {
    this.sign = new BackstageSign(); this.dialogue = new BackstageDialogue(); this.seen.clear();
    this.spring = new BackstageSpring(); this.slimeWorker = new BackstageSlimeWorker();
    this.recovering = false; this.leaving = false; this.elapsed = 0;
    this.dependencies.inputController.clear();
    this.art = drawBackstage(this);
    const floor = this.add.zone(480, BACKSTAGE.floorY + 12, 904, 24);
    this.physics.add.existing(floor, true);
    this.physics.world.setBounds(28, 0, 904, 700);
    this.player = this.physics.add.sprite(BACKSTAGE.spawn.x, BACKSTAGE.spawn.y, 'player').setDepth(8);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(physics.bodyWidth, physics.bodyHeight, true);
    this.physics.add.collider(this.player, floor);
    const first = !this.dependencies.progressStore.snapshot.discoveredEasterEggIds.includes(BACKSTAGE.egg);
    // Discovery belongs to the owning session; a room never records a death or checkpoint.
    this.game.events.emit('backstage-discovered');
    this.say(first ? BACKSTAGE_COPY.first : BACKSTAGE_COPY.repeat);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.cameras.main.fadeIn(180);
  }

  override update(_time: number, delta: number): void {
    if (this.leaving) return;
    this.elapsed += delta;
    const line = this.dialogue.advance(delta);
    if (line !== null) this.publish(line);
    const actions = this.dependencies.inputController.actions;
    this.dependencies.playtestDriver?.update({ x: this.player.x, y: this.player.y,
      grounded: this.player.body?.blocked.down === true, timeMs: this.elapsed, area: 'backstage' }, actions);
    if (this.recovering) { actions.releaseAll(); return; }
    const horizontal = Number(actions.isDown('right')) - Number(actions.isDown('left'));
    this.player.setVelocityX(horizontal * physics.moveSpeed);
    if (horizontal !== 0) this.player.setFlipX(horizontal < 0);
    const grounded = this.player.body?.blocked.down === true;
    const jumped = actions.consumeJumpPressed() && grounded;
    if (jumped) this.player.setVelocityY(-physics.jumpSpeed);
    if (!this.player.body?.blocked.down) { this.player.anims.stop(); this.player.setTexture('player-jump'); }
    else if (horizontal) this.player.play('hero-run', true);
    else { this.player.anims.stop(); this.player.setTexture('player'); }
    // Exit has no dialogue or hazard prerequisite.
    if (this.player.x > 835 && !this.seen.has('wave')) {
      this.seen.add('wave');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.tweens.add({ targets: this.art.workerHand, angle: -65, duration: 120, yoyo: true, repeat: 2 });
    }
    if (this.player.x >= BACKSTAGE.exitX) { this.leave(); return; }
    if (this.player.y > 570) { this.recover(); return; }
    if (this.player.x < 756 && this.player.x > 655) this.sign.trigger();
    const previousY = this.sign.y;
    const wasMoving = this.sign.phase === 'warning' || this.sign.phase === 'falling';
    this.sign.advance(delta);
    this.art.sign.setY(this.sign.y);
    this.art.warning.setVisible(this.sign.phase === 'warning' || this.sign.phase === 'falling');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.art.signCountdown.setVisible(this.sign.phase === 'warning');
    if (this.sign.phase === 'warning') this.art.signCountdown.setText(`落牌 ${Math.max(1, Math.ceil((BACKSTAGE.sign.tellMs - this.sign.elapsed) / 220))}`);
    this.art.sign.setX(BACKSTAGE.sign.x + (!reduced && this.sign.phase === 'warning' ? Math.round(Math.sin(this.elapsed / 35) * 3) : 0));
    const body = this.player.body;
    if (wasMoving && body && this.sign.hits(body.x, body.right, body.y, body.bottom, previousY)) {
      this.sign.phase = 'spent'; this.art.warning.setVisible(false); this.art.signCountdown.setVisible(false); this.say(BACKSTAGE_COPY.sign); this.recover(); return;
    }
    if (this.sign.phase === 'spent' && !this.seen.has('sign')) { this.seen.add('sign'); this.say(BACKSTAGE_COPY.sign); }
    if (this.player.x > 420 && this.player.x < 605 && this.visit('desk', BACKSTAGE_COPY.desk) && !reduced) {
      this.tweens.add({ targets: this.art.workerHand, angle: 55, duration: 220, yoyo: true, repeat: 2 });
    }
    if (this.player.x > 250 && this.player.x < 335 && this.visit('spikes', BACKSTAGE_COPY.spikes)) {
      if (reduced) this.art.testLabel.setText('測試通過');
      else this.tweens.add({ targets: this.art.spikes, y: 365, duration: 180, yoyo: true,
        onComplete: () => this.art.testLabel.setText('測試通過') });
    }
    if (this.player.x < 185) this.visit('slime', BACKSTAGE_COPY.slime);
    const wasWorking = this.slimeWorker.working;
    const caught = this.slimeWorker.advance(delta, this.player.x, this.player.flipX);
    const working = this.slimeWorker.working;
    if (wasWorking !== working) this.game.events.emit('backstage-worker', working, this.slimeWorker.catches);
    this.art.slime.setX(reduced ? BACKSTAGE.slime.x : this.slimeWorker.x);
    this.art.slimeCrate.setPosition(working ? this.art.slime.x + 37 : 190, working ? 407 : 418);
    this.art.slimeLabel.setText(working ? '搬運中（真的）' : '搬運中（休息）');
    if (caught && this.slimeWorker.catches === 3) this.say(BACKSTAGE_COPY.supervisor);
    if (this.spring.advance(delta, this.player.x, grounded, jumped)) {
      this.player.setVelocityY(-BACKSTAGE.spring.launchSpeed);
      this.game.events.emit('backstage-spring');
    }
    if (body && this.spring.touchBell({ left: body.x, right: body.right, top: body.y, bottom: body.bottom })) {
      const passes = this.spring.passes;
      this.art.workshop.result.setText(passes === 1 ? '一次通過' : passes === 2 ? '需要複驗' : '免驗通過');
      const lines = BACKSTAGE_COPY.spring[passes - 1];
      if (lines) this.say(lines);
      if (!reduced) this.tweens.add({ targets: this.art.workshop.bell, angle: 12, duration: 100, yoyo: true, repeat: 2 });
      this.game.events.emit('backstage-bell', passes);
    }
    this.art.workshop.hint.setText(this.spring.phase === 'charging' ? '蓄力・走開可取消' : this.spring.phase === 'release' ? '走開，再試一次' : '站定試彈 ↑');
    this.art.workshop.compression.setY(BACKSTAGE.floorY + (this.spring.phase === 'charging' ? 3 : 1));
    const charge = this.art.workshop.charge;
    charge.clear();
    if (this.spring.phase === 'charging') {
      const filled = Math.min(4, Math.floor(this.spring.elapsed / BACKSTAGE.spring.chargeMs * 4));
      for (let i = 0; i < 4; i++) charge.fillStyle(i < filled ? p.gold500 : p.stone800).fillRect(370 + i * 11, 441, 8, 4);
    }
  }

  private visit(id: string, lines: readonly string[]): boolean {
    if (this.seen.has(id)) return false;
    this.seen.add(id); this.say(lines); return true;
  }
  private say(lines: readonly string[]): void { const line = this.dialogue.offer(lines); if (line !== null) this.publish(line); }
  private publish(message: string): void { publishGameStatus({ area: 'backstage', deaths: this.dependencies.progressStore.snapshot.totalDeaths, message }); }
  private recover(): void {
    this.recovering = true; this.seen.add('sign');
    this.spring.resetCycle();
    this.dependencies.inputController.clear();
    this.player.setVelocity(0, 0); this.player.anims.stop();
    if (this.player.body) this.player.body.enable = false;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.player.setScale(1.3, 0.3).setY(BACKSTAGE.floorY - 7);
    this.art.net.setVisible(true);
    this.time.delayedCall(420, () => {
      this.player.setScale(1).setPosition(BACKSTAGE.spawn.x, BACKSTAGE.spawn.y);
      if (this.player.body) { this.player.body.enable = true; this.player.body.reset(BACKSTAGE.spawn.x, BACKSTAGE.spawn.y); }
      this.art.net.setVisible(false); this.recovering = false;
      this.dependencies.inputController.clear();
    });
  }
  private leave(): void {
    this.leaving = true; this.dependencies.inputController.clear();
    this.scene.wake('VerticalSliceScene');
    this.game.events.emit('backstage-return');
    this.scene.stop();
  }
}
