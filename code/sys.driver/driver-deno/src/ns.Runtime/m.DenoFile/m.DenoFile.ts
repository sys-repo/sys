import type { t } from './common.ts';
import { Path } from './m.DenoFile.Path.ts';
import { load } from './u.load.ts';
import { isWorkspace, workspace } from './u.workspace.ts';
import { nearest } from './u.nearest.ts';

export const DenoFile: t.DenoFileLib = {
  Path,
  load,
  nearest,
  workspace,
  isWorkspace,
};
