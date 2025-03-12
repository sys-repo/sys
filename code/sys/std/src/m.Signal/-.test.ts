import { describe, expect, it } from '../-test.ts';
import { Signal } from './mod.ts';

import * as Preact from '@preact/signals-core';

describe('Signal', () => {
  it('API', () => {
    expect(Signal.create).to.equal(Preact.signal);
    expect(Signal.effect).to.equal(Preact.effect);
  });

  it('signal: should create a signal with an initial value and update correctly', () => {
    const s = Signal.create(0);
    expect(s.value).to.eql(0);
    s.value = 42;
    expect(s.value).to.eql(42);
  });

  it('effect: should run the effect whenever the signal value changes', async () => {
    let dummy = 0;
    const s = Signal.create(0);

    const stop = Signal.effect(() => {
      dummy = s.value;
    });

    expect(dummy).to.eql(0);
    s.value = 123;

    await Promise.resolve(); // NB: Wait for the effect to propagate.
    expect(dummy).to.eql(123);

    stop(); // NB: Stop the effect to release listener (dispose).
  });

  it('computed: should create a derived signal that updates based on dependencies', () => {
    const a = Preact.signal(2);
    const b = Preact.signal(3);
    const sum = Preact.computed(() => a.value + b.value);
    expect(sum.value).to.eql(5);

    b.value = 10;
    expect(sum.value).to.eql(12);
  });

  it('batch: should group updates so that effects run only once', () => {
    let count = 0;
    const x = Preact.signal(1);
    const y = Preact.signal(2);

    Preact.effect(() => {
      count++;

      // NB: Access signals so this effect depends on them.
      x.value;
      y.value;
    });

    expect(count).to.eql(1);

    Preact.batch(() => {
      x.value = 10;
      y.value = 20;
    });

    // NB: Both updates happened in one batch, so the effect runs only once more.
    expect(count).to.equal(2);
  });
});
