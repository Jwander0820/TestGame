import Phaser from 'phaser';
import type { GameDependencies } from '../config';
import { LEVEL_TWO_ID, LEVEL_TWO_WORLD, LEVEL_TWO_PLATFORMS, LEVEL_TWO_EFFECT_IDS, LEVEL_TWO_CLOCKWORK as layout,
  LEVEL_TWO_CHECKPOINTS, getLevelTwoCompletionCopy, isLevelTwoEffectId } from '../content/levelTwo';
import { LEVEL_ONE_PLAYER_PHYSICS as physics } from '../content/levelOneLayout';
import { CLOCKWORK_MALICE as maliceLayout, CLOCKWORK_MALICE_DEATHS } from '../content/clockworkMalice';
import { PIXEL_PALETTE as p, LEVEL_ONE_TEXT_COLORS } from '../content/levelOneVisuals';
import { publishGameStatus } from '../events';
import { LevelTwoSession } from '../session/LevelTwoSession';
import { ClockworkState } from '../state/ClockworkState';
import { ClockworkMaliceState } from '../state/ClockworkMaliceState';
import { clockworkContact } from '../state/clockworkCollision';
import type { CollisionRect } from '../state/GoalStampState';
import { DialogueQueue } from '../state/DialogueQueue';
import { SceneLifecycle } from '../state/SceneLifecycle';
import { addGameText } from '../visuals/addGameText';
import { createGameTextures } from '../visuals/createTextures';
import { loadLevelOneArt, prepareLevelOneArt } from '../visuals/levelOneArt';
import { drawClockwork, drawClockworkPlatform, drawClockworkMercy, updateClockworkArt } from '../visuals/clockworkVisuals';
import { drawClockworkMalice, updateClockworkMaliceArt } from '../visuals/clockworkMaliceVisuals';

/** 第二關只持有世界物件；機關有效時間和保存交易各有自己的模組。 */
export class LevelTwoScene extends Phaser.Scene {
  private readonly session: LevelTwoSession;
  private readonly lifecycle = new SceneLifecycle();
  private readonly dialogue = new DialogueQueue();
  private machine = new ClockworkState();
  private malice = new ClockworkMaliceState();
  private player!: Phaser.Physics.Arcade.Sprite;
  private art!: ReturnType<typeof drawClockwork>;
  private maliceArt!: ReturnType<typeof drawClockworkMalice>;
  private carrierBody!: Phaser.GameObjects.Zone;
  private platforms = new Map<string, { zone: Phaser.GameObjects.Zone; art: Phaser.GameObjects.Container }>();
  private applied = new Set<string>();
  private seen = new Set<string>();
  private playTime = 0;
  private mercyDeployed = false;
  private carrierBridgeLevel = 0;
  private spawn = { x: 110, y: 390 };
  private reducedMotion = false;
  private previousPlayerRect: CollisionRect | null = null;

  constructor(private readonly dependencies: GameDependencies) {
    super('LevelTwoScene');
    this.session = new LevelTwoSession(dependencies.progressStore);
  }

  preload(): void { loadLevelOneArt(this); }

