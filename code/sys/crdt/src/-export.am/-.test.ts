import { type t as t3 } from '@sys/crdt/am/fs';
import { type Crdt as CrdtNamespace, type t as t0 } from '@sys/crdt/am/t';
import { type t as t1 } from '@sys/crdt/am/web';
import { type t as t2 } from '@sys/crdt/am/web/ui';

import { describe, expect, expectTypeOf, it, Pkg, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  describe('import API', () => {
    it('Crdt type exists (compile-time)', () => {
      type D = { count: 0 };
      type Ref = CrdtNamespace.Ref<D>;

      // Compile-time type checks:
      expectTypeOf({} as CrdtNamespace.Ref<D>).toEqualTypeOf<Ref>();

      expectTypeOf({} as t0.Crdt.Ref<D>).toEqualTypeOf<Ref>();
      expectTypeOf({} as t1.Crdt.Ref<D>).toEqualTypeOf<Ref>();
      expectTypeOf({} as t2.Crdt.Ref<D>).toEqualTypeOf<Ref>();
      expectTypeOf({} as t3.Crdt.Ref<D>).toEqualTypeOf<Ref>();
    });

    it('am/web', async () => {
      const m = await import('@sys/crdt/am/web');
      const driver = await import('@sys/driver-automerge/web');
      expect(m.Crdt).to.equal(driver.Crdt);
    });

    it('am/web/ui', async () => {
      const m = await import('@sys/crdt/am/web/ui');
      const driver = await import('@sys/driver-automerge/web/ui');
      expect(m.Crdt).to.equal(driver.Crdt);
    });

    it('am/fs', async () => {
      const m = await import('@sys/crdt/am/fs');
      const driver = await import('@sys/driver-automerge/fs');
      expect(m.Crdt).to.equal(driver.Crdt);
    });
  });
});
