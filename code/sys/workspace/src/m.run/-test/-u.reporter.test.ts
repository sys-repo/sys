import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { formatFailedOutput } from '../u.fmt.ts';
import { createParallelReporter, formatParallelProgress } from '../u.reporter.ts';

describe('WorkspaceRun.parallel reporter', () => {
  it('formats a deterministic progress frame with counts and active packages', () => {
    const frame = Cli.stripAnsi(formatParallelProgress({
      total: 10,
      passed: 2,
      skipped: 1,
      blocked: 0,
      failed: 0,
      pending: 4,
      running: [
        { path: 'code/sys.driver/driver-vite', elapsed: 65_000 },
        { path: 'code/sys/workspace', elapsed: 2_000 },
      ],
      terminal: false,
      width: 100,
    }));

    expect(frame.includes('passed 2')).to.eql(true);
    expect(frame.includes('running 2')).to.eql(true);
    expect(frame.includes('pending 4')).to.eql(true);
    expect(frame.includes('skipped 1')).to.eql(true);
    expect(frame.includes('blocked 0')).to.eql(true);
    expect(frame.includes('failed 0')).to.eql(true);
    expect(frame.includes('done 30%')).to.eql(true);
    expect(frame.includes('active')).to.eql(true);
    expect(frame.includes('code/sys.driver/driver-vite')).to.eql(true);
  });

  it('prints a plain deterministic header outside TTY contexts', () => {
    const lines: string[] = [];
    const reporter = createParallelReporter({
      task: 'test',
      jobs: 4,
      total: 2,
      terminal: false,
      write: (line) => lines.push(line),
    });

    reporter.start();
    reporter.event({ kind: 'start', path: 'code/a' });
    reporter.event({ kind: 'finish', path: 'code/a', result: ran('code/a') });
    reporter.event({ kind: 'done', result: result([ran('code/a')]) });

    expect(lines).to.eql(['workspace test → strategy parallel, jobs 4']);
  });

  it('prints grouped buffered output for failed packages', () => {
    const lines: string[] = [];
    const reporter = createParallelReporter({
      task: 'test',
      jobs: 2,
      total: 1,
      terminal: false,
      write: (line) => lines.push(line),
    });
    const fail = ran('code/a', false, { stdout: 'hello\n', stderr: 'boom\n' });

    reporter.start();
    reporter.event({ kind: 'start', path: 'code/a' });
    reporter.event({ kind: 'finish', path: 'code/a', result: fail });
    reporter.event({ kind: 'done', result: result([fail], fail) });

    const text = Cli.stripAnsi(lines.join('\n'));
    expect(text.includes('workspace test → strategy parallel, jobs 2')).to.eql(true);
    expect(text.includes('Failed package output')).to.eql(true);
    expect(text.includes('✕ code/a exit 1')).to.eql(true);
    expect(text.includes('stdout')).to.eql(true);
    expect(text.includes('hello')).to.eql(true);
    expect(text.includes('stderr')).to.eql(true);
    expect(text.includes('boom')).to.eql(true);
  });

  it('formats no failed output when buffered streams are empty', () => {
    const fail = ran('code/a', false);
    expect(formatFailedOutput(result([fail], fail))).to.eql('');
  });
});

function ran(
  path: string,
  success = true,
  output: { readonly stdout?: string; readonly stderr?: string } = {},
): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    path,
    code: success ? 0 : 1,
    success,
    signal: null,
    elapsed: 1,
    ...output,
  };
}

function result(
  packages: readonly t.WorkspaceRun.Package.Result[],
  failure?: t.WorkspaceRun.Package.Ran,
): t.WorkspaceRun.Result {
  const base = {
    task: 'test' as const,
    cwd: '/tmp/workspace' as t.StringDir,
    elapsed: 1,
    orderedPaths: packages.map((item) => item.path),
    packages,
  };

  return failure ? { ...base, ok: false as const, failure } : { ...base, ok: true as const };
}
