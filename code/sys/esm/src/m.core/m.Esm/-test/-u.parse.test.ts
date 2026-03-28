import { type t, describe, expect, it } from '../../../-test.ts';
import { Esm } from '../mod.ts';

describe('Esm', () => {
  describe('Esm.parse', () => {
    it('prefix', () => {
      const test = (input: string, expectedRegistry: t.EsmImport['registry']) => {
        const res = Esm.parse(input);
        expect(res.input).to.eql(input);
        expect(res.registry).to.eql(expectedRegistry);
        expect(res.subpath).to.eql('');
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
        expect(res.name).to.eql(expectedName);
        expect(res.subpath).to.eql('');
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

    it('name → alias', () => {
      const a = Esm.parse('jsr:@foo/bar@1.2');
      const b = Esm.parse('jsr:@foo/bar@1.2', 'my-alias');
      expect(a.alias).to.eql(undefined);
      expect(b.alias).to.eql('my-alias');
      expect(b.name).to.eql('@foo/bar');
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

    it('path', () => {
      const test = (input: string, expectedPath: string) => {
        const res = Esm.parse(input);
        expect(res.input).to.eql(input);
        expect(res?.subpath).to.eql(expectedPath);
        expect(res.error).to.eql(undefined);
      };

      test('foobar', '');
      test('  @foo/bar  ', '');
      test('  @foo/bar/foo  ', 'foo');
      test('npm:foobar', '');

      test('npm:foobar/file.css', 'file.css');
      test('jsr:foobar/foo/bar/z', 'foo/bar/z');
      test('jsr:foobar@^1.2/foo', 'foo');

      test('./foobar/mod.ts', '');
      test('/foobar/mod.ts', '');
    });

    describe('error', () => {
      it('non-string input', () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((value: any) => {
          const res = Esm.parse(value);
          expect(res.input).to.eql(String(value));
          expect(res.registry).to.eql('');
          expect(res.name).to.eql('');
          expect(res.version).to.eql('');
          expect(res.error?.message).to.include('Given ESM import is not a string');
        });
      });

      it('failed to parse', () => {
        const test = (input: string) => {
          const res = Esm.parse(input);
          expect(res.input).to.eql(input);
          expect(res.registry).to.eql('');
          expect(res.name).to.eql('');
          expect(res.version).to.eql('');
          expect(res.error?.message).to.include('Failed to parse ESM module-specifier', input);
          expect(res.error?.message).to.include(input);
        };

        test('');
        test('  ');

        test('fail:foobar@0.1.2');
        test(':foobar@0.1.2');
        test('::foobar');

        test(' foobar@ ');
        test('jsr:foobar@');
        test('foobar@hello');
      });
    });
  });
});
