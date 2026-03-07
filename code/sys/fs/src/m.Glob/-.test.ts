import { type t, describe, expect, Ignore, it, sampleDir } from '../-test.ts';
import { Fs } from '../m.Fs/mod.ts';
import { Path } from './common.ts';
import { Glob } from './mod.ts';

export const assertWalkEntryDepth = (depth: number, dir: t.StringDir, entries: t.WalkEntry[]) => {
  const paths = entries.map((e) => e.path);
  assertPathDepth(depth, dir, paths);
};

export const assertPathDepth = (depth: number, dir: t.StringDir, paths: t.StringPath[]) => {
  paths.forEach((path) => {
    const subpath = path.slice(dir.length + 1);
    expect(subpath.split('/').length <= depth).to.be.true;
  });
};

const sampleTree = async (name: string) => {
  const fs = sampleDir(name);
  const dir = fs.dir;
  await Fs.remove(dir);
  await Fs.ensureDir(fs.join('a/b'));
  await Fs.ensureDir(fs.join('c'));
  await Fs.ensureDir(fs.join('m.Glob'));
  await Fs.write(fs.join('a/file.txt'), 'a');
  await Fs.write(fs.join('a/b/deep.txt'), 'b');
  await Fs.write(fs.join('c/other.md'), 'c');
  await Fs.write(fs.join('m.Glob/x.txt'), 'x');
  return {
    dir,
    file: fs.join('a/file.txt'),
    deep: fs.join('a/b/deep.txt'),
  } as const;
};

describe('Glob', () => {
  it('API', () => {
    expect(Fs.ls).to.equal(Glob.ls);
  });

  describe('create', () => {
    it('create: Fs.glob() ← no params', () => {
      const glob = Fs.glob();
      expect(glob.base).to.eql(Path.resolve('.')); // NB: default.
    });
  });

  describe('find: file pattern matching', () => {
    it('glob.find("**") ← default params', async () => {
      const { dir, file } = await sampleTree('Glob.find.default');
      const base = Fs.resolve(dir);
      const glob = Fs.glob(base);
      expect(glob.base).to.eql(base);

      const matches = await glob.find('**');
      expect(matches.length).to.be.greaterThan(3);
      expect(matches.some((m) => m.isDirectory === true)).to.be.true; // NB: includes directories by default.
      expect(matches.every((m) => Path.Is.absolute(m.path))).to.be.true;

      const self = matches.find((item) => item.path === file);
      expect(self?.isFile).to.eql(true);
      expect(self?.name).to.eql(Fs.Path.basename(file));
    });

    it('option: { includeDirs: false }', async () => {
      const { dir } = await sampleTree('Glob.find.includeDirs');
      const glob = Fs.glob(dir);
      const a = await glob.find('**', {});
      const b = await glob.find('**', { includeDirs: false });
      const c = await Fs.glob(dir, { includeDirs: false }).find('**');
      expect(a.some((m) => m.isDirectory === true)).to.be.true; //  Default param.
      expect(b.some((m) => m.isDirectory === true)).to.be.false; // Directories excluded.
      expect(c.some((m) => m.isDirectory === true)).to.be.false; // Option passed into root glob constructor.
    });

    it('option: { trimCwd:true }', async () => {
      const { dir } = await sampleTree('Glob.find.trimCwd');
      const glob = Fs.glob(dir);
      const a = await glob.find('**');
      const b = await glob.find('**', { trimCwd: true });
      const c = await Fs.glob(dir, { trimCwd: true }).find('**');
      const d = await Fs.glob(dir).dir('m.Glob').find('**');
      const e = await Fs.glob(dir).dir('m.Glob', { trimCwd: true }).find('**');

      expect(a.every((m) => Path.Is.absolute(m.path))).to.be.true;
      expect(b.every((m) => Path.Is.relative(m.path))).to.be.true;
      expect(c.every((m) => Path.Is.relative(m.path))).to.be.true;
      expect(d.every((m) => Path.Is.absolute(m.path))).to.be.true;
      expect(e.every((m) => Path.Is.relative(m.path))).to.be.true;
    });

    describe('options: {depth}', () => {
      const test = async (depth: number) => {
        const { dir } = await sampleTree('Glob.find.depth');
        const glob = Fs.glob(dir);
        const paths = await glob.find('**', { depth });
        assertWalkEntryDepth(depth, dir, paths);
        return paths;
      };

      it('depth: 0 | -1', async () => {
        await test(-1);
        await test(0);
        expect((await test(0)).length).to.eql(0);
      });

      it('depth: 1', async () => {
        await test(1);
      });

      it('depth: 2', async () => {
        await test(2);
      });
    });
  });

  describe('Glob.ls ← (alias: Fs.ls)', () => {
    it('list paths (default: no directories)', async () => {
      const { dir } = await sampleTree('Glob.ls.default');
      const glob = await Fs.glob(dir, { includeDirs: false }).find('**');
      const ls = await Fs.ls(dir);
      expect(ls).to.eql(glob.map((m) => m.path));
    });

    it('option: { includeDirs:true } ← override default', async () => {
      const { dir } = await sampleTree('Glob.ls.includeDirs');
      const includeDirs = true;
      const glob = await Fs.glob(dir, { includeDirs }).find('**');
      const ls = await Fs.ls(dir, { includeDirs });
      expect(ls).to.eql(glob.map((m) => m.path));
    });

    it('option: { trimCwd:true }', async () => {
      const { dir } = await sampleTree('Glob.ls.trimCwd');
      const a = await Fs.ls(dir);
      const b = await Fs.ls(dir, { trimCwd: true });
      expect(a.every((p) => Path.Is.absolute(p))).to.be.true;
      expect(b.every((p) => Path.Is.relative(p))).to.be.true;
    });

    it('path to file → [] empty array', async () => {
      const { dir, file } = await sampleTree('Glob.ls.file');
      expect(await Fs.exists(file)).to.eql(true);
      expect(await Fs.ls(file)).to.eql([]);
    });

    it('dir does not exist → [] empty array', async () => {
      const dir = Fs.resolve('404.foobar');
      expect(await Fs.ls(dir)).to.eql([]);
    });

    it('depth', async () => {
      const test = async (depth: number) => {
        const { dir } = await sampleTree('Glob.ls.depth');
        assertPathDepth(depth, dir, await Fs.ls(dir, { depth }));
      };
      await test(-1);
      await test(0);
      await test(1);
      await test(2);
    });
  });

  describe('Glob.ignore (eg ".gitignore" file)', () => {
    const ignorefile = `
      node_modules/
      *.log
      !important.log    
    `;

    it('filters out ignored files', async () => {
      const gitignore = Ignore.create(ignorefile);
      const test = (path: string, expected: boolean) => {
        expect(gitignore.isIgnored(path)).to.eql(expected);
      };
      test('foo.txt', false);
      test('node_modules/foo', true);
      test('foo/bar.log', true);
      test('foo/important.log', false);
    });
  });
});
