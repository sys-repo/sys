import { type t, c, describe, expect, Fs, it, pkg, SAMPLE } from '../-test.ts';
import { Vite } from './mod.ts';

describe('Vite.build', () => {
  const { brightCyan: cyan, bold } = c;

  const printDist = (dist: t.DistPkg, paths: t.ViteConfigPaths) => {
    const entry = Fs.trimCwd(Fs.join(paths.cwd, paths.app.entry));
    const outDir = Fs.trimCwd(Fs.join(paths.cwd, paths.app.outDir));

    const fmtDist = c.bold(`${Fs.dirname(outDir)}/${c.white(Fs.basename(outDir))}`);
    const fmtEntry = `${Fs.dirname(entry)}/${c.white(c.bold(Fs.basename(entry)))}`;
    const io = (label: string) => cyan(bold(label));

    console.info(c.gray(`${io('input')}: ${fmtEntry}`));
    console.info(cyan('  ↓'));
    console.info(c.gray(`${io('output')}: Pkg.Dist.compute: ${cyan('→')} ${fmtDist}`));
    console.info(cyan('  ↓'));
    console.info(dist);
    console.info();
  };

  const printHtml = (html: string, title: string, dir: t.StringDir) => {
    const fmtTitle = title ? `(${title})` : '';
    console.info();
    console.info(c.brightCyan(`${c.bold('files.html')} ${fmtTitle}:`));
    console.info(c.gray(Fs.trimCwd(dir)), '\n');
    console.info(c.italic(html ? c.yellow(html) : c.red('  <empty>')));
    console.info();
  };

  const testBuild = async (sample: t.StringDir) => {
    const fs = SAMPLE.fs('Vite.build');
    await Fs.copy(sample, fs.dir);

    const cwd = fs.dir;
    const fromFile = await Vite.Config.fromFile(Fs.join(cwd, 'vite.config.ts'));

    const res = await Vite.build({ cwd, pkg });
    if (!res.ok) console.warn(res.toString());

    expect(res.ok).to.eql(true);
    expect(res.cmd.input).to.include('deno run');
    expect(res.cmd.input).to.include('--node-modules-dir npm:vite');
    expect(res.elapsed).to.be.greaterThan(0);
    expect(res.paths).to.eql(fromFile.paths);

    // Ensure the {pkg:name:version} data is included in the composite <digest> hash.
    const keys = Object.keys(res.dist.hash.parts);
    const hasPkg = keys.some((key) => key.startsWith('pkg/-pkg.json'));
    expect(hasPkg).to.eql(true);

    // Load file outputs.
    const readFile = async (path: string) => (await Fs.readText(path)).data ?? '';
    const { paths } = res;
    const outDir = Fs.join(paths.cwd, paths.app.outDir);
    const json = await Fs.readJson<t.DistPkg>(Fs.join(outDir, 'dist.json'));
    const html = await readFile(Fs.join(outDir, 'index.html'));
    const entry = await readFile(Fs.join(outDir, json.data?.entry ?? ''));

    return {
      res,
      paths,
      outDir,
      get files() {
        return { html, entry, json: { dist: json.data } } as const;
      },
    } as const;
  };

  it('sample-1: simple', async () => {
    const { res, files, outDir } = await testBuild(SAMPLE.Dirs.sample1);
    printHtml(files.html, 'sample-1', outDir);
    expect(files.html).to.include(`<title>Sample-1</title>`);
    expect(files.entry).to.include(`Hello World 👋`);

    expect(res.dist).to.eql(files.json.dist);
    expect(res.dist.pkg).to.eql(pkg);
    expect(res.dist.build.size.total).to.be.greaterThan(100_000);
    expect(res.dist.hash.parts[res.dist.entry].startsWith('sha256-')).to.eql(true);
  });

  it('sample-2: monorepo imports | Module-B  ←  Module-A', async () => {
    const { files, res, outDir } = await testBuild(SAMPLE.Dirs.sample2);
    printHtml(files.html, 'sample-2', outDir);
    printDist(res.dist, res.paths);

    expect(files.html).to.include(`<title>Sample-2</title>`);
    expect(files.html).to.include(`<script type="module" crossorigin src="./pkg/-entry.`);
    expect(res.dist.build.size.total).to.be.greaterThan(10_000);

    const filenames = Object.keys(files.json.dist?.hash.parts ?? []);
    const js = filenames.filter((p) => p.endsWith('.js'));
    expect(js.length).to.eql(3); // NB: the third ".js" file proves the code-splitting via dynamic import works.
  });
});
