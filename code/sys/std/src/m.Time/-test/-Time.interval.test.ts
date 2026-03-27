import { type t, Testing, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Rx } from '../../m.Rx/mod.ts';
import { Time } from '../mod.ts';

describe('Time.interval', () => {
  const waitFor = (pred: () => boolean | Promise<boolean>) =>
    Testing.retry(40, { delay: 5, silent: true }, async () => {
      if (!await pred()) throw new Error('not yet');
    });

  it('returns a cancellable interval handle', () => {
    const res = Time.interval(10, () => {});

    expect(typeof res.cancel).to.eql('function');
    expect(res.interval).to.eql(10);
    expect(res.is).to.eql({ cancelled: false, done: false, running: true });

    res.cancel();
    expect(res.is).to.eql({ cancelled: true, done: true, running: false });
  });

  it('fires repeatedly until cancelled', async () => {
    let count = 0;
    const tick = Time.interval(10, () => count++);

    await waitFor(() => count >= 2);
    tick.cancel();

    expect(count).to.be.greaterThanOrEqual(2);
    const stoppedAt = count;
    await Testing.wait(30);
    expect(count).to.eql(stoppedAt);
  });

  it('supports immediate execution before the first scheduled tick', async () => {
    let count = 0;
    const tick = Time.interval(20, () => count++, { immediate: true });

    expect(count).to.eql(1);
    await waitFor(() => count >= 2);
    tick.cancel();
    expect(count).to.be.greaterThanOrEqual(2);
  });

  it('supports AbortSignal cancellation', async () => {
    const ctrl = new AbortController();
    let count = 0;
    const tick = Time.interval(10, () => count++, { signal: ctrl.signal });

    ctrl.abort();
    await waitFor(() => tick.is.cancelled === true);

    expect(count).to.eql(0);
    expect(tick.is).to.eql({ cancelled: true, done: true, running: false });
  });

  it('supports the overload with options before the callback', async () => {
    let count = 0;
    const tick = Time.interval(20, { immediate: true }, () => count++);

    expect(count).to.eql(1);
    await waitFor(() => count >= 2);
    tick.cancel();
    expect(count).to.be.greaterThanOrEqual(2);
  });

  it('Time.until(interval) cancels on dispose', async () => {
    const { dispose, dispose$ } = Rx.disposable();
    const time = Time.until(dispose$);
    let count = 0;
    const tick = time.interval(10, () => count++);

    await waitFor(() => count >= 1);
    dispose();
    await waitFor(() => tick.is.cancelled === true);
    const stoppedAt = count;
    await Testing.wait(30);

    expect(tick.is.cancelled).to.eql(true);
    expect(count).to.eql(stoppedAt);
  });

  it('has the correct type signature', () => {
    expectTypeOf(Time.interval).toEqualTypeOf<t.TimeLib['interval']>();

    type IntervalShape =
      & ((msecs: t.Msecs, fn: t.TimeIntervalCallback, options?: t.TimeIntervalOptions | AbortSignal | AbortController) => t.TimeInterval)
      & ((msecs: t.Msecs, options: t.TimeIntervalOptions | AbortSignal | AbortController, fn: t.TimeIntervalCallback) => t.TimeInterval);

    expectTypeOf(Time.interval).toEqualTypeOf<IntervalShape>();
  });
});
