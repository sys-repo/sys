import { describe, expect, it } from '../../-test.ts';
import { Schedule } from '../mod.ts';
import { runWorkerFixture } from './u.fixture.worker.ts';

type FrameResult = {
  readonly defaultCount: number;
  readonly descriptorRestored: boolean;
  readonly fractionalCount: number;
  readonly infiniteCount: number;
  readonly nanCount: number;
  readonly negativeCount: number;
  readonly zeroCount: number;
};

describe('Schedule frames', () => {
  it('raf callback → deferred until the next frame hop', async () => {
    const calls: string[] = [];
    const result = Schedule.raf(() => calls.push('callback'));

    expect(result).to.equal(undefined);
    expect(calls).to.eql([]);
    await Schedule.raf();
    expect(calls).to.eql(['callback']);
  });

  it('public frame count → finite, floored, and clamped to zero', async () => {
    expect(await runFixture()).to.eql({
      defaultCount: 1,
      descriptorRestored: true,
      fractionalCount: 2,
      infiniteCount: 0,
      nanCount: 0,
      negativeCount: 0,
      zeroCount: 0,
    });
  });

  it('public frames → preserves the canonical raf identity', async () => {
    const raf = Schedule.raf;

    await Schedule.frames(2);

    expect(Schedule.raf).to.equal(raf);
  });
});

function runFixture(): Promise<FrameResult> {
  return runWorkerFixture(
    new URL('./u.fixture.frame.worker.ts', import.meta.url),
    'Schedule frame worker',
  );
}
