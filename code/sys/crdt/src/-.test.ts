import { describe, expect, it, Pkg, pkg } from './-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  describe('import API', () => {
    it('/ (default)', async () => {
      const defaults = {
        ui: await import('@sys/crdt/web/ui'),
        web: await import('@sys/crdt/web'),
        fs: await import('@sys/crdt/fs'),
      };
      const am = {
        ui: await import('@sys/crdt/am/web/ui'),
        web: await import('@sys/crdt/am/web'),
        fs: await import('@sys/crdt/am/fs'),
      };

      expect(defaults.ui).to.equal(am.ui);
      expect(defaults.web).to.equal(am.web);
      expect(defaults.fs).to.equal(am.fs);
    });
  });
});
