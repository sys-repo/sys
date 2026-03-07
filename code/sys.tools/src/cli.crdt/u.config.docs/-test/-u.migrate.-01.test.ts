import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it, pkg } from '../../../-test.ts';
import { migrate01 } from '../u.migrate.-01.ts';
import { CrdtDocsFs } from '../u.fs.ts';

describe('CrdtDocsMigrate.-01', () => {
  it('moves pkg-scoped YAMLs into flattened dir', async () => {
    await withTmpDir(async (tmp: string) => {
      const legacyDir = `${tmp}/-config/${pkg.name}/crdt/docs`;
      await Fs.ensureDir(legacyDir);
      await Fs.write(`${legacyDir}/alpha.yaml`, 'id: alpha\n');

      const res = await migrate01(tmp);

      expect(res.migrated.length).to.eql(1);
      expect(res.skipped.length).to.eql(0);

      const nextDir = `${tmp}/${CrdtDocsFs.dir}`;
      const nextPath = `${nextDir}/alpha.yaml`;
      expect(await Fs.exists(nextPath)).to.eql(true);
      expect(await Fs.exists(legacyDir)).to.eql(false);
    });
  });
});
