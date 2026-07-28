import type { t } from '../common.ts';
import { formatFailedPackageIndex } from './u.failure.ts';
import { formatHandoff } from './u.handoff.ts';
import { formatIntroLine } from './u.intro.ts';
import { formatPackages, formatResult } from './u.result.ts';

export { formatFailedPackageIndex, formatIntroLine };

export const Fmt: t.WorkspaceRun.Fmt.Lib = {
  introLine: formatIntroLine,
  handoff: formatHandoff,
  result: formatResult,
  packages: formatPackages,
};
