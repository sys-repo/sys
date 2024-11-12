import { describe, expect, it, Testing } from '../-test.ts';
import { type t, Fs, HttpServer, Pkg, slug, Time } from './common.ts';

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

      const res = await fetch(server.url);
      const html = await res.text();

      expect(res.status).to.eql(200);
      expect(html).to.include(`<script type="module"`);
      expect(html).to.include(`node_modules/.deno/vitepress@`);

      await server.dispose();
    });
  });

  describe('VitePress.build', () => {
    const assertDist = (dist: t.DistPkg) => {
      const paths = Object.keys(dist.hash.parts ?? {});
      const pathsInclude = (start: t.StringPath) => paths.some((p) => p.startsWith(start));
      const expectPath = (start: t.StringPath) => expect(pathsInclude(start)).to.be.true;

      expectPath('./404.html');
      expectPath('./assets/-pkg.json'); // NB: digest-hash in `dist.json` includes {pkg.json} version.
      expectPath('./assets/chunks/');
      expectPath('./hashmap.json');
      expectPath('./index.html');
    };

    it('sample-1 (default params)', async () => {
      const pkg = { name: `@sample/${slug()}`, version: '0.1.2' };
      const sample = await SAMPLE.setup({ slug: true });
      const inDir = Fs.resolve(sample.path);
      const outDir = Fs.resolve(sample.path, '.vitepress/dist');

      const res = await VitePress.build({ pkg, inDir, silent: false });

      expect(res.ok).to.eql(true);
      expect(res.dirs.in).to.eql(inDir);
      expect(res.dirs.out).to.eql(outDir);
      expect(res.dist.pkg).to.eql(pkg);
      expect(res.elapsed).to.be.greaterThan(0);
      expect(res.dist).to.eql((await Pkg.Dist.load(outDir)).dist); // NB: `dist.json` file emitted in build.
      assertDist(res.dist);

      const port = Testing.randomPort();
      const app = HttpServer.create();
      app.use('/*', HttpServer.static(res.dirs.out));

      const server = Deno.serve({ port }, app.fetch);
      const fetched = await fetch(`http://localhost:${port}`);
      const text = await fetched.text();

      const assertHtml = (match: string) => expect(text.includes(match)).to.be.true;
      assertHtml(`<title>Root | My Sample</title>`);
      assertHtml(`The root of <code>sample-1</code>`);

      server.shutdown();
    });

    it('sample-1: custom {outDir}', async () => {
      const pkg = { name: `@sample/${slug()}`, version: '0.1.2' };
      const sample = await SAMPLE.setup({ slug: true });
      const inDir = Fs.resolve(sample.path);
      const outDir = Fs.resolve(sample.path, '.vitepress/dist');
      expect(await Fs.exists(outDir)).to.eql(false); // NB: clean initial condition.

      const res = await VitePress.build({ pkg, inDir, outDir, silent: true });

      expect(res.ok).to.eql(true);
      expect(res.dirs.in).to.eql(inDir);
      expect(res.dirs.out).to.eql(outDir);
      expect(res.dist).to.eql((await Pkg.Dist.load(outDir)).dist); // NB: `dist.json` file emitted in build.
      assertDist(res.dist);
    });
  });
});
