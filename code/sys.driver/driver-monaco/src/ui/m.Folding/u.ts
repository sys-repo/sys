import { type t, RangeUtil } from './common.ts';

/**
 * Derive folded (hidden) ranges by finding the gaps between the
 * editor’s visible ranges.
 */
export function calcHiddenRanges(editor: t.Monaco.Editor): t.Monaco.I.IRange[] {
  const model = editor.getModel();
  return model ? RangeUtil.complement(model.getLineCount(), editor.getVisibleRanges()) : [];
}
