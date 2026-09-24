import { describe, expect, it, type t } from '../../-test.ts';
import { Schedule } from '../../m.Async.Schedule/mod.ts';
import { runWorkerFixture } from '../../m.Async.Schedule/-test/u.fixture.worker.ts';
import { Is } from '../common.ts';
import { Time } from '../mod.ts';

type Queue = 'micro' | 'macro';

describe('Time.Delay callback settlement', () => {
  for (const queue of ['micro', 'macro'] as const) {
    it(`${queue}: asynchronous callback → joins completion and ignores its value`, async () => {
      const probe = abortProbe();
      const admitted = Promise.withResolvers<void>();
      const completion = Promise.withResolvers<void>();
      let callbackCompleted = false;
      const delay = start(queue, async () => {
        admitted.resolve();
        await completion.promise;
        callbackCompleted = true;
        return { ignored: true };
      }, probe.ctrl.signal);
      try {
        await admitted.promise;
        expect(delay.is).to.eql({ done: false, completed: false, cancelled: false });
        completion.resolve();
        expect(await delay).to.eql(undefined);
        expect(callbackCompleted).to.eql(true);
        expect(delay.is).to.eql({ done: true, completed: true, cancelled: false });
        expect(probe.added).to.eql(1);
        expect(probe.removed).to.eql(1);
        probe.ctrl.signal.dispatchEvent(new Event('abort'));
        expect(probe.calls).to.eql(0);
      } finally {
        completion.resolve();
        await delay;
      }
    });

    for (const action of ['cancel', 'abort'] as const) {
      it(`${queue}: ${action} during callback → waits for its outcome`, async () => {
        const ctrl = new AbortController();
        const admitted = Promise.withResolvers<void>();
        const completion = Promise.withResolvers<void>();
        let settled = false;
        const delay = start(queue, () => {
          admitted.resolve();
          return completion.promise;
        }, ctrl.signal);
        const observed = delay.then(() => settled = true);
        try {
          await admitted.promise;
          if (action === 'cancel') delay.cancel();
          else ctrl.abort();
          await Schedule.micro();
          expect(settled).to.eql(false);
          expect(delay.is).to.eql({ done: false, completed: false, cancelled: false });
          completion.resolve();
          await observed;
          delay.cancel();
          ctrl.abort();
          expect(delay.is).to.eql({ done: true, completed: true, cancelled: false });
        } finally {
          completion.resolve();
          await observed;
        }
      });

      it(`${queue}: callback requests ${action} → successful completion is not cancellation`, async () => {
        const ctrl = new AbortController();
        const delay = start(queue, () => {
          if (action === 'cancel') delay.cancel();
          else ctrl.abort();
          return 42;
        }, ctrl.signal);
        expect(await delay).to.eql(undefined);
        expect(delay.is).to.eql({ done: true, completed: true, cancelled: false });
      });
    }

    const outcomes = ['fulfill', 'reject', 'async-reject', 'cancel', 'abort', 'pre-abort'] as const;
    for (const outcome of outcomes) {
      it(`${queue}: ${outcome} → releases the abort listener`, async () => {
        const probe = abortProbe();
        const failure = new Error('callback failure');
        let callbackCalls = 0;
        if (outcome === 'pre-abort') probe.ctrl.abort();
        const delay = start(queue, () => {
          callbackCalls += 1;
          if (outcome === 'reject') throw failure;
          if (outcome === 'async-reject') return Promise.reject(failure);
        }, probe.ctrl.signal);
        const observed = delay.then(
          () => ({ rejected: false, error: undefined }),
          (error: unknown) => ({ rejected: true, error }),
        );
        if (outcome === 'cancel') {
          delay.cancel();
          delay.cancel();
        }
        if (outcome === 'abort') probe.ctrl.abort();
        const actual = await observed;
        expect(actual.rejected).to.eql(outcome === 'reject' || outcome === 'async-reject');
        if (actual.rejected) expect(actual.error).to.equal(failure);
        const cancelled = outcome === 'cancel' || outcome === 'abort' || outcome === 'pre-abort';
        expect(delay.is).to.eql({ done: true, completed: outcome === 'fulfill', cancelled });
        expect(probe.added).to.eql(outcome === 'pre-abort' ? 0 : 1);
        expect(probe.removed).to.eql(probe.added);
        // Dispatch even after pre-abort: no retained listener may run after settlement.
        probe.ctrl.signal.dispatchEvent(new Event('abort'));
        expect(probe.calls).to.eql(outcome === 'abort' ? 1 : 0);
        await Schedule.macro();
        expect(callbackCalls).to.eql(cancelled ? 0 : 1);
      });
    }
  }

  it('callback failures → only the caller-owned Promise rejects', async () => {
    const actual = await runWorkerFixture<{
      results: readonly {
        queue: string;
        outcome: string;
        rejected: boolean;
        originalFailure: boolean;
        is: t.Time.Delay.Handle['is'];
        hostErrors: number;
        hostRejections: number;
      }[];
      listenersDetached: boolean;
    }>(
      new URL('./u.fixture.delay.worker.ts', import.meta.url),
      'Time.Delay failure ownership',
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
      });
    }
    expect(actual.listenersDetached).to.eql(true);
  });
});

/** Exercise both canonical creation and its compatibility alias. */
function start(queue: Queue, callback: t.Time.Delay.Callback, signal?: AbortSignal) {
  return queue === 'micro'
    ? Time.Delay.create(callback, { signal })
    : Time.delay(0, callback, { signal });
}

/** Observe real listener attachment, removal, and delivery on one native signal. */
function abortProbe() {
  const ctrl = new AbortController();
  const signal = ctrl.signal;
  const add = signal.addEventListener.bind(signal);
  const remove = signal.removeEventListener.bind(signal);
  const listeners = new Map<EventListenerOrEventListenerObject, EventListener>();
  let added = 0;
  let removed = 0;
  let calls = 0;
  Object.defineProperties(signal, {
    addEventListener: {
      value: (...[type, listener, options]: Parameters<AbortSignal['addEventListener']>) => {
        if (type !== 'abort' || !listener) return add(type, listener, options);
        added += 1;
        const observed: EventListener = (event) => {
          calls += 1;
          if (Is.func(listener)) Reflect.apply(listener, signal, [event]);
          else listener.handleEvent(event);
        };
        listeners.set(listener, observed);
        add(type, observed, options);
      },
    },
    removeEventListener: {
      value: (...[type, listener, options]: Parameters<AbortSignal['removeEventListener']>) => {
        if (type !== 'abort' || !listener) return remove(type, listener, options);
        const observed = listeners.get(listener);
        if (observed) {
          removed += 1;
          listeners.delete(listener);
          remove(type, observed, options);
        }
      },
    },
  });
  return {
    ctrl,
    get added() {
      return added;
    },
    get removed() {
      return removed;
    },
    get calls() {
      return calls;
    },
  };
}
