import type { t } from './common.ts';
import { Args } from './u.args.ts';
import { Fmt } from './u.fmt.ts';
import { runTask } from './u.run.ts';

/** Canonical workspace task runner library. */
export const WorkspaceRun: t.WorkspaceRun.Lib = {
  Args,
  Fmt,
  check: (args) => runTask('check', args),
  dry: (args) => runTask('dry', args),
  test: (args) => runTask('test', args),
};
