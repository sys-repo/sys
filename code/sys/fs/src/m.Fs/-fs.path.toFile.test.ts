import { describe, expect, it } from '../-test.ts';
import { Path } from './common.ts';
import { Fs } from './mod.ts';
import { toFile } from './u.toFile.ts';

describe('Fs.toFile', () => {
  const cwd = Path.cwd();

  it('API', () => {
    expect(Fs.toFile).to.equal(toFile);
  });

  describe('base', () => {
    it('path: relative, base provided', () => {
      const test = (base: string, path: string) => {
        const res = toFile(`  ./${path}  `, ` ${base} `);
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

    it('path: absolute, base: absolute (passed)', () => {
      const base = '/base/bar';
      const path = 'foo/file.ts';
      const res = toFile(Path.join(base, path), base);
      expect(res.base).to.eql(base);
      expect(res.absolute).to.eql(Path.join(base, path));
      expect(res.relative).to.eql(path);
    });

    it('path: relative, base: relative passed ← base is resolved', () => {
      const base = 'foo/bar';
      const path = 'baz/file.ts';
      const res = toFile(path, base);
      expect(res.absolute).to.eql(Path.resolve(base, path));
      expect(res.base).to.eql(Path.resolve(base));
      expect(res.dir).to.eql('baz');
      expect(res.relative).to.eql('baz/file.ts');
    });

    it('path: absolute, base not passed ← is inferred as parent-dir', () => {
      const path = '/base/foo/bar/file.ts';
      const res = toFile(path);
      expect(res.absolute).to.eql(path);
      expect(res.base).to.eql(Path.dirname(path));
      expect(res.dir).to.eql('');
      expect(res.relative).to.eql('file.ts');
    });

    it('path: relative, base is inferred as CWD (current-working-directory)', () => {
      const path = 'baz/file.ts';
      const res = toFile(path);
      expect(res.absolute).to.eql(Path.resolve(path));
      expect(res.base).to.eql(cwd);
      expect(res.dir).to.eql('baz');
      expect(res.relative).to.eql('baz/file.ts');
    });

    it('throw: path is absolute BUT differs from base', () => {
      const fn = () => toFile('/foo/file.ts', '/base/path');
      expect(fn).to.throw(
        /The given \[relative\] path is absolute but does not match the given \[base\]/,
      );
    });
  });

  it('single dotfile: ".gitignore"', () => {
    const a = toFile('.gitignore', cwd);
    const b = toFile('foo/.gitignore', cwd); // NB: no directory.

    expect(a.file.name).to.eql('.gitignore');
    expect(b.file.name).to.eql('.gitignore');
    expect(a.dir).to.eql('');
    expect(b.dir).to.eql('foo');
    expect(a.relative).to.eql('.gitignore');
    expect(b.relative).to.eql('foo/.gitignore');

    expect(a.file.ext).to.eql('');
    expect(b.file.ext).to.eql('');
  });

  it('toString() → file.absolute', () => {
    const res = toFile(Path.join(cwd, 'foo/file.ts'), cwd);
    expect(res.toString()).to.eql(res.absolute);
  });
});
