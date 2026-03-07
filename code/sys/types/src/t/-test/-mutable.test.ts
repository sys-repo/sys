import { describe, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: Mutability', () => {
  it('make → DeepMutable (deep, not readonly)', () => {
    type T = { readonly foo: number; readonly child: { readonly bar: number } };
    type TMutable = t.DeepMutable<T>;

    const obj: TMutable = { foo: 0, child: { bar: 0 } };
    obj.foo = 123;
    obj.child = { bar: 123 };
    obj.child.bar = 456;
  });

  it('make → Mutable (shallow)', () => {
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
