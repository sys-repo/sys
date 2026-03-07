import { describe, expect, it } from '../../../-test.ts';
import { type t, Fs } from '../../common.ts';
import { HashPreflight } from '../mod.ts';

describe('cli.crypto/cmd.hash/u.preflight', () => {
  it('scans file count and bytes using metadata only traversal', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      await Fs.write(Fs.join(dir, 'a.txt'), 'abc');
      await Fs.ensureDir(Fs.join(dir, 'sub'));
      await Fs.write(Fs.join(dir, 'sub/b.txt'), 'hello');

      const res = await HashPreflight.scan(dir);
      expect(res.fileCount).to.eql(2);
      expect(res.bytesTotal).to.eql(8);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('triggers confirmation threshold when either files or bytes exceed defaults', () => {
    expect(
      HashPreflight.shouldConfirm({
        targetDir: '/x' as t.StringDir,
        fileCount: 101,
        bytesTotal: 0,
      }),
    ).to.eql(true);

    expect(
      HashPreflight.shouldConfirm({
        targetDir: '/x' as t.StringDir,
        fileCount: 1,
        bytesTotal: 51 * 1024 * 1024,
      }),
    ).to.eql(true);

    expect(
      HashPreflight.shouldConfirm({
        targetDir: '/x' as t.StringDir,
        fileCount: 100,
        bytesTotal: 50 * 1024 * 1024,
      }),
    ).to.eql(false);
  });
});
