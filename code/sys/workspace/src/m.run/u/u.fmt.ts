import { c, Cli, Str, type t, Time } from '../common.ts';
import { type FailedPackage, projectFailedPackages } from './u.failure.ts';

type TestStatsSummary = {
  observed: number;
  unavailable: number;
  unsupported: number;
  total: number;
  tests: number;
  failed: number;
};

type OutputExcerpt = {
  readonly label: 'error' | 'stderr' | 'stdout';
  readonly text: string;
};

type StringBuilder = ReturnType<typeof Str.builder>;

const SUMMARY_REPEAT_MIN_PACKAGES = 11;
const INTRO_LABEL_WIDTH = 15;
const INTRO_MIN_WIDTH = 40;
const INTRO_FALLBACK_WIDTH = 100;
const INTRO_SEPARATOR = '  →  ';
const HANDOFF_CASE_LIMIT = 3;
const HANDOFF_FALLBACK_WIDTH = 100;
const HANDOFF_MIN_WIDTH = 40;

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

  handoff(result, options) {
    return formatHandoff(result, options);
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

export type FailedPackageIndexOptions = {
  terminal?: boolean;
  width?: number;
};

/** Format the shared minimal failed-package index used by live and compact output. */
export function formatFailedPackageIndex(
  failures: readonly FailedPackage[],
  options: FailedPackageIndexOptions = {},
): string {
  const width = Cli.Fmt.Text.Width.fit({
    width: options.width,
    terminal: options.terminal,
    fallbackWidth: HANDOFF_FALLBACK_WIDTH,
    minWidth: HANDOFF_MIN_WIDTH,
  });
  return failures
    .map((failure) => wrangle.formatFailedPackageItem(failure, width, options.terminal))
    .join('\n\n');
}

/** Format one deterministic final run handoff. */
function formatHandoff(
  result: t.WorkspaceRun.Result,
  options: t.WorkspaceRun.Fmt.HandoffOptions,
): string {
  const width = Cli.Fmt.Text.Width.fit({
    width: options.width,
    terminal: options.terminal,
    fallbackWidth: HANDOFF_FALLBACK_WIDTH,
    minWidth: HANDOFF_MIN_WIDTH,
  });
  const failures = projectFailedPackages(result);
  const str = Str.builder();

  str.line(wrangle.handoffTitle(result));
  wrangle.appendWrapped(str, '', wrangle.handoffSummary(result), width);

  if (failures.length > 0) {
    str.line('');
    str.line(c.red(`${failures.length} failed ${Str.plural(failures.length, 'package')}`));
    str.line('');
    str.line(formatFailedPackageIndex(failures, options));
  }

  const compact = Str.trimEdgeNewlines(String(str));
  if (options.detail === 'compact') return compact;

  const details = wrangle.formatFailureDetails(failures, width, options.terminal);
  const output = formatFailedOutput(result);
  return [compact, details, output].filter(Boolean).join('\n\n');
}

/** Format grouped buffered output for failed package tasks. */
function formatFailedOutput(result: t.WorkspaceRun.Result): string {
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

const wrangle = {
  handoffTitle(result: t.WorkspaceRun.Result) {
    const noun = wrangle.taskNoun(result.task);
    const elapsed = Time.duration(result.elapsed).toString();
    return result.ok
      ? `${c.green('Workspace')} ${c.cyan(noun)} ${c.green(`done in ${elapsed}`)}`
      : `${c.red('Workspace')} ${c.cyan(noun)} ${c.red(`failed in ${elapsed}`)}`;
  },

  handoffSummary(result: t.WorkspaceRun.Result) {
    const counts = wrangle.counts(result.packages);
    const parts: string[] = [];

    if (result.ok) {
      parts.push(`${wrangle.displayNumber(counts.ran)} ${Str.plural(counts.ran, 'package')}`);
    } else {
      parts.push(`${wrangle.displayNumber(counts.ran)} ran`);
      parts.push(`${wrangle.displayNumber(counts.failed)} failed`);
    }
    if (counts.blocked > 0) parts.push(`${wrangle.displayNumber(counts.blocked)} blocked`);
    if (counts.skipped > 0) parts.push(`${wrangle.displayNumber(counts.skipped)} skipped`);

    const stats = wrangle.testStatsSummary(result);
    if (stats) {
      if (stats.observed > 0) {
        parts.push(`${wrangle.displayNumber(stats.tests)} ${Str.plural(stats.tests, 'test')}`);
      }
      parts.push(
        `${wrangle.displayNumber(stats.observed)}/${wrangle.displayNumber(stats.total)} ${
          Str.plural(stats.total, 'report')
        } observed`,
      );
      if (stats.unavailable > 0) {
        parts.push(`${wrangle.displayNumber(stats.unavailable)} unavailable`);
      }
      if (stats.unsupported > 0) {
        parts.push(`${wrangle.displayNumber(stats.unsupported)} unsupported`);
      }
    }

    return parts.join(c.gray(' · '));
  },

  formatFailedPackageItem(
    failure: FailedPackage,
    width: number,
    terminal?: boolean,
  ) {
    const str = Str.builder();
    str.line(wrangle.failureHeader(failure, width, terminal));
    wrangle.appendWrapped(
      str,
      `  ${c.gray('rerun:')} `,
      c.cyan(wrangle.rerunCommand(failure)),
      width,
    );
    return Str.trimEdgeNewlines(String(str));
  },

  failureHeader(
    failure: FailedPackage,
    width: number,
    terminal?: boolean,
  ) {
    const item = failure.package;
    const fact = wrangle.failureFact(failure);
    const suffix = ` · ${fact}`;
    const prefix = '✕ ';
    const available = width > 0
      ? width - Cli.Fmt.Text.Width.measure(prefix) - Cli.Fmt.Text.Width.measure(suffix)
      : 0;
    if (available >= 8 || width <= 0) {
      const path = available >= 8
        ? Cli.Fmt.Path.tty(item.path, {
          fit: 'width',
          width: available,
          min: 8,
          relative: 'bare',
          terminal,
        })
        : item.path;
      return `${c.red('✕')} ${c.white(path)}${c.gray(suffix)}`;
    }

    const path = Cli.Fmt.Path.tty(item.path, {
      fit: 'width',
      width: width - Cli.Fmt.Text.Width.measure(prefix),
      min: 8,
      relative: 'bare',
      terminal,
    });
    const details = Cli.Fmt.Text.Wrap.text(fact, {
      width,
      indent: 2,
      continuationIndent: 2,
      preserve: 'none',
    });
    return `${c.red('✕')} ${c.white(path)}\n${c.gray(details)}`;
  },

  failureFact(failure: FailedPackage) {
    const item = failure.package;
    const stats = failure.rerun.task === 'test' ? item.testStats : undefined;
    if (stats?.kind === 'observed') {
      const failed = wrangle.observedFailureCount(stats);
      if (failed > 0) {
        const count = wrangle.displayNumber(failed);
        return `${count} failed ${Str.plural(failed, 'test')}`;
      }
    }
    return item.signal ? `signal ${item.signal}` : `exit ${item.code}`;
  },

  rerunCommand(failure: FailedPackage) {
    return `deno task --cwd ./${failure.rerun.cwd} ${failure.rerun.task}`;
  },

  formatFailureDetails(
    failures: readonly FailedPackage[],
    width: number,
    terminal?: boolean,
  ) {
    const str = Str.builder();
    let hasDetails = false;

    for (const failure of failures) {
      const item = failure.package;
      const stats = failure.rerun.task === 'test' ? item.testStats : undefined;
      const cases = stats?.kind === 'observed' ? stats.failedCases : [];
      const excerpt = cases.length === 0 ? wrangle.outputExcerpt(item) : undefined;
      if (cases.length === 0 && !excerpt) continue;

      if (!hasDetails) str.line(c.red('Failure details'));
      hasDetails = true;
      str.line('');
      str.line(wrangle.failureDetailHeader(item.path, width, terminal));

      if (cases.length > 0) {
        const visible = cases.slice(0, HANDOFF_CASE_LIMIT);
        visible.forEach((failedCase) => wrangle.appendFailedCase(str, failedCase, width));
        const total = stats?.kind === 'observed'
          ? wrangle.observedFailureCount(stats)
          : cases.length;
        const hidden = total - visible.length;
        if (hidden > 0) {
          const count = wrangle.displayNumber(hidden);
          str.line(c.gray(`  ...and ${count} more failed ${Str.plural(hidden, 'test')}`));
        }
      } else if (excerpt) {
        wrangle.appendExcerpt(str, excerpt, width);
      }
    }

    return hasDetails ? Str.trimEdgeNewlines(String(str)) : '';
  },

  failureDetailHeader(path: t.StringPath, width: number, terminal?: boolean) {
    const prefix = '✕ ';
    const fitted = Cli.Fmt.Path.tty(path, {
      fit: 'width',
      width: width - Cli.Fmt.Text.Width.measure(prefix),
      min: 8,
      relative: 'bare',
      terminal,
    });
    return `${c.red('✕')} ${c.white(fitted)}`;
  },

  appendFailedCase(
    str: StringBuilder,
    failedCase: t.WorkspaceRun.Test.Stats.FailedCase,
    width: number,
  ) {
    wrangle.appendWrapped(str, `  ${c.gray('•')} `, wrangle.caseIdentity(failedCase), width);
    const message = wrangle.firstMeaningfulLine(failedCase.message);
    if (message) wrangle.appendWrapped(str, '    ', message, width);
  },

  caseIdentity(failedCase: t.WorkspaceRun.Test.Stats.FailedCase) {
    const name = wrangle.firstMeaningfulLine(failedCase.name) ?? '';
    const className = wrangle.firstMeaningfulLine(failedCase.className) ?? '';
    if (!className) return name || `test ${failedCase.kind}`;
    if (!name) return className;
    if (
      name === className ||
      name.startsWith(`${className} `) ||
      name.startsWith(`${className} →`)
    ) {
      return name;
    }
    return `${className} → ${name}`;
  },

  appendExcerpt(
    str: StringBuilder,
    excerpt: OutputExcerpt,
    width: number,
  ) {
    const label = `output evidence (${excerpt.label})`;
    const text = excerpt.text ? `${label}: ${excerpt.text}` : `${label}:`;
    wrangle.appendWrapped(str, '  ', text, width);
  },

  outputExcerpt(item: t.WorkspaceRun.Package.Ran): OutputExcerpt | undefined {
    const stderr = wrangle.diagnosticLines(item.stderr);
    for (const line of stderr) {
      const match = /^error:\s*(.*)$/i.exec(line);
      if (match) return { label: 'error', text: match[1]?.trim() ?? '' };
    }
    if (stderr[0]) return { label: 'stderr', text: stderr[0] };

    const stdout = wrangle.diagnosticLines(item.stdout);
    return stdout[0] ? { label: 'stdout', text: stdout[0] } : undefined;
  },

  diagnosticLines(value?: string) {
    return Cli.stripAnsi(value ?? '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  },

  firstMeaningfulLine(value?: string) {
    return wrangle.diagnosticLines(value)[0];
  },

  appendWrapped(
    str: StringBuilder,
    prefix: string,
    text: string,
    width: number,
  ) {
    if (width <= 0) {
      str.line(`${prefix}${text}`);
      return;
    }

    const indent = Cli.Fmt.Text.Width.measure(prefix);
    const lines = Cli.Fmt.Text.Wrap.lines(text, {
      width,
      indent,
      continuationIndent: indent,
      preserve: 'none',
    });
    const first = lines[0];
    if (!first) return;
    str.line(`${prefix}${first.trimStart()}`);
    lines.slice(1).forEach((line) => str.line(line));
  },

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

  observedFailureCount(stats: t.WorkspaceRun.Test.Stats.Observed) {
    return Math.max(stats.failed, stats.failedCases.length);
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

  indentedTable(table: t.Cli.Table.Instance) {
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

  appendOutput(str: StringBuilder, label: 'stdout' | 'stderr', value?: string) {
    const text = Str.trimEdgeNewlines(value ?? '');
    if (!text.trim()) return;

    str.line(`  ${c.gray(label)}`);
    for (const line of text.split('\n')) {
      str.line(`    ${line}`);
    }
  },
} as const;
