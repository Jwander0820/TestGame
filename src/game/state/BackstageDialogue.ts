import { DialogueQueue } from './DialogueQueue';

/** Keep each visible line readable, but retain only the latest nearby interaction. */
export class BackstageDialogue {
  private readonly queue = new DialogueQueue();
  private visibleMs = 3_200;
  private pending: readonly string[] | null = null;
  get current(): string { return this.queue.current; }
  offer(lines: readonly string[]): string | null {
    if (this.visibleMs < 3_200) { this.pending = lines; return null; }
    this.pending = null; this.visibleMs = 0; this.queue.offer(lines, 0, true);
    return this.current;
  }
  advance(delta: number): string | null {
    this.visibleMs += Math.max(0, delta);
    if (this.pending !== null && this.visibleMs >= 3_200) return this.offer(this.pending);
    const next = this.queue.advance(delta);
    if (next !== null) this.visibleMs = 0;
    return next;
  }
}
