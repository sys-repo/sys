import { c, Cli, Num, Str, type t, Time } from '../common.ts';
import { type FailedPackage, projectFailedPackages } from '../u/u.failure.ts';
import { formatFailedOutput, formatFailedPackageIndex, formatFailureDetails } from './u.failure.ts';
import { counts, testStatsSummary } from './u.stats.ts';
import { displayNumber, fitHandoffWidth, taskNoun } from './u.text.ts';

const SUMMARY_SEPARATOR = c.gray(' · ');

export type HandoffDependencies = {
  /** Pure width measurement only; reporter runtime owns screen repaint effects. */
  readonly fitWidth: typeof fitHandoffWidth;
};

const DEFAULT_DEPS: HandoffDependencies = {
  fitWidth: fitHandoffWidth,
};

/** Format one deterministic final run handoff. */
export function formatHandoff(
  result: t.WorkspaceRun.Result,
  options: t.WorkspaceRun.Fmt.HandoffOptions,
): string {
  return formatHandoffWith(DEFAULT_DEPS, result, options);
}

/** Package-internal dependency seam for terminal-width fitting. */
export function formatHandoffWith(
  deps: HandoffDependencies,
  result: t.WorkspaceRun.Result,
  options: t.WorkspaceRun.Fmt.HandoffOptions,
): string {
  const width = deps.fitWidth(options);
  const allFailures = projectFailedPackages(result);
  const failures = options.detail === 'compact'
    ? omittedFailedPackages(allFailures, options.screen)
    : allFailures;
  const str = Str.builder();

  str.line(handoffTitle(result));
  str.line(Cli.Fmt.hr({ width, color: handoffColor(result) }));
  handoffSummary(result, width).forEach((line) => str.line(line));

  if (failures.length > 0) {
    const omitted = allFailures.length - failures.length;
    const qualifier = omitted > 0 ? 'more failed' : 'failed';
    str.line('');
    str.line(
      c.red(`${failures.length} ${qualifier} ${Str.plural(failures.length, 'package')}`),
    );
    str.line('');
    str.line(formatFailedPackageIndex(failures, { terminal: options.terminal, width }));
  }

  const compact = Str.trimEdgeNewlines(String(str));
  if (options.detail === 'compact') return compact;

  const details = formatFailureDetails(allFailures, width, options.terminal);
  const output = formatFailedOutput(result);
  return [compact, details, output].filter(Boolean).join('\n\n');
}

function handoffColor(result: t.WorkspaceRun.Result): 'green' | 'red' {
  return result.ok ? 'green' : 'red';
}

function handoffOutcome(result: t.WorkspaceRun.Result, text: string) {
  return handoffColor(result) === 'green' ? c.green(text) : c.red(text);
}

function handoffTitle(result: t.WorkspaceRun.Result) {
  const noun = taskNoun(result.task);
  const elapsed = Time.duration(result.elapsed).toString();
  return handoffColor(result) === 'green'
    ? `${c.green('Workspace')} ${c.cyan(noun)} ${c.green(`done in ${elapsed}`)}`
    : `${c.red('Workspace')} ${c.cyan(noun)} ${c.red(`failed in ${elapsed}`)}`;
}

function handoffSummary(result: t.WorkspaceRun.Result, width: number) {
  const resultCounts = counts(result.packages);
  const primary: string[] = [];
  const capabilities: string[] = [];

  if (result.ok) {
    const packages = `${displayNumber(resultCounts.ran)} ${
      Str.plural(resultCounts.ran, 'package')
    }`;
    primary.push(handoffOutcome(result, packages));
  } else {
    primary.push(c.white(`${displayNumber(resultCounts.ran)} ran`));
    primary.push(handoffOutcome(result, `${displayNumber(resultCounts.failed)} failed`));
  }
  if (resultCounts.blocked > 0) {
    primary.push(c.white(`${displayNumber(resultCounts.blocked)} blocked`));
  }
  if (resultCounts.skipped > 0) {
    primary.push(c.white(`${displayNumber(resultCounts.skipped)} skipped`));
  }

  const stats = testStatsSummary(result);
  if (stats) {
    if (stats.observed > 0) {
      const tests = `${displayNumber(stats.tests)} ${Str.plural(stats.tests, 'test')}`;
      primary.push(c.white(tests));
    }
    primary.push(
      c.white(
        `${displayNumber(stats.observed)} ${Str.plural(stats.observed, 'report')} collected`,
      ),
    );
    if (stats.unavailable > 0) {
      capabilities.push(c.white(`${displayNumber(stats.unavailable)} unavailable`));
    }
    if (stats.unsupported > 0) {
      capabilities.push(c.white(`${displayNumber(stats.unsupported)} not applicable`));
    }
  }

  const lines = packSummaryParts(primary, width);
  if (capabilities.length === 0) return lines;

  const capabilityLine = joinSummaryParts(capabilities);
  const last = lines.at(-1);
  const combined = last ? `${last}${SUMMARY_SEPARATOR}${capabilityLine}` : capabilityLine;
  if (width <= 0 || Cli.Fmt.Text.Width.measure(combined) <= width) {
    lines[lines.length - 1] = combined;
  } else {
    lines.push(...packSummaryParts(capabilities, width));
  }
  return lines;
}

function packSummaryParts(parts: readonly string[], width: number) {
  if (parts.length === 0) return [];
  if (width <= 0) return [joinSummaryParts(parts)];

  const lines: string[] = [];
  for (const part of parts) {
    const last = lines.at(-1);
    const candidate = last ? `${last}${SUMMARY_SEPARATOR}${part}` : part;
    if (last && Cli.Fmt.Text.Width.measure(candidate) > width) {
      lines.push(part);
    } else if (last) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(part);
    }
  }
  return lines;
}

function joinSummaryParts(parts: readonly string[]) {
  return parts.join(SUMMARY_SEPARATOR);
}

function omittedFailedPackages(
  failures: readonly FailedPackage[],
  screen?: t.WorkspaceRun.Test.Reporter.ScreenCompletion,
) {
  if (!screen || screen.failedPackages.total !== failures.length) return failures;
  const visible = screen.failedPackages.visible;
  if (!Num.Is.int(visible) || visible < 0 || visible > failures.length) return failures;
  return failures.slice(visible);
}
