import { type t } from './common.ts';
import { clear } from './u.clear.ts';
import { foldRange } from './u.foldRange.ts';
import { observeAreas } from './u.observeAreas.ts';

export const EditorHidden: t.EditorHiddenLib = {
  observeAreas,
  foldRange,
  clear,
};
