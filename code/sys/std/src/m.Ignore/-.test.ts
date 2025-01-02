import { type t, describe, expect, it } from '../-test.ts';
import { Ignore } from './mod.ts';

type P = Parameters<t.GlobIgnoreLib['create']>[0];

describe('Ignore', () => {
  describe('create: pattern input variants', () => {
    const gitignore = `
      dist
      .env
      .env.*
      !**/.foo/cache/
`;

    it('empty', () => {
      const test = (input: P) => {
        const ignore = Ignore.create(input);
        expect(ignore.rules).to.eql([]);
      };
      test('');
      test(' ');
      test('\n');
      test('  \n\n  \n     \n ');
      test([]);
      test(['']);
      test(['', '  ']);
      test(['', ' \n\n ', '\n', '']);

      test(null as any);
      test(undefined as any);
    });

    it('from multi-line string (eg. a file)', () => {
      const a = Ignore.create(gitignore);
      const b = Ignore.create([gitignore]);
      const c = Ignore.create(['  ', gitignore, '', '\n\n']);

      expect(a.rules).to.eql(b.rules);
      expect(a.rules).to.eql(b.rules);
      expect(a.rules).to.eql(c.rules); // NB: empty white-space removed.

      expect(a.rules[0].pattern).to.eql('dist');
      expect(a.rules[1].pattern).to.eql('.env');
      expect(a.rules[2].pattern).to.eql('.env.*');
      expect(a.rules[3].pattern).to.eql('!**/.foo/cache/');
    });

    it('multi-line within array', () => {
      const ignoreA = Ignore.create(gitignore);
      const ignoreB = Ignore.create([gitignore, '  node_modules  ', '', ' \n\n']);

      const a = ignoreA.rules.map(({ pattern }) => pattern);
      const b = ignoreB.rules.map(({ pattern }) => pattern);
      expect(b).to.eql([...a, 'node_modules']);
    });
  });

  describe('pattern rules', () => {
    it('isNegation', () => {
      const test = (input: P, expected: boolean) => {
        const ignore = Ignore.create(input);
        const rule = ignore.rules[0];
        expect(rule.isNegation).to.eql(expected);
      };

      test('foo', false);
      test('/foo', false);
      test('  foo ', false);

      test('!foo', true);
      test('  !foo  ', true);
      test('  !  foo  ', true);
    });

    it('removes comments', () => {
      const gitignore = `
        # Remove
        .env
        .env.*
      `;
      const ignore = Ignore.create(gitignore);
      const patterns = ignore.rules.map(({ pattern }) => pattern);
      expect(patterns).to.eql(['.env', '.env.*']);
    });
  });

  describe('isIgnored → (".gitignore" complaint)', () => {
    const test = (pattern: string | string[], path: string, expected: boolean) => {
      const gitignore = Ignore.create(pattern);
      const isIgnored = gitignore.isIgnored(path);
      expect(isIgnored).to.eql(expected, `pattern: "${pattern}" | path: "${path}"`);
    };

    describe('Exact Match Patterns', () => {
      it('should ignore exact file match without slashes', () => {
        test('xxx', 'xxx', true);
        test('xxx', 'yyy', false);
        test('folder/xxx', 'folder/xxx', true);
        test('folder/xxx', 'folder/yyy', false);
      });

      it('should not ignore similar but non-exact matches', () => {
        test('abc', 'abcd', false);
        test('abc', 'a/b/c', false);
      });
    });

    describe('Wildcard Patterns', () => {
      it('should handle single asterisk (*) wildcards', () => {
        test('*.js', 'app.js', true);
        test('*.js', 'app.jsx', false);
      });

      it('should handle double asterisk (**) wildcards', () => {
        test('**/*.js', 'app.js', true);
        test('**/*.js', 'src/app.js', true);
        test('**/*.js', 'src/utils/app.js', true);
        test('**/*.js', 'src/utils/app.jsx', false);
      });

      it('should handle question mark (?) wildcards', () => {
        test('file?.txt', 'file1.txt', true);
        test('file?.txt', 'fileA.txt', true);
        test('file?.txt', 'file12.txt', false);
        test('file?.txt', 'file.txt', false);
      });

      it('should handle character ranges', () => {
        test('file[0-9].txt', 'file1.txt', true);
        test('file[0-9].txt', 'filea.txt', false);
      });
    });
  });
});
