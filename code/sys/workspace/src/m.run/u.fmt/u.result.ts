import { c, Cli, Str, type t, Time } from '../common.ts';
import { packageLabel } from '../u/u.identity.ts';
import {
  counts,
  hasTestStats,
  isQuietUnsupportedReport,
  observedCount,
  packageStatsCells,
  reportsSummary,
  testStatsSummary,
} from './u.stats.ts';
import { displayNumber, indentedTable, taskNoun } from './u.text.ts';

const SUMMARY_REPEAT_MIN_PACKAGES = 11;

export function formatResult(result: t.WorkspaceRun.Result) {
  const rows = Cli.table([]);
  const resultCounts = counts(result.packages);
  const noun = taskNoun(result.task);
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
    resultCounts.ran > 0 ? c.white(displayNumber(resultCounts.ran)) : c.gray('0'),
  ]);
  rows.push([
    c.gray('packages skipped'),
    resultCounts.skipped > 0 ? c.yellow(displayNumber(resultCounts.skipped)) : c.gray('0'),
  ]);
  if (resultCounts.blocked > 0) {
    rows.push([c.gray('packages blocked'), c.yellow(displayNumber(resultCounts.blocked))]);
  }
  rows.push([
    c.gray('packages failed'),
    resultCounts.failed > 0 ? c.red(displayNumber(resultCounts.failed)) : c.gray('0'),
  ]);

  const stats = testStatsSummary(result);
  if (stats) {
    rows.push([c.gray('test cases'), observedCount(stats.tests, stats.observed)]);
    rows.push([
      c.gray('test failures'),
      observedCount(stats.failed, stats.observed, 'red'),
    ]);
    rows.push([c.gray('reports'), reportsSummary(stats)]);
  }

  const summary = indentedTable(rows);
  const str = Str.builder();
  str.line(title);
  str.line(Cli.Fmt.hr(color));
  str.line('');
  str.line(summary);

  const packages = formatPackages(result);
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
}

export function formatPackages(result: t.WorkspaceRun.Result) {
  const rows = Cli.table([]);
  const showStats = hasTestStats(result);
  rows.push([
    c.gray('package'),
    c.gray('status'),
    c.gray('elapsed'),
    ...(showStats ? [c.gray('tests'), c.gray('failed')] : []),
  ]);

  for (const item of result.packages) {
    if (item.kind === 'skipped') {
      rows.push([
        c.gray(packageLabel(item)),
        c.yellow('skipped'),
        c.gray('—'),
        ...(showStats ? [c.gray('—'), c.gray('—')] : []),
      ]);
      continue;
    }
    if (item.kind === 'blocked') {
      rows.push([
        c.gray(packageLabel(item)),
        c.yellow('blocked'),
        c.gray('—'),
        ...(showStats ? [c.gray('—'), c.gray('—')] : []),
      ]);
      continue;
    }

    if (isQuietUnsupportedReport(item, showStats)) {
      rows.push([c.gray(packageLabel(item))]);
      continue;
    }

    rows.push([
      c.white(packageLabel(item)),
      item.success ? c.green('ok') : c.red('failed'),
      c.white(Time.duration(item.elapsed).toString()),
      ...(showStats ? packageStatsCells(item) : []),
    ]);
  }

  return Str.trimEdgeNewlines(String(rows));
}
