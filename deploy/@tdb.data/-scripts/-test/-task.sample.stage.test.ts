import { Fs } from '@sys/fs';
import { SlcDataCli as Cli } from '@tdb/slc-data/cli';
import { describe, expect, it, Path } from '../../src/-test.ts';
import { run as runCreate } from '../task.sample.create.ts';
import { run as runStage } from '../task.sample.stage.ts';
import { StageProfileSchema } from '../../src/fs/m.cli/schema/mod.ts';

const SAMPLE_DATA_DIR = 'public/data';

describe('task.sample.stage', () => {
  it('stages the created sample profile into the derived target', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../src/-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const localSample = Fs.join(cwd, 'src/-test/sample-1');
      await Fs.copy(sample, localSample);

      await runCreate({ cwd });
      const result = await runStage({ cwd, profile: 'sample-1' });
      const publicData = Fs.join(cwd, SAMPLE_DATA_DIR);

      expect(result.kind).to.eql('staged');
      expect(result.dirs).to.eql([
        Fs.join(cwd, SAMPLE_DATA_DIR, 'sample-one'),
        Fs.join(cwd, SAMPLE_DATA_DIR, 'sample-two'),
      ]);
      const toPath = (dir: string, path: string) => Fs.join(dir, path);
      expect(await Fs.exists(toPath(result.dirs[0], 'manifests/slug-tree.sample-one.json'))).be.true;
      expect(await Fs.exists(toPath(result.dirs[1], 'manifests/slug-tree.sample-two.json'))).be.true;
      expect(await Fs.exists(Fs.join(publicData, 'mounts.json'))).be.true;
      expect(await Fs.exists(Fs.join(publicData, 'sample-one', 'manifests', 'slug-tree.sample-one.json'))).be.true;
      expect(await Fs.exists(Fs.join(publicData, 'sample-two', 'manifests', 'slug-tree.sample-two.json'))).be.true;
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('stages all discovered stage profiles by default', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../src/-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const configDir = Fs.join(cwd, '-config', '@tdb.slc-data');
      const localSample = Fs.join(cwd, 'src/-test/sample-1');
      await Fs.copy(sample, localSample);
      await Fs.ensureDir(configDir);
      await Fs.write(
        Fs.join(configDir, 'sample-1.yaml'),
        StageProfileSchema.stringify({ mappings: [{ mount: 'sample-1', source: './src/-test/sample-1' }] }),
      );
      await Fs.write(
        Fs.join(configDir, 'venture-examples.yaml'),
        StageProfileSchema.stringify({ mappings: [{ mount: 'venture-examples', source: './src/-test/sample-1' }] }),
      );
      const result = await runStage({ cwd });

      expect(result.dirs).to.eql([Fs.join(cwd, SAMPLE_DATA_DIR, 'venture-examples')]);
      expect(await Fs.exists(Fs.join(cwd, SAMPLE_DATA_DIR, 'sample-1', 'manifests', 'slug-tree.sample-1.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(cwd, SAMPLE_DATA_DIR, 'venture-examples', 'manifests', 'slug-tree.venture-examples.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('exports the explicitly requested profile to the public data dir', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../src/-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const configDir = Fs.join(cwd, '-config', '@tdb.slc-data');
      const localSample = Fs.join(cwd, 'src/-test/sample-1');
      await Fs.copy(sample, localSample);
      await Fs.ensureDir(configDir);
      await Fs.write(
        Fs.join(configDir, 'venture-examples.yaml'),
        StageProfileSchema.stringify({ mappings: [{ mount: 'venture-examples', source: './src/-test/sample-1' }] }),
      );
      await Fs.write(
        Fs.join(configDir, 'sample-1.yaml'),
        StageProfileSchema.stringify({ mappings: [{ mount: 'sample-1', source: './src/-test/sample-1' }] }),
      );

      await runStage({ cwd, profile: 'sample-1' });

      expect(await Fs.exists(Fs.join(cwd, SAMPLE_DATA_DIR, 'sample-1', 'manifests', 'slug-tree.sample-1.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(cwd, SAMPLE_DATA_DIR, 'venture-examples'))).to.eql(false);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
