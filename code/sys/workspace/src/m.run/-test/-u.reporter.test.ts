import { c, Cli, describe, expect, it, type t } from '../../-test.ts';
import { formatIntroLine } from '../u.fmt/mod.ts';
import { createParallelReporter, formatParallelProgress } from '../u.reporter/mod.ts';
import type { ParallelRunEvent } from '../u.run/mod.ts';
import { createInertReporterRuntimeDeps } from './u.fixture.reporter.ts';

type CompletedKind = 'passed' | 'failed' | 'skipped' | 'blocked';

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
          '✓ 2/10 passed   ⦿ running 0   ○ pending 6   ↷ skipped 1   ⊘ blocked 0   ✕ failed 0',
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
          '✓ 40/51 passed   ⦿ running 2   ○ pending 9   ↷ skipped 0',
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
          '✓ 40/51 passed   ⦿ running 0   ○ pending 9   ↷ skipped 0',
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
          '✓ 2/8 passed   ⦿ running 0   ○ pending 6   ↷ skipped 2   ⊘ blocked 0   ✕ failed 0',
        );
        expect(blocked.split('\n')[0]).to.eql(
          '✓ 2/5 passed   ⦿ running 0   ○ pending 0   ↷ skipped 1   ⊘ blocked 3   ✕ failed 1',
        );
      });
    });

    describe('running context', () => {
      it('keeps running rows width-safe and free of trailing whitespace', () => {
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

        expect(lines[2]).to.eql('  testing (--schedule=topological)');
        expect(runningLine.includes('⦿  sample/pkg-running-alpha')).to.eql(true);
        expect(runningLine.includes('⦿  sample/pkg-running-beta')).to.eql(true);
        expect(runningLine.endsWith(' ')).to.eql(false);
        expect(Cli.Fmt.Text.Width.measure(runningLine) < 100).to.eql(true);
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
        expect(Cli.Fmt.Text.Width.measure(line) <= 40).to.eql(true);
        expect(line.endsWith(' ')).to.eql(false);
      });
    });

    describe('completed rows', () => {
      it('keeps completed rows directly beneath the severity rule', () => {
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
        expect(frame.includes('↷  sample/pkg-skipped')).to.eql(true);
      });

      it('renders observed native test stats on completed package rows', () => {
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 2,
          passed: 1,
          skipped: 0,
          blocked: 0,
          blockedRunnable: 0,
          failed: 1,
          pending: 0,
          running: [],
          completed: [
            {
              kind: 'failed',
              path: 'sample/pkg-failed-tests',
              elapsed: 112,
              testStats: {
                kind: 'observed',
                capability: 'deno:junit',
                source: 'junit',
                tests: 3,
                failed: 1,
                failures: 1,
                errors: 0,
                skipped: 0,
                failedCases: [],
                warnings: [],
              },
            },
            {
              kind: 'passed',
              path: 'sample/pkg-passed-tests',
              elapsed: 112,
              testStats: {
                kind: 'observed',
                capability: 'deno:junit',
                source: 'junit',
                tests: 1,
                failed: 0,
                failures: 0,
                errors: 0,
                skipped: 0,
                failedCases: [],
                warnings: [],
              },
            },
            {
              kind: 'passed',
              path: 'sample/pkg-unsupported-tests',
              elapsed: 92,
              testStats: {
                kind: 'unsupported',
                capability: 'none',
                reason: 'task:not-native-deno-test',
              },
            },
          ],
          terminal: false,
          width: 140,
        }));

        expect(frame.includes('3 tests, 1 failed, 112ms')).to.eql(true);
        expect(frame.includes('sample/pkg-passed-tests 1 test, 112ms')).to.eql(true);
        expect(frame.includes('—, 92ms')).to.eql(true);
      });

      it('separates the minimal failure index from completed results', () => {
        const failure = ran('code/sys/crdt', false, {
          stderr: 'secret assertion output\n',
          testStats: observedStats(3, 2),
        });
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 2,
          passed: 0,
          skipped: 0,
          blocked: 0,
          blockedRunnable: 0,
          failed: 1,
          pending: 1,
          running: [],
          completed: [{
            kind: 'failed',
            path: failure.path,
            elapsed: failure.elapsed,
            testStats: failure.testStats,
          }],
          failures: [{
            package: failure,
            rerun: { cwd: failure.path, task: 'test' },
          }],
          terminal: false,
          width: 100,
        }));
        const lines = frame.split('\n');
        const completedIndex = lines.findIndex((line) => line.includes('✕  code/sys/crdt'));
        const failureIndex = lines.findIndex((line) => line.includes('✕ code/sys/crdt'));

        expect(completedIndex >= 0).to.eql(true);
        expect(lines[completedIndex + 1]).to.eql('┄'.repeat(100));
        expect(failureIndex).to.eql(completedIndex + 2);
        expect(lines[failureIndex]).to.eql('✕ code/sys/crdt · 2 failed tests');
        expect(lines[failureIndex + 1]).to.eql(
          '  rerun: deno task --cwd ./code/sys/crdt test',
        );
        expect(frame.includes('secret assertion output')).to.eql(false);
      });

      it('caps unbounded completed detail at five grid rows and reports every hidden result', () => {
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
        expect(frame.includes('... +2 more')).to.eql(true);
      });

      it('keeps overflow truthful beyond 64 retained completions', () => {
        const completed = Array.from({ length: 70 }, (_, index) => ({
          kind: 'passed' as const,
          path: `sample/pkg-${String(70 - index).padStart(2, '0')}`,
          elapsed: 1 as t.Msecs,
        }));
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 70,
          passed: 70,
          skipped: 0,
          blocked: 0,
          blockedRunnable: 0,
          failed: 0,
          pending: 0,
          running: [],
          completed,
          terminal: false,
          width: 100,
        }));

        expect(frame.includes('✓  sample/pkg-70')).to.eql(true);
        expect(frame.includes('✓  sample/pkg-61')).to.eql(true);
        expect(frame.includes('✓  sample/pkg-60')).to.eql(false);
        expect(frame.includes('... +60 more')).to.eql(true);
      });

      it('ages an old failed row into overflow while retaining its failure action', () => {
        const completed: t.WorkspaceRun.Package.Ran[] = [];
        for (let index = 1; index <= 11; index += 1) {
          completed.push(ran(`sample/pkg-passed-${String(index).padStart(2, '0')}`));
        }
        const failure = ran('sample/pkg-failed', false);
        const frame = Cli.stripAnsi(formatParallelProgress({
          runnableTotal: 12,
          passed: 11,
          skipped: 0,
          blocked: 0,
          blockedRunnable: 0,
          failed: 1,
          pending: 0,
          running: [],
          completed: [
            ...completed.map((item) => ({
              kind: 'passed' as const,
              path: item.path,
              elapsed: item.elapsed,
            })),
            { kind: 'failed', path: failure.path, elapsed: failure.elapsed },
          ],
          failures: [{
            package: failure,
            rerun: { cwd: failure.path, task: 'test' },
          }],
          terminal: false,
          width: 100,
        }));

        expect(frame.includes('✕  sample/pkg-failed')).to.eql(false);
        expect(frame.includes('✓  sample/pkg-passed-10')).to.eql(true);
        expect(frame.includes('✓  sample/pkg-passed-11')).to.eql(false);
        expect(frame.includes('... +2 more')).to.eql(true);
        expect(frame.includes('✕ sample/pkg-failed · exit 1')).to.eql(true);
        expect(frame.includes('rerun: deno task --cwd ./sample/pkg-failed test')).to.eql(true);
      });

      it('preserves completed recency across repeated renders', () => {
        const args = {
          runnableTotal: 4,
          passed: 1,
          skipped: 1,
          blocked: 1,
          blockedRunnable: 1,
          failed: 1,
          pending: 0,
          running: [],
          completed: [
            { kind: 'blocked' as const, path: 'sample/pkg-newest-blocked' },
            { kind: 'passed' as const, path: 'sample/pkg-second-passed', elapsed: 2 },
            { kind: 'failed' as const, path: 'sample/pkg-third-failed', elapsed: 3 },
            { kind: 'skipped' as const, path: 'sample/pkg-oldest-skipped' },
          ],
          terminal: false,
          width: 100,
        };

        const first = formatParallelProgress(args);
        const repeated = formatParallelProgress({ ...args, elapsed: 9_000 });

        expect(repeated).to.eql(first);
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

    it('wraps intro messages under the aligned message column', () => {
      const line = Cli.stripAnsi(formatIntroLine(
        'workspace test',
        'strategy: parallel, 4 jobs (concurrent)',
        { width: 40, terminal: true },
      ));
      const lines = line.split('\n');

      expect(lines).to.eql([
        'workspace test   →  strategy: parallel,',
        '                    4 jobs (concurrent)',
      ]);
      expect(lines.every((item) => Cli.Fmt.Text.Width.measure(item) <= 40)).to.eql(true);
    });
  });

  describe('createParallelReporter', () => {
    describe('transport selection', () => {
      it('prints a plain deterministic header outside TTY contexts', () => {
        const lines: string[] = [];
        const reporter = createParallelReporter({
          task: 'test',
          jobs: 4,
          runnablePaths: ['sample/pkg-a', 'sample/pkg-b'],
          terminal: false,
          write: (line) => lines.push(line),
        });
        const success = ran('sample/pkg-a');

        reporter.start();
        reporter.event(started(success));
        reporter.event({ kind: 'finish', result: success });
        reporter.event({ kind: 'done', result: result([success]) });

        expect(lines.map((line) => Cli.stripAnsi(line))).to.eql([
          'workspace test   →  strategy: parallel, 4 jobs (concurrent)',
        ]);
      });
    });

    describe('live projection', () => {
      it('renders a failed finish immediately and retains it through later success', () => {
        const lines: string[] = [];
        const spinner = spinnerProbe();
        const reporter = createParallelReporter({
          task: 'test',
          jobs: 1,
          runnablePaths: ['code/sys/crdt', 'code/sys/std'],
          terminal: true,
          write: (line) => lines.push(line),
          deps: createInertReporterRuntimeDeps(spinner.instance),
        });
        const failure = ran('code/sys/crdt', false, {
          name: '@sys/crdt',
          stderr: 'secret assertion output\n',
          testStats: observedStats(3, 2),
        });
        const success = ran('code/sys/std', true, { name: '@sys/std' });

        reporter.start();
        reporter.event(started(failure));
        reporter.event({ kind: 'finish', result: failure });
        const afterFailure = spinner.frames.at(-1) ?? '';

        reporter.event(started(success));
        reporter.event({ kind: 'finish', result: success });
        const afterSuccess = spinner.frames.at(-1) ?? '';

        reporter.event({ kind: 'done', result: result([failure, success], failure) });
        reporter.stop();

        expect(afterFailure.includes('✕ @sys/crdt · 2 failed tests')).to.eql(true);
        expect(
          afterFailure.includes('rerun: deno task --cwd ./code/sys/crdt test'),
        ).to.eql(true);
        expect(afterFailure.includes('secret assertion output')).to.eql(false);
        expect(afterSuccess.includes('✕ @sys/crdt · 2 failed tests')).to.eql(true);
        expect(afterSuccess.includes('✓  @sys/std')).to.eql(true);
        expect(afterSuccess.indexOf('✓  @sys/std') < afterSuccess.indexOf('✕  @sys/crdt')).to.eql(
          true,
        );
        expect(reporter.completion()).to.eql({ failedPackages: { visible: 1, total: 1 } });
        expect(spinner.stops()).to.eql(1);
      });
    });

    describe('finalization', () => {
      it('writes every completion and failed action to final scrollback', () => {
        const lines: string[] = [];
        const spinner = spinnerProbe();
        const failures = Array.from(
          { length: 20 },
          (_, index) => ran(`sample/failure-${index + 1}`, false),
        );
        const reporter = createParallelReporter({
          task: 'test',
          jobs: 4,
          runnablePaths: failures.map((item) => item.path),
          terminal: true,
          write: (line) => lines.push(line),
          deps: createInertReporterRuntimeDeps(spinner.instance),
        });

        reporter.start();
        failures.forEach((failure) => {
          reporter.event(started(failure));
          reporter.event({ kind: 'finish', result: failure });
        });
        const liveFrame = spinner.frames.at(-1) ?? '';
        reporter.event({ kind: 'done', result: result(failures, failures[0]) });

        const finalFrame = Cli.stripAnsi(lines.at(-1) ?? '');
        const completed = finalFrame.match(/✕[ ]{2}sample\/failure-\d+/g)?.length ?? 0;
        const actions = finalFrame
          .split('\n')
          .filter((line) => line.startsWith('✕ sample/failure-'))
          .length;
        expect(liveFrame.includes('... +')).to.eql(true);
        expect(finalFrame.includes('... +')).to.eql(false);
        expect(completed).to.eql(failures.length);
        expect(actions).to.eql(failures.length);
        expect(finalFrame.indexOf('✕  sample/failure-') < finalFrame.indexOf('✕ sample/failure-'))
          .to
          .eql(true);
        expect(reporter.completion()).to.eql({
          failedPackages: { visible: failures.length, total: failures.length },
        });
        expect(spinner.stops()).to.eql(1);
      });

      it('stops after a final scrollback write failure without masking it or issuing a receipt', () => {
        const cause = new Error('final-write-failed');
        let failWrite = false;
        let writeCalls = 0;
        const spinner = spinnerProbe();
        const reporter = createParallelReporter({
          task: 'test',
          jobs: 1,
          runnablePaths: ['sample/pkg-a'],
          terminal: true,
          write() {
            writeCalls += 1;
            if (failWrite) throw cause;
          },
          deps: createInertReporterRuntimeDeps(spinner.instance),
        });
        const failure = ran('sample/pkg-a', false);
        let thrown: unknown;

        reporter.start();
        reporter.event(started(failure));
        reporter.event({ kind: 'finish', result: failure });
        failWrite = true;
        try {
          reporter.event({ kind: 'done', result: result([failure], failure) });
        } catch (error) {
          thrown = error;
        }
        const writesAfterFailure = writeCalls;
        let retryThrown: unknown;
        try {
          reporter.event({ kind: 'done', result: result([failure], failure) });
        } catch (error) {
          retryThrown = error;
        }

        expect(thrown).to.equal(cause);
        expect(retryThrown).to.eql(undefined);
        expect(writeCalls).to.eql(writesAfterFailure);
        expect(reporter.completion()).to.eql(undefined);
        expect(spinner.stops()).to.eql(1);
      });

      it('emits no final diagnosis and remains stopped after completion', () => {
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
        reporter.event(started(fail));
        reporter.event({ kind: 'finish', result: fail });
        reporter.event({ kind: 'done', result: result([fail], fail) });
        reporter.stop();
        reporter.stop();
        reporter.event({ kind: 'done', result: result([fail], fail) });

        expect(lines.map((line) => Cli.stripAnsi(line))).to.eql([
          'workspace test   →  strategy: parallel, 2 jobs (concurrent)',
        ]);
      });
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
  output: {
    name?: t.StringPkgName;
    stdout?: string;
    stderr?: string;
    testStats?: t.WorkspaceRun.Test.Stats.Result;
  } = {},
): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    name: output.name ?? path,
    path,
    code: success ? 0 : 1,
    success,
    signal: null,
    elapsed: 1,
    ...output,
  };
}

function started(item: t.WorkspaceRun.Package.Identity): ParallelRunEvent {
  return { kind: 'start', name: item.name, path: item.path };
}

function observedStats(tests: number, failed: number): t.WorkspaceRun.Test.Stats.Observed {
  return {
    kind: 'observed',
    capability: 'deno:junit',
    source: 'junit',
    tests,
    failed,
    failures: failed,
    errors: 0,
    skipped: 0,
    failedCases: [],
    warnings: [],
  };
}

function spinnerProbe(options: { setText?: (value: string) => void } = {}) {
  let text = '';
  let stopCount = 0;
  const frames: string[] = [];
  const instance: t.Cli.Spinner.Instance = {
    get text() {
      return text;
    },
    set text(value) {
      text = value;
      frames.push(Cli.stripAnsi(value));
      options.setText?.(value);
    },
    start(value) {
      if (value !== undefined) this.text = value;
      return this;
    },
    stop() {
      stopCount += 1;
      return this;
    },
    succeed(value) {
      if (value !== undefined) this.text = value;
      return this.stop();
    },
    fail(value) {
      if (value !== undefined) this.text = value;
      return this.stop();
    },
  };

  return {
    frames,
    instance,
    stops: () => stopCount,
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
