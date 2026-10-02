import { requireTestElement } from './dom';

// 固定 iframe 的內部 viewport；不依賴桌面面板是否採用裝置尺寸設定。
const routes = {
  backstage: 'shell-review.html?state=backstage',
  workshopPlay: 'shell-review.html?state=workshop',
  workshop: 'backstage.html?case=workshop',
  play: 'art-review.html',
  shell: 'shell-review.html?state=goal',
  shellZero: 'shell-review.html',
  shellMax: 'shell-review.html?state=max',
  zero: 'zero-assist.html',
  return: 'rear-gauntlet.html?case=returnPause',
  hammer: 'rear-gauntlet.html?case=hammerReload',
  encore: 'rear-gauntlet.html?case=encoreReload',
  encoreView: 'rear-gauntlet.html?case=restEcho&review=1',
  max: 'max-assistance.html',
  hammerView: 'rear-gauntlet.html?case=restHammer&review=1',
  returnView: 'rear-gauntlet.html?case=returnSweep&review=1',
  slimePause: 'slime-malice.html?case=pause',
  slimeReload: 'slime-malice.html?case=reload',
  slimeView: 'slime-malice.html?case=jumper&review=1',
  revengePause: 'slime-malice.html?case=revengePause',
  revengeReload: 'slime-malice.html?case=revengeReload',
  revengeView: 'slime-malice.html?case=revengeJumper&review=1',
  sleepView: 'slime-malice.html?case=revengeCharger&review=1&view=sleep',
  finalMercy: 'final-mercy.html?case=fresh',
  backtrack: 'final-mercy.html?case=left',
  auditView: 'final-mercy.html?case=audit&review=1',
  finalReload: 'final-mercy.html?case=reload',
} as const;
const selected = new URLSearchParams(location.search).get('case') ?? 'play';
if (!Object.hasOwn(routes, selected)) throw new Error('未知的手機驗證路線');
requireTestElement<HTMLIFrameElement>('#mobile-frame').src = routes[selected as keyof typeof routes];
const dimensions = { portrait: [375, 667], landscape: [667, 375], wide: [844, 390], desktop: [960, 540] } as const;
const size = new URLSearchParams(location.search).get('size') ?? 'portrait';
if (!Object.hasOwn(dimensions, size)) throw new Error('未知尺寸');
const [width, height] = dimensions[size as keyof typeof dimensions];
const frame = requireTestElement<HTMLIFrameElement>('#mobile-frame');
frame.style.width = `${width}px`;
frame.style.height = `${height}px`;
frame.title = `${width}×${height} 遊戲測試框`;
