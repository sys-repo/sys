import { type t, D, Is, R } from './common.ts';
import { RangeUtil } from './u.Range.ts';

export const MonacoIs: t.MonacoIsLib = {
  editorRange(input: any): input is t.Monaco.IRange {
    if (!input) return false;
    if (typeof input !== 'object') return false;
    return (
      Is.number(input.startLineNumber) &&
      Is.number(input.startColumn) &&
      Is.number(input.endLineNumber) &&
      Is.number(input.endColumn)
    );
  },

  charPositionTuple(input: any): input is t.CharPositionTuple {
    if (!input) return false;
    if (!Array.isArray(input)) return false;
    return input.length === 2 && Is.number(input[0]) && Is.number(input[1]);
  },

  nullRange(input: t.Monaco.IRange): boolean {
    return R.equals(input, D.NULL_RANGE);
  },

  singleCharRange(input: t.EditorRangeInput) {
    const range = RangeUtil.asRange(input);
    return range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn;
  },

  rangeWithinString(input: t.EditorRangeInput, text: string) {
    const range = RangeUtil.asRange(input);
    const lines = text.split('\n');
    const startLine = lines[range.startLineNumber - 1];
    const endLine = lines[range.endLineNumber - 1];

    if (startLine === undefined || endLine === undefined) return false;
    if (range.startColumn < 0 || range.endColumn < 0) return false;
    if (range.startColumn > startLine.length + 1) return false;
    if (range.endColumn > endLine.length + 1) return false;

    return true;
  },
};
