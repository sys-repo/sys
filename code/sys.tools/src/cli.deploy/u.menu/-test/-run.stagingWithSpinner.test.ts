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
      const res = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
        clear: true,
      });
      expect(res.ok).to.eql(true);

      const text = (await Fs.readText(`${tmp}/stage/dist.json`)).data!;
      expect(text).to.not.eql('sentinel');

      const dist = await Pkg.Dist.load(`${tmp}/stage`);
      expect(dist.exists).to.eql(true);
    });
  });

  it('trustChildDist: root dist.json reuses child hashes', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');

      const childDir = `${tmp}/stage/child`;
      await Fs.ensureDir(childDir);
      await Fs.write(`${childDir}/a.txt`, 'v1');
      await Pkg.Dist.compute({
        dir: childDir,
        pkg: { name: '@child/pkg', version: '0.0.0' },
        builder: { name: '@child/pkg', version: '0.0.0' },
        save: true,
      });
      await Fs.remove(`${childDir}/a.txt`);

      const mappings = [{ mode: 'copy' as const, dir: { source: 'src', staging: 'other' } }];
      const res = await runStagingWithSpinner({ cwd: tmp, mappings, stagingRoot: 'stage' });
      expect(res.ok).to.eql(true);

      const root = await Pkg.Dist.load(`${tmp}/stage`);
      expect(root.exists).to.eql(true);
      expect(root.dist?.hash.parts['child/a.txt']).to.not.eql(undefined);
      expect(root.dist?.hash.parts['child/.DS_Store']).to.eql(undefined);
    });
  });
});
