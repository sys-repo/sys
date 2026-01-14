import { describe, expect, it } from '../../-test.ts';
import { root } from '../u.root.ts';
import { failOutput, okOutput, withInvokeStub } from '../../u.probe/-test/fixture.ts';

describe('Git.root', () => {
  it('reports missing-git when the binary cannot be invoked', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await root();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('missing-git');
      },
    );
  });

  it('detects not-a-repo via stderr', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        return failOutput('fatal: not a git repository (or any of the parent directories): .git');
      },
      async () => {
        const result = await root();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('not-a-repo');
      },
    );
  });

  it('detects not-a-repo via stdout', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        return failOutput('', 'fatal: not a git repository (or any of the parent directories): .git');
      },
      async () => {
        const result = await root();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('not-a-repo');
      },
    );
  });

  it('maps non-repo failures to spawn-failed', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        return failOutput('permission denied');
      },
      async () => {
        const result = await root();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('spawn-failed');
      },
    );
  });

  it('uses git rev-parse --show-toplevel and trims output', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        expect(args.cmd).to.eql('git');
        expect(args.args).to.eql(['rev-parse', '--show-toplevel']);
        return okOutput('/abs/repo\n');
      },
      async () => {
        const result = await root();
        expect(result.ok).to.eql(true);
        if (result.ok) {
          expect(result.root).to.eql('/abs/repo');
          expect(result.bin).to.eql({ git: 'git' });
        }
      },
    );
  });

  it('passes cwd when provided', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        expect(args.cwd).to.eql('/x/y');
        return okOutput('/x\n');
      },
      async () => {
        const result = await root({ cwd: '/x/y' as any });
        expect(result.ok).to.eql(true);
        if (result.ok) expect(result.root).to.eql('/x');
      },
    );
  });

  it('returns parse-failed for empty output', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.args.includes('--version')) return okOutput();
        return okOutput('');
      },
      async () => {
        const result = await root();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('parse-failed');
      },
    );
  });
});
