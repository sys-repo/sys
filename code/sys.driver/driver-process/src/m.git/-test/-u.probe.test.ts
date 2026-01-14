import { describe, expect, it } from '../../-test.ts';
import { failOutput, okOutput, withInvokeStub } from '../../u.probe/-test/fixture.ts';
import { probe } from '../u.probe.ts';

describe('Git.probe', () => {
  it('reports missing git when the executable is not found', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await probe();

        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.reason).to.eql('missing-git');
          expect(result.hint).to.contain('git not found');
        }
      },
    );
  });

  it('returns git info when the probe succeeds', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.cmd).to.eql('git');
        expect(args.args).to.eql(['--version']);
        return okOutput();
      },
      async () => {
        const result = await probe();

        expect(result.ok).to.eql(true);
        if (result.ok) {
          expect(result.bin).to.eql({ git: 'git' });
        }
      },
    );
  });

  it('reports spawn failure when binaries exist but cannot be executed', async () => {
    await withInvokeStub(
      async () => failOutput('permission denied'),
      async () => {
        const result = await probe();

        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.reason).to.eql('spawn-failed');
        }
      },
    );
  });
});
