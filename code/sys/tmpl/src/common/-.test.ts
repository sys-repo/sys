import { Path, describe, expect, it } from '../-test.ts';
import { toTmplFile } from './mod.ts';

describe('common', () => {
  describe('toTmplFile', () => {
    const cwd = Path.cwd();

    it('path: cwd', () => {
      const path = Path.join(cwd, 'foo/bar/file.ts    '); // NB: trims string.
      const res = toTmplFile(path);
      expect(res.path).to.eql(path.trim());
      expect(res.dir).to.eql('foo/bar');
      expect(res.name).to.eql('file.ts');
    });

    it('path: not cwd', () => {
      const path = '  foo/bar/file.ts  ';
      const res = toTmplFile(path);
      expect(res.path).to.eql(path.trim());
      expect(res.dir).to.eql('foo/bar');
      expect(res.name).to.eql('file.ts');
    });

    it('single dotfile: ".gitignore"', () => {
      const path1 = Path.join(cwd, '.gitignore');
      const path2 = Path.join('.gitignore');

      const res1 = toTmplFile(path1);
      const res2 = toTmplFile(path2);

      expect(res1.path).to.eql(path1);
      expect(res1.dir).to.eql('');
      expect(res1.name).to.eql('.gitignore');

      expect(res2.path).to.eql(path2);
      expect(res2.dir).to.eql('');
      expect(res2.name).to.eql('.gitignore');
    });
  });
});
