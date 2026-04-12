import { cli as tmplCli } from '@sys/tmpl';
import { TmplTesting } from '@sys/tmpl/testing';

import { type t, Fs, Process } from '../../../../-test.ts';

export async function createGeneratedRepoPkg(): Promise<{
  readonly root: t.StringDir;
  readonly pkgDir: t.StringDir;
}> {
  const fixture = await TmplTesting.LocalRepoFixture.create({ silent: true });
  const root = fixture.root;

  const pkgDir = Fs.join(root, 'code', 'projects', 'foo');
  await tmplCli(root, {
    _: ['pkg'],
    tmpl: 'pkg',
    interactive: false,
    dryRun: false,
    force: true,
    bundle: false,
    dir: 'code/projects/foo',
    pkgName: '@tmp/foo',
    help: false,
    'non-interactive': true,
  });

  return { root, pkgDir };
}

export async function runDenoTask(
  cwd: t.StringDir,
  ...args: readonly string[]
): Promise<{ readonly ok: boolean; readonly code: number; readonly stdout: string; readonly stderr: string }> {
  const output = await Process.invoke({
    cmd: 'deno',
    args: ['task', ...args],
    cwd,
    silent: true,
  });
  return {
    ok: output.success,
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  };
}
