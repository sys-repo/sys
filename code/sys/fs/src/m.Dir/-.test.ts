import { type t, describe, expect, it, sampleDir, slug, Time } from '../-test.ts';
import { Fs, Path } from './common.ts';
import { Dir } from './mod.ts';

describe('Fs.Dir', () => {
  it('API', async () => {
    const m = await import('@sys/fs/dir');
    expect(m.Dir).to.equal(Dir);
  });

  describe('Dir.snapshot', () => {
    const sampleSetup = async (options: { slug?: boolean } = {}) => {
      const sample = sampleDir('Fs.Dir.snapshot', options);
      const paths = {
        source: Path.join(sample.dir, 'source'),
        target: Path.join(sample.dir, 'target'),
      };
      await sample.ensureExists();
      await Fs.copy('src/-test/-sample-dir-2', paths.source);

      return {
        paths,
        async ls() {
          console.info('Sample Dir:', sample.dir);
          console.log('paths:', await Fs.ls(paths.target));
        },
        async modify() {
          const path = Path.join(paths.source, 'mod.ts');
          const text = `// Foo: change-${slug()}`;
          await Fs.write(path, text);
        },
      } as const;
    };

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
        filter: (path) => Path.basename(path) !== 'mod.ts',
      });

      const contains = (snapshot: t.DirSnapshot, filename: string) => {
        return snapshot.copied.some((p) => p.endsWith(filename));
      };

      expect(contains(snapshotA, 'mod.ts')).to.eql(true);
      expect(contains(snapshotB, 'mod.ts')).to.eql(false); // NB: filtered out of copy-set/
    });
  });
});
