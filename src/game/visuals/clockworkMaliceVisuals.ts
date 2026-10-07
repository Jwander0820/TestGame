import type Phaser from 'phaser';
import { CLOCKWORK_MALICE as layout, type ClockworkMalicePhase } from '../content/clockworkMalice';
import { PIXEL_PALETTE as p, LEVEL_ONE_TEXT_COLORS as text } from '../content/levelOneVisuals';
import type { ClockworkMaliceSample } from '../state/ClockworkMaliceState';
import { addGameText } from './addGameText';

const material = {
  outline: p.ink950,
  metal: p.stone600,
  metalLight: p.stone400,
  metalShadow: p.stone800,
  copper: p.wood400,
  copperMid: p.wood600,
  copperShadow: p.wood800,
  safety: p.grass200,
  danger: p.danger500,
  dangerShadow: p.danger700,
  steam: p.assist500,
  steamShadow: p.mist700,
  royal: p.gold500,
  royalLight: p.gold300,
} as const;

const safeInk = `#${p.grass800.toString(16).padStart(6, '0')}`;
type Rect = (x: number, y: number, width: number, height: number, color: number) => void;

export interface ClockworkMaliceArt {
  readonly dock: Phaser.GameObjects.Container;
  readonly dockFace: Phaser.GameObjects.Graphics;
  readonly dockNotice: Phaser.GameObjects.Text;
  readonly dockLanding: Phaser.GameObjects.Graphics;
  readonly backwash: Phaser.GameObjects.Graphics;
  readonly backwashNotice: Phaser.GameObjects.Text;
  readonly backwashLanding: Phaser.GameObjects.Graphics;
  readonly recall: Phaser.GameObjects.Container;
  readonly recallFace: Phaser.GameObjects.Graphics;
  readonly recallNotice: Phaser.GameObjects.Text;
  readonly recallLanding: Phaser.GameObjects.Graphics;
  readonly bellCounterweight: Phaser.GameObjects.Container;
  readonly bellFace: Phaser.GameObjects.Graphics;
  readonly bellNotice: Phaser.GameObjects.Text;
  readonly bellLanding: Phaser.GameObjects.Graphics;
}

function rectangles(graphics: Phaser.GameObjects.Graphics): Rect {
  return (x, y, width, height, color): void => {
    graphics.fillStyle(color).fillRect(x, y, width, height);
  };
}

/** 無計時器、碰撞及聲音；必要危險與誤導告示只依狀態採樣呈現。 */
export function drawClockworkMalice(scene: Phaser.Scene): ClockworkMaliceArt {
  drawFixedFixtures(scene);
  const dock = scene.add.container(layout.dock.x, layout.dock.hiddenY).setDepth(5).setName('clockwork-dock-trap');
  const dockFace = scene.add.graphics();
  dock.add(dockFace);
  const dockNotice = notice(scene, layout.dock.x, 304, '到站請下貨 →');
  const dockLanding = landing(scene, layout.dock.x, 380, layout.dock.width);

  const backwash = scene.add.graphics().setPosition(layout.backwash.x, layout.backwash.topY).setDepth(5)
    .setVisible(false).setName('clockwork-backwash-trap');
  drawBackwash(backwash);
  const backwashNotice = notice(scene, layout.backwash.x, 287, '洩壓完成 →');
  const backwashLanding = landing(scene, layout.backwash.x, 428, layout.backwash.width);

  const recall = scene.add.container(layout.recall.x, layout.recall.topY).setDepth(5).setName('clockwork-recall-trap');
  const recallFace = scene.add.graphics();
  recall.add(recallFace);
  const recallNotice = notice(scene, layout.recall.x, 272, '驗收完成，快速出貨 →');
  const recallLanding = landing(scene, layout.recall.x, 428, layout.recall.width);

  const bellCounterweight = scene.add.container(layout.bell.x, layout.bell.hiddenY).setDepth(5).setName('clockwork-bell-trap');
  const bellFace = scene.add.graphics();
  bellCounterweight.add(bellFace);
  const bellNotice = notice(scene, 2_610, 249, '鐘已備妥 →');
  const bellLanding = landing(scene, layout.bell.x, 348, layout.bell.width);

  drawDock(dockFace, false, false);
  drawRecall(recallFace, false, false, false);
  drawCounterweight(bellFace, false, false);
  return { dock, dockFace, dockNotice, dockLanding, backwash, backwashNotice, backwashLanding,
    recall, recallFace, recallNotice, recallLanding, bellCounterweight, bellFace, bellNotice, bellLanding };
}

