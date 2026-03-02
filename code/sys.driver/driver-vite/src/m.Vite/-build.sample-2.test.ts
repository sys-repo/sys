import { type t, c, describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../-test.ts';
import { Vite } from './mod.ts';

describe('Vite.build (sample-2)', () => {
  const { brightCyan: cyan, bold } = c;
  const VERBOSE = false;

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

    const res = await Vite.build({
      cwd,
      pkg,
      silent: true,
      spinner: false,
      exitOnError: false,
    });
    if (!res.ok) console.warn(res.toString());

    expect(res.ok).to.eql(true);
    expect(res.paths).to.eql(fromFile.paths);

    const readFile = async (path: string) => (await Fs.readText(path)).data ?? '';
    const { paths } = res;
    const outDir = Fs.join(paths.cwd, paths.app.outDir);
    const json = await Fs.readJson<t.DistPkg>(Fs.join(outDir, 'dist.json'));
    const html = await readFile(Fs.join(outDir, 'index.html'));

    const files = Object.keys(json.data?.hash.parts ?? {});
    const jsFiles = files.filter((path) => path.endsWith('.js'));
    const jsText = await Promise.all(jsFiles.map((path) => readFile(Fs.join(outDir, path))));
    const hasSysAliasMarker = jsText.some((text) => text.includes('🧫 @sys/std'));

    return {
      res,
      outDir,
      get files() {
        return { html, json: { dist: json.data }, hasSysAliasMarker } as const;
      },
    } as const;
  };

  it('monorepo imports | Module-B  ←  Module-A', async () => {
    await Testing.retry(2, async () => {
      const { files, res, outDir } = await testBuild(SAMPLE.Dirs.sample2);
      if (VERBOSE) printHtml(files.html, 'sample-2', outDir);
      if (VERBOSE) printDist(res.dist, res.paths);

      expect(files.html).to.include(`<title>Sample-2</title>`);
      expect(files.html).to.include(`<script type="module" crossorigin src="./pkg/-entry.`);
      expect(res.dist.build.size.total).to.be.greaterThan(10_000);
      expect(files.hasSysAliasMarker).to.eql(true);

      const filenames = Object.keys(files.json.dist?.hash.parts ?? []);
      const js = filenames.filter((p) => p.endsWith('.js'));
      const entryJs = js.find((p) => p.startsWith('pkg/-entry.'));
      const nonEntryJs = js.filter((p) => p !== entryJs);
      const chunks = nonEntryJs.filter((p) => p.startsWith('pkg/m.'));
      expect(chunks.length).to.be.greaterThan(0);
    });
  });
});
