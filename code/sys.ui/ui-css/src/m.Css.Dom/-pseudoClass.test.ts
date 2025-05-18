import { type t, describe, expect, it } from '../-test.ts';
import { level3, level4 } from './m.CssPseudoClass.ts';
import { CssDom, CssPseudoClass } from './mod.ts';

describe('CssPseudoClass', () => {
  it('API', () => {
    expect(CssDom.PseudoClass).to.equal(CssPseudoClass);
  });

  it('array sets', () => {
    expect([...CssDom.PseudoClass.level3]).to.eql(level3);
    expect([...CssDom.PseudoClass.level4]).to.eql(level4);
    expect([...CssDom.PseudoClass.all]).to.eql([...level3, ...level4]);
  });

  describe('isClass', () => {
    it('false', () => {
      const test = (input: any) => expect(CssDom.PseudoClass.isClass(input)).to.be.false;
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => test(value));
    });

    it('true', () => {
      const test = (names: t.CssPseudoClass[]) => {
        names.forEach((name) => expect(CssDom.PseudoClass.isClass(name)).to.be.true);
      };
      test([...CssDom.PseudoClass.level3]);
      test([...CssDom.PseudoClass.level4]);
      test([...CssDom.PseudoClass.all]);
    });
  });
});
