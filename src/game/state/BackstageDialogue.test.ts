import { expect, it } from 'vitest';
import { BackstageDialogue } from './BackstageDialogue';

it('保留當前一句至少 3.2 秒，只保留最新互動，不累積過時吐槽', () => {
  const dialogue = new BackstageDialogue();
  expect(dialogue.offer(['開場'])).toBe('開場');
  dialogue.advance(800); expect(dialogue.offer(['落牌'])).toBeNull();
  dialogue.advance(800); expect(dialogue.offer(['工作台', '接話'])).toBeNull();
  expect(dialogue.advance(1599)).toBeNull(); expect(dialogue.current).toBe('開場');
  expect(dialogue.advance(1)).toBe('工作台');
  expect(dialogue.advance(3199)).toBeNull(); expect(dialogue.advance(1)).toBe('接話');
});
