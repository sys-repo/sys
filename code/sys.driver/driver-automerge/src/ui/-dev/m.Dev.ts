import { type t } from './common.ts';
import { expandPaths, fieldFromPath } from './u.field.ts';
import { CrdtObjectView as ObjectView } from './ui.ObjectView/mod.ts';

export const Dev: t.DevLib = {
  ObjectView,
  fieldFromPath,
  expandPaths: expandPaths,
};
