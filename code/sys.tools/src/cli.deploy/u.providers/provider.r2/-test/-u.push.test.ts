import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Hash, Json, Pkg, type t, Time } from '../../common.ts';
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
        cwd,
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
      const assetReport = res.ok
        ? res.publish?.files.find((file) => file.path === 'asset.bin')
        : undefined;
      expect(assetReport?.bytes).to.eql(4);
      expect(providerConfig?.accountId).to.eql('account-1');
      expect(providerConfig?.bucket).to.eql('deploy-bucket');
      expect(providerConfig?.prefix).to.eql('deploy/site');
      expectWritesWithDistLast(writes, ['asset.bin', 'index.html']);
      const assetWrite = writes.find((write) => write.path === 'asset.bin');
      expect(assetWrite?.bytes).to.eql([0, 1, 2, 3]);
      expect(writes.find((write) => write.path === 'index.html')?.mediaType).to.eql('text/html');
      expect(assetWrite?.mediaType).to.eql('application/octet-stream');
    });
  });

  it('derives canonical media types and applies the binary fallback', async () => {
    await withTmpDir(async (cwd) => {
      const stagingDir = await stageDist(cwd);
      await addStagedFiles(stagingDir, ['config.yaml', 'main.js', 'asset.unknown']);
      const writes: Write[] = [];

      const res = await R2Provider.push({
        cwd,
        target: r2Target(cwd, stagingDir),
        createFiles: () => filesHandle({ writes }),
      });

      expect(res.ok).to.eql(true);
      expect(writes.find((write) => write.path === 'config.yaml')?.mediaType).to.eql('text/yaml');
      expect(writes.find((write) => write.path === 'main.js')?.mediaType).to.eql(
        'text/javascript',
      );
      expect(writes.find((write) => write.path === 'asset.bin')?.mediaType).to.eql(
        'application/octet-stream',
      );
      expect(writes.find((write) => write.path === 'asset.unknown')?.mediaType).to.eql(
        'application/octet-stream',
      );
    });
  });

  describe('exact publication identity', () => {
    it('renamed path-to-byte mapping → a distinct content identity and exact-path publication', async () => {
      await withTmpDir(async (cwd) => {
        const remoteDir = await stageDist(Fs.join(cwd, 'remote'), { 'a.js': 'A', 'b.js': 'B' });
        const localDir = await stageDist(Fs.join(cwd, 'local'), { 'b.js': 'A', 'c.js': 'B' });
        const remote = await loadStagedDist(remoteDir);
        const local = await loadStagedDist(localDir);
        expect(remote.hash.digest).not.to.eql(local.hash.digest);
        expect(remote.hash.parts['b.js']).not.to.eql(local.hash.parts['b.js']);
        const manifest = (await Fs.read(Fs.join(localDir, 'dist.json'))).data!;
        const store = new Map<string, StoredObject>();
        const events: Event[] = [];
        const createFiles = () => localR2FilesHandle({ store, events });
        const initial = await R2Provider.push({
          cwd,
          target: r2Target(cwd, remoteDir),
          createFiles,
        });
        expect(initial.ok).to.eql(true);
        events.length = 0;

        const result = await R2Provider.push({ cwd, target: r2Target(cwd, localDir), createFiles });
        expect(result.ok).to.eql(true);
        expect(store.get('deploy/site/b.js')?.body).to.eql(new TextEncoder().encode('A'));
        expect(store.get('deploy/site/c.js')?.body).to.eql(new TextEncoder().encode('B'));
        expect(store.get('deploy/site/dist.json')?.body).to.eql(manifest);
        expect([...store.keys()].sort()).to.eql([
          'deploy/site/b.js',
          'deploy/site/c.js',
          'deploy/site/dist.json',
        ]);
        expect(publishFileStatuses(result)).to.eql([
          { path: 'b.js', status: 'written' },
          { path: 'c.js', status: 'written' },
          { path: 'dist.json', status: 'written' },
        ]);
        expect(pruneFileStatuses(result)).to.eql([{ path: 'a.js', status: 'removed' }]);
        for (const path of ['b.js', 'c.js']) {
          expectWriteEventBefore(
            events,
            `write:deploy/site/${path}`,
            'write:deploy/site/dist.json',
          );
        }
        expectWriteEventBefore(events, 'write:deploy/site/dist.json', 'remove:deploy/site/a.js');
      });
    });

    it('equal root digest with a changed part size → rewrite that exact asset', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const local = await loadStagedDist(stagingDir);
        const part = Pkg.Dist.Part.parse(local.hash.parts['asset.bin'])!;
        // Intentionally inconsistent remote metadata: hash equality must not hide a size change.
        const remote = {
          ...local,
          hash: {
            ...local.hash,
            parts: { ...local.hash.parts, 'asset.bin': `${part.hash}:size=${part.size! + 1}` },
          },
        };
        const writes: Write[] = [];
        const result = await R2Provider.push({
          cwd,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({ writes, remoteText: Json.stringify(remote), entries: expectedEntries() }),
        });
        expect(result.ok).to.eql(true);
        expect(publishFileStatuses(result)).to.eql([
          { path: 'asset.bin', status: 'written' },
          { path: 'index.html', status: 'skipped' },
          { path: 'dist.json', status: 'written' },
        ]);
        expectWritesWithDistLast(writes, ['asset.bin']);
        expect(writes[0].bytes).to.eql([0, 1, 2, 3]);
      });
    });

    for (const warm of [false, true]) {
      it(`${warm ? 'warm' : 'cold'} store with spaced and unspaced names → preserve both exact keys`, async () => {
        await withTmpDir(async (cwd) => {
          const stagingDir = await stageDist(Fs.join(cwd, 'local'), { ' a.js': 'A', 'a.js': 'B' });
          const manifest = (await Fs.read(Fs.join(stagingDir, 'dist.json'))).data!;
          const store = new Map<string, StoredObject>();
          if (warm) {
            const remoteDir = await stageDist(Fs.join(cwd, 'remote'), {
              ' a.js': 'A',
              'a.js': 'old B',
            });
            // Seed exact remote keys independently of the publisher being tested.
            for (const path of [' a.js', 'a.js', 'dist.json']) {
              store.set(`deploy/site/${path}`, {
                ...storedObject(''),
                body: (await Fs.read(Fs.join(remoteDir, path))).data!,
              });
            }
          }
          store.set('deploy/site/stale.txt', storedObject('stale'));
          const events: Event[] = [];
          const createFiles = () => localR2FilesHandle({ store, events });
          const push = () =>
            R2Provider.push({ cwd, target: r2Target(cwd, stagingDir), createFiles });
          const result = await push();
          expect(result.ok).to.eql(true);
          expect(store.get('deploy/site/ a.js')?.body).to.eql(new TextEncoder().encode('A'));
          expect(store.get('deploy/site/a.js')?.body).to.eql(new TextEncoder().encode('B'));
          expect(store.get('deploy/site/dist.json')?.body).to.eql(manifest);
          expect([...store.keys()].sort()).to.eql([
            'deploy/site/ a.js',
            'deploy/site/a.js',
            'deploy/site/dist.json',
          ]);
          expect(publishFileStatuses(result)).to.eql([
            { path: ' a.js', status: warm ? 'skipped' : 'written' },
            { path: 'a.js', status: 'written' },
            { path: 'dist.json', status: 'written' },
          ]);
          expect(pruneFileStatuses(result)).to.eql([{ path: 'stale.txt', status: 'removed' }]);
          const written = warm ? ['a.js'] : [' a.js', 'a.js'];
          const writeEvents = events.filter((event) => event.startsWith('write:')).sort();
          const expectedWrites = [...written, 'dist.json']
            .map((path) => `write:deploy/site/${path}`).sort();
          expect(writeEvents).to.eql(expectedWrites);
          for (const path of written) {
            expectWriteEventBefore(
              events,
              `write:deploy/site/${path}`,
              'write:deploy/site/dist.json',
            );
          }
          expectWriteEventBefore(
            events,
            'write:deploy/site/dist.json',
            'remove:deploy/site/stale.txt',
          );

          events.length = 0;
          const repeated = await push();
          expect(repeated.ok).to.eql(true);
          expect(publishFileStatuses(repeated)).to.eql([
            { path: ' a.js', status: 'skipped' },
            { path: 'a.js', status: 'skipped' },
            { path: 'dist.json', status: 'skipped' },
          ]);
          expect(pruneFileStatuses(repeated)).to.eql([]);
          expect(events).to.eql([]);
        });
      });
    }

    for (
      const path of [
        '',
        '.',
        '..',
        '../index.html',
        './index.html',
        '/index.html',
        'C:/index.html',
        'index.html/',
        'nested//file.js',
        'nested/./file.js',
        'nested/../index.html',
        'nested\\file.js',
        'index.html\\',
        './dist.json',
        'dist.json/',
        'dist.json\\',
        'bad\u0000.js',
      ]
    ) {
      it(`noncanonical key ${Json.stringify(path)} → refuse before writes or pruning`, async () => {
        await withTmpDir(async (cwd) => {
          const stagingDir = await stageDist(cwd);
          await addStagedFiles(stagingDir, ['nested/file.js']);
          const store = new Map<string, StoredObject>();
          const events: Event[] = [];
          const createFiles = () => localR2FilesHandle({ store, events });
          const target = r2Target(cwd, stagingDir);
          const initial = await R2Provider.push({ cwd, target, createFiles });
          expect(initial.ok).to.eql(true);
          store.set('deploy/site/stale.txt', storedObject('must remain'));
          const before = [...store];
          // A valid changed asset comes before the invalid key: lazy validation must not upload it.
          await Fs.write(Fs.join(stagingDir, 'asset.bin'), new Uint8Array([9, 8, 7]));
          await Pkg.Dist.compute({ dir: stagingDir, save: true });
          const local = await loadStagedDist(stagingDir);
          await Fs.write(
            Fs.join(stagingDir, 'dist.json'),
            Json.stringify({
              ...local,
              hash: {
                ...local.hash,
                parts: { ...local.hash.parts, [path]: local.hash.parts['index.html'] },
              },
            }),
          );
          for (const force of [false, true]) {
            events.length = 0;
            const result = await R2Provider.push({ cwd, target, createFiles, force });
            expect(result.ok).to.eql(false);
            expect(events).to.eql([]);
            expect([...store]).to.eql(before);
          }
        });
      });
    }
  });

  describe('bounded publish concurrency', () => {
    it('writes changed assets in parallel but publishes dist.json after assets finish', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const extra = [
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
        ];
        await addStagedFiles(stagingDir, extra);
        const assets = ['asset.bin', 'index.html', ...extra];
        const writes: Write[] = [];
        const lifecycle: string[] = [];
        let active = 0;
        let maxActive = 0;

        const res = await R2Provider.push({
          cwd,
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
        expectWritesWithDistLast(writes, assets);
        expect(publishFileStatuses(res)[publishFileStatuses(res).length - 1]).to.eql({
          path: 'dist.json',
          status: 'written',
        });

        const distStart = lifecycle.indexOf('start:dist.json');
        expect(distStart >= 0).to.eql(true);
        const assetFinishes = lifecycle.filter((event) =>
          event.startsWith('finish:') && event !== 'finish:dist.json'
        );
        expect(assetFinishes.slice().sort()).to.eql(assets.map((path) => `finish:${path}`).sort());
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
          cwd,
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
    it('matching manifest with a missing spaced key → repair that key and republish dist.json last', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd, { ' a.js': 'A', 'a.js': 'B' });
        const manifest = (await Fs.read(Fs.join(stagingDir, 'dist.json'))).data!;
        const store = new Map<string, StoredObject>();
        const events: Event[] = [];
        const createFiles = () => localR2FilesHandle({ store, events });
        const push = () => R2Provider.push({ cwd, target: r2Target(cwd, stagingDir), createFiles });
        const initial = await push();
        expect(initial.ok).to.eql(true);
        expect(store.delete('deploy/site/ a.js')).to.eql(true);
        events.length = 0;

        const result = await push();
        expect(result.ok).to.eql(true);
        expect(publishFileStatuses(result)).to.eql([
          { path: ' a.js', status: 'written' },
          { path: 'a.js', status: 'skipped' },
          { path: 'dist.json', status: 'written' },
        ]);
        expect(events).to.eql(['write:deploy/site/ a.js', 'write:deploy/site/dist.json']);
        expect(store.get('deploy/site/ a.js')?.body).to.eql(new TextEncoder().encode('A'));
        expect(store.get('deploy/site/a.js')?.body).to.eql(new TextEncoder().encode('B'));
        expect(store.get('deploy/site/dist.json')?.body).to.eql(manifest);
        expect(pruneFileStatuses(result)).to.eql([]);
      });
    });

    it('rewrites dist.json when the current Files projection omits the marker', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd,
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
          cwd,
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
          cwd,
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
        const parts = { ...staged.hash.parts, 'index.html': `${sha('1')}:size=1` };
        const remote = {
          ...staged,
          hash: {
            scheme: 'sys.dist/v2',
            digest: Hash.sha256(Pkg.Dist.Content.encode(parts)),
            parts,
          },
        } satisfies t.DistPkg;
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd,
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
          cwd,
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
          cwd,
          target: r2Target(cwd, stagingDir),
          createFiles() {
            const listPages: t.Files.Cmd.List.Result[] = [
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
            ];
            return filesHandle({ writes, removes, listPages });
          },
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
          cwd,
          target: r2Target(cwd, stagingDir),
          createFiles,
        });
        store.set('deploy/site/stale.txt', storedObject('stale'));
        await Fs.remove(`${stagingDir}/asset.bin`);
        await Fs.remove(`${stagingDir}/index.html`);

        const second = await R2Provider.push({
          cwd,
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
          cwd,
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
          cwd,
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
          cwd,
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
    for (const change of ['metadata', 'formatting', 'utf8-bom'] as const) {
      it(`equal asset tree with changed ${change} → replaces only the exact manifest`, async () => {
        await withTmpDir(async (cwd) => {
          const stagingDir = await stageDist(cwd);
          const local = (await Fs.read(`${stagingDir}/dist.json`)).data!;
          const dist = await loadStagedDist(stagingDir);
          const store = new Map<string, StoredObject>();
          const target = r2Target(cwd, stagingDir);
          const createFiles = () => localR2FilesHandle({ store });
          const push = () => R2Provider.push({ cwd, target, createFiles });
          const initial = await push();
          expect(initial.ok).to.eql(true);

          const key = 'deploy/site/dist.json';
          const text = new TextDecoder().decode(local);
          const changed = change === 'metadata'
            ? Json.stringify({ ...dist, build: { ...dist.build, time: dist.build.time + 1 } })
            : change === 'formatting'
            ? `${text}\n`
            : `\uFEFF${text}`;
          store.set(key, { ...store.get(key)!, body: new TextEncoder().encode(changed) });

          const result = await push();
          expect(result.ok).to.eql(true);
          expect(publishFileStatuses(result)).to.eql([
            { path: 'asset.bin', status: 'skipped' },
            { path: 'index.html', status: 'skipped' },
            { path: 'dist.json', status: 'written' },
          ]);
          expect(store.get(key)?.body).to.eql(local);

          const repeated = await push();
          expect(repeated.ok ? PushPublishStats.summary(repeated.publish) : undefined).to.eql({
            total: 3,
            written: 0,
            skipped: 3,
          });
        });
      });
    }

    it('equal JSON from a content ref with different bytes → replaces the manifest', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const local = (await Fs.read(`${stagingDir}/dist.json`)).data!;
        const writes: Write[] = [];
        const result = await R2Provider.push({
          cwd,
          target: r2Target(cwd, stagingDir),
          createFiles: () =>
            filesHandle({
              writes,
              remoteRefText: `\uFEFF${new TextDecoder().decode(local)}\n`,
              entries: expectedEntries(),
            }),
        });
        expect(result.ok).to.eql(true);
        expect(writes.map((write) => write.path)).to.eql(['dist.json']);
        expect(writes[0].bytes).to.eql([...local]);
      });
    });

    it('skips asset reads and all writes when exact inline manifest bytes match', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        await Fs.remove(`${stagingDir}/asset.bin`);
        await Fs.remove(`${stagingDir}/index.html`);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd,
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

    it('skips writes when exact content-ref manifest bytes match', async () => {
      await withTmpDir(async (cwd) => {
        const stagingDir = await stageDist(cwd);
        const dist = await loadStagedDist(stagingDir);
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd,
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
        const first = await R2Provider.push({ cwd, target, createFiles });
        const second = await R2Provider.push({ cwd, target, createFiles });

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
          cwd,
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
        const parts = { ...staged.hash.parts, 'index.html': `${sha('1')}:size=1` };
        const remote = {
          ...staged,
          hash: {
            scheme: 'sys.dist/v2',
            digest: Hash.sha256(Pkg.Dist.Content.encode(parts)),
            parts,
          },
        } satisfies t.DistPkg;
        const writes: Write[] = [];

        const res = await R2Provider.push({
          cwd,
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
          cwd,
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
