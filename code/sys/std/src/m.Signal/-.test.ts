import { describe, expect, it } from '../-test.ts';
import { Signal } from './mod.ts';

import * as Preact from '@preact/signals-core';

describe('Signal', () => {
  it('API', () => {
    expect(Signal.create).to.equal(Preact.signal);
    expect(Signal.effect).to.equal(Preact.effect);
  });

  describe('signal: update', () => {
    it('should create a signal with an initial value and update correctly', () => {
      const s = Signal.create(0);
      expect(s.value).to.eql(0);
      s.value = 42;
      expect(s.value).to.eql(42);
    });
  });

  describe('signal: effect (reactivity)', () => {
    it('should run the effect whenever the signal value changes', async () => {
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
  });

  describe('signal: computed', () => {
    it('should create a derived signal that updates based on dependencies', () => {
      const a = Signal.create(2);
      const b = Signal.create(3);
      const sum = Signal.computed(() => a.value + b.value);
      expect(sum.value).to.eql(5);

      b.value = 10;
      expect(sum.value).to.eql(12);
    });
  });

  describe('signal: batch (change)', () => {
    it('should group updates so that effects run only once', () => {
      let count = 0;
      const x = Signal.create(1);
      const y = Signal.create(2);

      Signal.effect(() => {
        count++;
        // NB: Access signals so this effect depends on them.
        x.value;
        y.value;
      });

      expect(count).to.eql(1);

      Signal.batch(() => {
        x.value = 10;
        y.value = 20;
      });

      // NB: Both updates happened in one batch, so the effect runs only once more.
      expect(count).to.equal(2);
    });
  });

  describe('Signal.toggle', () => {
    it('should toggle boolean', () => {
      const s = Signal.create(false);
      expect(s.value).to.eql(false);
      const res = Signal.toggle(s);
      expect(s.value).to.eql(true);
      expect(res).to.eql(true);
    });

    it('force: true', () => {
      const s = Signal.create(false);
      const res1 = Signal.toggle(s, true);
      const res2 = Signal.toggle(s, true);
      expect(res1).to.eql(true);
      expect(res2).to.eql(true);
      expect(s.value).to.eql(true);
    });

    it('force: false', () => {
      const s = Signal.create(true);
      const res1 = Signal.toggle(s, false);
      const res2 = Signal.toggle(s, false);
      expect(res1).to.eql(false);
      expect(res2).to.eql(false);
      expect(s.value).to.eql(false);
    });
  });
});
