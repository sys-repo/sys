import { type t, describe, expect, it } from '../-test.ts';
import { Modules } from './m.Modules.ts';
import { Esm } from './mod.ts';

describe('Jsr.Esm', () => {
  it('API', () => {
    expect(Esm.Modules).to.equal(Modules);
    expect(Esm.modules).to.equal(Modules.create);
  });

  describe('Esm.parse', () => {
    it('prefix', () => {
      const test = (input: string, expectedPrefix: t.EsmImport['prefix']) => {
        const res = Esm.parse(input);
        expect(res.input).to.eql(input);
        expect(res?.prefix).to.eql(expectedPrefix);
        expect(res.error).to.eql(undefined);
      };
      test('foobar', '');
      test('jsr:foobar', 'jsr');
      test('jsr:@foo/bar', 'jsr');
      test('npm:foobar', 'npm');
      test('npm:@jsr/sys__tmp@1.2.3', 'npm');
      test('npm:@jsr/sys__tmp@^1.2', 'npm');
    });

    it('name', () => {
      const test = (input: string, expectedName: string) => {
        const res = Esm.parse(input);
        expect(res.input).to.eql(input);
        expect(res?.name).to.eql(expectedName);
        expect(res.error).to.eql(undefined);
      };

      test('foobar', 'foobar');
      test('  foobar  ', 'foobar');
      test('  @foo/bar  ', '@foo/bar');
      test('npm:foobar', 'foobar');
      test('jsr:foobar', 'foobar');
      test('jsr:foobar@^1.2', 'foobar');
      test('jsr:@foo/bar', '@foo/bar');

      test('./foobar/mod.ts', './foobar/mod.ts');
      test('/foobar/mod.ts', '/foobar/mod.ts');
    });

    it('version', () => {
      const test = (input: string, expectedVersion: string) => {
        const res = Esm.parse(input);
        expect(res.input).to.eql(input);
        expect(res?.version).to.eql(expectedVersion);
        expect(res.error).to.eql(undefined);
      };
      test('foobar', '');
      test('  foobar  ', '');
      test('foobar@1.2.3', '1.2.3');
      test(' foobar@^1.2.3 ', '^1.2.3');
      test('foobar@1.2.3-alpha.1  ', '1.2.3-alpha.1');
      test('  @scope/foobar@3', '3');

      test(' foobar@~3.1', '~3.1');
      test(' foobar@^3.1', '^3.1');

      test(' foobar@>=3.1', '>=3.1');
      test(' foobar@<=3.1', '<=3.1');
      test(' foobar@<3.1', '<3.1');
      test(' foobar@>3.1', '>3.1');
    });

    describe('error', () => {
      it('non-string input', () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((value: any) => {
          const res = Esm.parse(value);
          expect(res.input).to.eql(String(value));
          expect(res.prefix).to.eql('');
          expect(res.name).to.eql('');
          expect(res.version).to.eql('');
          expect(res.error?.message).to.include('Given ESM import is not a string');
        });
      });

      it('failed to parse', () => {
        const test = (input: string) => {
          const res = Esm.parse(input);
          expect(res.input).to.eql(input);
          expect(res.prefix).to.eql('');
          expect(res.name).to.eql('');
          expect(res.version).to.eql('');
          expect(res.error?.message).to.include('Failed to parse ESM module-specifier', input);
          expect(res.error?.message).to.include(input);
        };

        test('');
        test('  ');

        // Invalid prefix.
        test('fail:foobar@0.1.2');
        test(':foobar@0.1.2');
        test('::foobar');

        // Invalid version.
        test('jsr:foobar@');
        test('foobar@hello');
      });
    });
  });

  describe('Esm.toString', () => {
    it('Esm.toString', () => {
      const test = (input: string) => {
        const mod = Esm.parse(input);
        const res = Esm.toString(mod);
        expect(mod.error).to.eql(undefined, input);
        expect(res).to.eql(input);
      };
      test('jsr:@sys/tmp@^0.0.42');
      test('jsr:@sys/tmp');
      test('rxjs@7');
      test('rxjs');
      test('npm:rxjs@7');
    });
  });

  describe('Esm.Modules', () => {
    describe('create:', () => {
      it('empty', () => {
        type T = Parameters<t.EsmModulesLib['create']>[0];
        const test = (input?: T) => {
          const modules = Esm.modules(input);
          expect(modules.items.length).to.eql(0);
          expect(modules.ok).to.eql(true);
          expect(modules.error).to.eql(undefined);
        };
        test();
        test([]);
      });

      it('from: string[]', () => {
        const modules = Esm.modules(['foobar', 'jsr:foobar@1', 'npm:@foo/bar@1.2.3']);
        expect(modules.ok).to.eql(true);
        expect(modules.error).to.eql(undefined);
        expect(modules.items.length).to.eql(3);
        expect(modules.items.map((m) => m.name)).to.eql(['foobar', 'foobar', '@foo/bar']);
      });

      it('from: <EsmImport>[]', () => {
        const a = Esm.parse('jsr:foobar@1');
        const b = Esm.parse('npm:@foo/bar@1.2.3');
        const modules = Esm.modules([a, b]);
        expect(modules.ok).to.eql(true);
        expect(modules.error).to.eql(undefined);
        expect(modules.items.length).to.eql(2);
        expect(modules.items[0]).to.eql(a);
        expect(modules.items[1]).to.eql(b);

        // NB: different instance.
        expect(modules.items[0]).to.not.equal(a);
        expect(modules.items[1]).to.not.equal(b);
      });

      it('from: mixed', () => {
        const mod = Esm.parse('npm:@foo/bar@1.2.3');
        const modules = Esm.modules(['jsr:foobar@1', 'npm:@foo/bar@1.2.3', mod]);
        expect(modules.ok).to.eql(true);
        expect(modules.error).to.eql(undefined);
        expect(modules.items.length).to.eql(3);
        expect(modules.items.map((m) => m.name)).to.eql(['foobar', '@foo/bar', mod.name]);
      });

      describe('errors', () => {
        it('module parse error', async () => {
          const fail = 'FAIL:@foo/bar@1.2.3';
          const modules = Esm.modules(['foobar', fail, 'jsr:foobar@1']);
          expect(modules.items.length).to.eql(3);
          expect(modules.ok).to.eql(false);
          expect(modules.error?.message).to.include('Failed to parse ESM module-specifier');
          expect(modules.error?.message).to.include(fail);
        });
      });
    });

    describe('modules.latest: (version)', () => {
      describe('param: string (semver)', () => {
        const specifiers = ['jsr:foobar', 'npm:@foo/bar@1.2.3', Esm.parse('npm:@foo/bar@~1.2.4')];

        it('empty (no match)', () => {
          const modules = Esm.modules(specifiers);
          expect(modules.latest('')).to.eql('');
          expect(modules.latest('  ')).to.eql('');
          expect(modules.latest('bam')).to.eql('');
          expect(modules.latest('@foo')).to.eql('');
          expect(modules.latest('npm:@foo/boo')).to.eql('');
        });

        it('match: string', () => {
          const modules = Esm.modules(specifiers);
          const test = (input: string, expected: string) => {
            const res = modules.latest(input);
            expect(res).to.eql(expected);
          };
          test('@foo/bar', '1.2.4');
          test('  @foo/bar  ', '1.2.4');
          test('npm:@foo/bar', '1.2.4');
          test('npm:@foo/bar@1.2.3', '1.2.4');
        });

        it('no version → empty ("")', () => {
          const modules = Esm.modules(specifiers);
          expect(modules.latest('jsr:foobar')).to.eql('');
        });
      });

      describe('param: {EsmImportMap}', () => {
        const specifiers = ['rxjs:7', 'npm:@foo/bar@1.2.3', Esm.parse('npm:@foo/bar@~1.2.4')];

        it('empty', () => {
          const modules = Esm.modules(specifiers);
          const deps: t.EsmImportMap = {};
          const res = modules.latest(deps);
          expect(res).to.eql(deps);
          expect(res).to.not.equal(deps); // NB: immutable.
        });

        });
      });
    });
  });
});
