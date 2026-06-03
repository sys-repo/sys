import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Pkg, type t } from '../../common.ts';
import { R2Provider } from '../mod.ts';
import { withTmpDir } from '../../../-test/u.fixture.ts';

describe('R2 Provider: push', () => {
  it('writes staged files through the Files client and publishes dist.json last', async () => {
    await withTmpDir(async (cwd) => {
      const stagingDir = `${cwd}/stage` as t.StringDir;
      await Fs.ensureDir(stagingDir);
      await Fs.write(`${stagingDir}/index.html`, '<!doctype html><html>r2</html>\n');
      await Fs.write(`${stagingDir}/asset.bin`, new Uint8Array([0, 1, 2, 3]));
      await Pkg.Dist.compute({ dir: stagingDir, save: true });

      const writes: Array<{ path: string; bytes: readonly number[]; mediaType?: string }> = [];
      let providerConfig: t.DeployTool.Config.Provider.R2 | undefined;

      const res = await R2Provider.push({
        cwd: cwd as t.StringDir,
        target: {
          provider: {
            kind: 'r2',
            accountId: 'account-1',
            bucket: 'deploy-bucket',
            prefix: 'deploy/site',
            readOrigin: 'https://cdn.example.com',
            credentials: { accessKeyId: 'key-1', secretAccessKey: 'secret-1' },
          },
          sourceDir: cwd as t.StringDir,
          stagingDir,
          domain: 'https://cdn.example.com',
        },
        createFiles(provider) {
          providerConfig = provider;
          return {
            dispose() {},
            writeBytes: async (
              path: t.Files.String.Path,
              content: Uint8Array,
              options?: t.Files.Client.Write.BytesOptions,
            ) => {
              writes.push({ path, bytes: [...content], mediaType: options?.mediaType });
              return { kind: 'created', path };
            },
          } as unknown as t.Files.Client.Handle;
        },
      });

      expect(res.ok).to.eql(true);
      expect(providerConfig?.accountId).to.eql('account-1');
      expect(providerConfig?.bucket).to.eql('deploy-bucket');
      expect(providerConfig?.prefix).to.eql('deploy/site');
      expect(writes.map((write) => write.path)).to.eql(['asset.bin', 'index.html', 'dist.json']);
      expect(writes.find((write) => write.path === 'asset.bin')?.bytes).to.eql([0, 1, 2, 3]);
      expect(writes.find((write) => write.path === 'index.html')?.mediaType).to.eql('text/html');
      expect(writes.find((write) => write.path === 'asset.bin')?.mediaType).to.eql('text/plain');
    });
  });
});
