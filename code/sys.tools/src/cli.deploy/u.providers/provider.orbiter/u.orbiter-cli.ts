import { type t, Process } from '../../common.ts';

/**
 * Orbiter CLI.
 */
export const OrbiterCli = { run } as const;

/**
 * Execute an `orbiter-cli` process.
 */
async function run(
  cwd: t.StringDir,
  args: string[],
  opts: { silent?: boolean } = {},
): Promise<t.ProcOutput> {
  const { silent = true } = opts;
  const argv = ['x', 'npm:orbiter-cli', ...args];
  return await Process.invoke({ cmd: 'deno', args: argv, cwd, silent });
}
