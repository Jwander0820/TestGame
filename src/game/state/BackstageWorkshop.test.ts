import { describe, expect, it } from 'vitest';
import { BackstageSlimeWorker, BackstageSpring } from './BackstageWorkshop';

describe('後台試彈安全與驗收', () => {
  it('走離或跳起取消蓄力，回來重新計時', () => {
    const spring = new BackstageSpring();
    expect(spring.advance(400, 390, true, false)).toBe(false);
    spring.advance(10, 420, true, false);
    expect(spring.elapsed).toBe(0);
    spring.advance(400, 390, true, false);
    spring.advance(20, 390, true, true);
    expect(spring.phase).toBe('ready');
    expect(spring.advance(420, 390, true, false)).toBe(true);
  });
  it('一次試彈至多碰鈴一次，落地站台不自動重彈，離台才重裝', () => {
    const spring = new BackstageSpring();
    spring.advance(420, 390, true, false);
    const body = { left: 376, right: 404, top: 180, bottom: 219 };
    expect(spring.touchBell(body)).toBe(true);
    expect(spring.touchBell(body)).toBe(false);
    spring.advance(16, 390, false, false);
    spring.advance(1000, 390, true, false);
    expect(spring.advance(1000, 390, true, false)).toBe(false);
    expect(spring.passes).toBe(1);
    spring.advance(16, 440, true, false);
    expect(spring.advance(420, 390, true, false)).toBe(true);
    expect(spring.touchBell(body)).toBe(true);
    expect(spring.passes).toBe(2);
  });
  it('發射後下一幀仍保留地面接觸時，不提前結束飛行資格', () => {
    const spring = new BackstageSpring();
    spring.advance(420, 390, true, false);
    spring.advance(16, 390, true, false);
    expect(spring.phase).toBe('flight');
    spring.advance(16, 390, false, false);
    expect(spring.touchBell({ left: 376, right: 404, top: 180, bottom: 219 })).toBe(true);
    spring.advance(16, 390, true, false);
    expect(spring.phase).toBe('release');
  });
  it('飛行掠過鈴仍計一次，走過、錯過與普通跳躍不計', () => {
    const spring = new BackstageSpring();
    expect(spring.touchBell({ left: 376, right: 404, top: 180, bottom: 219 })).toBe(false);
    spring.advance(420, 390, true, false);
    spring.touchBell({ left: 376, right: 404, top: 245, bottom: 284 });
    expect(spring.touchBell({ left: 376, right: 404, top: 135, bottom: 174 })).toBe(true);
    spring.resetCycle(); spring.advance(420, 390, true, false);
    expect(spring.touchBell({ left: 430, right: 458, top: 180, bottom: 219 })).toBe(false);
  });
  it('取消及復位保留本次成功數、清掉前次飛行取樣', () => {
    const spring = new BackstageSpring();
    spring.advance(420, 390, true, false);
    spring.touchBell({ left: 376, right: 404, top: 180, bottom: 219 });
    spring.resetCycle();
    expect(spring.passes).toBe(1);
    spring.advance(420, 390, true, false);
    expect(spring.touchBell({ left: 376, right: 404, top: 120, bottom: 159 })).toBe(false);
    expect(new BackstageSpring().passes).toBe(0);
  });
});

describe('回頭監工', () => {
  it('左右兩側看向牠裝忙，背對或超出距離立即休息', () => {
    const worker = new BackstageSlimeWorker();
    expect(worker.advance(16, 250, true)).toBe(true);
    expect(worker.working).toBe(true);
    worker.advance(16, 250, false); expect(worker.working).toBe(false);
    worker.advance(16, 50, false); expect(worker.working).toBe(true);
    worker.advance(16, 50, true); expect(worker.working).toBe(false);
    worker.advance(16, 500, true); expect(worker.working).toBe(false);
  });
  it('持續看著與快速抖動朝向不刷抓包，背對滿 600ms 可再抓', () => {
    const worker = new BackstageSlimeWorker();
    worker.advance(16, 250, true); worker.advance(10000, 250, true);
    expect(worker.catches).toBe(1);
    worker.advance(599, 250, false); worker.advance(16, 250, true);
    expect(worker.catches).toBe(1);
    worker.advance(600, 250, false); expect(worker.advance(16, 250, true)).toBe(true);
    expect(worker.catches).toBe(2);
    worker.advance(600, 250, false); worker.advance(16, 250, true);
    expect(worker.catches).toBe(3);
    expect(new BackstageSlimeWorker().catches).toBe(0);
  });
});
