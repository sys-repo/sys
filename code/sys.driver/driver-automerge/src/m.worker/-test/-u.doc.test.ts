import { type t, describe, expectTypeOf, it } from '../../-test.ts';

describe('CrdtWorker.doc (shim)', () => {
  it('CrdtDocWorkerShim: structural typing', () => {
    type Doc = { foo: string };

    type Base = t.CrdtRef<Doc>;
    type Shim = t.CrdtDocWorkerShim<Doc>;

    // Runtime witness for the whole shim type.
    const value = {} as Shim;

    // Must behave as a normal CrdtRef<Doc>.
    expectTypeOf(value).toMatchTypeOf<Base>();

    // Runtime witness for the branding field.
    const via: Shim['via'] = 'worker-proxy';

    // And the branding flag must be exactly the literal 'worker-proxy'.
    expectTypeOf(via).toEqualTypeOf<'worker-proxy'>();
  });
});
