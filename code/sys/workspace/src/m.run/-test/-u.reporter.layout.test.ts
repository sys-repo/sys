import { c, Cli, describe, expect, it, type t } from '../../-test.ts';
import type { FailedPackage } from '../u/u.failure.ts';
import { formatParallelProgress, layoutParallelProgress } from '../u/u.reporter.layout.ts';
import type { ParallelProgressCompleted } from '../u/u.progress.ts';

type CompletedKind = ParallelProgressCompleted['kind'];

const WIDTH = 64;
const VISIBLE_COMPLETED_FOR_WIDTH_100 = 10;

describe('WorkspaceRun.parallel reporter layout', () => {
  describe('viewport bounds and semantic priority', () => {
    it('bounds one complete active frame by the explicit viewport', () => {
      const frame = formatParallelProgress({
        ...progress(),
        running: Array.from({ length: 8 }, (_, index) => ({
          path: `sample/running-package-${index + 1}`,
          elapsed: 65_000,
        })),
        completed: completed(24),
        failures: [failure('sample/failed-package')],
        terminal: true,
        viewport: { width: WIDTH, height: 12 },
        cursorRows: 1,
      });

      expect(physicalRows(frame, WIDTH) <= 11).to.eql(true);
      expectRowsCellSafe(frame, WIDTH);
    });

    it('reserves actionable failures before elastic completed detail', () => {
      const frame = Cli.stripAnsi(formatParallelProgress({
        ...progress(),
        failed: 1,
        completed: completed(20),
        failures: [failure('sample/failed-package')],
        terminal: true,
        viewport: { width: 80, height: 10 },
        cursorRows: 1,
      }));

      expect(frame.includes('✕ sample/failed-package · exit 1')).to.eql(true);
      expect(frame.includes('rerun: deno task --cwd ./sample/failed-package test')).to.eql(true);
      expect(frame.includes('... +')).to.eql(true);
      expect(physicalRows(frame, 80) <= 9).to.eql(true);
    });

    it('keeps a narrow live failure actionable after running context', () => {
      const frame = Cli.stripAnsi(formatParallelProgress({
        ...progress(),
        failed: 1,
        pending: 3,
        running: [
          { path: 'sample/running-alpha', elapsed: 65_000 },
          { path: 'sample/running-beta', elapsed: 8_000 },
        ],
        completed: completed(24),
        failures: [failure('sample/failed-package')],
        terminal: true,
        viewport: { width: 40, height: 10 },
        cursorRows: 1,
      }));

      expect(frame.includes('sample/running-alpha')).to.eql(true);
      expect(frame.includes('✕ sample/failed-package · exit 1')).to.eql(true);
      expect(frame.includes('rerun: deno task --cwd')).to.eql(true);
      expect(frame.includes('./sample/failed-package test')).to.eql(true);
      expect(physicalRows(frame, 40) <= 9).to.eql(true);
    });
  });

  describe('retained completion projection', () => {
    it('contracts and re-expands recency without reordering it', () => {
      const args = {
        ...progress(),
        passed: 18,
        completed: completed(18),
        terminal: true,
        cursorRows: 1,
      };
      const render = (height: number) =>
        formatParallelProgress({
          ...args,
          viewport: { width: 100, height },
        });

      const tall = Cli.stripAnsi(render(18));
      const short = Cli.stripAnsi(render(8));
      const restored = Cli.stripAnsi(render(18));

      expect(restored).to.eql(tall);
      expect(tall.includes('sample/pkg-18')).to.eql(true);
      expect(short.includes('sample/pkg-18')).to.eql(false);
      expect(short.includes('... +')).to.eql(true);
      expect(tall.indexOf('sample/pkg-01') < tall.indexOf('sample/pkg-02')).to.eql(true);
    });

    it('keeps completed overflow equal to every retained item at each viewport height', () => {
      const total = 18;
      const args = {
        ...progress(),
        passed: total,
        completed: completed(total),
        terminal: true,
        cursorRows: 1,
      };

      for (const height of [7, 10, 14, 24]) {
        const frame = Cli.stripAnsi(formatParallelProgress({
          ...args,
          viewport: { width: 100, height },
        }));
        const visible = frame.match(/sample\/pkg-\d+/g)?.length ?? 0;
        const hidden = total - visible;

        expect(hidden >= 0).to.eql(true);
        expect(frame.includes('... +')).to.eql(hidden > 0);
        if (hidden > 0) {
          expect(frame.split('\n').at(-1)).to.eql(`  ... +${hidden} more`);
        }
        expect(physicalRows(frame, 100) <= height - 1).to.eql(true);
      }
    });

    it('moves retained completions down one column before flowing right', () => {
      const target: ParallelProgressCompleted = {
        kind: 'failed',
        path: 'sample/pkg-failed',
        elapsed: 1,
      };
      const positions = Array.from({ length: 8 }, (_, newerCount) => {
        const frame = formatParallelProgress({
          ...progress(),
          passed: newerCount,
          failed: 1,
          completed: [...completed(newerCount), target],
          terminal: true,
          viewport: { width: 100, height: 9 },
          cursorRows: 1,
        });
        return completedPosition(frame, target.path, 100);
      });
      const leftColumn = positions[0]?.column;

      expect(positions.map((item) => item.row)).to.eql([0, 1, 2, 3, 4, 0, 1, 2]);
      expect(positions.slice(0, 5).every((item) => item.column === leftColumn)).to.eql(true);
      expect(positions.slice(5).every((item) => item.column > (leftColumn ?? 0))).to.eql(true);
    });

    it('expands final scrollback in completed-then-failure order without overflow', () => {
      const failures = [failure('sample/failure-a'), failure('sample/failure-b')];
      const layout = layoutParallelProgress({
        ...progress(),
        runnableTotal: 14,
        passed: 12,
        failed: 2,
        pending: 0,
        completed: [
          ...completed(12),
          ...failures.map(({ package: item }) => ({
            kind: 'failed' as const,
            path: item.path,
            elapsed: item.elapsed,
          })),
        ],
        failures,
        terminal: true,
        viewport: { width: 100, height: 7 },
        cursorRows: 1,
        complete: true,
      });
      expect(
        layout.frame.includes(c.dim(Cli.Fmt.hr({ width: 100, color: 'red', weight: 'dashed' }))),
      ).to.eql(true);
      const frame = Cli.stripAnsi(layout.frame);
      const lines = frame.split('\n');
      const completedFailures = lines.filter((line) => line.includes('✕  sample/failure-'));
      const separatorIndex = lines.indexOf('┄'.repeat(100));
      const firstFailureAction = frame.indexOf('✕ sample/failure-a');

      expect(lines[0]?.includes('sample/pkg-01')).to.eql(true);
      expect(frame.match(/sample\/pkg-\d+/g)?.length).to.eql(12);
      expect(completedFailures).to.have.length(2);
      expect(frame.includes('... +')).to.eql(false);
      expect(lines.filter((line) => line === '┄'.repeat(100))).to.have.length(1);
      expect(lines[separatorIndex - 1]).to.eql('');
      expect(firstFailureAction > frame.lastIndexOf('✕  sample/failure-')).to.eql(true);
      expect(lines[separatorIndex + 1]).to.eql('✕ sample/failure-a · exit 1');
      expect(firstFailureAction < frame.indexOf('✕ sample/failure-b')).to.eql(true);
      expect(layout.completion.failedPackages).to.eql({ visible: 2, total: 2 });
    });

    it('uses manifest names in final rows and paths only as a defensive fallback', () => {
      const frame = Cli.stripAnsi(formatParallelProgress({
        ...progress(),
        runnableTotal: 2,
        passed: 2,
        pending: 0,
        completed: [
          {
            kind: 'passed',
            name: '@sys/driver-vite',
            path: 'code/sys.driver/driver-vite',
            elapsed: 1,
          },
          { kind: 'passed', path: 'deploy/legacy-package', elapsed: 1 },
        ],
        terminal: true,
        viewport: { width: 100, height: 8 },
        complete: true,
      }));

      expect(frame.includes('@sys/driver-vite')).to.eql(true);
      expect(frame.includes('code/sys.driver/driver-vite')).to.eql(false);
      expect(frame.includes('deploy/legacy-package')).to.eql(true);
    });

    it('uses fewer final columns rather than shortening readable package paths', () => {
      const items: readonly ParallelProgressCompleted[] = ([
        ['code/sys.driver/driver-vite', 388],
        ['code/sys.tools', 764],
        ['code/sys.driver/driver-pi', 288],
        ['code/sys.driver/driver-monaco', 374],
        ['code/sys.driver/driver-prosemirror', 4],
        ['code/sys.driver/driver-automerge', 367],
      ] as const).map(([path, tests]) => ({
        kind: 'passed' as const,
        path,
        elapsed: 60_000,
        testStats: observedStats(tests),
      }));
      const frame = Cli.stripAnsi(formatParallelProgress({
        ...progress(),
        runnableTotal: items.length,
        passed: items.length,
        pending: 0,
        completed: items,
        terminal: true,
        viewport: { width: 160, height: 8 },
        complete: true,
      }));
      const first = frame.split('\n')[0] ?? '';

      expect(frame.includes('…')).to.eql(false);
      expect(frame.includes('┄')).to.eql(false);
      expect(first.includes('code/sys.driver/driver-vite')).to.eql(true);
      expect(first.includes('code/sys.driver/driver-monaco')).to.eql(true);
    });

    it('reprojects wide to narrow to wide without mutating retained order', () => {
      const args = {
        ...progress(),
        passed: 12,
        completed: completed(12),
        terminal: true,
        cursorRows: 1,
      };
      const render = (width: number) =>
        formatParallelProgress({
          ...args,
          viewport: { width, height: 14 },
        });

      const wide = Cli.stripAnsi(render(120));
      const narrow = Cli.stripAnsi(render(40));
      const restored = Cli.stripAnsi(render(120));

      expect(restored).to.eql(wide);
      expect(wide.indexOf('sample/pkg-01') < wide.indexOf('sample/pkg-02')).to.eql(true);
      expect(narrow.indexOf('sample/pkg-01') < narrow.indexOf('sample/pkg-02')).to.eql(true);
      expect(physicalRows(narrow, 40) <= 13).to.eql(true);
    });
  });

  describe('continuation truth', () => {
    it('conserves running truth through every viewport fallback tier', () => {
      const items = running(5);
      const render = (height: number, width = WIDTH) =>
        formatParallelProgress({
          ...progress(),
          pending: 25,
          running: items,
          terminal: true,
          viewport: { width, height },
          cursorRows: 1,
        });

      const contextual = render(8);
      const contextualText = Cli.stripAnsi(contextual);
      expect(contextualText.includes('testing (--schedule=topological)')).to.eql(true);
      expect(contextualText.match(/sample\/running-\d+/g)?.length).to.eql(2);
      expectContinuation(
        findContinuation(contextual),
        '  ... +3 more running',
        c.cyan(c.italic('+3')),
        ' running',
      );

      const gridOnly = render(6);
      const gridOnlyText = Cli.stripAnsi(gridOnly);
      expect(gridOnlyText.includes('testing')).to.eql(false);
      expect(gridOnlyText.match(/sample\/running-\d+/g)?.length).to.eql(1);
      expectContinuation(
        findContinuation(gridOnly),
        '  ... +4 more running',
        c.cyan(c.italic('+4')),
        ' running',
      );

      const summaryOnly = render(5);
      const summaryOnlyText = Cli.stripAnsi(summaryOnly);
      expect(summaryOnlyText.includes('sample/running-')).to.eql(false);
      expectContinuation(
        findContinuation(summaryOnly),
        '  ... +5 more running',
        c.cyan(c.italic('+5')),
        ' running',
      );

      const allVisible = Cli.stripAnsi(render(10));
      expect(allVisible.match(/sample\/running-\d+/g)?.length).to.eql(items.length);
      expect(allVisible.includes('more running')).to.eql(false);

      const omitted = Cli.stripAnsi(render(4));
      expect(omitted.includes('sample/running-')).to.eql(false);
      expect(omitted.includes('more running')).to.eql(false);
      expect(omitted.includes('running 5')).to.eql(true);

      for (
        const item of [
          { height: 8, visible: 2, hidden: 3 },
          { height: 6, visible: 1, hidden: 4 },
          { height: 5, visible: 0, hidden: 5 },
        ]
      ) {
        const frame = Cli.stripAnsi(render(item.height));
        const visible = frame.match(/sample\/running-\d+/g)?.length ?? 0;
        expect(visible).to.eql(item.visible);
        expect(frame.includes(`... +${item.hidden} more running`)).to.eql(true);
        expect(visible + item.hidden).to.eql(items.length);
        expect(physicalRows(frame, WIDTH) <= item.height - 1).to.eql(true);
      }

      const wrapped = render(6, 20);
      expectContinuation(
        findContinuation(wrapped),
        '  ... +5 more running',
        c.cyan(c.italic('+5')),
        ' running',
      );
      expect(physicalRows(wrapped, 20) <= 5).to.eql(true);
    });

    it('derives exact completed continuation color from the hidden set only', () => {
      const cases = [
        {
          visible: 'passed' as const,
          hidden: ['passed', 'passed'] as const,
          count: c.green(c.italic('+2')),
        },
        {
          visible: 'failed' as const,
          hidden: ['passed', 'passed'] as const,
          count: c.green(c.italic('+2')),
        },
        {
          visible: 'failed' as const,
          hidden: ['passed', 'blocked'] as const,
          count: c.yellow(c.italic('+2')),
        },
        {
          visible: 'failed' as const,
          hidden: ['passed', 'skipped'] as const,
          count: c.yellow(c.italic('+2')),
        },
        {
          visible: 'blocked' as const,
          hidden: ['failed', 'passed'] as const,
          count: c.red(c.italic('+2')),
        },
      ];

      for (const item of cases) {
        const frame = completedOverflowFrame(item.hidden, item.visible);
        const visible = Cli.stripAnsi(frame).match(/sample\/pkg-\d+/g)?.length ?? 0;
        expect(visible + item.hidden.length).to.eql(
          VISIBLE_COMPLETED_FOR_WIDTH_100 + item.hidden.length,
        );
        expectContinuation(findContinuation(frame), '  ... +2 more', item.count);
      }

      const allVisible = formatParallelProgress({
        ...progress(),
        passed: 2,
        pending: 28,
        completed: completed(2),
        terminal: false,
        width: 100,
      });
      expect(findContinuation(allVisible)).to.eql(undefined);
    });

    it('renders exact singular and plural failed-package continuation summaries', () => {
      for (const total of [2, 3]) {
        const failures = Array.from(
          { length: total },
          (_, index) => failure(`sample/failure-${index + 1}`),
        );
        const layout = layoutParallelProgress({
          ...progress(),
          failed: failures.length,
          failures,
          terminal: true,
          viewport: { width: 80, height: 7 },
          cursorRows: 1,
        });
        const rendered = layout.frame;
        const frame = Cli.stripAnsi(rendered);
        const hidden = total - 1;
        const qualifier = ` failed ${hidden === 1 ? 'package' : 'packages'}`;

        expect(frame.split('\n').filter((line) => line.includes('✕ sample/failure-')).length).to
          .eql(
            1,
          );
        expectContinuation(
          findContinuation(rendered),
          `  ... +${hidden} more${qualifier}`,
          c.red(c.italic(`+${hidden}`)),
          qualifier,
        );
        expect(layout.completion.failedPackages).to.eql({ visible: 1, total });
        expect(physicalRows(frame, 80) <= 6).to.eql(true);
      }

      const allVisible = layoutParallelProgress({
        ...progress(),
        failed: 1,
        failures: [failure('sample/failure-only')],
        terminal: true,
        viewport: { width: 80, height: 7 },
        cursorRows: 1,
      });
      expect(Cli.stripAnsi(allVisible.frame).includes('sample/failure-only')).to.eql(true);
      expect(findContinuation(allVisible.frame)).to.eql(undefined);
      expect(allVisible.completion.failedPackages).to.eql({ visible: 1, total: 1 });
    });
  });

  describe('degenerate viewports', () => {
    it('retains omitted failed-action truth when no failure row fits', () => {
      const failures = [failure('sample/failure-a'), failure('sample/failure-b')];
      const layout = layoutParallelProgress({
        ...progress(),
        failed: failures.length,
        failures,
        terminal: true,
        viewport: { width: 40, height: 2 },
        cursorRows: 1,
      });

      expect(layout.completion.failedPackages).to.eql({ visible: 0, total: 2 });
      expect(Cli.stripAnsi(layout.frame).includes('sample/failure-')).to.eql(false);
    });

    it('stays physically bounded at tiny dimensions', () => {
      for (const width of [0, 1, 8, 20, 40]) {
        for (const height of [0, 1, 2, 3, 5]) {
          const frame = formatParallelProgress({
            ...progress(),
            passed: 2,
            failed: 1,
            running: [{ path: 'sample/a-very-long-running-package', elapsed: 60_000 }],
            completed: completed(8),
            failures: [failure('sample/a-very-long-failed-package')],
            terminal: true,
            viewport: { width, height },
            cursorRows: 1,
          });

          expect(physicalRows(frame, width) <= Math.max(0, height - 1)).to.eql(true);
        }
      }
    });
  });
});

