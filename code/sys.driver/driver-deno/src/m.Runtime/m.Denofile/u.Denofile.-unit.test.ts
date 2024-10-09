import { Fs, Pkg, describe, expect, it, type t } from '../../-test.ts';
import { Denofile } from './mod.ts';

describe('Denofile', () => {
  const rootPath = Fs.resolve('../../../deno.json');

  describe('Denofile.load', () => {
    it('path exists', async () => {
      const path = Fs.resolve('./deno.json');
      const res = await Denofile.load(path);
      expect(res.exists).to.eql(true);
      expect(res.json?.name).to.eql('@sys/driver-deno');
      expect(res.json?.version).to.eql(Pkg.version);
    });

    it('path <undefined> ← default to root of [cwd]', async () => {
      const res = await Denofile.load();
      expect(res.exists).to.eql(true);
      expect(res.json?.name).to.eql('@sys/driver-deno');
      expect(res.json?.version).to.eql(Pkg.version);
    });

    it('appends <deno.json> to path if directory is given', async () => {
      const path1 = Fs.resolve('.');
      const path2 = Fs.resolve('./src');
      expect(await Fs.Is.dir(path1)).to.eql(true);
      expect(await Fs.Is.dir(path2)).to.eql(true);

      const res1 = await Denofile.load(path1);
      const res2 = await Denofile.load(path2);
      expect(res1.exists).to.eql(true);
      expect(res2.exists).to.eql(false);
    });

    it('not found', async () => {
      const res = await Denofile.load('./404.json');
      expect(res.exists).to.eql(false);
    });
  });

  describe('Denofile.isWorkspace', () => {
    const isWorkspace = Denofile.isWorkspace;

    it('is a workspace', async () => {
      expect(await isWorkspace(rootPath)).to.eql(true);
    });

    it('is not a workspace', async () => {
      expect(await isWorkspace(undefined)).to.eql(false);
      expect(await isWorkspace('./404.json')).to.eql(false);
      expect(await isWorkspace('./deno.json')).to.eql(false);
    });
  });

  describe('Denofile.workspace', () => {
    it('from path: exists', async () => {
      const res = await Denofile.workspace(rootPath);
      expect(res.exists).to.eql(true);
      expect(res.paths.includes('./code/sys/std')).to.be.true;
      expect(res.file).to.eql(rootPath);
    });

    it('from path: <undefined>  ←  (↑ first-ancestor-workspace ↑)  ←  ./deno.json', async () => {
      const root = await Fs.readJson<t.DenofileJson>(rootPath);
      const res1 = await Denofile.workspace();
      const res2 = await Denofile.workspace(undefined, { walkup: false });

      expect(res1.exists).to.eql(true);
      expect(res1.paths).to.eql(root.json?.workspace);

      expect(res2.exists).to.eql(false);
      expect(res2.paths).to.eql([]);
    });

    it('from path: not found', async () => {
      const res = await Denofile.workspace('./404.json');
      expect(res.exists).to.eql(false);
      expect(res.paths).to.eql([]);
    });
  });
});
