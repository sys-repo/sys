import { describe, expect, it } from '../-test.ts';
import { ViteConfig } from './mod.ts';

import { toAliasRegex, toAlias } from './u.alias.ts';

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

      test(npm, 'npm:foobar@1', true);
      test(npm, 'npm:foobar@~1.2.3', true);
      test(npm, 'npm:foobar@^1.2.3-alpha.1', true);
      test(npm, 'npm:foobar@>=1.2.3-alpha.1', true);
      test(npm, 'npm:foobar@>=1.2.3-alpha.1/foobar', true);
      test(npm, 'npm:foobar@1/foo/bar', true);

      test(npm, ' npm:foobar@1.2.3', false);
      test(npm, 'npm:foobar@1.2.3 ', false);
    });

    it('toAlias', () => {
      const jsr = toAlias('jsr', ' foobar ');
      const npm = toAlias('npm', ' foobar ');

      expect(jsr.replacement).to.eql('foobar');
      expect(jsr.find).to.eql(toAliasRegex('jsr', 'foobar'));
      expect(jsr.customResolver).to.eql(undefined);

      expect(npm.replacement).to.eql('foobar');
      expect(npm.find).to.eql(toAliasRegex('npm', 'foobar'));
      expect(npm.customResolver).to.eql(undefined);
    });
  });
});
