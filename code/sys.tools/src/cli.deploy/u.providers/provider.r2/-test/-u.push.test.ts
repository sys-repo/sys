import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Json, type t } from '../../common.ts';
import { R2Provider } from '../mod.ts';
import { withTmpDir } from '../../../-test/u.fixture.ts';
import { filesHandle, loadStagedDist, r2Target, sha, stageDist, type Write } from './u.fixture.ts';

describe('R2 Provider: push', () => {
  it('writes staged files through the Files client and publishes dist.json last', async () => {
    await withTmpDir(async (cwd) => {
      const stagingDir = await stageDist(cwd);
      const writes: Write[] = [];
      let providerConfig: t.DeployTool.Config.Provider.R2 | undefined;

      const res = await R2Provider.push({
        cwd: cwd as t.StringDir,
        target: r2Target(cwd, stagingDir),
        createFiles(provider) {
          providerConfig = provider;
          return filesHandle({ writes });
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

  describe('remote dist manifest optimization', () => {
    it('skips staged file reads and writes when remote dist digest matches inline manifest', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        await Fs.remove(`${stagingDir}/asset.bin`);
        await Fs.remove(`${stagingDir}/index.html`);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () => filesHandle({ writes, remoteText: Json.stringify(dist) }),
        });

        expect(res.ok).to.eql(true);
        expect(writes).to.eql([]);
      });
    });

    it('skips writes when remote dist digest matches content-ref manifest', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () => filesHandle({ writes, remoteRefText: Json.stringify(dist) }),
        });

        expect(res.ok).to.eql(true);
        expect(writes).to.eql([]);
      });
    });

    it('writes only changed assets and then dist.json when remote dist parts differ', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const staged = await loadStagedDist(stagingDir);
        const remote = {
          ...staged,
          hash: {
            digest: sha('0'),
            parts: { ...staged.hash.parts, 'index.html': sha('1') },
          },
        } satisfies t.DistPkg;
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () => filesHandle({ writes, remoteText: Json.stringify(remote) }),
        });

        expect(res.ok).to.eql(true);
        expect(writes.map((write) => write.path)).to.eql(['index.html', 'dist.json']);
      });
    });

    it('falls back to upload-all when remote dist manifest is invalid', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () => filesHandle({ writes, remoteText: '{' }),
        });

        expect(res.ok).to.eql(true);
        expect(writes.map((write) => write.path)).to.eql(['asset.bin', 'index.html', 'dist.json']);
      });
    });
  });
});
