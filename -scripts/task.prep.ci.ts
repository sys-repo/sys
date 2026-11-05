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
  await sync({
    cwd,
    sourcePaths,
    jsrScopes: D.ci.jsrScopes,
    on: D.ci.on,
    ...(options.versionFilter !== undefined ? { versionFilter: options.versionFilter } : {}),
    ...(options.prepared !== undefined ? { prepared: options.prepared } : {}),
    ...(options.final !== undefined ? { final: options.final } : {}),
    ...(options.ensureGraph !== undefined ? { ensureGraph: options.ensureGraph } : {}),
  });
}

if (import.meta.main) await main();
