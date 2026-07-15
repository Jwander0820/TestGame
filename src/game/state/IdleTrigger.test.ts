import { describe, expect, it } from 'vitest';
import { IdleTrigger } from './IdleTrigger';

describe('IdleTrigger', () => {
  it('fires once after uninterrupted eligible play time', () => {
    const trigger = new IdleTrigger(8_000);

    expect(trigger.update(1_000, true)).toBe(false);
    expect(trigger.update(8_999, true)).toBe(false);
    expect(trigger.update(9_000, true)).toBe(true);
    expect(trigger.update(20_000, true)).toBe(false);
  });

  it('resets elapsed time when play becomes ineligible', () => {
    const trigger = new IdleTrigger(8_000);

    trigger.update(1_000, true);
    expect(trigger.update(7_000, false)).toBe(false);
    expect(trigger.update(20_000, true)).toBe(false);
    expect(trigger.update(27_999, true)).toBe(false);
    expect(trigger.update(28_000, true)).toBe(true);
  });

  it('can restart an untriggered timer when focus changes', () => {
    const trigger = new IdleTrigger(8_000);

    trigger.update(0, true);
    trigger.reset();
    expect(trigger.update(12_000, true)).toBe(false);
    expect(trigger.update(20_000, true)).toBe(true);
  });
});
