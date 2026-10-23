import { resolvePkg } from '../../src/m.cli/u/u.resolve.pkg.ts';
import { Err, expect, Fs, Json, Process, Time } from '../common.ts';
import {
  expectCompleteExit,
  hostArtifact,
  hostConfig,
  hostPaths,
  reportHostOutput,
  requireAdmittedHost,
  selectHost,
} from './u.host.compat.ts';

if (Deno.args.includes('--help')) {
  console.info('deno task test:compat:admit [--pi-version=X.Y.Z]');
  console.info('Downloads official npm artifacts into .tmp/pi-compat; never launches Pi.');
} else {
  const cwd = Fs.resolve(import.meta.dirname ?? '.', '../..');
  const { pkg, version } = selectHost(Deno.args, await resolvePkg({ cwd }));
  const paths = hostPaths(version);
  if (await Fs.exists(paths.receipt)) {
    await requireAdmittedHost(pkg, version);
    console.info(`Already admitted: ${pkg}\n${paths.root}`);
  } else {
    if (await Fs.exists(paths.root)) {
      throw Err.std(`Incomplete admission retained at ${paths.root}; inspect before removing it.`);
    }
    await Fs.ensureDir(paths.root);
    const home = Fs.join(paths.root, 'home');
    const tmp = Fs.join(paths.root, 'tmp');
    await Fs.ensureDir(home);
    await Fs.ensureDir(tmp);
    await Fs.writeJson(paths.config, hostConfig(pkg), { throw: true });
    const output = await Process.capture({
      cmd: Deno.execPath(),
      cwd: paths.root,
      args: ['cache', `--config=${paths.config}`, `--lock=${paths.lock}`, pkg],
      clearEnv: true,
      env: {
        DENO_DIR: paths.cache,
        HOME: home,
        TMPDIR: tmp,
        TMP: tmp,
        TEMP: tmp,
        NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/',
      },
      executionTimeout: 120_000,
      maxStdoutBytes: 65_536,
      maxStderrBytes: 262_144,
    });
    // Admission is retained even on failure: no cleanup under a possibly-live resolver.
    reportHostOutput(output);
    expectCompleteExit(output);
    expect(output.success, `Artifact admission failed; retained at ${paths.root}`).to.eql(true);
    const artifact = await hostArtifact(pkg, version);
    await Fs.writeJson(paths.receipt, {
      artifact,
      deno: Deno.version.deno,
      admittedAt: Time.now.date.toISOString(),
    }, { throw: true });
    console.info(Json.stringify({ admitted: artifact, root: paths.root }));
  }
}
