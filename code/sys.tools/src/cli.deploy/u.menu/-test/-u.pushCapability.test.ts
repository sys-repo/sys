import { describe, expect, Fs, it, Str } from '../../../-test.ts';
import { pushCapabilityOf } from '../u/u.pushCapability.ts';
import { withTmpDir } from '../../-test/u.fixture.ts';

describe('Deploy: pushCapabilityOf', () => {
  it('shows r2 push capability when staging output exists', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = './-config/deploy/r2.yaml';
      await Fs.ensureDir(`${tmp}/-config/deploy`);
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(
        Fs.join(tmp, yamlPath),
        Str.dedent(`
        provider:
          kind: r2
          accountId: account-1
          bucket: deploy-bucket
          prefix: deploy/site
          credentials:
            accessKeyId: key-1
            secretAccessKey: secret-1
        source:
          dir: .
        staging:
          dir: ./stage
        mappings: []
        `),
      );

      const res = await pushCapabilityOf({ cwd: tmp, yamlPath, checkOk: true });

      expect(res.show).to.eql(true);
      if (!res.show) throw new Error('expected push capability to be shown');
      expect(res.provider.kind).to.eql('r2');
      expect(res.targets.length).to.eql(1);
    });
  });

  it('keeps noop push capability hidden', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = './-config/deploy/noop.yaml';
      await Fs.ensureDir(`${tmp}/-config/deploy`);
      await Fs.write(
        Fs.join(tmp, yamlPath),
        'provider:\n  kind: noop\nstaging:\n  dir: ./stage\nmappings: []\n',
      );

      const res = await pushCapabilityOf({ cwd: tmp, yamlPath, checkOk: true });

      expect(res).to.eql({ show: false, reason: 'noop-provider' });
    });
  });

  it('returns an unavailable capability when target resolution throws', async () => {
    const oldHome = Deno.env.get('HOME');
    Deno.env.delete('HOME');

    try {
      const res = await pushCapabilityOf({
        cwd: '/tmp',
        yamlPath: './unused.yaml',
        checkOk: true,
        yaml: {
          provider: {
            kind: 'r2',
            accountId: 'account-1',
            bucket: 'deploy-bucket',
            prefix: 'deploy/site',
            credentials: { accessKeyId: 'key-1', secretAccessKey: 'secret-1' },
          },
          source: { dir: '~' },
          staging: { dir: './stage' },
          mappings: [],
        },
      });

      expect(res).to.eql({
        show: false,
        reason: 'target-resolution-failed',
        hint: 'Unable to resolve deploy targets.',
      });
    } finally {
      if (oldHome === undefined) Deno.env.delete('HOME');
      else Deno.env.set('HOME', oldHome);
    }
  });
});
