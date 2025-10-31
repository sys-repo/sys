import { type t, describe, expect, it } from '../../-test.ts';
import { Signal } from '../mod.ts';
import { effect } from '../u.effect.ts';

describe('Signal.effect', () => {
  it('API', () => {
    expect(Signal.effect).to.equal(effect);
  });

  it('basic reactivity', () => {
    const s = Signal.create<number>(0);

    let count = 0;
    Signal.effect(() => {
      const v = s.value;
      count++;
      console.info('signal value:', v);
    });

    expect(count).to.eql(1); // first run
    s.value = 1234;
    expect(count).to.eql(2);
  });

  describe('effect( lifecycle )', () => {
    it('lazy instance → stable return ', () => {
      const s = Signal.create<number>(0);

      let runs = 0;
      let disposeCount = 0;
      const lifeAtRun: Record<number, t.Abortable | undefined> = {};

      effect((e) => {
        // Establish reactive dep so the effect re-runs on change:
        s.value;
        runs += 1;

        // Intentionally do NOT touch e.life on the first run (lazy path).
        if (runs === 1) return;

        // From the second run onwards, access life and assert stability within the run:
        const life = e.life;
        lifeAtRun[runs] = life;

        // Stable identity on repeated getter access in the same run:
        const again = e.life;
        expect(again).to.equal(life);

        // Count disposals (will fire when this run is torn down on next change):
        life.dispose$.subscribe(() => disposeCount++);
      });

      // After initial mount: ran once, no lifecycle allocated yet.
      expect(runs).to.eql(1);
      expect(disposeCount).to.eql(0);
      expect(lifeAtRun[1]).to.eql(undefined);

      // Trigger first re-run: this creates the first lifecycle (for run #2).
      s.value = 1;
      expect(runs).to.eql(2);
      expect(disposeCount).to.eql(0); // previous run had no life → nothing to dispose
      expect(lifeAtRun[2]).to.not.eql(undefined);

      // Trigger second re-run: disposes run #2's life and creates a fresh one for run #3.
      s.value = 2;
      expect(runs).to.eql(3);
      expect(disposeCount).to.eql(1); // exactly one disposal (from run #2)

      // New run gets a new instance; identities differ across runs:
      expect(lifeAtRun[3]).to.not.equal(lifeAtRun[2]);

      // Sanity: a further change increments both counters appropriately.
      s.value = 3;
      expect(runs).to.eql(4);
      expect(disposeCount).to.eql(2);
    });

    it('`e.life.dispose$` observable', () => {
      const s = Signal.create<number>(0);
      let count = 0;
      let disposeCount = 0;

      effect((e) => {
        s.value; // Hook into value.
        count++;
        e.life.dispose$.subscribe(() => disposeCount++);
      });

      expect(count).to.eql(1); // first run
      expect(disposeCount).to.eql(0);
      s.value = 1234;
      expect(count).to.eql(2);
      expect(disposeCount).to.eql(1);

      s.value = 1;
      s.value = 2;
      s.value = 2; // NB: same value does not trigger effect re-run.
      s.value = 3;

      expect(count).to.eql(5);
      expect(disposeCount).to.eql(4);
    });

    it('`e.life.signal` (AbortController)', () => {
      const s = Signal.create<number>(0);
      let count = 0;
      let abortCount = 0;

      effect((e) => {
        s.value; // Hook into value.
        count++;
        e.life.signal.onabort = () => abortCount++;
      });

      expect(count).to.eql(1); // first run
      expect(abortCount).to.eql(0);
      s.value = 1234;
      expect(count).to.eql(2);
      expect(abortCount).to.eql(1);

      s.value = 4566;
      expect(count).to.eql(3);
      expect(abortCount).to.eql(2);
    });
  });
});
