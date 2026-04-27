import { Workspace } from '@sys/workspace';

import { D } from './common.ts';
import { orderedWorkspacePaths } from './u.graph.ts';

await Workspace.Ci.sync({
  cwd: Deno.cwd(),
  sourcePaths: await orderedWorkspacePaths(),
  jsrScopes: D.ci.jsrScopes,
  on: D.ci.on,
  testBrowserPaths: D.ci.testBrowserPaths,
});
