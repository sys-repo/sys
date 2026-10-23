import { Process, type t } from './common.ts';
import { main as workspaceInfo } from './task.info.ts';
import { wantsTestHelp } from './u.test.help.ts';

type MainArgs = {
  argv?: readonly string[];
  run?: t.Process.Lib['inherit'];
  info?: () => Promise<void>;
};

/**
 * Run workspace tests, then workspace info after a successful non-help invocation.
 */
export async function main(input: MainArgs = {}) {
  const argv = input.argv ?? Deno.args;
  const run = input.run ?? Process.inherit;
  const info = input.info ?? workspaceInfo;
  const test = await run({
    cmd: Deno.execPath(),
    args: ['task', 'test:parallel', ...argv],
  });
  Deno.exitCode = test.code;
  if (!test.success || wantsTestHelp(argv)) return;

  await info();
}

if (import.meta.main) await main();
