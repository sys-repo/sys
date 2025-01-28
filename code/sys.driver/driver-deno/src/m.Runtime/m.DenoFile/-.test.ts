import { Fs, pkg, describe, expect, it, type t } from '../../-test.ts';
import { DenoFile } from './mod.ts';

describe('DenoFile', () => {
  const rootPath = Fs.resolve('../../../deno.json');

  describe('DenoFile.load', () => {
    it('path exists', async () => {
      const path = Fs.resolve('./deno.json');
      const res = await DenoFile.load(path);
      expect(res.exists).to.eql(true);
      expect(res.data?.name).to.eql('@sys/driver-deno');
      expect(res.data?.version).to.eql(pkg.version);
    });

    it('path <undefined> ← default to root of [cwd]', async () => {
      const res = await DenoFile.load();
      expect(res.exists).to.eql(true);
      expect(res.data?.name).to.eql('@sys/driver-deno');
      expect(res.data?.version).to.eql(pkg.version);
    });

    it('appends <deno.json> to path if directory is given', async () => {
      const path1 = Fs.resolve('.');
      const path2 = Fs.resolve('./src');
      expect(await Fs.Is.dir(path1)).to.eql(true);
      expect(await Fs.Is.dir(path2)).to.eql(true);

      const res1 = await DenoFile.load(path1);
      const res2 = await DenoFile.load(path2);
      expect(res1.exists).to.eql(true);
      expect(res2.exists).to.eql(false);
    });

    it('not found', async () => {
      const res = await DenoFile.load('./404.json');
      expect(res.exists).to.eql(false);
    });
  });

  describe('DenoFile.isWorkspace', () => {
    const isWorkspace = DenoFile.isWorkspace;

    it('is a workspace', async () => {
      expect(await isWorkspace(rootPath)).to.eql(true);
    });

    it('is not a workspace', async () => {
      expect(await isWorkspace(undefined)).to.eql(false);
      expect(await isWorkspace('./404.json')).to.eql(false);
      expect(await isWorkspace('./deno.json')).to.eql(false);
    });
  });

  describe('DenoFile.workspace', () => {
    it('from path: exists', async () => {
      const res = await DenoFile.workspace(rootPath);
      expect(res.exists).to.eql(true);
      expect(res.children.dirs.includes('./code/sys/std')).to.be.true;
      expect(res.file).to.eql(rootPath);
      expect(res.dir).to.eql(Fs.dirname(rootPath));
    });

    it('from path: <undefined>  ←  (↑ first-ancestor-workspace ↑)  ←  ./deno.json', async () => {
      const root = await Fs.readJson<t.DenoFileJson>(rootPath);
      const a = await DenoFile.workspace();
      const b = await DenoFile.workspace(undefined, { walkup: false });

      expect(a.exists).to.eql(true);
      expect(a.children.dirs).to.eql(root.data?.workspace);

      expect(b.exists).to.eql(false);
      expect(b.children.dirs).to.eql([]);
    });

    it('from path: not found', async () => {
      const res = await DenoFile.workspace('./404.json');
      expect(res.exists).to.eql(false);
      expect(res.children.dirs).to.eql([]);
    });

    it('load children', async () => {
      const ws = await DenoFile.workspace();
      const children = await ws.children.load();
      const paths = ws.children.dirs.map((subdir) => Fs.join(ws.dir, subdir, 'deno.json'));
      children.forEach((child) => {
        expect(paths.includes(child.path)).to.eql(true);
      });
    });
  });
});
