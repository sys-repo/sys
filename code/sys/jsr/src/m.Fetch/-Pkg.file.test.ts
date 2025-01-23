import { type t, c, Cli, describe, expect, Hash, it, rx, slug, Testing } from '../-test.ts';
import { assertFetchDisposed, SAMPLE } from './-u.ts';
import { Url } from './common.ts';
import { Fetch } from './mod.ts';

describe('Jsr.Fetch.Pkg.file', () => {
  const { name, version } = SAMPLE.pkg;

  const print = (res: t.JsrFetchPkgFileResponse, checksum: t.StringHash) => {
    const hx = Hash.sha256(res.data);
    const table = Cli.table([]);

    table.push([c.cyan(' status:'), c.bold(String(res.status))]);
    table.push([c.cyan(' url:'), c.green(res.url)]);
    table.push([c.cyan(' hash (manifest):'), checksum]);
    table.push([c.cyan(' hash (pulled):'), hx]);

    console.info(c.cyan(c.bold('Fetch.Pkg.file.path:')));
    console.info();
    console.info(table.toString().trim());
    console.info();
    console.info(c.italic(c.yellow(res.data ?? '(empty)')));
    console.info();
  };

  const testPull = async (path: keyof typeof SAMPLE.def, ...expectText: string[]) => {
    await Testing.retry(3, async () => {
      const res = await Fetch.Pkg.file(name, version).text(path);
      const hx = Hash.sha256(res.data);
      const def = SAMPLE.def[path];
      print(res, def.checksum);

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
    expect(typeof file.text).to.eql('function');
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

  describe('errors', () => {
    it('error: 404', async () => {
      const path = `/foo/404-${slug()}.ts`;
      const res = await Fetch.Pkg.file(name, version).text(path);
      expect(res.status).to.eql(404);
      expect(res.data).to.eql(undefined);
      expect(res.error?.cause?.message).to.include('404 Not Found');
    });

    describe('checksum', () => {
      const assertSuccess = (res: t.FetchResponse<unknown>) => {
        expect(res.ok).to.eql(true);
        expect(res.status).to.eql(200);
        expect(res.error).to.eql(undefined);
      };

      const assertChecksumFail = (res: t.FetchResponse<unknown>) => {
        const error = res.error?.cause;
        expect(res.ok).to.eql(false);
        expect(res.status).to.eql(412);
        expect(error?.message).to.include(`412:Pre-condition failed (checksum-mismatch)`);
        expect(error?.message).to.include(`does not match the expected checksum:`);
        expect(error?.message).to.include(res.checksum?.actual);
        expect(error?.message).to.include(res.checksum?.expected);
      };

      it('error: 412 ← checksum/hash mismatch', async () => {
        const path = '/src/pkg.ts';
        const def = SAMPLE.def[path];

        const checksum = def.checksum;
        const file = Fetch.Pkg.file(name, version);
        const resA = await file.text(path); // NB: default "control" (works).
        const resB = await file.text(path, { checksum: 'sha256-FAIL' });
        const resC = await file.text(path, { checksum });

        assertSuccess(resA);
        assertChecksumFail(resB);
        assertSuccess(resC);

        print(resB, 'sha256-FAIL');

        expect(resA.checksum).to.eql(undefined);
        expect(resC.checksum).to.eql({ valid: true, expected: checksum, actual: checksum });
      });
    });
  });

  describe('dispose ← (cancel fetch operation)', () => {
    const path = '/src/pkg.ts';

    it('dispose$: param on fetcher constructor', async () => {
      const { dispose, dispose$ } = rx.disposable();
      const file = Fetch.Pkg.file(name, version, { dispose$ });
      const promise = file.text(path);
      dispose();
      assertFetchDisposed(await promise);
    });

    it('dispose$: param on path fetch request', async () => {
      const { dispose, dispose$ } = rx.disposable();
      const file = Fetch.Pkg.file(name, version);
      const promise = file.text(path, { dispose$ });
      dispose();
      assertFetchDisposed(await promise);
    });
  });
});

it('dispose ← (cancel fetch operation)', async () => {
  const { dispose, dispose$ } = rx.disposable();
  const promise = Fetch.Pkg.versions('@sys/std', { dispose$ });

  dispose();
  const res = await promise;

  expect(res.error?.message).to.include('https://jsr.io/@sys/std/meta.json');
  assertFetchDisposed(res);
});
