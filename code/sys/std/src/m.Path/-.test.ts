import { describe, expect, it } from '../-test.ts';
import { Path } from './mod.ts';

describe('Path', () => {
  describe('join', () => {
    it('API', () => {
      expect(Path.join).to.equal(Path.Join.auto);
    });

    it('join', () => {
      expect(Path.join('foo', 'bar')).to.eql('foo/bar');
    });

    it('absolute', () => {
      expect(Path.absolute('./foo')).to.eql(Path.resolve('./foo'));
      expect(Path.absolute('/foo')).to.eql('/foo');
    });

    it('Join.posix', () => {
      expect(Path.Join.posix('foo', 'bar')).to.eql('foo/bar');
    });

    it('Join.windows', () => {
      expect(Path.Join.windows('foo', 'bar')).to.eql('foo\\bar');
    });

    it('Join.platform (selector)', () => {
      expect(Path.Join.platform()).to.equal(Path.Join.auto);
      expect(Path.Join.platform('auto')).to.equal(Path.Join.auto);
      expect(Path.Join.platform('posix')).to.equal(Path.Join.posix);
      expect(Path.Join.platform('windows')).to.equal(Path.Join.windows);
    });
  });

  describe('joinGlobs', () => {
    it('joinGlobs', () => {
      const res = Path.joinGlobs(['src', '**', '*.ts']);
      expect(res).to.eql('src/**/*.ts');
    });
  });

  describe('Path.Is', () => {
    const Is = Path.Is;

    it('Is.absolute', () => {
      expect(Is.absolute('/foo/bar')).to.eql(true);
      expect(Is.absolute('./foo/bar')).to.eql(false);
      expect(Is.absolute('foo/bar')).to.eql(false);
    });

    it('Is.relative', () => {
      // NB: the opposite of Is.absolute
      expect(Is.relative('/foo/bar')).to.eql(false);
      expect(Is.relative('./foo/bar')).to.eql(true);
      expect(Is.relative('foo/bar')).to.eql(true);
    });

    it('Is.glob', () => {
      expect(Is.glob('**/foo.*')).to.eql(true);
      expect(Is.glob('./foo/bar')).to.eql(false);
    });
  });

  describe('Path.extname', () => {
    it('include "." prefix', () => {
      expect(Path.extname('foo.md')).to.eql('.md');
    });

    it('no extension', () => {
      expect(Path.extname('foo.bar/filename')).to.eql('');
    });

    it('no extension: non string input', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => expect(Path.extname(v)).to.eql(''));
    });
  });

  describe('Path.ext', () => {
    it('create: nothing', () => {
      const ext = Path.ext();
      expect(ext.suffixes).to.eql([]);
    });

    it('create: normalizes suffixes', () => {
      const ext = Path.ext('.txt', 'txt', '', '  ', '....foo');
      expect(ext.suffixes).to.eql(['.txt', '.foo']);
    });

    it('is: (match)', () => {
      const img = Path.ext('.png', 'jpg', '.webp');

      // No:
      expect(img.is('')).to.eql(false);
      expect(img.is('  ')).to.eql(false);
      expect(img.is('png')).to.eql(false);
      expect(img.is('foopng')).to.eql(false);
      expect(img.is('/foo.bar')).to.eql(false);
      expect(img.is('foo', 'bar')).to.eql(false);
      expect(img.is('foo.png', 'bar')).to.eql(false);

      // Yes:
      expect(img.is('.png')).to.eql(true);
      expect(img.is('/foo.bar/file.png')).to.eql(true);
      expect(img.is('foo.png', 'bar.jpg')).to.eql(true);
    });
  });

  describe('Path.dir (builder)', () => {
    it('returns the base path when coerced to string', () => {
      const dir = Path.dir('foo');
      expect(String(dir)).to.eql('foo');
    });

    it('joins parts onto the base with path()', () => {
      const dir = Path.dir('foo');
      const result = dir.path('bar', 'baz');
      expect(result).to.eql('foo/bar/baz');
    });

    it('creates a new scoped builder with dir()', () => {
      const dir = Path.dir('foo').dir('bar');
      expect(String(dir)).to.eql('foo/bar');
      expect(dir.path('baz')).to.eql('foo/bar/baz');
    });

    it('supports nesting dir() calls', () => {
      const dir = Path.dir('foo').dir('bar').dir('baz');
      expect(String(dir)).to.eql('foo/bar/baz');
      expect(dir.path('qux', 'quux')).to.eql('foo/bar/baz/qux/quux');
    });

    it('change platform', () => {
      const a = Path.dir('foo', { platform: 'auto' });
      const b = Path.dir('foo', { platform: 'posix' });
      const c = Path.dir('foo', 'windows');

      expect(a.path('bar')).to.eql(Path.join('foo', 'bar'));
      expect(b.path('bar')).to.eql(Path.Join.posix('foo', 'bar'));
      expect(c.path('bar')).to.eql(Path.Join.windows('foo', 'bar'));
      expect(c.dir('zoo').path('bar')).to.eql(Path.Join.windows('foo', 'zoo', 'bar'));
    });
  });

  describe('Path.relativePosix', () => {
    it('strips a single leading slash', () => {
      expect(Path.relativePosix('/path/sample')).to.eql('path/sample');
    });

    it('strips multiple leading slashes', () => {
      expect(Path.relativePosix('///path/sample')).to.eql('path/sample');
    });

    it('converts backslashes to forward slashes', () => {
      expect(Path.relativePosix('\\path\\sample\\pkg\\m.X.js')).to.eql('path/sample/pkg/m.X.js');
    });

    it('does not collapse "." or ".." segments', () => {
      expect(Path.relativePosix('/a/./b')).to.eql('a/./b');
      expect(Path.relativePosix('/a/../b')).to.eql('a/../b');
    });

    it('preserves internal multiple slashes (only leading are stripped)', () => {
      expect(Path.relativePosix('/a//b///c')).to.eql('a//b///c');
    });

    it('returns empty string for empty or slash-only inputs', () => {
      expect(Path.relativePosix('')).to.eql('');
      expect(Path.relativePosix('/')).to.eql('');
      expect(Path.relativePosix('////')).to.eql('');
    });

    it('leaves already-relative POSIX paths unchanged', () => {
      expect(Path.relativePosix('a/b/c')).to.eql('a/b/c');
    });
  });
});
