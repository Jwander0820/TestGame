import type { DeathContext } from './levelOneDeaths';
import type { ReactionDefinition } from '../sympathy/types';

export const DIALOGUE_PRIORITY = { ambient: 0, checkpoint: 1, death: 2, mercy: 3, complete: 4 } as const;

const DEATH_HINTS: Readonly<Record<string, string>> = {
  'fell-out-of-world': '先在岸邊等攻擊過去，再從邊緣起跳。坑不會跟著下班。',
  'landing-stamp-ambush': '落地後往前走一點再跳，頭上的空氣也有編制。',
  'hidden-ceiling-bait': '別一落地就補跳。先離開頭頂那塊磚。',
  'jumped-at-false-gap': '那段看起來斷掉的路能直接走。跳起來才會撞上埋伏。',
  'first-pit-air-brick': '岸邊先引出飛行物，再提早起跳越坑；晚跳會撞磚。',
  'first-pit-riser': '靠近坑邊引它飛上來，留在岸上等它過去再跳。',
  'bait-coin-burst': '碰到金幣就離開，不要停在原位清點財產。',
  'slime-surprise-charge': '它往左突進時跳過去。落地後還要防一次回頭。',
  'slime-jump-intercept': '在它左側原地跳引招，等兩次動作都結束再走。',
  'slime-fake-rest-charge': '先留在岸內，等它回頭時再原地跳一次。',
  'slime-fake-rest-leap': '假睡不是結束。在左側等它補跳完再前進。',
  'trusted-warning-strip': '牌子負責認證，腳負責離開。跨過變色的地面。',
  'intern-bridge-collapse': '橋上別停留；迎面和回頭的飛行物要分兩次躲。',
  'crumbled-high-step': '落上高台就接著跳。這塊地板按次計薪。',
  'feint-platform-miss': '在岸邊跳一下引它閃開，收腳等它回來，再跳過去。',
  'bridge-countershot': '橋前等迎面那發靠近再跳，後面還有一發。',
  'bridge-return-shot': '它會折返。第一跳落地後，在橋尾再跳一次。',
  'bridge-exit-spikes': '還沒走到橋尾地刺就要起跳。別等它簽收你的腳。',
  'goal-ceiling-bait': '最後高台先步行，離開頂刺下方再跳向終點。',
  'finish-landing-spikes': '最後一跳要越過地刺，別在刺上收腳。',
  'rest-platform-hammer': '第一把槌落在高台左邊，落地後先走到兩槌中間。',
  'rest-platform-encore': '停在兩道落點線中間，等第二把槌落完，再往門口走。',
  'goal-approval-stamp': '門口有兩次落印。這次我把章收走，連終點一起搬近。',
  'backtrack-audit': '退件章只認原落點。看到預告就向右避開。',
  'backtrack-exit': '左邊沒有出口。你再試幾次，我只好把虛空填起來。',
};

export function deathDialogue(context: DeathContext, count: number, reaction: ReactionDefinition | null): readonly string[] {
  if (reaction !== null) return [reaction.message, reaction.tier >= 3
    ? '關卡｜我還沒同意。\n工務處｜施工完了，你慢慢不同意。'
    : '關卡｜這算正常耗損。\n工務處｜耗損的是勇者，不是你的預算。'];
  const line = context.messages[(count - 1) % context.messages.length] ?? '這次事故仍在調查中。';
  if (context.causeId === 'goal-approval-stamp') return [`關卡｜${line}`,
    '工務處｜章收走，終點搬近。這次算公開放水。',
    '關卡｜終點怎麼走過來了？\n工務處｜它比你有同理心。'];
  const hint = DEATH_HINTS[context.causeId];
  return [count > 1 && hint !== undefined ? `工務處｜${hint}` : `關卡｜${line}`,
    count > 1 ? '勇者｜你們有沒有考慮修關卡？\n工務處｜有，正在偷修。'
      : '勇者｜這也算考試？\n關卡｜目前還沒有考生成功申訴。'];
}

export const INTRO_DIALOGUE = [
  '關卡｜歡迎。方向鍵／A、D 移動，空白鍵跳躍；觸控用下方三鍵。',
  '關卡｜所有設施都通過安全檢查。\n工務處｜受檢的是牌子。',
  '勇者｜那我呢？\n工務處｜你是現場測試。',
] as const;

export const ROUTE_DIALOGUE = [
  { id: 'pit-briefing', triggerX: 350, lines: ['關卡｜前方金幣免費領取。', '工務處｜「領取」的主詞是金幣。別站著等它。'] },
  { id: 'bridge-briefing', triggerX: 1_500, lines: ['關卡｜前方是模範橋，連攻擊都有來回服務。', '工務處｜先躲迎面，再躲回頭。模範的是加班。'] },
  { id: 'goal-pressure', triggerX: 2_490, lines: ['關卡｜休息處採雙人服務。\n工務處｜兩把槌，中間才是休息處。', '勇者｜那個門也要考？\n工務處｜門不用，門上的章很堅持。'] },
] as const;

export function checkpointDialogue(message: string, assisted: boolean): readonly string[] {
  return [`工務處｜${message}`, assisted
    ? '關卡｜剛才的援助不算放水。\n勇者｜那你鞋子怎麼濕了？'
    : '關卡｜剛才那段只是暖身。\n工務處｜他每次被通過都這樣說。'];
}
