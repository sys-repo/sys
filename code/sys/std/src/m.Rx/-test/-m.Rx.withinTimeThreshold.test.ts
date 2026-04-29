import { describe, expect, it, Testing, Time } from '../../-test.ts';
import { Dispose } from '../../m.Dispose/mod.ts';
import { Rx } from '../mod.ts';

describe('Rx.withinTimeThreshold (eg. "double-click")', () => {
  it('fires within time-threshold', async () => {
    await Testing.retry(3, async () => {
      const $ = Rx.subject();
      const threshold = Rx.withinTimeThreshold($, 30);
      let fired = 0;
      threshold.$.subscribe(() => fired++);

      $.next();
      await Time.wait(5);
      $.next();
      expect(fired).to.eql(1);

      threshold.dispose();
    });
  });

  it('does not fire (outside time-threshold)', async () => {
    await Testing.retry(3, async () => {
      const $ = Rx.subject();
      const threshold = Rx.withinTimeThreshold($, 5);
      let fired = 0;
      threshold.$.subscribe(() => fired++);

      $.next();
      await Time.wait(10);
      $.next();
      expect(fired).to.eql(0);

      threshold.dispose();
    });
  });

  it('fires value through threshold<T>', async () => {
    await Testing.retry(3, async () => {
      type T = { foo: number };
      const $ = Rx.subject<T>();
      const threshold = Rx.withinTimeThreshold($, 10);

      const fired: T[] = [];
      threshold.$.subscribe((e) => fired.push(e));

      $.next({ foo: 1 });
      await Time.wait(5);
      $.next({ foo: 2 });

      expect(fired.length).to.eql(1);
      expect(fired[0]).to.eql({ foo: 2 }); // NB: last fired value returned.

      threshold.dispose();
    });
  });

  it('timeout$', async () => {
    await Testing.retry(3, async () => {
      const $ = Rx.subject();
      const threshold = Rx.withinTimeThreshold($, 10);

      let fired = 0;
      let timedout = 0;
      threshold.$.subscribe(() => fired++);
      threshold.timeout$.subscribe(() => timedout++);

      $.next();
      await Time.wait(20);
      $.next();

      expect(fired).to.eql(0);
      expect(timedout).to.eql(1);

      threshold.dispose();
    });
  });

  it('dispose', async () => {
    const $ = Rx.subject();
    const threshold = Rx.withinTimeThreshold($, 10);
    expect(threshold.disposed).to.eql(false);

    let fired = 0;
    threshold.$.subscribe(() => fired++);

    threshold.dispose();
    expect(threshold.disposed).to.eql(true);

    $.next();
    await Time.wait(2);
    $.next();

    await Time.wait(50);
    expect(fired).to.eql(0);
  });

  it('dispose$', () => {
    const $ = Rx.subject();
    const { dispose, dispose$ } = Dispose.disposable();
    const threshold = Rx.withinTimeThreshold($, 10, { until: dispose$ });
    expect(threshold.disposed).to.eql(false);

    expect(threshold.disposed).to.eql(false);
    dispose();
    expect(threshold.disposed).to.eql(true);
  });
});
