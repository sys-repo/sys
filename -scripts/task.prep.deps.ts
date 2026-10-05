import { Workspace } from '@sys/workspace';

// Dependency projection only: no submodule prep, template regeneration or Git mutation.
await Workspace.Prep.Deps.sync({ cwd: Deno.cwd(), log: true });
