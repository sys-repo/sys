import { describe, expect, it } from '../-test.ts';
import { Signal } from './mod.ts';

describe('suite', () => {
  it('signal: should create a signal with an initial value and update correctly', () => {
    const s = Signal.signal(0);
    expect(s.value).to.eql(0);
    s.value = 42;
    expect(s.value).to.eql(42);
  });

  it('effect: should run the effect whenever the signal value changes', async () => {
    let dummy = 0;
    const s = Signal.signal(0);

    // Register an effect that assigns the signal value to dummy.
    const stop = Signal.effect(() => {
      dummy = s.value;
    });

    expect(dummy).to.eql(0);
    s.value = 123;

    // Wait for the effect to propagate.
    await Promise.resolve();
    expect(dummy).to.eql(123);

    // Stop the effect to clean up.
    stop();
  });
});
