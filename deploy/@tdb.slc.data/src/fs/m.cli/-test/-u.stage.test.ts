import { describe, expect, it, Path } from '../../../-test.ts';
import { Fs } from '../../common.ts';
import { StageProfileSchema } from '../schema/mod.ts';
import { runStageProfile, runStageProfileMapping } from '../u.stage.ts';

describe('runStageProfile', () => {
  it('stages from a yaml profile into the derived target', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const configDir = Fs.join(cwd, '-config', '@tdb.slc-data');
      const profilePath = Fs.join(configDir, 'sample-1.yaml');

      await Fs.ensureDir(configDir);
      await Fs.write(
        profilePath,
        StageProfileSchema.stringify({
          mappings: [{ mount: 'sample-1', source: sample }],
        }),
      );

      const result = await runStageProfile({ cwd, path: profilePath });

      expect(result.kind).to.eql('staged');
      expect(result.dirs).to.eql([Fs.join(cwd, '.tmp/staging.slc-data', 'sample-1')]);
      expect(await Fs.exists(Fs.join(result.dirs[0], 'manifests', 'slug-tree.sample-1.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(result.dirs[0], 'manifests', 'slug-tree.sample-1.yaml'))).to.eql(true);
      expect(await Fs.exists(Fs.join(result.dirs[0], 'manifests', 'slug-tree.sample-1.assets.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('stages one mapping from a multi-mapping profile', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const configDir = Fs.join(cwd, '-config', '@tdb.slc-data');
      const profilePath = Fs.join(configDir, 'sample-1.yaml');

      await Fs.ensureDir(configDir);
      await Fs.write(
        profilePath,
        StageProfileSchema.stringify({
          mappings: [
            { mount: 'sample-1', source: sample },
            { mount: 'venture-examples', source: sample },
          ],
        }),
      );

      const result = await runStageProfileMapping({ cwd, path: profilePath, index: 1 });

      expect(result.kind).to.eql('staged');
      expect(result.dirs).to.eql([Fs.join(cwd, '.tmp/staging.slc-data', 'venture-examples')]);
      expect(await Fs.exists(Fs.join(result.dirs[0], 'manifests', 'slug-tree.venture-examples.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('rejects invalid profiles with readable validation detail', async () => {
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const configDir = Fs.join(cwd, '-config', '@tdb.slc-data');
      const profilePath = Fs.join(configDir, 'yo.yaml');

      await Fs.ensureDir(configDir);
      await Fs.write(
        profilePath,
        [
          'mappings:',
          '  - mount: yo/foo/bar',
          '    source: .',
          '',
        ].join('\n'),
      );

      try {
        await runStageProfile({ cwd, path: profilePath });
        expect.fail('Expected invalid stage profile error');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).to.contain(`Invalid stage profile: ${profilePath}`);
        expect(message).to.contain('/mappings/0: Expected union value');
      }
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