export function updateClockworkMaliceArt(art: ClockworkMaliceArt, sample: ClockworkMaliceSample): void {
  const dockRetired = sample.dockPhase === 'retired';
  const dockDanger = sample.dockActive || sample.revealed.dock;
  art.dock.setY(Math.round(sample.dockY));
  drawDock(art.dockFace, dockDanger, dockRetired);
  setNotice(art.dockNotice, sample.dockPhase, dockDanger,
    '到站請下貨 →', '卸貨閘落下・先留在載台', '卸貨閘已回收 →', '王命開閘・乘客優先 →');
  art.dockLanding.setVisible(!dockRetired && (dockDanger || sample.dockPhase === 'tell'));

  const backwashRetired = sample.backwashPhase === 'retired';
  const backwashDanger = sample.backwashActive || sample.revealed.backwash;
  art.backwash.setVisible(sample.backwashActive && !backwashRetired);
  setNotice(art.backwashNotice, sample.backwashPhase, backwashDanger,
    '洩壓完成 →', '旁管回噴・退到左側等候', '旁管已洩壓 →', '王命關閥・不再回噴 →');
  art.backwashLanding.setVisible(!backwashRetired && (backwashDanger || sample.backwashPhase === 'tell'));

  const recallRetired = sample.recallPhase === 'retired';
  const recallDanger = sample.recallActive || sample.revealed.sorter;
  drawRecall(art.recallFace, sample.recallActive, recallDanger, recallRetired);
  setNotice(art.recallNotice, sample.recallPhase, recallDanger,
    '驗收完成，快速出貨 →', '封口夾啟動・向左撤回', '封口夾已收回 →', '王命免驗・封口夾退休 →');
  art.recallLanding.setVisible(!recallRetired && (recallDanger || sample.recallPhase === 'tell'));

  const bellRetired = sample.bellPhase === 'retired';
  const bellDanger = sample.bellActive || sample.revealed.sorter;
  art.bellCounterweight.setY(Math.round(sample.bellY));
  drawCounterweight(art.bellFace, bellDanger, bellRetired);
  setNotice(art.bellNotice, sample.bellPhase, bellDanger,
    '鐘已備妥 →', '配重運轉・等回收再敲鐘', '配重已回收・可以敲鐘 →', '王命免配重・直接敲鐘 →');
  art.bellLanding.setVisible(!bellRetired && (bellDanger || sample.bellPhase === 'tell'));
}

function notice(scene: Phaser.Scene, x: number, y: number, copy: string): Phaser.GameObjects.Text {
  return addGameText(scene, x, y, copy, 15, safeInk).setOrigin(0.5)
    .setBackgroundColor(text.parchment).setPadding(6, 4).setDepth(7);
}

function setNotice(
  label: Phaser.GameObjects.Text,
  phase: ClockworkMalicePhase,
  danger: boolean,
  misleading: string,
  warning: string,
  cleared: string,
  retired: string,
): void {
  const safe = phase === 'spent' || phase === 'retired';
  label.setText(phase === 'retired' ? retired : phase === 'spent' ? cleared : danger ? warning : misleading);
  label.setColor(danger && !safe ? text.danger : phase === 'retired' ? text.ink : safeInk);
}

function landing(scene: Phaser.Scene, x: number, y: number, width: number): Phaser.GameObjects.Graphics {
  const graphic = scene.add.graphics().setPosition(x, y).setDepth(4).setVisible(false);
  const r = rectangles(graphic);
  r(-width / 2, 0, width, 2, material.dangerShadow);
  for (let notch = -width / 2; notch < width / 2; notch += 14) {
    r(notch, -4, Math.min(7, width / 2 - notch), 4, material.danger);
  }
  return graphic;
}

