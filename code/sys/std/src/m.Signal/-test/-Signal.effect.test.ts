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
      console.info('value:', v);
    });

    expect(count).to.eql(1); // first run
    s.value = 1234;
    expect(count).to.eql(2);
  });

  it('effect(lifecycle): `e.dispose$` observable', () => {
    const s = Signal.create<number>(0);
    let count = 0;
    let disposeCount = 0;

    effect((e) => {
      s.value; // Hook into value.
      e.dispose$.subscribe(() => disposeCount++);
      count++;
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
});
