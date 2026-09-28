import { describe, expect, it } from 'vitest';
import { deathDialogue } from './levelOneDialogue';
import { LEVEL_ONE_DEATHS, REAR_DEATHS } from './levelOneDeaths';
import { REAR_CAUSES } from './rearGauntlet';
import { LEVEL_ONE_REACTIONS } from './levelOne';

describe('關卡接話', () => {
  it('終點搬近說明排在死因之後，重生不需蓋掉原句', () => {
    const lines = deathDialogue(LEVEL_ONE_DEATHS.goal, 1, null);
    expect(lines[0]).toContain('終點審核通過了');
    expect(lines[1]).toContain('終點搬近');
  });
  it('補點名初見解釋死因，再犯提供安全落點解法', () => {
    const context = REAR_DEATHS[REAR_CAUSES.restEcho];
    expect(deathDialogue(context, 1, null)[0]).toContain('兩位承辦');
    expect(deathDialogue(context, 2, null)[0]).toContain('兩道落點線中間');
  });
  it('援助先說實際改變，不能被一般死亡笑話取代', () => {
    const reaction = LEVEL_ONE_REACTIONS.find(entry => entry.id === 'intern-bridge-safety-net')!;
    const lines = deathDialogue(REAR_DEATHS[REAR_CAUSES.restEcho], 5, reaction);
    expect(lines[0]).toBe(reaction.message);
    expect(lines[0]).toContain('兩把重槌全下班');
    expect(lines[1]).toContain('施工完了');
  });
});
