import { type t, Workspace } from '@sys/workspace';
import { bumpPolicy } from './task.bump.policy.ts';

export async function main(input: t.WorkspaceBump.Args.RunInput = {}) {
  const args = Workspace.Bump.Args.run({ ...input, policy: bumpPolicy() });
  if (args.help) {
    Workspace.Bump.Fmt.help();
    return false;
  }
  if (args.invalidRelease) console.warn(Workspace.Bump.Fmt.invalidRelease(args.invalidRelease));
  await Workspace.Bump.run(args.run);

  return true;
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
