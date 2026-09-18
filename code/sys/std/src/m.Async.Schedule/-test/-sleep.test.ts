import { describe, expect, it, type t } from '../../-test.ts';
import { Schedule } from '../mod.ts';
import { runWorkerFixture } from './u.fixture.worker.ts';

type HopCounts = {
  readonly delays: readonly number[];
  readonly microtasks: number;
  readonly timers: number;
};
type SleepResult = {
  readonly descriptorsRestored: boolean;
  readonly macro: HopCounts;
  readonly micro: HopCounts;
  readonly none: HopCounts;
  readonly raf: HopCounts;
};

describe('Schedule.sleep', () => {
  it('timer-only sleep → respects the requested lower bound', async () => {
    const ms: t.Msecs = 12;
    expect(await elapsed(() => Schedule.sleep(ms))).to.be.at.least(ms);
  });

  it('selected follow-on mode → performs the observable public hop', async () => {
    expect(await runFixture()).to.eql({
      descriptorsRestored: true,
      macro: { delays: [0, 0], microtasks: 0, timers: 2 },
      micro: { delays: [0], microtasks: 1, timers: 1 },
      none: { delays: [0], microtasks: 0, timers: 1 },
      raf: { delays: [0, 16], microtasks: 0, timers: 2 },
    });
  });

  it('null or false follow-on → performs no selected hop', async () => {
    expect(await elapsed(() => Schedule.sleep(8, null))).to.be.at.least(8);
    expect(await elapsed(() => Schedule.sleep(8, false))).to.be.at.least(8);
  });

  it('concurrent sleeps → settle independently', async () => {
    const ms: t.Msecs = 10;
    const duration = await elapsed(async () => {
      await Promise.all([Schedule.sleep(ms), Schedule.sleep(ms), Schedule.sleep(ms, 'micro')]);
    });

    expect(duration).to.be.at.least(ms);
  });
});

function runFixture(): Promise<SleepResult> {
  return runWorkerFixture(
    new URL('./u.fixture.sleep.worker.ts', import.meta.url),
    'Schedule sleep worker',
  );
}

async function elapsed(fn: () => Promise<unknown>): Promise<number> {
  const started = performance.now();
  await fn();
  return performance.now() - started;
}
