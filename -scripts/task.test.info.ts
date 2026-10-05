import { Process, type t } from './common.ts';
import { wantsTestHelp } from './u.test.help.ts';

type MainArgs = {
  argv?: readonly string[];
  run?: t.Process.Lib['inherit'];
};

/**
 * Run workspace tests, then workspace info after a successful non-help invocation.
 */
export async function main(input: MainArgs = {}) {
  const argv = input.argv ?? Deno.args;
  const run = input.run ?? Process.inherit;
  const test = await run({
    cmd: Deno.execPath(),
    args: ['task', 'test:parallel', ...argv],
  });
  Deno.exitCode = test.code;
  if (!test.success || wantsTestHelp(argv)) return;

  const info = await run({ cmd: Deno.execPath(), args: ['task', 'info'] });
  Deno.exitCode = info.code;
}

if (import.meta.main) await main();
