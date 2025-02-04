import { type t, describe, expect, it } from '../-test.ts';
import { Esm } from './mod.ts';

describe('Jsr.Esm', () => {
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
});
