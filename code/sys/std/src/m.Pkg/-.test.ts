import { describe, expect, it, pkg } from '../-test.ts';
import { Pkg } from './mod.ts';

describe('Pkg', () => {
  describe('Pkg.toString', () => {
    it('INVALID', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach(() => {
        expect(Pkg.toString()).to.eql('');
      });
    });

    it('<undefined> → "" (empty)', () => {
      expect(Pkg.toString()).to.eql('');
    });

    it('{pkg} → "<name>@<version>"', () => {
      const res = Pkg.toString(pkg);
      expect(res).to.eql(`${pkg.name}@${pkg.version}`);
    });
  });
});
