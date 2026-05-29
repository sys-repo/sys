import { type t } from './common.ts';
import { explain } from './m.explain.ts';

/** Console output formatters for workspace deltas. */
export const Fmt: t.WorkspaceDelta.Fmt.Lib = { explain };
