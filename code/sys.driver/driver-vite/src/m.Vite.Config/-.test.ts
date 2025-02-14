import { type t, describe, expect, it } from '../-test.ts';
import { ViteConfig } from './mod.ts';
import { toAlias, toAliasRegex } from './u.alias.ts';

describe('ViteConfig', () => {
  it('API', () => {
    expect(ViteConfig.alias).to.equal(toAlias);
  });

  it('Config.outDir', () => {
    const outDir = ViteConfig.outDir;
    expect(outDir.default).to.include('./dist');
  });

  describe('rollup: alias', () => {
    it('toAliasRegex', () => {
      const jsr = toAliasRegex('jsr', 'foobar');
      const npm = toAliasRegex('npm', 'foobar');

      const test = (regex: RegExp, input: string, expected: boolean) => {
        const match = regex.exec(input);
        expect(!!match).to.eql(expected);
      };

      test(jsr, 'jsr:foobar@>=1.2.3-alpha.1/foobar', true);
      test(jsr, 'jsr:foobar@>=1.2.3-alpha.1/foo/file.css', true);
      test(jsr, 'jsr:foobar/foo/file.css', true);

      test(npm, 'npm:foobar@1', true);
      test(npm, 'npm:foobar@~1.2.3', true);
      test(npm, 'npm:foobar@^1.2.3-alpha.1', true);
      test(npm, 'npm:foobar@>=1.2.3-alpha.1', true);
      test(npm, 'npm:foobar@>=1.2.3-alpha.1/foobar', true);
      test(npm, 'npm:foobar@1/foo/bar', true);
      test(npm, 'npm:foobar/foo/bar', true);

      test(npm, ' npm:foobar@1.2.3', false);
      test(npm, 'npm:foobar@1.2 ', false);
    });

    describe('toAlias', () => {
      it('structure', () => {
        const jsr = toAlias('jsr', ' foobar ');
        const npm = toAlias('npm', ' @scope/foo ');
        expect(jsr.customResolver).to.eql(undefined);
        expect(npm.customResolver).to.eql(undefined);

        expect(jsr.find).to.eql(toAliasRegex('jsr', 'foobar'));
        expect(jsr.replacement).to.eql('foobar$1');

        expect(npm.find).to.eql(toAliasRegex('npm', '@scope/foo'));
        expect(npm.replacement).to.eql('@scope/foo$1');
      });

      const test = (
        registry: t.CodeRegistry,
        moduleName: string,
        input: string,
        expected: string,
      ) => {
        const alias = toAlias(registry, moduleName);
        const res = input.replace(alias.find, alias.replacement);
        expect(res).to.eql(expected);
      };

      it('replace module without version but not subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react', '@vidstack/react');
        test('npm', 'foo', 'npm:foo', 'foo');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp', '@sys/tmp');
      });

      it('replace module with version but not subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react@1.2.3', '@vidstack/react');
        test('npm', 'foo', 'npm:foo@~1', 'foo');
        test('npm', 'foo', 'npm:foo@1.2.3-alpha.1', 'foo');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp@>=0.1.2', '@sys/tmp');
      });

      it('replace module with version and subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react@1.2.3/a/b', '@vidstack/react/a/b');
        test('npm', 'foo', 'npm:foo@1.2.3/a/b', 'foo/a/b');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp@1.2.3/foo', '@sys/tmp/foo');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp@1.2.3/foo/bar.z', '@sys/tmp/foo/bar.z');
      });

      it('replace module without version but with subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react/a/b', '@vidstack/react/a/b');
        test('npm', 'foo', 'npm:foo/a/b', 'foo/a/b');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp/a/b', '@sys/tmp/a/b');
      });
    });
  });
});
