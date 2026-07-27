import { c, Cli, Str, type t, Time } from '../common.ts';
import { projectFailedPackages } from './u.failure.ts';

const SUMMARY_REPEAT_MIN_PACKAGES = 11;
const INTRO_LABEL_WIDTH = 15;
const INTRO_MIN_WIDTH = 40;
const INTRO_FALLBACK_WIDTH = 100;
const INTRO_SEPARATOR = '  →  ';

export const Fmt: t.WorkspaceRun.Fmt.Lib = {
  introLine(label, message, options) {
    const width = Cli.Fmt.Text.Width.fit({
      width: options?.width,
      terminal: options?.terminal,
      fallbackWidth: INTRO_FALLBACK_WIDTH,
      minWidth: INTRO_MIN_WIDTH,
    });
    const left = Cli.Fmt.Text.Width.padEnd(label, INTRO_LABEL_WIDTH);
    const prefix = `${left}${INTRO_SEPARATOR}`;
    const line = `${prefix}${message}`;
    if (width <= 0 || Cli.Fmt.Text.Width.measure(line) <= width) return c.gray(line);

    const continuationIndent = Cli.Fmt.Text.Width.measure(prefix);
    const messageLines = Cli.Fmt.Text.Wrap.lines(message, {
      width,
      indent: continuationIndent,
      continuationIndent,
      preserve: 'none',
    });
    const first = messageLines[0] ?? '';
    const rest = messageLines.slice(1);
    const lines = [`${prefix}${first.trimStart()}`];
    rest.forEach((item) => lines.push(item));
    return c.gray(lines.join('\n'));
  },

  result(result) {
    const rows = Cli.table([]);
    const counts = wrangle.counts(result.packages);
    const noun = wrangle.taskNoun(result.task);
    const status = result.ok ? c.green('success') : c.red('failed');
    const color = result.ok ? 'green' : 'red';
    const nounText = c.cyan(noun);
    const title = result.ok
      ? `${c.green('Workspace')} ${nounText} ${
        c.green(`done in ${Time.duration(result.elapsed).toString()}`)
      }`
      : `${c.red('Workspace')} ${nounText} ${
        c.red(`failed in ${Time.duration(result.elapsed).toString()}`)
      }`;

    rows.push([c.gray('status'), status]);
    rows.push([c.gray('task'), c.cyan(result.task)]);
    rows.push([
      c.gray('packages ran'),
      counts.ran > 0 ? c.white(wrangle.displayNumber(counts.ran)) : c.gray('0'),
    ]);
    rows.push([
      c.gray('packages skipped'),
      counts.skipped > 0 ? c.yellow(wrangle.displayNumber(counts.skipped)) : c.gray('0'),
    ]);
    if (counts.blocked > 0) {
      rows.push([c.gray('packages blocked'), c.yellow(wrangle.displayNumber(counts.blocked))]);
    }
    rows.push([
      c.gray('packages failed'),
      counts.failed > 0 ? c.red(wrangle.displayNumber(counts.failed)) : c.gray('0'),
    ]);

    const stats = wrangle.testStatsSummary(result);
    if (stats) {
      rows.push([c.gray('test cases'), wrangle.observedCount(stats.tests, stats.observed)]);
      rows.push([
        c.gray('test failures'),
        wrangle.observedCount(stats.failed, stats.observed, 'red'),
      ]);
      rows.push([c.gray('reports'), wrangle.reportsSummary(stats)]);
    }

    const summary = wrangle.indentedTable(rows);
    const str = Str.builder();
    str.line(title);
    str.line(Cli.Fmt.hr(color));
    str.line('');
    str.line(summary);

    const packages = Fmt.packages(result);
    if (packages) {
      str.line('');
      str.line(packages);
    }
    if (result.packages.length >= SUMMARY_REPEAT_MIN_PACKAGES) {
      str.line('');
      str.line(summary);
      str.line('');
    }
    str.line(Cli.Fmt.hr(color));

    return Str.trimEdgeNewlines(String(str));
  },

  packages(result) {
    const rows = Cli.table([]);
    const showStats = wrangle.hasTestStats(result);
    rows.push([
      c.gray('package'),
      c.gray('status'),
      c.gray('elapsed'),
      ...(showStats ? [c.gray('tests'), c.gray('failed')] : []),
    ]);

    for (const item of result.packages) {
      if (item.kind === 'skipped') {
        rows.push([
          c.gray(item.path),
          c.yellow('skipped'),
          c.gray('—'),
          ...(showStats ? [c.gray('—'), c.gray('—')] : []),
        ]);
        continue;
      }
      if (item.kind === 'blocked') {
        rows.push([
          c.gray(item.path),
          c.yellow('blocked'),
          c.gray('—'),
          ...(showStats ? [c.gray('—'), c.gray('—')] : []),
        ]);
        continue;
      }

      if (wrangle.isQuietUnsupportedReport(item, showStats)) {
        rows.push([c.gray(item.path)]);
        continue;
      }

      rows.push([
        c.white(item.path),
        item.success ? c.green('ok') : c.red('failed'),
        c.white(Time.duration(item.elapsed).toString()),
        ...(showStats ? wrangle.packageStatsCells(item) : []),
      ]);
    }

    return Str.trimEdgeNewlines(String(rows));
  },
};

