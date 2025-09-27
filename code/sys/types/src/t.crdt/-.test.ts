import type { Crdt } from '@sys/types/crdt';
import { describe, expectTypeOf, it } from '../-test.ts';

describe(`types: general namespace`, () => {
  it('types: Ref (Doc)', () => {
    type D = { count: 0 };
    type Ref = Crdt.Ref<D>;

    let d1: Ref | undefined;

    // Compile-time type checks:
    expectTypeOf({} as Crdt.Ref<D>).toEqualTypeOf<Ref>();

    // Should fail if uncommented, because `string` ≠ Crdt.Ref<{ count: 0 }>
    // expectTypeOf('wrong').toEqualTypeOf<t.Crdt.Ref<{ count: 0 }>>();  });
  });
});
