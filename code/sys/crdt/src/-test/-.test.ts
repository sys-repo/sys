import type { Crdt } from '@sys/crdt/t';
import { describe, expectTypeOf, it } from './mod.ts';

describe(`types: general namespace`, () => {
  it('types: Ref (Doc)', () => {
    type D = { count: 0 };
    type Ref = Crdt.Ref<D>;

    let d1: Ref | undefined;

    // Compile-time type checks:
    expectTypeOf({} as Crdt.Ref<D>).toEqualTypeOf<Ref>();
  });
});
