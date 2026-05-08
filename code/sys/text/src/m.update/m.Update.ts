import { type t } from './common.ts';
import { lines } from './m.lines.ts';
import { apply, deleteRange, insert, replace } from './u.apply.ts';
import { lineSpans, newlineOf } from './u.scan.ts';

/** Public text update surface. */
export const Update: t.TextUpdate.Lib = {
  newlineOf,
  lineSpans,
  insert,
  replace,
  delete: deleteRange,
  apply,
  lines,
};
