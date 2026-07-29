import { c, Cli, describe, expect, it, Str, type t } from '../../-test.ts';
import { WorkspaceRun } from '../mod.ts';

const WORKSPACE = '/tmp/sample-workspace' as t.StringDir;
const RULE = '━'.repeat(100);

describe('WorkspaceRun.Fmt.handoff', () => {
  describe('result and diagnostic projection', () => {
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
          testStats: observed({ tests: 2 }),
        }),
        ran('code/pkg-c', {
          success: true,
          code: 0,
          testStats: unsupported(),
        }),
      ];
      const rendered = WorkspaceRun.Fmt.handoff(okResult(packages), {
        detail: 'compact',
        terminal: false,
        width: 100,
      });
      const text = plain(rendered);

      expect(text).to.eql(Str.dedent(`
      Workspace tests done in 20ms
      ${RULE}
      3 packages · 5 tests · 2 reports collected · 1 not applicable
    `));
      expect(rendered.split('\n')[2]).to.eql(
        [
          c.green('3 packages'),
          c.white('5 tests'),
          c.white('2 reports collected'),
          c.white('1 not applicable'),
        ].join(c.gray(' · ')),
      );
      expect(text.includes('failed package')).to.eql(false);
      expect(text.includes('rerun:')).to.eql(false);
    });

    it('uses the manifest name in repair titles and the workspace path in reruns', () => {
      const failure = ran('code/sys/std', {
        name: '@sys/std',
        code: 1,
        testStats: observed({ tests: 3, failed: 2 }),
      });
      const text = plain(WorkspaceRun.Fmt.handoff(failedResult([failure], failure), {
        detail: 'compact',
        terminal: false,
        width: 100,
      }));

      expect(text.includes('✕ @sys/std · 2 failed tests')).to.eql(true);
      expect(text.includes('✕ code/sys/std')).to.eql(false);
      expect(text.includes('rerun: deno task --cwd ./code/sys/std test')).to.eql(true);
    });

    it('labels mixed report capability states without calling them unsupported reports', () => {
      const packages = [
        ran('code/pkg-unavailable', {
          success: true,
          code: 0,
          testStats: unavailable(),
        }),
        ran('code/pkg-not-applicable', {
          success: true,
          code: 0,
          testStats: unsupported(),
        }),
      ];
      const rendered = WorkspaceRun.Fmt.handoff(okResult(packages), {
        detail: 'compact',
        terminal: false,
        width: 100,
      });
      const text = plain(rendered);

      expect(text).to.eql(Str.dedent(`
      Workspace tests done in 20ms
      ${RULE}
      2 packages · 0 reports collected · 1 unavailable · 1 not applicable
    `));
      expect(rendered.split('\n')[2]).to.eql(
        [
          c.green('2 packages'),
          c.white('0 reports collected'),
          c.white('1 unavailable'),
          c.white('1 not applicable'),
        ].join(c.gray(' · ')),
      );
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
      const compactRendered = WorkspaceRun.Fmt.handoff(result, {
        detail: 'compact',
        terminal: false,
        width: 100,
      });
      const compact = plain(compactRendered);
      const fullRendered = WorkspaceRun.Fmt.handoff(result, {
        detail: 'full',
        terminal: false,
        width: 100,
      });
      const full = plain(fullRendered);

      expect(compact).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      ${RULE}
      1 ran · 1 failed · 5 tests · 1 report collected

      1 failed package

      ✕ code/sys/schema · 4 failed tests
        rerun: deno task --cwd ./code/sys/schema test
    `));
      expect(compactRendered.split('\n')[2]).to.eql(
        [
          c.white('1 ran'),
          c.red('1 failed'),
          c.white('5 tests'),
          c.white('1 report collected'),
        ].join(c.gray(' · ')),
      );
      expect(compact.includes('Schema.decode')).to.eql(false);
      expect(compact.includes('expected "foo"')).to.eql(false);
      expect(compact.includes('unstructured test runner output')).to.eql(false);

      expect(full.includes('Failure details')).to.eql(true);
      expect(full.includes('• Schema.decode → rejects an invalid discriminant')).to.eql(true);
      expect(full.includes('expected "foo", received "bar"')).to.eql(true);
      expect(full.includes('...+1 more failed test')).to.eql(true);
      const overflow = fullRendered.split('\n').find((line) => plain(line).includes('...+'));
      expect(overflow).to.eql(
        `  ${c.gray(c.italic('...'))}${c.red(c.italic('+1'))}${
          c.gray(c.italic(' more failed test'))
        }`,
      );
      expect(full.includes('unstructured test runner output')).to.eql(true);
    });
  });

  describe('continuation grammar', () => {
    it('renders exact plural failed-test text and styling', () => {
      const failure = ran('code/pkg-five-failures', {
        code: 1,
        testStats: observed({
          tests: 5,
          failed: 5,
          failedCases: [
            failedCase('visible failure one'),
            failedCase('visible failure two'),
            failedCase('visible failure three'),
          ],
        }),
      });
      const rendered = WorkspaceRun.Fmt.handoff(failedResult([failure], failure), {
        detail: 'full',
        terminal: false,
        width: 100,
      });
      const overflow = rendered.split('\n').find((line) => plain(line).includes('...+'));

      expect(plain(overflow ?? '')).to.eql('  ...+2 more failed tests');
      expect(overflow).to.eql(
        `  ${c.gray(c.italic('...'))}${c.red(c.italic('+2'))}${
          c.gray(c.italic(' more failed tests'))
        }`,
      );
    });

    it('keeps grouped failed-test continuation counts inside one red italic token', () => {
      const failure = ran('code/pkg-many-failures', {
        code: 1,
        testStats: observed({
          tests: 10_003,
          failed: 10_003,
          failedCases: [
            failedCase('visible failure one'),
            failedCase('visible failure two'),
            failedCase('visible failure three'),
          ],
        }),
      });
      const rendered = WorkspaceRun.Fmt.handoff(failedResult([failure], failure), {
        detail: 'full',
        terminal: false,
        width: 100,
      });
      const overflow = rendered.split('\n').find((line) => plain(line).includes('...+'));

      expect(plain(overflow ?? '')).to.eql('  ...+10,000 more failed tests');
      expect(overflow).to.eql(
        `  ${c.gray(c.italic('...'))}${c.red(c.italic('+10,000'))}${
          c.gray(c.italic(' more failed tests'))
        }`,
      );
    });
  });

  describe('fallback evidence', () => {
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
  });

  describe('repair projection', () => {
    it('omits repair actions already visible in final screen output', () => {
      const first = ran('code/pkg-first', { code: 1 });
      const second = ran('code/pkg-second', { code: 2 });
      const result = failedResult([first, second], first);
      const text = plain(WorkspaceRun.Fmt.handoff(result, {
        detail: 'compact',
        terminal: false,
        width: 100,
        screen: { failedPackages: { visible: 2, total: 2 } },
      }));

      expect(text).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      ${RULE}
      2 ran · 2 failed
    `));

      const full = WorkspaceRun.Fmt.handoff(result, {
        detail: 'full',
        terminal: false,
        width: 100,
        screen: { failedPackages: { visible: 2, total: 2 } },
      });
      const fullWithoutReceipt = WorkspaceRun.Fmt.handoff(result, {
        detail: 'full',
        terminal: false,
        width: 100,
      });
      expect(full).to.eql(fullWithoutReceipt);
    });

    it('appends only failed-package actions omitted from supplied screen truth', () => {
      const first = ran('code/pkg-first', { code: 1 });
      const second = ran('code/pkg-second', { code: 2 });
      const third = ran('code/pkg-third', { code: 3 });
      const result = failedResult([first, second, third], first);
      const text = plain(WorkspaceRun.Fmt.handoff(result, {
        detail: 'compact',
        terminal: false,
        width: 100,
        screen: { failedPackages: { visible: 1, total: 3 } },
      }));

      expect(text.includes('code/pkg-first')).to.eql(false);
      expect(text).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      ${RULE}
      3 ran · 3 failed

      2 more failed packages

      ✕ code/pkg-second · exit 2
        rerun: deno task --cwd ./code/pkg-second test

      ✕ code/pkg-third · exit 3
        rerun: deno task --cwd ./code/pkg-third test
    `));
    });

    it('falls back to every action for inconsistent screen receipts', () => {
      const first = ran('code/pkg-first', { code: 1 });
      const second = ran('code/pkg-second', { code: 2 });
      const result = failedResult([first, second], first);
      const expected = WorkspaceRun.Fmt.handoff(result, {
        detail: 'compact',
        terminal: false,
        width: 100,
      });
      const receipts: readonly t.WorkspaceRun.Test.Reporter.ScreenCompletion[] = [
        { failedPackages: { visible: 2, total: 3 } },
        { failedPackages: { visible: -1, total: 2 } },
        { failedPackages: { visible: 1.5, total: 2 } },
        { failedPackages: { visible: 3, total: 2 } },
      ];

      receipts.forEach((screen) => {
        const actual = WorkspaceRun.Fmt.handoff(result, {
          detail: 'compact',
          terminal: false,
          width: 100,
          screen,
        });
        expect(actual).to.eql(expected);
      });
    });

    it('keeps failed packages graph ordered and excludes blocked outcomes', () => {
      const first = ran('code/pkg-first', { code: 2, stderr: 'first evidence\n' });
      const second = ran('code/pkg-second', {
        code: 143,
        signal: 'SIGTERM',
        stdout: 'second evidence\n',
      });
      const blocked: t.WorkspaceRun.Package.Blocked = {
        kind: 'blocked',
        name: 'code/pkg-blocked',
        path: 'code/pkg-blocked',
        reason: 'fail-fast',
      };
      const text = plain(WorkspaceRun.Fmt.handoff(
        failedResult([first, blocked, second], first, 'check'),
        { detail: 'compact', terminal: false, width: 100 },
      ));

      expect(text).to.eql(Str.dedent(`
      Workspace checks failed in 20ms
      ${RULE}
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
      ${RULE}
      1 ran · 1 failed

      1 failed package

      ✕ code/pkg-failed · exit 1
        rerun: deno task --cwd ./code/pkg-failed test
    `));
      expect(full).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      ${RULE}
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
  });

  describe('handoff hierarchy and width', () => {
    it('wraps summary capability states only at semantic separators', () => {
      const result = widthSummaryResult();
      const render = (width: number) =>
        WorkspaceRun.Fmt.handoff(result, {
          detail: 'compact',
          terminal: false,
          width,
          screen: { failedPackages: { visible: 2, total: 2 } },
        });
      const tiny = render(40);
      const narrow = render(80);

      expect(plain(tiny).split('\n').slice(2)).to.eql([
        '6 ran · 2 failed · 10,365 tests',
        '2 reports collected',
        '1 unavailable · 3 not applicable',
      ]);
      expect(plain(narrow)).to.eql(Str.dedent(`
      Workspace tests failed in 20ms
      ${'━'.repeat(80)}
      6 ran · 2 failed · 10,365 tests · 2 reports collected
      1 unavailable · 3 not applicable
    `));
      expect(narrow.split('\n').slice(2)).to.eql([
        [
          c.white('6 ran'),
          c.red('2 failed'),
          c.white('10,365 tests'),
          c.white('2 reports collected'),
        ].join(c.gray(' · ')),
        [c.white('1 unavailable'), c.white('3 not applicable')].join(c.gray(' · ')),
      ]);
      for (
        const { rendered, width } of [{ rendered: tiny, width: 40 }, {
          rendered: narrow,
          width: 80,
        }]
      ) {
        expect(rendered.split('\n').every((line) => Cli.Fmt.Text.Width.measure(line) <= width)).to
          .eql(true);
      }
    });

    it('places an exact-width result-colored rule between every title and summary', () => {
      const success = okResult([ran('code/pkg-ok', { success: true, code: 0 })]);
      const failure = ran('code/pkg-failed', { code: 1 });
      const failed = failedResult([failure], failure);

      for (const detail of ['compact', 'full'] as const) {
        for (const width of [40, 80, 100, 160]) {
          const successLines = WorkspaceRun.Fmt.handoff(success, {
            detail,
            terminal: false,
            width,
          }).split('\n');
          const failureLines = WorkspaceRun.Fmt.handoff(failed, {
            detail,
            terminal: false,
            width,
          }).split('\n');

          expect(successLines.slice(0, 3).map(plain)).to.eql([
            'Workspace tests done in 20ms',
            '━'.repeat(width),
            '1 package',
          ]);
          expect(failureLines.slice(0, 3).map(plain)).to.eql([
            'Workspace tests failed in 20ms',
            '━'.repeat(width),
            '1 ran · 1 failed',
          ]);
          expect(successLines[1]).to.eql(c.green('━'.repeat(width)));
          expect(failureLines[1]).to.eql(c.red('━'.repeat(width)));
          expect(successLines[2]).to.eql(c.green('1 package'));
          expect(failureLines[2]).to.eql(
            `${c.white('1 ran')}${c.gray(' · ')}${c.red('1 failed')}`,
          );
        }
      }
    });

    it('measures terminal handoff width once and performs no screen repaint', () => {
      const failure = ran('code/pkg-failed', { code: 1 });
      const result = failedResult([failure], failure);
      const size = Cli.Screen.size;
      const repaint = Cli.Screen.repaint;
      let sizeCalls = 0;
      let repaintCalls = 0;
      let rendered = '';
      Object.defineProperty(Cli.Screen, 'size', {
        value: () => ({ width: ++sizeCalls === 1 ? 40 : 160, height: 24 }),
      });
      Object.defineProperty(Cli.Screen, 'repaint', {
        value: () => {
          repaintCalls += 1;
        },
      });

      try {
        rendered = WorkspaceRun.Fmt.handoff(result, { detail: 'compact', terminal: true });
      } finally {
        Object.defineProperty(Cli.Screen, 'size', { value: size });
        Object.defineProperty(Cli.Screen, 'repaint', { value: repaint });
      }

      const lines = rendered.split('\n');
      expect(sizeCalls).to.eql(1);
      expect(repaintCalls).to.eql(0);
      expect(lines[1]).to.eql(c.red('━'.repeat(40)));
      expect(lines.slice(0, 3).map(plain)).to.eql([
        'Workspace tests failed in 20ms',
        '━'.repeat(40),
        '1 ran · 1 failed',
      ]);
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
});

function plain(input: string) {
  return Cli.stripAnsi(input);
}

function ran(
  path: t.StringPath,
  options: {
    code: number;
    name?: t.StringPkgName;
    success?: boolean;
    signal?: Deno.Signal | null;
    stdout?: string;
    stderr?: string;
    testStats?: t.WorkspaceRun.Test.Stats.Result;
  },
): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    name: options.name ?? path,
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

function widthSummaryResult() {
  const first = ran('code/pkg-failed-tests', {
    code: 1,
    testStats: observed({ tests: 10_364, failed: 2 }),
  });
  return failedResult([
    first,
    ran('code/pkg-failed-process', { code: 1, testStats: observed({ tests: 1 }) }),
    ran('code/pkg-unavailable', { success: true, code: 0, testStats: unavailable() }),
    ...Array.from(
      { length: 3 },
      () => ran('code/pkg-not-applicable', { success: true, code: 0, testStats: unsupported() }),
    ),
  ], first);
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

function unavailable(): t.WorkspaceRun.Test.Stats.Unavailable {
  return {
    kind: 'unavailable',
    capability: 'deno:junit',
    source: 'junit',
    reason: 'report:missing',
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
