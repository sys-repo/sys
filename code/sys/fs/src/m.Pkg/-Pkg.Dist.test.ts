import { type t, describe, expect, it, pkg } from '../-test.ts';
import { pkg as fsPkg } from '../pkg.ts';
import { Dir } from '../mod.ts';
import { Sample } from './-u.ts';
import { D, Fs, Is, JsrUrl, Path, R, Str, Time, c } from './common.ts';
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

      const expectedPolicy = JsrUrl.Pkg.file(fsPkg, D.hashPolicy.path);
      expect(dist.build.hash.policy).to.eql(expectedPolicy);

      const policyPath = Fs.resolve(`./${D.hashPolicy.path}`);
      expect(await Fs.exists(policyPath)).to.eql(true);

      expect(Is.number(dist.build.size.total)).to.be.true;
      expect(Is.number(dist.build.size.pkg)).to.be.true;

      const dirhash = await Dir.Hash.compute(dir, (p) => p !== './dist.json');
      expect(dist.hash.digest).to.eql(dirhash.hash.digest);
      expect(dist.hash.parts).to.eql(dirhash.hash.parts);
    });

    it('Dist.compute(): applies custom filter to hash manifest (in addition to dist.json exclusion)', async () => {
      const sample = await Sample.init();
      const { dir, entry } = sample.path;

      const pkg = { name: 'my-package', version: '0.0.0' };
      const builder = { name: 'my-builder', version: '0.0.0' };

      /**
       * Prepare an extra file that will be ignored by the filter.
       */
      const ignoredFilename = 'ignore.me';
      const ignoredAbsPath = Path.join(dir, ignoredFilename);
      await Fs.write(ignoredAbsPath, 'ignore-this-file');
      const ignoredRelPath = `./${ignoredFilename}`;

      /**
       * Dist.compute filter:
       *   - always exclude "./dist.json" (inside Dist implementation)
       *   - additionally exclude "./ignore.me" (here)
       */
      const filter = (p: t.StringPath) => p !== ignoredRelPath;
      const res = await Pkg.Dist.compute({ dir, pkg, builder, entry, filter });
      const dist = res.dist;

      expect(res.exists).to.eql(true);
      expect(res.error).to.eql(undefined);

      /**
       * Reference hash using the equivalent combined filter:
       *   - ex: "./dist.json"
       *   - ex: "./ignore.me"
       */
      const dirhash = await Dir.Hash.compute(
        dir,
        (p) => p !== './dist.json' && p !== ignoredRelPath,
      );

      expect(dist.hash.digest).to.eql(dirhash.hash.digest);
      expect(dist.hash.parts).to.eql(dirhash.hash.parts);
      expect(Object.prototype.hasOwnProperty.call(dist.hash.parts, ignoredRelPath)).to.eql(false);
    });

    it('Dist.compute(): excludes root dist.json regardless of key style', async () => {
      const sample = await Sample.init();
      const { dir, entry } = sample.path;
      const res = await Pkg.Dist.compute({ dir, pkg, entry, save: true });
      const keys = Object.keys(res.dist.hash.parts);
      expect(keys.includes('./dist.json')).to.eql(false);
      expect(keys.includes('dist.json')).to.eql(false);
    });

    it('Dist.compute(): root hash is idempotent across repeated save runs', async () => {
      const sample = await Sample.init();
      const { dir, entry } = sample.path;

      const first = await Pkg.Dist.compute({ dir, pkg, entry, save: true });
      const second = await Pkg.Dist.compute({ dir, pkg, entry, save: true });

      expect(first.dist.hash.digest).to.eql(second.dist.hash.digest);
      expect(first.dist.hash.parts).to.eql(second.dist.hash.parts);
      expect(Object.keys(second.dist.hash.parts).includes('./dist.json')).to.eql(false);
      expect(Object.keys(second.dist.hash.parts).includes('dist.json')).to.eql(false);
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

    it('trustChildDist: reuses child content hashes without hashing child dist.json bytes', async () => {
      const root = Fs.resolve('./.tmp/Pkg.Dist.trustChildDist/');
      await Fs.remove(root);
      await Fs.ensureDir(root);

      try {
        const childDir = Fs.join(root, 'child');
        await Fs.ensureDir(childDir);
        await Fs.write(Fs.join(childDir, 'a.txt'), 'v1');

        const childRes = await Pkg.Dist.compute({
          dir: childDir,
          pkg: { name: '@child/pkg', version: '0.0.0' },
          builder: { name: '@child/pkg', version: '0.0.0' },
          save: true,
        });

        const rootRes = await Pkg.Dist.compute({
          dir: root,
          pkg: { name: '@root/pkg', version: '0.0.0' },
          builder: { name: '@root/pkg', version: '0.0.0' },
          trustChildDist: true,
          save: true,
        });

        const childParts = childRes.dist.hash.parts;
        const childKey = Object.keys(childParts).find((p) => p.endsWith('a.txt'));
        expect(childKey).to.not.eql(undefined);

        const childRel = Str.trimLeadingDotSlash(String(childKey));
        const rootKey = Path.join('child', childRel);
        expect(rootRes.dist.hash.parts[rootKey]).to.eql(childParts[childKey!]);

        const distKey = Path.join('child', 'dist.json');
        expect(rootRes.dist.hash.parts[distKey]).to.eql(undefined);

        const verify = await Pkg.Dist.verify(root, rootRes.dist.hash);
        expect(verify.is.valid).to.eql(true);
      } finally {
        await Fs.remove(root);
      }
    });

    it('trustChildDist: parent hash is idempotent across repeated save runs', async () => {
      const root = Fs.resolve('./.tmp/Pkg.Dist.trustChildDist.idempotent/');
      await Fs.remove(root);
      await Fs.ensureDir(root);

      try {
        const childDir = Fs.join(root, 'child');
        await Fs.ensureDir(childDir);
        await Fs.write(Fs.join(childDir, 'a.txt'), 'v1');

        await Pkg.Dist.compute({
          dir: childDir,
          pkg: { name: '@child/pkg', version: '0.0.0' },
          builder: { name: '@child/pkg', version: '0.0.0' },
          save: true,
        });

        const first = await Pkg.Dist.compute({
          dir: root,
          pkg: { name: '@root/pkg', version: '0.0.0' },
          builder: { name: '@root/pkg', version: '0.0.0' },
          trustChildDist: true,
          save: true,
        });

        const second = await Pkg.Dist.compute({
          dir: root,
          pkg: { name: '@root/pkg', version: '0.0.0' },
          builder: { name: '@root/pkg', version: '0.0.0' },
          trustChildDist: true,
          save: true,
        });

        expect(first.dist.hash.digest).to.eql(second.dist.hash.digest);
        expect(first.dist.hash.parts).to.eql(second.dist.hash.parts);
        expect(Object.keys(second.dist.hash.parts).includes('child/dist.json')).to.eql(false);

        const verify = await Pkg.Dist.verify(root, second.dist.hash);
        expect(verify.is.valid).to.eql(true);
      } finally {
        await Fs.remove(root);
      }
    });

    it('trustChildDist: ignores invalid child dist.json and falls back to file hashing', async () => {
      const root = Fs.resolve('./.tmp/Pkg.Dist.trustChildDist.invalid-child/');
      await Fs.remove(root);
      await Fs.ensureDir(root);

      try {
        const childDir = Fs.join(root, 'child');
        await Fs.ensureDir(childDir);
        await Fs.write(Fs.join(childDir, 'a.txt'), 'v1');
        await Fs.write(Fs.join(childDir, 'dist.json'), '{"not":"a-dist"}\n');

        const first = await Pkg.Dist.compute({
          dir: root,
          pkg: { name: '@root/pkg', version: '0.0.0' },
          builder: { name: '@root/pkg', version: '0.0.0' },
          trustChildDist: true,
          save: true,
        });

        const second = await Pkg.Dist.compute({
          dir: root,
          pkg: { name: '@root/pkg', version: '0.0.0' },
          builder: { name: '@root/pkg', version: '0.0.0' },
          trustChildDist: true,
          save: true,
        });

        expect(first.dist.hash.digest).to.eql(second.dist.hash.digest);
        expect(first.dist.hash.parts).to.eql(second.dist.hash.parts);
        expect(first.dist.hash.parts['child/a.txt']).to.not.eql(undefined);
        expect(first.dist.hash.parts['child/dist.json']).to.eql(undefined);

        const verify = await Pkg.Dist.verify(root, second.dist.hash);
        expect(verify.is.valid).to.eql(true);
      } finally {
        await Fs.remove(root);
      }
    });
  });

  describe('Log', () => {
    it('Log.children(): does not double-count nested content dirs', async () => {
      const root = Fs.resolve('./.tmp/Pkg.Dist.Log.children/');
      await Fs.remove(root);
      await Fs.ensureDir(root);

      // Child dist package at: ./sys/dev/dist.json
      const childDir = Fs.join(root, 'sys/dev');
      await Fs.ensureDir(childDir);
      await Fs.write(Fs.join(childDir, 'hello.txt'), 'child');
      await Pkg.Dist.compute({
        dir: childDir,
        pkg: { name: '@child/dev', version: '0.0.0' },
        builder: { name: '@child/dev', version: '0.0.0' },
        save: true,
      });

      // Content files under nested dirs (the old bug could count these twice).
      const staticDir = Fs.join(root, 'static/runtime');
      await Fs.ensureDir(staticDir);
      await Fs.write(Fs.join(root, 'static/README.md'), 'readme');
      await Fs.write(Fs.join(staticDir, 'a.bin'), 'a'.repeat(10));
      await Fs.write(Fs.join(staticDir, 'b.bin'), 'b'.repeat(20));

      // Root dist (must "see" child content in the hash parts).
      const computed = await Pkg.Dist.compute({
        dir: root,
        pkg: { name: '@root/pkg', version: '0.0.0' },
        builder: { name: '@root/pkg', version: '0.0.0' },
      });

      const dist = computed.dist;

      // Be robust to whether DirHash emits "./sys/dev/hello.txt" or "sys/dev/hello.txt".
      const childContentPath = Object.keys(dist.hash.parts).find((p) => {
        return (
          p === './sys/dev/hello.txt' ||
          p === 'sys/dev/hello.txt' ||
          p.endsWith('sys/dev/hello.txt')
        );
      });
      expect(childContentPath).to.not.equal(undefined);

      // Render.
      const text = await Pkg.Dist.Log.children(root, dist);

      // Extract "static content" files size from the rendered table.
      const contentLine = text
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.includes('static content'));
      expect(contentLine).to.not.equal(undefined);

      // Grab the last "<size>" token on the line (matches how the table prints it).
      const match = contentLine?.match(/(\d+(?:\.\d+)?\s*(?:B|KB|MB|GB))\s*$/);
      expect(match?.[1]).to.not.equal(undefined);

      // Expected bytes = sum of files NOT inside the child package root(s).
      const childRoot = Path.dirname(childContentPath ?? './sys/dev/hello.txt');
      const includedPaths = Object.keys(dist.hash.parts).filter(
        (p) => !p.startsWith(`${childRoot}/`),
      );

      let expectedBytes = 0;
      for (const rel of includedPaths) {
        const abs = Fs.join(root, rel);
        const stat = await Fs.stat(abs);
        expectedBytes += stat?.size ?? 0;
      }

      const expectedFmt = Str.bytes(expectedBytes);
      expect(match?.[1]).to.eql(expectedFmt);
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
