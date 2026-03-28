import type { t } from './common.ts';
import { fmt } from './u.fmt.ts';
import { stats } from './u.stats.ts';

/** Workspace source statistics helper library. */
export const WorkspaceInfo: t.WorkspaceInfo.Lib = { fmt, stats };
