import type { t } from './common.ts';
import { DEFAULTS } from './u.defaults.ts';
import { fmt } from './u.fmt.ts';
import { stats } from './u.stats.ts';

/** Workspace source statistics helper library. */
export const WorkspaceInfo: t.WorkspaceInfo.Lib = { DEFAULTS, fmt, stats };
