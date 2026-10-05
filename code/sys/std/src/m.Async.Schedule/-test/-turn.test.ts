import { describe, expect, expectError, it } from '../../-test.ts';
import { Schedule } from '../mod.ts';

describe('Schedule turns', () => {
  it('micro callback → deferred until the microtask queue', async () => {
    const calls: string[] = [];
    const result = Schedule.micro(() => calls.push('callback'));

    expect(result).to.equal(undefined);
    expect(calls).to.eql([]);
    await Schedule.micro();
    expect(calls).to.eql(['callback']);
  });

  it('macro callback → not flushed by a microtask', async () => {
    const calls: string[] = [];
    const result = Schedule.macro(() => calls.push('callback'));

    expect(result).to.equal(undefined);
    await Promise.resolve();
    expect(calls).to.eql([]);
    await Schedule.macro();
    expect(calls).to.eql(['callback']);
  });

  it('microtask → macrotask → follow-on microtask ordering', async () => {
    const order: string[] = [];
    Schedule.macro(() => {
      order.push('macro');
      Schedule.micro(() => order.push('micro from macro'));
    });
    Schedule.micro(() => order.push('micro'));

    await Schedule.macro();

    expect(order).to.eql(['micro', 'macro', 'micro from macro']);
  });

  it('tick → timer task followed by its microtasks', async () => {
    const order: string[] = [];
    Schedule.macro(() => {
      order.push('macro');
      void Promise.resolve().then(() => order.push('micro from macro'));
    });

    await Schedule.tick();

    expect(order).to.eql(['macro', 'micro from macro']);
  });

  describe('waitFor', () => {
    it('eventual predicate → resolves before the deadline', async () => {
      let value = 0;
      void Schedule.sleep(10, 'macro').then(() => value = 42);

      await Schedule.waitFor(() => value === 42, 1_000);

      expect(value).to.equal(42);
    });

    it('false predicate → throws at the deadline', async () => {
      await expectError(() => Schedule.waitFor(() => false, 20), 'waitFor: timeout');
    });

    it('ready predicate → evaluated once after the initial turn', async () => {
      let calls = 0;

      await Schedule.waitFor(() => {
        calls += 1;
        return true;
      }, 1_000);

      expect(calls).to.equal(1);
    });

    it('polling turn → includes follow-on microtasks', async () => {
      const steps: string[] = [];
      let ready = false;
      Schedule.macro(() => {
        steps.push('macro');
        ready = true;
        void Promise.resolve().then(() => steps.push('micro from macro'));
      });

      await Schedule.waitFor(() => ready, 200);

      expect(steps).to.eql(['macro', 'micro from macro']);
    });
  });
});
