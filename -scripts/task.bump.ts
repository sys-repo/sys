import { type t } from '@sys/workspace';
import { WorkspaceCli } from '@sys/workspace/cli';
import { bumpPolicy } from './task.bump.policy.ts';

export async function main(input: t.WorkspaceBump.Args.RunInput = {}) {
  await WorkspaceCli.run({
    argv: ['bump', ...(input.argv ?? Deno.args)],
    cwd: input.options?.cwd,
    bumpPolicy: bumpPolicy(),
  });
  return true;
}

if (import.meta.main) await main();
