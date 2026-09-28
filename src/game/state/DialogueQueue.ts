/** 只接收場景有效時間；不持有計時器，也不寫入保存。 */
export class DialogueQueue {
  private lines: readonly string[] = [];
  private index = 0;
  private remainingMs = 0;
  private priority = -1;
  current = '';

  reset(): void {
    this.lines = [];
    this.index = 0;
    this.remainingMs = 0;
    this.priority = -1;
    this.current = '';
  }

  offer(lines: readonly string[], priority: number, interrupt = false): boolean {
    if (lines.length === 0 || (!interrupt && this.remainingMs > 0 && priority < this.priority)) return false;
    this.lines = lines;
    this.index = 0;
    this.priority = priority;
    this.show(lines[0]!);
    return true;
  }

  advance(deltaMs: number): string | null {
    if (this.remainingMs <= 0) return null;
    this.remainingMs -= Math.max(0, deltaMs);
    if (this.remainingMs > 0) return null;
    const next = this.lines[++this.index];
    if (next === undefined) {
      this.priority = -1;
      return null;
    }
    // 不追趕背景分頁累積時間，避免一句剛出現就被跳過。
    this.show(next);
    return next;
  }

  private show(line: string): void {
    this.current = line;
    this.remainingMs = Math.max(3_200, line.length * 95);
  }
}
