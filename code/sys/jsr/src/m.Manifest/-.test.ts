import { c, describe, expect, it, SAMPLE, slug, Testing } from '../-test.ts';
import { Jsr } from '../m.Jsr/mod.ts';
import { Manifest } from './mod.ts';

describe('Jsr.Manifest (integration test)', () => {
  describe('Manifest.create', () => {
    it('unique instances: 200', () => {
      const m = Manifest.create(SAMPLE.pkg, SAMPLE.def);
      expect(m.pkg).to.eql(SAMPLE.pkg);
      expect(m.def).to.eql(SAMPLE.def);

      expect(m.pkg).to.not.equal(SAMPLE.pkg); // NB: different instance.
      expect(m.def).to.not.equal(SAMPLE.def);
    });

    it('paths (ordered)', () => {
      const m = Manifest.create(SAMPLE.pkg, SAMPLE.def);
      const unordered = Object.keys(SAMPLE.def);
      expect(m.paths).to.not.eql(unordered);
      expect(m.paths).to.eql(unordered.sort()); // NB: assert the function ensures a alpha-numeric sort on the paths.
      expect(m.paths).to.equal(m.paths); //        NB: lazy-loaded and cached prop value.
    });
  });

  describe('Manifest.fetch', () => {
    it('success', async () => {
      const { name, version } = SAMPLE.pkg;
      const res = await Manifest.fetch(name, version);
      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.error).to.eql(undefined);
      expect(res.origin).to.eql(Jsr.Fetch.Url.origin);

      if (!res.error) {
        // NB: type ensures manifest when no error.
        expect(res.manifest.pkg).to.eql(SAMPLE.pkg);
        expect(res.manifest.paths.includes('/deno.json')).to.be.true;
        expect(res.manifest.paths.includes('/src/common.ts')).to.be.true;
      }

      console.info();
      console.info(`T:${c.cyan('JsrManifestFetchResponse')}:`, res);
      console.info();
    });

    it('fail: error', async () => {
      const { version } = SAMPLE.pkg;
      const name = `@FAIL/FOO-${slug()}`;
      const res = await Manifest.fetch(name, version);
      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(404);
      expect(res.origin).to.eql(Jsr.Fetch.Url.origin);
      expect(res.manifest).to.eql(undefined);

      expect(res.error?.name).to.eql('HttpError');
      expect(res.error?.message).to.include('HTTP/GET request failed');
      expect(res.error?.message).to.include(`https://jsr.io/${name}`);

      console.info();
      console.info(`T:${c.cyan('JsrManifestFetchResponse')}:`, res);
      console.info();
    });
  });

  describe.only('manifest.pull', () => {
    it('pull locally (in-memory only)', async () => {
      await Testing.retry(3, async () => {
        const base = Fetch.Url.Pkg.file(SAMPLE.pkg.name, SAMPLE.pkg.version, '');
        const manifest = Manifest.create(SAMPLE.pkg, SAMPLE.def);
        const res = await manifest.pull();

        expect(res.ok).to.eql(true);
        expect(res.files.length).to.eql(Object.keys(SAMPLE.def).length);

        for (const file of res.files) {
          expect(file.ok).to.eql(true);
          expect(file.status).to.eql(200);
          expect(file.error).to.eql(undefined);
          expect(file.checksum?.valid).to.eql(true);

          const path = file.url.slice(base.length - 1) as keyof typeof SAMPLE.def;
          const def = SAMPLE.def[path];
          expect(file.checksum?.actual).to.eql(def.checksum);
          expect(file.checksum?.expected).to.eql(def.checksum);
        }
      });
    });


    if (m) {
      // console.log('Object.keys(m)', Object.keys(m).sort().slice(0, 5));
      // console.log('m', m);
      // console.log('res.data?.manifest', res.data?.manifest);
    }
  });
});
