import { c, Cli, describe, expect, Hash, it, rx, Semver, slug, Testing } from '../-test.ts';
import { Jsr } from '../m.Jsr/mod.ts';
import { Url } from './common.ts';
import { Fetch } from './mod.ts';

describe('Jsr.Fetch', () => {
  const SAMPLE = {
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

  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
    expect(Fetch.Url).to.equal(Url);
  });

  describe('Fetch.Pkg', () => {
    describe('Pkg.versions( name )', () => {
      it('200 - list', async () => {
        await Testing.retry(3, async () => {
          const name = '@sys/std';
          const res = await Jsr.Fetch.Pkg.versions(name);
          expect(res.url).to.eql(`https://jsr.io/${name}/meta.json`);
          expect(res.status).to.eql(200);
          expect(res.error).to.eql(undefined);

          console.info();
          console.info(c.cyan(`Fetch.Pkg.${c.bold('versions')}:`), res);
          console.info();

          expect(res.data?.scope).to.eql('sys');
          expect(res.data?.name).to.eql('std');

          const versions = Semver.sort(Object.keys(res.data?.versions ?? []));
          expect(versions).to.include('0.0.1');
          expect(versions).to.include('0.0.42');
          expect(Semver.Is.valid(res.data?.latest)).to.eql(true);

          const max = 5;
          const title = c.cyan(`${c.bold('versions')} (latest ${max} of ${versions.length}):`);
          console.info(title, versions.slice(0, max));
          console.info();
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

          console.info();
          console.info(c.cyan(`Jsr.Fetch.Pkg.${c.bold('info')}:`), res);
          console.info();
        });
      });

      it('latest: version param ommited', async () => {
        const name = '@sys/std';
        const latest = (await Fetch.Pkg.versions(name)).data?.latest;

        const res = await Fetch.Pkg.info(name);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);

        expect(res.data?.pkg.name).to.eql('@sys/std');
        expect(res.data?.pkg.version).to.eql(latest);
      });
    });

    describe.only('Pkg.file( name, version ).path( "..." )', () => {
      const { name, version } = SAMPLE.pkg;

      const testPull = async (path: keyof typeof SAMPLE.def, ...expectText: string[]) => {
        await Testing.retry(3, async () => {
          const res = await Fetch.Pkg.file(name, version).path(path);
          const hx = Hash.sha256(res.data);
          const table = Cli.table([]);

          table.push([c.cyan(' url:'), c.green(res.url)]);
          table.push([c.cyan(' hash (manifest):'), SAMPLE.def[path].checksum]);
          table.push([c.cyan(' hash (pulled):'), hx]);

          console.info(c.cyan(c.bold('Fetch.Pkg.file.path:')));
          console.info();
          console.info(table.toString().trim());
          console.info();
          console.info(c.italic(res.data ?? '(empty)'));
          console.info();

          expect(res.status).to.eql(200);
          expect(res.error).to.eql(undefined);
          expect(res.url).to.eql(Url.Pkg.file(name, version, path));
          expect(hx).to.eql(SAMPLE.def[path].checksum);
          expectText.forEach((text) => {
            expect(res.data).to.include(text);
          });
        });
      };

      it('create', () => {
        const file = Fetch.Pkg.file(name, version);
        expect(file.pkg).to.eql({ name, version });
        expect(typeof file.path).to.eql('function');
      });

      it('pull: "/src/pkg.ts"', async () => {
        await testPull(
          '/src/pkg.ts',
          `import type { Pkg as TPkg } from 'jsr:@sys/types@^0.0.13';`,
          `export const pkg: TPkg = Pkg.fromJson(deno)`,
        );
      });

      it('pull: "/deno.json"', async () => {
        await testPull('/deno.json', `"name": "@sys/std"`);
      });

      it('pull: "/src/m.Path/mod.ts"', async () => {
        await testPull('/src/m.Path/mod.ts', 'export default Path;');
      });

      it('error: 404', async () => {
        const path = `/foo/404-${slug()}.ts`;
        const res = await Fetch.Pkg.file(name, version).path(path);
        expect(res.status).to.eql(404);
        expect(res.data).to.eql(undefined);
        expect(res.error?.cause?.message).to.include('404 Not Found');
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
      expect(res.error?.cause?.message).to.include('disposed before completing (499)');
    });
  });
});
