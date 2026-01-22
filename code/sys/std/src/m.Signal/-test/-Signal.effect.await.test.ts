import { type t, describe, expect, it } from '../../-test.ts';
import { Signal } from '../mod.ts';
import { effect } from '../u.effect.ts';

describe('Signal.effect: async/await', () => {
  const tick = () => new Promise<void>((r) => setTimeout(r, 0));

  const trapUnhandled = () => {
    const errors: Error[] = [];

    const onUnhandled = (ev: PromiseRejectionEvent) => {
      ev.preventDefault();

      const reason = ev.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason));
      errors.push(err);
    };

    addEventListener('unhandledrejection', onUnhandled);
    return {
      errors,
      dispose() {
        removeEventListener('unhandledrejection', onUnhandled);
      },
    };
  };

  it('allocates a run lifecycle and keeps stable identity within the run', async () => {
    const s = Signal.create<number>(0);

    let runCount = 0;
    let lifeA: t.Abortable | undefined;
    let lifeB: t.Abortable | undefined;

    const stop = effect((e) => {
      s.value; // reactive dep
      runCount += 1;

      e.await(async () => {
        // no-op; just forces life to exist
      });

      lifeA = e.life;
      lifeB = e.life;
    });

    await tick();

    expect(runCount).to.eql(1);
    expect(lifeA).to.not.eql(undefined);
    expect(lifeB).to.equal(lifeA);

    stop();
  });

  it('suppresses async errors after abort (re-run)', async () => {
    const trap = trapUnhandled();
    try {
      const s = Signal.create<number>(0);
      let runs = 0;

      const stop = effect((e) => {
        s.value; // reactive dep
        runs += 1;

        // Run #1 schedules a failure, but we will abort it by forcing a re-run.
        if (runs === 1) {
          e.await(async () => {
            await tick();
            throw new Error('boom:aborted');
          });
        }
      });

      // Cause re-run → aborts run #1 life (created via e.await).
      s.value = 1;

      // Let scheduled async throw land.
      await tick();
      await tick();
      expect(trap.errors.length).to.eql(0);

      stop();
    } finally {
      trap.dispose();
    }
  });

  it('surfaces async errors when not aborted', async () => {
    const trap = trapUnhandled();
    try {
      const s = Signal.create<number>(0);
      const stop = effect((e) => {
        s.value; // reactive dep

        e.await(async () => {
          await tick();
          throw new Error('boom:live');
        });
      });

      await tick();
      await tick();

      expect(trap.errors.length).to.eql(1);
      expect(trap.errors[0].message).to.eql('boom:live');

      stop();
    } finally {
      trap.dispose();
    }
  });

  it('suppresses async errors after external dispose', async () => {
    const trap = trapUnhandled();
    try {
      const s = Signal.create<number>(0);

      const stop = effect((e) => {
        s.value; // reactive dep

        e.await(async () => {
          await tick();
          throw new Error('boom:disposed');
        });
      });

      // Dispose the whole effect before the task throws.
      stop();

      await tick();
      await tick();

      expect(trap.errors.length).to.eql(0);
    } finally {
      trap.dispose();
    }
  });

  it('multiple tasks in a run are all suppressed after abort', async () => {
    const trap = trapUnhandled();
    try {
      const s = Signal.create<number>(0);
      let runs = 0;

      const stop = effect((e) => {
        s.value; // reactive dep
        runs += 1;

        if (runs !== 1) return;

        e.await(async () => {
          await tick();
          throw new Error('boom:multi:1');
        });

        e.await(async () => {
          await tick();
          throw new Error('boom:multi:2');
        });
      });

      // Abort run #1 by forcing a re-run.
      s.value = 1;

      await tick();
      await tick();
      expect(trap.errors.length).to.eql(0);

      stop();
    } finally {
      trap.dispose();
    }
  });
});
