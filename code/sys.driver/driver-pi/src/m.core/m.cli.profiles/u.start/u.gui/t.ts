import type { t } from '../common.ts';

import type { StartGuiDependencies } from '../u.deps.ts';
import type { StartGuiEvidence } from '../../u/u.start.gui.service.ts';

export type StartGuiInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly until?: AbortSignal;
  readonly source?: StartGuiEvidence;
  /** Package-internal seams used by focused runtime tests. */
  readonly deps?: Partial<StartGuiDependencies>;
};
