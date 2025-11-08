import { describe } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: Signals', () => {
  describe('WrapSignals<T>', () => {
    /**
     * Type-level helpers:
     */
    type Equal<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

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
