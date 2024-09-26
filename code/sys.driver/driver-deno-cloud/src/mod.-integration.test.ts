import { describe, expect, it, Pkg } from './common/mod.ts';
import { testSetup } from './u.Server/mod.-testSetup.ts';

describe('DenoCloud: HTTP Server Routes ← ClientLib', () => {
  describe('/ (root)', () => {
    it('/.info', async () => {
      const { client, dispose } = testSetup();

      const res = await client.info();
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);

      if (res.ok) {
        const data = res.data;
        expect(data.pkg).to.eql({ name: Pkg.name, version: Pkg.version });
      }

      await dispose();
    });
  });

  describe('/subhosting', () => {
    it('/subhosting.info', async () => {
      const { client, dispose } = testSetup();

      const res = await client.subhosting.info();
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);

      if (res.ok) {
        const data = res.data;
        expect(data.description).to.include('deno:subhosting™️');
        expect(data.pkg).to.eql({ name: Pkg.name, version: Pkg.version });
        expect(data.auth.identity).to.eql('');
        expect(data.auth.verified).to.eql(false);
      }

      await dispose();
    });

    it('/subhosting.orgs', async () => {
      const { client, dispose } = testSetup();

      const res = await client.subhosting.projects();
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);

      if (res.ok) {
        const data = res.data;
        expect(Array.isArray(data.projects)).to.be.true;
        if (data.projects.length > 0) {
          const project = data.projects[0];
          expect(project.id).to.be.string;
          expect(project.name).to.be.string;
          expect(project.description).to.be.string;
          expect(project.createdAt).to.be.string;
          expect(project.updatedAt).to.be.string;
        }
      }

      await dispose();
    });
  });
});
