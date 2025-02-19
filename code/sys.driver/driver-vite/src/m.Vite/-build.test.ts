import { type t, c, describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../-test.ts';
import { Vite } from './mod.ts';

describe('Vite.build', () => {
  const printDist = (input: t.StringPath, dist: t.DistPkg) => {
    const distfile = c.bold(c.white('./dist/dist.json'));
    console.info(c.gray(`input: ${Fs.trimCwd(input)}`));
    console.info(c.green(' ↓'));
    console.info(c.gray(`output: Pkg.Dist.compute → ${distfile}`));
    console.info(c.green(' ↓'));
    console.info(dist);
    console.info();
  };

  const printHtml = (html: string, title: string, dir: t.StringDir) => {
    const fmtTitle = title ? `(${title})` : '';
    console.info(c.brightCyan(`${c.bold('files.html')} ${fmtTitle}:`));
    console.info(c.gray(dir), '\n');
    console.info(c.italic(c.yellow(html)));
    console.info();
  };

  const testBuild = async (sample: t.StringDir) => {
    const fs = SAMPLE.fs('Vite.build');
    await Fs.copy(sample, fs.dir);

    const cwd = fs.dir;
    const res = await Vite.build({ cwd, pkg });
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
    const json = await Fs.readJson<t.DistPkg>(Fs.join(paths.outDir, 'dist.json'));
    const distJson = json.data;
    const html = await readFile(Fs.join(paths.outDir, 'index.html'));
    const entry = await readFile(Fs.join(paths.outDir, distJson?.entry ?? ''));

    return {
      res,
      paths,
      get files() {
        return { html, distJson, entry };
      },
    } as const;
  };

  it('sample-A: simple', async () => {
    const { res, files } = await testBuild(SAMPLE.dir.a);
    printHtml(files.html, 'sample-1', res.paths.outDir);
    expect(files.html).to.include(`<title>Sample-1</title>`);

    expect(res.dist).to.eql(files.distJson);
    expect(res.dist.pkg).to.eql(pkg);
    expect(res.dist.size.bytes).to.be.greaterThan(100_000);
    expect(res.dist.hash.parts[res.dist.entry].startsWith('sha256-')).to.eql(true);
  });

  it('sample-B: monorepo imports | Module-B  ←  Module-A', async () => {
    await Testing.retry(3, async () => {
      const { files, res } = await testBuild(SAMPLE.dir.b);
      printHtml(files.html, 'sample-2', res.paths.outDir);
      printDist(res.paths.input, res.dist);

      expect(files.html).to.include(`<title>Sample-2</title>`);
      expect(files.html).to.include(`<script type="module" crossorigin src="./pkg/-entry.`);

      const filenames = Object.keys(files.distJson?.hash.parts ?? []);
      const js = filenames.filter((p) => p.endsWith('.js'));
      expect(js.length).to.eql(3); // NB: the third ".js" file proves the code-splitting via dynamic import works.
    });
  });
});
