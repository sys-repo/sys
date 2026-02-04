import { type t, describe, expect, Fs, it } from '../../../-test.ts';
import { resolvePushTargets } from '../u/u.resolvePushTargets.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';

describe('Deploy: resolvePushTargets', () => {
  it('returns no targets for shard mappings without siteIds', async () => {
    await withTmpDir(async (tmp) => {
      const res = await resolvePushTargets({
        cwd: tmp as t.StringDir,
        yaml: {
          provider: {
            kind: 'orbiter',
            siteId: 'base',
            domain: 'example.com',
            shards: { total: 2 },
          },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: {
                source: './video/partition-<shard>',
                staging: './shard.<shard>',
              },
            },
          ],
        },
      });

      expect(res.length).to.eql(0);
    });
  });

  it('returns shard targets when siteIds and staging dirs exist', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging/shard.1`);

      const res = await resolvePushTargets({
        cwd: tmp as t.StringDir,
        yaml: {
          provider: {
            kind: 'orbiter',
            siteId: 'base',
            domain: 'example.com',
            shards: { total: 2, siteIds: { 1: 'site-1' } },
          },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: {
                source: './video/partition-<shard>',
                staging: './shard.<shard>',
              },
            },
          ],
        },
      });

      expect(res.length).to.eql(1);
      expect(res[0]?.stagingDir).to.eql(`${tmp}/staging/shard.1`);
      expect(res[0]?.provider.siteId).to.eql('site-1');
    });
  });

  it('filters shard targets when only list is provided', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging/shard.1`);
      await Fs.ensureDir(`${tmp}/staging/shard.2`);

      const res = await resolvePushTargets({
        cwd: tmp as t.StringDir,
        yaml: {
          provider: {
            kind: 'orbiter',
            siteId: 'base',
            domain: 'example.com',
            shards: { total: 3, only: [1], siteIds: { 1: 'site-1', 2: 'site-2' } },
          },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: {
                source: './video/partition-<shard>',
                staging: './shard.<shard>',
              },
            },
          ],
        },
      });

      expect(res.length).to.eql(1);
      expect(res[0]?.stagingDir).to.eql(`${tmp}/staging/shard.1`);
      expect(res[0]?.provider.siteId).to.eql('site-1');
    });
  });

  it('uses staging root when no shard mappings exist', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging`);

      const res = await resolvePushTargets({
        cwd: tmp as t.StringDir,
        yaml: {
          provider: {
            kind: 'orbiter',
            siteId: 'base',
            domain: 'example.com',
          },
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: {
                source: './video',
                staging: '.',
              },
            },
          ],
        },
      });

      expect(res.length).to.eql(1);
      expect(res[0]?.stagingDir).to.eql(`${tmp}/staging`);
      expect(res[0]?.provider.siteId).to.eql('base');
    });
  });
});
