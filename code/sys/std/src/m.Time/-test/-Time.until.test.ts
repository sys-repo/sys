import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Time } from '../mod.ts';
import { abortProbe } from './u.fixture.abort.ts';
import { scopeProbe } from './u.fixture.scope.ts';

type Timers = Pick<t.Time.Lib, 'delay' | 'wait' | 'interval'>;
type DelayCase = readonly [
  name: string,
  timeout: t.Msecs,
  create: (api: Timers, ctrl: AbortController, fn: t.Time.Delay.Callback) => t.Time.Delay.Promise,
];
type IntervalCase = readonly [
  name: string,
  create: (
    api: Timers,
    ctrl: AbortController,
    fn: t.Time.Interval.Callback,
  ) => t.Time.Interval.Handle,
];
const MAX = Time.Delay.MAX;
const cancelled = { cancelled: true, completed: false, done: true };
const stopped = { cancelled: true, failed: false, done: true, running: false };
const delayCases = [
  ['delay(ms, callback, signal)', MAX, (api, ctrl, fn) => api.delay(MAX, fn, ctrl.signal)],
  ['delay(ms, callback, controller)', MAX, (api, ctrl, fn) => api.delay(MAX, fn, ctrl)],
  [
    'delay(ms, callback, options)',
    MAX,
    (api, ctrl, fn) => api.delay(MAX, fn, { signal: ctrl.signal }),
  ],
  ['delay(ms, undefined, signal)', MAX, (api, ctrl) => api.delay(MAX, undefined, ctrl.signal)],
  ['delay(callback, signal)', 0, (api, ctrl, fn) => api.delay(fn, ctrl.signal)],
  ['delay(callback, controller)', 0, (api, ctrl, fn) => api.delay(fn, ctrl)],
  ['delay(callback, options)', 0, (api, ctrl, fn) => api.delay(fn, { signal: ctrl.signal })],
  ['delay(undefined, signal)', 0, (api, ctrl) => api.delay(undefined, ctrl.signal)],
  ['delay(signal)', 0, (api, ctrl) => api.delay(ctrl.signal)],
  ['delay(controller)', 0, (api, ctrl) => api.delay(ctrl)],
  ['delay(options)', 0, (api, ctrl) => api.delay({ signal: ctrl.signal })],
  ['wait(ms, signal)', MAX, (api, ctrl) => api.wait(MAX, ctrl.signal)],
  ['wait(ms, controller)', MAX, (api, ctrl) => api.wait(MAX, ctrl)],
  ['wait(ms, options)', MAX, (api, ctrl) => api.wait(MAX, { signal: ctrl.signal })],
  ['wait(undefined, signal)', 0, (api, ctrl) => api.wait(undefined, ctrl.signal)],
  ['wait(undefined, controller)', 0, (api, ctrl) => api.wait(undefined, ctrl)],
  ['wait(undefined, options)', 0, (api, ctrl) => api.wait(undefined, { signal: ctrl.signal })],
] satisfies readonly DelayCase[];
const intervalCases = [
  ['interval(ms, callback, signal)', (api, ctrl, fn) => api.interval(MAX, fn, ctrl.signal)],
  ['interval(ms, callback, controller)', (api, ctrl, fn) => api.interval(MAX, fn, ctrl)],
  [
    'interval(ms, callback, options)',
    (api, ctrl, fn) => api.interval(MAX, fn, { signal: ctrl.signal }),
  ],
  ['interval(ms, signal, callback)', (api, ctrl, fn) => api.interval(MAX, ctrl.signal, fn)],
  ['interval(ms, controller, callback)', (api, ctrl, fn) => api.interval(MAX, ctrl, fn)],
  [
    'interval(ms, options, callback)',
    (api, ctrl, fn) => api.interval(MAX, { signal: ctrl.signal }, fn),
  ],
] satisfies readonly IntervalCase[];