function drawFixedFixtures(scene: Phaser.Scene): void {
  const fixtures = scene.add.graphics().setDepth(1);
  const r = rectangles(fixtures);
  const dock = layout.dock;
  // 卸貨閘槽的實際落點保持固定，細窄槽不偽裝成可站立柱。
  for (const x of [dock.x - dock.width / 2 - 5, dock.x + dock.width / 2 + 1]) {
    r(x, dock.hiddenY, 4, 304, material.metalShadow);
    r(x + 1, dock.hiddenY, 1, 300, material.metalLight);
  }
  r(dock.x - 37, dock.hiddenY - 10, 74, 10, material.copperShadow);
  r(dock.x - 35, dock.hiddenY - 8, 70, 3, material.copper);
  r(dock.x - 27, 380, 54, 2, material.metalShadow);

  // 旁管的閥門與出氣口朝向右側，不與主蒸汽柱重疊。
  r(1_094, 286, 12, 123, material.copperShadow);
  r(1_096, 288, 3, 116, material.copper);
  r(1_098, 343, 24, 23, material.outline);
  r(1_100, 345, 20, 19, material.metal);
  r(1_118, 345, 3, 19, material.metalLight);
  for (let y = 347; y < 361; y += 5) r(1_112, y, 7, 2, material.metalShadow);
  r(1_077, 305, 17, 4, material.copperMid);
  r(1_065, 299, 14, 16, material.copperShadow);
  r(1_067, 301, 10, 12, material.safety);
  r(1_071, 303, 2, 8, material.metalShadow);

  const recall = layout.recall;
  r(recall.x - 48, recall.topY - 10, 96, 10, material.copperShadow);
  r(recall.x - 46, recall.topY - 8, 92, 3, material.copper);
  r(recall.x - 48, recall.topY, 3, recall.height, material.metalShadow);
  r(recall.x + 45, recall.topY, 3, recall.height, material.metalShadow);
  r(recall.x - 48, 428, 96, 2, material.metalShadow);

  // 配重有獨立鎖鏈與行程槽，與終點大鐘本體分離。
  const bell = layout.bell;
  for (const x of [bell.x - 53, bell.x + 51]) {
    r(x, 92, 3, 258, material.metalShadow);
    r(x + 1, 93, 1, 255, material.metalLight);
  }
  r(bell.x - 61, 82, 122, 10, material.copperShadow);
  r(bell.x - 59, 84, 118, 3, material.copper);
  for (let y = 58; y < 283; y += 12) {
    r(bell.x - 3, y, 6, 9, material.copperShadow);
    r(bell.x - 2, y + 1, 2, 6, material.copper);
  }
}

function drawDock(graphics: Phaser.GameObjects.Graphics, danger: boolean, retired: boolean): void {
  graphics.clear();
  const r = rectangles(graphics);
  const left = -layout.dock.width / 2;
  const height = layout.dock.height;
  r(left, 0, layout.dock.width, height, material.outline);
  r(left + 2, 2, layout.dock.width - 4, 9, material.copper);
  r(left + 2, 11, layout.dock.width - 4, height - 21, material.metal);
  r(left + 4, 12, 8, height - 26, material.metalLight);
  r(left + layout.dock.width - 10, 12, 8, height - 26, material.metalShadow);
  for (let y = 24; y < height - 16; y += 27) {
    r(left + 13, y, 28, 2, material.metalShadow);
    r(left + 13, y + 2, 28, 1, material.metalLight);
  }
  r(left + 2, height - 10, layout.dock.width - 4, 8, retired ? material.metalShadow : danger ? material.dangerShadow : material.metalLight);
  if (danger && !retired) {
    for (let x = left + 4; x < -left - 5; x += 12) {
      r(x, height - 17, 5, 5, material.danger);
      r(x + 3, height - 12, 5, 5, material.danger);
    }
  }
  drawSeal(r, -11, 17, retired ? 'retired' : danger ? 'danger' : 'safe');
}

function drawBackwash(graphics: Phaser.GameObjects.Graphics): void {
  const r = rectangles(graphics);
  const left = -layout.backwash.width / 2;
  const width = layout.backwash.width;
  r(left + 12, 0, width - 24, 8, material.steamShadow);
  r(left + 4, 8, width - 8, 12, material.steamShadow);
  r(left, 20, width, 65, material.steamShadow);
  r(left + 4, 85, width - 8, 9, material.steamShadow);
  r(left + 12, 94, width - 24, 6, material.steamShadow);
  for (let row = 0; row < 6; row++) {
    const y = 5 + row * 15;
    const inset = row === 0 || row === 5 ? 16 : row % 2 === 0 ? 8 : 3;
    r(left + inset, y, width - inset * 2, 11, material.steam);
    for (let column = 0; column < 4; column++) {
      r(left + 12 + column * 43 + (row % 2) * 5, y + 2, 22, 3, p.sky200);
    }
  }
  // 可讀的前進氣流尖角及邊界，並非只以換色表示危險。
  r(left + width - 9, 30, 6, 11, material.danger);
  r(left + width - 6, 41, 6, 18, material.danger);
  r(left + width - 9, 59, 6, 11, material.danger);
}

