import type { DenoFileLib } from './t.ts';

import { Is } from './m.DenoFile.Is.ts';
import { Path } from './m.DenoFile.Path.ts';
import { load } from './u.load.ts';
import { nearest } from './u.nearest.ts';
import { workspace } from './u.workspace.ts';

export const DenoFile: DenoFileLib = {
  Is,
  Path,
  load,
  nearest,
  workspace,
};
