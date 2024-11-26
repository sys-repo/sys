import { Semver } from '@sys/std/semver';
import { describe, expect, it, Testing } from '../-test.ts';
import { rx, slug } from '../mod.ts';
import { Fetch, Jsr, Url } from './mod.ts';

describe('Jsr', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
    expect(Jsr.Url).to.equal(Url);
  });

  describe('Jsr.Fetch.Pkg', () => {
    describe('Pkg.versions( name )', () => {
      it('200 - list', async () => {
        await Testing.retry(3, async () => {
          const name = '@sys/std';
          const res = await Fetch.Pkg.versions(name);
          expect(res.url).to.eql(`https://jsr.io/${name}/meta.json`);
          expect(res.status).to.eql(200);
          expect(res.error).to.eql(undefined);

          expect(res.data?.scope).to.eql('sys');
          expect(res.data?.name).to.eql('std');

          const versions = Object.keys(res.data?.versions ?? []);
          expect(versions).to.include('0.0.1');
          expect(versions).to.include('0.0.42');
          expect(Semver.Is.valid(res.data?.latest)).to.eql(true);
        });
      });

      it('404: module does not exist', async () => {
        await Testing.retry(3, async () => {
          const name = `@foo/${slug()}-${slug()}`;
          const res = await Fetch.Pkg.versions(name);
          expect(res.status).to.eql(404);
          expect(res.data).to.eql(undefined);
          expect(res.error?.name).to.eql('HttpError');
          expect(res.error?.cause?.message).to.include('404 Not Found');
        });
      });
    });

    describe('Pkg.info( name, version )', () => {
      it('200 - success', async () => {
        await Testing.retry(3, async () => {
          const name = '@sys/std';
          const version = '0.0.42';
          const res = await Fetch.Pkg.info(name, version);
          expect(res.status).to.eql(200);
          expect(res.error).to.eql(undefined);

          expect(res.data?.scope).to.eql('@sys');
          expect(res.data?.pkg.name).to.eql('@sys/std');
          expect(res.data?.pkg.version).to.eql(version);

          const manifest = res.data?.manifest ?? {};
          const paths = Object.keys(manifest);

          const assertExists = (path: string) => expect(paths.includes(path)).to.eql(true);
          assertExists('/README.md');
          assertExists('/src/mod.ts');
          assertExists('/src/pkg.ts');
          assertExists('/src/m.Immutable/t.ts');

          const mod = manifest['/src/mod.ts'];
          expect(mod.checksum.startsWith('sha256-')).to.eql(true);
          expect(typeof mod.size === 'number').to.eql(true);
        });
      });

      it('latest: version ommited', async () => {
        const name = '@sys/std';
        const latest = (await Fetch.Pkg.versions(name)).data?.latest;

        const res = await Fetch.Pkg.info(name);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);

        expect(res.data?.scope).to.eql('@sys');
        expect(res.data?.pkg.name).to.eql('@sys/std');
        expect(res.data?.pkg.version).to.eql(latest);
      });
    });

    it('dispose ← (cancel fetch operation)', async () => {
      const { dispose, dispose$ } = rx.disposable();
      const promise = Fetch.Pkg.versions('@sys/std', { dispose$ });
      dispose();

      const res = await promise;
      expect(res.status).to.eql(499);
      expect(res.data).to.eql(undefined);

      expect(res.error?.message).to.include('HTTP/GET request failed');
      expect(res.error?.message).to.include('https://jsr.io/@sys/std/meta.json');
      expect(res.error?.cause?.message).to.include('disposed of before completing (499)');
    });
  });

  describe('Jsr.Url', () => {
    it('origin (url)', () => {
      expect(Url.origin).to.eql('https://jsr.io');
    });

    it('Url.Pkg.metadata', () => {
      const url = Url.Pkg.metadata('@sys/std');
      expect(url).to.eql('https://jsr.io/@sys/std/meta.json');
    });

    it('Url.Pkg.version', () => {
      const url = Url.Pkg.version('@sys/std', '0.0.42');
      expect(url).to.eql('https://jsr.io/@sys/std/0.0.42_meta.json');
    });
  });
});
