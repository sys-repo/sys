import { describe, expect, it } from '../../-test.ts';
import { status } from '../u.status.ts';
import { failOutput, okOutput, withInvokeStub } from '../../u.probe/-test/fixture.ts';

describe('Git.status', () => {
  it('reports missing git when the executable cannot be found', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await status();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('missing-git');
      },
    );
  });

  it('detects not-a-repo errors from stderr', async () => {
    await withInvokeStub(
      async () => failOutput('fatal: not a git repository (or any of the parent directories): .git'),
      async () => {
        const result = await status();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('not-a-repo');
      },
    );
  });

  it('detects not-a-repo errors from stdout', async () => {
    await withInvokeStub(
      async () => failOutput('', 'fatal: not a git repository (or any of the parent directories): .git'),
      async () => {
        const result = await status();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('not-a-repo');
      },
    );
  });

  it('maps other failures to spawn-failed', async () => {
    await withInvokeStub(
      async () => failOutput('permission denied'),
      async () => {
        const result = await status();
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('spawn-failed');
      },
    );
  });

  it('invokes git status --porcelain by default', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.cmd).to.eql('git');
        expect(args.args).to.eql(['status', '--porcelain']);
        return okOutput('');
      },
      async () => {
        const result = await status();
        expect(result.ok).to.eql(true);
        if (result.ok) expect(result.entries).to.eql([]);
      },
    );
  });

  it('appends --untracked-files=no when requested', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.args).to.eql(['status', '--porcelain', '--untracked-files=no']);
        return okOutput('');
      },
      async () => {
        const result = await status({ untracked: false });
        expect(result.ok).to.eql(true);
        if (result.ok) expect(result.entries).to.eql([]);
      },
    );
  });

  it('parses a single entry', async () => {
    await withInvokeStub(
      async () => okOutput(' M src/a.ts\n'),
      async () => {
        const result = await status();
        expect(result.ok).to.eql(true);
        if (result.ok) {
          expect(result.entries).to.eql([
            { index: ' ', worktree: 'M', path: 'src/a.ts' },
          ]);
        }
      },
    );
  });
});
