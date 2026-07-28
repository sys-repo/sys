import { c, Cli, Num, Str, type t } from '../common.ts';
import { type FailedPackage, projectFailedPackages } from '../u/u.failure.ts';
import { packageLabel } from '../u/u.identity.ts';
import { formatContinuationSummary } from './u.continuation.ts';
import { observedFailureCount } from './u.stats.ts';
import { appendWrapped, displayNumber, fitHandoffWidth } from './u.text.ts';

export type FailedPackageIndexOptions = {
  terminal?: boolean;
  width?: number;
};

type OutputExcerpt = {
  readonly label: 'error' | 'stderr' | 'stdout';
  readonly text: string;
};

const HANDOFF_CASE_LIMIT = 3;

/** Format the shared minimal failed-package index used by live and compact output. */
export function formatFailedPackageIndex(
  failures: readonly FailedPackage[],
  options: FailedPackageIndexOptions = {},
): string {
  const width = fitHandoffWidth(options);
  return failures
    .map((failure) => formatFailedPackageItem(failure, width))
    .join('\n\n');
}

/** Format full structured or conservative failure evidence. */
export function formatFailureDetails(
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
    const excerpt = cases.length === 0 ? outputExcerpt(item) : undefined;
    if (cases.length === 0 && !excerpt) continue;

    if (!hasDetails) str.line(c.red('Failure details'));
    hasDetails = true;
    str.line('');
    str.line(failureDetailHeader(item.path, width, terminal));

    if (cases.length > 0) {
      const visible = cases.slice(0, HANDOFF_CASE_LIMIT);
      visible.forEach((failedCase) => appendFailedCase(str, failedCase, width));
      const total = stats?.kind === 'observed' ? observedFailureCount(stats) : cases.length;
      const hidden = total - visible.length;
      if (hidden > 0) {
        const count = displayNumber(hidden);
        const qualifier = `failed ${Str.plural(hidden, 'test')}`;
        str.line(`  ${formatContinuationSummary(count, 'red', qualifier)}`);
      }
    } else if (excerpt) {
      appendExcerpt(str, excerpt, width);
    }
  }

  return hasDetails ? Str.trimEdgeNewlines(String(str)) : '';
}

/** Format grouped buffered output for failed package tasks. */
export function formatFailedOutput(result: t.WorkspaceRun.Result): string {
  const failed = projectFailedPackages(result).filter(({ package: item }) => {
    return hasOutput(item);
  });
  if (failed.length === 0) return '';

  const str = Str.builder();
  str.line(c.red('Failed package output'));

  for (const failure of failed) {
    const item = failure.package;
    const status = item.signal ? `signal ${item.signal}` : `exit ${item.code}`;
    str.line('');
    str.line(`${c.red('✕')} ${c.white(item.path)} ${c.gray(status)}`);
    appendOutput(str, 'stdout', item.stdout);
    appendOutput(str, 'stderr', item.stderr);
  }

  return Str.trimEdgeNewlines(String(str));
}

function formatFailedPackageItem(failure: FailedPackage, width: number) {
  const str = Str.builder();
  str.line(failureHeader(failure, width));
  appendWrapped(
    str,
    `  ${c.gray('rerun:')} `,
    c.cyan(rerunCommand(failure)),
    width,
  );
  return Str.trimEdgeNewlines(String(str));
}

function failureHeader(failure: FailedPackage, width: number) {
  const label = packageLabel(failure.package);
  const fact = failureFact(failure);
  const suffix = ` · ${fact}`;
  const prefix = '✕ ';
  const available = width > 0
    ? width - Cli.Fmt.Text.Width.measure(prefix) - Cli.Fmt.Text.Width.measure(suffix)
    : 0;
  if (available >= 8 || width <= 0) {
    const fitted = available >= 8 ? Cli.Fmt.Text.ellipsize(label, available) : label;
    return `${c.red('✕')} ${c.white(fitted)}${c.gray(suffix)}`;
  }

  const labelWidth = Num.clamp(0, width, width - Cli.Fmt.Text.Width.measure(prefix));
  const fitted = Cli.Fmt.Text.ellipsize(label, labelWidth);
  const details = Cli.Fmt.Text.Wrap.text(fact, {
    width,
    indent: 2,
    continuationIndent: 2,
    preserve: 'none',
  });
  return `${c.red('✕')} ${c.white(fitted)}\n${c.gray(details)}`;
}

function failureFact(failure: FailedPackage) {
  const item = failure.package;
  const stats = failure.rerun.task === 'test' ? item.testStats : undefined;
  if (stats?.kind === 'observed') {
    const failed = observedFailureCount(stats);
    if (failed > 0) {
      const count = displayNumber(failed);
      return `${count} failed ${Str.plural(failed, 'test')}`;
    }
  }
  return item.signal ? `signal ${item.signal}` : `exit ${item.code}`;
}

function rerunCommand(failure: FailedPackage) {
  return `deno task --cwd ./${failure.rerun.cwd} ${failure.rerun.task}`;
}

function failureDetailHeader(path: t.StringPath, width: number, terminal?: boolean) {
  const prefix = '✕ ';
  const fitted = Cli.Fmt.Path.tty(path, {
    fit: 'width',
    width: width - Cli.Fmt.Text.Width.measure(prefix),
    min: 8,
    relative: 'bare',
    terminal,
  });
  return `${c.red('✕')} ${c.white(fitted)}`;
}

function appendFailedCase(
  str: t.Str.Builder,
  failedCase: t.WorkspaceRun.Test.Stats.FailedCase,
  width: number,
) {
  appendWrapped(str, `  ${c.gray('•')} `, caseIdentity(failedCase), width);
  const message = firstMeaningfulLine(failedCase.message);
  if (message) appendWrapped(str, '    ', message, width);
}

function caseIdentity(failedCase: t.WorkspaceRun.Test.Stats.FailedCase) {
  const name = firstMeaningfulLine(failedCase.name) ?? '';
  const className = firstMeaningfulLine(failedCase.className) ?? '';
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
}

function appendExcerpt(
  str: t.Str.Builder,
  excerpt: OutputExcerpt,
  width: number,
) {
  const label = `output evidence (${excerpt.label})`;
  const text = excerpt.text ? `${label}: ${excerpt.text}` : `${label}:`;
  appendWrapped(str, '  ', text, width);
}

function outputExcerpt(item: t.WorkspaceRun.Package.Ran): OutputExcerpt | undefined {
  const stderr = diagnosticLines(item.stderr);
  for (const line of stderr) {
    const match = /^error:\s*(.*)$/i.exec(line);
    if (match) return { label: 'error', text: match[1]?.trim() ?? '' };
  }
  if (stderr[0]) return { label: 'stderr', text: stderr[0] };

  const stdout = diagnosticLines(item.stdout);
  return stdout[0] ? { label: 'stdout', text: stdout[0] } : undefined;
}

function diagnosticLines(value?: string) {
  return Cli.stripAnsi(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function firstMeaningfulLine(value?: string) {
  return diagnosticLines(value)[0];
}

function hasOutput(item: t.WorkspaceRun.Package.Ran) {
  return Boolean(item.stdout?.trim() || item.stderr?.trim());
}

function appendOutput(str: t.Str.Builder, label: 'stdout' | 'stderr', value?: string) {
  const text = Str.trimEdgeNewlines(value ?? '');
  if (!text.trim()) return;

  str.line(`  ${c.gray(label)}`);
  for (const line of text.split('\n')) {
    str.line(`    ${line}`);
  }
}
