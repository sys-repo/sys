import { Time, describe, expect, it } from '../-test.ts';
import { Signal } from './mod.ts';
import { rx } from '../m.Rx/mod.ts';
import { Is } from './m.Is.ts';

import * as Preact from '@preact/signals-core';

describe('Signal', () => {
  it('API', () => {
    expect(Signal.create).to.equal(Preact.signal);
    expect(Signal.effect).to.equal(Preact.effect);
    expect(Signal.Is).to.equal(Is);
  });

  describe('Core "Signal" API', () => {
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
        expect(fired).to.eql([initial, { count: 456 }]); // ⚠️ NB: the object IS NOT immutable.
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
  });

  describe('value helpers', () => {
    describe('Signal.toggle', () => {
      it('should toggle boolean', () => {
        const s = Signal.create(false);
        expect(s.value).to.eql(false);
        const res = Signal.toggle(s);
        expect(s.value).to.eql(true);
        expect(res).to.eql(true);
      });

      it('should toggle boolean from <undefined>', () => {
        const s = Signal.create<boolean | undefined>();
        expect(s.value).to.eql(undefined);
        const res = Signal.toggle(s);
        expect(s.value).to.eql(true);
        expect(res).to.eql(true);
        Signal.toggle(s);
        expect(s.value).to.eql(false);
        Signal.toggle(s);
        expect(s.value).to.eql(true);
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

      it('cycles [number] array', () => {
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

      it('cycles array of arrays (1)', () => {
        type V = string | number;
        const s = Signal.create<V[] | undefined>();
        expect(s.value).to.eql(undefined);

        const values: V[][] = [
          [1, 2],
          [3, 4],
          ['1fr', 100, 'auto'],
        ];

        const res = Signal.cycle(s, values);
        expect(res).to.eql([1, 2]);
        expect(s.value).to.eql([1, 2]);

        Signal.cycle(s, values);
        expect(s.value).to.eql([3, 4]);

        Signal.cycle(s, values);
        expect(s.value).to.eql(['1fr', 100, 'auto']);
      });

      it('cycle array of arrays (2)', () => {
        type V = string | number;
        type T = V | V[] | undefined;
        const s = Signal.create<T>();
        const values = [undefined, 0, 10, [50, 15], ['1fr', 100, 'auto']];

        const test = (expected: T) => {
          Signal.cycle(s, values);
          expect(s.value).to.eql(expected);
        };

        test(0);
        test(10);
        test([50, 15]);
        test(['1fr', 100, 'auto']);
        test(undefined);
      });

      it('cycles from <undefined>', () => {
        const s = Signal.create<T | undefined>();
        expect(s.value).to.eql(undefined);

        const values: (T | undefined)[] = [undefined, 'a', 'b'];
        const res = Signal.cycle(s, values);
        expect(res).to.eql('a');
        expect(s.value).to.eql('a');

        Signal.cycle(s, values);
        expect(s.value).to.eql('b');

        Signal.cycle(s, values);
        expect(s.value).to.eql(undefined);

        Signal.cycle(s, values);
        expect(s.value).to.eql('a');
      });

      it('cycles from different initial value', () => {
        const s = Signal.create<T>('b');
        expect(s.value).to.eql('b');

        const values: T[] = ['a', 'b', 'c'];
        const res = Signal.cycle(s, values);
        expect(res).to.eql('c');
        expect(s.value).to.eql('c');
      });

      it('cycles from <undefined> initial value', () => {
        const s = Signal.create<T>();
        expect(s.value).to.eql(undefined);

        const values: T[] = ['a', 'b', 'c'];
        const res1 = Signal.cycle<T>(s, values);
        expect(res1).to.eql('a');
        expect(s.value).to.eql('a');

        Signal.cycle<T>(s, values);
        Signal.cycle<T>(s, values);
        expect(s.value).to.eql('c');
        Signal.cycle<T>(s, values);
        expect(s.value).to.eql('a');

        // Edge-case: no values specified → returns <undefined>.
        s.value = undefined;
        const res2 = Signal.cycle<T>(s, []);
        expect(res2).to.eql(undefined);
        expect(s.value).to.eql(undefined);
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

  describe('Listeners', () => {
    it('create → <change> → dispose', () => {
      const life = rx.disposable();
      const a = Signal.listeners();
      const b = Signal.listeners(life);

      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(false);

      expect(a.count).to.eql(0);
      expect(b.count).to.eql(0);

      const signal = Signal.create(0);
      const fired = { a: 0, b: 0 };
      const resA = a.effect(() => {
        signal.value;
        fired.a++;
      });
      const resB = b.effect(() => {
        signal.value;
        fired.b++;
      });

      expect(resA.count).to.eql(1);
      expect(resB.count).to.eql(1);

      expect(fired).to.eql({ a: 1, b: 1 }); // NB: initial run.
      signal.value++;
      expect(fired).to.eql({ a: 2, b: 2 });

      life.dispose();
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(true);
      expect(b.count).to.eql(0);

      signal.value++;
      expect(fired).to.eql({ a: 3, b: 2 });

      a.dispose();
      signal.value++;
      expect(fired).to.eql({ a: 3, b: 2 }); // NB: no change.

      expect(a.disposed).to.eql(true);
      expect(b.disposed).to.eql(true);
      expect(a.count).to.eql(0);
      expect(b.count).to.eql(0);
    });
  });

  describe('Signal.Is', () => {
    const Is = Signal.Is;

    it('Is.signal', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => expect(Is.signal(value)).to.be.false);

      const count = Signal.create(0);
      expect(Is.signal(count)).to.be.true;
    });
  });

  describe('Signal.toObject', () => {
    const s = Signal.create;
    const toObject = Signal.toObject;

    /**
     * Pass‑through for primitives (no wrapping, no cloning).
     */
    it('returns primitives unchanged', () => {
      expect(toObject(42)).to.eql(42);
      expect(toObject('foo')).to.eql('foo');
      expect(toObject(true)).to.eql(true);
      expect(toObject(null)).to.eql(null);
      expect(toObject(undefined)).to.eql(undefined);
    });

    /**
     * Unwraps a single `Signal` to its `.value`.
     */
    it('unwraps a lone signal', () => {
      const num = s(123);
      expect(toObject(num)).to.eql(123);
    });

    /**
     * Handles arrays, tuples, and deeply nested objects.
     */
    it('unwraps signals at any depth', () => {
      const input = {
        a: s(1),
        b: {
          c: s('x'),
          d: [s(true), 5] as const,
        },
        e: [1, s(2)],
      };

      const result = toObject(input);

      expect(result).to.deep.eql({
        a: 1,
        b: { c: 'x', d: [true, 5] },
        e: [1, 2],
      });
    });

    /**
     * Leaves functions and other non‑signal values intact.
     */
    it('preserves function references', () => {
      const fn = () => 'hi';
      const obj = { fn, val: s(10) };

      const out = toObject(obj);

      expect(out.fn).to.eql(fn); //  Same reference.
      expect(out.val).to.eql(10); // signal unwrapped
    });

    /**
     * toObject is snapshot‑style: it never mutates the input
     * and returns wholly new container objects.
     */
    it('does not mutate the original structure', () => {
      const src = { nested: { x: s(7) } };
      const snap = toObject(src);

      expect(snap).to.not.equal(src); //                ← top‑level object copy.
      expect(snap.nested).to.not.equal(src.nested); //  ← deep copy.
      expect(snap.nested.x).to.equal(7);
    });
  });
});
