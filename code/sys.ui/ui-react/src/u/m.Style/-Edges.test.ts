import { describe, expect, it, type t } from '../../-test.ts';
import { Edges, Style } from './mod.ts';

describe('Edges', () => {
  it('API', () => {
    expect(Style.Edges).to.equal(Edges);
  });

  it('toArray', () => {
    const test = (input: any, expected: t.CssEdgesArray) => {
      const res = Edges.toArray(input);
      expect(res).to.eql(expected, input);
    };

    test(0, [0, 0, 0, 0]);
    test(null, [null, null, null, null]);
    test(undefined, [null, null, null, null]);
    test(-10, [-10, -10, -10, -10]);
    test([5], [5, 5, 5, 5]);
    test([null], [null, null, null, null]);

    test([1, '2px', null, undefined], [1, '2px', null, null]);
    test([10, 20], [10, 20, 10, 20]);
    test([null, 20], [null, 20, null, 20]);
    test(['', '2px', 0, ' '], [null, '2px', 0, ' ']);

    const NON = ['', true, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, [null, null, null, null]));
  });

  it('toArrayX', () => {
    const test = (input: any, expected: t.CssEdgesArray) => {
      const res = Edges.toArrayX(input);
      expect(res).to.eql(expected, input);
    };
    test(0, [null, 0, null, 0]);
    test([0], [null, 0, null, 0]);
    test([123], [null, 123, null, 123]);
    test([10, 20], [null, 20, null, 10]);
    test([10, '5em'], [null, '5em', null, 10]);
  });

  it('toArrayY', () => {
    const test = (input: any, expected: t.CssEdgesArray) => {
      const res = Edges.toArrayY(input);
      expect(res).to.eql(expected, input);
    };
    test(0, [0, null, 0, null]);
    test([0], [0, null, 0, null]);
    test([10, 20], [10, null, 20, null]);
    test([10, '5em'], [10, null, '5em', null]);
  });

  it('custom default value ← (replaces <undefined>, null means <null>)', () => {
    const test = (input: t.CssEdgesInput, def: any, expected: t.CssEdgesArray) => {
      const res = Edges.toArray(input, def);
      expect(res).to.eql(expected, input);
    };
    const testX = (input: t.CssEdgesXYInput, def: any, expected: t.CssEdgesArray) => {
      const res = Edges.toArrayX(input, def);
      expect(res).to.eql(expected, input);
    };
    const testY = (input: t.CssEdgesXYInput, def: any, expected: t.CssEdgesArray) => {
      const res = Edges.toArrayY(input, def);
      expect(res).to.eql(expected, input);
    };

    test(undefined, 5, [5, 5, 5, 5]);
    test([undefined], 5, [5, 5, 5, 5]);
    test([undefined, undefined], 5, [5, 5, 5, 5]);
    test([undefined, null], 5, [5, null, 5, null]);
    test(null, undefined, [null, null, null, null]);
    test([1, '2px', null, undefined], '5px', [1, '2px', null, '5px']);

    testX([undefined, null], '1px', [null, null, null, '1px']);
    testX([undefined], '1px', [null, '1px', null, '1px']);
    testX(undefined, '1px', [null, '1px', null, '1px']);
    testX(null, '1px', [null, null, null, null]);

    testY([undefined, null], '1px', ['1px', null, null, null]);
    testY([undefined], '1px', ['1px', null, '1px', null]);
    testY(undefined, '1px', ['1px', null, '1px', null]);
    testY(null, '1px', [null, null, null, null]);
  });
});
