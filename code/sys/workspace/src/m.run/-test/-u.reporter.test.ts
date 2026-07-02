import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { formatFailedOutput, formatIntroLine } from '../u.fmt.ts';
import { createParallelReporter, formatParallelProgress } from '../u.reporter.ts';

describe('WorkspaceRun.parallel reporter', () => {
  it('formats a deterministic progress frame with counts and active packages', () => {
    const frame = Cli.stripAnsi(formatParallelProgress({
      runnableTotal: 10,
      passed: 2,
      skipped: 1,
      blocked: 0,
      blockedRunnable: 0,
      failed: 0,
      pending: 6,
      running: [
        { path: 'code/sys.driver/driver-vite', elapsed: 65_000 },
        { path: 'code/sys/workspace', elapsed: 2_000 },
      ],
      completed: [
        { kind: 'passed', path: 'code/sys/types', elapsed: 112 },
        { kind: 'skipped', path: 'code/without-test' },
      ],
      terminal: false,
      width: 100,
    }));

    const lines = frame.split('\n');

    expect(lines[0]).to.eql('tests 20%');
    expect(lines[1]?.startsWith('  ✓')).to.eql(true);
    expect(lines[1]?.includes('passed 2/10')).to.eql(true);
    expect(lines[1]?.includes('running 2')).to.eql(true);
    expect(lines[1]?.includes('pending 6')).to.eql(true);
    expect(lines[1]?.includes('skipped 1')).to.eql(true);
    expect(lines[1]?.includes('blocked 0')).to.eql(true);
    expect(lines[1]?.includes('failed 0')).to.eql(true);
    expect(frame.includes('active (--schedule=topological)')).to.eql(true);
    expect(frame.includes('code/sys.driver/driver-vite')).to.eql(true);

    const activeLine = lines[4] ?? '';
    expect(activeLine.includes('⦿  code/sys.driver/driver-vite')).to.eql(true);
    expect(activeLine.endsWith(' ')).to.eql(false);
    expect(Cli.Fmt.Text.visibleWidth(activeLine) < 100).to.eql(true);
    expect(frame.includes('completed')).to.eql(true);
    expect(frame.includes('✓  code/sys/types')).to.eql(true);
    expect(frame.includes('·  code/without-test')).to.eql(true);
  });

  it('formats elapsed progress only after one second', () => {
    expect(progressLine(999)).to.eql('tests 20%');
    expect(progressLine(2_100)).to.eql('tests 20% - 2s');
    expect(progressLine(126_000)).to.eql('tests 20% - 2.1m');
  });

  it('caps completed packages at five rows and summarizes overflow', () => {
    const frame = Cli.stripAnsi(formatParallelProgress({
      runnableTotal: 20,
      passed: 12,
      skipped: 0,
      blocked: 0,
      blockedRunnable: 0,
      failed: 0,
      pending: 8,
      running: [],
      completed: [
        { kind: 'passed', path: 'code/pkg-01', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-02', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-03', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-04', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-05', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-06', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-07', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-08', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-09', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-10', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-11', elapsed: 1 },
        { kind: 'passed', path: 'code/pkg-12', elapsed: 1 },
      ],
      terminal: false,
      width: 100,
    }));

    expect(frame.includes('✓  code/pkg-10')).to.eql(true);
    expect(frame.includes('✓  code/pkg-11')).to.eql(false);
    expect(frame.includes('..and 2 more')).to.eql(true);
  });

  it('uses runnable packages for passed denominator and progress', () => {
    const skipped = Cli.stripAnsi(formatParallelProgress({
      runnableTotal: 8,
      passed: 2,
      skipped: 2,
      blocked: 0,
      blockedRunnable: 0,
      failed: 0,
      pending: 6,
      running: [],
      terminal: false,
      width: 100,
    }));
    const blocked = Cli.stripAnsi(formatParallelProgress({
      runnableTotal: 5,
      passed: 2,
      skipped: 1,
      blocked: 3,
      blockedRunnable: 2,
      failed: 1,
      pending: 0,
      running: [],
      terminal: false,
      width: 100,
    }));

    expect(skipped.split('\n')[0]).to.eql('tests 25%');
    expect(skipped.includes('passed 2/8')).to.eql(true);
    expect(skipped.includes('skipped 2')).to.eql(true);
    expect(blocked.split('\n')[0]).to.eql('tests 100%');
    expect(blocked.includes('passed 2/5')).to.eql(true);
    expect(blocked.includes('blocked 3')).to.eql(true);
  });

  it('formats aligned intro lines', () => {
    expect(Cli.stripAnsi(formatIntroLine('workspace graph', 'loading snapshot'))).to.eql(
      'workspace graph  →  loading snapshot',
    );
    expect(Cli.stripAnsi(formatIntroLine('workspace test', '51 packages ordered'))).to.eql(
      'workspace test   →  51 packages ordered',
    );
  });

  it('prints a plain deterministic header outside TTY contexts', () => {
    const lines: string[] = [];
    const reporter = createParallelReporter({
      task: 'test',
      jobs: 4,
      runnablePaths: ['code/a', 'code/b'],
      terminal: false,
      write: (line) => lines.push(line),
    });

    reporter.start();
    reporter.event({ kind: 'start', path: 'code/a' });
    reporter.event({ kind: 'finish', path: 'code/a', result: ran('code/a') });
    reporter.event({ kind: 'done', result: result([ran('code/a')]) });

    expect(lines.map((line) => Cli.stripAnsi(line))).to.eql([
      'workspace test   →  strategy parallel, jobs 4',
    ]);
  });

  it('prints grouped buffered output for failed packages', () => {
    const lines: string[] = [];
    const reporter = createParallelReporter({
      task: 'test',
      jobs: 2,
      runnablePaths: ['code/a'],
      terminal: false,
      write: (line) => lines.push(line),
    });
    const fail = ran('code/a', false, { stdout: 'hello\n', stderr: 'boom\n' });

    reporter.start();
    reporter.event({ kind: 'start', path: 'code/a' });
    reporter.event({ kind: 'finish', path: 'code/a', result: fail });
    reporter.event({ kind: 'done', result: result([fail], fail) });

    const text = Cli.stripAnsi(lines.join('\n'));
    expect(text.includes('workspace test   →  strategy parallel, jobs 2')).to.eql(true);
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

function progressLine(elapsed: t.Msecs) {
  const frame = formatParallelProgress({
    runnableTotal: 10,
    passed: 2,
    skipped: 0,
    blocked: 0,
    blockedRunnable: 0,
    failed: 0,
    pending: 8,
    running: [],
    elapsed,
    terminal: false,
    width: 100,
  });
  return Cli.stripAnsi(frame).split('\n')[0];
}

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
