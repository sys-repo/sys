import { describe, expect, Fs, it } from '../../../-test.ts';
import { CrdtDocsFs } from '../u.fs.ts';
import { CrdtDocsMigrate } from '../u.migrate.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import type { LegacyConfigDoc } from '../../u.migrate.legacy.ts';

describe('CrdtDocsMigrate', () => {
  it('migrates JSON docs to YAML', async () => {
    await withTmpDir(async (tmp: string) => {
      const legacy: LegacyConfigDoc = {
        docs: [
          { id: 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw', name: 'alpha', createdAt: 1 },
          { id: '28pHMgPCrMR82eexLbPzvXq3RnSy', name: 'beta', createdAt: 2 },
        ],
      };

      const res = await CrdtDocsMigrate.run(tmp, legacy);

      expect(res.migrated).to.eql(2);
      for (const doc of legacy.docs ?? []) {
        const path = Fs.join(tmp, CrdtDocsFs.fileOf(doc.id));
        expect(await Fs.exists(path)).to.eql(true);
      }
    });
  });

  it('skips when YAML already exists', async () => {
    await withTmpDir(async (tmp: string) => {
      const id = 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw';
      const legacy: LegacyConfigDoc = {
        docs: [{ id, name: 'alpha', createdAt: 1 }],
      };

      await Fs.write(Fs.join(tmp, CrdtDocsFs.fileOf(id)), `id: ${id}\n`);

      const res = await CrdtDocsMigrate.run(tmp, legacy);

      expect(res.migrated).to.eql(0);
      expect(res.skipped).to.eql(1);
    });
  });
});
