import { Workspace } from '@sys/workspace';

export async function main(cwd = Deno.cwd()) {
  await Workspace.Prep.Graph.verify({ cwd });
}

if (import.meta.main) await main();
