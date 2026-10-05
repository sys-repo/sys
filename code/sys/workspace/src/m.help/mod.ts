import type { t } from './common.ts';
import { DslHelp, RootHelp } from './u/u.load.ts';
export type * from './t.ts';

export const WorkspaceHelp: t.WorkspaceHelp.Lib = Object.freeze({
  Root: RootHelp,
  Dsl: DslHelp,
});
