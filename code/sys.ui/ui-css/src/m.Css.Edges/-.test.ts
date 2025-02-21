import { describe, expect, it, type t } from '../-test.ts';
import { CssEdges } from './mod.ts';

describe('Css: Edges', () => {
  describe('toArray', () => {
    it('toArray', () => {
      const test = (input: any, expected: t.CssEdgesArray) => {
        const res = CssEdges.toArray(input);
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
        const res = CssEdges.toArrayX(input);
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
        const res = CssEdges.toArrayY(input);
        expect(res).to.eql(expected, input);
      };
      test(0, [0, null, 0, null]);
      test([0], [0, null, 0, null]);
      test([10, 20], [10, null, 20, null]);
      test([10, '5em'], [10, null, '5em', null]);
    });

    it('custom default value ← (replaces <undefined>, null means <null>)', () => {
      const test = (input: t.CssEdgesInput, def: any, expected: t.CssEdgesArray) => {
        const res = CssEdges.toArray(input, def);
        expect(res).to.eql(expected, input);
      };
      const testX = (input: t.CssEdgesXYInput, def: any, expected: t.CssEdgesArray) => {
        const res = CssEdges.toArrayX(input, def);
        expect(res).to.eql(expected, input);
      };
      const testY = (input: t.CssEdgesXYInput, def: any, expected: t.CssEdgesArray) => {
        const res = CssEdges.toArrayY(input, def);
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

  describe('Edges.toEdges', () => {
    it('undefined => undefined', () => {
      expect(CssEdges.toEdges(undefined)).to.eql({});
    });

    it('null => undefined', () => {
      expect(CssEdges.toEdges(null)).to.eql({});
    });

    it('[] => undefined', () => {
      expect(CssEdges.toEdges([])).to.eql({});
    });

    it('"" => undefined', () => {
      expect(CssEdges.toEdges('')).to.eql({});
      expect(CssEdges.toEdges('  ')).to.eql({});
    });

    it('[null, null, null, null] => undefined', () => {
      expect(CssEdges.toEdges([null, null, null, null])).to.eql({});
    });

    it('[null, null] => undefined', () => {
      expect(CssEdges.toEdges([null, null])).to.eql({});
    });

    it('defaultValue', () => {
      const expected = { top: 10, right: 10, bottom: 10, left: 10 };
      expect(CssEdges.toEdges(undefined, { defaultValue: 10 })).to.eql(expected);
      expect(CssEdges.toEdges([], { defaultValue: 10 })).to.eql(expected);
      expect(CssEdges.toEdges([null], { defaultValue: 10 })).to.eql(expected);
      expect(CssEdges.toEdges([null, null], { defaultValue: 10 })).to.eql(expected);
    });

    it('"0 10px 6em 9%"', () => {
      expect(CssEdges.toEdges('0 10px 6em 9%')).to.eql({
        top: 0,
        right: 10,
        bottom: '6em',
        left: '9%',
      });
    });

    it('"20px 5em"', () => {
      expect(CssEdges.toEdges('20px 5em')).to.eql({
        top: 20,
        right: '5em',
        bottom: 20,
        left: '5em',
      });
    });

    it('0', () => {
      expect(CssEdges.toEdges(0)).to.eql({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });
    });

    it('10', () => {
      expect(CssEdges.toEdges(10)).to.eql({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      });
    });

    it('"10px"', () => {
      expect(CssEdges.toEdges('10px')).to.eql({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      });
    });

    it('"5em"', () => {
      expect(CssEdges.toEdges('5em')).to.eql({
        top: '5em',
        right: '5em',
        bottom: '5em',
        left: '5em',
      });
    });

    it('[10, 20, 30, 40]', () => {
      expect(CssEdges.toEdges([10, 20, 30, 40])).to.eql({
        top: 10,
        right: 20,
        bottom: 30,
        left: 40,
      });
    });

    it('[10, null, "30%", "40px"]', () => {
      expect(CssEdges.toEdges([10, null, '30%', '40px'])).to.eql({
        top: 10,
        right: undefined,
        bottom: '30%',
        left: 40,
      });
    });

    it('[10, 20]', () => {
      expect(CssEdges.toEdges([10, 20])).to.eql({
        top: 10,
        right: 20,
        bottom: 10,
        left: 20,
      });
    });

    it('[null, 20]', () => {
      expect(CssEdges.toEdges([null, 20])).to.eql({
        top: undefined,
        right: 20,
        bottom: undefined,
        left: 20,
      });
    });

    it('[10, null]', () => {
      expect(CssEdges.toEdges([10, null])).to.eql({
        top: 10,
        right: undefined,
        bottom: 10,
        left: undefined,
      });
    });
  });

  describe('toMargins', () => {
    it('none', () => {
      expect(CssEdges.toMargins()).to.eql({});
      expect(CssEdges.toMargins(null)).to.eql({});
    });

    it('all edges', () => {
      expect(CssEdges.toMargins(10)).to.eql({
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        marginLeft: 10,
      });
      expect(CssEdges.toMargins([10, 20, 30, 40])).to.eql({
        marginTop: 10,
        marginRight: 20,
        marginBottom: 30,
        marginLeft: 40,
      });
    });

    it('Y/X', () => {
      const res = CssEdges.toMargins([10, 20]);
      expect(res).to.eql({ marginTop: 10, marginRight: 20, marginBottom: 10, marginLeft: 20 });
    });

    it('defaultValue', () => {
      const expected = { marginTop: 10, marginRight: 10, marginBottom: 10, marginLeft: 10 };
      expect(CssEdges.toMargins(undefined, { defaultValue: 10 })).to.eql(expected);
      expect(CssEdges.toMargins([], { defaultValue: 10 })).to.eql(expected);
      expect(CssEdges.toMargins([null], { defaultValue: 10 })).to.eql(expected);
    });
  });

  describe('toPadding', () => {
    it('none', () => {
      expect(CssEdges.toPadding()).to.eql({});
      expect(CssEdges.toPadding(null)).to.eql({});
    });

    it('all edges', () => {
      expect(CssEdges.toPadding(10)).to.eql({
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 10,
      });
      expect(CssEdges.toPadding([10, 20, 30, 40])).to.eql({
        paddingTop: 10,
        paddingRight: 20,
        paddingBottom: 30,
        paddingLeft: 40,
      });
    });

    it('Y/X', () => {
      const res = CssEdges.toPadding([10, 20]);
      expect(res).to.eql({ paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20 });
    });

    it('defaultValue', () => {
      const expected = { paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10 };
      expect(CssEdges.toPadding(undefined, { defaultValue: 10 })).to.eql(expected);
      expect(CssEdges.toPadding([], { defaultValue: 10 })).to.eql(expected);
      expect(CssEdges.toPadding([null], { defaultValue: 10 })).to.eql(expected);
    });
  });
});
