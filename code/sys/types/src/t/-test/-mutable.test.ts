import { describe, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: Mutability', () => {
  it('make → Mutable (not readonly)', () => {
    type T = { readonly foo: number; readonly child: { readonly bar: number } };
    type TMutable = t.DeepMutable<T>;
    const obj: TMutable = { foo: 0, child: { bar: 0 } };

    obj.foo = 123;
    obj.child = { bar: 123 };
    obj.child.bar = 456;
  });
});
