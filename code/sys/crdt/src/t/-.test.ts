import { type t, describe, expectTypeOf, it, Pkg, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('types: general namespace', () => {
    type D = { count: 0 };
    type Ref = t.Crdt.Ref<D>;

    // Compile-time type checks:
    expectTypeOf({} as t.Crdt.Ref<D>).toEqualTypeOf<Ref>();

    // Should fail if uncommented, because `string` ≠ Crdt.Ref<{ count: 0 }>
    // expectTypeOf('wrong').toEqualTypeOf<t.Crdt.Ref<{ count: 0 }>>();  });
  });
});
