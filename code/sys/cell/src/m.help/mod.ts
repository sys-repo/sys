import type { t } from './common.ts';
import { DslHelp, InitHelp, MigrateHelp, RootHelp, StartHelp, TaskHelp } from './u/u.load.ts';
export type * from './t.ts';

export const CellHelp: t.CellHelp.Lib = {
  Root: RootHelp,
  Init: InitHelp,
  Migrate: MigrateHelp,
  Task: TaskHelp,
  Start: StartHelp,
  Dsl: DslHelp,
};
