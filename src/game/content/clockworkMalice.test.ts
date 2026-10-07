import { describe, expect, it } from 'vitest';
import { CLOCKWORK_MALICE as layout, CLOCKWORK_MALICE_DEATHS } from './clockworkMalice';
import { LEVEL_TWO_PLATFORMS } from './levelTwo';

describe('鐘塔後手落點與死因', () => {
  it('卸貨閘及鐘配重落地時封住平台；旁管與夾口不漂浮在地面上方', () => {
    const dockFloor = LEVEL_TWO_PLATFORMS.find(platform => platform.id === 'carrier-shore')!;
    const bellFloor = LEVEL_TWO_PLATFORMS.find(platform => platform.id === 'bell-platform')!;
    expect(layout.dock.loweredY + layout.dock.height).toBe(dockFloor.y);
    expect(layout.bell.loweredY + layout.bell.height).toBe(bellFloor.y);
    expect(layout.backwash.topY + layout.backwash.height).toBe(430);
    expect(layout.recall.topY + layout.recall.height).toBe(430);
    expect(layout.backwash.x - layout.backwash.width / 2).toBe(layout.backwash.triggerX);
    expect(layout.recall.x - layout.recall.width / 2).toBeGreaterThan(layout.recall.triggerX);
    expect(layout.bell.x - layout.bell.width / 2).toBeGreaterThan(layout.bell.triggerX);
  });

  it('四個死因分開記錄，歸屬三段既有 blocker，不增加獨立援助門檻', () => {
    expect(new Set(Object.values(CLOCKWORK_MALICE_DEATHS).map(context => context.causeId)).size).toBe(4);
    expect(CLOCKWORK_MALICE_DEATHS.dock.blockerId).toBe('clockwork-carrier');
    expect(CLOCKWORK_MALICE_DEATHS.backwash.blockerId).toBe('clockwork-steam');
    expect(CLOCKWORK_MALICE_DEATHS.recall.blockerId).toBe('clockwork-sorter');
    expect(CLOCKWORK_MALICE_DEATHS.bell.blockerId).toBe('clockwork-sorter');
  });
});
