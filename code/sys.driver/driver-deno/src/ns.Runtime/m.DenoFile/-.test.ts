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
    describe('path', () => {
      it('from path: exists', async () => {
        const res = await DenoFile.workspace(rootPath);
        const dirs = res.children.map((child) => Fs.dirname(child.path));
        expect(res.exists).to.eql(true);
        expect(dirs.some((p) => p === 'code/sys/std')).to.be.true;
        expect(res.file).to.eql(rootPath);
        expect(res.dir).to.eql(Fs.dirname(rootPath));
      });

      it('from path: <undefined>  ←  (↑ first-ancestor-workspace ↑)  ←  ./deno.json', async () => {
        const root = await Fs.readJson<t.DenoFileJson>(rootPath);
        const a = await DenoFile.workspace();
        const b = await DenoFile.workspace(undefined, { walkup: false });
        const dirs = root.data?.workspace?.map((p) => p.replace(/^\.\//, ''));

        expect(a.exists).to.eql(true);
        expect(a.children.map((m) => Fs.dirname(m.path))).to.eql(dirs);

        expect(b.exists).to.eql(false);
        expect(b.children).to.eql([]);
      });

      it('from path: not found', async () => {
        const res = await DenoFile.workspace('./404.json');
        expect(res.exists).to.eql(false);
        expect(res.children).to.eql([]);
      });
    });

    describe('workspace.children', () => {
      it('children.files (paths)', async () => {
        const ws = await DenoFile.workspace();
        const dirs = ws.children.map((child) => Fs.dirname(child.path));
        const paths = dirs.map((subdir) => Fs.join('./', subdir, 'deno.json'));
        ws.children.forEach((child) => {
          expect(paths.includes(child.path)).to.eql(true);
        });
      });
    });

    describe('workspace.modules', () => {
      it('includes all modules from the workspace.', async () => {
        const ws = await DenoFile.workspace();
        expect(ws.modules.ok).to.eql(true);
        expect(ws.modules.error).to.eql(undefined);

        const namesA = ws.children.map((m) => m.file.name ?? '');
        const namesB = ws.modules.items.map((m) => m.name);
        expect(namesA.filter(Boolean).toSorted()).to.eql(namesB.filter(Boolean).toSorted());
      });

      it('empty workspace → no modules', async () => {
        const ws = await DenoFile.workspace('./src/-test/sample-2/deno-empty-workspace.json');
        const modules = ws.modules;
        expect(modules.ok).to.eql(true);
        expect(modules.count).to.eql(0);
        expect(modules.items).to.eql([]);
      });
    });
  });
});
