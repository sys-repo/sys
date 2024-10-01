import { Fs, Pkg, describe, expect, it, type t } from '../../-test.ts';
import { Denofile } from './mod.ts';

describe('Denofile', () => {
  const rootPath = Fs.resolve('../../../deno.json');

  describe('load file', () => {
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

    it('not found', async () => {
      const res = await Denofile.load('./404.json');
      expect(res.exists).to.eql(false);
    });
  });

  describe('Denofile.workspace', () => {
    it('from path: exists', async () => {
      const res = await Denofile.workspace(rootPath);
      expect(res.exists).to.eql(true);
      expect(res.paths.includes('./code/sys/std')).to.be.true;
    });

    it('from path: <undefined> ← default to root of [cwd]', async () => {
      const res = await Denofile.workspace();
      expect(res.exists).to.eql(false);
      expect(res.paths).to.eql([]); // NB: no workspace in the found deno.json.
    });

    it('from path: not found', async () => {
      const res = await Denofile.workspace('./404.json');
      expect(res.exists).to.eql(false);
      expect(res.paths).to.eql([]);
    });

    it('from {json}', async () => {
      const { json } = await Fs.readJson<t.DenofileJson>(rootPath);
      const res = await Denofile.workspace(json!);
      expect(res.exists).to.eql(true);
      expect(res.paths.includes('./code/sys/std')).to.be.true;
    });
  });
});
