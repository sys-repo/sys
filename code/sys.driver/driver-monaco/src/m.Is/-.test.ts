import { type t, Obj, describe, expect, it } from '../-test.ts';
import { D } from '../common.ts';
import { Monaco, Util } from '../m.Monaco/mod.ts';
import { EditorIs } from './mod.ts';

type IRange = t.Monaco.I.IRange;
type IPosition = t.Monaco.I.IPosition;

describe('Is', () => {
  const Is = EditorIs;
  const asRange = Util.Range.asRange;

  it('API', () => {
    expect(Monaco.Is).to.equal(EditorIs);
  });

  it('Is.editorRange', () => {
    const test = (input: any, expected: boolean) => {
      const res = Is.editorRange(input);
      expect(res).to.eql(expected);
    };

    const range: IRange = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    };
    test(range, true);
    [null, undefined, '', 123, [], {}, true].forEach((input) => test(input, false));
  });

  it('Is.charPositionTuple', () => {
    const test = (input: any, expected: boolean) => {
      const res = Is.charPositionTuple(input);
      expect(res).to.eql(expected);
    };

    const tuple: t.CharPosTuple = [2, 5];
    test(tuple, true);
    [null, undefined, '', 123, [], {}, true].forEach((input) => test(input, false));
  });

  it('Is.nullRange', () => {
    expect(Is.nullRange(asRange([1, 5]))).to.eql(false);
    expect(Is.nullRange(D.NULL_RANGE)).to.eql(true);
  });

  it('Is.singleCharRange', () => {
    const range1 = asRange([1, 5]);
    const range2 = asRange([1, 5, 1, 6]);

    expect(Is.singleCharRange(range1)).to.eql(true);
    expect(Is.singleCharRange(range2)).to.eql(false);
  });

  it('Is.rangeWithinText', () => {
    const test = (expected: boolean, range: t.EditorRangeInput, text: string) => {
      const res = Is.rangeWithinString(range, text);
      expect(res).to.eql(expected);
    };

    test(false, null, 'hello');
    test(false, [-1, -1], 'hello');

    test(true, [1, 6], 'hello');
    test(false, [1, 7], 'hello');

    test(true, [1, 1], '');
    test(false, [1, 2], '');

    test(true, [1, 1], 'h');
    test(true, [1, 2], 'h');
    test(false, [1, 3], 'h');
  });

  describe('Is.positionEqual', () => {
    it('same reference', () => {
      const p: IPosition = { lineNumber: 3, column: 9 };
      expect(Is.posEqual(p, p)).to.eql(true); // identity fast-path
    });

    it('structural equality (different refs)', () => {
      const a: IPosition = { lineNumber: 1, column: 1 };
      const b: IPosition = { lineNumber: 1, column: 1 };
      expect(Is.posEqual(a, b)).to.eql(true);
    });

    it('different line or column', () => {
      const a: IPosition = { lineNumber: 2, column: 5 };
      const b1: IPosition = { lineNumber: 3, column: 5 };
      const b2: IPosition = { lineNumber: 2, column: 6 };
      expect(Is.posEqual(a, b1)).to.eql(false);
      expect(Is.posEqual(a, b2)).to.eql(false);
    });

    it('undefined cases', () => {
      const a: IPosition = { lineNumber: 1, column: 1 };
      expect(Is.posEqual(undefined, undefined)).to.eql(false);
      expect(Is.posEqual(a, undefined)).to.eql(false);
      expect(Is.posEqual(undefined, a)).to.eql(false);
    });
  });

  describe('Is.rangeEqual', () => {
    it('same reference', () => {
      const r: IRange = {
        startLineNumber: 1,
        startColumn: 2,
        endLineNumber: 1,
        endColumn: 4,
      };
      expect(Is.rangeEqual(r, r)).to.eql(true); // identity fast-path
    });

    it('structural equality (different refs)', () => {
      const a: IRange = {
        startLineNumber: 10,
        startColumn: 2,
        endLineNumber: 10,
        endColumn: 8,
      };
      const b: IRange = {
        startLineNumber: 10,
        startColumn: 2,
        endLineNumber: 10,
        endColumn: 8,
      };
      expect(Is.rangeEqual(a, b)).to.eql(true);
    });

    it('any differing field → false', () => {
      const base: IRange = {
        startLineNumber: 5,
        startColumn: 3,
        endLineNumber: 6,
        endColumn: 7,
      };
      const diffStartLine: IRange = { ...base, startLineNumber: 6 };
      const diffStartCol: IRange = { ...base, startColumn: 4 };
      const diffEndLine: IRange = { ...base, endLineNumber: 7 };
      const diffEndCol: IRange = { ...base, endColumn: 8 };

      expect(Is.rangeEqual(base, diffStartLine)).to.eql(false);
      expect(Is.rangeEqual(base, diffStartCol)).to.eql(false);
      expect(Is.rangeEqual(base, diffEndLine)).to.eql(false);
      expect(Is.rangeEqual(base, diffEndCol)).to.eql(false);
    });

    it('undefined cases', () => {
      const r: IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
      };
      expect(Is.rangeEqual(undefined, undefined)).to.eql(false);
      expect(Is.rangeEqual(r, undefined)).to.eql(false);
      expect(Is.rangeEqual(undefined, r)).to.eql(false);
    });
  });

  describe('Is.cursorEqual', () => {
    const idA = 'e1' as t.StringId;
    const idB = 'e2' as t.StringId;

    const pos = (lineNumber: number, column: number): t.Monaco.I.IPosition => ({
      lineNumber,
      column,
    });
    const path = (...segs: t.ObjectPath) => segs as t.ObjectPath;

    const base = (over: Partial<t.EditorCursor> = {}): t.EditorCursor => ({
      editorId: idA,
      path: path('root', 'a'),
      position: pos(3, 7),
      offset: 123,
      word: undefined,
      ...over,
    });

    it('same reference', () => {
      const a = base();
      expect(Is.cursorEqual(a, a)).to.eql(true);
    });

    it('structural equality (different refs)', () => {
      const a = base();
      const b = base();
      expect(Is.cursorEqual(a, b)).to.eql(true);
    });

    it('different editorId → false', () => {
      const a = base();
      const b = base({ editorId: idB });
      expect(Is.cursorEqual(a, b)).to.eql(false);
    });

    it('different offset → false', () => {
      const a = base();
      const b = base({ offset: a.offset! + 1 });
      expect(Is.cursorEqual(a, b)).to.eql(false);
    });

    it('different position (line) → false', () => {
      const a = base();
      const b = base({ position: pos(a.position!.lineNumber + 1, a.position!.column) });
      expect(Is.cursorEqual(a, b)).to.eql(false);
    });

    it('different position (column) → false', () => {
      const a = base();
      const b = base({ position: pos(a.position!.lineNumber, a.position!.column + 1) });
      expect(Is.cursorEqual(a, b)).to.eql(false);
    });

    it('different path → false', () => {
      const a = base({ path: path('root', 'a') });
      const b = base({ path: path('root', 'b') });
      expect(Is.cursorEqual(a, b)).to.eql(false);
    });

    it('equal when word differs (word is ignored)', () => {
      const a = base({
        word: { startLineNumber: 3, startColumn: 7, endLineNumber: 3, endColumn: 9 },
      });
      const b = base({ word: undefined });
      expect(Is.cursorEqual(a, b)).to.eql(true);
    });

    it('undefined cases', () => {
      const a = base();
      expect(Is.cursorEqual(undefined, undefined)).to.eql(false);
      expect(Is.cursorEqual(a, undefined)).to.eql(false);
      expect(Is.cursorEqual(undefined, a)).to.eql(false);
    });

    it('path deep equality (same segments different refs)', () => {
      const a = base({ path: ['root', 'x'] as t.ObjectPath });
      const b = base({ path: ['root', 'x'] as t.ObjectPath });
      // sanity: prove our helper sees these as equal
      expect(Obj.Path.Is.eql(a.path, b.path)).to.eql(true);
      expect(Is.cursorEqual(a, b)).to.eql(true);
    });
  });

  describe('Is.posTuple', () => {
    it('returns true for valid [start, end] tuples', () => {
      expect(Is.posTuple([0, 5])).to.eql(true);
      expect(Is.posTuple([1])).to.eql(true);
    });

    it('returns false for non-numeric or malformed inputs', () => {
      expect(Is.posTuple(['a', 2])).to.eql(false);
      expect(Is.posTuple([])).to.eql(false);
      expect(Is.posTuple({})).to.eql(false);
      expect(Is.posTuple(null)).to.eql(false);
      expect(Is.posTuple(undefined)).to.eql(false);
    });
  });

  describe('Is.linePos', () => {
    it('returns true for valid { line, col } objects', () => {
      expect(Is.linePos({ line: 1, col: 2 })).to.eql(true);
    });

    it('returns false for incomplete or invalid objects', () => {
      expect(Is.linePos({ line: 1 })).to.eql(false);
      expect(Is.linePos({ col: 1 })).to.eql(false);
      expect(Is.linePos({ line: '1', col: 2 })).to.eql(false);
      expect(Is.linePos(null)).to.eql(false);
      expect(Is.linePos([])).to.eql(false);
    });
  });

  describe('Is.linePosPair', () => {
    const lp = (l: number, c: number): t.LinePos => ({ line: l, col: c });

    it('returns true for [start, end] pairs of valid line/col objects', () => {
      expect(Is.linePosPair([lp(1, 2), lp(3, 4)])).to.eql(true);
    });

    it('returns true for [start, undefined] pairs', () => {
      expect(Is.linePosPair([lp(1, 2), undefined])).to.eql(true);
    });

    it('returns false for single-element arrays', () => {
      expect(Is.linePosPair([lp(1, 2)])).to.eql(false);
    });

    it('returns false for invalid element shapes', () => {
      expect(Is.linePosPair([{ line: 1 }, { line: 2, col: 3 }])).to.eql(false);
      expect(Is.linePosPair([{}, {}])).to.eql(false);
      expect(Is.linePosPair(null)).to.eql(false);
      expect(Is.linePosPair([])).to.eql(false);
    });
  });
});
