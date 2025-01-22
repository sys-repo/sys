import { c, describe, expect, it, slug } from '../-test.ts';
import { Jsr } from '../m.Jsr/mod.ts';
import { Fetch } from './common.ts';
import { Manifest } from './mod.ts';

export const SAMPLE = {
  pkg: { name: '@sys/std', version: '0.0.42' },
  def: {
    // NB: paths not-ordered.
    '/src/m.Path/mod.ts': {
      size: 261,
      checksum: 'sha256-03d38aeb62a14d34da9f576d12454537d4c6cedff0ad80d9ee4b9b8bb77702ba',
    },
    '/src/pkg.ts': {
      size: 241,
      checksum: 'sha256-b79790c447397a88ace8c538792fa37742ea38306cd08676947a2cd026b66269',
    },
    '/deno.json': {
      size: 830,
      checksum: 'sha256-dd9c3b367d8745aef1083b94982689dc7b39c75e16d8da66c78da6450166f3d5',
    },
  },
} as const;

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
      expect(m.paths).to.equal(m.paths); // NB: lazy-loaded and cached prop value.
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


    if (m) {
      // console.log('Object.keys(m)', Object.keys(m).sort().slice(0, 5));
      // console.log('m', m);
      // console.log('res.data?.manifest', res.data?.manifest);
    }
  });
});
