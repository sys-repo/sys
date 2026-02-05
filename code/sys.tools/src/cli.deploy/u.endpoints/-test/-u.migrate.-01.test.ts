import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it, pkg } from '../../../-test.ts';
import { migrate01 } from '../u.migrate.-01.ts';
import { EndpointsFs } from '../mod.ts';

describe('EndpointsMigrate.-01', () => {
  it('moves pkg-scoped YAMLs into flattened dir', async () => {
    await withTmpDir(async (tmp) => {
      const legacyDir = `${tmp}/-config/${pkg.name}/deploy`;
      await Fs.ensureDir(legacyDir);
      await Fs.write(`${legacyDir}/alpha.yaml`, 'name: alpha\n');

      const res = await migrate01(tmp);

      expect(res.migrated).to.eql(1);
      expect(res.skipped).to.eql(0);

      const nextDir = `${tmp}/${EndpointsFs.dir}`;
      const nextPath = `${nextDir}/alpha.yaml`;
      expect(await Fs.exists(nextPath)).to.eql(true);
      expect(await Fs.exists(legacyDir)).to.eql(false);
    });
  });
});
