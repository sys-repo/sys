import { Workspace } from '@sys/workspace';

export async function main(cwd = Deno.cwd()) {
  return Workspace.Prep.Graph.ensure({ cwd });
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
