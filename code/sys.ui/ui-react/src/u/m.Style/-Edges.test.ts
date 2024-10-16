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
  });

  it('toArrayY', () => {
    const test = (input: any, expected: t.CssEdgesArray) => {
      const res = Edges.toArrayY(input);
      expect(res).to.eql(expected, input);
    };
    test(0, [0, null, 0, null]);
    test([0], [0, null, 0, null]);
    test([10, 20], [10, null, 20, null]);
  });
});
