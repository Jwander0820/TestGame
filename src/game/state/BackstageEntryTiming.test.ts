import { expect, it } from 'vitest';
import { BackstageEntry } from './BackstageState';

it('高更新率下起跳到下次物理步進之間仍回報 grounded，不丟失入口資格', () => {
  const gate = new BackstageEntry();
  const frame = { x: -38, y: 240.5, feet: 260, grounded: true, alive: true, leftJump: true };
  gate.update(frame);
  gate.update({ ...frame, leftJump: false });
  gate.update({ ...frame, leftJump: false });
  expect(gate.update({ ...frame, x: -62, y: 200, grounded: false, leftJump: false })).toBe(true);
  gate.update({ ...frame, leftJump: false });
  expect(gate.update({ ...frame, x: -62, y: 200, grounded: false, leftJump: false })).toBe(false);
});
