import type { t } from './common.ts';
import { runTask } from './u.run.ts';

/** Canonical workspace task runner library. */
export const WorkspaceRun: t.WorkspaceRun.Lib = {
  check: (args) => runTask('check', args),
  test: (args) => runTask('test', args),
};
