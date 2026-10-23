import { Hash } from '@sys/crypto/hash';
import {
  c,
  Cli,
  describe,
  expect,
  Fs,
  HashFmt,
  it,
  Obj,
  Path,
  Pkg,
  pkg,
  SAMPLE,
  stripAnsi,
  type t,
  Testing,
} from '../../-test.ts';
import { extractModulePreloadLinks } from './u.html.ts';
import { hasExplicitResourceManagementSyntax } from './u.syntax.ts';
import { Vite } from '../mod.ts';

describe('Vite.build', () => {
  const { brightCyan: cyan, bold } = c;
  const VERBOSE = false;

  const printDist = (dist: t.DistPkg, paths: t.ViteConfig.Paths) => {
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

  const testBuild = async (
    sample: t.StringDir,
    outputKind: 'relative' | 'absolute',
    base = './',
  ) => {
    // These fixtures exercise the repository workspace, not an isolated consumer declaration.
    const fs = await SAMPLE.fs('Vite.build', { location: 'local-temp' });
    const cwd = fs.join('fixture');

    try {
      await Fs.copy(sample, cwd);
      const expectedOutput = outputKind === 'relative' ? 'dist' : fs.join('output');
      const expectedOutputAbsolute = Fs.resolve(cwd, expectedOutput);
      const expectedPaths = {
        cwd,
        app: {
          entry: 'index.html',
          outDir: expectedOutput,
          base,
        },
      } as const;
      const callerPaths = { cwd: expectedPaths.cwd, app: { ...expectedPaths.app } };
      const mutatedDuringBuild = fs.join('mutated-during-build');
      const mutatedAfterBuild = fs.join('mutated-after-build');

      const pending = Vite.build({
        dependencyPolicy: 'frozen-cache',
        cwd,
        paths: callerPaths,
        pkg,
        silent: true,
        spinner: false, // Test runner owns progress/logging; avoid long-lived spinner timers in tests.
        exitOnError: false, // Never terminate the whole test process on a transient build failure.
      });
      callerPaths.app.outDir = mutatedDuringBuild;
      callerPaths.app.base = 'https://mutated.example.test/during/';
      const res = await pending;
      callerPaths.app.outDir = mutatedAfterBuild;
      callerPaths.app.base = 'https://mutated.example.test/after/';
      if (!res.ok) console.warn(res.toString());

      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error(res.toString());
      expect(res.cmd.input).to.include('deno run');
      expect(res.cmd.input).to.include('--frozen');
      expect(res.cmd.input).to.include('--cached-only');
      expect(res.cmd.input).to.include('--node-modules-dir');
      expect(res.cmd.input).to.include('npm:vite@');
      expect(res.cmd.input).to.include(`--outDir=${expectedOutputAbsolute}`);
      expect(res.elapsed).to.be.greaterThan(0);
      expect(res.paths).to.eql(expectedPaths);
      expect(res.paths).not.to.equal(callerPaths);
      expect(res.paths.app).not.to.equal(callerPaths.app);
      expect(Object.isFrozen(res.paths)).to.eql(true);
      expect(Object.isFrozen(res.paths.app)).to.eql(true);
      expect(await Fs.exists(mutatedDuringBuild)).to.eql(false);
      expect(await Fs.exists(mutatedAfterBuild)).to.eql(false);
      expectBounded(res.toString({ width: 56 }), 56);

      // Embedded package declaration bytes are payload, unlike the root manifest labels.
      expect(Obj.hasOwn(res.dist.hash.parts, 'pkg/-pkg.json')).to.eql(true);
      expect((await Fs.readJson(Fs.join(expectedOutputAbsolute, 'pkg/-pkg.json'))).data).to.eql(
        pkg,
      );

      // Load file outputs.
      const readFile = async (path: string) => (await Fs.readText(path)).data ?? '';
      const { paths } = res;
      const outDir = Fs.resolve(paths.cwd, paths.app.outDir);
      const distPath = Fs.join(outDir, 'dist.json');
      const manifestUrl = Path.toFileUrl(distPath);
      const digest = HashFmt.digest(res.dist.hash.digest);
      const output = res.toString({ width: 500 });
      expect(stripAnsi(output)).not.to.include('Bundle failed');
      expect(stripAnsi(output)).to.include('out:');
      expect(output).to.include(Cli.Fmt.hyperlink('dist.json', manifestUrl, { underline: true }));
      expect(output).to.not.include(Cli.Fmt.hyperlink(digest, manifestUrl, { underline: true }));
      const json = await Fs.readJson<t.DistPkg>(distPath);
      const manifest = await Fs.read(distPath);
      const html = await readFile(Fs.join(outDir, 'index.html'));
      expect(manifest.data).to.not.eql(undefined);
      expect(res.manifestChecksum).to.eql(Hash.sha256(manifest.data));
      expect(res.pin).to.eql({
        scheme: 'sys.dist/v2',
        digest: Hash.sha256(Pkg.Dist.Content.encode(res.dist.hash.parts)),
      });
      const verified = await Pkg.Dist.Pinned.verify({
        dir: await Fs.realPath(outDir),
        pin: res.pin,
        limits: {
          manifestBytes: 16 * 1024 * 1024,
          entries: 8192,
          fileBytes: 128 * 1024 * 1024,
          totalBytes: 1024 * 1024 * 1024,
        },
      });
      expect(verified.kind).to.eql('verified');
      const entryPath = Object.keys(json.data?.hash.parts ?? {}).find((path) =>
        path.startsWith('pkg/-entry.')
      );
      const entry = await readFile(Fs.join(outDir, entryPath ?? ''));
      // Capture output facts while the owned fixture is still alive.
      const javascript = await Promise.all(
        Object.keys(res.dist.hash.parts)
          .filter((path) => path.endsWith('.js'))
          .map((path) => readFile(Fs.join(outDir, path))),
      );
      if (VERBOSE) printDist(res.dist, paths);

      return {
        res,
        paths,
        outDir,
        get files() {
          return { html, entry, javascript, json: { dist: json.data } } as const;
        },
      } as const;
    } finally {
      await Fs.remove(fs.dir, { log: false });
    }
  };

  it('sample-1: simple with absolute output authority', async () => {
    await Testing.retry(2, async () => {
      const { res, files, outDir } = await testBuild(SAMPLE.Dirs.sample1, 'absolute');
      if (VERBOSE) printHtml(files.html, 'sample-1', outDir);
      expect(files.html).to.include(`<title>Sample-1</title>`);
      expect(files.entry).to.include(`Hello World 👋`);
      expect(extractModulePreloadLinks(files.html).length).to.be.greaterThan(0);

      expect(res.dist).to.eql(files.json.dist);
      expect(res.dist.pkg).to.eql(pkg);
      expect(res.dist.build.size.total).to.be.greaterThan(100_000);
      const hashedEntry = Object.entries(res.dist.hash.parts).find(([path]) =>
        path.startsWith('pkg/-entry.')
      )?.[1];
      expect(hashedEntry?.startsWith('sha256-')).to.eql(true);

      // Unlike sample-3, this fixture's vite.config.ts has no service-worker entry.
      expect(Object.keys(res.dist.hash.parts)).to.not.include('sw.js');
    });
  });

  it('sample-3: module worker and service-worker entries with relative output authority', async () => {
    await Testing.retry(2, async () => {
      const { res, files, outDir } = await testBuild(SAMPLE.Dirs.sample3, 'relative');
      if (VERBOSE) printHtml(files.html, 'sample-3', outDir);
      expect(extractModulePreloadLinks(files.html).length).to.be.greaterThan(0);
      expect(Object.keys(res.dist.hash.parts)).to.include('sw.js');

      const text = files.javascript;
      expect(text.some((source) => source.includes('module-worker-loaded'))).to.eql(true);
      expect(text.some((source) => source.includes('dynamic-chunk-loaded'))).to.eql(true);
      expect(text.some((source) => source.includes('Service Worker file loaded'))).to.eql(true);
      expect(text.some(hasExplicitResourceManagementSyntax)).to.eql(false);
      expect(text.some((source) => source.includes('Object is not disposable.'))).to.eql(true);
    });
  });

  it('explicit base → overrides config and survives caller mutation', async () => {
    const base = 'https://assets.example.test/release/';
    const mutations: string[] = [];
    const set = Deno.env.set;
    const remove = Deno.env.delete;
    // Record environment writes without reading values; call the original methods.
    Deno.env.set = (name, value) => {
      mutations.push(name);
      return set.call(Deno.env, name, value);
    };
    Deno.env.delete = (name) => {
      mutations.push(name);
      return remove.call(Deno.env, name);
    };
    try {
      const { files } = await testBuild(SAMPLE.Dirs.sample1, 'relative', base);
      expect(files.html).to.include(`src="${base}pkg/-entry.`);
      expect(files.html).to.include(`href="${base}pkg/`);
      expect(files.html).not.to.include('mutated.example.test');
      expect(mutations, 'parent environment writes').to.eql([]);
    } finally {
      Deno.env.set = set;
      Deno.env.delete = remove;
    }
  });

  it('keeps a retained build digest unlinked after its output is replaced', async () => {
    const fs = await SAMPLE.fs('Vite.build retained output', { location: 'local-temp' });
    const cwd = fs.join('fixture');
    const paths = { cwd, app: { entry: 'index.html', outDir: 'dist', base: './' } } as const;
    const build = async () => {
      return await Vite.build({
        dependencyPolicy: 'frozen-cache',
        cwd,
        paths,
        pkg,
        silent: true,
        spinner: false,
        exitOnError: false,
      });
    };

    try {
      await Fs.copy(SAMPLE.Dirs.sample1, cwd);
      const first = await build();
      const source = (await Fs.readText(Fs.join(cwd, 'main.tsx'))).data ?? '';
      await Fs.write(Fs.join(cwd, 'main.tsx'), `${source}\nconsole.info('revision-b');\n`);
      const second = await build();
      const manifestUrl = Path.toFileUrl(Fs.join(cwd, 'dist', 'dist.json'));
      expect(first.ok).to.eql(true);
      expect(second.ok).to.eql(true);
      if (!first.ok || !second.ok) throw new Error('Expected both builds to succeed.');
      const firstDigest = HashFmt.digest(first.pin.digest);
      const firstOutput = first.toString({ width: 500 });

      expect(first.pin.digest).to.not.eql(second.pin.digest);
      expect(firstOutput).to.include(
        Cli.Fmt.hyperlink('dist.json', manifestUrl, { underline: true }),
      );
      expect(stripAnsi(firstOutput)).to.include(`← ${stripAnsi(firstDigest)}`);
      expect(firstOutput).to.not.include(
        Cli.Fmt.hyperlink(firstDigest, manifestUrl, { underline: true }),
      );
    } finally {
      await Fs.remove(fs.dir, { log: false });
    }
  });
});

function expectBounded(text: string, width: number) {
  stripAnsi(text).split('\n').forEach((line) => expect(line.length <= width).to.eql(true));
}
