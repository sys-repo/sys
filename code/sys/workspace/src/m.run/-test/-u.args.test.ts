import { describe, expect, expectError, it } from '../../-test.ts';
import { WorkspaceRun } from '../mod.ts';

describe('WorkspaceRun.Args', () => {
  it('preserves the serial default when no flags are provided', () => {
    expect(WorkspaceRun.Args.test([])).to.eql({});
  });

  it('parses explicit parallel test flags', () => {
    expect(WorkspaceRun.Args.test(['--parallel'])).to.eql({
      strategy: { kind: 'parallel' },
    });
    expect(WorkspaceRun.Args.test(['--parallel', '--jobs=auto'])).to.eql({
      strategy: { kind: 'parallel', jobs: 'auto' },
    });
    expect(WorkspaceRun.Args.test(['--parallel', '--jobs=8'])).to.eql({
      strategy: { kind: 'parallel', jobs: 8 },
    });
    expect(WorkspaceRun.Args.test(['--parallel', '--jobs', '8'])).to.eql({
      strategy: { kind: 'parallel', jobs: 8 },
    });
    expect(WorkspaceRun.Args.test(['--parallel=true'])).to.eql({
      strategy: { kind: 'parallel' },
    });
    expect(WorkspaceRun.Args.test(['--parallel=false'])).to.eql({});
  });

  it('rejects jobs without explicit parallel mode', async () => {
    await expectError(() => WorkspaceRun.Args.test(['--jobs=8']), 'requires --parallel');
  });

  it('rejects invalid jobs values', async () => {
    await expectError(
      () => WorkspaceRun.Args.test(['--parallel', '--jobs=0']),
      'positive integer',
    );
    await expectError(
      () => WorkspaceRun.Args.test(['--parallel', '--jobs=-1']),
      'positive integer',
    );
    await expectError(
      () => WorkspaceRun.Args.test(['--parallel', '--jobs=1.5']),
      'positive integer',
    );
    await expectError(
      () => WorkspaceRun.Args.test(['--parallel', '--jobs=fast']),
      'positive integer',
    );
    await expectError(() => WorkspaceRun.Args.test(['--parallel', '--jobs']), 'requires a value');
  });

  it('rejects ambiguous or unknown test arguments', async () => {
    await expectError(
      () => WorkspaceRun.Args.test(['--parallel', '--jobs=2', '--jobs=3']),
      'duplicate',
    );
    await expectError(() => WorkspaceRun.Args.test(['--parallel', '--parallel']), 'duplicate');
    await expectError(() => WorkspaceRun.Args.test(['--parallel=maybe']), 'true or false');
    await expectError(() => WorkspaceRun.Args.test(['--fast']), 'unknown flag');
    await expectError(() => WorkspaceRun.Args.test(['code/pkg-a']), 'unexpected argument');
  });
});
