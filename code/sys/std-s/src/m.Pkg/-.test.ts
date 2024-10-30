import { type t, describe, expect, Fs, it, pkg } from '../-test.ts';
import { slug } from '../common.ts';
import { Hash } from './common.ts';
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
      console.info(`JSON via Pkg.Dist.compute:`);
      console.info(`/dist/dist.json:`);
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
        expect(res.dist.hash.pkg).to.eql(dirhash.hash);
        expect(res.dist.hash.files).to.eql(dirhash.files);
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

    describe('Dist.validate', () => {
      it('validate: is valid', async () => {
        await SAMPLE_FILE.dist.ensure();
        const res = await Pkg.Dist.validate(SAMPLE_PATH.dir);

        expect(res.exists).to.eql(true);
        expect(res.dist?.pkg).to.eql(pkg);
        expect(res.is.valid).to.eql(true);
        expect(res.is.unknown).to.eql(false);

        /**
         * Test multiple inputs:
         */
        const a = await Pkg.Dist.validate(SAMPLE_PATH.dir);
        // const b = await Pkg.Dist.validate(SAMPLE_PATH.dir, "path/to/dist.json");
        // const c = await Pkg.Dist.validate(SAMPLE_PATH.dir, {DistPkg});
      });

      /**
       * TODO 🐷
       * - not valid (change/break the pkg dir)
       * - optionally pass in the {DistPkg} as a second param.
       *   scenario: independent check of {DistPkg} hashses sent through secondary channel
       * - copy
       */

      it('404: target dir does not exist', async () => {
        const res = await Pkg.Dist.validate('404_foobar');
        expect(res.exists).to.eql(false);
        expect(res.dist).to.eql(undefined);
        expect(res.error?.message).to.include('does not exist');
        expect(res.is.unknown).to.eql(true);
        expect(res.is.valid).to.eql(undefined); // Falsy.
      });

      it('404: target dir does not contain a {dist.json}', async () => {
        await SAMPLE_FILE.dist.delete();
        const res = await Pkg.Dist.validate(SAMPLE_PATH.dir);
        expect(res.exists).to.eql(false);
        expect(res.dist).to.eql(undefined);
        expect(res.error?.message).to.include('does not exist');
        expect(res.is.unknown).to.eql(true);
        expect(res.is.valid).to.eql(undefined); // Falsy.
      });
    });
  });

  it('|→ clean up', async () => {
    await SAMPLE_FILE.dist.reset();
  });
});
