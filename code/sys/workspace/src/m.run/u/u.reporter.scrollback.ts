import type { t } from '../common.ts';
import { formatFailedPackageIndex, formatFailedPackageSeparator } from '../u.fmt/mod.ts';
import type { FailedPackage } from './u.failure.ts';
import {
  finalReporterGridLayout,
  formatCompletedCell,
  formatCompletedReporterGrid,
} from './u.reporter.grid.ts';
import type { ParallelProgressCompleted } from './u.progress.ts';

export type FinalScrollbackArgs = {
  completed: readonly ParallelProgressCompleted[];
  failures: readonly FailedPackage[];
  terminal?: boolean;
  width: number;
};

export type FinalScrollbackLayout = {
  readonly frame: string;
  readonly completion: t.WorkspaceRun.Test.Reporter.ScreenCompletion;
};

/** Render exhaustive completed-package and failed-action terminal scrollback. */
export function layoutFinalScrollback(args: FinalScrollbackArgs): FinalScrollbackLayout {
  const gridLayout = finalReporterGridLayout(args.completed, args.width);
  const cells = args.completed.map((item) => {
    return formatCompletedCell(item, gridLayout.cellWidth);
  });
  const rows = Math.ceil(cells.length / gridLayout.columns);
  const grid = rows > 0 ? formatCompletedReporterGrid(cells, gridLayout.columns, rows) : '';
  const failureIndex = args.failures.length > 0
    ? formatFailedPackageIndex(args.failures, { width: args.width, terminal: args.terminal })
    : '';
  const repair = failureIndex ? `${formatFailedPackageSeparator(args.width)}\n${failureIndex}` : '';
  const frame = grid && repair ? `${grid}\n\n${repair}` : grid || repair;

  return {
    frame,
    completion: {
      failedPackages: { visible: args.failures.length, total: args.failures.length },
    },
  };
}
