import { type t, describe, expect, it, sampleDir, slug, Time, c } from '../-test.ts';
import { DirHash } from '../m.Dir.Hash/mod.ts';
import { Fs, Path } from './common.ts';
import { Dir } from './mod.ts';

const toHash = async (dir: t.StringDir) => (await DirHash.compute(dir)).hash;

describe('Fs.Dir', () => {
  it('API', async () => {
    const m = await import('@sys/fs/dir');
    expect(m.Dir).to.equal(Dir);
    expect(m.Dir.Hash).to.equal(DirHash);
  });

  describe('Dir.snapshot', () => {
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

    it('filename: snapshot.<unix-timestamp>.#<digest>', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;

      const snapshot = await Dir.snapshot({ source, target });
      const hxSource = await toHash(source);
      const hxTarget = await toHash(snapshot.path.target);

      expect(hxSource).to.eql(hxTarget);
      expect(snapshot.hx).to.eql(hxTarget);
      expect(snapshot.hx).to.eql(hxSource);
      expect(snapshot.path.target.endsWith(hxTarget.digest.slice(-5))).to.be.true;

      console.info(c.cyan(`${'<Type>'}: ${c.bold('DirSnapshot')}\n\n`), snapshot, '\n');
    });

    it('run: Dir.snapshot("source", "target")', async () => {
      const sample = await sampleSetup();
      const { source, target } = sample.paths;

      const snapshotA = await Dir.snapshot({ source, target });
      await Time.wait(10);
      await sample.modify();
      const snapshotB = await Dir.snapshot({ source, target });

      expect(snapshotB.timestamp).to.be.greaterThan(snapshotA.timestamp); // NB: seqentual folder layout.

      expect(snapshotA.error).to.eql(undefined);
      expect(snapshotB.error).to.eql(undefined);

      const read = (dir: string) => Deno.readTextFile(Path.join(dir, 'mod.ts'));
      const readA = await read(snapshotA.path.target);
      const readB = await read(snapshotB.path.target);
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
  });
});
