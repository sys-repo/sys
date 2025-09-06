import { EditorUtil } from './u.Editor.ts';
import { MonacoUtil } from './u.Monaco.ts';
import { RangeUtil } from './u.Range.ts';

export { EditorUtil, MonacoUtil, RangeUtil };

export const Util = {
  Monaco: MonacoUtil,
  Range: RangeUtil,
  Editor: EditorUtil,
} as const;
