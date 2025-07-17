import type { t } from './common.ts';

/**
 * Selection and position:
 */

/** Character selection offset.  */
export type SelectionOffset = { start: number; end: number };
/** Character position (as an object). */
export type CharPosition = { line: number; column: number };
/** Character positon (as a tuple). */
export type CharPositionTuple = [number, number]; // Line:Column.
/** Character range (as a tuble). */
export type CharRangeTuple = [number, number, number, number]; // Start:[Line:Column], End:[Line:Column]

/** Loose input for editor character range(s). */
export type EditorRangesInput =
  | t.Monaco.I.IRange
  | t.Monaco.I.IRange[]
  | t.CharPositionTuple
  | t.CharPositionTuple[]
  | null;

/** Loose input for editor character range. */
export type EditorRangeInput = t.Monaco.I.IRange | t.CharPositionTuple | t.CharRangeTuple | null;
/** Range selection within the editor. */
export type EditorSelection = t.Monaco.Selection;
