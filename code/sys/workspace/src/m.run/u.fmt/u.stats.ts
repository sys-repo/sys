import { c, type t } from '../common.ts';
import { displayNumber } from './u.text.ts';

export type TestStatsSummary = {
  observed: number;
  unavailable: number;
  unsupported: number;
  tests: number;
  failed: number;
};

export function counts(packages: readonly t.WorkspaceRun.Package.Result[]) {
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
}

export function hasTestStats(result: t.WorkspaceRun.Result) {
  return result.task === 'test' && result.packages.some((item) => {
    return item.kind === 'ran' && item.testStats !== undefined;
  });
}

export function testStatsSummary(
  result: t.WorkspaceRun.Result,
): TestStatsSummary | undefined {
  if (!hasTestStats(result)) return undefined;

  const summary: TestStatsSummary = {
    observed: 0,
    unavailable: 0,
    unsupported: 0,
    tests: 0,
    failed: 0,
  };

  for (const item of result.packages) {
    if (item.kind !== 'ran' || !item.testStats) continue;
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
}

export function observedFailureCount(stats: t.WorkspaceRun.Test.Stats.Observed) {
  return Math.max(stats.failed, stats.failedCases.length);
}

export function observedCount(value: number, observed: number, color?: 'red') {
  if (observed < 1) return c.gray('—');
  if (color === 'red' && value > 0) return c.red(displayNumber(value));
  return value > 0 ? c.white(displayNumber(value)) : c.gray('0');
}

export function reportsSummary(stats: TestStatsSummary) {
  const parts = [`${displayNumber(stats.observed)} collected`];
  if (stats.unavailable > 0) {
    parts.push(`${displayNumber(stats.unavailable)} unavailable`);
  }
  if (stats.unsupported > 0) {
    parts.push(`${displayNumber(stats.unsupported)} not applicable`);
  }
  const text = parts.join(' · ');
  if (stats.unavailable > 0) return c.yellow(text);
  if (stats.unsupported > 0) return c.gray(text);
  return c.green(text);
}

export function packageStatsCells(item: t.WorkspaceRun.Package.Ran) {
  const stats = item.testStats;
  if (stats?.kind !== 'observed') return [c.gray('—'), c.gray('—')];
  return [
    stats.tests > 0 ? c.white(displayNumber(stats.tests)) : c.gray('0'),
    stats.failed > 0 ? c.red(displayNumber(stats.failed)) : c.gray('0'),
  ];
}

export function isQuietUnsupportedReport(
  item: t.WorkspaceRun.Package.Ran,
  showStats: boolean,
) {
  return showStats && item.success && item.testStats?.kind === 'unsupported';
}
