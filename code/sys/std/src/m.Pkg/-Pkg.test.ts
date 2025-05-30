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
          type: 'https://jsr.io/@sample/foo',
          pkg: { name: 'foo', version: '1.2.3' },
          build: {
            time: 1746520471244,
            size: { total: 123_456, pkg: 123 },
            builder: '@sys/driver-vite@0.0.0',
            runtime: '<runtime-uri>',
          },
          entry: 'pkg/entry.js',
          url: { base: '/' },
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

  describe('Pkg.toPkg', () => {
    it('invalid → <unknown>', () => {
      const NON = [
        '',
        123,
        true,
        null,
        undefined,
        BigInt(0),
        Symbol('foo'),
        {},
        [],
        { name: 123, version: '0.0.0' },
        { name: 'foo', version: 123 },
      ];
      NON.forEach((value: any) => {
        const res = Pkg.toPkg(value);
        console.log('res', res);
        expect(res).to.eql(DEFAULTS.UNKNOWN);
      });
    });

    it('strips wider object to yield clean {pkg}', () => {
      const source = { name: 'foo', version: '0.0.0', tasks: {} };
      const a = Pkg.toPkg(source);
      const b = Pkg.toPkg(source);

      expect(a).to.eql(b);
      expect(a).to.not.equal(b);

      expect(Object.keys(a)).to.eql(['name', 'version']);
      expect(a.name).to.eql('foo');
      expect(a.version).to.eql('0.0.0');
    });

    describe('parsing from string', () => {
      it('valid', () => {
        const res = Pkg.toPkg('  @scope/pkg@0.0.0  ');
        expect(res.name).to.eql('@scope/pkg');
        expect(res.version).to.eql('0.0.0');
      });

      it('invalid: → returns {UNKNOWN} version of {pkg}', () => {
        const test = (input: string) => {
          const res = Pkg.toPkg(input);
          expect(res).to.eql(Pkg.unknown());
        };

        test('');
        test('  ');
        test('foobar');
        test('🐷');

        const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((value: any) => test(value));
      });
    });
  });
});
