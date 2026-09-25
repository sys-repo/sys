import { describe, expect, it, stripAnsi, type t } from '../../-test.ts';
import { Fs } from '../../m.Fs/mod.ts';
import { permissionFixtureReport, runPermissionFixture } from './u.fixture.permission.process.ts';

describe('Fs.Snapshot: narrow read permission', () => {
  it('reads only below the selected root while ancestor authority remains denied', async () => {
    const temp = await Fs.makeTempDir({ prefix: 'sys-fs-snapshot-permission-' });
    try {
      const root = await Fs.realPath(temp.absolute) as t.StringAbsoluteDir;
      const path = Fs.join(root, 'source.bin') as t.StringAbsolutePath;
      await Fs.write(path, new Uint8Array([1, 2, 3, 4]), { throw: true });
      const output = await runPermissionFixture(`--allow-read=${root}`, 'allowed', root, path);
      const report = stripAnsi(permissionFixtureReport(output));
      expect(report).to.contain('Fs.Snapshot permission proof');
      expect(report).to.contain('status:          allowed');
      expect(report).to.contain('ancestor read:   denied as required');
      expect(report).to.contain(`path:            ${path}`);
      expect(report).to.contain('byte length:     4');
      expect(report).to.match(/evidence:\s+(device-inode|metadata-only)/);
      expect(report).to.contain('bytes:           1 2 3 4');
    } finally {
      await Fs.remove(temp.absolute);
    }
  });

  it('returns permission-denied without read authority', async () => {
    const temp = await Fs.makeTempDir({ prefix: 'sys-fs-snapshot-denied-' });
    try {
      const root = await Fs.realPath(temp.absolute) as t.StringAbsoluteDir;
      const path = Fs.join(root, 'source.bin') as t.StringAbsolutePath;
      await Fs.write(path, new Uint8Array([1, 2, 3, 4]), { throw: true });
      const output = await runPermissionFixture('--deny-read', 'denied', root, path);
      const report = stripAnsi(permissionFixtureReport(output));

      expect(report).to.contain('Fs.Snapshot permission proof');
      expect(report).to.contain('status:    denied as required');
      expect(report).to.contain('failure:   permission-denied');
    } finally {
      await Fs.remove(temp.absolute);
    }
  });
});
