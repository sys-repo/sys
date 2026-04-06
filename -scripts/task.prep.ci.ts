import { Workspace } from '@sys/workspace';

import { Paths } from './-PATHS.ts';
import { D } from './common.ts';

await Workspace.Ci.sync({
  cwd: Deno.cwd(),
  sourcePaths: Paths.modules,
  jsrScopes: D.ci.jsrScopes,
  on: D.ci.on,
});
