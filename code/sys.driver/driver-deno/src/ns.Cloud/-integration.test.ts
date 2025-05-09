import { describe, expect, it, pkg, testSetup } from './-test.ts';

describe('DenoCloud: HTTP Server Routes ← ClientLib', () => {
  describe('/ (root)', () => {
    it('/.info', async () => {
      const { client, dispose } = testSetup();

      const res = await client.info();
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);

      if (res.ok) {
        const data = res.data;
        expect(data.pkg).to.eql({ name: pkg.name, version: pkg.version });
      }

      await dispose();
    });
  });
});
