import { describe, expect, it } from '../../-test.ts';
import { Time } from '../mod.ts';
import { createWaitFor } from '../u/u.waitFor.ts';
import { abortProbe } from './u.fixture.abort.ts';
import { flushPolling, observeWaiter, pollingFixture } from './u.fixture.waitFor.ts';

describe('Time.waitFor observation window', () => {
  describe('budget admission and normalization', () => {
    for (const timeout of [-1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      it(`invalid budget ${timeout} → RangeError before predicate or effects`, async () => {
        using f = pollingFixture();
        let calls = 0;
        const result = f.run(() => ++calls, { timeout });
        await flushPolling();
        expect(result.outcome).to.have.property('ok', false);
        if (result.outcome?.ok === false) expect(result.outcome.error).to.be.instanceof(RangeError);
        expect(calls).to.eql(0);
        expect(f.wakes.size).to.eql(0);
        expect(f.listeners.added).to.eql(0);
      });
    }

    it('snapshots option getters once and preserves the default budget and interval', async () => {
      using f = pollingFixture();
      const reads = { interval: 0, timeout: 0, signal: 0 };
      const result = observeWaiter(createWaitFor(() => false, {
        get interval() {
          reads.interval++;
          return undefined;
        },
        get timeout() {
          reads.timeout++;
          return undefined;
        },
        get signal() {
          reads.signal++;
          return f.ctrl.signal;
        },
      }, f.effects));
      await flushPolling();
      expect([...f.wakes.values()].map((wake) => wake.msecs)).to.eql([2000, 30]);
      f.fire(2);
      await flushPolling();
      expect(reads).to.eql({ interval: 1, timeout: 1, signal: 1 });
      f.ctrl.abort('stop');
      await flushPolling();
      expect(result.outcome).to.eql({ ok: false, error: 'stop' });
      expect(f.wakes.size).to.eql(0);
    });

    const intervals = [
      [-5, 0],
      [NaN, 0],
      [Infinity, 0],
      [2.9, 0],
      [Time.Delay.MAX + 1, Time.Delay.MAX],
    ] as const;
    for (const [interval, normalized] of intervals) {
      it(`poll interval ${interval} → canonical timer duration ${normalized}`, async () => {
        using f = pollingFixture();
        f.run(() => false, { interval });
        await flushPolling();
        expect([...f.wakes.values()].map((wake) => wake.msecs)).to.eql([2000, normalized]);
      });
    }

    for (const timeout of [0, -0]) {
      it(`zero budget ${timeout} → no predicate, timer, or listener`, async () => {
        using f = pollingFixture();
        let calls = 0;
        const result = f.run(() => ++calls, { timeout });
        await flushPolling();
        expectTimeout(result.outcome);
        expect(calls).to.eql(0);
        expect(f.wakes.size).to.eql(0);
        expect(f.listeners.added).to.eql(0);
      });
    }

    it('fractional budget → ceil wake, early rearm, exact logical expiry', async () => {
      using f = pollingFixture();
      let calls = 0;
      const result = f.run(() => {
        calls++;
        return false;
      }, { timeout: 2.5, interval: 100 });
      await flushPolling();
      expect(f.wakes.get(1)?.msecs).to.eql(3);
      f.time = 2;
      f.fire(1);
      expect(f.wakes.get(3)?.msecs).to.eql(1);
      expect(result.outcome).to.eql(undefined);
      f.time = 2.5;
      f.fire(3);
      await flushPolling();
      expectTimeout(result.outcome);
      expect(calls).to.eql(1);
      expectReleased(f);
    });

    it('logical budget above host ceiling → multiple wakes without resetting the origin', async () => {
      using f = pollingFixture();
      f.time = 1_000_000;
      const options = { timeout: Time.Delay.MAX + 10.5, interval: Time.Delay.MAX };
      const result = f.run(() => false, options);
      await flushPolling();
      expect(f.wakes.get(1)?.msecs).to.eql(Time.Delay.MAX);
      f.time += Time.Delay.MAX;
      f.fire(1);
      expect(f.wakes.get(3)?.msecs).to.eql(11);
      f.time += 10.5;
      f.fire(3);
      await flushPolling();
      expectTimeout(result.outcome);
      expectReleased(f);
    });

    it('maximum safe budget → elapsed comparison avoids a rounded deadline sum', async () => {
      using f = pollingFixture();
      f.time = 2;
      const result = f.run(() => false, { timeout: Number.MAX_SAFE_INTEGER });
      await flushPolling();
      expect(f.wakes.get(1)?.msecs).to.eql(Time.Delay.MAX);
      // start + budget rounds down to this value; one logical millisecond still remains.
      f.time = Number.MAX_SAFE_INTEGER + 1;
      f.fire(1);
      await flushPolling();
      expect(result.outcome).to.eql(undefined);
      expect(f.wakes.get(3)?.msecs).to.eql(1);
      f.time += 2;
      f.fire(3);
      await flushPolling();
      expectTimeout(result.outcome);
      expectReleased(f);
    });
  });

  describe('predicate outcomes compete with observed authority', () => {
    for (const elapsed of [9, 10, 11]) {
      for (const fails of [false, true]) {
        it(`${fails ? 'rejection' : 'truthy value'} observed at ${elapsed}/10 ms with timer undelivered`, async () => {
          await using cleanup = new AsyncDisposableStack();
          const f = cleanup.use(pollingFixture());
          const pending = Promise.withResolvers<object>();
          cleanup.defer(async () => {
            pending.resolve({});
            await flushPolling();
          });
          const value = { original: true };
          const result = f.run(() => pending.promise, { timeout: 10 });
          f.time = elapsed;
          if (fails) pending.reject(value);
          else pending.resolve(value);
          await flushPolling();
          if (elapsed < 10) {
            const expected = fails ? { ok: false, error: value } : { ok: true, value };
            expect(result.outcome).to.eql(expected);
            if (result.outcome?.ok) expect(result.outcome.value).to.equal(value);
            if (result.outcome?.ok === false) expect(result.outcome.error).to.equal(value);
          } else expectTimeout(result.outcome);
          expectReleased(f);
        });
      }
    }

    for (const action of ['return', 'throw', 'then-getter'] as const) {
      it(`synchronous ${action} returns control after expiry → timeout`, async () => {
        using f = pollingFixture();
        const failure = new Error('predicate');
        const result = f.run(() => {
          if (action === 'then-getter') {
            return {
              get then() {
                f.time = 10;
                throw failure;
              },
            };
          }
          f.time = 10;
          if (action === 'throw') throw failure;
          return { value: true };
        }, { timeout: 10 });
        await flushPolling();
        expectTimeout(result.outcome);
        expectReleased(f);
      });
    }

    for (const failure of [new Error('predicate'), 'failure', undefined]) {
      it(`in-window synchronous failure preserves identity: ${String(failure)}`, async () => {
        using f = pollingFixture();
        const result = f.run(() => {
          throw failure;
        });
        await flushPolling();
        expect(result.outcome).to.eql({ ok: false, error: failure });
        if (result.outcome?.ok === false) expect(result.outcome.error).to.equal(failure);
        expectReleased(f);
      });
    }

    it('callback-triggered abort followed by throw → exact abort reason', async () => {
      using f = pollingFixture();
      const reason = { stop: true };
      const result = f.run(() => {
        f.ctrl.abort(reason);
        throw new Error('predicate');
      });
      await flushPolling();
      expect(result.outcome).to.eql({ ok: false, error: reason });
      if (result.outcome?.ok === false) expect(result.outcome.error).to.equal(reason);
      expectReleased(f);
    });

    it('wall-clock changes cannot alter the monotonic budget', async () => {
      using cleanup = new DisposableStack();
      const f = cleanup.use(pollingFixture());
      const descriptor = Object.getOwnPropertyDescriptor(Date, 'now')!;
      cleanup.defer(() => Object.defineProperty(Date, 'now', descriptor));
      let wall = -1e15;
      Object.defineProperty(Date, 'now', { configurable: true, value: () => wall });
      const result = f.run(() => false, { timeout: 10 });
      await flushPolling();
      wall = 1e15;
      f.time = 9;
      f.fire(1);
      expect(result.outcome).to.eql(undefined);
      wall = -1e15;
      f.time = 10;
      f.fire(3);
      await flushPolling();
      expectTimeout(result.outcome);
      expectReleased(f);
    });
  });

  describe('abort, deadline, and borrowed work', () => {
    for (const reason of [new Error('stop'), null, false, 0, 'stop']) {
      it(`pre-abort preserves reason ${String(reason)} without admission`, async () => {
        using f = pollingFixture();
        f.ctrl.abort(reason);
        let calls = 0;
        const result = f.run(() => ++calls, { timeout: 0 });
        await flushPolling();
        expect(result.outcome).to.eql({ ok: false, error: reason });
        if (result.outcome?.ok === false) expect(result.outcome.error).to.equal(reason);
        expect(calls).to.eql(0);
        expect(f.wakes.size).to.eql(0);
        expect(f.listeners.added).to.eql(0);
      });
    }

    for (const phase of ['predicate', 'sleep'] as const) {
      for (const terminal of ['abort', 'deadline'] as const) {
        const outcomes = phase === 'predicate' ? ['fulfill', 'reject'] : ['none'];
        for (const late of outcomes) {
          const label = phase === 'predicate'
            ? `${terminal} during predicate → settled before borrowed ${late}`
            : `${terminal} during sleep → releases both wakes`;
          it(label, async () => {
            await using cleanup = new AsyncDisposableStack();
            const f = cleanup.use(pollingFixture());
            const pending = Promise.withResolvers<boolean>();
            cleanup.defer(async () => {
              pending.resolve(true);
              await flushPolling();
            });
            let calls = 0;
            const result = f.run(() => {
              calls++;
              return phase === 'predicate' ? pending.promise : false;
            }, { timeout: 10 });
            await flushPolling();
            expect(f.wakes.size).to.eql(phase === 'predicate' ? 1 : 2);
            if (terminal === 'abort') f.ctrl.abort('stop');
            else {
              f.time = 10;
              f.fire(1);
            }
            await flushPolling();
            if (terminal === 'abort') expect(result.outcome).to.eql({ ok: false, error: 'stop' });
            else expectTimeout(result.outcome);
            const selected = result.outcome;
            expectReleased(f);
            expect(calls).to.eql(1);
            // Assert before fixture intervention; then release borrowed work to falsify late effects.
            if (late === 'reject') pending.reject(new Error('late failure'));
            else pending.resolve(true);
            f.ctrl.abort('late abort');
            await flushPolling();
            expect(result.outcome).to.equal(selected);
            expectReleased(f);
            expect(calls).to.eql(1);
          });
        }
      }
    }

    for (const first of ['abort', 'deadline'] as const) {
      it(`${first} observed first → selected outcome cannot be overwritten`, async () => {
        using f = pollingFixture();
        const result = f.run(() => false, { timeout: 10 });
        await flushPolling();
        f.time = 10;
        if (first === 'abort') f.ctrl.abort('stop');
        else {
          f.fire(1);
          f.ctrl.abort('stop');
        }
        await flushPolling();
        if (first === 'abort') expect(result.outcome).to.eql({ ok: false, error: 'stop' });
        else expectTimeout(result.outcome);
        expectReleased(f);
      });
    }

    it('abort state and expiry first observed together at wake → abort wins', async () => {
      using f = pollingFixture();
      const effects = { ...f.effects, listen: () => () => {} };
      const options = { timeout: 10, signal: f.ctrl.signal };
      const result = observeWaiter(createWaitFor(() => false, options, effects));
      await flushPolling();
      f.time = 10;
      f.ctrl.abort('stop'); // Suppress only notification, not actual signal state.
      f.fire(1);
      await flushPolling();
      expect(result.outcome).to.eql({ ok: false, error: 'stop' });
      expect(f.wakes.size).to.eql(0);
    });

    it('many false results → one listener, at most two timers, no overlapping predicates', async () => {
      using f = pollingFixture();
      let calls = 0;
      let running = 0;
      let peak = 0;
      const value = { done: true };
      const result = f.run(async () => {
        calls++;
        running++;
        peak = Math.max(peak, running);
        await Promise.resolve();
        running--;
        return calls === 200 ? value : false;
      }, { timeout: 1000, interval: 1 });
      for (let count = 1; count < 200; count++) {
        await flushPolling();
        expect(f.wakes.size).to.eql(2);
        expect(f.listeners).to.eql({ active: 1, added: 1, removed: 0, delivered: 0 });
        f.time++;
        f.fire(count + 1);
      }
      await flushPolling();
      expect(result.outcome).to.eql({ ok: true, value });
      expect(calls).to.eql(200);
      expect(peak).to.eql(1);
      expectReleased(f);
      const before = f.listeners.delivered;
      f.ctrl.signal.dispatchEvent(new Event('abort'));
      expect(f.listeners.delivered).to.eql(before);
    });
  });

  describe('acquisition and terminal release', () => {
    it('abort during wake acquisition → releases the late-assigned handle', async () => {
      using f = pollingFixture();
      let calls = 0;
      const result = observeWaiter(createWaitFor(() => ++calls, { signal: f.ctrl.signal }, {
        ...f.effects,
        wake(msecs, fn) {
          const release = f.effects.wake(msecs, fn);
          f.ctrl.abort('stop');
          return release;
        },
      }));
      await flushPolling();
      expect(result.outcome).to.eql({ ok: false, error: 'stop' });
      expect(calls).to.eql(0);
      expectReleased(f);
    });

    it('abort during listener acquisition → releases the late-assigned listener', async () => {
      using f = pollingFixture();
      let calls = 0;
      const result = observeWaiter(createWaitFor(() => ++calls, { signal: f.ctrl.signal }, {
        ...f.effects,
        listen(signal, fn) {
          f.ctrl.abort('stop');
          fn();
          return f.effects.listen(signal, fn);
        },
      }));
      await flushPolling();
      expect(result.outcome).to.eql({ ok: false, error: 'stop' });
      expect(calls).to.eql(0);
      expectReleased(f);
    });

    it('a release throws after releasing → still attempts every release', async () => {
      using f = pollingFixture();
      const result = observeWaiter(createWaitFor(() => false, { signal: f.ctrl.signal }, {
        ...f.effects,
        listen(signal, fn) {
          const release = f.effects.listen(signal, fn);
          return () => {
            release();
            throw new Error('teardown failure');
          };
        },
      }));
      await flushPolling();
      expect(f.wakes.size).to.eql(2);
      f.ctrl.abort('stop');
      await flushPolling();
      expect(result.outcome).to.eql({ ok: false, error: 'stop' });
      expectReleased(f);
    });

    for (const aborts of [false, true]) {
      it(`native listener registration throws after attachment${aborts ? ' and abort' : ''} → no retained listener`, async () => {
        const failure = new Error('registration failure');
        const probe = abortProbe({
          beforeAdd() {
            if (aborts) probe.ctrl.abort('stop');
          },
          afterAdd() {
            throw failure;
          },
        });
        using cleanup = new DisposableStack();
        cleanup.defer(() => probe.ctrl.abort());
        let calls = 0;
        const result = observeWaiter(Time.waitFor(() => ++calls, { signal: probe.ctrl.signal }));
        await flushPolling();
        // Recheck abort authority even when registration throws before notification.
        expect(result.outcome).to.eql({ ok: false, error: aborts ? 'stop' : failure });
        expect(calls).to.eql(0);
        expect(probe.added).to.eql(1);
        expect(probe.removed).to.eql(1);
        const before = probe.calls;
        probe.ctrl.signal.dispatchEvent(new Event('abort'));
        expect(probe.calls).to.eql(before);
      });
    }
  });
});

describe('Time.waitFor real-host capstone', () => {
  it('native deadline and abort settle pending predicates; late outcomes have no host error channel', async () => {
    for (const terminal of ['abort', 'deadline'] as const) {
      for (const late of ['fulfill', 'reject'] as const) {
        await using cleanup = new AsyncDisposableStack();
        const probe = abortProbe();
        const pending = Promise.withResolvers<object>();
        let calls = 0;
        let disposals = 0;
        const value = {
          dispose() {
            disposals++;
          },
        };
        const result = observeWaiter(Time.waitFor(() => {
          calls++;
          return pending.promise;
        }, { timeout: 20, signal: probe.ctrl.signal }));
        cleanup.defer(async () => {
          probe.ctrl.abort();
          pending.resolve(value);
          await result.completion;
          await Time.wait(0);
        });
        const watchdog = cleanup.adopt(
          Time.delay(1000, () => {
            throw new Error('fixture polling watchdog');
          }),
          (timer) => timer.cancel(),
        );
        if (terminal === 'abort') {
          // A synthetic event carries no aborted state and must not consume the real listener.
          probe.ctrl.signal.dispatchEvent(new Event('abort'));
          await flushPolling();
          expect(result.outcome).to.eql(undefined);
          probe.ctrl.abort('stop');
        }
        await Promise.race([result.completion, watchdog]);
        if (terminal === 'abort') expect(result.outcome).to.eql({ ok: false, error: 'stop' });
        else expectTimeout(result.outcome);
        const selected = result.outcome;
        expect(calls).to.eql(1);
        expect(probe.added).to.eql(1);
        expect(probe.removed).to.eql(1);
        const notifications = probe.calls;
        probe.ctrl.signal.dispatchEvent(new Event('abort'));
        expect(probe.calls).to.eql(notifications);
        // The waiter must already be settled and detached before borrowed work is released.
        if (late === 'reject') pending.reject(new Error('late caller failure'));
        else pending.resolve(value);
        await Time.wait(0);
        await Time.wait(0);
        expect(result.outcome).to.equal(selected);
        expect(calls).to.eql(1);
        expect(disposals).to.eql(0);
      }
    }
  });
});

function expectTimeout(outcome: unknown) {
  expect(outcome).to.have.property('ok', false);
  expect(outcome).to.have.nested.property('error.message', 'Time.waitFor: timeout exceeded');
}

function expectReleased(f: ReturnType<typeof pollingFixture>) {
  expect(f.wakes.size).to.eql(0);
  expect(f.listeners.active).to.eql(0);
  expect(f.listeners.removed).to.eql(f.listeners.added);
}
