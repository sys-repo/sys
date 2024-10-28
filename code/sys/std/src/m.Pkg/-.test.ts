import { describe, expect, it, pkg } from '../-test.ts';
import { Pkg } from './mod.ts';

describe('Pkg', () => {
  describe('Pkg.toString', () => {
    it('INVALID', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Pkg.toString(v)).to.eql('<unknown>@0.0.0', v);
      });
    });

    it('<undefined> → "" (empty)', () => {
      expect(Pkg.toString()).to.eql('<unknown>@0.0.0');
    });

    it('{pkg} → "<name>@<version>"', () => {
      const res = Pkg.toString(pkg);
      expect(res).to.eql(`${pkg.name}@${pkg.version}`);
    });
  });

  describe('Pkg.Is', () => {
    describe('Is.unknown', () => {
      it('true (unknown)', () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v: any) => expect(Pkg.Is.unknown(v)).to.eql(true));
        expect(Pkg.Is.unknown('<unknown>@0.0.0')).to.eql(true);
      });

      it('false (known)', () => {
        expect(Pkg.Is.unknown(Pkg.toString(pkg))).to.eql(false);
      });
    });
  });
});
