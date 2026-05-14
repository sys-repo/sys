import { describe, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: Readonly', () => {
  describe('DeepReadonly<T>', () => {
    it('makes nested fields readonly', () => {
      type T = { foo: number; child: { bar: number } };
      type TReadOnly = t.DeepReadonly<T>;
      const obj: TReadOnly = { foo: 0, child: { bar: 0 } };

      /**
       * NB: without the "@ts-ignore" suppressions, the error checking proves the type.
       */

      // @ts-ignore: test
      obj.foo = 123;

      // @ts-ignore: test
      obj.child.bar = 456;
    });
  });

  describe('Mutable<T> | DeepMutable<T>', () => {
    it('makes nested fields mutable with DeepMutable<T>', () => {
      type T = { readonly foo: number; readonly child: { readonly bar: number } };
      type TMutable = t.DeepMutable<T>;

      const obj: TMutable = { foo: 0, child: { bar: 0 } };
      obj.foo = 123;
      obj.child = { bar: 123 };
      obj.child.bar = 456;
    });

    it('makes only top-level fields mutable with Mutable<T>', () => {
      type T = { readonly foo: number; readonly child: { readonly bar: number } };
      type TMutable = t.Mutable<T>;

      const obj: TMutable = { foo: 0, child: { bar: 0 } };

      // Top-level becomes writable:
      obj.foo = 123;
      obj.child = { bar: 123 };

      // Nested remains readonly (compile-time):
      // @ts-expect-error - shallow Mutable does not remove nested readonly
      obj.child.bar = 456;

      // Also verify type-level intent:
      type _ = [
        t.Type.Assert<t.Type.Equal<TMutable['foo'], number>>,
        t.Type.Assert<t.Type.Extends<TMutable, { foo: number; child: { readonly bar: number } }>>,
      ];
    });
  });
});
