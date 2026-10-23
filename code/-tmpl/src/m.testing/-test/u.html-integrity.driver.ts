import { Fs, Hash, Is, Process } from './common.ts';
import {
  assertRunOk,
  FIXTURE_CAPTURE,
  runCommand,
  toCommandRun,
} from '../../../../sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.run.ts';

/** Materialize a reachable, pre-default driver without changing live source or published fixtures. */
export async function preDefaultDriver(workspace: string, target: string, importsPath: string) {
  const revision = '49d43914c';
  const prefix = 'code/sys.driver/driver-vite/';
  const ancestor = await runCommand(workspace, 'git', [
    'merge-base',
    '--is-ancestor',
    revision,
    'HEAD',
  ]);
  assertRunOk(ancestor, 'Pre-default driver reachability');
  const commit = await runCommand(workspace, 'git', ['rev-parse', `${revision}^{commit}`]);
  assertRunOk(commit, 'Pre-default driver revision');
  const tree = await runCommand(workspace, 'git', [
    'ls-tree',
    '-r',
    '--name-only',
    revision,
    '--',
    `${prefix}src`,
    `${prefix}deno.json`,
  ]);
  assertRunOk(tree, 'Pre-default driver source inventory');
  const paths = tree.stdout.trim().split('\n').filter((path) => /\.(?:ts|tsx|js|json)$/.test(path));
  for (const path of paths) {
    if (!path.startsWith(prefix)) throw new Error(`Unexpected historical driver path: ${path}`);
    const args = ['show', `${revision}:${path}`];
    const output = await Process.capture({
      cmd: 'git',
      args,
      cwd: workspace,
      env: { HOME: Deno.env.get('HOME') ?? '', PATH: Deno.env.get('PATH') ?? '' },
      ...FIXTURE_CAPTURE,
    });
    assertRunOk(
      toCommandRun({ cwd: workspace, cmd: ['git', ...args], output }),
      `Pre-default driver source: ${path}`,
    );
    if (output.stdoutTruncated || output.stderrTruncated) {
      throw new Error(`Truncated historical source: ${path}`);
    }
    await Fs.write(Fs.join(target, path.slice(prefix.length)), output.text.stdout, { throw: true });
  }

  // Only fixture resolution changes: the historical runtime source and ordinary app config do not.
  const manifestPath = Fs.join(target, 'deno.json');
  const manifest = (await Fs.readJson<{ exports: Record<string, string> }>(manifestPath)).data;
  if (!manifest) throw new Error('Missing historical driver manifest.');
  await Fs.writeJson(manifestPath, { ...manifest, workspace: [], importMap: importsPath }, {
    throw: true,
  });
  const imports: Record<string, string> = {};
  for (const [key, value] of Object.entries(manifest.exports)) {
    if (!Is.str(value)) throw new Error(`Unexpected historical driver export: ${key}`);
    const specifier = key === '.' ? '@sys/driver-vite' : `@sys/driver-vite/${key.slice(2)}`;
    imports[specifier] = Fs.join(target, value);
  }
  const appPath = await Fs.realPath(Fs.join(target, 'src/m.vite.config/u/u.app.ts'));
  const source = (await Fs.readText(appPath)).data;
  if (!Is.str(source)) throw new Error('Missing historical app implementation.');
  return { imports, appPath, commit: commit.stdout.trim(), digest: Hash.sha256(source) };
}
