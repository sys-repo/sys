import type { t } from './common.ts';
import { Path } from './m.DenoFile.Path.ts';
import { load } from './u.load.ts';
import { workspace } from './u.workspace.ts';
import { nearest } from './u.nearest.ts';
import { Is } from './m.DenoFile.Is.ts';

export const DenoFile: t.DenoFileLib = {
  Is,
  Path,
  load,
  nearest,
  workspace,
};
