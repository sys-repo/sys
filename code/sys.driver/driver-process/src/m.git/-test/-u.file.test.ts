import { describe, expect, it } from '../../-test.ts';
import { fileAtRef } from '../u.file.ts';
import { failOutput, okOutput, withInvokeStub } from '../../u.probe/-test/fixture.ts';

describe('Git.fileAtRef', () => {
  it('reports missing git when the executable cannot be found', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await fileAtRef({ path: 'file.txt' });
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('missing-git');
      },
    );
  });

  it('detects not-a-repo errors from stderr', async () => {
    await withInvokeStub(
      async () =>
        failOutput('fatal: not a git repository (or any of the parent directories): .git'),
      async () => {
        const result = await fileAtRef({ path: 'file.txt' });
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('not-a-repo');
      },
    );
  });

  it('maps other failures to spawn-failed', async () => {
    await withInvokeStub(
      async () => failOutput('permission denied'),
      async () => {
        const result = await fileAtRef({ path: 'file.txt' });
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('spawn-failed');
      },
    );
  });

  it('invokes git cat-file blob with HEAD by default', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.cmd).to.eql('git');
        expect(args.args).to.eql(['cat-file', 'blob', 'HEAD:path/to/file.json']);
        expect(args.cwd).to.eql('/repo');
        return okOutput('{"ok":true}\n');
      },
      async () => {
        const result = await fileAtRef({ cwd: '/repo', path: 'path/to/file.json' });
        expect(result.ok).to.eql(true);
        if (result.ok) {
          expect(result.bytes).to.eql(new Uint8Array());
          expect(result.text).to.eql('{"ok":true}\n');
        }
      },
    );
  });

  it('accepts an explicit ref', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.args).to.eql(['cat-file', 'blob', 'main:file.txt']);
        return okOutput('value');
      },
      async () => {
        const result = await fileAtRef({ ref: 'main', path: 'file.txt' });
        expect(result.ok).to.eql(true);
      },
    );
  });

  it('maps missing files to not-found', async () => {
    await withInvokeStub(
      async () => failOutput("fatal: path 'missing.json' exists on disk, but not in 'HEAD'"),
      async () => {
        const result = await fileAtRef({ path: 'missing.json' });
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('not-found');
      },
    );
  });
});
