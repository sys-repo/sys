import { describe, it, type t } from '../-test.ts';

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
});
