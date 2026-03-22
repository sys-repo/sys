import type { t } from './common.ts';
import { fmt } from './u.fmt.ts';
import { stats } from './u.stats.ts';

/** Monorepo source statistics helper library. */
export const MonorepoInfo: t.MonorepoInfo.Lib = { fmt, stats };
