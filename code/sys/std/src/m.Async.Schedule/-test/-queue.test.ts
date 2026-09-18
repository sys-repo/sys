import { describe, expect, it } from '../../-test.ts';
import { Time } from '../../m.Time/mod.ts';
import { Rx } from '../common.ts';
import { Schedule } from '../mod.ts';

describe('Schedule.queue', () => {
  it('default queue → runs once and disposes its lifecycle', async () => {
    let calls = 0;
    const life = Schedule.queue(() => calls += 1);

    expect(life.disposed).to.eql(false);
    await Schedule.micro();
    await Schedule.micro();

    expect(calls).to.equal(1);
    expect(life.disposed).to.eql(true);
  });

  it('raf queue → runs on a frame', async () => {
    let calls = 0;
    Schedule.queue(() => calls += 1, { queue: 'raf' });

    await Schedule.raf();

    expect(calls).to.equal(1);
  });

  it('frame-count queue → stays pending across its first frame boundary', async () => {
    let calls = 0;
    Schedule.queue(() => calls += 1, { queue: { frames: 2 } });

    expect(calls).to.equal(0);
    await Schedule.raf();
    expect(calls).to.equal(0);
    await Schedule.frames(2);
    expect(calls).to.equal(1);
    await Schedule.raf();
    expect(calls).to.equal(1);
  });

  it('zero-frame queue → waits for the next frame and runs once', async () => {
    let calls = 0;
    Schedule.queue(() => calls += 1, { queue: { frames: 0 } });

    expect(calls).to.equal(0);
    await Schedule.raf();
    expect(calls).to.equal(1);
    await Schedule.raf();
    expect(calls).to.equal(1);
  });

  it('millisecond queue → waits for its timer', async () => {
    let calls = 0;
    Schedule.queue(() => calls += 1, { queue: { ms: 10 } });

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(calls).to.equal(1);
  });

  it('zero-millisecond queue → remains a macrotask', async () => {
    let calls = 0;
    Schedule.queue(() => calls += 1, { queue: { ms: 0 } });

    await Promise.resolve();
    expect(calls).to.equal(0);
    await Schedule.macro();
    expect(calls).to.equal(1);
  });

  it('disposed returned lifecycle → cancels pending timer work', async () => {
    let calls = 0;
    const life = Schedule.queue(() => calls += 1, { queue: { ms: 20 } });
    life.dispose();

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(calls).to.equal(0);
  });

  it('oversized timer → clamps to the canonical domain instead of firing immediately', async () => {
    let calls = 0;
    const life = Schedule.queue(() => calls += 1, {
      queue: { ms: Time.Delay.MAX + 1 },
    });

    await Schedule.macro();
    expect(calls).to.equal(0);

    life.dispose();
    await Schedule.macro();
    expect(calls).to.equal(0);
  });

  it('positional queue and until → cancellation wins before execution', async () => {
    let calls = 0;
    const gate = Rx.lifecycle();
    Schedule.queue(() => calls += 1, 'raf', gate.dispose$);
    gate.dispose();

    await Schedule.raf();

    expect(calls).to.equal(0);
  });

  it('options queue and until → cancellation wins before execution', async () => {
    let calls = 0;
    const gate = Rx.lifecycle();
    Schedule.queue(() => calls += 1, { queue: 'micro', until: gate.dispose$ });
    gate.dispose();

    await Schedule.micro();

    expect(calls).to.equal(0);
  });

  it('synchronously disposed until → prevents queue admission', async () => {
    let calls = 0;
    Schedule.queue(() => calls += 1, { until: Rx.of({ reason: 'synchronous:until' }) });

    await Schedule.micro();

    expect(calls).to.equal(0);
  });
});
