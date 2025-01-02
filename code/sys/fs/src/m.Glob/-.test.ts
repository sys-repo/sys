import { describe, expect, Ignore, it } from '../-test.ts';
import { Fs } from '../m.Fs/mod.ts';
import { Glob } from './mod.ts';

describe('Glob', () => {
  it('API', () => {
    expect(Glob.ignore).to.equal(Ignore.create);
    expect(Fs.ls).to.equal(Glob.ls);
  });

  describe('find: file pattern matching', () => {
    it('glob.find("**") ← default params', async () => {
      const base = Fs.resolve();
      const glob = Fs.glob(base);
      expect(glob.base).to.eql(base);

      const matches = await glob.find('**');
      expect(matches.length).to.be.greaterThan(10);
      expect(matches.some((m) => m.isDirectory === true)).to.be.true; // NB: includes directories by default.

      const self = matches.find((item) => item.path === import.meta.filename);
      expect(self?.isFile).to.eql(true);
      expect(self?.name).to.eql(Fs.Path.basename(import.meta.filename ?? ''));
    });

    it('option: {includeDirs: false}', async () => {
      const dir = Fs.resolve('src');
      const glob = Fs.glob(dir);
      const a = await glob.find('**', {});
      const b = await glob.find('**', { includeDirs: false });
      const c = await Fs.glob(dir, { includeDirs: false }).find('**');
      expect(a.some((m) => m.isDirectory === true)).to.be.true; //  Default param.
      expect(b.some((m) => m.isDirectory === true)).to.be.false; // Directories excluded.
      expect(c.some((m) => m.isDirectory === true)).to.be.false; // Option passed into root glob constructor.
    });
  });

  describe('Glob.ls ← (alias: Fs.ls)', () => {
    const dir = Fs.resolve('src');

    it('list paths (default: no directories)', async () => {
      const glob = await Fs.glob(dir, { includeDirs: false }).find('**');
      const ls = await Fs.ls(dir);
      expect(ls).to.eql(glob.map((m) => m.path));
    });

    it('option: { includeDirs:true } ← override default', async () => {
      const includeDirs = true;
      const glob = await Fs.glob(dir, { includeDirs }).find('**');
      const ls = await Fs.ls(dir, { includeDirs });
      expect(ls).to.eql(glob.map((m) => m.path));
    });

    it('path to file → [] empty array', async () => {
      const file = Fs.resolve('deno.json');
      expect(await Fs.exists(file)).to.eql(true);
      expect(await Fs.ls(file)).to.eql([]);
    });

    it('dir does not exist → [] empty array', async () => {
      const dir = Fs.resolve('404.foobar');
      expect(await Fs.ls(dir)).to.eql([]);
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
