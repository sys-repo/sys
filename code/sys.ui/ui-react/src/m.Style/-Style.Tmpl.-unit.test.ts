import { describe, it, expect, type t, Testing } from '../-test.ts';
import { Tmpl } from './u.ts';

type N = string | number | null;

describe('CSS Teamplates', () => {
  it('empty (from Falsy)', () => {
    Testing.FALSY.forEach((v) => expect(Tmpl.transform(v)).to.eql({}));
  });

  it('no change when no <Template> fields found', () => {
    expect(Tmpl.transform({})).to.eql({});
    expect(Tmpl.transform({ fontSize: 16 })).to.eql({ fontSize: 16 });
  });

  describe('Tmpl.toEdges', () => {
    const assert = (res: t.CSSObject, top?: N, right?: N, bottom?: N, left?: N) => {
      expect(res).to.eql({ top, right, bottom, left });
    };

    it('empty', () => {
      expect(Tmpl.toEdges()).to.eql({});
      expect(Tmpl.toEdges(null)).to.eql({});
      expect(Tmpl.toEdges(undefined)).to.eql({});
      expect(Tmpl.toEdges(false)).to.eql({});
    });

    it('single value', () => {
      assert(Tmpl.toEdges(0), 0, 0, 0, 0);
      assert(Tmpl.toEdges(5), 5, 5, 5, 5);
      assert(Tmpl.toEdges('3em'), '3em', '3em', '3em', '3em');
      assert(Tmpl.toEdges('10 20em 30px 40'), 10, '20em', '30px', 40);
      assert(Tmpl.toEdges('10 20em'), 10, '20em', 10, '20em');
    });

    it('array values', () => {
      expect(Tmpl.toEdges([10])).to.eql({ top: 10, right: 10, bottom: 10, left: 10 });
      expect(Tmpl.toEdges([10, 20])).to.eql({ top: 10, right: 20, bottom: 10, left: 20 });
      expect(Tmpl.toEdges(['3em', 20])).to.eql({ top: '3em', right: 20, bottom: '3em', left: 20 });
      expect(Tmpl.toEdges([1, 2, 3] as any)).to.eql({ top: 1, right: 2, bottom: 3, left: null });
      expect(Tmpl.toEdges([0, null, '2px', 30])).to.eql({
        top: 0,
        right: null,
        bottom: '2px',
        left: 30,
      });
    });
  });

  describe('{ Absolute } → position: "absolute"', () => {
    const assert = (res: t.CSSObject, top?: N, right?: N, bottom?: N, left?: N) => {
      expect(res).to.eql({ position: 'absolute', top, right, bottom, left });
      expect(res.Absolute).to.eql(undefined);
    };

    it('single value', () => {
      assert(Tmpl.transform({ Absolute: 0 }), 0, 0, 0, 0);
      assert(Tmpl.transform({ Absolute: '3em' }), '3em', '3em', '3em', '3em');
      expect(Tmpl.transform({ Absolute: null })).to.eql({ position: 'absolute' });
    });

    it('array of values', () => {
      const res = Tmpl.transform({ Absolute: '10 20em 30px 40' });
      expect(res.position).to.equal('absolute');
      expect(res.top).to.equal(10);
      expect(res.right).to.equal('20em');
      expect(res.bottom).to.equal('30px');
      expect(res.left).to.equal(40);
    });
  });
});
