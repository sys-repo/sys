import type { t } from './common.ts';
import { ActionHelp, DslHelp, InitHelp, RootHelp, StartHelp } from './u/u.load.ts';
export type * from './t.ts';

export const CellHelp: t.CellHelp.Lib = {
  Root: RootHelp,
  Init: InitHelp,
  Action: ActionHelp,
  Start: StartHelp,
  Dsl: DslHelp,
};
