import { c, describe, expect, Fs, Hash, it, Pkg, SAMPLE, slug } from '../../-test.ts';
import { Jsr } from '../mod.ts';
import { Fetch } from './common.ts';
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

  describe('manifest.pull', () => {
    const baseUrl = Fetch.Url.Pkg.file(SAMPLE.pkg.name, SAMPLE.pkg.version, '');

    it('pull locally (in-memory only)', async () => {
      const manifest = Manifest.create(SAMPLE.pkg, SAMPLE.def);
      const res = await manifest.pull();

      expect(res.ok).to.eql(true);
      expect(res.files.length).to.eql(Object.keys(SAMPLE.def).length);
      expect(res.written).to.eql(undefined);

      for (const file of res.files) {
        expect(file.ok).to.eql(true);
        expect(file.status).to.eql(200);
        expect(file.error).to.eql(undefined);
        expect(file.checksum?.valid).to.eql(true);

        const path = file.url.slice(baseUrl.length - 1) as keyof typeof SAMPLE.def;
        const def = SAMPLE.def[path];
        expect(file.checksum?.actual).to.eql(def.checksum);
        expect(file.checksum?.expected).to.eql(def.checksum);
      }
    });

    it('pull locally → save (file-system: directory)', async () => {
      const sample = await SAMPLE.fs('Jsr.Manifest.pull', { slug: true }).init();
      expect(await sample.ls()).to.eql([]);

      const manifest = Manifest.create(SAMPLE.pkg, SAMPLE.def);
      const res = await manifest.pull(sample.dir);

      expect(res.written?.total.files).to.eql(Object.keys(SAMPLE.def).length);
      expect(res.written?.absolute).to.eql(Fs.join(sample.dir, Pkg.toString(SAMPLE.pkg)));
      expect(res.written?.relative).to.eql(Pkg.toString(SAMPLE.pkg));

      // Ensure hash/checksums match.
      for (const file of res.files) {
        const path = Fs.join(res.written?.absolute || '', file.url.slice(baseUrl.length));
        const data = await Deno.readFile(path);
        expect(Hash.sha256(data)).to.eql(file.checksum?.expected);
      }
    });

    it('pull locally → filter paths', async () => {
      const sample = await SAMPLE.fs('Jsr.Manifest.pull').init();
      expect(await sample.ls()).to.eql([]);

      const manifest = Manifest.create(SAMPLE.pkg, SAMPLE.def);
      const resA = await manifest.pull();
      const resB = await manifest.pull({ filter: (p) => p.endsWith('/pkg.ts') });

      expect(resA.files.length).to.eql(Object.keys(SAMPLE.def).length);
      expect(resB.files.length).to.eql(1);
      expect(resB.files[0].checksum?.actual).to.eql(SAMPLE.def['/src/pkg.ts'].checksum);
    });

    it('error: checksum fail', async () => {
      const path = '/src/pkg.ts';
      const def = {
        ...SAMPLE.def,
        [path]: { ...SAMPLE.def[path], checksum: 'sha256-FAIL' },
      };

      const manifest = Manifest.create(SAMPLE.pkg, def);
      const res = await manifest.pull();

      expect(res.ok).to.eql(false);
      expect(res.files.map((m) => m.status)).to.eql([200, 200, 412]);

      const failure = res.files.find((m) => m.status === 412);
      const error = failure?.error?.cause;
      expect(failure?.statusText).to.include('Pre-condition failed (checksum-mismatch)');
      expect(error?.message).to.include('412: Pre-condition failed (checksum-mismatch).');
    });
  });
});
