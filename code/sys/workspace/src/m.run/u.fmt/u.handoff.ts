import { c, Cli, Num, Str, type t, Time } from '../common.ts';
import { type FailedPackage, projectFailedPackages } from '../u/u.failure.ts';
import { formatFailedOutput, formatFailedPackageIndex, formatFailureDetails } from './u.failure.ts';
import { counts, testStatsSummary } from './u.stats.ts';
import { appendWrapped, displayNumber, fitHandoffWidth, taskNoun } from './u.text.ts';

/** Format one deterministic final run handoff. */
export function formatHandoff(
  result: t.WorkspaceRun.Result,
  options: t.WorkspaceRun.Fmt.HandoffOptions,
): string {
  const width = fitHandoffWidth(options);
  const allFailures = projectFailedPackages(result);
  const failures = options.detail === 'compact'
    ? omittedFailedPackages(allFailures, options.screen)
    : allFailures;
  const str = Str.builder();

  str.line(handoffTitle(result));
  str.line(Cli.Fmt.hr({ width, color: handoffColor(result) }));
  appendWrapped(str, '', handoffSummary(result), width);

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

function handoffTitle(result: t.WorkspaceRun.Result) {
  const noun = taskNoun(result.task);
  const elapsed = Time.duration(result.elapsed).toString();
  return handoffColor(result) === 'green'
    ? `${c.green('Workspace')} ${c.cyan(noun)} ${c.green(`done in ${elapsed}`)}`
    : `${c.red('Workspace')} ${c.cyan(noun)} ${c.red(`failed in ${elapsed}`)}`;
}

function handoffSummary(result: t.WorkspaceRun.Result) {
  const resultCounts = counts(result.packages);
  const parts: string[] = [];

  if (result.ok) {
    parts.push(`${displayNumber(resultCounts.ran)} ${Str.plural(resultCounts.ran, 'package')}`);
  } else {
    parts.push(`${displayNumber(resultCounts.ran)} ran`);
    parts.push(`${displayNumber(resultCounts.failed)} failed`);
  }
  if (resultCounts.blocked > 0) parts.push(`${displayNumber(resultCounts.blocked)} blocked`);
  if (resultCounts.skipped > 0) parts.push(`${displayNumber(resultCounts.skipped)} skipped`);

  const stats = testStatsSummary(result);
  if (stats) {
    if (stats.observed > 0) {
      parts.push(`${displayNumber(stats.tests)} ${Str.plural(stats.tests, 'test')}`);
    }
    const reports = [
      `${displayNumber(stats.observed)} ${Str.plural(stats.observed, 'report')} collected`,
    ];
    if (stats.unavailable > 0) {
      reports.push(`${displayNumber(stats.unavailable)} unavailable`);
    }
    if (stats.unsupported > 0) {
      reports.push(`${displayNumber(stats.unsupported)} not applicable`);
    }
    parts.push(reports.join(c.gray(' · ')));
  }

  return parts.join(c.gray(' · '));
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
