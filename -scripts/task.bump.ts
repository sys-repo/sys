import { type t, Workspace } from '@sys/workspace';
import { bumpPolicy } from './task.bump.policy.ts';

export async function main(input: t.WorkspaceBump.Args.RunInput = {}) {
  const policy = bumpPolicy();
  const args = Workspace.Bump.Args.run({ ...input, policy });
  if (args.help) {
    Workspace.Bump.Fmt.help();
    return false;
  }
  if (args.conflict) throw new Error(args.conflict.message);
  if (args.invalidRelease) console.warn(Workspace.Bump.Fmt.invalidRelease(args.invalidRelease));

  if (args.since !== undefined) {
    const delta = await Workspace.Delta.Git.fromRef({
      cwd: args.run.cwd,
      ref: args.since,
      release: args.run.release,
      policy,
    });
    if (args.run.log ?? true) printDelta(delta);
    await Workspace.Bump.run({ ...args.run, collect: delta.collect, from: delta.bumpRootPkgPaths });
  } else {
    await Workspace.Bump.run(args.run);
  }

  return true;
}

/**
 * Helpers:
 */
function printDelta(delta: t.WorkspaceDelta.Git.FromRefResult) {
  console.info();
  console.info(`Delta since ${delta.ref}..${delta.head}`);
  console.info(`  changed         ${formatList(delta.changedPkgPaths)}`);
  console.info(`  needs bump      ${formatList(delta.needsBumpPkgPaths)}`);
  console.info(`  already bumped  ${formatList(delta.alreadyBumpedPkgPaths)}`);
  console.info(`  new packages    ${formatList(delta.newPkgPaths)}`);
  console.info();
}

function formatList(paths: readonly string[]) {
  return paths.length === 0 ? '0' : `${paths.length} (${paths.join(', ')})`;
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
