import { type t, describe, expect, it, pkg } from '../-test.ts';
import { DEFAULTS } from './common.ts';
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

  describe('Pkg.fromJson', () => {
    it('INVALID input', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        const res = Pkg.fromJson(v);
        expect(Pkg.Is.unknown(res)).to.eql(true);
      });
    });

    it('from import', () => {
      const res = Pkg.fromJson({ name: 'foo', version: '1.2.0' });
      expect(res.name).to.eql('foo');
      expect(res.version).to.eql('1.2.0');
    });
  });

  describe('Pkg.Is', () => {
    describe('Is.unknown', () => {
      it('true (unknown)', () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v: any) => {
          expect(Pkg.Is.unknown(v)).to.eql(true, v);
        });
        expect(Pkg.Is.unknown('<unknown>@0.0.0')).to.eql(true);
        expect(Pkg.Is.unknown({ name: '<unknown>', version: '0.0.0' })).to.eql(true);
      });

      it('false (known)', () => {
        expect(Pkg.Is.unknown(Pkg.toString(pkg))).to.eql(false);
      });
    });

    describe('Is.pkg', () => {
      it('false', () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v: any) => {
          expect(Pkg.Is.pkg(v)).to.eql(false, v);
        });
      });

      it('true', () => {
        const pkg: t.Pkg = { name: 'foo', version: '1.2.3' };
        expect(Pkg.Is.pkg(pkg)).to.eql(true);
      });
    });

    describe('Is.dist', () => {
      it('false', () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v: any) => {
          expect(Pkg.Is.dist(v)).to.eql(false, v);
        });
      });

      it('true', () => {
        const dist: t.DistPkg = {
          pkg: { name: 'foo', version: '1.2.3' },
          size: { bytes: 123_456 },
          entry: 'pkg/entry.js',
          hash: {
            digest: 'acbc',
            parts: {
              './index.html': 'xxxx',
              './pkg/entry.js': 'yyyy',
            },
          },
        };
        expect(Pkg.Is.dist(dist)).to.eql(true);
      });
    });
  });

  it('Pkg.unknown', () => {
    const a = Pkg.unknown();
    const b = Pkg.unknown();

    expect(a).to.eql(DEFAULTS.UNKNOWN);
    expect(a).to.eql(b);
    expect(a).to.not.equal(b);
  });
});
