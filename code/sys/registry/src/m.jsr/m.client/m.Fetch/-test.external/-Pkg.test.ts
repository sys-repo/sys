import { c, describe, expect, it, Rx, Semver, slug, Testing } from '../../../-test.ts';
import { assertFetchDisposed } from '../-u.ts';
import { Fetch } from '../mod.ts';
import { Jsr } from '../../m.Jsr/mod.ts';
import { Fmt } from './u.fmt.ts';

describe('Jsr.Fetch.Pkg (external)', () => {
  describe('Pkg.versions( name )', () => {
    it('200 - list', async () => {
      await Testing.retry(3, async () => {
        const name = '@sys/std';
        const res = await Jsr.Fetch.Pkg.versions(name);
        expect(res.url).to.eql(`https://jsr.io/${name}/meta.json`);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);

        expect(res.data?.scope).to.eql('sys');
        expect(res.data?.name).to.eql('std');

        const versions = Semver.sort(Object.keys(res.data?.versions ?? []));
        expect(versions).to.include('0.0.1');
        expect(versions).to.include('0.0.42');
        expect(Semver.Is.valid(res.data?.latest)).to.eql(true);

        Fmt.printExternalObject('Jsr.Fetch.Pkg.versions:', {
          ok: res.ok,
          status: res.status,
          url: res.url,
          data: {
            scope: res.data?.scope,
            name: res.data?.name,
            latest: res.data?.latest,
            versions: versions.length,
          },
          error: res.error,
        });

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
        const name = '@sys/fs';
        const version = '0.0.42';
        const res = await Fetch.Pkg.info(name, version);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);

        expect(res.data?.pkg.name).to.eql('@sys/fs');
        expect(res.data?.pkg.version).to.eql(version);

        const manifest = res.data?.manifest ?? {};
        const paths = Object.keys(manifest);

        const assertExists = (path: string) => expect(paths.includes(path)).to.eql(true);
        assertExists('/README.md');
        assertExists('/src/mod.ts');
        assertExists('/src/pkg.ts');
        assertExists('/src/m.Fs/mod.ts');

        const mod = manifest['/src/mod.ts'];
        expect(mod.checksum.startsWith('sha256-')).to.eql(true);
        expect(typeof mod.size === 'number').to.eql(true);
        expect([undefined, 1, 2].includes(res.data?.graph?.format)).to.eql(true);
        expect(Array.isArray(res.data?.graph?.modules ?? [])).to.eql(true);

        Fmt.printExternalObject('Jsr.Fetch.Pkg.info:', {
          ok: res.ok,
          status: res.status,
          url: res.url,
          data: {
            pkg: res.data?.pkg,
            manifest: Object.keys(res.data?.manifest ?? {}).length,
            exports: Object.keys(res.data?.exports ?? {}).length,
            graph: {
              format: res.data?.graph?.format,
              modules: res.data?.graph?.modules.length ?? 0,
            },
          },
          error: res.error,
        });

        const modules = res.data?.graph?.modules ?? [];
        const max = 5;
        const title = c.cyan(`${c.bold('graph modules')} (first ${max} of ${modules.length}):`);
        console.info(title, modules.slice(0, max).map((module) => ({
          path: module.path,
          dependencies: module.dependencies.length,
        })));
        const deps = modules
          .flatMap((module) => module.dependencies.map((dep) => dep.specifier))
          .filter((specifier, index, items) => items.indexOf(specifier) === index)
          .sort((a, b) => a.localeCompare(b));
        const rel = deps.filter((specifier) => specifier.startsWith('./') || specifier.startsWith('../'));
        const jsr = deps.filter((specifier) => specifier.startsWith('jsr:'));
        const npm = deps.filter((specifier) => specifier.startsWith('npm:'));
        const preview = (items: readonly string[]) => {
          const shown = items.slice(0, 5);
          const more = items.length - shown.length;
          const lines = shown.length === 0 ? ['  - []'] : shown.map((item) => `  - ${c.green(JSON.stringify(item))}`);
          if (more > 0) lines.push(`  ${c.gray(c.italic(`${more} more`))}`);
          return lines.join('\n');
        };
        console.info(c.cyan(c.bold('graph dependency specifiers') + ':'));
        console.info('  paths:');
        console.info(preview(rel));
        console.info('  jsr:');
        console.info(preview(jsr));
        console.info('  npm:');
        console.info(preview(npm));
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

  it('dispose ← (cancel fetch operation)', async () => {
    const { dispose, dispose$ } = Rx.disposable();
    const promise = Fetch.Pkg.versions('@sys/std', { dispose$ });

    dispose();
    const res = await promise;

    expect(res.error?.message).to.include('https://jsr.io/@sys/std/meta.json');
    assertFetchDisposed(res);
  });
});
