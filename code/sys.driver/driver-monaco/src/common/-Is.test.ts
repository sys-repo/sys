import { describe, expect, it, type t } from '../-test.ts';
import { D, Is } from './mod.ts';
import { Wrangle } from './u.Wrangle.ts';

describe('Is', () => {
  const asRange = Wrangle.Range.asRange;

  it('Is.editorRange', () => {
    const test = (input: any, expected: boolean) => {
      const res = Is.editorRange(input);
      expect(res).to.eql(expected);
    };

    const range: t.EditorRange = {
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
});
