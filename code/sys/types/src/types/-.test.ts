import { describe, it } from '@std/testing/bdd';
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
});
