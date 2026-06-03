import { type t, describe, expect, Fs, it } from '../../../-test.ts';
import { resolvePushTargets } from '../u/u.resolvePushTargets.ts';
import { withTmpDir } from '../../-test/u.fixture.ts';

describe('Deploy: resolvePushTargets', () => {
  it('returns the total target count for r2 targets', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging`);

      const plan = await resolvePushTargets({
        cwd: tmp as t.StringDir,
        yaml: {
          provider: {
            kind: 'r2',
            accountId: 'account-1',
            bucket: 'deploy-bucket',
            prefix: 'deploy/site',
            credentials: { accessKeyId: 'key-1', secretAccessKey: 'secret-1' },
          },
          staging: { dir: './staging' },
          mappings: [],
        },
      });

      expect(plan.targets.length).to.eql(1);
      expect(plan.stats.total).to.eql(1);
      expect(plan.targets[0]?.provider.kind).to.eql('r2');
    });
  });

  it('returns the total target count for orbiter targets', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging/shard.1`);
      await Fs.ensureDir(`${tmp}/staging/-root`);

      const plan = await resolvePushTargets({
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
            {
              mode: 'index',
              dir: {
                source: '.',
                staging: './-root',
              },
            },
          ],
        },
      });

      expect(plan.targets.length).to.eql(2);
      expect(plan.stats.total).to.eql(2);
    });
  });
});
