import { type t, describe, expect, Fs, it } from '../../../-test.ts';
import { resolvePushTargets } from '../u/u.resolvePushTargets.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';

describe('Deploy: resolvePushTargets', () => {
  it('returns no targets for unsupported providers', async () => {
    await withTmpDir(async (tmp) => {
      const plan = await resolvePushTargets({
        cwd: tmp as t.StringDir,
        yaml: {
          provider: { kind: 'deno', app: 'my-app' },
          staging: { dir: './staging' },
          mappings: [{ mode: 'index', dir: { source: './pkg', staging: '.' } }],
        },
      });

      expect(plan.targets.length).to.eql(0);
      expect(plan.stats.total).to.eql(0);
    });
  });

  it('returns one deno target when the staged root exists', async () => {
    await withTmpDir(async (tmp) => {
      const stageRoot = `${tmp}-stage`;
      await Fs.ensureDir(stageRoot);

      const plan = await resolvePushTargets({
        cwd: tmp as t.StringDir,
        yaml: {
          provider: { kind: 'deno', app: 'my-app' },
          source: { dir: '.' },
          staging: { dir: stageRoot },
          mappings: [{ mode: 'index', dir: { source: './pkg', staging: '.' } }],
        },
      });

      expect(plan.targets.length).to.eql(1);
      expect(plan.stats.total).to.eql(1);
      expect(plan.targets[0]?.provider.kind).to.eql('deno');
      expect(plan.targets[0]?.sourceDir).to.eql(`${tmp}/pkg`);
      expect(plan.targets[0]?.stagingDir).to.eql(stageRoot);
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
