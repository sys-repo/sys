import { describe, expect, it, Pkg, pkg } from './-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  describe('API (exports)', () => {
    it('/web', async () => {
      const m = await import('@sys/crdt/web');
      const driver = await import('@sys/driver-automerge/web');
      expect(m.Crdt).to.equal(driver.Crdt);
    });

    it('/web/ui', async () => {
      const m = await import('@sys/crdt/web/ui');
      const driver = await import('@sys/driver-automerge/web/ui');
      expect(m.Crdt).to.equal(driver.Crdt);
    });

    it('/fs', async () => {
      const m = await import('@sys/crdt/fs');
      const driver = await import('@sys/driver-automerge/fs');
      expect(m.Crdt).to.equal(driver.Crdt);
    });
  });
});
