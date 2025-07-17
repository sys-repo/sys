import { type t, Range } from './common.ts';

/**
 * Derive folded (hidden) ranges by finding the gaps between the
 * editor’s visible ranges.
 */
export function calcHiddenRanges(editor: t.Monaco.Editor): t.Monaco.IRange[] {
  const model = editor.getModel();
  return model ? Range.complement(model.getLineCount(), editor.getVisibleRanges()) : [];
}
