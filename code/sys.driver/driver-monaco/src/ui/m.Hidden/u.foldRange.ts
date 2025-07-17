/**
 * Monaco.Hidden.foldRange
 * -----------------------
 * Fold (hide) one or more **whole lines** without clobbering the
 * editor’s existing hidden-area list.
 *
 * @param editor  Monaco editor instance (real or fake).
 * @param start   First line to hide – 1-based.
 * @param end     Last line to hide – 1-based (defaults to `start`).
 *
 * @example
 *   // Fold just line 5
 *   Monaco.Hidden.foldRange(editor, 5);
 *
 *   // Fold lines 10-20 (inclusive)
 *   Monaco.Hidden.foldRange(editor, 10, 20);
 */
import { type t } from './common.ts';

export const foldRange: t.EditorHiddenLib['foldRange'] = (ed, start, end = start) => {
  const editor = ed as t.Monaco.Editor & t.EditorHiddenMembers;

  const range: t.Monaco.IRange = {
    startLineNumber: start,
    startColumn: 1,
    endLineNumber: end,
    endColumn: 1,
  };

  // Preserve any folds the user already has:
  const current = editor.getHiddenAreas?.() ?? [];
  editor.setHiddenAreas([...current, range]);
};
