import { describe, expect, Fs, it } from '../../-test.ts';
import { resolvePushTargets } from '../u.push/u.resolvePushTargets.ts';
import { withTmpDir } from './u.fixture.ts';

describe('Deploy: resolvePushTargets', () => {
  it('resolves one r2 target from the staging root', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/staging`);

      const plan = await resolvePushTargets({
        cwd: tmp,
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
      expect(plan.missing).to.eql([]);
      expect(plan.targets[0]?.provider.kind).to.eql('r2');
    });
  });

  it('returns no push targets for the inert noop provider', async () => {
    const plan = await resolvePushTargets({
      cwd: '/tmp',
      yaml: {
        provider: { kind: 'noop' },
        staging: { dir: './staging' },
        mappings: [],
      },
    });

    expect(plan).to.eql({ targets: [], missing: [] });
  });
});
