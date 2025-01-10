import { type t, c, describe, expect, it, sampleDir, slug, Time } from '../-test.ts';
import { DirHash } from '../m.Dir.Hash/mod.ts';
import { DirSnapshot } from '../m.Dir.Snapshot/mod.ts';
import { Dir } from '../m.Dir/mod.ts';
import { Fs, Path } from './common.ts';

const toHash = async (dir: t.StringDir) => (await DirHash.compute(dir)).hash;

describe('Fs.Dir.Snapshot', () => {
  const sampleSetup = async (options: { slug?: boolean } = {}) => {
    const sample = sampleDir('Fs.Dir.snapshot', options);
    const paths = {
      source: Path.join(sample.dir, 'source'),
      target: Path.join(sample.dir, 'target'),
    };
    await sample.ensureExists();
    await Fs.copy('src/-test/-sample-2', paths.source);

    return {
      paths,
      async ls() {
        console.info('Sample Dir:', sample.dir);
        console.info('paths:', await Fs.ls(paths.target));
      },
      async modify() {
        const path = Path.join(paths.source, 'mod.ts');
        const text = `// Foo: change-${slug()}`;
        await Fs.write(path, text);
      },
    } as const;
  };

  it('API', () => {
    expect(Dir.Snapshot).to.equal(Dir.Snapshot);
    expect(Dir.snapshot).to.equal(Dir.Snapshot.write);
  });

  describe('Snapshot.write', () => {
    it('filename: snapshot.<unix-timestamp>.#<digest>', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;

      const snapshot = await DirSnapshot.write({ source, target });
      const hxSource = await toHash(source);
      const hxTarget = await toHash(snapshot.path.target.files);

      expect(hxSource).to.eql(hxTarget);
      expect(snapshot.hx).to.eql(hxTarget);
      expect(snapshot.hx).to.eql(hxSource);
      expect(snapshot.path.target.root.endsWith(hxTarget.digest.slice(-5))).to.be.true;
      expect(snapshot.is.backref).to.eql(false);

      console.info(c.cyan(`${'<Type>'}: ${c.bold('DirSnapshot')}\n\n`), snapshot, '\n');
      console.info(`${c.brightCyan('ls')}("${c.gray(target)}"):\n`, await Fs.ls(target));
    });

    it('run: Dir.snapshot("source", "target")', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;

      const snapshotA = await Dir.snapshot({ source, target });
      await Time.wait(10);
      await sample.modify();
      const snapshotB = await Dir.snapshot({ source, target, force: true });

      expect(snapshotB.timestamp).to.be.greaterThan(snapshotA.timestamp); // NB: seqentual folder layout.

      expect(snapshotA.error).to.eql(undefined);
      expect(snapshotB.error).to.eql(undefined);

      const read = (dir: string) => Deno.readTextFile(Path.join(dir, 'mod.ts'));
      const readA = await read(snapshotA.path.target.files);
      const readB = await read(snapshotB.path.target.files);
      expect(readA).to.not.eql(readB); // NB: modified content between snapshots.
    });

    it('filter', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;

      const snapshotA = await Dir.snapshot({ source, target });
      const snapshotB = await Dir.snapshot({
        source,
        target,
        filter(path) {
          // Example: exclude all YAML files.
          return !path.endsWith('.yaml');
        },
      });

      const contains = (snapshot: t.DirSnapshot, filename: string) => {
        const paths = Object.keys(snapshot.hx.parts);
        return paths.some((p) => p.endsWith(filename));
      };

      expect(contains(snapshotA, 'foo.yaml')).to.eql(true);
      expect(contains(snapshotB, 'foo.yaml')).to.eql(false); // NB: filtered out of the copy-set.
    });

    it('meta: dir.json', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;
      const snapshot = await Dir.snapshot({ source, target });
      const res = (await Fs.readJson<t.DirSnapshotMeta>(snapshot.path.target.meta)).data;
      expect(res?.hx).to.eql(snapshot.hx);
    });
  });

  describe('De-dupe: backref stubs for existing content', () => {
    const loadMeta = async (path: t.StringPath) => {
      return (await Fs.readJson<t.DirSnapshotMeta>(path)).data;
    };

    it('saves backref (default)', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;

      // NB: write in sample noise to ensure it is ignored by the algorithm.
      await Fs.write(Fs.join(target, 'foo.txt'), 'Foobar');
      await Fs.writeJson(Fs.join(target, 'snapshot.1234.hx123/dir.json'), { foo: 123 });

      const a = await Dir.snapshot({ source, target });
      await Time.wait(10); // NB: different timestamp.
      const b = await Dir.snapshot({ source, target });

      expect(a.is.backref).to.eql(false);
      expect(b.is.backref).to.eql(true);
      expect(a.path.target.root.endsWith('.ref')).to.be.false;
      expect(b.path.target.root.endsWith('.ref')).to.be.true;

      expect(b.path.target.files).to.eql(a.path.target.files); //   NB: points to referenced files.
      expect(b.path.target.meta).to.not.eql(a.path.target.meta); // NB: points to backref stub.

      const ls = await Fs.ls(target);
      expect(ls.includes(a.path.target.meta)).to.be.true;
      expect(ls.includes(b.path.target.meta)).to.be.true;
      expect(await Fs.exists(Fs.join(a.path.target.root, 'dir'))).to.be.true;
      expect(await Fs.exists(Fs.join(b.path.target.root, 'dir'))).to.be.false;

      const metaA = await loadMeta(a.path.target.meta);
      const metaB = await loadMeta(b.path.target.meta);
      expect(metaA).to.not.eql(metaB);
      expect(metaA?.hx).to.eql(metaB?.hx);
      expect(metaA?.is.ref).to.eql(false);
      expect(metaB?.is.ref).to.eql(true);
    });

    it('options: {force} ← backref not used', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;

      const a = await Dir.snapshot({ source, target });
      await Time.wait(10); // NB: different timestamp.
      const b = await Dir.snapshot({ source, target, force: true });

      expect(a.is.backref).to.eql(false);
      expect(b.is.backref).to.eql(false);
      expect(a.path.target.root.endsWith('.backref')).to.be.false;
      expect(b.path.target.root.endsWith('.backref')).to.be.false;

      expect(a.path.target.meta).to.not.eql(b.path.target.meta);

      const metaA = await loadMeta(a.path.target.meta);
      const metaB = await loadMeta(b.path.target.meta);
      expect(metaA).to.eql(metaB); // NB: equivalient duplicated snapshot directories.
      expect(metaA?.is.ref).to.eql(false);
      expect(metaB?.is.ref).to.eql(false);
    });
  });
});
