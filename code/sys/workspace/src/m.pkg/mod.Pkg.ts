import { type t } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { sync } from './u.sync.ts';

/** Package metadata sync helper library. */
export const WorkspacePkg: t.WorkspacePkg.Lib = { Fmt, sync };
