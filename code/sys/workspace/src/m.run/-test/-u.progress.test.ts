import { describe, expect, it, type t } from '../../-test.ts';
import { createParallelProgressModel } from '../u/u.progress.ts';

describe('WorkspaceRun.parallel progress model', () => {
  it('tracks package progress snapshots from scheduler events', () => {
    let now = 1_000 as t.Msecs;
    const model = createParallelProgressModel({
      runnablePaths: ['code/a', 'code/c'],
      now: () => now,
    });

    expect(model.snapshot()).to.eql({
      runnableTotal: 2,
      passed: 0,
      skipped: 0,
      blocked: 0,
      blockedRunnable: 0,
      failed: 0,
      pending: 2,
      running: [],
      completed: [],
      elapsed: 0,
    });

    now = 1_250 as t.Msecs;
    model.event({ kind: 'start', path: 'code/a' });
    now = 1_750 as t.Msecs;

    expect(model.snapshot()).to.eql({
      runnableTotal: 2,
      passed: 0,
      skipped: 0,
      blocked: 0,
      blockedRunnable: 0,
      failed: 0,
      pending: 1,
      running: [{ path: 'code/a', elapsed: 500 }],
      completed: [],
      elapsed: 750,
    });

    model.event({ kind: 'skip', path: 'code/b', result: skipped('code/b') });
    model.event({ kind: 'finish', path: 'code/a', result: ran('code/a', true, 42) });
    model.event({ kind: 'block', path: 'code/c', result: blocked('code/c') });

    expect(model.snapshot()).to.eql({
      runnableTotal: 2,
      passed: 1,
      skipped: 1,
      blocked: 1,
      blockedRunnable: 1,
      failed: 0,
      pending: 0,
      running: [],
      completed: [
        { kind: 'blocked', path: 'code/c' },
        { kind: 'passed', path: 'code/a', elapsed: 42 },
        { kind: 'skipped', path: 'code/b' },
      ],
      elapsed: 750,
    });
  });

  it('keeps skipped packages separate from runnable package totals', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/a'],
      now: () => 0 as t.Msecs,
    });

    model.event({ kind: 'skip', path: 'code/b', result: skipped('code/b') });

    const snapshot = model.snapshot();
    expect(snapshot.runnableTotal).to.eql(1);
    expect(snapshot.pending).to.eql(1);
    expect(snapshot.skipped).to.eql(1);
  });

  it('tracks failed package finishes distinctly from passed finishes', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/a'],
      now: () => 0 as t.Msecs,
    });

    model.event({ kind: 'start', path: 'code/a' });
    model.event({ kind: 'finish', path: 'code/a', result: ran('code/a', false, 17) });

    const snapshot = model.snapshot();
    expect(snapshot.passed).to.eql(0);
    expect(snapshot.failed).to.eql(1);
    expect(snapshot.completed).to.eql([{ kind: 'failed', path: 'code/a', elapsed: 17 }]);
  });

  it('carries completed package native test stats without changing progress counts', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/a'],
      now: () => 0 as t.Msecs,
    });
    const stats = observedStats(3, 1);

    model.event({ kind: 'start', path: 'code/a' });
    model.event({ kind: 'finish', path: 'code/a', result: ran('code/a', false, 17, stats) });

    const snapshot = model.snapshot();
    expect(snapshot.passed).to.eql(0);
    expect(snapshot.failed).to.eql(1);
    expect(snapshot.completed).to.eql([{
      kind: 'failed',
      path: 'code/a',
      elapsed: 17,
      testStats: stats,
    }]);
  });
});

/**
 * Helpers:
 */
function ran(
  path: string,
  success: boolean,
  elapsed: number,
  testStats?: t.WorkspaceRun.Test.Stats.Result,
): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    path,
    code: success ? 0 : 1,
    success,
    signal: null,
    elapsed,
    ...(testStats ? { testStats } : {}),
  };
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

function skipped(path: string): t.WorkspaceRun.Package.Skipped {
  return { kind: 'skipped', path, reason: 'task:missing' };
}

function blocked(path: string): t.WorkspaceRun.Package.Blocked {
  return { kind: 'blocked', path, reason: 'fail-fast' };
}
