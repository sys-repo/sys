import { Fs } from '@sys/fs';
import { SlcDataCli as Cli } from '@tdb/slc-data/cli';
import { describe, expect, it, Path } from '../../src/-test.ts';
import { run as runCreate } from '../task.sample.create.ts';
import { run as runStage } from '../task.sample.stage.ts';

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
      const toPath = (path: string) => Fs.join(result.dir, path);

      expect(result.kind).to.eql('staged');
      expect(result.dir).to.eql(Cli.StageProfile.fs.target(cwd, 'sample-1'));
      expect(await Fs.exists(toPath('manifests/slug-tree.sample-1.json'))).be.true;
      expect(await Fs.exists(toPath('manifests/slug-tree.sample-1.yaml'))).be.true;
      expect(await Fs.exists(toPath('manifests/slug-tree.sample-1.assets.json'))).be.true;
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
