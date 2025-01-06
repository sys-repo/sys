import { Path, describe, expect, it } from '../-test.ts';
import { toTmplFile } from './mod.ts';

describe('common', () => {
  describe('toTmplFile', () => {
    const cwd = Path.cwd();

    it('path: base == cwd', () => {
      const test = (base: string, path: string) => {
        const res = toTmplFile(` ${base} `, `  ./${path}  `);
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
      const a = toTmplFile(cwd, '.gitignore');
      const b = toTmplFile(cwd, 'foo/.gitignore'); // NB: no directory.

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
      const res = toTmplFile(cwd, Path.join(cwd, path));
      expect(res.base).to.eql(cwd);
      expect(res.absolute).to.eql(Path.join(cwd, path));
      expect(res.relative).to.eql(path);
    });

    it('throw: relative path absolute AND difference from base', () => {
      const fn = () => toTmplFile('/base/path', '/foo/file.ts');
      expect(fn).to.throw(
        /The given \[relative\] path is absolute but does not match the given \[base\]/,
      );
    });
  });
});