/** Format one aligned, low-noise runner intro line. */
export function formatIntroLine(
  label: string,
  message: string,
  options?: t.WorkspaceRun.Fmt.IntroLineOptions,
): string {
  return Fmt.introLine(label, message, options);
}

/** Format grouped buffered output for failed package tasks. */
export function formatFailedOutput(result: t.WorkspaceRun.Result): string {
  const failed = projectFailedPackages(result).filter(({ package: item }) => {
    return wrangle.hasOutput(item);
  });
  if (failed.length === 0) return '';

  const str = Str.builder();
  str.line(c.red('Failed package output'));

  for (const failure of failed) {
    const item = failure.package;
    const status = item.signal ? `signal ${item.signal}` : `exit ${item.code}`;
    str.line('');
    str.line(`${c.red('✕')} ${c.white(item.path)} ${c.gray(status)}`);
    wrangle.appendOutput(str, 'stdout', item.stdout);
    wrangle.appendOutput(str, 'stderr', item.stderr);
  }

  return Str.trimEdgeNewlines(String(str));
}

type TestStatsSummary = {
  observed: number;
  unavailable: number;
  unsupported: number;
  total: number;
  tests: number;
  failed: number;
};

const wrangle = {
  counts(packages: readonly t.WorkspaceRun.Package.Result[]) {
    return packages.reduce(
      (acc, item) => {
        if (item.kind === 'skipped') return { ...acc, skipped: acc.skipped + 1 };
        if (item.kind === 'blocked') return { ...acc, blocked: acc.blocked + 1 };
        return item.success
          ? { ...acc, ran: acc.ran + 1 }
          : { ...acc, ran: acc.ran + 1, failed: acc.failed + 1 };
      },
      { ran: 0, skipped: 0, blocked: 0, failed: 0 },
    );
  },

  taskNoun(task: t.WorkspaceRun.Task) {
    if (task === 'test') return 'tests';
    if (task === 'dry') return 'dry runs';
    return 'checks';
  },

  hasTestStats(result: t.WorkspaceRun.Result) {
    return result.task === 'test' && result.packages.some((item) => {
      return item.kind === 'ran' && item.testStats !== undefined;
    });
  },

  testStatsSummary(result: t.WorkspaceRun.Result): TestStatsSummary | undefined {
    if (!wrangle.hasTestStats(result)) return undefined;

    const summary: TestStatsSummary = {
      observed: 0,
      unavailable: 0,
      unsupported: 0,
      total: 0,
      tests: 0,
      failed: 0,
    };

    for (const item of result.packages) {
      if (item.kind !== 'ran' || !item.testStats) continue;
      summary.total += 1;
      if (item.testStats.kind === 'observed') {
        summary.observed += 1;
        summary.tests += item.testStats.tests;
        summary.failed += item.testStats.failed;
      } else if (item.testStats.kind === 'unavailable') {
        summary.unavailable += 1;
      } else {
        summary.unsupported += 1;
      }
    }

    return summary;
  },

  observedCount(value: number, observed: number, color?: 'red') {
    if (observed < 1) return c.gray('—');
    if (color === 'red' && value > 0) return c.red(wrangle.displayNumber(value));
    return value > 0 ? c.white(wrangle.displayNumber(value)) : c.gray('0');
  },

  reportsSummary(stats: TestStatsSummary) {
    const parts = [
      `${wrangle.displayNumber(stats.observed)}/${wrangle.displayNumber(stats.total)} observed`,
    ];
    if (stats.unavailable > 0) {
      parts.push(`${wrangle.displayNumber(stats.unavailable)} unavailable`);
    }
    if (stats.unsupported > 0) {
      parts.push(`${wrangle.displayNumber(stats.unsupported)} unsupported`);
    }
    const text = parts.join(', ');
    if (stats.unavailable > 0) return c.yellow(text);
    if (stats.unsupported > 0) return c.gray(text);
    return c.green(text);
  },

  packageStatsCells(item: t.WorkspaceRun.Package.Ran) {
    const stats = item.testStats;
    if (stats?.kind !== 'observed') return [c.gray('—'), c.gray('—')];
    return [
      stats.tests > 0 ? c.white(wrangle.displayNumber(stats.tests)) : c.gray('0'),
      stats.failed > 0 ? c.red(wrangle.displayNumber(stats.failed)) : c.gray('0'),
    ];
  },

  isQuietUnsupportedReport(item: t.WorkspaceRun.Package.Ran, showStats: boolean) {
    return showStats && item.success && item.testStats?.kind === 'unsupported';
  },

  displayNumber(value: number) {
    return value.toLocaleString('en-US');
  },

  indentedTable(table: ReturnType<typeof Cli.table>) {
    const lines = String(table).split('\n');
    while (lines[0]?.trim() === '') lines.shift();
    while (lines.at(-1)?.trim() === '') lines.pop();

    return lines
      .map((line) => (line.trim() ? ` ${line}` : line))
      .join('\n');
  },

  hasOutput(item: t.WorkspaceRun.Package.Ran) {
    return Boolean(item.stdout?.trim() || item.stderr?.trim());
  },

  appendOutput(str: ReturnType<typeof Str.builder>, label: 'stdout' | 'stderr', value?: string) {
    const text = Str.trimEdgeNewlines(value ?? '');
    if (!text.trim()) return;

    str.line(`  ${c.gray(label)}`);
    for (const line of text.split('\n')) {
      str.line(`    ${line}`);
    }
  },
} as const;
