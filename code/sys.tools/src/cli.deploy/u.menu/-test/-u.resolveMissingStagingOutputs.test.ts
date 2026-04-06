import { type t, describe, expect, Fs, it, Pkg } from '../../../-test.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import { resolveMissingStagingOutputs } from '../u/u.resolveMissingStagingOutputs.ts';

describe('Deploy: resolveMissingStagingOutputs', () => {
  it('lists mappings whose staging output has no dist.json digest', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/stage/slc-website`);
      await Fs.write(`${tmp}/stage/slc-website/index.html`, '<html></html>');
      await Pkg.Dist.compute({
        dir: `${tmp}/stage/slc-website`,
        pkg: { name: '@test/pkg', version: '0.0.0' },
        builder: { name: '@test/pkg', version: '0.0.0' },
        save: true,
      });

      const missing = await resolveMissingStagingOutputs({
        cwd: tmp as t.StringDir,
        yamlPath: './noop.yaml' as t.StringRelativeDir,
        yaml: {
          staging: { dir: './stage' },
          mappings: [
            {
              mode: 'build+copy',
              dir: { source: './slc-website', staging: './slc-website' },
            },
            {
              mode: 'build+copy',
              dir: { source: './slc-data', staging: './slc-data' },
            },
          ],
        },
      });

      expect(missing).to.eql(['slc-data']);
    });
  });

  it('returns all missing mapping names in mapping order', async () => {
    await withTmpDir(async (tmp) => {
      const missing = await resolveMissingStagingOutputs({
        cwd: tmp as t.StringDir,
        yamlPath: './noop.yaml' as t.StringRelativeDir,
        yaml: {
          staging: { dir: './stage' },
          mappings: [
            {
              mode: 'copy',
              dir: { source: './slc-data', staging: './slc-data' },
            },
            {
              mode: 'copy',
              dir: { source: './slc-website', staging: './slc-website' },
            },
          ],
        },
      });

      expect(missing).to.eql(['slc-data', 'slc-website']);
    });
  });

  it('preserves nested staging-relative paths in missing output names', async () => {
    await withTmpDir(async (tmp) => {
      const missing = await resolveMissingStagingOutputs({
        cwd: tmp as t.StringDir,
        yamlPath: './noop.yaml' as t.StringRelativeDir,
        yaml: {
          staging: { dir: './stage' },
          mappings: [
            {
              mode: 'copy',
              dir: { source: './pkg', staging: './releases/sys.app.shell' },
            },
          ],
        },
      });

      expect(missing).to.eql(['releases/sys.app.shell']);
    });
  });
});
