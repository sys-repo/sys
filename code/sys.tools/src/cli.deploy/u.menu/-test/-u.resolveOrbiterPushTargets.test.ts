import { type t, describe, expect, Fs, it } from '../../../-test.ts';
import { resolveOrbiterPushTargets } from '../u/u.resolveOrbiterPushTargets.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';

describe('Deploy: resolveOrbiterPushTargets', () => {
  it('returns no targets for shard mappings without siteIds', async () => {
    await withTmpDir(async (tmp) => {
      const plan = await resolveOrbiterPushTargets({
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

      expect(plan.targets.length).to.eql(0);
    });
  });

  it('returns shard targets when siteIds and staging dirs exist', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging/shard.1`);

      const plan = await resolveOrbiterPushTargets({
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

      expect(plan.targets.length).to.eql(1);
      expect(plan.targets[0]?.stagingDir).to.eql(`${tmp}/staging/shard.1`);
      expect(plan.targets[0]?.sourceDir).to.eql(tmp);
      expect(plan.targets[0]?.provider.siteId).to.eql('site-1');
    });
  });

  it('adds root target for index mapping when shard targets exist', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging/shard.1`);
      await Fs.ensureDir(`${tmp}/staging/-root`);

      const plan = await resolveOrbiterPushTargets({
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

      const root = plan.targets.find((target) => target.stagingDir.endsWith('/-root'));
      const shard = plan.targets.find((target) => target.shard === 1);

      expect(root?.provider.siteId).to.eql('base');
      expect(shard?.provider.siteId).to.eql('site-1');
    });
  });

  it('filters shard targets when only list is provided', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging/shard.1`);
      await Fs.ensureDir(`${tmp}/staging/shard.2`);

      const plan = await resolveOrbiterPushTargets({
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

      expect(plan.targets.length).to.eql(1);
      expect(plan.targets[0]?.stagingDir).to.eql(`${tmp}/staging/shard.1`);
      expect(plan.targets[0]?.sourceDir).to.eql(tmp);
      expect(plan.targets[0]?.provider.siteId).to.eql('site-1');
    });
  });

  it('uses staging root when no shard mappings exist', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging`);

      const plan = await resolveOrbiterPushTargets({
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

      expect(plan.targets.length).to.eql(1);
      expect(plan.targets[0]?.stagingDir).to.eql(`${tmp}/staging`);
      expect(plan.targets[0]?.sourceDir).to.eql(tmp);
      expect(plan.targets[0]?.provider.siteId).to.eql('base');
    });
  });
});
