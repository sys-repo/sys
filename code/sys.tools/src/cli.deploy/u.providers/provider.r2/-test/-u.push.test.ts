import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Json, type t } from '../../common.ts';
import { R2Provider } from '../mod.ts';
import { withTmpDir } from '../../../-test/u.fixture.ts';
import { PushPublishStats } from '../../../u.push/u.publishStats.ts';
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
      expect(res.ok ? PushPublishStats.summary(res.publish) : undefined).to.eql({
        total: 3,
        written: 3,
        skipped: 0,
      });
      expect(publishFileStatuses(res)).to.eql([
        { path: 'asset.bin', status: 'written' },
        { path: 'index.html', status: 'written' },
        { path: 'dist.json', status: 'written' },
      ]);
      expect(
        res.ok ? res.publish?.files.find((file) => file.path === 'asset.bin')?.bytes : undefined,
      )
        .to.eql(4);
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
        expect(res.ok ? PushPublishStats.summary(res.publish) : undefined).to.eql({
          total: 3,
          written: 0,
          skipped: 3,
        });
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'skipped' },
          { path: 'index.html', status: 'skipped' },
          { path: 'dist.json', status: 'skipped' },
        ]);
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
        expect(res.ok ? PushPublishStats.summary(res.publish) : undefined).to.eql({
          total: 3,
          written: 0,
          skipped: 3,
        });
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'skipped' },
          { path: 'index.html', status: 'skipped' },
          { path: 'dist.json', status: 'skipped' },
        ]);
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
        expect(res.ok ? PushPublishStats.summary(res.publish) : undefined).to.eql({
          total: 3,
          written: 2,
          skipped: 1,
        });
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'skipped' },
          { path: 'index.html', status: 'written' },
          { path: 'dist.json', status: 'written' },
        ]);
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
        expect(res.ok ? PushPublishStats.summary(res.publish) : undefined).to.eql({
          total: 3,
          written: 3,
          skipped: 0,
        });
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'written' },
          { path: 'index.html', status: 'written' },
          { path: 'dist.json', status: 'written' },
        ]);
        expect(writes.map((write) => write.path)).to.eql(['asset.bin', 'index.html', 'dist.json']);
      });
    });
  });
});

function publishFileStatuses(
  res: t.PushResult,
): readonly { readonly path: string; readonly status: t.PushPublishFileStatus }[] {
  if (!res.ok) return [];
  return (res.publish?.files ?? []).map((file) => ({ path: file.path, status: file.status }));
}
