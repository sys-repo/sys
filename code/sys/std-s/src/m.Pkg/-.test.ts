import { pkg, describe, expect, it, Fs } from '../-test.ts';
import { Pkg } from './mod.ts';
import { Hash } from './common.ts';

describe('Pkg (Server Tools)', () => {
  const PATH = {
    dir: Fs.resolve('./src/-test/-sample-dist'),
    entry: './pkg/-entry.BEgRUrsO.js',
    get file() {
      return Fs.join(PATH.dir, 'dist.json');
    },
  };

  async function deleteDistFile() {
    await Fs.remove(PATH.file);
  }

  it('is not the "std" client instance, but surfaces the "std" interface', async () => {
    const { Pkg: Base } = await import('@sys/std/pkg');
    expect(Pkg).to.not.equal(Base); // NB: different instance.

    // Shares all of the base interface methods.
    for (const key of Object.keys(Base) as Array<keyof typeof Base>) {
      const value = Base[key];
      expect(value).to.equal(Pkg[key]);
    }
  });

  describe('Pkg.dist', () => {
    it('error: directory does not exist', async () => {
      const dir = Fs.resolve('./.tmp/NO_EXIST/');
      const res = await Pkg.dist({ dir, pkg });
      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(false);
      expect(res.error?.message).to.include(dir);
      expect(res.error?.message).to.include('does not exist');
      expect(res.dir).to.eql(dir);
      expect(res.dist.pkg).to.eql(pkg);
      expect(res.dist.entry).to.eql('');
      expect(res.dist.hash).to.eql({ pkg: '', files: {} }); // NB: empty
    });

    it('error: path is not a directory', async () => {
      const dir = Fs.resolve('./deno.json');
      const res = await Pkg.dist({ dir, pkg, save: true });

      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(true);
      expect(res.error?.message).to.include(dir);
      expect(res.error?.message).to.include('path is not a directory');
    });

    it('success', async () => {
      const { dir, entry } = PATH;
      const res = await Pkg.dist({ dir, pkg, entry });

      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.error).to.eql(undefined);

      expect(res.dir).to.eql(dir);
      expect(res.dist.pkg).to.eql(pkg);
      expect(res.dist.entry).to.eql(entry);

      const dirhash = await Hash.Dir.compute(dir, (p) => p !== './dist.json');
      expect(res.dist.hash.pkg).to.eql(dirhash.hash);
      expect(res.dist.hash.files).to.eql(dirhash.files);
    });

    it('{pkg} not passed → <unknown> package', async () => {
      const { dir, entry } = PATH;
      const res = await Pkg.dist({ dir, entry });
      expect(Pkg.Is.unknown(res.dist.pkg)).to.eql(true);
    });

    it('default: does not save to file', async () => {
      const { dir, entry, file } = PATH;
      const exists = () => Fs.exists(file);
      await deleteDistFile();
      expect(await exists()).to.eql(false);
      await Pkg.dist({ dir, pkg, entry });
      expect(await exists()).to.eql(false); // NB: never written
    });

    it('saves to file', async () => {
      const { dir, entry, file } = PATH;
      const exists = () => Fs.exists(file);
      await deleteDistFile();
      expect(await exists()).to.eql(false);

      const res = await Pkg.dist({ dir, pkg, entry, save: true });
      expect(res.ok).to.eql(true);
      expect(await exists()).to.eql(true);

      const json = (await Fs.readJson(file)).json;
      expect(json).to.eql(res.dist);
      await deleteDistFile();
    });
  });
});
