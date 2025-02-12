import { type t, c, describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../-test.ts';
import { Vite } from './mod.ts';

describe('Vite.build', () => {
  const printDist = (input: t.StringPath, dist: t.DistPkg) => {
    const distfile = c.bold(c.white('./dist/dist.json'));
    console.info();
    console.info(c.green(`input: ${input}`));
    console.info(c.green(' ↓'));
    console.info(c.green(`output: Pkg.Dist.compute → ${distfile}`));
    console.info();
    console.info(dist);
    console.info();
  };

  const printHtml = (html: string, title: string) => {
    const fmtTitle = title ? `(${title})` : '';
    console.info();
    console.info(c.brightCyan(`${c.bold('files.html')} ${fmtTitle}:\n`));
    console.info(c.italic(c.yellow(html)));
    console.info();
  };

  const testBuild = async (input: t.StringPath) => {
    const fs = SAMPLE.fs('Vite.build');
    const outDir = fs.dir;
    const res = await Vite.build({ pkg, input, outDir });
    const { paths } = res;

    expect(res.ok).to.eql(true);
    expect(res.cmd.input).to.include('deno run');
    expect(res.cmd.input).to.include('--node-modules-dir npm:vite');
    expect(res.elapsed).to.be.greaterThan(0);

    // Ensure the {pkg:name:version} data is included in the composite <digest> hash.
    const keys = Object.keys(res.dist.hash.parts);
    const hasPkg = keys.some((key) => key.startsWith('pkg/-pkg.json'));

    expect(hasPkg).to.eql(true);

    // Load file outputs.
    const readFile = async (path: string) => (await Fs.readText(path)).data ?? '';
    const json = await Fs.readJson<t.DistPkg>(Fs.join(outDir, 'dist.json'));
    const distJson = json.data;
    const html = await readFile(Fs.join(outDir, 'index.html'));
    const entry = await readFile(Fs.join(outDir, distJson?.entry ?? ''));

    return {
      input,
      files: { html, distJson, entry },
      paths,
      res,
    } as const;
  };

  it('sample-1: simple', async () => {
    await Testing.retry(3, async () => {
      const input = SAMPLE.Input.sample1;
      const { res, files } = await testBuild(input);

      expect(files.html).to.include(`<title>Sample-1</title>`);

      expect(res.dist).to.eql(files.distJson);
      expect(res.dist.pkg).to.eql(pkg);
      expect(res.dist.size.bytes).to.be.greaterThan(100_000);
      expect(res.dist.hash.parts[res.dist.entry].startsWith('sha256-')).to.eql(true);

      printDist(input, res.dist);
      printHtml(files.html, 'sample-1');
    });
  });

  it('sample-2: monorepo imports | Module-B  ←  Module-A', async () => {
    await Testing.retry(3, async () => {
      const input = SAMPLE.Input.sample2;
      const { res, files } = await testBuild(input);
      expect(files.html).to.include(`<title>Sample-2</title>`);
      expect(files.html).to.include(`<script type="module" crossorigin src="./pkg/-entry.`);
      expect(files.html).to.include(`<link rel="modulepreload" crossorigin href="./pkg/`);
      printDist(input, res.dist);

      printHtml(files.html, 'sample-2');
    });
  });

  it('sample-3: main.ts entry point', async () => {
    await Testing.retry(3, async () => {
      const input = SAMPLE.Input.sample3;
      const { files } = await testBuild(input);
      expect(files.entry).to.includes('console.info("main.ts")');
    });
  });
});
