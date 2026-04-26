import { describe, expect, it } from '../../-test.ts';
import { failOutput, okOutput, withInvokeStub } from '../../u.probe/-test/fixture.ts';
import { init } from '../u.init.ts';

describe('Git.init', () => {
  it('reports missing-git when the binary cannot be invoked', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await init();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('missing-git');
      },
    );
  });

  it('maps non-zero command failures to spawn-failed', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        return failOutput('permission denied');
      },
      async () => {
        const result = await init();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('spawn-failed');
      },
    );
  });

  it('invokes git init with the expected args', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        expect(args.cmd).to.eql('git');
        expect(args.args).to.eql(['init']);
        return okOutput('Initialized empty Git repository');
      },
      async () => {
        const result = await init({ cwd: '/abs/repo' as any });
        expect(result.ok).to.eql(true);
      },
    );
  });

  it('passes cwd through when provided', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        expect(args.cwd).to.eql('/x/y');
        return okOutput('Initialized empty Git repository');
      },
      async () => {
        const result = await init({ cwd: '/x/y' as any });
        expect(result.ok).to.eql(true);
        if (result.ok) expect(result.cwd).to.eql('/x/y');
      },
    );
  });

  it('returns ok with bin and cwd on success', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        return okOutput('Initialized empty Git repository');
      },
      async () => {
        const result = await init({ cwd: '/repo' as any });
        expect(result.ok).to.eql(true);
        if (result.ok) {
          expect(result.bin).to.eql({ git: 'git' });
          expect(result.cwd).to.eql('/repo');
        }
      },
    );
  });
});
