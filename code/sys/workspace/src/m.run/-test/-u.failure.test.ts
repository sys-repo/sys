import { describe, expect, it, type t } from '../../-test.ts';
import { createFailedPackage, projectFailedPackages } from '../u/u.failure.ts';

const WORKSPACE = '/tmp/sample-workspace' as t.StringDir;

describe('WorkspaceRun.failure projection', () => {
  it('creates a live carrier without copying package facts', () => {
    const failure = ran('code/pkg-failed', {
      code: 1,
      stderr: 'original stderr\n',
      testStats: observedStats(),
    });

    const projected = createFailedPackage(failure, 'test');

    expect(projected.package).to.equal(failure);
    expect(projected.rerun).to.eql({ cwd: 'code/pkg-failed', task: 'test' });
  });

  it('retains every failed package in result order with its original identity', () => {
    const first = ran('code/pkg-first', {
      code: 2,
      stderr: 'first stderr\n',
      testStats: observedStats(),
    });
    const second = ran('code/pkg-second', {
      code: 143,
      signal: 'SIGTERM',
    });
    const success = ran('code/pkg-success', { code: 0, success: true });
    const input = result({
      task: 'check',
      packages: [first, success, second],
      failure: first,
    });

    const projected = projectFailedPackages(input);

    expect(projected.map((item) => item.package.path)).to.eql([
      'code/pkg-first',
      'code/pkg-second',
    ]);
    expect(projected[0]?.package).to.equal(first);
    expect(projected[1]?.package).to.equal(second);
    expect(projected.map((item) => item.rerun)).to.eql([
      { cwd: 'code/pkg-first', task: 'check' },
      { cwd: 'code/pkg-second', task: 'check' },
    ]);
  });

  it('returns no failures for a successful result', () => {
    const success = ran('code/pkg-success', { code: 0, success: true });
    const skipped: t.WorkspaceRun.Package.Skipped = {
      kind: 'skipped',
      path: 'code/pkg-skipped',
      reason: 'task:missing',
    };

    expect(projectFailedPackages(result({ packages: [success, skipped] }))).to.eql([]);
  });

  it('excludes successful, blocked, and skipped outcomes from a failed result', () => {
    const failure = ran('code/pkg-failed', { code: 1 });
    const success = ran('code/pkg-success', { code: 0, success: true });
    const blocked: t.WorkspaceRun.Package.Blocked = {
      kind: 'blocked',
      path: 'code/pkg-blocked',
      reason: 'fail-fast',
    };
    const skipped: t.WorkspaceRun.Package.Skipped = {
      kind: 'skipped',
      path: 'code/pkg-skipped',
      reason: 'task:missing',
    };
    const input = result({
      packages: [failure, success, blocked, skipped],
      failure,
    });

    const projected = projectFailedPackages(input);
    expect(projected.map((item) => item.package.path)).to.eql(['code/pkg-failed']);
    expect(projected[0]?.package).to.equal(failure);
  });
});

/**
 * Helpers:
 */

function ran(
  path: t.StringPath,
  options: {
    code: number;
    success?: boolean;
    signal?: Deno.Signal | null;
    stdout?: string;
    stderr?: string;
    testStats?: t.WorkspaceRun.Test.Stats.Result;
  },
): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    path,
    code: options.code,
    success: options.success ?? false,
    signal: options.signal ?? null,
    elapsed: 12,
    stdout: options.stdout,
    stderr: options.stderr,
    testStats: options.testStats,
  };
}

function result(args: {
  task?: t.WorkspaceRun.Task;
  packages: readonly t.WorkspaceRun.Package.Result[];
  failure?: t.WorkspaceRun.Package.Ran;
}): t.WorkspaceRun.Result {
  const base = {
    task: args.task ?? 'test',
    cwd: WORKSPACE,
    elapsed: 20,
    orderedPaths: args.packages.map((item) => item.path),
    packages: args.packages,
  };

  return args.failure ? { ...base, ok: false, failure: args.failure } : { ...base, ok: true };
}

function observedStats(): t.WorkspaceRun.Test.Stats.Observed {
  return {
    kind: 'observed',
    capability: 'deno:junit',
    source: 'junit',
    tests: 3,
    failed: 1,
    failures: 1,
    errors: 0,
    skipped: 0,
    failedCases: [
      {
        kind: 'failure',
        name: 'rejects invalid input',
        className: 'Schema.decode',
        message: 'expected foo, received bar',
      },
    ],
    warnings: [],
  };
}
