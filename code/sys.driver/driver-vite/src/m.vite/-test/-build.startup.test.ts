import {
  DenoFile,
  describe,
  expect,
  Fs,
  Is,
  it,
  Json,
  Pkg,
  pkg,
  Process,
  ROOT,
  SAMPLE,
  Str,
} from '../../-test.ts';
import { Vite } from '../mod.ts';
import { Wrangle } from '../u/u.wrangle.ts';
import { createNativeBuildFixture } from './u.fixture.build.native.ts';

describe('Vite build startup authority', () => {
  it('workspace fixture → frozen cached CLI startup without evaluating app config', async () => {
    const fs = await SAMPLE.fs('Vite.build startup authority', { location: 'local-temp' });
    // Own cleanup before paths, authority snapshots or command setup can fail.
    await using _root = {
      async [Symbol.asyncDispose]() {
        await Fs.remove(fs.dir, { log: false });
      },
    };
    const cwd = fs.join('fixture');
    const authorityPaths = [
      ROOT.denofile.path,
      ROOT.resolve('deno.lock'),
      ROOT.resolve('imports.json'),
      ROOT.resolve('package.json'),
      ROOT.resolve('deps.yaml'),
    ];
    const baselines = await Promise.all(authorityPaths.map(async (path) => {
      const result = await Fs.readText(path);
      if (!Is.str(result.data)) throw new Error(`Missing startup authority: ${path}`);
      return { path, text: result.data };
    }));
    const failures: unknown[] = [];
    try {
      await Fs.ensureDir(cwd);
      // A version-only startup must not import the fixture's configuration or start its plugins.
      await Fs.write(
        fs.join('fixture/vite.config.ts'),
        "throw new Error('Version probe must not load fixture config.');\n",
        { throw: true },
      );
      expect(await Fs.exists(fs.join('fixture/deno.json'))).to.eql(false);
      expect(await Fs.exists(fs.join('fixture/package.json'))).to.eql(false);
      expect((await DenoFile.nearest(cwd))?.path).to.eql(
        ROOT.resolve('code/sys.driver/driver-vite/deno.json'),
      );
      expect(await DenoFile.Path.nearest(cwd, (e) => Is.array(e.file.workspace))).to.eql(
        ROOT.denofile.path,
      );
      expect(await Wrangle.packageAnchor(cwd)).to.eql(ROOT.resolve('package.json'));
      const paths = { cwd, app: { entry: 'index.html', outDir: 'dist', base: './' } } as const;
      let importMap: string | undefined;
      {
        const command = await Wrangle.command(paths, 'build', 'frozen-cache');
        await using _command = { [Symbol.asyncDispose]: command.dispose };
        importMap = command.args.find((arg) => arg.startsWith('--import-map='))
          ?.slice('--import-map='.length);
        // Vite's global version handler only skips execution without a matched build verb.
        // Preserve the build command's Deno authority, permissions and bootstrap map.
        const args = command.args.map((arg) => arg === 'build' ? '--version' : arg);
        expect(args.slice(0, 4)).to.eql(['run', '--no-prompt', '--frozen', '--cached-only']);
        expect(args).to.include('--version');
        const output = await Process.invoke({ cwd, args, env: command.env, silent: true });
        const diagnostic = Str.dedent(`
          Vite CLI startup refused before app configuration.
          cwd: ${cwd}
          command: deno
          args: ${Json.stringify(args)}
          stderr: ${output.text.stderr || '(empty)'}
          stdout: ${output.text.stdout || '(empty)'}
        `);
        expect(output.success, diagnostic).to.eql(true);
        expect(output.text.stdout).to.include('vite/');
        expect(await Fs.exists(fs.join('fixture/dist'))).to.eql(false);
      }
      expect(Is.str(importMap), 'owned startup import map').to.eql(true);
      if (Is.str(importMap)) expect(await Fs.exists(importMap)).to.eql(false);
    } catch (error) {
      failures.push(error);
    } finally {
      for (const baseline of baselines) {
        try {
          expect((await Fs.readText(baseline.path)).data, baseline.path).to.eql(baseline.text);
        } catch (error) {
          failures.push(error);
        }
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) {
      throw new AggregateError(failures, 'Vite startup proof and authority checks failed.');
    }
  });

  it('native local-JS build → real child success and payload verified against the returned pin', async () => {
    await using fixture = await createNativeBuildFixture('Vite.build native control');
    const { cwd, paths } = fixture;
    const result = await Vite.build({
      dependencyPolicy: 'frozen-cache',
      paths,
      pkg,
      silent: true,
      spinner: false,
      exitOnError: false,
    });
    expect(result.cmd.output.success, result.cmd.output.toString()).to.eql(true);
    expect(result.ok, result.toString()).to.eql(true);
    if (!result.ok) throw new Error('Expected native build control to succeed.');
    expect(result.cmd.output.text.stdout).to.include('built in');
    expect(result.pin.scheme).to.eql('sys.dist/v2');
    expect(result.manifestChecksum).not.to.eql(undefined);
    expect(result.dist.hash.parts).to.have.property('pkg/-pkg.json');
    const verified = await Pkg.Dist.Pinned.verify({
      dir: await Fs.realPath(Fs.join(cwd, 'dist')),
      pin: result.pin,
      limits: {
        manifestBytes: 1024 * 1024,
        entries: 128,
        fileBytes: 1024 * 1024,
        totalBytes: 8 * 1024 * 1024,
      },
    });
    expect(verified.kind).to.eql('verified');
  });
});
