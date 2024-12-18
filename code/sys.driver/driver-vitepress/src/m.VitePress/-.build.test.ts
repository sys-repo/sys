import { describe, expect, Fs, it, Testing } from '../-test.ts';
import { type t, HttpServer, Pkg, slug } from './common.ts';

import { SAMPLE } from './-u.ts';
import { VitePress } from './mod.ts';

describe('VitePress.build', () => {
  const assertDistFiles = (dist: t.DistPkg) => {
    const paths = Object.keys(dist.hash.parts ?? {});
    const pathsInclude = (start: t.StringPath) => paths.some((p) => p.startsWith(start));
    const expectPath = (start: t.StringPath) => expect(pathsInclude(start)).to.be.true;

    expectPath('./404.html');
    expectPath('./assets/-pkg.json'); // NB: digest-hash in `dist.json` includes {pkg.json} version.
    expectPath('./assets/chunks/');
    expectPath('./hashmap.json');
    expectPath('./index.html');
  };

  it('build (default params)', async () => {
    const pkg = { name: `@sample/${slug()}`, version: '0.1.2' };
    const sample = SAMPLE.init({ slug: true });
    const inDir = Fs.resolve(sample.path);
    const outDir = Fs.resolve(sample.path, 'dist');

    await VitePress.Env.update({ inDir });
    const res = await VitePress.build({ pkg, inDir, silent: false });

    expect(res.ok).to.eql(true);
    expect(res.dirs.in).to.eql(inDir);
    expect(res.dirs.out).to.eql(outDir);
    expect(res.dist.pkg).to.eql(pkg);
    expect(res.elapsed).to.be.greaterThan(0);
    expect(res.dist).to.eql((await Pkg.Dist.load(outDir)).dist); // NB: `dist.json` file emitted in build.
    assertDistFiles(res.dist);

    const port = Testing.randomPort();
    const app = HttpServer.create({ static: ['/*', res.dirs.out] });
    const server = Deno.serve({ port }, app.fetch);
    const fetched = await fetch(`http://localhost:${port}`);
    const text = await fetched.text();

    const assertHtml = (match: string) => expect(text.includes(match)).to.eql(true, match);
    assertHtml(`<title>👋 Hello World | Untitled</title>`);
    assertHtml(`Generated with <code>@sys/driver-vitepress@`);

    server.shutdown();
  });

  it('build: custom {outDir}', async () => {
    const pkg = SAMPLE.createPkg();
    const sample = SAMPLE.init({ slug: true });
    const inDir = Fs.resolve(sample.path);
    const outDir = Fs.resolve(sample.path, '.vitepress/dist');
    expect(await Fs.exists(outDir)).to.eql(false); // NB: clean initial condition.

    await VitePress.Env.update({ inDir });
    const res = await VitePress.build({ pkg, inDir, outDir, silent: true });

    expect(res.ok).to.eql(true);
    expect(res.dirs.in).to.eql(inDir);
    expect(res.dirs.out).to.eql(outDir);
    expect(res.dist).to.eql((await Pkg.Dist.load(outDir)).dist); // NB: `dist.json` file emitted in build.
    assertDistFiles(res.dist);
  });
});
