import { type t, Workspace } from '@sys/workspace';

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

function bumpPolicy(): t.WorkspaceBump.Policy {
  return {
    followups({ cwd }) {
      return [{ cwd, cmd: 'deno', args: ['task', 'prep'], label: 'post-bump prep' }];
    },
  };
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
