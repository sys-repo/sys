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

    it('suffix param', () => {
      const base = Pkg.toString(pkg);
      const a = Pkg.toString(pkg, 'FooBar');
      const b = Pkg.toString(pkg, '  ::: ns.foo.bar  ');
      expect(a).to.eql(`${base}:FooBar`);
      expect(b).to.eql(`${base}:ns.foo.bar`);
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

    it('defaultName', () => {
      const res1 = Pkg.fromJson({ name: 'foo', version: '1.2.0' }, 'my-name');
      const res2 = Pkg.fromJson({ version: '1.2.0' }, 'my-name');
      expect(res1.name).to.eql('foo'); // NB: the provided name in JSON is used - param value ignored.
      expect(res2.name).to.eql('my-name');
    });

    it('defaultVersion', () => {
      const res1 = Pkg.fromJson({ name: 'foo', version: '1.2.0' }, 'my-name', '9.0.0');
      const res2 = Pkg.fromJson({ name: 'foo' }, 'my-name', '9.0.0');
      expect(res1.version).to.eql('1.2.0'); // NB: the provided version in JSON is used - param value ignored.
      expect(res2.version).to.eql('9.0.0');
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
          '-type:': 'jsr:@sys/types:DistPkg',
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
