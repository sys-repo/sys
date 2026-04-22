import { type t, c, describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { extractModulePreloadLinks } from './u.html.ts';
import { writeLocalFixtureImports } from './u.bridge.fixture.ts';
import { Vite } from '../mod.ts';

describe('Vite.build', () => {
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
    const fs = await SAMPLE.fs('Vite.build');
    const cwd = fs.join('fixture');
    await Fs.copy(sample, cwd);
    const restore = await writeLocalFixtureImports(cwd);

    try {
      const expectedPaths = {
        cwd,
        app: {
          entry: 'index.html',
          outDir: 'dist',
          base: './',
        },
      } as const;

      const res = await Vite.build({
        cwd,
        paths: expectedPaths,
        pkg,
        silent: true,
        spinner: false, // Test runner owns progress/logging; avoid long-lived spinner timers in tests.
        exitOnError: false, // Never terminate the whole test process on a transient build failure.
      });
      if (!res.ok) console.warn(res.toString());

      expect(res.ok).to.eql(true);
      expect(res.cmd.input).to.include('deno run');
      expect(res.cmd.input).to.include('--node-modules-dir');
      expect(res.cmd.input).to.include('npm:vite@');
      expect(res.elapsed).to.be.greaterThan(0);
      expect(res.paths).to.eql(expectedPaths);

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
      const entryPath = Object.keys(json.data?.hash.parts ?? {}).find((path) =>
        path.startsWith('pkg/-entry.'),
      );
      const entry = await readFile(Fs.join(outDir, entryPath ?? ''));

      return {
        res,
        paths,
        outDir,
        get files() {
          return { html, entry, json: { dist: json.data } } as const;
        },
      } as const;
    } finally {
      await restore();
    }
  };

  it('sample-1: simple', async () => {
    await Testing.retry(2, async () => {
      const { res, files, outDir } = await testBuild(SAMPLE.Dirs.sample1);
      if (VERBOSE) printHtml(files.html, 'sample-1', outDir);
      expect(files.html).to.include(`<title>Sample-1</title>`);
      expect(files.entry).to.include(`Hello World 👋`);
      expect(extractModulePreloadLinks(files.html).length).to.be.greaterThan(0);

      expect(res.dist).to.eql(files.json.dist);
      expect(res.dist.pkg).to.eql(pkg);
      expect(res.dist.build.size.total).to.be.greaterThan(100_000);
      const hashedEntry = Object.entries(res.dist.hash.parts).find(([path]) =>
        path.startsWith('pkg/-entry.'),
      )?.[1];
      expect(hashedEntry?.startsWith('sha256-')).to.eql(true);

      expect(Object.keys(res.dist.hash.parts)).to.not.include('sw.js'); // NB: not specified in vite.json (see: sample-3).
    });
  });

  it('sample-3: sw.js (service-worker)', async () => {
    await Testing.retry(2, async () => {
      const { res, files, outDir } = await testBuild(SAMPLE.Dirs.sample3);
      if (VERBOSE) printHtml(files.html, 'sample-3', outDir);
      expect(extractModulePreloadLinks(files.html).length).to.be.greaterThan(0);
      expect(Object.keys(res.dist.hash.parts)).to.include('sw.js');
    });
  });
});
