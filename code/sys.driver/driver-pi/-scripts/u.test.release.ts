// Deliberately bypass the broad script runtime barrel: launchers have no ambient env/read grants.
import { Path } from '@sys/fs/path';
import { Process } from '@sys/process/process';
import { Is } from '@sys/std/is';
import type { t } from './common.ts';

type BrowserLaunch = {
  readonly inherit: t.Process.Lib['inherit'];
  readonly env: Pick<typeof Deno.env, 'get' | 'delete'>;
};

const CWD = Path.fromFileUrl(new URL('../', import.meta.url));
const FROZEN = ['--frozen', '--cached-only', '--no-prompt'] as const;
const PROTECTED = [
  '--deny-write=./dist,./.pi,../../../.pi,./src/m.cli/m.profiles/u.start/u.gui/u.service.evidence.ts',
  '--deny-env=DENO_DIR',
  '--deny-net=0.0.0.0,127.0.0.1:8080',
] as const;
const ENV = { TMPDIR: './.tmp', FORCE_COLOR: '0' } as const;

/** Launch only the disposable runtime proof, never the evidence binder. */
export async function runReleaseRuntime(inherit = Process.inherit): Promise<number> {
  const result = await inherit({
    cmd: Deno.execPath(),
    cwd: CWD,
    clearEnv: false,
    env: { ...ENV },
    args: [
      'test',
      ...FROZEN,
      '-P=release-local-test',
      ...PROTECTED,
      '--deny-run',
      '--trace-leaks',
      './-scripts/-test.external/-task.start.gui.release.local.ts',
    ],
  });
  return result.code;
}

/** Keep admission unprivileged; only its successful settlement permits the frozen browser child. */
export async function runFrozenBrowser(
  deps: BrowserLaunch = { inherit: Process.inherit, env: Deno.env },
): Promise<number> {
  const admitted = await deps.inherit({
    cmd: Deno.execPath(),
    cwd: CWD,
    clearEnv: false,
    env: { FORCE_COLOR: '0' },
    args: [
      'run',
      ...FROZEN,
      '-P=test-browser-admit',
      './-scripts/-test.browser.admit.ts',
    ],
  });
  if (!admitted.success) return admitted.code;

  const executable = deps.env.get('CHROME_BIN');
  if (!Is.string(executable) || executable.length === 0) {
    throw new Error('Admitted Chrome executable is unavailable.');
  }
  // Equivalent to the former `env -u CHROME_BIN`: only this launcher process is changed.
  deps.env.delete('CHROME_BIN');
  const result = await deps.inherit({
    cmd: Deno.execPath(),
    cwd: CWD,
    clearEnv: false,
    env: { ...ENV, SYS_DRIVER_PI_RELEASE_EVIDENCE: '1' },
    args: [
      'test',
      ...FROZEN,
      '-P=test-browser-frozen',
      `--allow-run=${executable}`,
      ...PROTECTED,
      '--trace-leaks',
      './-scripts/-test.browser.ts',
      '--',
      `--chrome-executable=${executable}`,
    ],
  });
  return result.code;
}
