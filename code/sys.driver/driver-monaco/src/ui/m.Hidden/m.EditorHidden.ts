import { type t } from './common.ts';
import { clear } from './u.clear.ts';
import { foldRange } from './u.foldRange.ts';
import { observe } from './u.observe.ts';

export const EditorHidden: t.EditorHiddenLib = {
  observe,
  foldRange,
  clear,
};
