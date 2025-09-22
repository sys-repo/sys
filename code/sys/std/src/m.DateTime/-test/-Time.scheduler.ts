import { type t, describe, expect, it } from '../../-test.ts';
import { Time } from '../mod.ts';

/**
 * Minimal life-like helper.
 */
const life = (disposed = false): t.LifeLike => ({ disposed });

describe('Time.scheduler', () => {
  it('returns a curried function (callable & awaitable)', async () => {
    const schedule = Time.scheduler(life());
    expect(typeof schedule === 'function').to.be.true;

    // Callable form:
    schedule(() => {
      /* noop */
    });

    // Awaitable hop:
    const p = schedule();
    expect(typeof (p as any).then === 'function').to.be.true;
    await p;
  });

  it('micro: fires callback on a microtask, and await schedule() hops once', async () => {
    const calls: string[] = [];
    const schedule = Time.scheduler(life(), 'micro');

    schedule(() => calls.push('cb'));
    // Same tick: nothing yet
    expect(calls).to.eql([]);

    // Await one micro hop
    await schedule();
    expect(calls).to.eql(['cb']);
  });

  it('macro: setTimeout(0) style hop', async () => {
    const calls: string[] = [];
    const schedule = Time.scheduler(life(), 'macro');

    schedule(() => calls.push('cb'));

    // Micro hop should not run macro task
    await Promise.resolve();
    expect(calls).to.eql([]);

    // Macro hop should run it
    await schedule();
    expect(calls).to.eql(['cb']);
  });

  it('raf: runs on next animation frame (or falls back if not available)', async () => {
    const calls: string[] = [];
    const schedule = Time.scheduler(life(), 'raf');

    schedule(() => calls.push('cb'));
    // Just await the hop (RAF or fallback) and then assert it ran.
    await schedule();
    expect(calls).to.eql(['cb']);
  });

  it('lifecycle guard: skips callback if disposed at run time (micro)', async () => {
    const l = life(false);
    const calls: number[] = [];
    const schedule = Time.scheduler(l, 'micro');

    schedule(() => calls.push(1));
    (l as any).disposed = true; // Dispose before microtask flush

    await schedule(); // hop
    expect(calls).to.eql([]); // nothing ran
  });

  it('lifecycle guard: skips callback if disposed at run time (macro)', async () => {
    const l = life(false);
    const calls: number[] = [];
    const schedule = Time.scheduler(l, 'macro');

    schedule(() => calls.push(1));
    (l as any).disposed = true;

    await schedule(); // hop
    expect(calls).to.eql([]);
  });

  it('awaitable hop resolves even if disposed (no callback run)', async () => {
    const l = life(true);
    const schedule = Time.scheduler(l, 'micro');
    await schedule(); // should resolve, not throw
  });

  it('ordering (best-effort): micro before macro before raf', async () => {
    const order: string[] = [];
    const lm = life(false);

    const micro = Time.scheduler(lm, 'micro');
    const macro = Time.scheduler(lm, 'macro');
    const raf = Time.scheduler(lm, 'raf');

    micro(() => order.push('micro'));
    macro(() => order.push('macro'));
    raf(() => order.push('raf'));

    await micro();
    await macro();
    await raf();

    expect(order).to.eql(['micro', 'macro', 'raf']);
  });

  it('does nothing when called with a disposed life (no-op fast path)', async () => {
    const l = life(true);
    const calls: number[] = [];
    const schedule = Time.scheduler(l, 'micro');
    schedule(() => calls.push(1));
    await schedule();
    expect(calls).to.eql([]);
  });
});
