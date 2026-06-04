import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Json, Pkg, type t, Time } from '../../common.ts';
import { R2Provider } from '../mod.ts';
import { withTmpDir } from '../../../-test/u.fixture.ts';
import { PushPublishStats } from '../../../u.push/u.publishStats.ts';
import {
  type Event,
  filesHandle,
  loadStagedDist,
  localR2FilesHandle,
  r2Target,
  type Remove,
  sha,
  stageDist,
  type StoredObject,
  type Write,
} from './u.fixture.ts';

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
      expectWritesWithDistLast(writes, ['asset.bin', 'index.html']);
      expect(writes.find((write) => write.path === 'asset.bin')?.bytes).to.eql([0, 1, 2, 3]);
      expect(writes.find((write) => write.path === 'index.html')?.mediaType).to.eql('text/html');
      expect(writes.find((write) => write.path === 'asset.bin')?.mediaType).to.eql('text/plain');
    });
  });

  describe('bounded publish concurrency', () => {
    it('writes changed assets in parallel but publishes dist.json after assets finish', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        await addStagedFiles(stagingDir, [
          'extra-01.txt',
          'extra-02.txt',
          'extra-03.txt',
          'extra-04.txt',
          'extra-05.txt',
          'extra-06.txt',
          'extra-07.txt',
          'extra-08.txt',
          'extra-09.txt',
          'extra-10.txt',
          'extra-11.txt',
          'extra-12.txt',
        ]);
        const writes: Write[] = [];
        const lifecycle: string[] = [];
        let active = 0;
        let maxActive = 0;

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              writeDelay: async (path) => {
                if (path !== 'dist.json') await Time.delay(5);
              },
              onWriteStart(path) {
                active += 1;
                maxActive = Math.max(maxActive, active);
                lifecycle.push(`start:${path}`);
              },
              onWriteFinish(path) {
                lifecycle.push(`finish:${path}`);
                active -= 1;
              },
            }),
        });

        expect(res.ok).to.eql(true);
        expect(maxActive > 1).to.eql(true);
        expect(maxActive <= 8).to.eql(true);
        expect(writes[writes.length - 1]?.path).to.eql('dist.json');
        expect(publishFileStatuses(res)[publishFileStatuses(res).length - 1]).to.eql({
          path: 'dist.json',
          status: 'written',
        });

        const distStart = lifecycle.indexOf('start:dist.json');
        expect(distStart >= 0).to.eql(true);
        const assetFinishes = lifecycle.filter((event) =>
          event.startsWith('finish:') && event !== 'finish:dist.json'
        );
        expect(assetFinishes.length > 0).to.eql(true);
        for (const event of assetFinishes) {
          expect(lifecycle.indexOf(event) < distStart).to.eql(true);
        }
      });
    });

    it('does not publish dist.json or prune when an asset write fails', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const writes: Write[] = [];
        const removes: Remove[] = [];
        const events: Event[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              removes,
              events,
              entries: [fileEntry('stale.txt')],
              writeError: (path: t.Files.String.Path) =>
                path === 'index.html' ? new Error('write failed') : undefined,
            }),
        });

        expect(res.ok).to.eql(false);
        expect(writes.map((write) => write.path).includes('dist.json')).to.eql(false);
        expect(events.includes('list')).to.eql(false);
        expect(removes).to.eql([]);
      });
    });
  });

  describe('missing expected file repair', () => {
    it('repairs a missing expected asset and republishes dist.json last', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];
        const events: Event[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              events,
              remoteText: Json.stringify(dist),
              entries: [fileEntry('index.html'), fileEntry('dist.json')],
            }),
        });

        expect(res.ok).to.eql(true);
        expect(res.ok ? PushPublishStats.summary(res.publish) : undefined).to.eql({
          total: 3,
          written: 2,
          skipped: 1,
        });
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'written' },
          { path: 'index.html', status: 'skipped' },
          { path: 'dist.json', status: 'written' },
        ]);
        expectWritesWithDistLast(writes, ['asset.bin']);
        expect(events.filter((event) => event === 'list').length).to.eql(1);
        expectWriteEventBefore(events, 'list', 'write:asset.bin');
        expectWriteEventBefore(events, 'write:asset.bin', 'write:dist.json');
      });
    });

    it('rewrites dist.json when the current Files projection omits the marker', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              remoteText: Json.stringify(dist),
              entries: [fileEntry('asset.bin'), fileEntry('index.html')],
            }),
        });

        expect(res.ok).to.eql(true);
        expect(res.ok ? PushPublishStats.summary(res.publish) : undefined).to.eql({
          total: 3,
          written: 1,
          skipped: 2,
        });
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'skipped' },
          { path: 'index.html', status: 'skipped' },
          { path: 'dist.json', status: 'written' },
        ]);
        expectWritesWithDistLast(writes, []);
      });
    });

    it('fails before writes or deletes when the trusted remote-state listing fails', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];
        const removes: Remove[] = [];
        const events: Event[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              removes,
              events,
              remoteText: Json.stringify(dist),
              listError: new Error('list failed'),
            }),
        });

        expect(res.ok).to.eql(false);
        expect(events).to.eql(['list']);
        expect(writes).to.eql([]);
        expect(removes).to.eql([]);
      });
    });

    it('uses one remote listing to repair missing files and prune stale files', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];
        const removes: Remove[] = [];
        const events: Event[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              removes,
              events,
              remoteText: Json.stringify(dist),
              entries: [fileEntry('asset.bin'), fileEntry('dist.json'), fileEntry('stale.txt')],
            }),
        });

        expect(res.ok).to.eql(true);
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'skipped' },
          { path: 'index.html', status: 'written' },
          { path: 'dist.json', status: 'written' },
        ]);
        expect(pruneFileStatuses(res)).to.eql([{ path: 'stale.txt', status: 'removed' }]);
        expect(removes).to.eql([{ path: 'stale.txt' }]);
        expect(events.filter((event) => event === 'list').length).to.eql(1);
        expectWriteEventBefore(events, 'list', 'write:index.html');
        expectWriteEventBefore(events, 'write:index.html', 'write:dist.json');
        expectWriteEventBefore(events, 'write:dist.json', 'remove:stale.txt');
      });
    });

    it('writes both changed and missing assets while preserving publish order', async () => {
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
          createFiles: () =>
            filesHandle({
              writes,
              remoteText: Json.stringify(remote),
              entries: [fileEntry('index.html'), fileEntry('dist.json')],
            }),
        });

        expect(res.ok).to.eql(true);
        expect(publishFileStatuses(res)).to.eql([
          { path: 'asset.bin', status: 'written' },
          { path: 'index.html', status: 'written' },
          { path: 'dist.json', status: 'written' },
        ]);
        expectWritesWithDistLast(writes, ['asset.bin', 'index.html']);
      });
    });
  });

  describe('snapshot replacement prune', () => {
    it('removes stale remote-only files under the configured publish prefix', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const store = new Map<string, StoredObject>([
          ['deploy/site/stale.txt', storedObject('stale')],
          ['other/site/stale.txt', storedObject('outside')],
        ]);

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () => localR2FilesHandle({ store }),
        });

        expect(res.ok).to.eql(true);
        expect(pruneFileStatuses(res)).to.eql([{ path: 'stale.txt', status: 'removed' }]);
        expect([...store.keys()].sort()).to.eql([
          'deploy/site/asset.bin',
          'deploy/site/dist.json',
          'deploy/site/index.html',
          'other/site/stale.txt',
        ]);
      });
    });

    it('removes stale files across paged remote listings', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const writes: Write[] = [];
        const removes: Remove[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              removes,
              listPages: [
                {
                  entries: [fileEntry('asset.bin'), fileEntry('stale-1.txt')],
                  cursor: 'next' as t.Files.Cursor.List,
                },
                {
                  entries: [
                    fileEntry('dist.json'),
                    fileEntry('index.html'),
                    fileEntry('stale-2.txt'),
                  ],
                },
              ],
            }),
        });

        expect(res.ok).to.eql(true);
        expect(pruneFileStatuses(res)).to.eql([
          { path: 'stale-1.txt', status: 'removed' },
          { path: 'stale-2.txt', status: 'removed' },
        ]);
        expect(removes).to.eql([{ path: 'stale-1.txt' }, { path: 'stale-2.txt' }]);
      });
    });

    it('still prunes stale files when the remote dist matches and staged assets are skipped', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const store = new Map<string, StoredObject>();
        const createFiles = () => localR2FilesHandle({ store });

        const first = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles,
        });
        store.set('deploy/site/stale.txt', storedObject('stale'));
        await Fs.remove(`${stagingDir}/asset.bin`);
        await Fs.remove(`${stagingDir}/index.html`);

        const second = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles,
        });

        expect(first.ok).to.eql(true);
        expect(second.ok ? PushPublishStats.summary(second.publish) : undefined).to.eql({
          total: 3,
          written: 0,
          skipped: 3,
        });
        expect(pruneFileStatuses(second)).to.eql([{ path: 'stale.txt', status: 'removed' }]);
        expect([...store.keys()].sort()).to.eql([
          'deploy/site/asset.bin',
          'deploy/site/dist.json',
          'deploy/site/index.html',
        ]);
      });
    });

    it('fails without deleting when remote listing fails', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const writes: Write[] = [];
        const removes: Remove[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              removes,
              listError: new Error('list failed'),
              entries: [fileEntry('stale.txt')],
            }),
        });

        expect(res.ok).to.eql(false);
        expectWritesWithDistLast(writes, ['asset.bin', 'index.html']);
        expect(removes).to.eql([]);
      });
    });

    it('reports remove failures truthfully', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const writes: Write[] = [];
        const removes: Remove[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              removes,
              removeError: new Error('remove failed'),
              entries: [fileEntry('stale.txt')],
            }),
        });

        expect(res.ok).to.eql(false);
        expect(removes).to.eql([]);
      });
    });

    it('force rewrites staged files, writes dist, then prunes stale files', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];
        const removes: Remove[] = [];
        const events: Event[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          force: true,
          createFiles: () =>
            filesHandle({
              writes,
              removes,
              events,
              remoteText: Json.stringify(dist),
              entries: [
                fileEntry('asset.bin'),
                fileEntry('index.html'),
                fileEntry('dist.json'),
                fileEntry('stale.txt'),
              ],
            }),
        });

        expect(res.ok).to.eql(true);
        expectWriteEventBefore(events, 'write:asset.bin', 'write:dist.json');
        expectWriteEventBefore(events, 'write:index.html', 'write:dist.json');
        expectWriteEventBefore(events, 'write:dist.json', 'list');
        expectWriteEventBefore(events, 'list', 'remove:stale.txt');
        expect(pruneFileStatuses(res)).to.eql([{ path: 'stale.txt', status: 'removed' }]);
      });
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
          createFiles: () =>
            filesHandle({
              writes,
              remoteText: Json.stringify(dist),
              entries: expectedEntries(),
            }),
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
          createFiles: () =>
            filesHandle({
              writes,
              remoteRefText: Json.stringify(dist),
              entries: expectedEntries(),
            }),
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

    it('skips writes after API-reading a remote manifest without readOrigin', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const store = new Map<string, StoredObject>();
        const baseTarget = r2Target(cwd, stagingDir);
        const target: t.R2PushTarget = {
          ...baseTarget,
          domain: undefined,
          provider: { ...baseTarget.provider, readOrigin: undefined },
        };

        const createFiles = () => localR2FilesHandle({ store });
        const first = await R2Provider.push({ cwd: cwd as t.StringDir, target, createFiles });
        const second = await R2Provider.push({ cwd: cwd as t.StringDir, target, createFiles });

        expect(first.ok ? PushPublishStats.summary(first.publish) : undefined).to.eql({
          total: 3,
          written: 3,
          skipped: 0,
        });
        expect(second.ok ? PushPublishStats.summary(second.publish) : undefined).to.eql({
          total: 3,
          written: 0,
          skipped: 3,
        });
        expect(publishFileStatuses(second)).to.eql([
          { path: 'asset.bin', status: 'skipped' },
          { path: 'index.html', status: 'skipped' },
          { path: 'dist.json', status: 'skipped' },
        ]);
      });
    });

    it('force writes all staged files even when remote dist digest matches', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd: cwd as t.StringDir,
          target: r2Target(cwd, stagingDir),
          force: true,
          createFiles: () => filesHandle({ writes, remoteText: Json.stringify(dist) }),
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
        expectWritesWithDistLast(writes, ['asset.bin', 'index.html']);
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
          createFiles: () =>
            filesHandle({
              writes,
              remoteText: Json.stringify(remote),
              entries: expectedEntries(),
            }),
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
        expectWritesWithDistLast(writes, ['index.html']);
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
        expectWritesWithDistLast(writes, ['asset.bin', 'index.html']);
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

function pruneFileStatuses(
  res: t.PushResult,
): readonly { readonly path: string; readonly status: t.PushPruneFileStatus }[] {
  if (!res.ok) return [];
  return (res.prune?.files ?? []).map((file) => ({ path: file.path, status: file.status }));
}

function expectWritesWithDistLast(writes: readonly Write[], expectedAssets: readonly string[]) {
  const paths = writes.map((write) => write.path);
  expect(paths[paths.length - 1]).to.eql('dist.json');
  expect(paths.slice(0, -1).sort()).to.eql([...expectedAssets].sort());
}

function expectWriteEventBefore(events: readonly Event[], before: Event, after: Event) {
  const beforeIndex = events.indexOf(before);
  const afterIndex = events.indexOf(after);
  expect(beforeIndex >= 0).to.eql(true);
  expect(afterIndex >= 0).to.eql(true);
  expect(beforeIndex < afterIndex).to.eql(true);
}

async function addStagedFiles(stagingDir: t.StringDir, paths: readonly string[]) {
  for (const path of paths) await Fs.write(`${stagingDir}/${path}`, path);
  await Pkg.Dist.compute({ dir: stagingDir, save: true });
}

function fileEntry(path: string): t.Files.File {
  return { path: path as t.Files.String.Path, kind: 'file' };
}

function expectedEntries(): readonly t.Files.File[] {
  return [fileEntry('asset.bin'), fileEntry('dist.json'), fileEntry('index.html')];
}

function storedObject(text: string): StoredObject {
  return {
    body: new TextEncoder().encode(text),
    mediaType: 'text/plain',
    modifiedAt: new Date('2026-06-01T00:00:00.000Z'),
  };
}