function drawRecall(graphics: Phaser.GameObjects.Graphics, active: boolean, danger: boolean, retired: boolean): void {
  graphics.clear();
  const r = rectangles(graphics);
  const half = layout.recall.width / 2;
  const color = retired ? material.metalShadow : danger ? material.dangerShadow : material.copperMid;
  // 閒置時兩側夾爪張開，啟動時齒面夾入整個傷害區。
  const jawWidth = active ? 24 : 10;
  for (const left of [-half, half - jawWidth]) {
    r(left, 0, jawWidth, layout.recall.height, material.outline);
    r(left + 2, 2, jawWidth - 4, layout.recall.height - 4, color);
    r(left + 2, 3, 3, layout.recall.height - 8, retired ? material.metal : material.copper);
  }
  if (active && !retired) {
    for (let y = 8; y < layout.recall.height - 8; y += 18) {
      r(-half + jawWidth, y, 13, 10, material.danger);
      r(half - jawWidth - 13, y + 7, 13, 10, material.danger);
      r(-half + jawWidth + 13, y + 3, 5, 4, material.dangerShadow);
      r(half - jawWidth - 18, y + 10, 5, 4, material.dangerShadow);
    }
  }
  r(-half + 10, 0, layout.recall.width - 20, 7, material.metalShadow);
  r(-half + 12, 2, layout.recall.width - 24, 3, material.metalLight);
  drawSeal(r, -11, 9, retired ? 'retired' : danger ? 'danger' : 'safe');
}

function drawCounterweight(graphics: Phaser.GameObjects.Graphics, danger: boolean, retired: boolean): void {
  graphics.clear();
  const r = rectangles(graphics);
  const left = -layout.bell.width / 2;
  r(left, 0, layout.bell.width, layout.bell.height, material.outline);
  r(left + 2, 2, layout.bell.width - 4, 8, material.copper);
  r(left + 2, 10, layout.bell.width - 4, 52, material.metalShadow);
  r(left + 5, 12, layout.bell.width - 10, 14, material.metal);
  r(left + 5, 29, layout.bell.width - 10, 14, material.metal);
  r(left + 5, 46, layout.bell.width - 10, 14, material.metal);
  r(left + 5, 12, 5, 48, material.metalLight);
  r(left + 2, 62, layout.bell.width - 4, 6, retired ? material.metal : danger ? material.dangerShadow : material.copperMid);
  if (danger && !retired) for (let x = left + 5; x < -left - 7; x += 15) r(x, 60, 7, 5, material.danger);
  for (const x of [-43, 40]) for (const y of [4, 64]) {
    r(x, y, 3, 3, material.outline);
    r(x, y, 2, 1, material.metalLight);
  }
  drawSeal(r, -11, 17, retired ? 'retired' : danger ? 'danger' : 'safe');
}

function drawSeal(r: Rect, x: number, y: number, phase: 'safe' | 'danger' | 'retired'): void {
  r(x, y, 22, 22, material.outline);
  r(x + 2, y + 2, 18, 18, phase === 'safe' ? material.safety : phase === 'danger' ? material.danger : material.royal);
  if (phase === 'danger') {
    r(x + 10, y + 5, 3, 8, material.outline);
    r(x + 10, y + 15, 3, 3, material.outline);
  } else if (phase === 'retired') {
    // 王命封條為橫向鎖銷，和危險驚嘆號形狀不同。
    r(x + 5, y + 9, 12, 4, material.copperShadow);
    r(x + 8, y + 6, 6, 2, material.royalLight);
  } else {
    r(x + 5, y + 10, 5, 3, material.metalShadow);
    r(x + 9, y + 12, 3, 3, material.metalShadow);
    r(x + 12, y + 7, 3, 7, material.metalShadow);
  }
}
