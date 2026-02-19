import { describe, expect, Fs, it, Str } from '../../../-test.ts';
import { PullFs } from '../u.fs.ts';
import { migrate01 } from '../u.migrate.-01.ts';

describe('PullMigrate/01', () => {
  it('removes legacy top-level name from pull YAML files', async () => {
    const tmp = await Fs.makeTempDir();
    const cwd = tmp.absolute;
    const path = Fs.join(cwd, PullFs.fileOf('foo'));

    try {
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(
        path,
        Str.dedent(`
          name: foo
          dir: .
          remoteBundles:
            - remote:
                dist: https://example.com/dist.json
              local:
                dir: dev
        `).trimStart(),
      );

      const res = await migrate01(cwd);
      expect(res.migrated.length).to.eql(1);

      const text = (await Fs.readText(path)).data ?? '';
      expect(text.includes('name: foo')).to.eql(false);
      expect(text.includes('dir: .')).to.eql(true);
      expect(text.includes('dist: https://example.com/dist.json')).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });
});
