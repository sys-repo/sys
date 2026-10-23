import { type t } from '@sys/workspace';
import { WorkspaceCli } from '@sys/workspace/cli';
import { bumpPolicy } from './task.bump.policy.ts';

export async function main(input: t.WorkspaceBump.Args.RunInput = {}) {
  return await mainWith(WorkspaceCli.run, input);
}

/** Internal runner seam; the task entrypoint always uses WorkspaceCli.run. */
export async function mainWith(
  runCli: t.WorkspaceCli.Lib['run'],
  input: t.WorkspaceBump.Args.RunInput = {},
) {
  await runCli({
    argv: ['bump', ...(input.argv ?? Deno.args)],
    cwd: input.options?.cwd,
    bumpPolicy: bumpPolicy(),
  });
  return true;
}

if (import.meta.main) await main();
