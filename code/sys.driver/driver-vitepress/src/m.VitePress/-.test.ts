import { type t, describe, expect, Fs, it, Pkg, Testing, Time } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { VitePress } from './mod.ts';

describe('Vitepress', () => {
  describe('VitePress.dev', () => {
    it('process: start → fetch(200) → dispose', async () => {
      const sample = await SAMPLE.setup();
      const { port, path } = sample;
      const server = await VitePress.dev({ port, path });
      expect(server.port).to.eql(port);
      expect(server.path).to.eql(path);

      await Testing.wait(1000); // NB: wait another moment for the vite-server to complete it's startup.
      console.info(); // NB: pad the output in the test-runner terminal. The "classic" Vite startup output.

      const controller = new AbortController();
      const { signal } = controller;
      const timeout = Time.delay(5000, () => {
        controller.abort();
        server?.dispose();
      });

      const res = await fetch(server.url, { signal });
      const html = await res.text();

      expect(res.status).to.eql(200);
      expect(html).to.include(`<script type="module"`);
      expect(html).to.include(`node_modules/.deno/vitepress@`);

      await server.dispose();
      timeout.cancel();
    });
  });

  describe('VitePress.build', () => {
    const pkg = { name: '@sample/vitepress-build', version: '0.1.2' };

    const assertDist = (dist: t.DistPkg) => {
      const paths = Object.keys(dist.hash.parts ?? {});
      const pathsInclude = (start: t.StringPath) => paths.some((p) => p.startsWith(start));
      const expectPath = (start: t.StringPath) => expect(pathsInclude(start)).to.be.true;

      expectPath('./404.html');
      expectPath('./assets/-pkg.json'); // NB: digest-hash in `dist.json` includes {pkg.json} version.
      expectPath('./assets/chunks/');
      expectPath('./hashmap.json');
      expectPath('./index.html');

      return paths;
    };

    it('sample-1 (default params)', async () => {
      const sample = await SAMPLE.setup({ slug: true });
      const dir = {
        in: Fs.resolve(sample.path),
        out: Fs.resolve(sample.path, '.vitepress/dist'),
      };

      expect(await Fs.exists(dir.out)).to.eql(false); // NB: clean initial condition.

      const inDir = dir.in;
      const res = await VitePress.build({ pkg, inDir, silent: false });

      expect(res.ok).to.eql(true);
      expect(res.dir).to.eql(dir);
      expect(res.dist).to.eql((await Pkg.Dist.load(dir.out)).dist); // NB: `dist.json` file emitted in build.
      assertDist(res.dist);

      /**
       * TODO 🐷
       */
    });

    it('sample-1: custom {outDir}', async () => {
      const sample = await SAMPLE.setup({ slug: false });
      const dir = {
        in: Fs.resolve(sample.path),
        out: Fs.resolve(sample.path, '-my-dist'),
      };
      expect(await Fs.exists(dir.out)).to.eql(false); // NB: clean initial condition.

      const inDir = dir.in;
      const outDir = dir.out;
      const res = await VitePress.build({ pkg, inDir, outDir, silent: false });

      expect(res.ok).to.eql(true);
      expect(res.dir).to.eql(dir);
      expect(res.dist).to.eql((await Pkg.Dist.load(dir.out)).dist); // NB: `dist.json` file emitted in build.
      assertDist(res.dist);
    });
  });
});
