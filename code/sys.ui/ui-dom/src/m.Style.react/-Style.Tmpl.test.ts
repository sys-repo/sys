import { describe, it, expect, type t, Testing } from '../-test.ts';
import { Tmpl } from './m.Tmpl.ts';

type N = string | number | null | undefined;

describe('CSS Teamplates', () => {
  it('empty (from Falsy)', () => {
    Testing.FALSY.forEach((v) => expect(Tmpl.transform(v)).to.eql({}));
  });

  it('no change when no <Template> fields found', () => {
    expect(Tmpl.transform({})).to.eql({});
    expect(Tmpl.transform({ fontSize: 16 })).to.eql({ fontSize: 16 });
  });

  describe('CSS Edges (top, right, bottom, left)', () => {
    const assertEdges = (res: t.CSSObject, expected: [N, N, N, N]) => {
      const [top, right, bottom, left] = expected;
      expect(res.top).to.eql(top);
      expect(res.right).to.eql(right);
      expect(res.bottom).to.eql(bottom);
      expect(res.left).to.eql(left);
    };

    describe('Tmpl.toEdges', () => {
      it('empty', () => {
        expect(Tmpl.toEdges()).to.eql({});
        expect(Tmpl.toEdges(null)).to.eql({});
        expect(Tmpl.toEdges(undefined)).to.eql({});
        expect(Tmpl.toEdges(false)).to.eql({});
      });

      it('single value', () => {
        assertEdges(Tmpl.toEdges(0), [0, 0, 0, 0]);
        assertEdges(Tmpl.toEdges(-1), [-1, -1, -1, -1]);
        assertEdges(Tmpl.toEdges(5), [5, 5, 5, 5]);
        assertEdges(Tmpl.toEdges('3em'), ['3em', '3em', '3em', '3em']);
        assertEdges(Tmpl.toEdges('10 20em 30px 40'), [10, '20em', '30px', 40]);
        assertEdges(Tmpl.toEdges('10 20em'), [10, '20em', 10, '20em']);
      });

      it('array values', () => {
        expect(Tmpl.toEdges([10])).to.eql({ top: 10, right: 10, bottom: 10, left: 10 });
        expect(Tmpl.toEdges([10, 20])).to.eql({ top: 10, right: 20, bottom: 10, left: 20 });
        expect(Tmpl.toEdges(['3em', 20])).to.eql({
          top: '3em',
          right: 20,
          bottom: '3em',
          left: 20,
        });
        expect(Tmpl.toEdges([1, 2, 3] as any)).to.eql({ top: 1, right: 2, bottom: 3 });
        expect(Tmpl.toEdges([0, null, '2px', 30])).to.eql({ top: 0, bottom: '2px', left: 30 });
      });

      it('with mutation callback', () => {
        const edges: (keyof t.CssEdges)[] = [];
        const res = Tmpl.toEdges([1, 2, 3, 4], (e) => {
          edges.push(e.current.edge);
          const value = e.current.value;
          e.changeValue(typeof value === 'number' ? value + 1 : value);
        });
        assertEdges(res, [2, 3, 4, 5]);
        expect(edges).to.eql(['top', 'right', 'bottom', 'left']);
      });
    });

    describe('{ Absolute } → position: "absolute"', () => {
      const assert = (res: t.CSSObject, expected: [N, N, N, N]) => {
        assertEdges(res, expected);
        expect(res.Absolute).to.eql(undefined);
        expect(res.position).to.eql('absolute');
      };

      it('single value', () => {
        expect(Tmpl.transform({ Absolute: null })).to.eql({ position: 'absolute' });
        assert(Tmpl.transform({ Absolute: 0 }), [0, 0, 0, 0]);
        assert(Tmpl.transform({ Absolute: -1 }), [-1, -1, -1, -1]);
        assert(Tmpl.transform({ Absolute: '3em' }), ['3em', '3em', '3em', '3em']);
      });

      it('array value', () => {
        assert(Tmpl.transform({ Absolute: [10, null, '5em', -5] }), [10, undefined, '5em', -5]);
      });

      it('multi-part string value', () => {
        const res = Tmpl.transform({ Absolute: '10 20em 30px 40' });
        expect(res.position).to.equal('absolute');
        expect(res.top).to.equal(10);
        expect(res.right).to.equal('20em');
        expect(res.bottom).to.equal('30px');
        expect(res.left).to.equal(40);
      });
    });

    describe('{ Margin, MarginX, MarginY }', () => {
      const assert = (res: t.CSSObject, expected: [N, N, N, N]) => {
        const [top, right, bottom, left] = expected;
        expect(res.marginTop).to.eql(top);
        expect(res.marginRight).to.eql(right);
        expect(res.marginBottom).to.eql(bottom);
        expect(res.marginLeft).to.eql(left);
      };

      it('Margin: single value', () => {
        assert(Tmpl.transform({ Margin: 0 }), [0, 0, 0, 0]);
        assert(Tmpl.transform({ Margin: -1 }), [-1, -1, -1, -1]);
        assert(Tmpl.transform({ Margin: '3em' }), ['3em', '3em', '3em', '3em']);
      });

      it('Margin: array value', () => {
        assert(Tmpl.transform({ Margin: [10, null, '5em', -5] }), [10, undefined, '5em', -5]);
      });

      it('Margin: multi-part string value', () => {
        const res = Tmpl.transform({ Margin: '10 20em 30px 40' });
        expect(res.marginTop).to.equal(10);
        expect(res.marginRight).to.equal('20em');
        expect(res.marginBottom).to.equal('30px');
        expect(res.marginLeft).to.equal(40);
      });

      it('MarginX: (left/right)', () => {
        assert(Tmpl.transform({ MarginX: null }), [undefined, undefined, undefined, undefined]);
        assert(Tmpl.transform({ MarginX: 5 }), [undefined, 5, undefined, 5]);
        assert(Tmpl.transform({ MarginX: [5] }), [undefined, 5, undefined, 5]);
        assert(Tmpl.transform({ MarginX: [10, 20] }), [undefined, 20, undefined, 10]);
      });

      it('MarginY: (top/bottom)', () => {
        assert(Tmpl.transform({ MarginY: null }), [undefined, undefined, undefined, undefined]);
        assert(Tmpl.transform({ MarginY: 5 }), [5, undefined, 5, undefined]);
        assert(Tmpl.transform({ MarginY: [5] }), [5, undefined, 5, undefined]);
        assert(Tmpl.transform({ MarginY: [10, 20] }), [10, undefined, 20, undefined]);
      });
    });

    describe('{ Padding, PaddingX, PaddingY }', () => {
      const assert = (res: t.CSSObject, expected: [N, N, N, N]) => {
        const [top, right, bottom, left] = expected;
        expect(res.paddingTop).to.eql(top);
        expect(res.paddingRight).to.eql(right);
        expect(res.paddingBottom).to.eql(bottom);
        expect(res.paddingLeft).to.eql(left);
      };

      it('Padding: single value', () => {
        assert(Tmpl.transform({ Padding: 0 }), [0, 0, 0, 0]);
        assert(Tmpl.transform({ Padding: -1 }), [-1, -1, -1, -1]);
        assert(Tmpl.transform({ Padding: '3em' }), ['3em', '3em', '3em', '3em']);
      });

      it('Padding: array value', () => {
        assert(Tmpl.transform({ Padding: [10, null, '5em', -5] }), [10, undefined, '5em', -5]);
      });

      it('Padding: multi-part string value', () => {
        const res = Tmpl.transform({ Padding: '10 20em 30px 40' });
        expect(res.paddingTop).to.equal(10);
        expect(res.paddingRight).to.equal('20em');
        expect(res.paddingBottom).to.equal('30px');
        expect(res.paddingLeft).to.equal(40);
      });

      it('PaddingX: (left/right)', () => {
        assert(Tmpl.transform({ PaddingX: null }), [undefined, undefined, undefined, undefined]);
        assert(Tmpl.transform({ PaddingX: 5 }), [undefined, 5, undefined, 5]);
        assert(Tmpl.transform({ PaddingX: [5] }), [undefined, 5, undefined, 5]);
        assert(Tmpl.transform({ PaddingX: [10, 20] }), [undefined, 20, undefined, 10]);
      });

      it('PaddingY: (top/bottom)', () => {
        assert(Tmpl.transform({ PaddingY: null }), [undefined, undefined, undefined, undefined]);
        assert(Tmpl.transform({ PaddingY: 5 }), [5, undefined, 5, undefined]);
        assert(Tmpl.transform({ PaddingY: [5] }), [5, undefined, 5, undefined]);
        assert(Tmpl.transform({ PaddingY: [10, 20] }), [10, undefined, 20, undefined]);
      });
    });
  });
});
