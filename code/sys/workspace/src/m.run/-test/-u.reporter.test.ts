import { c, Cli, describe, expect, it, type t } from '../../-test.ts';
import { formatFailedOutput, formatIntroLine } from '../u/u.fmt.ts';
import { createParallelReporter, formatParallelProgress } from '../u/u.reporter.ts';

type CompletedKind = 'passed' | 'failed' | 'skipped' | 'blocked';

const VISIBLE_COMPLETED_FOR_WIDTH_100 = 10;
const SAMPLE_WORKSPACE = '/tmp/sample-workspace' as t.StringDir;

describe('WorkspaceRun.parallel reporter', () => {
  describe('formatParallelProgress', () => {
    describe('status row', () => {
      it('keeps semantic cells on a single row when width allows', () => {
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 10,
          passed: 2,
          skipped: 1,
          blocked: 0,
          blockedRunnable: 0,
          failed: 0,
          pending: 6,
          running: [],
          terminal: false,
          width: 100,
        }));

        expect(frame).to.eql(
          '✓ 2/10 passed   ⦿ running 0   ◦ pending 6   · skipped 1   ⊘ blocked 0   ✕ failed 0',
        );
      });

      it('wraps status row at cell boundaries with exact continuation indentation', () => {
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 51,
          passed: 40,
          skipped: 0,
          blocked: 0,
          blockedRunnable: 0,
          failed: 0,
          pending: 9,
          running: [
            { path: 'sample/pkg-running-alpha', elapsed: 60_000 },
            { path: 'sample/pkg-running-beta', elapsed: 2_000 },
          ],
          elapsed: 162_000,
          terminal: false,
          width: 64,
        }));
        const lines = frame.split('\n');

        expect(lines[0]).to.eql(
          '✓ 40/51 passed   ⦿ running 2   ◦ pending 9   · skipped 0',
        );
        expect(lines[1]).to.eql('                 ⊘ blocked 0   ✕ failed 0');
        expect(lines[3]).to.eql('  testing (--schedule=topological) · 2.7m elapsed');
        expect(lines.every((line) => !line.endsWith(' '))).to.eql(true);
      });

      it('indents wrapped status rows under spinner-prefixed metric columns', () => {
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 51,
          passed: 40,
          skipped: 0,
          blocked: 0,
          blockedRunnable: 0,
          failed: 0,
          pending: 9,
          running: [],
          terminal: true,
          width: 66,
        }));
        const lines = frame.split('\n');

        expect(lines[0]).to.eql(
          '✓ 40/51 passed   ⦿ running 0   ◦ pending 9   · skipped 0',
        );
        expect(lines[1]).to.eql('                   ⊘ blocked 0   ✕ failed 0');
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

        expect(skipped.split('\n')[0]).to.eql(
          '✓ 2/8 passed   ⦿ running 0   ◦ pending 6   · skipped 2   ⊘ blocked 0   ✕ failed 0',
        );
        expect(skipped.includes('2/8 passed')).to.eql(true);
        expect(skipped.includes('skipped 2')).to.eql(true);
        expect(blocked.split('\n')[0]).to.eql(
          '✓ 2/5 passed   ⦿ running 0   ◦ pending 0   · skipped 1   ⊘ blocked 3   ✕ failed 1',
        );
        expect(blocked.includes('2/5 passed')).to.eql(true);
        expect(blocked.includes('blocked 3')).to.eql(true);
      });
    });

    describe('running context', () => {
      it('renders sample running package rows without trailing spaces', () => {
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 10,
          passed: 2,
          skipped: 1,
          blocked: 0,
          blockedRunnable: 0,
          failed: 0,
          pending: 6,
          running: [
            { path: 'sample/pkg-running-alpha', elapsed: 65_000 },
            { path: 'sample/pkg-running-beta', elapsed: 2_000 },
          ],
          terminal: false,
          width: 100,
        }));
        const lines = frame.split('\n');
        const runningLine = lines[3] ?? '';

        expect(lines[0]).to.eql(
          '✓ 2/10 passed   ⦿ running 2   ◦ pending 6   · skipped 1   ⊘ blocked 0   ✕ failed 0',
        );
        expect(lines[2]).to.eql('  testing (--schedule=topological)');
        expect(frame.includes('sample/pkg-running-alpha')).to.eql(true);
        expect(runningLine.includes('⦿  sample/pkg-running-alpha')).to.eql(true);
        expect(runningLine.endsWith(' ')).to.eql(false);
        expect(Cli.Fmt.Text.visibleWidth(runningLine) < 100).to.eql(true);
      });

      it('keeps active row seconds under one minute and decimal minutes from one minute', () => {
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 10,
          passed: 2,
          skipped: 1,
          blocked: 0,
          blockedRunnable: 0,
          failed: 0,
          pending: 6,
          running: [
            { path: 'sample/pkg-under-minute', elapsed: 27_000 },
            { path: 'sample/pkg-one-minute', elapsed: 60_000 },
            { path: 'sample/pkg-over-minute', elapsed: 78_000 },
          ],
          terminal: false,
          width: 160,
        }));

        expect(frame.includes('⦿  sample/pkg-under-minute 27s')).to.eql(true);
        expect(frame.includes('⦿  sample/pkg-one-minute 1.0m')).to.eql(true);
        expect(frame.includes('⦿  sample/pkg-over-minute 1.3m')).to.eql(true);
      });

      it('formats elapsed context only after one second', () => {
        expect(contextLine(999)).to.eql('  testing (--schedule=topological)');
        expect(contextLine(2_100)).to.eql('  testing (--schedule=topological) · 2s elapsed');
        expect(contextLine(126_000)).to.eql('  testing (--schedule=topological) · 2.1m elapsed');
      });

      it('drops schedule from elapsed context before terminal wrapping', () => {
        const line = contextLine(57_000, 40);

        expect(line).to.eql('  testing · 57s elapsed');
        expect(Cli.Fmt.Text.visibleWidth(line) <= 40).to.eql(true);
        expect(line.endsWith(' ')).to.eql(false);
      });
    });

    describe('completed rows', () => {
      it('renders sample completed rows without a section heading', () => {
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 10,
          passed: 2,
          skipped: 1,
          blocked: 0,
          blockedRunnable: 0,
          failed: 0,
          pending: 6,
          running: [],
          completed: [
            { kind: 'passed', path: 'sample/pkg-passed', elapsed: 112 },
            { kind: 'skipped', path: 'sample/pkg-skipped' },
          ],
          terminal: false,
          width: 100,
        }));
        const lines = frame.split('\n');

        expect(frame.includes('completed')).to.eql(false);
        expect(lines.find((line) => line === '━'.repeat(100))).to.eql('━'.repeat(100));
        expect(frame.includes('✓  sample/pkg-passed')).to.eql(true);
        expect(frame.includes('·  sample/pkg-skipped')).to.eql(true);
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
            { kind: 'passed', path: 'sample/pkg-01', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-02', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-03', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-04', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-05', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-06', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-07', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-08', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-09', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-10', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-11', elapsed: 1 },
            { kind: 'passed', path: 'sample/pkg-12', elapsed: 1 },
          ],
          terminal: false,
          width: 100,
        }));

        expect(frame.includes('✓  sample/pkg-10')).to.eql(true);
        expect(frame.includes('✓  sample/pkg-11')).to.eql(false);
        expect(frame.includes('...and 2 more')).to.eql(true);
      });

      it('colors completed overflow count by hidden item severity', () => {
        const green = overflowLine(completedOverflowFrame(['passed', 'passed']));
        const yellow = overflowLine(completedOverflowFrame(['passed', 'blocked']));
        const red = overflowLine(completedOverflowFrame(['passed', 'failed']));

        expect(Cli.stripAnsi(green).trim()).to.eql('...and 2 more');
        expect(green).to.eql(overflowLabel(c.green(c.italic('2'))));

        expect(Cli.stripAnsi(yellow).trim()).to.eql('...and 2 more');
        expect(yellow).to.eql(overflowLabel(c.yellow(c.italic('2'))));

        expect(Cli.stripAnsi(red).trim()).to.eql('...and 2 more');
        expect(red).to.eql(overflowLabel(c.red(c.italic('2'))));
      });

      it('colors the completed progress rule by completed item severity', () => {
        const track = c.gray('━'.repeat(20));
        expect(completedRuleLine('passed')).to.eql(c.green('━'.repeat(20)) + track);
        expect(completedRuleLine('blocked')).to.eql(c.yellow('━'.repeat(20)) + track);
        expect(completedRuleLine('failed')).to.eql(c.red('━'.repeat(20)) + track);
      });
    });
  });

  describe('formatIntroLine', () => {
    it('formats aligned intro lines', () => {
      expect(Cli.stripAnsi(formatIntroLine('workspace graph', 'loading snapshot'))).to.eql(
        'workspace graph  →  loading snapshot',
      );
      expect(Cli.stripAnsi(formatIntroLine('workspace test', '51 packages ordered'))).to.eql(
        'workspace test   →  51 packages ordered',
      );
    });
  });

  describe('createParallelReporter', () => {
    it('prints a plain deterministic header outside TTY contexts', () => {
      const lines: string[] = [];
      const reporter = createParallelReporter({
        task: 'test',
        jobs: 4,
        runnablePaths: ['sample/pkg-a', 'sample/pkg-b'],
        terminal: false,
        write: (line) => lines.push(line),
      });

      reporter.start();
      reporter.event({ kind: 'start', path: 'sample/pkg-a' });
      reporter.event({ kind: 'finish', path: 'sample/pkg-a', result: ran('sample/pkg-a') });
      reporter.event({ kind: 'done', result: result([ran('sample/pkg-a')]) });

      expect(lines.map((line) => Cli.stripAnsi(line))).to.eql([
        'workspace test   →  strategy parallel, jobs 4',
      ]);
    });

    it('prints grouped buffered output for failed packages', () => {
      const lines: string[] = [];
      const reporter = createParallelReporter({
        task: 'test',
        jobs: 2,
        runnablePaths: ['sample/pkg-fails'],
        terminal: false,
        write: (line) => lines.push(line),
      });
      const fail = ran('sample/pkg-fails', false, {
        stdout: 'sample stdout\n',
        stderr: 'sample stderr\n',
      });

      reporter.start();
      reporter.event({ kind: 'start', path: 'sample/pkg-fails' });
      reporter.event({ kind: 'finish', path: 'sample/pkg-fails', result: fail });
      reporter.event({ kind: 'done', result: result([fail], fail) });

      const text = Cli.stripAnsi(lines.join('\n'));
      expect(text.includes('workspace test   →  strategy parallel, jobs 2')).to.eql(true);
      expect(text.includes('Failed package output')).to.eql(true);
      expect(text.includes('✕ sample/pkg-fails exit 1')).to.eql(true);
      expect(text.includes('stdout')).to.eql(true);
      expect(text.includes('sample stdout')).to.eql(true);
      expect(text.includes('stderr')).to.eql(true);
      expect(text.includes('sample stderr')).to.eql(true);
    });
  });

  describe('formatFailedOutput', () => {
    it('formats no failed output when buffered streams are empty', () => {
      const fail = ran('sample/pkg-fails', false);
      expect(formatFailedOutput(result([fail], fail))).to.eql('');
    });
  });
});

