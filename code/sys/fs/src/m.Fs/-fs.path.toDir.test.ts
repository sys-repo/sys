import { describe, expect, it } from '../-test.ts';
import { Path } from './common.ts';
import { Fs } from './mod.ts';
import { toDir } from './u.toDir.ts';

describe('Fs.toDir', () => {
  const cwd = Path.cwd();
  const Sample = {
    dir: Path.resolve('src/-test/-sample-6'),
  } as const;

  it('API', () => {
    expect(Fs.toDir).to.equal(toDir);
  });

  describe('paths', () => {
    it('input: absolute', () => {
      const absolute = Path.resolve('foo/bar');
      const res = toDir(absolute);
      expect(res.absolute).to.eql(absolute);
      expect(res.toString()).to.eql(res.absolute);
    });

    it('input: relative ← resolves against CWD', () => {
      const relative = 'foo/bar';
      const res = toDir(relative);
      expect(res.absolute).to.eql(Path.resolve(relative));
      expect(res.absolute.startsWith(cwd)).to.eql(true);
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
