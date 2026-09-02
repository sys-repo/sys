import type { t } from '../common.ts';

import type { AuthoritySnapshot } from '../u.authority.ts';
import type { StartGuiDependencies } from '../u.deps.ts';
import type { StopSource } from '../u.lifecycle/mod.ts';
import type { BootStateOwner, BootStateSource } from '../u.state.ts';
import type { StartGuiEvidence, StartGuiRecoveryPolicy } from '../../u/u.start.gui.service.ts';

export type StartGuiInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly until?: AbortSignal;
  readonly source?: StartGuiEvidence;
  readonly deps?: Partial<StartGuiDependencies>;
};

export type PreparedStartGui = Readonly<{
  root: t.StringDir;
  deps: StartGuiDependencies;
  authorityEvidence: AuthoritySnapshot;
  recovery?: StartGuiRecoveryPolicy;
  state: BootStateOwner;
  stateSource: BootStateSource;
  stopLife: t.Abortable;
  workLife: t.Abortable;
}>;

export type BootResult =
  | Readonly<{ kind: 'ready' }>
  | Readonly<{ kind: 'failed' }>
  | Readonly<{ kind: 'stop'; source: StopSource }>;

export type Observed<T> =
  | Readonly<{ kind: 'value'; value: T }>
  | Readonly<{ kind: 'failed' }>;
