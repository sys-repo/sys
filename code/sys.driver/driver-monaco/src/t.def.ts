import type { t } from './common.ts';

/**
 * Selection and position:
 */

/** Character selection offset.  */
export type SelectionOffset = { readonly start: number; readonly end: number };
/** Character positon (as a tuple). */
export type CharPosTuple = [number, number]; // Line:Column.
/** Character range (as a tuble). */
export type CharRangeTuple = [number, number, number, number]; // Start:[Line:Column], End:[Line:Column]
/** Character position (as an object). */
export type CharPos = LinePos;
/** A single line/column position. */
export type LinePos = { readonly line: number; readonly col: number };

/** Loose input for editor character range(s). */
export type EditorRangesInput =
  | t.Monaco.I.IRange
  | t.Monaco.I.IRange[]
  | t.CharPosTuple
  | t.CharPosTuple[]
  | null;

/** Loose input for editor character range. */
export type EditorRangeInput = t.Monaco.I.IRange | t.CharPosTuple | t.CharRangeTuple | null;
/** Range selection within the editor. */
export type EditorSelection = t.Monaco.Selection;
