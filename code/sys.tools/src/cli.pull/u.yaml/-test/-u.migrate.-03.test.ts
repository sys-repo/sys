import { describe, expect, Fs, it, Str } from '../../../-test.ts';
import { PullFs } from '../u.fs.ts';
import { migrate03 } from '../u.migrate.-03.ts';

describe('PullMigrate/03', () => {
  it('flattens legacy nested remote.{kind,dist} into bundle root kind/dist', async () => {
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
                kind: http
                dist: https://example.com/dist.json
              local:
                dir: dev
        `).trimStart(),
      );

      const res = await migrate03(cwd);
      expect(res.migrated.length).to.eql(1);

      const text = (await Fs.readText(path)).data ?? '';
      expect(text.includes('remote:')).to.eql(false);
      expect(text.includes('kind: http')).to.eql(true);
      expect(text.includes('dist: https://example.com/dist.json')).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });
});
