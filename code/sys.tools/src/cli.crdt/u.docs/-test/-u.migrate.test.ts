import { describe, expect, Fs, it } from '../../../-test.ts';
import { Config } from '../../u.config.ts';
import { CrdtDocsFs } from '../u.fs.ts';
import { CrdtDocsMigrate } from '../u.migrate.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';

describe('CrdtDocsMigrate', () => {
  it('migrates JSON docs to YAML', async () => {
    await withTmpDir(async (tmp: string) => {
      const config = await Config.get(tmp);
      config.change((d) => {
        d.docs = [
          { id: 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw', name: 'alpha', createdAt: 1 },
          { id: '28pHMgPCrMR82eexLbPzvXq3RnSy', name: 'beta', createdAt: 2 },
        ];
      });
      await config.fs.save();

      const res = await CrdtDocsMigrate.run(tmp);

      expect(res.migrated).to.eql(2);
      for (const doc of config.current.docs ?? []) {
        const path = Fs.join(tmp, CrdtDocsFs.fileOf(doc.id));
        expect(await Fs.exists(path)).to.eql(true);
      }
    });
  });

  it('skips when YAML already exists', async () => {
    await withTmpDir(async (tmp: string) => {
      const config = await Config.get(tmp);
      const id = 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw';
      config.change((d) => {
        d.docs = [{ id, name: 'alpha', createdAt: 1 }];
      });
      await config.fs.save();

      await Fs.write(Fs.join(tmp, CrdtDocsFs.fileOf(id)), `id: ${id}\n`);

      const res = await CrdtDocsMigrate.run(tmp);

      expect(res.migrated).to.eql(0);
      expect(res.skipped).to.eql(1);
    });
  });
});
