import type { t } from './common.ts';

type IRange = t.Monaco.I.IRange;
type IPosition = t.Monaco.I.IPosition;

/**
 * Boolean evaluators for Monaco editor types.
 */
export type EditorIsLib = {
  /** True if the input is a Monaco IRange. */
  editorRange(input: unknown): input is IRange;

  /** True if the input is a [line, column] tuple. */
  charPositionTuple(input: unknown): input is t.CharPosTuple;

  /** True if the range has no width/height. */
  nullRange(input: IRange): boolean;

  /** True if the range spans exactly one character. */
  singleCharRange(input: t.EditorRangeInput): boolean;

  /** True if the given range is fully within the text string. */
  rangeWithinString(input: t.EditorRangeInput, text: string): boolean;

  /** Strict equality by start/end line/column. */
  rangeEqual(a?: IRange, b?: IRange): boolean;

  /** Strict equality by editor id, offset, position, and path. */
  cursorEqual(a?: t.EditorCursor, b?: t.EditorCursor): boolean;

  /** Strict equality by line/column. */
  posEqual(a?: IPosition, b?: IPosition): boolean;

  /** True if the input is a `[start, end?]` byte-offset tuple. */
  posTuple(input: unknown): input is readonly [number, number?];

  /** True if the input is a single line/column position object. */
  linePos(input: unknown): input is t.LinePos;

  /** True if the input is a `[start, end?]` pair of line/col positions. */
  linePosPair(input: unknown): input is readonly [t.LinePos, t.LinePos?];
};