function contextLine(elapsed: t.Msecs, width = 100) {
  const frame = formatParallelProgress({
    runnableTotal: 10,
    passed: 2,
    skipped: 0,
    blocked: 0,
    blockedRunnable: 0,
    failed: 0,
    pending: 8,
    running: [{ path: 'sample/pkg-running-alpha', elapsed: 1_000 }],
    elapsed,
    terminal: false,
    width,
  });
  return Cli.stripAnsi(frame).split('\n').find((line) => line.startsWith('  testing')) ?? '';
}

function completedOverflowFrame(hiddenKinds: readonly CompletedKind[]) {
  const visibleKinds = Array.from(
    { length: VISIBLE_COMPLETED_FOR_WIDTH_100 },
    () => 'passed' as const,
  );
  const kinds = [...visibleKinds, ...hiddenKinds];
  const passed = countKind(kinds, 'passed');
  const failed = countKind(kinds, 'failed');
  const blocked = countKind(kinds, 'blocked');

  return formatParallelProgress({
    runnableTotal: passed + failed + blocked,
    passed,
    skipped: countKind(kinds, 'skipped'),
    blocked,
    blockedRunnable: blocked,
    failed,
    pending: 0,
    running: [],
    completed: kinds.map((kind, index) => {
      const path = `sample/pkg-${String(index + 1).padStart(2, '0')}`;
      return { kind, path, elapsed: 1 };
    }),
    terminal: false,
    width: 100,
  });
}

