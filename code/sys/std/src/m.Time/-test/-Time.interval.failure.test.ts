import { describe, expect, it, type t } from '../../-test.ts';
import { runWorkerFixture } from '../../m.Async.Schedule/-test/u.fixture.worker.ts';
import { Time } from '../mod.ts';
import { abortProbe } from './u.fixture.abort.ts';

type Snapshot = {
  readonly is: t.Time.Interval.Handle['is'] | null;
  readonly callbackCalls: number;
  readonly timerCalls: number;
  readonly pendingTimers: number;
  readonly listenersAdded: number;
  readonly listenersRemoved: number;
};
type Reply = {
  readonly synchronousErrors: number;
  readonly hostErrors: number;
  readonly hostRejections: number;
  readonly originalFailure: boolean;
  readonly contractTypeError: boolean;
  readonly cleanAtReport: readonly boolean[];
  readonly flagsAtReport: readonly (t.Time.Interval.Handle['is'] | null)[];
  readonly beforeRelease: Snapshot;
  readonly afterWindow: Snapshot;
  readonly afterCancel: t.Time.Interval.Handle['is'] | null;
  readonly listenerDetached: boolean;
  readonly hostListenersDetached: boolean;
  readonly timersCreated: number;
  readonly thenReads: number;
  readonly thenCalls: number;
  readonly receiverPreserved: boolean;
};

