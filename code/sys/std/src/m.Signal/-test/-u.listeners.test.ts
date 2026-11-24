import { describe, expect, it, type t } from '../../-test.ts';
import { Rx } from '../common.ts';
import { Signal } from '../mod.ts';
import { listenersFixture } from './u.fixture.listeners.ts';

describe('Signal.listeners: registration ownership', () => {
  for (const mode of ['direct', 'external'] as const) {
    describe(`${mode} disposal`, () => {
      it('initial callback disposes → release the acquired effect', () => {
        using fixture = listenersFixture(mode);
        const { listeners, dispose } = fixture;
        const signal = Signal.create(0);
        let calls = 0;
        let cleanups = 0;
        let run: t.Abortable | undefined;

        const result = listeners.effect((e) => {
          signal.value;
          calls++;
          run = e.life;
          dispose();
          return () => void cleanups++;
        });

        expect(result).to.equal(listeners);
        expect(listeners.disposed).to.eql(true);
        expect(listeners.count).to.eql(0);
        expect(cleanups).to.eql(1);
        expect(run?.disposed).to.eql(true);
        expect(run?.signal.aborted).to.eql(true);

        signal.value++;
        dispose();
        expect(calls).to.eql(1);
        expect(cleanups).to.eql(1);
        expect(listeners.count).to.eql(0);
      });

      it('disposed → registration is a fluent no-op', () => {
        using fixture = listenersFixture(mode);
        const { listeners, dispose } = fixture;
        const signal = Signal.create(0);
        let calls = 0;

        dispose();
        const result = listeners.effect(() => {
          signal.value;
          calls++;
          throw new Error('A closed collection must not activate callbacks');
        });

        expect(result).to.equal(listeners);
        signal.value++;
        dispose();
        expect(calls).to.eql(0);
        expect(listeners.count).to.eql(0);
      });

      it('notification disposes → release all registered effects', () => {
        using fixture = listenersFixture(mode);
        const { listeners, dispose } = fixture;
        const trigger = Signal.create(false);
        const other = Signal.create(0);
        const calls = { trigger: 0, other: 0 };
        const cleanups = { trigger: 0, other: 0 };
        const runs: t.Abortable[] = [];

        listeners.effect((e) => {
          calls.trigger++;
          runs.push(e.life);
          if (trigger.value) dispose();
          return () => void cleanups.trigger++;
        }).effect((e) => {
          other.value;
          calls.other++;
          runs.push(e.life);
          return () => void cleanups.other++;
        });
        expect(listeners.count).to.eql(2);

        trigger.value = true;
        expect(listeners.disposed).to.eql(true);
        expect(listeners.count).to.eql(0);
        expect(calls).to.eql({ trigger: 2, other: 1 });
        expect(cleanups).to.eql({ trigger: 2, other: 1 });
        expect(runs.map((run) => run.signal.aborted)).to.eql([true, true, true]);

        trigger.value = false;
        other.value++;
        dispose();
        expect(calls).to.eql({ trigger: 2, other: 1 });
        expect(cleanups).to.eql({ trigger: 2, other: 1 });
      });

      it('cleanup reenters → registration stays closed and other callbacks stay silent', () => {
        using fixture = listenersFixture(mode);
        const { listeners, dispose } = fixture;
        const signal = Signal.create(0);
        const countsDuringCleanup: number[] = [];
        const cleanups = { reentrant: 0, other: 0 };
        let reentered: t.SignalListeners | undefined;
        let lateCalls = 0;
        let otherCalls = 0;

        listeners.effect(() => () => {
          cleanups.reentrant++;
          reentered = listeners.effect(() => {
            signal.value;
            lateCalls++;
          });
          countsDuringCleanup.push(listeners.count);
          dispose();
          // The other effect has not yet reached its own cleanup.
          signal.value++;
        });
        listeners.effect(() => {
          signal.value;
          otherCalls++;
          return () => void cleanups.other++;
        });

        dispose();
        // Observe inside cleanup, assert outside: Signal.effect contains cleanup errors.
        expect(reentered).to.equal(listeners);
        expect(countsDuringCleanup).to.eql([0]);
        expect(listeners.count).to.eql(0);
        expect(lateCalls).to.eql(0);
        expect(otherCalls).to.eql(1);
        expect(cleanups).to.eql({ reentrant: 1, other: 1 });

        signal.value++;
        dispose();
        expect(lateCalls).to.eql(0);
        expect(otherCalls).to.eql(1);
        expect(cleanups).to.eql({ reentrant: 1, other: 1 });
      });

      for (const phase of ['after registration', 'during activation'] as const) {
        it(`dependency teardown throws ${phase} → release remaining dependencies and cleanup`, () => {
          using fixture = listenersFixture(mode);
          const { listeners, dispose } = fixture;
          const detached = { throwing: 0, next: 0, other: 0 };
          const cleanups = { affected: 0, other: 0 };
          const calls = { affected: 0, other: 0 };
          const runs: t.Abortable[] = [];
          const countsDuringCleanup: number[] = [];
          const first = Signal.create(0, {
            unwatched() {
              detached.throwing++;
              throw new Error('detach failed');
            },
          });
          const next = Signal.create(0, {
            unwatched() {
              detached.next++;
            },
          });
          const other = Signal.create(0, {
            unwatched() {
              detached.other++;
            },
          });

          // Keep an unrelated registration live when the affected effect activates.
          listeners.effect((e) => {
            other.value;
            calls.other++;
            runs.push(e.life);
            return () => {
              cleanups.other++;
              countsDuringCleanup.push(listeners.count);
            };
          });
          listeners.effect((e) => {
            first.value;
            next.value;
            calls.affected++;
            runs.push(e.life);
            if (phase === 'during activation') dispose();
            return () => {
              cleanups.affected++;
              countsDuringCleanup.push(listeners.count);
            };
          });
          if (phase === 'after registration') dispose();

          // Assert before fixture teardown; callback silence alone cannot prove detachment.
          expect(listeners.disposed).to.eql(true);
          expect(listeners.count).to.eql(0);
          expect(detached).to.eql({ throwing: 1, next: 1, other: 1 });
          expect(cleanups).to.eql({ affected: 1, other: 1 });
          expect(countsDuringCleanup).to.eql([0, 0]);
          expect(runs.map((run) => run.disposed)).to.eql([true, true]);
          expect(runs.map((run) => run.signal.aborted)).to.eql([true, true]);

          first.value++;
          next.value++;
          other.value++;
          dispose();
          expect(calls).to.eql({ affected: 1, other: 1 });
          expect(detached).to.eql({ throwing: 1, next: 1, other: 1 });
          expect(cleanups).to.eql({ affected: 1, other: 1 });
          expect(listeners.count).to.eql(0);
        });
      }

      it('rerun cleanup disposes → do not activate the next callback', () => {
        using fixture = listenersFixture(mode);
        const { listeners, dispose } = fixture;
        const signal = Signal.create(0);
        let calls = 0;
        let cleanups = 0;

        listeners.effect(() => {
          signal.value;
          calls++;
          return () => {
            cleanups++;
            dispose();
          };
        });

        signal.value++;
        expect(listeners.disposed).to.eql(true);
        expect(listeners.count).to.eql(0);
        expect(calls).to.eql(1);
        expect(cleanups).to.eql(1);

        signal.value++;
        dispose();
        expect(calls).to.eql(1);
        expect(cleanups).to.eql(1);
      });

      it('initial callback disposes and queues a rerun → no later activation', () => {
        using fixture = listenersFixture(mode);
        const { listeners, dispose } = fixture;
        const signal = Signal.create(0);
        let calls = 0;
        let cleanups = 0;

        listeners.effect(() => {
          const value = signal.value;
          calls++;
          if (value === 0) {
            dispose();
            signal.value = 1;
          }
          return () => void cleanups++;
        });

        expect(calls).to.eql(1);
        expect(cleanups).to.eql(1);
        expect(listeners.count).to.eql(0);
        signal.value = 2;
        expect(calls).to.eql(1);
      });
    });
  }

  it('lifetime bridge teardown → remains live until collection observes disposal', () => {
    const signal = Signal.create(0);
    const states: { disposed: boolean; count: number }[] = [];
    const calls = { existing: 0, reentrant: 0 };
    const cleanups = { existing: 0, reentrant: 0 };
    const countsDuringCleanup: number[] = [];
    const until$ = new Rx.Observable<void>(() => () => {
      states.push({ disposed: listeners.disposed, count: listeners.count });
      listeners.effect(() => {
        signal.value;
        calls.reentrant++;
        return () => {
          cleanups.reentrant++;
          countsDuringCleanup.push(listeners.count);
        };
      });
      signal.value++;
      states.push({ disposed: listeners.disposed, count: listeners.count });
    });
    using listeners = Signal.listeners(until$);
    listeners.effect(() => {
      signal.value;
      calls.existing++;
      return () => {
        cleanups.existing++;
        countsDuringCleanup.push(listeners.count);
      };
    });

    listeners.dispose();
    expect(states).to.eql([
      { disposed: false, count: 1 },
      { disposed: false, count: 2 },
    ]);
    expect(calls).to.eql({ existing: 2, reentrant: 2 });
    expect(cleanups).to.eql({ existing: 2, reentrant: 2 });
    // Signal writes during bridge teardown rerun both effects before collection closure.
    expect(countsDuringCleanup).to.eql([2, 2, 0, 0]);
    expect(listeners.disposed).to.eql(true);
    expect(listeners.count).to.eql(0);

    signal.value++;
    listeners.dispose();
    expect(calls).to.eql({ existing: 2, reentrant: 2 });
    expect(cleanups).to.eql({ existing: 2, reentrant: 2 });
    expect(states).to.have.length(2);
  });

  it('failed activation → preserve the error and other live registrations', () => {
    using listeners = Signal.listeners();
    const live = Signal.create(0);
    const failed = Signal.create(0);
    const error = new Error('activation failed');
    let liveCalls = 0;
    let failedCalls = 0;
    let cleanups = 0;

    listeners.effect(() => {
      live.value;
      liveCalls++;
      return () => void cleanups++;
    });
    expect(() => {
      listeners.effect(() => {
        failed.value;
        failedCalls++;
        throw error;
      });
    }).to.throw(error);

    expect(listeners.disposed).to.eql(false);
    expect(listeners.count).to.eql(1);
    expect(cleanups).to.eql(0);
    failed.value++;
    live.value++;
    expect(failedCalls).to.eql(1);
    expect(liveCalls).to.eql(2);
    expect(cleanups).to.eql(1);

    expect(listeners.effect(() => {})).to.equal(listeners);
    expect(listeners.count).to.eql(2);
    listeners.dispose();
    expect(cleanups).to.eql(2);
    expect(listeners.count).to.eql(0);
  });
});
