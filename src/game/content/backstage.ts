export const BACKSTAGE = {
  scene: 'BackstageScene', egg: 'backstage-maintenance-room',
  entry: { x: -58, minX: -105, minY: 110, maxY: 235, shelfTop: 260 },
  returnPoint: { x: 35, y: 310 },
  width: 960, floorY: 418, spawn: { x: 790, y: 390 }, exitX: 885,
  sign: { x: 705, width: 76, startY: 220, endY: 397, tellMs: 650, fallMs: 240 },
} as const;

export const BACKSTAGE_COPY = {
  first: ['工務處｜你不該在這裡。……至少不該在我們上班的時候。'],
  repeat: ['工務處｜又是你。要不要順便幫我們測下一根刺？'],
  sign: ['工務處｜這不是陷阱，是招牌還沒固定。', '勇者｜差別是？\n工務處｜報不同的表。'],
  desk: ['勇者｜那些金幣是你們做的？', '工務處｜美術交的是金幣，關卡把用途改了。', '關卡｜需求一直都很明確。'],
  spikes: ['勇者｜這根不會刺人？\n工務處｜這根拿來過驗收。'],
  slime: ['勇者｜牠怎麼不用打我？\n工務處｜牠今天領時薪。'],
  exit: ['工務處｜回去以後，當作一切都是精心設計的。', '關卡｜本來就是。\n工務處｜那你把施工單簽了。'],
} as const;
