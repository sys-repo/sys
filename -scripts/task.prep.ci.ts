import { Workspace } from '@sys/workspace';
import { Paths } from './-PATHS.ts';

await Workspace.Ci.sync({
  cwd: Deno.cwd(),
  sourcePaths: Paths.modules,
  jsrScopes: ['@sys', '@tdb'],
});
