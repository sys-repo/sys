import { describe, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: Depth', () => {
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
});
