import { describe, expect, Fs, it, Str } from '../../../-test.ts';
import type { t } from '../../common.ts';
import { pullBundleWithSummary } from '../u.bundle.ts';
import { removeDistStore, usingDistServer } from './u.dist.fixture.ts';

describe('cli.pull/u.bundle → config stability', () => {
  it('successful materialization does not mutate source config', async () => {
    await usingDistServer(async (fixture) => {
      await withTmpDir(async (baseDir) => {
        const yamlPath = Fs.join(baseDir, 'pull.yaml');
        const yaml = Str.dedent(`
          dir: .
          bundles:
            - kind: dist
              manifest: ${fixture.manifest}
              integrity: ${fixture.integrity}
              store: ./.dist-store
              project:
                dir: pulled/sample
                mode: replace
        `).trimStart();
        await Fs.write(yamlPath, yaml, { force: true });

        const bundle: t.PullTool.ConfigYaml.DistBundle = {
          kind: 'dist',
          manifest: fixture.manifest,
          integrity: fixture.integrity,
          store: './.dist-store',
          project: { dir: 'pulled/sample', mode: 'replace' },
        };
        const location: t.PullTool.ConfigYaml.Location = {
          dir: baseDir,
          bundles: [bundle],
        };

        const result = await pullBundleWithSummary(yamlPath, location, bundle);
        expect(result.ok).to.eql(true);

        const after = await Fs.readText(yamlPath);
        expect(after.data).to.eql(yaml);
      });
    });
  });
});

async function withTmpDir(fn: (dir: t.StringDir) => Promise<void>) {
  const dir = await Fs.makeTempDir({ prefix: 'sys.tools.pull.bundle.config.' });
  try {
    await fn(dir.absolute as t.StringDir);
  } finally {
    await removeDistStore(dir.absolute as t.StringDir);
    await Fs.remove(dir.absolute);
  }
}
