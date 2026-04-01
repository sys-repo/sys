import { Workspace } from '@sys/workspace';

export async function main(cwd = Deno.cwd()) {
  const res = await Workspace.Prep.Graph.check(cwd);
  if (!res.existing) {
    const err = `Workspace graph missing at '${res.path}'`;
    throw new Error(`${err} — run 'deno task prep:graph'`);
  }

  if (!res.current) {
    const err = `Workspace graph is stale at '${res.path}'`;
    throw new Error(`${err} — run 'deno task prep:graph'`);
  }
}

if (import.meta.main) await main();
