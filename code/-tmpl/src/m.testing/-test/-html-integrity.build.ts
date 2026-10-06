import { describe, expect, Fs, Hash, Is, it, Json, Process, Str, type t, Try } from './common.ts';
import setupPkg from '../../../-templates/tmpl.pkg/.tmpl.ts';
import { makeTmpl } from '../../m.tmpl/mod.ts';
import { json as embedded } from '../../m.tmpl/-bundle.ts';
import { TmplTesting } from '../mod.ts';
import { writePkg } from './u.fixture.ts';
import { preDefaultDriver } from './u.html-integrity.driver.ts';
import {
  assertRunOk,
  FIXTURE_CAPTURE,
  runCommand,
  runTask,
  toCommandRun,
  workspaceRoot,
} from '../../../../sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.run.ts';
import { attestIntegrity } from '../../../../sys.driver/driver-vite/src/m.vite/-test.external/u.html-integrity.attest.ts';

type Manifest = { readonly tasks?: Record<string, string> };
type Graph = {
  readonly modules: readonly { readonly specifier: string; readonly local?: string }[];
};

// This lane owns materialization/authority controls, not published compatibility or browser transport.
describe('Generated package → inherited HTML integrity', () => {
  it('refreshed bundle → checked config and written-byte integrity; old driver and stale bundle fail separately', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.html-integrity.' });
    try {
      const { root, authorities } = await TmplTesting.LocalRepoFixture.create({
        cwd: tmp.absolute,
        targetDir: 'repo',
        silent: true,
      });
      const pkgDir = await writePkg(root, 'code/packages/sri', '@tmp/sri');
      await expectConfigCheck(pkgDir);
      const configPath = Fs.join(pkgDir, 'vite.config.ts');
      const config = (await Fs.readText(configPath)).data;
      if (!Is.str(config)) throw new Error('Missing generated config.');
      expect(config).not.to.include('htmlIntegrity');
      expect(config).not.to.include('/plugins');
      console.info('Generated product authority:', {
        driver: authorities.imports['@sys/driver-vite'],
        bundle: Hash.sha256(Json.stringify(embedded)),
        deno: Deno.version,
      });
      await checkAndBuild(pkgDir);
      console.info(
        'Generated product SRI:',
        (await attestIntegrity(Fs.join(pkgDir, 'dist'))).references,
      );

      // A real config-only type error proves the generated declared check executes the target.
      await Fs.write(configPath, `${config}\nconst configCheckControl: string = 123;\n`, {
        throw: true,
      });
      const invalid = await runTask(pkgDir, 'check');
      expect(invalid.ok).to.eql(false);
      expect(invalid.stderr).to.include('vite.config.ts');
      expect(invalid.stderr).to.include('TS2322');
      await Fs.write(configPath, config, { throw: true });
      assertRunOk(await runTask(pkgDir, 'check'), 'Restored generated config check');

      // Verify a reachable pre-default source revision; do not mistake a source pin for resolution.
      const ws = await workspaceRoot();
      const importsPath = Fs.join(root, 'imports.json');
      const historical = await preDefaultDriver(
        ws,
        Fs.join(tmp.absolute, 'driver-before-default'),
        importsPath,
      );
      const oldImports = { ...authorities.imports, ...historical.imports };
      await Fs.writeJson(importsPath, { imports: oldImports }, { throw: true });
      // Native startup intentionally excludes local root aliases; name the control authority at the package too.
      const manifestPath = Fs.join(pkgDir, 'deno.json');
      const manifestBytes = (await Fs.readText(manifestPath)).data;
      const manifest = Json.parse<Manifest>(manifestBytes);
      if (!Is.str(manifestBytes) || !manifest) throw new Error('Missing generated manifest.');
      await Fs.writeJson(manifestPath, { ...manifest, imports: oldImports }, { throw: true });
      // This graph is larger than ordinary command diagnostics; capture it completely or refuse.
      const infoArgs = ['info', '--json', './vite.config.ts'];
      const captured = await Process.capture({
        cmd: 'deno',
        args: infoArgs,
        cwd: pkgDir,
        env: { HOME: Deno.env.get('HOME') ?? '', PATH: Deno.env.get('PATH') ?? '' },
        ...FIXTURE_CAPTURE,
        maxStdoutBytes: 16_000_000,
      });
      assertRunOk(
        toCommandRun({ cwd: pkgDir, cmd: ['deno', ...infoArgs], output: captured }),
        'Old-driver resolution',
      );
      if (captured.stdoutTruncated || captured.stderrTruncated) {
        throw new Error('Truncated old-driver resolution evidence.');
      }
      const graph = Json.parse<Graph>(captured.text.stdout);
      let oldApp: Graph['modules'][number] | undefined;
      for (const item of graph?.modules ?? []) {
        if (
          !item.specifier.startsWith('file:') ||
          !item.specifier.endsWith('/driver-before-default/src/m.vite.config/u/u.app.ts')
        ) continue;
        const path = item.local ?? Fs.Path.fromFileUrl(item.specifier);
        if (await Fs.realPath(path) === historical.appPath) oldApp = item;
      }
      if (!oldApp) {
        throw new Error('Old-driver config graph did not resolve the pinned app implementation.');
      }
      const oldSource = (await Fs.readText(historical.appPath)).data;
      if (!Is.str(oldSource)) throw new Error('Missing resolved old-driver source.');
      expect(oldSource).not.to.include('htmlIntegrity ?? true');
      expect(Hash.sha256(oldSource)).to.eql(historical.digest);
      console.info('Verified pre-default driver:', {
        commit: historical.commit,
        specifier: oldApp.specifier,
        digest: historical.digest,
      });
      await checkAndBuild(pkgDir);
      const old = await Try.run(() => attestIntegrity(Fs.join(pkgDir, 'dist')));
      expect(old.result.ok).to.eql(false);
      if (!old.result.ok) {
        expect(old.result.error.message).to.include('Missing effective integrity');
      }
      console.info(
        'Old-driver control: check/build succeed; independent SRI attestation rejects missing metadata.',
      );
      await Fs.writeJson(importsPath, { imports: authorities.imports }, { throw: true });
      await Fs.write(manifestPath, manifestBytes, { throw: true });
      await checkAndBuild(pkgDir);
      await attestIntegrity(Fs.join(pkgDir, 'dist'));
      expect((await Fs.readText(configPath)).data).to.eql(config);
      expect((await Fs.readText(manifestPath)).data).to.eql(manifestBytes);

      // A historical embedded product can inherit SRI while still omitting config checking.
      const stalePath = 'code/-tmpl/src/m.tmpl/-bundle.json';
      const staleBlob = 'ef6e6526bb8678036dbf2e1a34faf2b21ea671ea';
      const snapshot = await runCommand(ws, 'git', ['show', staleBlob]);
      assertRunOk(snapshot, 'Historical embedded bundle');
      const staleMap = Json.parse<t.FileMap>(snapshot.stdout);
      if (!staleMap) throw new Error('Missing historical file map.');
      const staleDir = Fs.join(root, 'code/packages/stale');
      const stale = await makeTmpl('pkg', staleMap);
      await stale.write(staleDir);
      await setupPkg(staleDir, { pkgName: '@tmp/stale' });
      assertRunOk(await runTask(staleDir, 'check'), 'Stale product declared check');
      assertRunOk(await runTask(staleDir, 'build'), 'Stale product build');
      await attestIntegrity(Fs.join(staleDir, 'dist'));
      const staleCheck = await Try.run(() => expectConfigCheck(staleDir));
      expect(staleCheck.result.ok).to.eql(false);
      if (!staleCheck.result.ok) {
        expect(staleCheck.result.error.message).to.include('Missing generated config-check target');
      }
      console.info('Stale-bundle control:', {
        path: stalePath,
        blob: staleBlob,
        result: 'SRI passes; config-check acceptance refuses',
      });
      await expectConfigCheck(pkgDir);
      await checkAndBuild(pkgDir);
      await attestIntegrity(Fs.join(pkgDir, 'dist'));
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });
});

async function expectConfigCheck(dir: string) {
  const manifest = (await Fs.readJson<Manifest>(Fs.join(dir, 'deno.json'))).data;
  if (!manifest?.tasks?.check?.split(/\s+/).includes('./vite.config.ts')) {
    throw new Error('Missing generated config-check target: ./vite.config.ts');
  }
}

async function checkAndBuild(dir: string) {
  for (const task of ['check', 'build']) {
    const result = await runTask(dir, task);
    assertRunOk(result, `Generated package ${task}`);
    console.info(Str.trimEdgeNewlines(`${result.stdout}\n${result.stderr}`));
  }
}
