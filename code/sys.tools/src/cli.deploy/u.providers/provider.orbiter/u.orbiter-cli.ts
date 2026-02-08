import { type t, Process } from '../../common.ts';

/**
 * Orbiter CLI.
 */
export const OrbiterCli = { run } as const;

type RunOptions = {
  silent?: boolean;
  allowRead?: string[];
  allowWrite?: string[];
  allowRun?: string[];
};

/**
 * Execute an `orbiter-cli` process.
 */
async function run(cwd: t.StringDir, args: string[], opts: RunOptions = {}): Promise<t.ProcOutput> {
  const { silent = true } = opts;
  const permissions = toPermissionArgs(cwd, opts);
  const argv = ['x', ...permissions, 'npm:orbiter-cli', ...args];
  return await Process.invoke({ cmd: 'deno', args: argv, cwd, silent });
}

/**
 * Security posture (audit summary):
 *
 *  - Default-deny subprocess: Orbiter runs under explicit, minimal grants only.
 *  - Network: outbound only (`--allow-net`).
 *  - Env: broad (`--allow-env`) is required by orbiter-cli startup enumeration of `process.env`.
 *  - Sys: scoped to home resolution only (`--allow-sys=homedir`).
 *  - Read: scoped to staging `cwd` + explicit token file when needed.
 *  - Write: scoped to `~/.orbiter.json` and `${stagingDir}/orbiter.json` for auth/config persistence.
 *  - Run: scoped to `/bin/sh` for orbiter build-command execution.
 *  - Probe path remains tighter than push (no write/run scopes unless explicitly passed).
 *
 */
function toPermissionArgs(cwd: t.StringDir, opts: RunOptions): readonly string[] {
  const { allowRead = [], allowWrite = [], allowRun = [] } = opts;
  const readScope = [String(cwd), ...allowRead]
    .filter((value) => value.trim().length > 0)
    .join(',');
  const writeScope = allowWrite.filter((value) => value.trim().length > 0).join(',');
  const runScope = allowRun.filter((value) => value.trim().length > 0).join(',');

  return [
    '--allow-net',
    // NB: orbiter-cli currently enumerates `process.env` at startup.
    // Deno therefore requires broad `--allow-env` (scoped env lists fail),
    // including when auth is provided via `ORBITER_API_KEY`.
    '--allow-env',
    '--allow-sys=homedir',
    `--allow-read=${readScope}`,
    ...(writeScope ? [`--allow-write=${writeScope}`] : []),
    ...(runScope ? [`--allow-run=${runScope}`] : []),
  ] as const;
}
