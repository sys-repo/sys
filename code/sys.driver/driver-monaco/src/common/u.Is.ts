import type * as t from './t.ts';

import { DEFAULTS } from './constants.ts';
import { R } from './libs.ts';
import { Range } from './u.Wrangle.Range.ts';

export const Is = {
  number(value: any) {
    return typeof value === 'number' && !isNaN(value);
  },

  editorRange(input: any): input is t.EditorRange {
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

  nullRange(input: t.EditorRange): boolean {
    return R.equals(input, DEFAULTS.NULL_RANGE);
  },

  singleCharRange(input: t.EditorRangeInput) {
    const range = Range.asRange(input);
    return range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn;
  },

  rangeWithinString(input: t.EditorRangeInput, text: string) {
    const range = Range.asRange(input);
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
