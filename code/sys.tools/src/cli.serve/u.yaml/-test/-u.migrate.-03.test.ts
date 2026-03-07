import { withTmpDir } from './-fixtures.ts';
import { describe, expect, Fs, it, Str } from '../../../-test.ts';
import { migrate03 } from '../u.migrate.-03.ts';
import { ServeFs } from '../mod.ts';

describe('ServeMigrate.-03', () => {
  it('removes legacy remoteBundles from serve YAML docs', async () => {
    await withTmpDir(async (tmp) => {
      const dir = `${tmp}/${ServeFs.dir}`;
      const path = `${dir}/alpha.yaml`;
      await Fs.ensureDir(dir);
      await Fs.write(
        path,
        Str.dedent(`
          name: alpha
          dir: .
          remoteBundles:
            - remote:
                dist: https://example.com/dist.json
              local:
                dir: bundles/example
        `).trimStart(),
      );

      const res = await migrate03(tmp);
      expect(res.migrated.length).to.eql(1);
      expect(res.skipped.length).to.eql(0);

      const text = (await Fs.readText(path)).data ?? '';
      expect(text.includes('remoteBundles')).to.eql(false);
      expect(text.includes('name: alpha')).to.eql(true);
      expect(text.includes('dir: .')).to.eql(true);
    });
  });
});
