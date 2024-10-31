import { type t, c, describe, expect, Fs, it, pkg, Path } from '../-test.ts';
import { R, Hash } from './common.ts';
import { Dist } from './m.Dist.ts';
import { Pkg } from './mod.ts';

export const SAMPLE_PATH = {
  dir: Fs.resolve('./src/-test/-sample-dist'),
  entry: './pkg/-entry.BEgRUrsO.js',
  get filepath() {
    return Fs.join(SAMPLE_PATH.dir, 'dist.json');
  },
};
export const SAMPLE_FILE = {
  dist: {
    exists: () => Fs.exists(SAMPLE_PATH.filepath),
    delete: () => Fs.remove(SAMPLE_PATH.filepath),
    async reset() {
      await SAMPLE_FILE.dist.delete();
    },
    async ensure() {
      if (await SAMPLE_FILE.dist.exists()) return;
      const { dir, entry } = SAMPLE_PATH;
      await Pkg.Dist.compute({ dir, pkg, entry, save: true });
    },
    async copyTo(target: t.StringDir) {
      await Fs.copyDir(SAMPLE_PATH.dir, target);
    },
  },
} as const;

describe('Pkg (Server Tools)', () => {
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
      console.info();
      console.info('🌳');
      console.info(`JSON via ${c.magenta('Pkg.Dist.compute')}:`);
      console.info(c.gray(`/dist/dist.json:`));
      console.info();
      console.info(dist);
      console.info();
    };

    it('API', () => {
      expect(Pkg.Dist).to.equal(Dist);
    });

    describe('Dist.compute (save)', () => {
      it('Dist.compute(): → success', async () => {
        const { dir, entry } = SAMPLE_PATH;
        const res = await Pkg.Dist.compute({ dir, pkg, entry });
        renderDist(res.dist);

        expect(res.exists).to.eql(true);
        expect(res.error).to.eql(undefined);

        expect(res.dir).to.eql(dir);
        expect(res.dist.pkg).to.eql(pkg);
        expect(res.dist.entry).to.eql(entry);

        const dirhash = await Hash.Dir.compute(dir, (p) => p !== './dist.json');
        expect(res.dist.hash.digest).to.eql(dirhash.hash.digest);
        expect(res.dist.hash.parts).to.eql(dirhash.hash.parts);
      });

      it('{pkg} not passed → <unknown> package', async () => {
        const { dir, entry } = SAMPLE_PATH;
        const res = await Pkg.Dist.compute({ dir, entry });
        expect(Pkg.Is.unknown(res.dist.pkg)).to.eql(true);
      });

      it('default: does not save to file', async () => {
        const { dir, entry, filepath } = SAMPLE_PATH;
        const exists = () => Fs.exists(filepath);
        await SAMPLE_FILE.dist.reset();
        expect(await exists()).to.eql(false);
        await Pkg.Dist.compute({ dir, pkg, entry });
        expect(await exists()).to.eql(false); // NB: never written
      });

      it('{save:true} → saves to file-system', async () => {
        const { dir, entry, filepath } = SAMPLE_PATH;
        const exists = () => Fs.exists(filepath);
        await SAMPLE_FILE.dist.reset();
        expect(await exists()).to.eql(false);

        const res = await Pkg.Dist.compute({ dir, pkg, entry, save: true });
        expect(await exists()).to.eql(true);

        const json = (await Fs.readJson(filepath)).json;
        expect(json).to.eql(res.dist);
        await SAMPLE_FILE.dist.reset();
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
        expect(res.dist.hash).to.eql({ digest: '', parts: {} }); // NB: empty.
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
      it('Pkg.Dist.load("path") → success', async () => {
        await SAMPLE_FILE.dist.ensure();

        const test = async (path: string) => {
          const res = await Pkg.Dist.load(path);
          expect(res.path).to.eql(SAMPLE_PATH.filepath);
          expect(res.exists).to.eql(true);
          expect(res.error).to.eql(undefined);
          expect(res.dist?.pkg).to.eql(pkg); // NB: loaded, with data.
        };

        await test(SAMPLE_PATH.dir); // NB: div ← "/dist.json" appended.
        await test(SAMPLE_PATH.filepath);
      });

      it('404: does not exist', async () => {
        const res = await Pkg.Dist.load('404_foobar');
        expect(res.exists).to.eql(false);
        expect(res.dist).to.eql(undefined);
        expect(res.error?.message).to.include('does not exist');
      });
    });

    describe('Dist.verify', () => {
      it('validate: is valid', async () => {
        await SAMPLE_FILE.dist.ensure();
        const dir = SAMPLE_PATH.dir;

        const test = async (hashInput?: t.StringHash | t.CompositeHash) => {
          const res = await Pkg.Dist.verify(dir, hashInput);
          expect(res.exists).to.eql(true);
          expect(res.is.valid).to.eql(true);
          expect(res.dist?.pkg).to.eql(pkg);
        };

        await test();
        await test('./dist.json');

        const path = Path.join(dir, 'dist.json');
        await test(path); // absolute path (anywhere).
        await test((await Dist.load(path)).dist?.hash);
      });

      it('validate: not valid (pass in "man in the middle" attacked state)', async () => {
        await SAMPLE_FILE.dist.ensure();
        const dir = SAMPLE_PATH.dir;

        const test = async (
          expectedValid: boolean,
          mutate?: (hash: t.DeepMutable<t.CompositeHash>) => void,
        ) => {
          const dist = (await Pkg.Dist.compute({ dir })).dist;
          const hash = R.clone(dist.hash);
          mutate?.(hash); // ← (test manipulation) setup test conditions.

          const verification = await Pkg.Dist.verify(SAMPLE_PATH.dir, hash);
          expect(verification.is.valid).to.eql(expectedValid);
        };

        await test(true);
        await test(false, (hash) => {
          /**
           * NB: (test scenario): mutate the hash
           *
           *     Simulate a state after a "man-in-the-middle" style attack has
           *     occured, where the {hash} manifest, and the actual files differ.
           */
          hash.digest = `sha🐷-${'0'.repeat(60)}💥`;
        });
      });

      it('404: target dir does not exist', async () => {
        const res = await Pkg.Dist.verify('404_foobar');
        expect(res.exists).to.eql(false);
        expect(res.dist).to.eql(undefined);
        expect(res.error?.message).to.include('does not exist');
        expect(res.is.valid).to.eql(undefined); // Falsy.
      });

      it('404: target dir does not contain a {dist.json}', async () => {
        await SAMPLE_FILE.dist.delete();
        const res = await Pkg.Dist.verify(SAMPLE_PATH.dir);
        expect(res.exists).to.eql(false);
        expect(res.dist).to.eql(undefined);
        expect(res.error?.message).to.include('does not exist');
        expect(res.is.valid).to.eql(undefined); // Falsy.
      });
    });
  });

  it('|→ clean up', async () => {
    await SAMPLE_FILE.dist.reset();
  });
});
