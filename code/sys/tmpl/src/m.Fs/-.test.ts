import { type t, Path, describe, expect, it } from '../-test.ts';
import { toFile, toDir } from './mod.ts';

describe('Path.dir|file', () => {
  const cwd = Path.cwd();

  describe('toTmplDir', () => {
    it('simple', () => {
      const path = Path.resolve('foo/bar');
      const res = toDir(path);
      expect(res.absolute).to.eql(path);
      expect(res.toString()).to.eql(res.absolute);
    });

    it('filtered', async () => {
      const path = Path.resolve('src/-test/-sample');
      const a = toDir(path);
      const b = toDir(path, [(e) => e.file.name !== '.gitignore']);

      const assertIncludes = async (dir: t.TmplDir, endsWith: string, expected = true) => {
        const paths = await dir.ls();
        const exists = paths.some((p) => p.endsWith(endsWith));
        expect(exists).to.eql(expected);
      };

      await assertIncludes(a, '.gitignore', true);
      await assertIncludes(b, '.gitignore', false);
    });
  });

  describe('toTmplFile', () => {
    it('base', () => {
      const test = (base: string, path: string) => {
        const res = toFile(` ${base} `, `  ./${path}  `);
        expect(res.base).to.eql(Path.resolve(base));
        expect(res.absolute).to.eql(Path.resolve(base, Path.normalize(path)));
        expect(res.relative).to.eql(Path.normalize(path));
        expect(res.file.name).to.eql(Path.basename(res.absolute));
        expect(res.file.ext).to.eql(Path.extname(res.absolute));
      };

      test(cwd, 'foo/bar/file.ts');
      test('my/base', './foo/bar/../file.ts');
      test('/my/base/', 'file.ts');
      test('', 't.ts');
      test('/my/base/', 'noextension');
    });

    it('single dotfile: ".gitignore"', () => {
      const a = toFile(cwd, '.gitignore');
      const b = toFile(cwd, 'foo/.gitignore'); // NB: no directory.

      expect(a.file.name).to.eql('.gitignore');
      expect(b.file.name).to.eql('.gitignore');
      expect(a.dir).to.eql('');
      expect(b.dir).to.eql('foo');
      expect(a.relative).to.eql('.gitignore');
      expect(b.relative).to.eql('foo/.gitignore');

      expect(a.file.ext).to.eql('');
      expect(b.file.ext).to.eql('');
    });

    it('path contains base (absolute)', () => {
      const path = 'foo/file.ts';
      const res = toFile(cwd, Path.join(cwd, path));
      expect(res.base).to.eql(cwd);
      expect(res.absolute).to.eql(Path.join(cwd, path));
      expect(res.relative).to.eql(path);
    });

    it('toString() → file.absolute', () => {
      const res = toFile(cwd, Path.join(cwd, 'foo/file.ts'));
      expect(res.toString()).to.eql(res.absolute);
    });

    it('throw: relative path absolute AND difference from base', () => {
      const fn = () => toFile('/base/path', '/foo/file.ts');
      expect(fn).to.throw(
        /The given \[relative\] path is absolute but does not match the given \[base\]/,
      );
    });
  });
});
