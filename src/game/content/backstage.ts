export const BACKSTAGE = {
  scene: 'BackstageScene', egg: 'backstage-maintenance-room',
  entry: { x: -58, minX: -105, minY: 110, maxY: 235, shelfTop: 260 },
  returnPoint: { x: 35, y: 310 },
  width: 960, floorY: 418, spawn: { x: 790, y: 390 }, exitX: 885,
  sign: { x: 705, width: 76, startY: 220, endY: 397, tellMs: 650, fallMs: 240 },
  spring: { x: 390, halfWidth: 24, chargeMs: 420, launchSpeed: 620 },
  bell: { x: 390, y: 205, halfWidth: 18, halfHeight: 20 },
  slime: { x: 133, watchRange: 300, restMs: 600 },
} as const;

export const BACKSTAGE_COPY = {
  first: ['工務處｜你不該在這裡。……至少不該在我們上班的時候。'],
  repeat: ['工務處｜又是你。要不要順便幫我們測下一根刺？'],
  sign: ['工務處｜這不是陷阱，是招牌還沒固定。', '勇者｜差別是？\n工務處｜報不同的表。'],
  desk: ['勇者｜那些金幣是你們做的？', '工務處｜美術交的是金幣，關卡把用途改了。', '關卡｜需求一直都很明確。'],
  spikes: ['勇者｜這根不會刺人？\n工務處｜這根拿來過驗收。'],
  slime: ['勇者｜牠怎麼不用打我？\n工務處｜牠今天領時薪。'],
  supervisor: ['勇者｜我一回頭，牠才開始搬。', '工務處｜恭喜，你已經學會監工了。'],
  spring: [
    ['工務處｜一次通過。\n關卡｜樣本太少，請再試一次。'],
    ['工務處｜複驗也通過。\n關卡｜連續通過，疑似勇者作弊。'],
    ['工務處｜那就改成免驗通過。\n勇者｜原來驗收也會同情人。'],
  ],
  exit: ['工務處｜回去以後，當作一切都是精心設計的。', '關卡｜本來就是。\n工務處｜那你把施工單簽了。'],
} as const;
