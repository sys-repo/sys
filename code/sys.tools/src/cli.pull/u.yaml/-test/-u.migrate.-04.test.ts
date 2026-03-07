import { describe, expect, Fs, it, Str } from '../../../-test.ts';
import { PullFs } from '../u.fs.ts';
import { migrate04 } from '../u.migrate.-04.ts';

describe('PullMigrate/04', () => {
  it('renames remoteBundles to bundles', async () => {
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
            - kind: http
              dist: https://example.com/dist.json
              local:
                dir: dev
        `).trimStart(),
      );

      const res = await migrate04(cwd);
      expect(res.migrated.length).to.eql(1);

      const text = (await Fs.readText(path)).data ?? '';
      expect(text.includes('remoteBundles:')).to.eql(false);
      expect(text.includes('bundles:')).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });
});