describe('Time.until', () => {
  describe('root overload parity', () => {
    it('scoped signatures equal the root delay, wait, and interval contracts', () => {
      using scope = Time.until();
      expectTypeOf(scope.delay).toEqualTypeOf<t.Time.Lib['delay']>();
      expectTypeOf(scope.wait).toEqualTypeOf<t.Time.Lib['wait']>();
      expectTypeOf(scope.interval).toEqualTypeOf<t.Time.Lib['interval']>();
    });

    for (const owner of ['root', 'scoped'] as const) {
      describe(owner, () => {
        for (const preAborted of [false, true]) {
          const timing = preAborted ? 'caller already aborted' : 'caller aborts before admission';
          describe(timing, () => {
            for (const [name, timeout, create] of delayCases) {
              it(`${name} → resolves as cancelled`, async () => {
                using cleanup = new DisposableStack();
                const parent = cleanup.use(scopeProbe());
                const probe = abortProbe();
                if (preAborted) probe.ctrl.abort();
                let calls = 0;
                const delay = cleanup.adopt(
                  create(owner === 'scoped' ? parent.scope : Time, probe.ctrl, () => calls++),
                  (child) => child.cancel(),
                );

                if (!preAborted) probe.ctrl.abort();
                expect(delay.is).to.eql(cancelled);
                expect(delay.timeout).to.eql(timeout);
                expect(calls).to.eql(0);
                expect(parent.active).to.eql(0);
                expect(probe.added).to.eql(preAborted ? 0 : 1);
                expect(probe.removed).to.eql(probe.added);
                await delay;
              });
            }
            for (const [name, create] of intervalCases) {
              it(`${name} → stops without invoking the callback`, () => {
                using cleanup = new DisposableStack();
                const parent = cleanup.use(scopeProbe());
                const probe = abortProbe();
                if (preAborted) probe.ctrl.abort();
                let calls = 0;
                const interval = cleanup.adopt(
                  create(owner === 'scoped' ? parent.scope : Time, probe.ctrl, () => calls++),
                  (child) => child.cancel(),
                );

                if (!preAborted) probe.ctrl.abort();
                expect(interval.is).to.eql(stopped);
                expect(interval.interval).to.eql(MAX);
                expect(calls).to.eql(0);
                expect(parent.active).to.eql(0);
                expect(probe.added).to.eql(preAborted ? 0 : 1);
                expect(probe.removed).to.eql(probe.added);
              });
            }
          });
        }
      });
    }
  });

  describe('callback admission and scheduling', () => {
    for (const input of ['scope', 'lifecycle', 'signal', 'nested'] as const) {
      it(`pre-terminated ${input} → suppresses immediate and deferred callbacks`, async () => {
        using cleanup = new DisposableStack();
        const outer = cleanup.use(Time.until());
        const ctrl = new AbortController();
        outer.dispose();
        ctrl.abort();
        const until = input === 'lifecycle'
          ? outer
          : input === 'signal'
          ? ctrl.signal
          : input === 'nested'
          ? [undefined, [outer, ctrl.signal]]
          : undefined;
        const parent = cleanup.use(scopeProbe(Time.until(until)));
        if (input === 'scope') parent.scope.dispose();
        let calls = 0;
        const delay = cleanup.adopt(parent.scope.delay(() => calls++), (child) => child.cancel());
        const interval = cleanup.adopt(
          parent.scope.interval(MAX, { immediate: true }, () => calls++),
          (child) => child.cancel(),
        );

        expect(calls).to.eql(0);
        expect(delay.is).to.eql(cancelled);
        expect(interval.is).to.eql(stopped);
        expect(parent.active).to.eql(0);
        await delay;
      });
    }

    for (const value of [-5, NaN, Infinity, 2.9, MAX + 1]) {
      it(`duration ${value} → normalizes within the timer domain, never to a microtask`, async () => {
        using cleanup = new DisposableStack();
        const parent = cleanup.use(scopeProbe());
        let calls = 0;
        const delay = cleanup.adopt(
          parent.scope.delay(value, () => calls++),
          (child) => child.cancel(),
        );
        const interval = cleanup.adopt(
          parent.scope.interval(value, () => calls++),
          (child) => child.cancel(),
        );

        const expected = value === MAX + 1 ? MAX : 0;
        expect(delay.timeout).to.eql(expected);
        expect(interval.interval).to.eql(expected);
        await Promise.resolve();
        expect(calls).to.eql(0);
        delay.cancel();
        interval.cancel();
        await delay;
        expect(parent.active).to.eql(0);
      });
    }

    it('wait() → completes in a microtask and releases its parent subscription', async () => {
      using cleanup = new DisposableStack();
      const parent = cleanup.use(scopeProbe());
      let macroCalled = false;
      cleanup.adopt(setTimeout(() => macroCalled = true, 0), clearTimeout);
      const wait = cleanup.adopt(parent.scope.wait(), (child) => child.cancel());

      expect(await wait).to.eql(undefined);
      expect(wait.is).to.eql({ completed: true, cancelled: false, done: true });
      expect(macroCalled).to.eql(false);
      expect(parent.active).to.eql(0);
      expect(parent.scope.disposed).to.eql(false);
    });

    it('options-first immediate interval → ignores ordinary returns and continues until cancelled', async () => {
      using cleanup = new DisposableStack();
      const parent = cleanup.use(scopeProbe());
      const second = Promise.withResolvers<void>();
      let calls = 0;
      const tick = cleanup.adopt(
        parent.scope.interval(1, { immediate: true }, () => {
          if (++calls === 2) second.resolve();
          return 42;
        }),
        (child) => child.cancel(),
      );

      expect(calls).to.eql(1);
      await second.promise;
      expect(calls).to.eql(2);
      expect(parent.active).to.eql(1);
      tick.cancel();
      expect(tick.is).to.eql(stopped);
      expect(parent.active).to.eql(0);
      expect(parent.scope.disposed).to.eql(false);
    });
  });

  describe('parent and child cancellation', () => {
    for (const mode of ['scheduled', 'immediate'] as const) {
      it(`${mode} interval disposes its scope → stops and releases its subscription`, async () => {
        using cleanup = new DisposableStack();
        const parent = cleanup.use(scopeProbe());
        const called = Promise.withResolvers<void>();
        const tick = cleanup.adopt(
          parent.scope.interval(1, () => {
            parent.scope.dispose();
            called.resolve();
          }, { immediate: mode === 'immediate' }),
          (child) => child.cancel(),
        );

        await called.promise;
        expect(tick.is).to.eql(stopped);
        expect(parent.active).to.eql(0);
      });
    }

    it('repeated child-first cancellation → releases subscriptions without disposing the scope', async () => {
      using parent = scopeProbe();
      for (let count = 0; count < 50; count++) {
        using cleanup = new DisposableStack();
        const delay = cleanup.adopt(parent.scope.delay(MAX), (child) => child.cancel());
        const interval = cleanup.adopt(
          parent.scope.interval(MAX, () => {}),
          (child) => child.cancel(),
        );

        expect(parent.active).to.eql(2);
        delay.cancel();
        interval.cancel();
        expect(parent.active).to.eql(0);
        delay.cancel();
        interval.cancel();
        await delay;
      }
      expect(parent.added).to.eql(100);
      expect(parent.removed).to.eql(100);
      expect(parent.scope.disposed).to.eql(false);
    });

    for (const first of ['parent', 'caller'] as const) {
      it(`${first} cancellation first → both authorities converge and release subscriptions`, async () => {
        using cleanup = new DisposableStack();
        const parent = cleanup.use(scopeProbe());
        const probe = abortProbe();
        let calls = 0;
        const delay = cleanup.adopt(
          parent.scope.delay(MAX, () => calls++, probe.ctrl.signal),
          (child) => child.cancel(),
        );
        const interval = cleanup.adopt(
          parent.scope.interval(MAX, () => calls++, probe.ctrl.signal),
          (child) => child.cancel(),
        );

        expect(parent.active).to.eql(2);
        if (first === 'parent') parent.scope.dispose();
        else probe.ctrl.abort();
        expect(delay.is).to.eql(cancelled);
        expect(interval.is).to.eql(stopped);
        expect(parent.active).to.eql(0);
        parent.scope.dispose();
        probe.ctrl.abort();
        expect(probe.added).to.eql(2);
        expect(probe.removed).to.eql(2);
        expect(calls).to.eql(0);
        await delay;
      });
    }
  });

  describe('admitted delay callbacks own settlement', () => {
    for (const queue of ['microtask', 'timer'] as const) {
      describe(queue, () => {
        for (const action of ['scope disposal', 'caller abort', 'handle cancellation'] as const) {
          for (const fails of [false, true]) {
            const outcome = fails ? 'callback rejection' : 'callback completion';
            it(`${action} after admission → preserves ${outcome}`, async () => {
              await using cleanup = new AsyncDisposableStack();
              const parent = cleanup.use(scopeProbe());
              const probe = abortProbe();
              const admitted = Promise.withResolvers<void>();
              const completion = Promise.withResolvers<void>();
              const failure = new Error('admitted callback failure');
              const callback = () => {
                admitted.resolve();
                return completion.promise;
              };
              const delay = queue === 'timer'
                ? parent.scope.delay(0, callback, probe.ctrl.signal)
                : parent.scope.delay(callback, probe.ctrl.signal);
              let settled = false;
              const observed = delay.then(
                () => {
                  settled = true;
                  return { failed: false, error: undefined };
                },
                (error: unknown) => {
                  settled = true;
                  return { failed: true, error };
                },
              );
              cleanup.defer(async () => {
                completion.resolve();
                await observed;
              });
              cleanup.defer(() => delay.cancel());

              await admitted.promise;
              if (action === 'scope disposal') parent.scope.dispose();
              if (action === 'caller abort') probe.ctrl.abort();
              if (action === 'handle cancellation') delay.cancel();
              await Promise.resolve();
              expect(settled).to.eql(false);
              expect(delay.is).to.eql({ cancelled: false, completed: false, done: false });
              if (fails) completion.reject(failure);
              else completion.resolve();
              expect(await observed).to.eql({ failed: fails, error: fails ? failure : undefined });
              expect(delay.is).to.eql({ cancelled: false, completed: !fails, done: true });
              expect(parent.active).to.eql(0);
              expect(probe.removed).to.eql(1);
              const calls = probe.calls;
              probe.ctrl.signal.dispatchEvent(new Event('abort'));
              expect(probe.calls).to.eql(calls);
            });
          }
        }
      });
    }
  });
});