function progress() {
  return {
    runnableTotal: 30,
    passed: 0,
    skipped: 0,
    blocked: 0,
    blockedRunnable: 0,
    failed: 0,
    pending: 30,
    running: [] as const,
  };
}

function completed(length: number): readonly ParallelProgressCompleted[] {
  return Array.from({ length }, (_, index) => ({
    kind: 'passed' as const,
    path: `sample/pkg-${String(index + 1).padStart(2, '0')}`,
    elapsed: 1 as t.Msecs,
  }));
}

function completedOverflowFrame(
  hiddenKinds: readonly CompletedKind[],
  visibleKind: CompletedKind,
) {
  const kinds = [
    ...Array.from({ length: VISIBLE_COMPLETED_FOR_WIDTH_100 }, () => visibleKind),
    ...hiddenKinds,
  ];
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
    completed: kinds.map((kind, index) => ({
      kind,
      path: `sample/pkg-${String(index + 1).padStart(2, '0')}`,
      elapsed: 1,
    })),
    terminal: false,
    width: 100,
  });
}

function running(length: number) {
  return Array.from({ length }, (_, index) => ({
    path: `sample/running-${String(index + 1).padStart(2, '0')}`,
    elapsed: 65_000 as t.Msecs,
  }));
}

function countKind(kinds: readonly CompletedKind[], kind: CompletedKind) {
  return kinds.filter((value) => value === kind).length;
}