  create(): void {
    this.lifecycle.reset(); this.dialogue.reset();
    this.machine = new ClockworkState(); this.malice = new ClockworkMaliceState(); this.platforms.clear(); this.seen.clear();
    this.applied = new Set(this.session.activeAssistIds);
    this.playTime = 0; this.mercyDeployed = false; this.carrierBridgeLevel = 0;
    this.previousPlayerRect = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.spawn = { ...this.session.initialSpawn };
    this.dependencies.inputController.clear();
    this.dependencies.playtestDriver?.reset(this.dependencies.inputController.actions);
    createGameTextures(this);
    prepareLevelOneArt(this);
    this.physics.world.setBounds(0, 0, LEVEL_TWO_WORLD.width, 760);
    this.art = drawClockwork(this);
    this.maliceArt = drawClockworkMalice(this);
    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'player').setDepth(8);
    this.player.body?.setSize(physics.bodyWidth, physics.bodyHeight, true);
    for (const platform of LEVEL_TWO_PLATFORMS) this.addPlatform(platform.id, platform.x, platform.y, platform.width);
    // 一張可跳上、也能直接跳回主線的非必要巡鐘台。
    this.addPlatform('clock-keeper-cache', 235, 340, 90, false, true);
    addGameText(this, 235, 288, '巡鐘台', 14, LEVEL_ONE_TEXT_COLORS.ink).setOrigin(0.5).setDepth(4);
    this.carrierBody = this.add.zone(layout.carrier.startX, layout.carrier.startY + 12, layout.carrier.width, 24).setName('clockwork-carrier');
    this.physics.add.existing(this.carrierBody, true);
    this.physics.add.collider(this.player, this.carrierBody);
    this.syncAssists();
    this.updateArt();
    this.cameras.main.setBounds(0, 0, LEVEL_TWO_WORLD.width, LEVEL_TWO_WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -130, 30);
    this.cameras.main.setDeadzone(280, 180);
    this.say(this.session.finalMercy ? ['工務處｜整條運送線已改為乘客優先。向右走就到。'] : [
      '關卡｜歡迎來到王城鐘塔。這裡只運貨，不運勇者。',
      '勇者｜可是告示寫「歡迎搭乘」。\n工務處｜你看清楚，下面還有一行「後果自負」。',
    ], this.session.finalMercy ? 4 : 0);
  }

  override update(_time: number, delta: number): void {
    if (this.lifecycle.phase === 'completed') return;
    // 背景恢復或低幀率不一次跳過整段預告／殺傷時間。
    delta = Math.max(0, Math.min(delta, 50));
    const line = this.dialogue.advance(delta);
    if (line !== null) this.publish();
    if (!this.lifecycle.isPlaying) return;
    this.playTime += delta;
    const body = this.player.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) return;
    const oldCarrier = { x: this.carrierBody.x, y: this.carrierBody.y - 12 };
    const grounded = body.blocked.down || body.touching.down;
    // 靜態載台每幀更新頂面時，Arcade 的 grounded 可能短暫清空。
    // 以腳底接觸與下降速度承載，並要求身體中心已在台面上，不能在岸邊就開走。
    const riding = !this.mercyDeployed && this.carrierBody.body instanceof Phaser.Physics.Arcade.StaticBody && this.carrierBody.body.enable && body.velocity.y >= 0 &&
      Math.abs(body.bottom - oldCarrier.y) < 5 && this.player.x >= oldCarrier.x - layout.carrier.width / 2 + physics.bodyWidth / 2 &&
      this.player.x <= oldCarrier.x + layout.carrier.width / 2 - physics.bodyWidth / 2;
    if (riding && this.machine.triggerCarrier()) this.route('carrier', [
      '運送台｜貨物請站穩，途中不接受退貨。',
      '勇者｜我不是貨。\n運送台｜那請自行辦理卸貨。',
    ]);
    if (!this.mercyDeployed && this.player.x > 915 && this.player.x < 1130) this.machine.triggerSteam();
    if (!this.mercyDeployed && this.player.x > 1710 && this.player.x < 1920) this.machine.triggerPress();
    const previousPressY = this.machine.pressY;
    const steamWasActive = this.machine.steamActive;
    const pressWasActive = this.machine.pressActive;
    const previousMalice = this.malice.sample;
    this.machine.advance(delta);
    if (!this.mercyDeployed) {
      if (this.machine.carrier.phase === 'arrived' && this.malice.triggerDock()) this.route('dock', [
        '運送台｜到站，請立即下貨。\n勇者｜下車才對吧？',
      ]);
      if (this.machine.steamPhase === 'spent' && this.player.x > maliceLayout.backwash.triggerX) this.malice.triggerBackwash();
      if (this.machine.pressPhase === 'spent' && this.player.x > maliceLayout.recall.triggerX) this.malice.triggerRecall();
      if (this.player.x > maliceLayout.bell.triggerX) this.malice.triggerBell();
    }
    this.malice.advance(delta);
    const currentMalice = this.malice.sample;
    this.carrierBody.setPosition(Math.round(this.machine.carrier.x), Math.round(this.machine.carrier.y) + 12);
    (this.carrierBody.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    if (riding) {
      const dx = this.carrierBody.x - oldCarrier.x;
      const dy = this.carrierBody.y - 12 - oldCarrier.y;
      this.player.setPosition(this.player.x + dx, this.player.y + dy);
      // 同步身體與物理前一幀，保留速度、offset 與碰撞旗標，避免重生 reset 的副作用。
      body.position.x += dx; body.position.y += dy;
      body.prev.x += dx; body.prev.y += dy;
      body.prevFrame.x += dx; body.prevFrame.y += dy;
      body.updateCenter();
    }
    this.updateArt();
    const actions = this.dependencies.inputController.actions;
    this.dependencies.playtestDriver?.update({
      levelId: LEVEL_TWO_ID, area: 'main', x: this.player.x, y: this.player.y,
      grounded: grounded || riding, timeMs: this.playTime,
      clockwork: { carrierX: this.machine.carrier.x, carrierY: this.machine.carrier.y,
        carrierPhase: this.machine.carrier.phase, steamPhase: this.machine.steamPhase,
        pressPhase: this.machine.pressPhase, finalMercy: this.mercyDeployed, malice: currentMalice },
    }, actions);
    const horizontal = Number(actions.isDown('right')) - Number(actions.isDown('left'));
    const onBelt = !this.mercyDeployed && grounded && this.player.x > layout.conveyor.left && this.player.x < layout.conveyor.right && Math.abs(body.bottom - layout.conveyor.topY) < 6;
    const beltSpeed = currentMalice.conveyorOverride ?? this.machine.conveyorSpeed;
    this.player.setVelocityX(horizontal * physics.moveSpeed + (onBelt ? beltSpeed : 0));
    if (horizontal !== 0) this.player.setFlipX(horizontal < 0);
    const jump = actions.consumeJumpPressed() && (grounded || riding);
    if (jump) this.player.setVelocityY(-physics.jumpSpeed);
    if (jump || !grounded) { this.player.anims.stop(); this.player.setTexture('player-jump'); }
    else if (horizontal !== 0 || onBelt) this.player.play('hero-run', true);
    else { this.player.anims.stop(); this.player.setTexture('player'); }

    const steam = layout.steam, press = layout.press;
    if ((steamWasActive || this.machine.steamActive) && this.overlaps(steam.x - steam.width / 2, steam.x + steam.width / 2, steam.topY, steam.topY + steam.height)) {
      this.die('steam-burst', 'clockwork-steam', '關卡｜這是蒸汽消毒。\n工務處｜我們沒有申請對勇者消毒。'); return;
    }
    if (this.movingTrapContact(press, previousPressY, this.machine.pressY, pressWasActive, this.machine.pressActive)) {
      this.die('sorting-press', 'clockwork-sorter', '分揀機｜勇者，歸類為扁平包裹。\n工務處｜取消歸類。立刻。'); return;
    }
    // 陷阱與玩家一起做相對掃碰；不能穿透，也不能把錯開的移動誤判成碰撞。
    const dock = maliceLayout.dock;
    if (this.movingTrapContact(dock, previousMalice.dockY, currentMalice.dockY, previousMalice.dockActive, currentMalice.dockActive)) {
      const death = CLOCKWORK_MALICE_DEATHS.dock;
      this.die(death.causeId, death.blockerId, '卸貨閘｜已替貨物裁切多餘部分。\n勇者｜多餘的是你的安全告示吧。'); return;
    }
    const backwash = maliceLayout.backwash;
    if ((previousMalice.backwashActive || currentMalice.backwashActive) && this.overlaps(backwash.x - backwash.width / 2,
      backwash.x + backwash.width / 2, backwash.topY, backwash.topY + backwash.height)) {
      const death = CLOCKWORK_MALICE_DEATHS.backwash;
      this.die(death.causeId, death.blockerId, '勇者｜你剛才不是說洩壓完成？\n鍋爐｜主表完成。旁管沒填那張表。'); return;
    }
    const recall = maliceLayout.recall;
    if ((previousMalice.recallActive || currentMalice.recallActive) && this.overlaps(recall.x - recall.width / 2,
      recall.x + recall.width / 2, recall.topY, recall.topY + recall.height)) {
      const death = CLOCKWORK_MALICE_DEATHS.recall;
      this.die(death.causeId, death.blockerId, '分揀機｜快速出口已完成封口。\n工務處｜你把乘客封進包裹了。'); return;
    }
    const bell = maliceLayout.bell;
    if (this.movingTrapContact(bell, previousMalice.bellY, currentMalice.bellY, previousMalice.bellActive, currentMalice.bellActive)) {
      const death = CLOCKWORK_MALICE_DEATHS.bell;
      this.die(death.causeId, death.blockerId, '勇者｜這口鐘真的能敲？\n巡鐘員｜真的。配重也是真的。'); return;
    }
    if (this.player.y > 590 || this.player.x < -24) {
      const carrierFall = this.player.x >= 390 && this.player.x < 950;
      const blocker = carrierFall ? 'clockwork-carrier' : this.player.x < 1390 ? 'clockwork-steam' : 'clockwork-sorter';
      this.die(carrierFall ? 'carrier-fall' : 'clockwork-void', blocker,
        carrierFall ? '運送台｜貨物遺失。\n勇者｜你至少先問我是誰。' : '工務處｜下層倉庫不收勇者。我們送你回來。'); return;
    }
    this.previousPlayerRect = { x: body.x, y: body.y, width: body.width, height: body.height };
    this.updateCheckpoints(grounded || riding);
    if (this.player.x > 185 && this.player.x < 280 && this.player.y < 325 && grounded && !this.seen.has('egg')) {
      this.seen.add('egg');
      if (this.session.discoverEasterEgg('clockwork-keeper-overtime') !== null) this.say([
        '巡鐘員｜這鐘每小時慢一分鐘，所以我每小時加班一分鐘。',
        '勇者｜那你有下班過嗎？\n巡鐘員｜鐘還沒同意。',
      ], 1);
    }
    const atGoal = this.player.x >= 2730 && grounded && (this.mercyDeployed || body.bottom < 375);
    if (atGoal && ['spent', 'retired'].includes(currentMalice.bellPhase)) this.finish();
  }

  private addPlatform(id: string, x: number, topY: number, width: number, repair = false, suspended = false): void {
    const zone = this.add.zone(x, topY + 12, width, 24).setName(id);
    this.physics.add.existing(zone, true);
    this.physics.add.collider(this.player, zone);
    const art = drawClockworkPlatform(this, x - width / 2, topY, width, suspended ? 'suspended' : repair ? 'repair' : 'stone');
    this.platforms.set(id, { zone, art });
  }

  private updateArt(): void {
    this.art.carrier.setPosition(Math.round(this.machine.carrier.x), Math.round(this.machine.carrier.y));
    this.art.steam.setVisible(this.machine.steamActive);
    this.art.steamWarning.setVisible(this.machine.steamPhase === 'tell').setText('壓力上升・先等洩壓');
    this.art.press.setY(Math.round(this.machine.pressY)).setVisible(this.machine.pressPhase !== 'retired');
    this.art.pressWarning.setVisible(['tell', 'fall', 'hold'].includes(this.machine.pressPhase)).setText('分揀中・貨物請退後');
    const sample = this.malice.sample;
    const beltSpeed = sample.conveyorOverride ?? this.machine.conveyorSpeed;
    updateClockworkArt(this.art, { beltStopped: beltSpeed === 0, beltReversed: beltSpeed > 0,
      beltOffset: this.reducedMotion ? 0 : this.playTime / 80 * (beltSpeed > 0 ? 1 : -1) });
    updateClockworkMaliceArt(this.maliceArt, sample);
    if (!this.reducedMotion && !this.mercyDeployed) for (const gear of this.art.gears) gear.angle = this.playTime / 80;
  }

  private syncAssists(): void {
    const ids = [...this.applied];
    this.machine.setAssists(ids, this.session.finalMercy);
    this.malice.setAssists(ids, this.session.finalMercy);
    const fullBridge = ids.includes(LEVEL_TWO_EFFECT_IDS.carrierBridge) || ids.includes(LEVEL_TWO_EFFECT_IDS.retireCarrier);
    const rail = ids.includes(LEVEL_TWO_EFFECT_IDS.carrierRail);
    if (!this.session.finalMercy && (fullBridge ? 2 : rail ? 1 : 0) > this.carrierBridgeLevel) {
      this.carrierBridgeLevel = fullBridge ? 2 : 1;
      if (fullBridge) {
        this.disablePlatform('carrier-shore');
        // 所有保存據點仍落在連續步道上，不重新要求搭乘。
        const floor = layout.assistance.carrierBridge;
        this.addPlatform(floor.id, floor.x, floor.y, floor.width, true);
      } else {
        const rail = layout.assistance.carrierRail;
        this.addPlatform(rail.id, rail.x, rail.y, rail.width, true);
      }
    }
    if (!this.session.finalMercy || this.mercyDeployed) return;
    this.mercyDeployed = true;
    for (const [id] of this.platforms) this.disablePlatform(id);
    if (this.carrierBody.body instanceof Phaser.Physics.Arcade.StaticBody) this.carrierBody.body.enable = false;
    this.art.carrier.setVisible(false); this.art.belt.setVisible(false);
    const walkway = layout.assistance.finalWalkway;
    const lane = this.add.zone(walkway.x, walkway.y + 12, walkway.width, 24).setName(walkway.id);
    this.physics.add.existing(lane, true); this.physics.add.collider(this.player, lane);
    drawClockworkMercy(this);
    this.updateArt();
  }

  private disablePlatform(id: string): void {
    const platform = this.platforms.get(id);
    if (!platform) return;
    if (platform.zone.body instanceof Phaser.Physics.Arcade.StaticBody) platform.zone.body.enable = false;
    platform.art.setVisible(false);
  }

  private overlaps(left: number, right: number, top: number, bottom: number): boolean {
    const body = this.player.body;
    return body !== null && body.x < right && body.right > left && body.y < bottom && body.bottom > top;
  }

  private movingTrapContact(trap: { readonly x: number; readonly width: number; readonly height: number },
    previousY: number, y: number, wasActive: boolean, active: boolean): boolean {
    const body = this.player.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) return false;
    const player = { x: body.x, y: body.y, width: body.width, height: body.height };
    const bounds = { x: trap.x - trap.width / 2, y, width: trap.width, height: trap.height };
    return clockworkContact({ ...bounds, y: previousY }, bounds, this.previousPlayerRect ?? player, player, wasActive, active);
  }

  private updateCheckpoints(grounded: boolean): void {
    if (!grounded) return;
    const checkpoint = [...LEVEL_TWO_CHECKPOINTS].reverse().find(station => this.player.x >= station.x);
    const order = checkpoint?.order ?? 0;
    if (order <= this.session.progressOrder) return;
    this.session.advanceMarker(checkpoint?.id ?? 'start', order);
    this.spawn = { ...this.session.initialSpawn };
    this.route(`checkpoint-${order}`, order === 1 ? [
      '工務處｜運送站已保存。下一道閘門，壓力表寫什麼先別急著信。',
      '關卡｜蒸汽已經通過安全驗收。\n工務處｜通過的是管子。',
    ] : order === 2 ? [
      '勇者｜地板怎麼往回走？\n關卡｜這樣貨物就不會太快離開。',
      '分揀機｜驗收完成後，請走快速出口。\n勇者｜這句聽起來太貼心了。',
    ] : ['巡鐘員｜到鐘塔了。上面那口鐘真的可以敲。\n勇者｜你是不是少講了什麼？']);
    this.publish();
  }

  private die(causeId: string, blockerId: string, message: string): void {
    if (!this.lifecycle.beginDeath()) return;
    this.dependencies.inputController.clear(); this.player.setVelocity(0, 0);
    this.player.anims.stop(); this.player.setTint(p.danger500);
    if (this.player.body !== null) this.player.body.enable = false;
    const result = this.session.recordDeath({ causeId, blockerId, x: this.player.x, y: this.player.y }, id => {
      if (!isLevelTwoEffectId(id)) return false;
      this.applied.add(id); this.syncAssists(); return true;
    });
    this.syncAssists();
    this.say(this.session.finalMercy ? ['工務處｜禁止再把勇者當包裹。整線鋪平，乘客優先，向右走。'] :
      [result.reaction?.message ?? message], this.session.finalMercy ? 4 : 3, true);
    if (!this.reducedMotion) this.cameras.main.shake(90, 0.003);
    this.time.delayedCall(680, () => this.respawn());
  }

  private respawn(): void {
    if (!this.lifecycle.isDying) return;
    this.machine.resetAttempt(); this.malice.resetAttempt(); this.syncAssists(); this.updateArt();
    this.previousPlayerRect = null;
    this.player.clearTint().setPosition(this.spawn.x, this.spawn.y).setVelocity(0, 0);
    if (this.player.body !== null) { this.player.body.enable = true; this.player.body.reset(this.spawn.x, this.spawn.y); }
    this.lifecycle.respawn(); this.dependencies.inputController.clear(); this.publish();
  }

  private finish(): void {
    if (!this.lifecycle.complete()) return;
    this.session.complete(); this.player.setVelocity(0, 0); this.player.anims.stop();
    if (this.player.body !== null) this.player.body.enable = false;
    this.machine.setAssists([...this.applied], true); this.malice.setAssists([...this.applied], true); this.updateArt();
    this.dependencies.inputController.clear();
    if (!this.reducedMotion) this.tweens.add({ targets: this.art.bell, angle: 14, duration: 160, yoyo: true, repeat: 2 });
    const completion = getLevelTwoCompletionCopy(this.session.levelDeaths, this.session.activeAssistCount, this.session.finalMercy);
    addGameText(this, layout.goal.x, 180, completion.banner, 26, LEVEL_ONE_TEXT_COLORS.ink)
      .setOrigin(0.5).setBackgroundColor(LEVEL_ONE_TEXT_COLORS.parchment).setPadding(12, 8).setDepth(20);
    this.say([completion.status], 5, true);
  }

  private route(id: string, lines: readonly string[]): void {
    if (this.seen.has(id)) return;
    this.seen.add(id); this.say(lines, 0);
  }
  private say(lines: readonly string[], priority: number, interrupt = false): void {
    if (this.dialogue.offer(lines, priority, interrupt)) this.publish();
  }
  private publish(): void {
    publishGameStatus({ levelId: LEVEL_TWO_ID, deaths: this.session.totalDeaths, message: this.dialogue.current, phase: this.lifecycle.phase });
  }
}
