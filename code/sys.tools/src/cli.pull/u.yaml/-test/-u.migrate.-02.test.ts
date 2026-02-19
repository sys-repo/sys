import { describe, expect, Fs, it, Str } from '../../../-test.ts';
import { PullFs } from '../u.fs.ts';
import { migrate02 } from '../u.migrate.-02.ts';

describe('PullMigrate/02', () => {
  it('adds remote.kind=http for legacy remote.dist bundle entries', async () => {
    const tmp = await Fs.makeTempDir();
    const cwd = tmp.absolute;
    const path = Fs.join(cwd, PullFs.fileOf('foo'));

    try {
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(
        path,
        Str.dedent(`
          dir: .
          remoteBundles:
            - remote:
                dist: https://example.com/dist.json
              local:
                dir: dev
        `).trimStart(),
      );

      const res = await migrate02(cwd);
      expect(res.migrated.length).to.eql(1);

      const text = (await Fs.readText(path)).data ?? '';
      expect(text.includes('kind: http')).to.eql(true);
      expect(text.includes('dist: https://example.com/dist.json')).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });
});
