import { type t, describe, expect, it, pkg } from '../-test.ts';
import { Dir } from '../mod.ts';
import { Sample } from './-u.ts';
import { Fs, Is, Path, R, Time, c } from './common.ts';
import { Dist } from './m.Pkg.Dist.ts';
import { Pkg } from './mod.ts';

describe('Pkg.Dist', () => {
  const renderDist = (dist: t.DistPkg) => {
    console.info();
    console.info('🌳');
    console.info(`JSON via ${c.green('Pkg.Dist.compute')}:`);
    console.info(c.gray(`/dist/dist.json:`));
    console.info();
    console.info(dist);
    console.info();
  };

  describe('API', () => {
    it('API refs', () => {
      expect(Pkg.Dist).to.equal(Dist);
    });

    it('is not the [sys.std] client version, but surfaces all the [sys.std] interface', async () => {
      const { Pkg: Base } = await import('@sys/std/pkg');
      expect(Pkg.Dist).to.not.equal(Base.Dist); // NB: different instance.

      // Shares all of the base interface methods.
      for (const key of Object.keys(Base.Dist) as Array<keyof typeof Base.Dist>) {
        const value = Base.Dist[key];
        expect(value).to.equal(Pkg.Dist[key]);
      }
    });
  });

  describe('Dist.compute (save)', () => {
    it('Dist.compute(): → success', async () => {
      const sample = await Sample.init();
      const { dir, entry } = sample.path;

      const pkg = { name: 'my-package', version: '0.0.0' };
      const builder = { name: 'my-builder', version: '0.0.0' };

      const res = await Pkg.Dist.compute({ dir, pkg, builder, entry });
      renderDist(res.dist);

      expect(res.exists).to.eql(true);
      expect(res.error).to.eql(undefined);

      const typeUrl = res.dist.type;
      expect(typeUrl.startsWith('https://jsr.io/@sys/types')).to.eql(true);
      expect(typeUrl.endsWith('src/types/t.Pkg.dist.ts')).to.eql(true);

      expect(res.dir).to.eql(Fs.resolve(dir));

      const dist = res.dist;
      expect(dist.pkg).to.eql(pkg);
      expect(dist.entry).to.eql(Path.normalize(entry));
      expect(dist.url.base).to.eql('/');

      expect(dist.build.time).to.be.closeTo(Time.now.timestamp, 100);
      expect(dist.build.builder).to.eql(Pkg.toString(builder));
      expect(dist.build.runtime.includes('deno=')).to.be.true;
      expect(dist.build.runtime.includes('v8=')).to.be.true;
      expect(dist.build.runtime.includes('typescript=')).to.be.true;

      expect(Is.number(dist.build.size.total)).to.be.true;
      expect(Is.number(dist.build.size.pkg)).to.be.true;

      const dirhash = await Dir.Hash.compute(dir, (p) => p !== './dist.json');
      expect(dist.hash.digest).to.eql(dirhash.hash.digest);
      expect(dist.hash.parts).to.eql(dirhash.hash.parts);
    });

    it('custom: url/base (compiled pathing)', async () => {
      const pkg = { name: 'my-package', version: '0.0.0' };
      const builder = { name: 'my-builder', version: '0.0.0' };
      const sample = await Sample.init();
      const { dir, entry } = sample.path;

      const url: t.DistPkg['url'] = { base: '/foo/' };
      const res = await Pkg.Dist.compute({ dir, pkg, builder, url, entry });

      expect(res.dist.url).to.eql(url);
    });

    it('{pkg} not passed → <unknown> package', async () => {
      const sample = await Sample.init();
      const { dir, entry } = sample.path;
      const res = await Pkg.Dist.compute({ dir, entry });
      expect(Pkg.Is.unknown(res.dist.pkg)).to.eql(true);
      expect(Pkg.Is.unknown(res.dist.build.builder)).to.eql(true);
    });

    it('default: does not save to file', async () => {
      const sample = await Sample.init();
      const { dir, entry, filepath } = sample.path;
      const exists = () => Fs.exists(filepath);

      expect(await exists()).to.eql(false);
      await Pkg.Dist.compute({ dir, pkg, entry });
      expect(await exists()).to.eql(false); // NB: never written.
    });

    it('{save:true} → saves to file-system', async () => {
      const sample = await Sample.init();
      const { dir, entry, filepath } = sample.path;
      const exists = () => Fs.exists(filepath);
      expect(await exists()).to.eql(false);

      const res = await Pkg.Dist.compute({ dir, pkg, entry, save: true });
      expect(await exists()).to.eql(true);

      const json = (await Fs.readJson(filepath)).data;
      expect(json).to.eql(res.dist);
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
      const sample = await Sample.init();
      await sample.file.dist.ensure();

      const test = async (path: string) => {
        const res = await Pkg.Dist.load(path);
        expect(res.path).to.eql(Fs.resolve(sample.path.filepath));
        expect(res.exists).to.eql(true);
        expect(res.error).to.eql(undefined);
        expect(res.dist?.pkg).to.eql(pkg); // NB: loaded, with data.
      };

      await test(sample.path.dir); // NB: div ← "/dist.json" appended.
      await test(sample.path.filepath);
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
      const sample = await Sample.init();
      await sample.file.dist.reset();
      await sample.file.dist.ensure();

      const { dir } = sample.path;

      const test = async (hashInput?: t.StringHash | t.CompositeHash) => {
        const res = await Pkg.Dist.verify(dir, hashInput);
        expect(res.exists).to.eql(true, `exists: ${dir}`);
        expect(res.is.valid).to.eql(true);
        expect(res.dist?.pkg).to.eql(pkg);
      };

      await test();
      await test('./dist.json');

      const path = Path.join(dir, 'dist.json');
      await test(Fs.resolve(path)); // absolute path (anywhere).
      await test((await Dist.load(path)).dist?.hash);
    });

    it('validate: not valid (pass in "man in the middle" attacked state)', async () => {
      const sample = await Sample.init();
      const dir = sample.path.dir;
      await sample.file.dist.ensure();

      const test = async (
        expectedValid: boolean,
        mutate?: (hash: t.DeepMutable<t.CompositeHash>) => void,
      ) => {
        const dist = (await Pkg.Dist.compute({ dir })).dist;
        const hash = R.clone(dist.hash);
        mutate?.(hash); // ← (test manipulation) setup test conditions.

        const verification = await Pkg.Dist.verify(dir, hash);
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
      const sample = await Sample.init();
      const dir = sample.path.dir;
      await sample.file.dist.delete();

      const res = await Pkg.Dist.verify(dir);
      expect(res.exists).to.eql(false);
      expect(res.dist).to.eql(undefined);
      expect(res.error?.message).to.include('does not exist');
      expect(res.is.valid).to.eql(undefined); // Falsy.
    });
  });
});
