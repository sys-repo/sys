import { type t, c, describe, expect, Fs, it, Json, pkg, SAMPLE, Testing } from '../../-test.ts';
import { writeLocalFixtureImports } from './u.bridge.fixture.ts';
import { Vite } from '../mod.ts';

describe('Vite.build (workspace composition)', () => {
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
    const cwd = Fs.resolve('./.tmp/test/Vite.build.workspace-composition/fixture');
    await Fs.remove(Fs.dirname(cwd), { log: false });
    await Fs.ensureDir(Fs.dirname(cwd));
    await Fs.copy(sample, cwd);
    const configPath = Fs.join(cwd, 'vite.config.ts');
    const originalConfig = (await Fs.readText(configPath)).data ?? '';
    const workspace = Fs.resolve('../../../deno.json').replaceAll('\\', '/');
    await Fs.write(
      configPath,
      originalConfig.replace(
        'Vite.Config.app({ paths })',
        `Vite.Config.app({ paths, workspace: ${Json.stringify(workspace)} })`,
      ),
    );
    const restore = await writeLocalFixtureImports(cwd);

    try {
      const expectedPaths = {
        cwd,
        app: {
          entry: 'src/-entry/index.html',
          outDir: 'dist',
          base: './',
        },
      } as const;

      const res = await Vite.build({
        cwd,
        paths: expectedPaths,
        pkg,
        silent: true,
        spinner: false,
        exitOnError: false,
      });
      if (!res.ok) console.warn(res.toString());

      expect(res.ok).to.eql(true);
      expect(res.paths).to.eql(expectedPaths);

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
    } finally {
      await restore();
      await Fs.write(configPath, originalConfig);
      await Fs.remove(Fs.dirname(cwd), { log: false });
    }
  };

  it('monorepo imports → split bundled workspace modules', async () => {
    // Owned transport boundary guard:
    // remote package sources must keep canonical ids and TS handling intact
    // through rollup/vite build for monorepo-style module composition.
    await Testing.retry(2, async () => {
      const { files, res, outDir } = await testBuild(SAMPLE.Dirs.sample2);
      if (VERBOSE) printHtml(files.html, 'workspace composition', outDir);
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
