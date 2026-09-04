import { type t } from './common.ts';
import { expandPaths, fieldFromPath } from './u.field.ts';
import { CrdtObjectView as ObjectView } from './ui.ObjectView/mod.ts';

/** Development helpers for inspecting CRDT object values. */
export const Dev: t.Dev.Lib = {
  ObjectView,
  fieldFromPath,
  expandPaths: expandPaths,
};
