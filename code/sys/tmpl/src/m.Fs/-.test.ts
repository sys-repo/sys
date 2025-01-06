import { type t, Path, describe, expect, it, Fs } from '../-test.ts';
import { toFile, toDir } from './mod.ts';

describe('Path.dir|file', () => {
  const cwd = Path.cwd();

  const Sample = {
    dir: Path.resolve('src/m.Fs/-sample'),
  };

  describe('toTmplDir', () => {
    describe('paths', () => {
      it('default', () => {
        const path = Path.resolve('foo/bar');
        const res = toDir(path);
        expect(res.absolute).to.eql(path);
        expect(res.toString()).to.eql(res.absolute);
      });
    });

    describe('Dir.ls', () => {
      it('default', async () => {
        const dir = toDir(Sample.dir);
        const a = await dir.ls();
        const b = await Fs.ls(Sample.dir);
        expect(a.length).to.be.greaterThan(0);
        expect(a).to.eql(b);
        expect(a.every((p) => Path.Is.absolute(p))).to.be.true;
      });

      it('option: {trimCwd}', async () => {
        const dir = toDir(Sample.dir);
        const trimCwd = true;
        const a = await dir.ls({ trimCwd });
        const b = await Fs.ls(Sample.dir, { trimCwd });
        expect(a).to.eql(b);
        expect(a.every((p) => Path.Is.relative(p))).to.be.true;
      });

      it('filtered', async () => {
        const path = Sample.dir;
        const a = toDir(path);
        const b = toDir(path, [(e) => e.file.name !== '.gitignore']);
        const c = toDir(path, [(e) => e.file.name !== '.gitignore']);

        const assertIncludes = async (paths: string[], endsWith: string, expected = true) => {
          const exists = paths.some((p) => p.endsWith(endsWith));
          expect(exists).to.eql(expected);
        };

        await assertIncludes(await a.ls(), '.gitignore', true);
        await assertIncludes(await b.ls(), '.gitignore', false);

        const pathsC = await c.ls((e) => e.file.ext !== '.json');
        await assertIncludes(pathsC, '.gitignore', false); // NB: via root Dir filter.
        await assertIncludes(pathsC, 'deno.json', false); //  NB: via Dir.ls({ filter }).
        await assertIncludes(pathsC, 'mod.ts', true);
      });
    });
  });

  describe('toTmplFile', () => {
    it('base', () => {
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

    it('path contains base (absolute)', () => {
      const path = 'foo/file.ts';
      const res = toFile(Path.join(cwd, path), cwd);
      expect(res.base).to.eql(cwd);
      expect(res.absolute).to.eql(Path.join(cwd, path));
      expect(res.relative).to.eql(path);
    });

    it('toString() → file.absolute', () => {
      const res = toFile(Path.join(cwd, 'foo/file.ts'), cwd);
      expect(res.toString()).to.eql(res.absolute);
    });

    it('throw: relative path absolute AND difference from base', () => {
      const fn = () => toFile('/foo/file.ts', '/base/path');
      expect(fn).to.throw(
        /The given \[relative\] path is absolute but does not match the given \[base\]/,
      );
    });
  });
});
