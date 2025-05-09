import { D } from './constants.ts';
import { Is } from './u.Is.ts';

import type * as t from './t.ts';

export const Range = {
  /**
   * Convert input to editor range.
   */
  asRange(input: t.EditorRangeInput): t.EditorRange {
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
  },

  /**
   * Collection of ranges.
   */
  asRanges(input?: t.EditorRangesInput): t.EditorRange[] {
    if (!input) return [];

    type V = t.EditorRange | t.CharPositionTuple;
    const isValue = (value: V) => Is.editorRange(value) || Is.charPositionTuple(value);
    const toRange = (value: V): t.EditorRange => {
      if (Is.editorRange(value)) return value;
      if (Is.charPositionTuple(value)) {
        return {
          startLineNumber: value[0],
          startColumn: value[1],
          endLineNumber: value[0],
          endColumn: value[1],
        };
      }
      throw new Error('Range conversion from input not supported');
    };

    if (Is.editorRange(input)) return [input];
    if (Is.charPositionTuple(input)) return [toRange(input)];
    if (Array.isArray(input)) return (input as V[]).filter(isValue).map(toRange);

    return [];
  },

  /**
   * Convert to the start of the range.
   */
  toRangeStart(input: t.EditorRange): t.EditorRange {
    return {
      startLineNumber: input.startLineNumber,
      startColumn: input.startColumn,
      endLineNumber: input.startLineNumber,
      endColumn: input.startColumn,
    };
  },

  /**
   * Convert to end of the range.
   */
  toRangeEnd(input: t.EditorRange): t.EditorRange {
    return {
      startLineNumber: input.endLineNumber,
      startColumn: input.endColumn,
      endLineNumber: input.endLineNumber,
      endColumn: input.endColumn,
    };
  },
} as const;
