import { type t, D } from './common.ts';
import { MonacoIs } from './m.Is.ts';

type IRange = t.Monaco.I.IRange;

export const RangeUtil = {
  eql(a: IRange | IRange[], b: IRange | IRange[]): boolean {
    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);

    if (isArrayA !== isArrayB) return false;

    if (!isArrayA && !isArrayB) {
      const r1 = a as IRange;
      const r2 = b as IRange;
      return (
        r1.startLineNumber === r2.startLineNumber &&
        r1.startColumn === r2.startColumn &&
        r1.endLineNumber === r2.endLineNumber &&
        r1.endColumn === r2.endColumn
      );
    }

    const arr1 = a as IRange[];
    const arr2 = b as IRange[];
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (!RangeUtil.eql(arr1[i], arr2[i])) return false;
    }
    return true;
  },

  /**
   * Convert input to editor range.
   */
  asRange(input: t.EditorRangeInput): IRange {
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
  asRanges(input?: t.EditorRangesInput): IRange[] {
    if (!input) return [];

    type V = IRange | t.CharPositionTuple;
    const isValue = (value: V) => MonacoIs.editorRange(value) || MonacoIs.charPositionTuple(value);
    const toRange = (value: V): IRange => {
      if (MonacoIs.editorRange(value)) return value;
      if (MonacoIs.charPositionTuple(value)) {
        return {
          startLineNumber: value[0],
          startColumn: value[1],
          endLineNumber: value[0],
          endColumn: value[1],
        };
      }
      throw new Error('Range conversion from input not supported');
    };

    if (MonacoIs.editorRange(input)) return [input];
    if (MonacoIs.charPositionTuple(input)) return [toRange(input)];
    if (Array.isArray(input)) return (input as V[]).filter(isValue).map(toRange);

    return [];
  },

  /**
   * Convert to the start of the range.
   */
  toRangeStart(input: IRange): IRange {
    return {
      startLineNumber: input.startLineNumber,
      startColumn: input.startColumn,
      endLineNumber: input.startLineNumber,
      endColumn: input.startColumn,
    };
  },

  /**
   * Range
   */
  fromPosition(start: t.Monaco.Position, end: t.Monaco.Position): IRange {
    return {
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    };
  },

  /**
   * Convert to end of the range.
   */
  toRangeEnd(input: IRange): IRange {
    return {
      startLineNumber: input.endLineNumber,
      startColumn: input.endColumn,
      endLineNumber: input.endLineNumber,
      endColumn: input.endColumn,
    };
  },

  /**
   * Return the complement of `occupied` within the inclusive
   * line-range: 1..lastLine.
   *
   * aka. the "visible gaps"
   *
   * If nothing is occupied we return a single range spanning
   * the whole document.
   */
  complement(lastLine: number, occupied: IRange[]): IRange[] {
    if (occupied.length === 0) {
      return [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: lastLine,
          endColumn: 1,
        },
      ];
    }

    const sorted = [...occupied].sort((a, b) => a.startLineNumber - b.startLineNumber);
    const gaps: IRange[] = [];

    let line = 1;
    for (const r of sorted) {
      if (line < r.startLineNumber) {
        gaps.push({
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: r.startLineNumber - 1,
          endColumn: 1,
        });
      }
      line = r.endLineNumber + 1;
    }

    if (line <= lastLine) {
      gaps.push({
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: lastLine,
        endColumn: 1,
      });
    }
    return gaps;
  },
} as const;
