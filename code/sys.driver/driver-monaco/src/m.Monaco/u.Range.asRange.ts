import { type t, D } from './common.ts';

type IRange = t.Monaco.I.IRange;

/**
 * Convert input to editor IRange.
 */
export function asRange(input?: t.EditorRangeInput): IRange {
  if (!input) {
    return { ...D.NULL_RANGE };
  }

  if (Array.isArray(input)) {
    const value = (index: number) => (typeof input[index] === 'number' ? input[index] : -1);
    const range = (indexes: [number, number, number, number]) => {
      return {
        startLineNumber: value(indexes[0]),
        startColumn: value(indexes[1]),
        endLineNumber: value(indexes[2]),
        endColumn: value(indexes[3]),
      };
    };
    return input.length === 4 ? range([0, 1, 2, 3]) : range([0, 1, 0, 1]);
  }

  const { startLineNumber, startColumn, endLineNumber, endColumn } = input;
  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
}
