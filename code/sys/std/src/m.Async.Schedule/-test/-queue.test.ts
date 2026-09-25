import { describe, expect, it, type t } from '../../-test.ts';
import { Time } from '../../m.Time/mod.ts';
import { Rx } from '../common.ts';
import { Schedule } from '../mod.ts';
import { runWorkerFixture } from './u.fixture.worker.ts';

type FailureResults = {
  readonly results: readonly {
    readonly queue: string;
    readonly outcome: string;
    readonly taskCalls: number;
    readonly disposeCalls: number;
    readonly errorCount: number;
    readonly rejectionCount: number;
    readonly originalFailure: boolean;
    readonly disposalErrorCount: number;
    readonly disposalRejectionPreserved: boolean;
    readonly disposedBeforeError: boolean;
    readonly reportAfterDisposalTurn: boolean;
    readonly listenersDetached: boolean;
    readonly pendingFixtureTimers: number;
  }[];
  readonly ambientTimerCalls: number;
  readonly descriptorsRestored: boolean;
};

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

  const queues: readonly { name: string; config: t.ScheduleQueueConfig }[] = [
    { name: 'micro', config: 'micro' },
    { name: 'raf', config: 'raf' },
    { name: 'zero-frames', config: { frames: 0 } },
    { name: 'frames', config: { frames: 2 } },
    { name: 'ms', config: { ms: 0 } },
  ];

  for (const queue of queues) {
    it(`${queue.name}: pending asynchronous task → disposes once after fulfillment`, async () => {
      const admitted = Promise.withResolvers<void>();
      const completion = Promise.withResolvers<void>();
      let taskCalls = 0;
      let disposeCalls = 0;
      const life = Schedule.queue(() => {
        taskCalls += 1;
        admitted.resolve();
        return completion.promise;
      }, queue.config);
      life.dispose$.subscribe(() => disposeCalls += 1);

      try {
        await admitted.promise;
        expect(life.disposed).to.eql(false);
        expect(disposeCalls).to.eql(0);
        completion.resolve();
        await Schedule.micro();
        expect(life.disposed).to.eql(true);
        life.dispose();
        life.dispose();
        expect(taskCalls).to.eql(1);
        expect(disposeCalls).to.eql(1);
      } finally {
        completion.resolve();
        life.dispose();
      }
    });

    it(`${queue.name}: disposal before admission → never invokes the task`, async () => {
      let taskCalls = 0;
      let disposeCalls = 0;
      const life = Schedule.queue(() => taskCalls += 1, queue.config);
      life.dispose$.subscribe(() => disposeCalls += 1);
      life.dispose();
      life.dispose();

      await Schedule.frames(4);
      await Schedule.macro();
      expect(taskCalls).to.eql(0);
      expect(disposeCalls).to.eql(1);
    });
  }

  const scenarios = [
    { name: 'queueFailures', replaceTimer: false },
    { name: 'queueFallbackFailures', replaceTimer: false },
    { name: 'queueCapturedTimerFailures', replaceTimer: true },
    { name: 'queueFallbackCapturedTimerFailures', replaceTimer: true },
  ] as const;

  for (const scenario of scenarios) {
    it(`${scenario.name} → one task report with separate disposal-origin failures`, async () => {
      const actual = await runWorkerFixture<FailureResults>(
        new URL('./u.fixture.host-capture.worker.ts', import.meta.url),
        `Schedule queue worker (${scenario.name})`,
        scenario.name,
      );
      const outcomes = [
        'throw',
        'reject',
        'dispose-during',
        'self-dispose',
        'throw-value',
        'reject-undefined',
        'observer-throw',
        'observer-reject',
        'teardown-throw',
        'teardown-reject',
      ];
      expect(actual.results.map(({ queue, outcome }) => ({ queue, outcome }))).to.eql(
        queues.flatMap(({ name }) => outcomes.map((outcome) => ({ queue: name, outcome }))),
      );
      for (const result of actual.results) {
        const observerFails = result.outcome === 'observer-throw' ||
          result.outcome === 'observer-reject';
        const teardownFails = result.outcome === 'teardown-throw' ||
          result.outcome === 'teardown-reject';
        const label = `${result.queue}: ${result.outcome}`;
        expect(result.originalFailure, `${label}: task identity`).to.eql(true);
        expect(result.listenersDetached, `${label}: listener cleanup`).to.eql(true);
        expect(result, label).to.eql({
          queue: result.queue,
          outcome: result.outcome,
          taskCalls: 1,
          disposeCalls: 1,
          errorCount: observerFails ? 2 : 1,
          rejectionCount: teardownFails ? 1 : 0,
          originalFailure: true,
          disposalErrorCount: observerFails ? 1 : 0,
          disposalRejectionPreserved: teardownFails,
          disposedBeforeError: true,
          reportAfterDisposalTurn: true,
          listenersDetached: true,
          pendingFixtureTimers: 0,
        });
      }
      // Millisecond admission and Rx's separate observer-error timers remain ambient.
      const ambientTimers = outcomes.length + queues.length * 2;
      expect(actual.ambientTimerCalls).to.eql(scenario.replaceTimer ? ambientTimers : 0);
      expect(actual.descriptorsRestored).to.eql(true);
    });
  }

  it('fixture disposal throws → releases listeners and timers without hiding the failure', async () => {
    const actual = await runWorkerFixture(
      new URL('./u.fixture.host-capture.worker.ts', import.meta.url),
      'Schedule queue fixture cleanup',
      'queueCleanupFailure',
    );
    expect(actual).to.eql({
      disposed: true,
      disposalFailurePreserved: true,
      listenersDetached: true,
      taskCalls: 0,
      timerCalls: 0,
      pendingFixtureTimers: 0,
    });
  });
});
