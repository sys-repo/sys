import { describe, expect, it, Path } from '../../../-test.ts';
import { Fs } from '../../common.ts';
import { StageProfileSchema } from '../schema/mod.ts';
import { runStageProfile } from '../u.stage.ts';

describe('runStageProfile', () => {
  it('stages from a yaml profile into the derived target', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const sample = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const cwd = dir.absolute;
      const configDir = Fs.join(cwd, '-config', '@tdb.slc-data', 'stage');
      const profilePath = Fs.join(configDir, 'sample-1.yaml');

      await Fs.ensureDir(configDir);
      await Fs.write(profilePath, StageProfileSchema.stringify({ mount: 'sample-1', source: sample }));

      const result = await runStageProfile({ cwd, path: profilePath });

      expect(result.kind).to.eql('staged');
      expect(result.path).to.eql(Fs.join(cwd, '.tmp/staging.slc-data', 'sample-1'));
      expect(await Fs.exists(Fs.join(result.path, 'manifests', 'slug-tree.sample-1.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(result.path, 'manifests', 'slug-tree.sample-1.yaml'))).to.eql(true);
      expect(await Fs.exists(Fs.join(result.path, 'manifests', 'slug-tree.sample-1.assets.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
