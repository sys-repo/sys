import { c, Cli, describe, expect, it, Str, type t } from '../../-test.ts';
import { WorkspaceRun } from '../mod.ts';

const WORKSPACE = '/tmp/sample-workspace' as t.StringDir;

describe('WorkspaceRun.Fmt.handoff', () => {
  it('formats a concise successful handoff without repair items', () => {
    const packages = [
      ran('code/pkg-a', {
        success: true,
        code: 0,
        testStats: observed({ tests: 3 }),
      }),
      ran('code/pkg-b', {
        success: true,
        code: 0,
        testStats: unsupported(),
      }),
    ];
    const text = plain(WorkspaceRun.Fmt.handoff(okResult(packages), {
      detail: 'compact',
      terminal: false,
      width: 100,
    }));

    expect(text).to.eql(Str.dedent(`
      Workspace tests done in 20ms
      2 packages · 3 tests · 1/2 reports observed · 1 unsupported
    `));
    expect(text.includes('failed package')).to.eql(false);
    expect(text.includes('rerun:')).to.eql(false);
  });

  it('keeps structured diagnostics out of compact output and in full output', () => {
    const failure = ran('code/sys/schema', {
      code: 1,
      stderr: 'unstructured test runner output\n',
      testStats: observed({
        tests: 5,
        failed: 4,
        failedCases: [
          failedCase('rejects an invalid discriminant', {
            className: 'Schema.decode',
            message: `${c.red('expected "foo", received "bar"')}\nstack detail`,
          }),
          failedCase('Schema.encode → preserves the canonical tag', {
            className: 'Schema.encode',
            message: 'expected "foo", received undefined',
          }),
          failedCase('reports missing fields'),
          failedCase('hidden fourth failure'),
        ],
      }),
    });
    const result = failedResult([failure], failure);
    const compact = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'compact',
      terminal: false,
      width: 100,
    }));
    const full = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'full',
      terminal: false,
      width: 100,
    }));

    expect(compact).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      1 ran · 1 failed · 5 tests · 1/1 report observed

      1 failed package

      ✕ code/sys/schema · 4 failed tests
        rerun: deno task --cwd ./code/sys/schema test
    `));
    expect(compact.includes('Schema.decode')).to.eql(false);
    expect(compact.includes('expected "foo"')).to.eql(false);
    expect(compact.includes('unstructured test runner output')).to.eql(false);

    expect(full.includes('Failure details')).to.eql(true);
    expect(full.includes('• Schema.decode → rejects an invalid discriminant')).to.eql(true);
    expect(full.includes('expected "foo", received "bar"')).to.eql(true);
    expect(full.includes('...and 1 more failed test')).to.eql(true);
    expect(full.includes('unstructured test runner output')).to.eql(true);
  });

  it('reports observed failure counts without inventing case identities', () => {
    const failure = ran('code/pkg-count-only', {
      code: 1,
      stderr: 'error: full-detail fallback evidence\n',
      testStats: observed({ tests: 3, failed: 2 }),
    });
    const result = failedResult([failure], failure);
    const compact = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'compact',
      terminal: false,
      width: 100,
    }));
    const full = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'full',
      terminal: false,
      width: 100,
    }));

    expect(compact.includes('✕ code/pkg-count-only · 2 failed tests')).to.eql(true);
    expect(compact.includes('exit 1')).to.eql(false);
    expect(compact.includes('full-detail fallback evidence')).to.eql(false);
    expect(compact.includes('•')).to.eql(false);
    expect(full.includes('output evidence (error): full-detail fallback evidence')).to.eql(true);
  });

  it('uses process exit without leaking output when observed tests report no failures', () => {
    const failure = ran('code/pkg-process-failed', {
      code: 1,
      stderr: 'error: package setup failed before tests ran\n',
      testStats: observed({ tests: 3 }),
    });
    const text = plain(WorkspaceRun.Fmt.handoff(failedResult([failure], failure), {
      detail: 'compact',
      terminal: false,
      width: 100,
    }));

    expect(text.includes('failed tests')).to.eql(false);
    expect(text.includes('✕ code/pkg-process-failed · exit 1')).to.eql(true);
    expect(text.includes('package setup failed before tests ran')).to.eql(false);
  });

  it('selects one conservative ANSI-stripped error excerpt only in full output', () => {
    const failure = ran('code/sys.driver/driver-stripe', {
      code: 1,
      stdout: 'stdout fallback\n',
      stderr: `Task test\n${c.red('error: The lockfile is out of date.')}\nlater stderr\n`,
      testStats: unsupported(),
    });
    const result = failedResult([failure], failure);
    const compact = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'compact',
      terminal: false,
      width: 100,
    }));
    const full = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'full',
      terminal: false,
      width: 100,
    }));

    expect(compact.includes('The lockfile is out of date.')).to.eql(false);
    expect(full.includes('output evidence (error): The lockfile is out of date.')).to.eql(true);
    expect(full.includes('Task test')).to.eql(true);
    expect(full.includes('stdout fallback')).to.eql(true);
    expect(full.includes('later stderr')).to.eql(true);
  });

  it('keeps failed packages graph ordered and excludes blocked outcomes from repair items', () => {
    const first = ran('code/pkg-first', { code: 2, stderr: 'first evidence\n' });
    const second = ran('code/pkg-second', {
      code: 143,
      signal: 'SIGTERM',
      stdout: 'second evidence\n',
    });
    const blocked: t.WorkspaceRun.Package.Blocked = {
      kind: 'blocked',
      path: 'code/pkg-blocked',
      reason: 'fail-fast',
    };
    const text = plain(WorkspaceRun.Fmt.handoff(
      failedResult([first, blocked, second], first, 'check'),
      { detail: 'compact', terminal: false, width: 100 },
    ));

    expect(text).to.eql(Str.dedent(`
      Workspace checks failed in 20ms
      2 ran · 2 failed · 1 blocked

      2 failed packages

      ✕ code/pkg-first · exit 2
        rerun: deno task --cwd ./code/pkg-first check

      ✕ code/pkg-second · signal SIGTERM
        rerun: deno task --cwd ./code/pkg-second check
    `));
  });

  it('remains actionable when no structured or buffered diagnosis exists', () => {
    const failure = ran('code/pkg-exit-only', { code: 9 });
    const text = plain(WorkspaceRun.Fmt.handoff(failedResult([failure], failure), {
      detail: 'compact',
      terminal: false,
      width: 100,
    }));

    expect(text.includes('✕ code/pkg-exit-only · exit 9')).to.eql(true);
    expect(text.includes('stderr:')).to.eql(false);
    expect(text.includes('stdout:')).to.eql(false);
    expect(text.includes('deno task --cwd ./code/pkg-exit-only test')).to.eql(true);
  });

  it('adds complete grouped streams only in full detail mode', () => {
    const failure = ran('code/pkg-failed', {
      code: 1,
      stdout: 'stdout first\nstdout second\n',
      stderr: 'stderr first\nstderr second\n',
    });
    const result = failedResult([failure], failure);
    const compact = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'compact',
      terminal: false,
      width: 100,
    }));
    const full = plain(WorkspaceRun.Fmt.handoff(result, {
      detail: 'full',
      terminal: false,
      width: 100,
    }));

    expect(compact).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      1 ran · 1 failed

      1 failed package

      ✕ code/pkg-failed · exit 1
        rerun: deno task --cwd ./code/pkg-failed test
    `));
    expect(full).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      1 ran · 1 failed

      1 failed package

      ✕ code/pkg-failed · exit 1
        rerun: deno task --cwd ./code/pkg-failed test

      Failure details

      ✕ code/pkg-failed
        output evidence (stderr): stderr first

      Failed package output

      ✕ code/pkg-failed exit 1
        stdout
          stdout first
          stdout second
        stderr
          stderr first
          stderr second
    `));
  });

  it('fits compact evidence while preserving the exact rerun command', () => {
    const path = 'code/a-very-long-package-name-that-must-be-fitted' as t.StringPath;
    const failure = ran(path, {
      code: 1,
      testStats: observed({
        tests: 12_345,
        failed: 12_345,
        failedCases: [failedCase('a long diagnostic identity that must wrap truthfully')],
      }),
    });
    const command = `deno task --cwd ./${path} test`;

    for (const width of [40, 80, 100, 160]) {
      const text = plain(WorkspaceRun.Fmt.handoff(failedResult([failure], failure), {
        detail: 'compact',
        terminal: false,
        width,
      }));
      const lines = text.split('\n');
      const rerunIndex = lines.findIndex((line) => line.trimStart().startsWith('rerun:'));
      const rerunLines = lines.slice(rerunIndex).filter((line) => line.trim() !== '');
      const renderedCommand = rerunLines
        .map((line, index) => index === 0 ? line.trim().slice('rerun: '.length) : line.trim())
        .join(' ');

      expect(rerunIndex >= 0).to.eql(true);
      expect(renderedCommand).to.eql(command);
      expect(text.includes('a long diagnostic identity')).to.eql(false);
      expect(
        lines.slice(0, rerunIndex).every((line) => Cli.Fmt.Text.Width.measure(line) <= width),
      ).to.eql(true);
    }
  });
});

function plain(input: string) {
  return Cli.stripAnsi(input);
}

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

function okResult(
  packages: readonly t.WorkspaceRun.Package.Result[],
  task: t.WorkspaceRun.Task = 'test',
): t.WorkspaceRun.Ok {
  return {
    ok: true,
    task,
    cwd: WORKSPACE,
    elapsed: 20,
    orderedPaths: packages.map((item) => item.path),
    packages,
  };
}

function failedResult(
  packages: readonly t.WorkspaceRun.Package.Result[],
  failure: t.WorkspaceRun.Package.Ran,
  task: t.WorkspaceRun.Task = 'test',
): t.WorkspaceRun.Fail {
  return {
    ok: false,
    task,
    cwd: WORKSPACE,
    elapsed: 20,
    orderedPaths: packages.map((item) => item.path),
    packages,
    failure,
  };
}

function observed(args: {
  tests: number;
  failed?: number;
  failedCases?: readonly t.WorkspaceRun.Test.Stats.FailedCase[];
}): t.WorkspaceRun.Test.Stats.Observed {
  const failed = args.failed ?? 0;
  return {
    kind: 'observed',
    capability: 'deno:junit',
    source: 'junit',
    tests: args.tests,
    failed,
    failures: failed,
    errors: 0,
    skipped: 0,
    failedCases: args.failedCases ?? [],
    warnings: [],
  };
}

function unsupported(): t.WorkspaceRun.Test.Stats.Unsupported {
  return {
    kind: 'unsupported',
    capability: 'none',
    reason: 'task:not-native-deno-test',
  };
}

function failedCase(
  name: string,
  options: { className?: string; message?: string } = {},
): t.WorkspaceRun.Test.Stats.FailedCase {
  return {
    kind: 'failure',
    name,
    className: options.className,
    message: options.message,
  };
}
