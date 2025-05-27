import type { t } from './common.ts';
import { Path } from './m.DenoFile.Path.ts';
import { load } from './u.load.ts';
import { isWorkspace, workspace } from './u.workspace.ts';

export const DenoFile: t.DenoFileLib = {
  Path,
  load,
  workspace,
  isWorkspace,
};
