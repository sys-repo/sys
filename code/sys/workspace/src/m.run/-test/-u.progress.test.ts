import { describe, expect, it, type t } from '../../-test.ts';
import { createParallelProgressModel } from '../u/u.progress.ts';
import type { ParallelRunEvent } from '../u.run/mod.ts';

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
      failedPackages: [],
      elapsed: 0,
    });

    now = 1_250 as t.Msecs;
    model.event(started('code/a'));
    now = 1_750 as t.Msecs;

    expect(model.snapshot()).to.eql({
      runnableTotal: 2,
      passed: 0,
      skipped: 0,
      blocked: 0,
      blockedRunnable: 0,
      failed: 0,
      pending: 1,
      running: [{ name: 'code/a', path: 'code/a', elapsed: 500 }],
      completed: [],
      failedPackages: [],
      elapsed: 750,
    });

    model.event({ kind: 'skip', result: skipped('code/b') });
    model.event({ kind: 'finish', result: ran('code/a', true, 42) });
    model.event({ kind: 'block', result: blocked('code/c') });

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
        { kind: 'blocked', name: 'code/c', path: 'code/c' },
        { kind: 'passed', name: 'code/a', path: 'code/a', elapsed: 42 },
        { kind: 'skipped', name: 'code/b', path: 'code/b' },
      ],
      failedPackages: [],
      elapsed: 750,
    });
  });

  it('projects manifest names while retaining workspace paths', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/sys/std'],
      now: () => 0 as t.Msecs,
    });

    model.event(started('code/sys/std', '@sys/std'));
    expect(model.snapshot().running).to.eql([{
      name: '@sys/std',
      path: 'code/sys/std',
      elapsed: 0,
    }]);

    model.event({
      kind: 'finish',
      result: ran('code/sys/std', true, 1, undefined, '@sys/std'),
    });
    expect(model.snapshot().completed).to.eql([{
      kind: 'passed',
      name: '@sys/std',
      path: 'code/sys/std',
      elapsed: 1,
    }]);
  });

  it('keeps skipped packages separate from runnable package totals', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/a'],
      now: () => 0 as t.Msecs,
    });

    model.event({ kind: 'skip', result: skipped('code/b') });

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

    const failure = ran('code/a', false, 17);
    model.event(started('code/a'));
    model.event({ kind: 'finish', result: failure });

    const snapshot = model.snapshot();
    expect(snapshot.passed).to.eql(0);
    expect(snapshot.failed).to.eql(1);
    expect(snapshot.completed).to.eql([{
      kind: 'failed',
      name: 'code/a',
      path: 'code/a',
      elapsed: 17,
    }]);
    expect(snapshot.failedPackages).to.eql([failure]);
    expect(snapshot.failedPackages[0]).to.equal(failure);
  });

  it('retains mixed terminal events in exact newest-first completion order', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/a', 'code/b', 'code/c'],
      now: () => 0 as t.Msecs,
    });
    const failure = ran('code/c', false, 3);

    model.event({ kind: 'skip', result: skipped('code/d') });
    model.event(started('code/c'));
    model.event({ kind: 'finish', result: failure });
    model.event(started('code/b'));
    model.event({ kind: 'finish', result: ran('code/b', true, 2) });
    model.event({ kind: 'block', result: blocked('code/a') });

    const first = model.snapshot();
    const repeated = model.snapshot();
    expect(first.completed.map((item) => [item.kind, item.path])).to.eql([
      ['blocked', 'code/a'],
      ['passed', 'code/b'],
      ['failed', 'code/c'],
      ['skipped', 'code/d'],
    ]);
    expect(repeated.completed).to.eql(first.completed);
    expect(first.failedPackages).to.eql([failure]);
  });

  it('retains every completed package for truthful live projection', () => {
    const paths = Array.from({ length: 70 }, (_, index) => `code/pkg-${index + 1}`);
    const model = createParallelProgressModel({
      runnablePaths: paths,
      now: () => 0 as t.Msecs,
    });

    paths.forEach((path) => {
      model.event(started(path));
      model.event({ kind: 'finish', result: ran(path, true, 1) });
    });

    const completed = model.snapshot().completed;
    expect(completed).to.have.length(70);
    expect(completed[0]?.path).to.eql('code/pkg-70');
    expect(completed.at(-1)?.path).to.eql('code/pkg-1');
  });

  it('carries completed package native test stats without changing progress counts', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/a'],
      now: () => 0 as t.Msecs,
    });
    const stats = observedStats(3, 1);

    model.event(started('code/a'));
    model.event({ kind: 'finish', result: ran('code/a', false, 17, stats) });

    const snapshot = model.snapshot();
    expect(snapshot.passed).to.eql(0);
    expect(snapshot.failed).to.eql(1);
    expect(snapshot.completed).to.eql([{
      kind: 'failed',
      name: 'code/a',
      path: 'code/a',
      elapsed: 17,
      testStats: stats,
    }]);
    expect(snapshot.failedPackages[0]?.testStats).to.equal(stats);
  });

  it('retains failures in graph order while later packages complete', () => {
    const model = createParallelProgressModel({
      runnablePaths: ['code/a', 'code/b', 'code/c'],
      now: () => 0 as t.Msecs,
    });
    const first = ran('code/a', false, 3);
    const last = ran('code/c', false, 1);

    model.event(started('code/c'));
    model.event({ kind: 'finish', result: last });
    model.event(started('code/b'));
    model.event({ kind: 'finish', result: ran('code/b', true, 2) });
    model.event(started('code/a'));
    model.event({ kind: 'finish', result: first });

    const failures = model.snapshot().failedPackages;
    expect(failures.map((item) => item.path)).to.eql(['code/a', 'code/c']);
    expect(failures[0]).to.equal(first);
    expect(failures[1]).to.equal(last);
  });
});

/**
 * Helpers:
 */
function started(path: t.StringPath, name: t.StringPkgName = path): ParallelRunEvent {
  return { kind: 'start', name, path };
}

function ran(
  path: string,
  success: boolean,
  elapsed: number,
  testStats?: t.WorkspaceRun.Test.Stats.Result,
  name: t.StringPkgName = path,
): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    name,
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
  return { kind: 'skipped', name: path, path, reason: 'task:missing' };
}

function blocked(path: string): t.WorkspaceRun.Package.Blocked {
  return { kind: 'blocked', name: path, path, reason: 'fail-fast' };
}
