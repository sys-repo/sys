import { Is, type t } from '../common.ts';

/** Structured package-local rerun input retained by one failed-package projection. */
export type FailedPackageRerun = {
  readonly cwd: t.StringPath;
  readonly task: t.WorkspaceRun.Task;
};

/** Lossless internal carrier for one failed workspace package. */
export type FailedPackage = {
  readonly package: t.WorkspaceRun.Package.Ran;
  readonly rerun: FailedPackageRerun;
};

/** Retain one failed package with its package-local rerun truth. */
export function createFailedPackage(
  item: t.WorkspaceRun.Package.Ran,
  task: t.WorkspaceRun.Task,
): FailedPackage {
  return {
    package: item,
    rerun: { cwd: item.path, task },
  };
}

/** Project every failed package in canonical result order without copying diagnostic facts. */
export function projectFailedPackages(
  result: t.WorkspaceRun.Result,
): readonly FailedPackage[] {
  return result.packages
    .filter(isFailedPackage)
    .map((item) => createFailedPackage(item, result.task));
}

/** Determine whether one package outcome is a failed package run. */
function isFailedPackage(
  item: t.WorkspaceRun.Package.Result,
): item is t.WorkspaceRun.Package.Ran {
  return item.kind === 'ran' && Is.falsy(item.success);
}
