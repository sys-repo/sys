import { type t, Jsr, pkg } from '../common.ts';

export * from '../common.ts';

export const TYPE_PATH = 'src/m.graph/t.ts' as const;
export const DEFAULTS = {
  schemaVersion: 1,
  GENERATOR: {
    type: Jsr.Url.Pkg.file(pkg, TYPE_PATH),
    pkg,
  } as const satisfies t.WorkspaceGraph.Snapshot.Meta['generator'],
} as const;
export const D = DEFAULTS;
