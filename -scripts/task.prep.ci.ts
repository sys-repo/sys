import { Workspace } from '@sys/workspace';

import { D, Fs } from './common.ts';
import { orderedWorkspacePaths } from './u.graph.ts';

export type PrepCiOptions = {
  versionFilter?: 'all' | 'ahead';
  prepared?: number;
  final?: boolean;
  ensureGraph?: boolean;
};

export async function main(
  options: PrepCiOptions = {},
  sync: typeof Workspace.Ci.sync = Workspace.Ci.sync,
) {
  const cwd = Fs.cwd();
  const sourcePaths = await orderedWorkspacePaths();
  // Temporary Linux Vite diagnostic; remove this selection after the focused proof.
  const focus = Fs.resolve(cwd, 'code/sys.driver/driver-vite');
  await sync({
    cwd,
    sourcePaths,
    filter: (path) => Fs.resolve(cwd, path) === focus,
    jsrScopes: D.ci.jsrScopes,
    on: D.ci.on,
    ...(options.versionFilter !== undefined ? { versionFilter: options.versionFilter } : {}),
    ...(options.prepared !== undefined ? { prepared: options.prepared } : {}),
    ...(options.final !== undefined ? { final: options.final } : {}),
    ...(options.ensureGraph !== undefined ? { ensureGraph: options.ensureGraph } : {}),
  });
}

if (import.meta.main) await main();