describe('Time.interval failure ownership', () => {
  for (const immediate of [false, true]) {
    const mode = immediate ? 'immediate' : 'scheduled';
    const outcomes = [
      'throw',
      'throw-value',
      'throw-undefined',
      'abort-throw',
      'resolve-promise',
      'reject-promise',
      'late-reject',
      'resolve-thenable',
      'reject-thenable',
      'throw-thenable',
      'double-settle',
      'function-thenable',
      'abort-then-getter',
      'throw-then-getter',
      'async-then-reject',
      'async-then-resolve-reject',
      'async-then-reject-reject',
      'async-then-late-reject',
      'async-then-resolve-late-reject',
      'async-then-reject-late-reject',
      ...immediate ? [] : ['cancel-throw', 'cancel-thenable'],
    ];
    for (const outcome of outcomes) {
      it(`${mode}: ${outcome} → stops, cleans up, and reports once`, async () => {
        const actual = await runWorkerFixture<Reply>(
          new URL('./u.fixture.interval.worker.ts', import.meta.url),
          `Time.interval ${mode}: ${outcome}`,
          { immediate, outcome },
        );
        const callbackFailure = [
          'throw',
          'throw-value',
          'throw-undefined',
          'abort-throw',
          'cancel-throw',
          'throw-then-getter',
        ].includes(outcome);
        const customThenable = outcome.startsWith('async-then-') || [
          'resolve-thenable',
          'reject-thenable',
          'throw-thenable',
          'double-settle',
          'function-thenable',
          'abort-then-getter',
          'throw-then-getter',
          'cancel-thenable',
        ].includes(outcome);
        const flags = immediate
          ? null
          : { cancelled: false, failed: true, done: true, running: false };
        const terminal = {
          is: flags,
          callbackCalls: 1,
          timerCalls: immediate ? 0 : 1,
          pendingTimers: 0,
          listenersAdded: 1,
          listenersRemoved: 1,
        };
        expect(actual.hostRejections, 'internal unhandled rejections').to.eql(0);
        expect(actual).to.eql({
          synchronousErrors: immediate ? 1 : 0,
          hostErrors: immediate ? 0 : 1,
          hostRejections: 0,
          originalFailure: callbackFailure,
          contractTypeError: !callbackFailure,
          cleanAtReport: [true],
          flagsAtReport: [flags],
          beforeRelease: terminal,
          afterWindow: terminal,
          afterCancel: flags,
          listenerDetached: true,
          hostListenersDetached: true,
          timersCreated: immediate ? 0 : 1,
          thenReads: customThenable ? 1 : 0,
          thenCalls: customThenable && outcome !== 'throw-then-getter' ? 1 : 0,
          receiverPreserved: true,
        });
      });
    }

    const registrations = ['notify', 'notify-throw-before', 'notify-throw-after', 'throw-after'];
    for (const registration of registrations) {
      it(`${mode}: registration ${registration} → no retained abort listener`, () => {
        const failure = new Error('listener registration failure');
        const probe = abortProbe({
          beforeAdd(notify) {
            if (registration !== 'throw-after') notify();
            if (registration === 'notify-throw-before') throw failure;
          },
          afterAdd() {
            if (registration.endsWith('throw-after')) throw failure;
          },
        });
        let handle: t.Time.Interval.Handle | undefined;
        let caught = false;
        let callbackCalls = 0;
        try {
          try {
            handle = Time.interval(Time.Delay.MAX, () => callbackCalls++, {
              immediate,
              signal: probe.ctrl.signal,
            });
          } catch (error) {
            caught = true;
            expect(error).to.equal(failure);
          }
          expect(caught).to.eql(registration !== 'notify');
          expect(callbackCalls).to.eql(0);
          expect(probe.calls).to.eql(registration === 'throw-after' ? 0 : 1);
          // Probe before cancel/abort can repair an abandoned acquisition.
          const callsBeforeSentinel = probe.calls;
          probe.ctrl.signal.dispatchEvent(new Event('abort'));
          expect(probe.calls, 'listener delivery after termination').to.eql(callsBeforeSentinel);
          expect(probe.added).to.eql(registration === 'notify-throw-before' ? 0 : 1);
          expect(probe.removed).to.eql(probe.added);
          if (registration === 'notify') {
            expect(handle?.is).to.eql({
              cancelled: true,
              failed: false,
              done: true,
              running: false,
            });
          } else expect(handle).to.eql(undefined);
        } finally {
          handle?.cancel();
          probe.ctrl.abort();
        }
      });
    }

    it(`${mode}: pre-abort → no callback, listener, or timer admission`, () => {
      const probe = abortProbe();
      probe.ctrl.abort();
      let calls = 0;
      const interval = Time.interval(Time.Delay.MAX, () => calls++, {
        immediate,
        signal: probe.ctrl.signal,
      });
      try {
        expect(calls).to.eql(0);
        expect(interval.is).to.eql({ cancelled: true, failed: false, done: true, running: false });
        expect(probe.added).to.eql(0);
        expect(probe.removed).to.eql(0);
      } finally {
        interval.cancel();
      }
    });

    it(`${mode}: cancellation → terminal state and detached listener`, () => {
      const probe = abortProbe();
      const interval = Time.interval(Time.Delay.MAX, () => {}, {
        immediate,
        signal: probe.ctrl.signal,
      });
      interval.cancel();
      interval.cancel();
      probe.ctrl.signal.dispatchEvent(new Event('abort'));
      expect(interval.is).to.eql({ cancelled: true, failed: false, done: true, running: false });
      expect(probe.added).to.eql(1);
      expect(probe.removed).to.eql(1);
      expect(probe.calls).to.eql(0);
    });
  }

  const values = [undefined, 42, 'value', {}, { then: 42 }, () => {}];
  for (const [index, value] of values.entries()) {
    it(`ordinary value ${index} → ignored while synchronous ticks continue`, async () => {
      const probe = abortProbe();
      const second = Promise.withResolvers<void>();
      let calls = 0;
      const interval = Time.interval(1, () => {
        calls += 1;
        if (calls === 2) {
          probe.ctrl.abort();
          second.resolve();
        }
        return value;
      }, { immediate: true, signal: probe.ctrl.signal });
      try {
        expect(calls).to.eql(1);
        expect(interval.is).to.eql({ cancelled: false, failed: false, done: false, running: true });
        await second.promise;
        expect(calls).to.eql(2);
        expect(interval.is).to.eql({ cancelled: true, failed: false, done: true, running: false });
        expect(probe.removed).to.eql(1);
        probe.ctrl.signal.dispatchEvent(new Event('abort'));
        expect(probe.calls).to.eql(1);
      } finally {
        interval.cancel();
      }
    });
  }
});
