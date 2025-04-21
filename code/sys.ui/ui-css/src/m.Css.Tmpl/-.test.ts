import { type t, describe, expect, it, Testing } from '../-test.ts';
import { CssTmpl } from './mod.ts';

type N = string | number | null | undefined;

describe('CssTmpl: template transforms', () => {
  const assertEdges = (res: t.CssProps, expected: [N, N, N, N]) => {
    const [top, right, bottom, left] = expected;
    expect(res.top).to.eql(top);
    expect(res.right).to.eql(right);
    expect(res.bottom).to.eql(bottom);
    expect(res.left).to.eql(left);
  };

  const assertKeyExists = (expected: boolean, key: keyof t.CssTemplates, props: t.CssProps) => {
    const exists = Object.keys(props).includes(key);
    expect(exists).to.eql(expected);
  };

  it('empty (from Falsy)', () => {
    Testing.FALSY.forEach((v) => expect(CssTmpl.transform(v)).to.eql({}));
  });

  it('no change when no <Template> fields found', () => {
    expect(CssTmpl.transform({})).to.eql({});
    expect(CssTmpl.transform({ fontSize: 16 })).to.eql({ fontSize: 16 });
  });

  describe('cleaning template input', () => {
    const assertNoKey = (key: keyof t.CssTemplates, subject: t.CssValue) => {
      const exists = Object.keys(subject).includes(String(key));
      expect(exists).to.eql(false, key);
    };

    it('single property transform', () => {
      const transform = CssTmpl.transform;
      assertNoKey('Absolute', transform({ Absolute: 10 }));
      assertNoKey('Margin', transform({ Margin: 10 }));
      assertNoKey('MarginX', transform({ MarginX: [5] }));
      assertNoKey('MarginY', transform({ MarginY: [1, 2] }));
      assertNoKey('Padding', transform({ Padding: 10 }));
      assertNoKey('PaddingX', transform({ PaddingX: [0] }));
      assertNoKey('PaddingY', transform({ PaddingY: 4 }));
      assertNoKey('Size', transform({ Size: [20, 30] }));
    });

    it('multi-property {object} transform', () => {
      const o = CssTmpl.transform({
        Absolute: 10,
        Margin: 9,
        MarginX: [5],
        MarginY: [1, 2],
        Padding: 10,
        PaddingX: [0],
        PaddingY: 4,
        Size: [20, 30],
      });
      assertNoKey('Absolute', o);
      assertNoKey('Margin', o);
      assertNoKey('MarginX', o);
      assertNoKey('MarginY', o);
      assertNoKey('Padding', o);
      assertNoKey('PaddingX', o);
      assertNoKey('PaddingY', o);
      assertNoKey('Size', o);
    });
  });

  describe('CssTmpl.toEdges', () => {
    it('empty', () => {
      expect(CssTmpl.toEdges()).to.eql({});
      expect(CssTmpl.toEdges(null)).to.eql({});
      expect(CssTmpl.toEdges(undefined)).to.eql({});
      expect(CssTmpl.toEdges(false)).to.eql({});
    });

    it('single value', () => {
      assertEdges(CssTmpl.toEdges(0), [0, 0, 0, 0]);
      assertEdges(CssTmpl.toEdges(-1), [-1, -1, -1, -1]);
      assertEdges(CssTmpl.toEdges(5), [5, 5, 5, 5]);
      assertEdges(CssTmpl.toEdges('3em'), ['3em', '3em', '3em', '3em']);
      assertEdges(CssTmpl.toEdges('10 20em 30px 40'), [10, '20em', '30px', 40]);
      assertEdges(CssTmpl.toEdges('10 20em'), [10, '20em', 10, '20em']);
    });

    it('array values', () => {
      expect(CssTmpl.toEdges([10])).to.eql({ top: 10, right: 10, bottom: 10, left: 10 });
      expect(CssTmpl.toEdges([10, 20])).to.eql({ top: 10, right: 20, bottom: 10, left: 20 });
      expect(CssTmpl.toEdges(['3em', 20])).to.eql({
        top: '3em',
        right: 20,
        bottom: '3em',
        left: 20,
      });
      expect(CssTmpl.toEdges([1, 2, 3] as any)).to.eql({ top: 1, right: 2, bottom: 3 });
      expect(CssTmpl.toEdges([0, null, '2px', 30])).to.eql({ top: 0, bottom: '2px', left: 30 });
    });

    it('with mutation callback', () => {
      const edges: (keyof t.CssEdges)[] = [];
      const res = CssTmpl.toEdges([1, 2, 3, 4], (e) => {
        edges.push(e.current.edge);
        const value = e.current.value;
        e.changeValue(typeof value === 'number' ? value + 1 : value);
      });
      assertEdges(res, [2, 3, 4, 5]);
      expect(edges).to.eql(['top', 'right', 'bottom', 'left']);
    });
  });

  describe('{ Absolute } → position: "absolute"', () => {
    const assert = (res: t.CssValue, expected: [N, N, N, N]) => {
      assertEdges(res, expected);
      expect(res.Absolute).to.eql(undefined);
      expect(res.position).to.eql('absolute');
    };

    it('single value', () => {
      expect(CssTmpl.transform({ Absolute: null })).to.eql({ position: 'absolute' });
      assert(CssTmpl.transform({ Absolute: 0 }), [0, 0, 0, 0]);
      assert(CssTmpl.transform({ Absolute: -1 }), [-1, -1, -1, -1]);
      assert(CssTmpl.transform({ Absolute: '3em' }), ['3em', '3em', '3em', '3em']);
    });

    it('array value', () => {
      assert(CssTmpl.transform({ Absolute: [10, null, '5em', -5] }), [10, undefined, '5em', -5]);
    });

    it('multi-part string value', () => {
      const res = CssTmpl.transform({ Absolute: '10 20em 30px 40' });
      expect(res.position).to.equal('absolute');
      expect(res.top).to.equal(10);
      expect(res.right).to.equal('20em');
      expect(res.bottom).to.equal('30px');
      expect(res.left).to.equal(40);
    });
  });

  describe('{ Margin, MarginX, MarginY }', () => {
    const assert = (res: t.CssProps, expected: [N, N, N, N]) => {
      const [top, right, bottom, left] = expected;
      expect(res.marginTop).to.eql(top);
      expect(res.marginRight).to.eql(right);
      expect(res.marginBottom).to.eql(bottom);
      expect(res.marginLeft).to.eql(left);
    };

    it('removes key', () => {
      assertKeyExists(false, 'Margin', CssTmpl.transform({ Margin: 0 }));
      assertKeyExists(false, 'MarginX', CssTmpl.transform({ MarginX: [1, 2] }));
      assertKeyExists(false, 'MarginY', CssTmpl.transform({ MarginY: [4, 5] }));
    });

    it('Margin: single value', () => {
      assert(CssTmpl.transform({ Margin: 0 }), [0, 0, 0, 0]);
      assert(CssTmpl.transform({ Margin: -1 }), [-1, -1, -1, -1]);
      assert(CssTmpl.transform({ Margin: '3em' }), ['3em', '3em', '3em', '3em']);
    });

    it('Margin: array value', () => {
      assert(CssTmpl.transform({ Margin: [10, null, '5em', -5] }), [10, undefined, '5em', -5]);
    });

    it('Margin: multi-part string value', () => {
      const res = CssTmpl.transform({ Margin: '10 20em 30px 40' });
      expect(res.marginTop).to.equal(10);
      expect(res.marginRight).to.equal('20em');
      expect(res.marginBottom).to.equal('30px');
      expect(res.marginLeft).to.equal(40);
    });

    it('MarginX: (left/right)', () => {
      assert(CssTmpl.transform({ MarginX: null }), [undefined, undefined, undefined, undefined]);
      assert(CssTmpl.transform({ MarginX: 5 }), [undefined, 5, undefined, 5]);
      assert(CssTmpl.transform({ MarginX: [5] }), [undefined, 5, undefined, 5]);
      assert(CssTmpl.transform({ MarginX: [10, 20] }), [undefined, 20, undefined, 10]);
    });

    it('MarginY: (top/bottom)', () => {
      assert(CssTmpl.transform({ MarginY: null }), [undefined, undefined, undefined, undefined]);
      assert(CssTmpl.transform({ MarginY: 5 }), [5, undefined, 5, undefined]);
      assert(CssTmpl.transform({ MarginY: [5] }), [5, undefined, 5, undefined]);
      assert(CssTmpl.transform({ MarginY: [10, 20] }), [10, undefined, 20, undefined]);
    });
  });

  describe('{ Padding, PaddingX, PaddingY }', () => {
    const assert = (res: t.CssProps, expected: [N, N, N, N]) => {
      const [top, right, bottom, left] = expected;
      expect(res.paddingTop).to.eql(top);
      expect(res.paddingRight).to.eql(right);
      expect(res.paddingBottom).to.eql(bottom);
      expect(res.paddingLeft).to.eql(left);
    };

    it('removes key', () => {
      assertKeyExists(false, 'Padding', CssTmpl.transform({ Padding: 0 }));
      assertKeyExists(false, 'PaddingX', CssTmpl.transform({ PaddingX: [1, 2] }));
      assertKeyExists(false, 'PaddingY', CssTmpl.transform({ PaddingY: [4, 5] }));
    });

    it('Padding: single value', () => {
      assert(CssTmpl.transform({ Padding: 0 }), [0, 0, 0, 0]);
      assert(CssTmpl.transform({ Padding: -1 }), [-1, -1, -1, -1]);
      assert(CssTmpl.transform({ Padding: '3em' }), ['3em', '3em', '3em', '3em']);
    });

    it('Padding: array value', () => {
      assert(CssTmpl.transform({ Padding: [10, null, '5em', -5] }), [10, undefined, '5em', -5]);
    });

    it('Padding: multi-part string value', () => {
      const res = CssTmpl.transform({ Padding: '10 20em 30px 40' });
      expect(res.paddingTop).to.equal(10);
      expect(res.paddingRight).to.equal('20em');
      expect(res.paddingBottom).to.equal('30px');
      expect(res.paddingLeft).to.equal(40);
    });

    it('PaddingX: (left/right)', () => {
      assert(CssTmpl.transform({ PaddingX: null }), [undefined, undefined, undefined, undefined]);
      assert(CssTmpl.transform({ PaddingX: 5 }), [undefined, 5, undefined, 5]);
      assert(CssTmpl.transform({ PaddingX: [5] }), [undefined, 5, undefined, 5]);
      assert(CssTmpl.transform({ PaddingX: [10, 20] }), [undefined, 20, undefined, 10]);
    });

    it('PaddingY: (top/bottom)', () => {
      assert(CssTmpl.transform({ PaddingY: null }), [undefined, undefined, undefined, undefined]);
      assert(CssTmpl.transform({ PaddingY: 5 }), [5, undefined, 5, undefined]);
      assert(CssTmpl.transform({ PaddingY: [5] }), [5, undefined, 5, undefined]);
      assert(CssTmpl.transform({ PaddingY: [10, 20] }), [10, undefined, 20, undefined]);
    });
  });

  describe('{ Size } → width/height', () => {
    type N = number | string | undefined;

    it('nothing', () => {
      const test = (input: t.CssValue['Size'], width: N, height: N) => {
        const res = CssTmpl.transform({ Size: input });
        expect(res.width).to.equal(width);
        expect(res.height).to.equal(height);
      };

      test(null, undefined, undefined);
      test(undefined, undefined, undefined);
      test('', undefined, undefined);
      test('  ', undefined, undefined);
      test([0] as any, undefined, undefined);
      test([] as any, undefined, undefined);
    });

    const test = (input: t.CssValue['Size'], width: N, height: N) => {
      const res = CssTmpl.transform({ Size: input });
      expect(res.width).to.equal(width);
      expect(res.height).to.equal(height);
      assertKeyExists(false, 'Size', res);
    };

    it('number', () => {
      test(50, 50, 50);
      test([50, 50], 50, 50);
      test([10, 20], 10, 20);
      test([10, 20, 999] as any, 10, 20);
    });

    it('string', () => {
      test('5em', '5em', '5em');
      test(['5em', '3px'], '5em', '3px');
      test(['5em', '3px', '99em'] as any, '5em', '3px');
    });

    it('mixed (string | number)', () => {
      test([5, '10em'], 5, '10em');
      test(['10em', 99], '10em', 99);
    });
  });

  describe('{ Scroll }', () => {
    it('Scroll: true', () => {
      const res = CssTmpl.transform({ Scroll: true });
      assertKeyExists(false, 'Scroll', res);
      expect(res).to.eql({
        overflowX: 'hidden',
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
      });
    });

    it('Scroll: false', () => {
      const res = CssTmpl.transform({ Scroll: false });
      expect(res).to.eql({ overflow: 'hidden' });
    });

    it('removes key', () => {
      assertKeyExists(false, 'Scroll', CssTmpl.transform({ Scroll: true }));
      assertKeyExists(false, 'Scroll', CssTmpl.transform({ Scroll: false }));
    });
  });

  describe('Grid: gap | columnCap | rowGap', () => {
    it('transforms numbers to pixel', () => {
      const a = CssTmpl.transform({ rowGap: 0 });
      const b = CssTmpl.transform({ columnGap: 123 });
      const c = CssTmpl.transform({ gap: 10 });

      expect(a.rowGap).to.eql('0px');
      expect(b.columnGap).to.eql('123px');
      expect(c.gap).to.eql('10px');
    });

    it('leaves non-numbers untouched', () => {
      const a = CssTmpl.transform({ rowGap: '0' });
      const b = CssTmpl.transform({ columnGap: '10%' });
      const c = CssTmpl.transform({ gap: '5rem' });

      expect(a.rowGap).to.eql('0');
      expect(b.columnGap).to.eql('10%');
      expect(c.gap).to.eql('5rem');
    });
  });
});
