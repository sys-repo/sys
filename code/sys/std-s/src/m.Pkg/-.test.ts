import { type t, describe, expect, Fs, it, pkg } from '../-test.ts';
import { Hash } from './common.ts';
import { Dist } from './m.Dist.ts';
import { Pkg } from './mod.ts';

describe('Pkg (Server Tools)', () => {
  const PATH = {
    dir: Fs.resolve('./src/-test/-sample-dist'),
    entry: './pkg/-entry.BEgRUrsO.js',
    get filepath() {
      return Fs.join(PATH.dir, 'dist.json');
    },
  };

  const SAMPLE_FILE = {
    dist: {
      exists: () => Fs.exists(PATH.filepath),
      delete: () => Fs.remove(PATH.filepath),
      async ensure() {
        if (await SAMPLE_FILE.dist.exists()) return;
        const { dir, entry } = PATH;
        await Pkg.Dist.compute({ dir, pkg, entry, save: true });
      },
    },
  } as const;

  it('is not the [sys.std] Client verion, but surfaces all the [sys.std] interface', async () => {
    const { Pkg: Base } = await import('@sys/std/pkg');
    expect(Pkg).to.not.equal(Base); // NB: different instance.

    // Shares all of the base interface methods.
    for (const key of Object.keys(Base) as Array<keyof typeof Base>) {
      const value = Base[key];
      expect(value).to.equal(Pkg[key]);
    }
  });

  describe('Pkg.Dist', () => {
    const renderDist = (dist: t.DistPkg) => {
      console.info('🌳');
      console.info(`JSON via Pkg.Dist.compute:`);
      console.info(`/dist/dist.json:`);
      console.info();
      console.info(dist);
      console.info();
    };

    it('API', () => {
      expect(Pkg.Dist).to.equal(Dist);
    });

    describe('Dist.compute', () => {
      it('Dist.compute(): → success', async () => {
        const { dir, entry } = PATH;
        const res = await Pkg.Dist.compute({ dir, pkg, entry });
        renderDist(res.dist);

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
        const res = await Pkg.Dist.compute({ dir, entry });
        expect(Pkg.Is.unknown(res.dist.pkg)).to.eql(true);
      });

      it('default: does not save to file', async () => {
        const { dir, entry, filepath } = PATH;
        const exists = () => Fs.exists(filepath);
        await SAMPLE_FILE.dist.delete();
        expect(await exists()).to.eql(false);
        await Pkg.Dist.compute({ dir, pkg, entry });
        expect(await exists()).to.eql(false); // NB: never written
      });

      it('{save:true} → saves to file-system', async () => {
        const { dir, entry, filepath } = PATH;
        const exists = () => Fs.exists(filepath);
        await SAMPLE_FILE.dist.delete();
        expect(await exists()).to.eql(false);

        const res = await Pkg.Dist.compute({ dir, pkg, entry, save: true });
        expect(await exists()).to.eql(true);

        const json = (await Fs.readJson(filepath)).json;
        expect(json).to.eql(res.dist);
        await SAMPLE_FILE.dist.delete();
      });

      it('error: directory does not exist', async () => {
        const dir = Fs.resolve('./.tmp/NO_EXIST/');
        const res = await Pkg.Dist.compute({ dir, pkg });
        expect(res.exists).to.eql(false);
        expect(res.error?.message).to.include(dir);
        expect(res.error?.message).to.include('does not exist');
        expect(res.dir).to.eql(dir);
        expect(res.dist.pkg).to.eql(pkg);
        expect(res.dist.entry).to.eql('');
        expect(res.dist.hash).to.eql({ pkg: '', files: {} }); // NB: empty.
      });

      it('error: path is not a directory', async () => {
        const dir = Fs.resolve('./deno.json');
        const res = await Pkg.Dist.compute({ dir, pkg, save: true });
        expect(res.exists).to.eql(true);
        expect(res.error?.message).to.include(dir);
        expect(res.error?.message).to.include('path is not a directory');
      });
    });

    describe('Dist.load', () => {
      it('ensure "/dist.json" file exists', async () => {
        await SAMPLE_FILE.dist.ensure();
      });

      it('Pkg.Dist.load("path") → success', async () => {
        const test = async (path: string) => {
          const res = await Pkg.Dist.load(path);
          expect(res.path).to.eql(PATH.filepath);
          expect(res.exists).to.eql(true);
          expect(res.error).to.eql(undefined);
          expect(res.dist?.pkg).to.eql(pkg); // NB: loaded, with data.
        };

        await test(PATH.dir); // NB: div ← "/dist.json" appended.
        await test(PATH.filepath);
      });

      it('404: does not exist', async () => {
        const res = await Pkg.Dist.load('404_foobar');
        expect(res.exists).to.eql(false);
        expect(res.dist).to.eql(undefined);
        expect(res.error?.message).to.include('does not exist');
      });
    });
  });

  it('|→ clean up', async () => {
    await SAMPLE_FILE.dist.delete();
  });
});
