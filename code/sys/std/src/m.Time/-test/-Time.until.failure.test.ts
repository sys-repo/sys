import { describe, expect, it, type t } from '../../-test.ts';
import { runWorkerFixture } from '../../m.Async.Schedule/-test/u.fixture.worker.ts';
import { Time } from '../mod.ts';
import { abortProbe } from './u.fixture.abort.ts';
import { scopeProbe } from './u.fixture.scope.ts';

const intervalCases = [
  ['throws an Error', 'throw'],
  ['throws a non-Error value', 'throw-value'],
  ['throws undefined', 'throw-undefined'],
  ['aborts the caller signal, then throws', 'abort-throw'],
  ['disposes the scope, then throws', 'parent-throw'],
  ['disposes the scope, then returns a thenable', 'parent-thenable'],
  ['returns a fulfilled Promise', 'resolve-promise'],
  ['returns a rejected Promise', 'reject-promise'],
  ['returns a Promise that rejects later', 'late-reject'],
  ['returns an object whose then getter throws', 'throw-then-getter'],
  ['returns a thenable whose async method rejects', 'async-then-reject'],
  ['thenable resolves; its async method rejects later', 'async-then-resolve-late-reject'],
] as const;

describe('Time.until failure ownership', () => {
  describe('delay rejection belongs to the caller', () => {
    it('callback failure → one Promise rejection and no retained parent subscription', async () => {
      const actual = await runWorkerFixture<{
        results: readonly {
          queue: string;
          outcome: string;
          rejected: boolean;
          originalFailure: boolean;
          is: t.Time.Delay.Handle['is'];
          hostErrors: number;
          hostRejections: number;
          parentSubscriptions: number;
          parentDisposed: boolean;
        }[];
        listenersDetached: boolean;
      }>(
        new URL('./u.fixture.delay.worker.ts', import.meta.url),
        'scoped delay failure ownership',
        { scoped: true },
      );
      const outcomes = [
        'throw',
        'reject',
        'cancel-throw',
        'abort-throw',
        'cancel-reject',
        'abort-reject',
        'throw-undefined',
        'then-getter',
        'parent-throw',
        'parent-reject',
      ];
      expect(actual.results.map(({ queue, outcome }) => ({ queue, outcome }))).to.eql(
        ['micro', 'macro'].flatMap((queue) => outcomes.map((outcome) => ({ queue, outcome }))),
      );
      for (const result of actual.results) {
        expect(result, `${result.queue}: ${result.outcome}`).to.eql({
          queue: result.queue,
          outcome: result.outcome,
          rejected: true,
          originalFailure: true,
          is: { done: true, completed: false, cancelled: false },
          hostErrors: 0,
          hostRejections: 0,
          parentSubscriptions: 0,
          parentDisposed: result.outcome.startsWith('parent-'),
        });
      }
      expect(actual.listenersDetached).to.eql(true);
    });

    for (const fails of [false, true]) {
      const outcome = fails ? 'original callback failure' : 'successful completion';
      it(`parent subscription teardown throws → preserves ${outcome}`, async () => {
        using cleanup = new DisposableStack();
        const failure = new Error('callback failure');
        const parent = cleanup.use(scopeProbe(undefined, {
          released() {
            throw new Error('bridge teardown failure');
          },
        }));
        const child = cleanup.adopt(
          parent.scope.delay(() => {
            if (fails) throw failure;
            return 42;
          }),
          (child) => child.cancel(),
        );
        const observed = child.then(
          (value) => ({ failed: false, value }),
          (error: unknown) => ({ failed: true, value: error }),
        );

        expect(await observed).to.eql({ failed: fails, value: fails ? failure : undefined });
        expect(parent.active).to.eql(0);
        expect(parent.removed).to.eql(1);
        expect(parent.scope.disposed).to.eql(false);
      });
    }
  });

  describe('interval cleanup precedes failure reporting', () => {
    for (const mode of ['scheduled', 'immediate'] as const) {
      const immediate = mode === 'immediate';
      const channel = immediate ? 'synchronous throw' : 'host error';
      describe(`${mode} callback → ${channel}`, () => {
        const cases = [
          ...intervalCases,
          ...immediate ? [] : [['cancels its handle, then throws', 'cancel-throw'] as const],
        ];
        for (const [name, outcome] of cases) {
          it(`${name} → reports once after releasing resources`, async () => {
            const actual = await runWorkerFixture<Record<string, unknown>>(
              new URL('./u.fixture.interval.worker.ts', import.meta.url),
              `scoped ${mode} interval: ${name}`,
              { immediate, outcome, scoped: true },
            );
            const callbackFailure = [
              'throw',
              'throw-value',
              'throw-undefined',
              'abort-throw',
              'parent-throw',
              'cancel-throw',
              'throw-then-getter',
            ].includes(outcome);
            const customThenable = outcome.startsWith('async-then-') ||
              outcome === 'throw-then-getter' || outcome === 'parent-thenable';
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
              parentSubscriptions: 0,
            };
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
              timersCreated: immediate ? 0 : 1,
              thenReads: customThenable ? 1 : 0,
              thenCalls: customThenable && outcome !== 'throw-then-getter' ? 1 : 0,
              receiverPreserved: true,
              parentDisposed: outcome.startsWith('parent-'),
              hostListenersDetached: true,
            });
          });
        }
      });
    }
  });

  describe('cancellation during resource acquisition', () => {
    for (const kind of ['delay', 'interval'] as const) {
      describe(kind, () => {
        it('parent notifies before subscribe returns → releases the late-assigned subscription', async () => {
          using cleanup = new DisposableStack();
          const parent = cleanup.use(scopeProbe(undefined, { subscribed: (notify) => notify() }));
          const probe = abortProbe();
          let calls = 0;
          const child = cleanup.adopt(
            kind === 'delay'
              ? parent.scope.delay(() => calls++, probe.ctrl.signal)
              : parent.scope.interval(Time.Delay.MAX, () => calls++, {
                immediate: true,
                signal: probe.ctrl.signal,
              }),
            (child) => child.cancel(),
          );

          expect(calls).to.eql(0);
          expect(child.is.cancelled).to.eql(true);
          expect(parent.active).to.eql(0);
          expect(parent.added).to.eql(1);
          expect(parent.removed).to.eql(1);
          expect(probe.added).to.eql(0);
          if (kind === 'delay') await child;
        });

        const registrations = [
          ['caller abort notification', 'cancel'],
          ['scope disposal', 'parent'],
          ['scope disposal, then a throw', 'parent-throw'],
        ] as const;
        for (const [name, action] of registrations) {
          it(`${name} during signal registration → releases listener and parent subscription`, async () => {
            using cleanup = new DisposableStack();
            const parent = cleanup.use(scopeProbe());
            const failure = new Error('registration failure');
            const probe = abortProbe({
              beforeAdd(notify) {
                if (action === 'cancel') notify();
                else parent.scope.dispose();
              },
              afterAdd() {
                if (action === 'parent-throw') throw failure;
              },
            });
            let calls = 0;
            const create = () => {
              return cleanup.adopt(
                kind === 'delay'
                  ? parent.scope.delay(() => calls++, probe.ctrl.signal)
                  : parent.scope.interval(Time.Delay.MAX, () => calls++, {
                    immediate: true,
                    signal: probe.ctrl.signal,
                  }),
                (child) => child.cancel(),
              );
            };

            // Interval setup throws; Delay's earlier cancellation has already settled its Promise.
            const throws = kind === 'interval' && action === 'parent-throw';
            if (throws) expect(create).to.throw(failure);
            const child = throws ? undefined : create();
            if (!throws) expect(child?.is.cancelled).to.eql(true);
            // Prove release in the acquisition turn, before even awaiting the cancelled Promise.
            expect(calls).to.eql(0);
            expect(parent.active).to.eql(0);
            expect(probe.added).to.eql(1);
            expect(probe.removed).to.eql(1);
            const callsBeforeSentinel = probe.calls;
            probe.ctrl.signal.dispatchEvent(new Event('abort'));
            expect(probe.calls).to.eql(callsBeforeSentinel);
            if (kind === 'delay') await child;
          });
        }
      });
    }
  });

  describe('fixture teardown safeguards', () => {
    it('test body throws with a callback in flight → drains borrowed work before leaving the fixture', async () => {
      using parent = scopeProbe();
      const admitted = Promise.withResolvers<void>();
      const completion = Promise.withResolvers<void>();
      const failure = new Error('fixture assertion failure');
      const delay = parent.scope.delay(() => {
        admitted.resolve();
        return completion.promise;
      });
      let caught: unknown;
      try {
        await using cleanup = new AsyncDisposableStack();
        cleanup.defer(async () => {
          completion.resolve();
          await delay;
        });
        cleanup.defer(() => delay.cancel());
        await admitted.promise;
        throw failure;
      } catch (error) {
        caught = error;
      }

      expect(caught).to.equal(failure);
      expect(delay.is).to.eql({ cancelled: false, completed: true, done: true });
      expect(parent.active).to.eql(0);
      expect(parent.removed).to.eql(1);
      expect(parent.scope.disposed).to.eql(false);
    });

    it('scope disposal throws → still restores the observed subscription descriptor', () => {
      using scope = Time.until();
      const source = scope.dispose$;
      const descriptor = Object.getOwnPropertyDescriptor(source, 'subscribe');
      const subscribe = source.subscribe;
      const failure = new Error('fixture scope disposal failure');
      const dispose = scope.dispose;
      scope.dispose = () => {
        dispose();
        throw failure;
      };

      expect(() => {
        using parent = scopeProbe(scope);
        expect(parent.scope).to.equal(scope);
      }).to.throw(failure);
      expect(scope.disposed).to.eql(true);
      expect(source.subscribe).to.equal(subscribe);
      expect(Object.getOwnPropertyDescriptor(source, 'subscribe')).to.eql(descriptor);
    });

    it('test body and child teardown throw → releases remaining resources and retains both failures', () => {
      using scope = Time.until();
      const source = scope.dispose$;
      const descriptor = Object.getOwnPropertyDescriptor(source, 'subscribe');
      const parent = scopeProbe(scope);
      const probe = abortProbe();
      const bodyFailure = new Error('fixture assertion failure');
      const teardownFailure = new Error('fixture child teardown failure');
      let subscriptionsBeforeParentDisposal: number | undefined;
      let caught: unknown;
      try {
        using cleanup = new DisposableStack();
        cleanup.use(parent);
        cleanup.adopt(
          parent.scope.interval(Time.Delay.MAX, () => {}, probe.ctrl.signal),
          (child) => {
            child.cancel();
            subscriptionsBeforeParentDisposal = parent.active;
          },
        );
        cleanup.adopt(parent.scope.delay(Time.Delay.MAX, undefined, probe.ctrl.signal), (child) => {
          child.cancel();
          throw teardownFailure;
        });
        throw bodyFailure;
      } catch (error) {
        caught = error;
      }

      expect(caught).to.be.instanceof(SuppressedError);
      expect(caught).to.have.property('error', teardownFailure);
      expect(caught).to.have.property('suppressed', bodyFailure);
      expect(subscriptionsBeforeParentDisposal).to.eql(0);
      expect(parent.active).to.eql(0);
      expect(parent.added).to.eql(2);
      expect(parent.removed).to.eql(2);
      expect(parent.scope.disposed).to.eql(true);
      expect(probe.added).to.eql(2);
      expect(probe.removed).to.eql(2);
      expect(Object.getOwnPropertyDescriptor(source, 'subscribe')).to.eql(descriptor);
    });
  });
});
