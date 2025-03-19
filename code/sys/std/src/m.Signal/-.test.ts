import { Time, describe, expect, it } from '../-test.ts';
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

    it('updates object', async () => {
      type T = { count: number };
      const initial = { count: 0 };
      const s = Signal.create<T>(initial);
      expect(s.value).to.eql(initial);
      expect(s.value).to.equal(initial); // NB: actual instance.

      let fired: T[] = [];
      const stop = Signal.effect(() => {
        fired.push(s.value);
      });
      expect(fired).to.eql([initial]);

      // Replace object.
      s.value = { count: 123 };

      await Time.wait();
      expect(fired.length).to.eql(2);
      expect(fired).to.eql([initial, { count: 123 }]);

      // Mutate object.
      s.value.count = 456;
      await Time.wait();

      expect(s.value).to.eql({ count: 456 });
      expect(fired).to.eql([initial, { count: 456 }]); // ⚠️ NB: the object value is NOT immutable.
      expect(fired.length).to.eql(2); // ...and no change event was fired.

      stop();
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

      await Time.wait(); // NB: Wait for the effect to propagate (micro-task queue, aka. "tick").
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

  describe('Signal.cycle', () => {
    type T = 'a' | 'b' | 'c';

    it('should cycle union [string] signal', () => {
      const s = Signal.create<T>('a');
      expect(s.value).to.eql('a');

      const values: T[] = ['a', 'b', 'c'];

      // Cycle from "a" to "b".
      const res1 = Signal.cycle(s, values);
      expect(res1).to.eql('b');
      expect(s.value).to.eql('b');

      // Cycle from "b" to "c".
      const res2 = Signal.cycle(s, values);
      expect(res2).to.eql('c');
      expect(s.value).to.eql('c');

      // Cycle from "c" back to "a".
      const res3 = Signal.cycle(s, values);
      expect(res3).to.eql('a');
      expect(s.value).to.eql('a');
    });

    it('should cycle [number] array', () => {
      const s = Signal.create<number>(1);
      expect(s.value).to.eql(1);

      const values: number[] = [1, 2, 3];

      // Cycle from 1 to 2.
      const res1 = Signal.cycle(s, values);
      expect(res1).to.eql(2);
      expect(s.value).to.eql(2);

      // Cycle from 2 to 3.
      const res2 = Signal.cycle(s, values);
      expect(res2).to.eql(3);
      expect(s.value).to.eql(3);

      // Cycle from 3 back to 1.
      const res3 = Signal.cycle(s, values);
      expect(res3).to.eql(1);
      expect(s.value).to.eql(1);
    });

    it('cycles from different initial value', () => {
      const s = Signal.create<T>('b');
      expect(s.value).to.eql('b');

      const values: T[] = ['a', 'b', 'c'];
      const res = Signal.cycle(s, values);
      expect(res).to.eql('c');
      expect(s.value).to.eql('c');
    });

    it('force value works', () => {
      const s = Signal.create<T>('a');
      expect(s.value).to.eql('a');

      const values: T[] = ['a', 'b', 'c'];

      // Force to "c"
      const res1 = Signal.cycle(s, values, 'c');
      expect(res1).to.eql('c');
      expect(s.value).to.eql('c');

      // Force to "b"
      const res2 = Signal.cycle(s, values, 'b');
      expect(res2).to.eql('b');
      expect(s.value).to.eql('b');
    });

    it('should default to first element if current value is not in values array', () => {
      const s = Signal.create('z');
      expect(s.value).to.eql('z');

      const values: T[] = ['a', 'b', 'c'];

      const res = Signal.cycle(s, values);
      expect(res).to.eql('a');
      expect(s.value).to.eql('a');
    });
  });
});
