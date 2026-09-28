import { describe, expect, it } from 'vitest';
import { DialogueQueue } from './DialogueQueue';

describe('對話節奏', () => {
  it('每句完整停留，零增量代表暫停，過期後才允許沿途訊息', () => {
    const queue = new DialogueQueue();
    queue.offer(['工務處｜先等槌落下。', '勇者｜你們終於說實話了。'], 2);
    expect(queue.advance(900)).toBeNull();
    expect(queue.advance(0)).toBeNull();
    expect(queue.offer(['據點'], 1)).toBe(false);
    expect(queue.advance(2_299)).toBeNull();
    expect(queue.advance(1)).toBe('勇者｜你們終於說實話了。');
    expect(queue.offer(['路過'], 0)).toBe(false);
    queue.advance(3_200);
    expect(queue.offer(['路過'], 0)).toBe(true);
  });

  it('援助打斷閒聊，新死亡即使優先序較低也能清掉舊接話', () => {
    const queue = new DialogueQueue();
    queue.offer(['第一句', '過時笑話'], 0);
    queue.offer(['安全網就位', '施工笑話'], 3);
    expect(queue.offer(['最新死因', '新提示'], 2, true)).toBe(true);
    expect(queue.current).toBe('最新死因');
    expect(queue.advance(3_200)).toBe('新提示');
    expect(queue.advance(3_200)).toBeNull();
    expect(queue.current).toBe('新提示');
  });

  it('長句增加閱讀時間，大 delta 不跳掉後一句，重開清空狀態', () => {
    const queue = new DialogueQueue();
    queue.offer(['字'.repeat(40), '第二句', '第三句'], 2);
    expect(queue.advance(3_200)).toBeNull();
    expect(queue.advance(10_000)).toBe('第二句');
    expect(queue.advance(1)).toBeNull();
    queue.reset();
    expect(queue.current).toBe('');
    expect(queue.advance(9_000)).toBeNull();
    expect(queue.offer([], 4)).toBe(false);
    expect(queue.offer(['新開場'], 0)).toBe(true);
  });
});
