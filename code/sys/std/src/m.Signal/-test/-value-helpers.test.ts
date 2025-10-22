import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Signal } from '../mod.ts';

describe('Signal', () => {
  describe('Signal.toggle', () => {
    it('toggle boolean', () => {
      const s = Signal.create(false);
      expect(s.value).to.eql(false);
      const res = Signal.toggle(s);
      expect(s.value).to.eql(true);
      expect(res).to.eql(true);
    });

    it('toggle boolean from <undefined>', () => {
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

    it('toggle from number', () => {
      const s = Signal.create<boolean | number | undefined>();
      expect(s.value).to.eql(undefined);

      expect(Signal.toggle(s)).to.eql(true);
      expect(s.value).to.eql(true);

      s.value = 0; // NB: falsey.
      expect(Signal.toggle(s)).to.eql(true);
      expect(s.value).to.eql(true);

      s.value = 1; // NB: truthy.
      expect(Signal.toggle(s)).to.eql(false);
      expect(s.value).to.eql(false);

      s.value = 99;
      expect(Signal.toggle(s)).to.eql(false);
      expect(s.value).to.eql(false);
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

    it('cycle union [string] signal', () => {
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

    it('default to first element if current value is not in values array', () => {
      const s = Signal.create('z');
      expect(s.value).to.eql('z');

      const values: T[] = ['a', 'b', 'c'];

      const res = Signal.cycle(s, values);
      expect(res).to.eql('a');
      expect(s.value).to.eql('a');
    });
  });

  describe('Signal.read', () => {
    it('returns the value when given a plain primitive', () => {
      const res = Signal.read(42);
      expect(res).to.equal(42);
      expectTypeOf(res).toEqualTypeOf<number>();
    });

    it('returns the value when given an object with a .value property', () => {
      const input = { value: 'hello' };
      const res = Signal.read(input);
      expect(res).to.equal('hello');
      expectTypeOf(res).toEqualTypeOf<string>();
    });

    it('returns the result of invoking a getter function', () => {
      const input = () => 'from getter';
      const res = Signal.read(input);
      expect(res).to.equal('from getter');
      expectTypeOf(res).toEqualTypeOf<string>();
    });

    it('returns undefined when given undefined', () => {
      const res = Signal.read(undefined);
      expect(res).to.equal(undefined);
      expectTypeOf(res).toEqualTypeOf<undefined>();
    });

    it('supports union overload: ReadableSignal<T> | undefined → T | undefined', () => {
      const maybeSignal: { value: number } | undefined =
        Math.random() > 0.5 ? { value: 123 } : undefined;
      const res = Signal.read(maybeSignal);
      expectTypeOf(res).toEqualTypeOf<number | undefined>();
    });

    it('handles nested signals gracefully', () => {
      const inner = { value: 99 };
      const outer = { value: inner };
      const res = Signal.read(outer);
      expect(res).to.eql(inner);
      expectTypeOf(res).toEqualTypeOf<{ value: number }>();
    });
  });
});