function countKind(kinds: readonly CompletedKind[], kind: CompletedKind) {
  return kinds.filter((value) => value === kind).length;
}

function overflowLine(frame: string) {
  return frame.split('\n').find((line) => Cli.stripAnsi(line).includes('...and')) ?? '';
}

function overflowLabel(count: string) {
  return `  ${c.gray(c.italic('...and '))}${count}${c.gray(c.italic(' more'))}`;
}

function completedRuleLine(kind: CompletedKind) {
  const passed = kind === 'passed' ? 1 : 0;
  const failed = kind === 'failed' ? 1 : 0;
  const blocked = kind === 'blocked' ? 1 : 0;
  const frame = formatParallelProgress({
    runnableTotal: 2,
    passed,
    skipped: kind === 'skipped' ? 1 : 0,
    blocked,
    blockedRunnable: blocked,
    failed,
    pending: 1,
    running: [],
    completed: [{ kind, path: `sample/pkg-${kind}`, elapsed: 1 }],
    terminal: false,
    width: 40,
  });
  return frame.split('\n').find((line) => Cli.stripAnsi(line) === '━'.repeat(40)) ?? '';
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
    cwd: SAMPLE_WORKSPACE,
    elapsed: 1,
    orderedPaths: packages.map((item) => item.path),
    packages,
  };

  return failure ? { ...base, ok: false as const, failure } : { ...base, ok: true as const };
}
