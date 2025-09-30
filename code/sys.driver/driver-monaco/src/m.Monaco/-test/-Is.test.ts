import { type t, describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { Monaco, MonacoIs } from '../mod.ts';
import { Util } from '../u.ts';

type IRange = t.Monaco.I.IRange;
type IPosition = t.Monaco.I.IPosition;

describe('Is', () => {
  const Is = MonacoIs;
  const asRange = Util.Range.asRange;

  it('API', () => {
    expect(Monaco.Is).to.equal(MonacoIs);
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

    const tuple: t.CharPositionTuple = [2, 5];
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
      expect(Is.positionEqual(p, p)).to.eql(true); // identity fast-path
    });

    it('structural equality (different refs)', () => {
      const a: IPosition = { lineNumber: 1, column: 1 };
      const b: IPosition = { lineNumber: 1, column: 1 };
      expect(Is.positionEqual(a, b)).to.eql(true);
    });

    it('different line or column', () => {
      const a: IPosition = { lineNumber: 2, column: 5 };
      const b1: IPosition = { lineNumber: 3, column: 5 };
      const b2: IPosition = { lineNumber: 2, column: 6 };
      expect(Is.positionEqual(a, b1)).to.eql(false);
      expect(Is.positionEqual(a, b2)).to.eql(false);
    });

    it('undefined cases', () => {
      const a: IPosition = { lineNumber: 1, column: 1 };
      expect(Is.positionEqual(undefined, undefined)).to.eql(false);
      expect(Is.positionEqual(a, undefined)).to.eql(false);
      expect(Is.positionEqual(undefined, a)).to.eql(false);
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
});
