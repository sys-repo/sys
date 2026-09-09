import { type Crdt } from '@sys/crdt/am/t';
import { describe, expect, expectTypeOf, it, Pkg, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  describe('import API', () => {
    it('Crdt type exists (compile-time)', () => {
      type D = { count: 0 };
      type Ref = Crdt.Ref<D>;
      expectTypeOf({} as Crdt.Ref<D>).toEqualTypeOf<Ref>();
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
