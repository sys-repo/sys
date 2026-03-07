import { describe, expect, Fs, it, pkg } from '../../-test.ts';
import { migrate01 } from '../u.migrate.-01.ts';

describe('BundleProfileMigrate.-01', () => {
  it('moves pkg-scoped YAMLs into flattened dir', async () => {
    const tmp = await Fs.makeTempDir();
    try {
      const legacyDir = `${tmp.absolute}/-config/${pkg.name}/bundle`;
      await Fs.ensureDir(legacyDir);
      await Fs.write(`${legacyDir}/alpha.yaml`, 'bundles: []\n');

      const res = await migrate01(tmp.absolute);

      expect(res.migrated.length).to.eql(1);
      expect(res.skipped.length).to.eql(0);

      const root = pkg.name.replace('/', '.');
      const nextDir = `${tmp.absolute}/-config/${root}/bundle`;
      const nextPath = `${nextDir}/alpha.yaml`;
      expect(await Fs.exists(nextPath)).to.eql(true);
      expect(await Fs.exists(legacyDir)).to.eql(false);
      expect(await Fs.exists(`${tmp.absolute}/-config/@tdb/edu-slug`)).to.eql(false);
      expect(await Fs.exists(`${tmp.absolute}/-config/@tdb`)).to.eql(false);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });
});