function observedStats(tests: number): t.WorkspaceRun.Test.Stats.Observed {
  return {
    kind: 'observed',
    capability: 'deno:junit',
    source: 'junit',
    tests,
    failed: 0,
    failures: 0,
    errors: 0,
    skipped: 0,
    failedCases: [],
    warnings: [],
  };
}

function failure(path: string): FailedPackage {
  return {
    package: {
      kind: 'ran',
      name: path,
      path,
      code: 1,
      success: false,
      signal: null,
      elapsed: 1,
    },
    rerun: { cwd: path, task: 'test' },
  };
}

function findContinuation(frame: string) {
  return frame.split('\n').find((line) => Cli.stripAnsi(line).includes('... +'));
}

function expectContinuation(
  actual: string | undefined,
  text: string,
  count: string,
  qualifier = '',
) {
  expect(actual).to.eql(overflowLine(count, qualifier));
  expect(Cli.stripAnsi(actual ?? '')).to.eql(text);
  expect(Cli.Fmt.Text.Width.measure(actual ?? '')).to.eql(Cli.Fmt.Text.Width.measure(text));
}

function overflowLine(count: string, qualifier = '') {
  return `  ${c.gray(c.italic('... '))}${count}${c.gray(c.italic(` more${qualifier}`))}`;
}

function completedPosition(frame: string, path: string, width: number) {
  const rows = Cli.stripAnsi(frame).split('\n');
  const rule = rows.findIndex((line) => line === '━'.repeat(width));
  const row = rows.findIndex((line, index) => index > rule && line.includes(path));
  return { row: row - rule - 1, column: rows[row]?.indexOf(path) ?? -1 };
}

function physicalRows(input: string, width: number) {
  if (!input || width <= 0) return 0;
  return Cli.stripAnsi(input).split('\n').reduce((total, line) => {
    const cells = Cli.Fmt.Text.Width.measure(line);
    return total + Math.max(1, Math.ceil(cells / width));
  }, 0);
}

function expectRowsCellSafe(input: string, width: number) {
  for (const line of input.split('\n')) {
    const cells = Cli.Fmt.Text.Width.measure(line);
    const isExactRerun = Cli.stripAnsi(line).trimStart().startsWith('rerun:');
    expect(cells <= width || isExactRerun).to.eql(true);
  }
}
