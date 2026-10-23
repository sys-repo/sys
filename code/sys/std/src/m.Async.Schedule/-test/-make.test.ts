import { describe, expect, it, type t } from '../../-test.ts';
import { Schedule } from '../mod.ts';

type MutableLife = { disposed: boolean };

describe('Schedule.make', () => {
  it('default scheduler → callback and awaitable microtask forms', async () => {
    const calls: string[] = [];
    const schedule = Schedule.make(life());
    const result = schedule(() => calls.push('callback'));

    expect(result).to.equal(undefined);
    expect(calls).to.eql([]);
    await schedule();
    expect(calls).to.eql(['callback']);
  });

  it('macro scheduler → not flushed by a microtask', async () => {
    const calls: string[] = [];
    const schedule = Schedule.make(life(), 'macro');
    schedule(() => calls.push('callback'));

    await Promise.resolve();
    expect(calls).to.eql([]);
    await schedule();
    expect(calls).to.eql(['callback']);
  });

  it('raf scheduler → callback precedes its following frame hop', async () => {
    const calls: string[] = [];
    const schedule = Schedule.make(life(), 'raf');
    schedule(() => calls.push('callback'));

    await schedule();

    expect(calls).to.eql(['callback']);
  });

  it('disposal before execution → suppresses callbacks while hops still settle', async () => {
    const modes: readonly t.AsyncSchedule[] = ['micro', 'macro', 'raf'];

    for (const mode of modes) {
      const gate = life();
      const calls: string[] = [];
      const schedule = Schedule.make(gate, mode);
      schedule(() => calls.push(mode));
      gate.disposed = true;

      await schedule();

      expect(calls).to.eql([]);
    }
  });

  it('initially disposed lifecycle → suppresses callbacks while hops still settle', async () => {
    const calls: string[] = [];
    const schedule = Schedule.make(life(true));
    schedule(() => calls.push('callback'));

    await schedule();

    expect(calls).to.eql([]);
  });
});

function life(disposed = false): MutableLife {
  return { disposed };
}
