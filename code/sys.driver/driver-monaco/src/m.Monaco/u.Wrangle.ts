import { EditorUtil } from './u.Wrangle.Editor.ts';
import { MonacoUtil } from './u.Wrangle.Monaco.ts';
import { RangeUtil } from './u.Wrangle.Range.ts';

export const Wrangle = {
  Monaco: MonacoUtil,
  Range: RangeUtil,
  Editor: EditorUtil,
} as const;
