import { describe, expect, it, sampleDir, slug, Time } from '../-test.ts';
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
      const paths = sample.paths;

      const a = await Dir.snapshot(paths.source, paths.target);
      await Time.wait(10);
      await sample.modify();
      const b = await Dir.snapshot(paths.source, paths.target);

      expect(b.timestamp).to.be.greaterThan(a.timestamp); // NB: seqentual folder layout.

      expect(a.error).to.eql(undefined);
      expect(b.error).to.eql(undefined);

      const read = (dir: string) => Deno.readTextFile(Path.join(dir, 'mod.ts'));
      const readA = await read(a.path.target);
      const readB = await read(b.path.target);
      expect(readA).to.not.eql(readB); // NB: modified content between snapshots.
    });
  });
});
