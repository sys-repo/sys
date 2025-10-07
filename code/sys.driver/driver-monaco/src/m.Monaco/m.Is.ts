import { type t, D, Is, Obj, R } from './common.ts';
import { RangeUtil } from './u.Range.ts';

type IRange = t.Monaco.I.IRange;
type IPosition = t.Monaco.I.IPosition;

export const MonacoIs: t.EditorIsLib = {
  editorRange(input: any): input is IRange {
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

  nullRange(input: IRange): boolean {
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

  positionEqual(a?: IPosition, b?: IPosition): boolean {
    if (!a || !b) return false; //  guard undefined/null first
    if (a === b) return true; //    identity fast-path (both defined)
    return a.lineNumber === b.lineNumber && a.column === b.column;
  },

  rangeEqual(a?: IRange, b?: IRange): boolean {
    if (!a || !b) return false; //  guard undefined/null first
    if (a === b) return true; //    identity fast-path (both defined)
    return (
      a.startLineNumber === b.startLineNumber &&
      a.startColumn === b.startColumn &&
      a.endLineNumber === b.endLineNumber &&
      a.endColumn === b.endColumn
    );
  },

  cursorEqual(a?: t.EditorCursor, b?: t.EditorCursor): boolean {
    if (!a || !b) return false;
    if (a === b) return true;

    if (a.editorId !== b.editorId) return false;
    if (a.offset !== b.offset) return false;
    if (!MonacoIs.positionEqual(a.position, b.position)) return false;

    if (!Obj.Path.Is.eql(a.path, b.path)) return false;
    return true;
  },
};
