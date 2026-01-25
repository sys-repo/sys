import { describe, expect, Fs, it, Pkg } from '../../../-test.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import { runStagingWithSpinner } from '../run.stagingWithSpinner.ts';

describe('Staging: runStagingWithSpinner', () => {
  it('regenerates root dist.json when cleanStagingRoot runs', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');

      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/dist.json`, 'sentinel');

      const mappings = [{ mode: 'copy' as const, dir: { source: 'src', staging: '.' } }];
      const res = await runStagingWithSpinner({ cwd: tmp, mappings, stagingRoot: 'stage' });
      expect(res.ok).to.eql(true);

      const text = (await Fs.readText(`${tmp}/stage/dist.json`)).data!;
      expect(text).to.not.eql('sentinel');

      const dist = await Pkg.Dist.load(`${tmp}/stage`);
      expect(dist.exists).to.eql(true);
    });
  });
});
