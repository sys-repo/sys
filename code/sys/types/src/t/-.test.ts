import { describe, it } from '../-test.ts';
import type { t } from './common.ts';

describe('Types', () => {
  describe('DeepReadonly<T> | DeepMutable<T>', () => {
    it('make → Readonly', () => {
      type T = { foo: number; child: { bar: number } };
      type TReadOnly = t.DeepReadonly<T>;
      const obj: TReadOnly = { foo: 0, child: { bar: 0 } };

      /**
       * NB: without the "@ts-ignore" supressions, the error checking proves the type.
       */

      // @ts-ignore: test
      obj.foo = 123;

      // @ts-ignore: test
      obj.child.bar = 456;
    });
  });

  it('make → Mutable (not readonly)', () => {
    type T = { readonly foo: number; readonly child: { readonly bar: number } };
    type TMutable = t.DeepMutable<T>;
    const obj: TMutable = { foo: 0, child: { bar: 0 } };

    obj.foo = 123;
    obj.child = { bar: 123 };
    obj.child.bar = 456;
  });

  it('PkgName: scoped package name → "@scope/<name>"', () => {
    // @ts-ignore
    const a: t.StringScopedPkgName = 'foo'; // NB: Invalid.
    const b: t.StringScopedPkgName = '@sys/std';
    console.info();
    console.info('a (invalid):', a);
    console.info('b (valid):', b);
    console.info();
  });

  describe('WrapSignals<T>', () => {
    /**
     * Type-level helpers:
     */
    type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
      ? true
      : false;

    type Assert<T extends true> = T;

    describe('examples:', () => {
      /*
       * primitives become Signal<primitive>
       */
      type _p = Assert<Equal<t.WrapSignals<number>, t.Signal<number>>>;

      /*
       * array-as-leaf becomes t.Signal<Array>
       */
      type _path = Assert<Equal<t.WrapSignals<t.ObjectPath>, t.Signal<t.ObjectPath>>>;

      /*
       * tuples recurse element-wise (readonly)
       */
      type Tup = [number, 'hi'];
      type _tuple = Assert<Equal<t.WrapSignals<Tup>, Readonly<[t.Signal<number>, t.Signal<'hi'>]>>>;

      /*
       * functions pass straight through
       */
      type Fn = () => void;
      type _fn = Assert<Equal<t.WrapSignals<Fn>, Fn>>;

      /*
       * objects recurse property-wise (readonly)
       */
      type Obj = { a: string; b: number[] };
      type ExpectedObj = Readonly<{
        a: t.Signal<string>;
        b: t.Signal<number[]>;
      }>;
      type _obj = Assert<Equal<t.WrapSignals<Obj>, ExpectedObj>>;
    });
  });
});
