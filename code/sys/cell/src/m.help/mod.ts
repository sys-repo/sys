import type { t } from './common.ts';
import {
  DslHelp,
  InfoHelp,
  InitHelp,
  KillHelp,
  MigrateHelp,
  RootHelp,
  StartHelp,
  TaskHelp,
} from './u/u.load.ts';
export type * from './t.ts';

export const CellHelp: t.CellHelp.Lib = {
  Root: RootHelp,
  Info: InfoHelp,
  Init: InitHelp,
  Migrate: MigrateHelp,
  Task: TaskHelp,
  Start: StartHelp,
  Kill: KillHelp,
  Dsl: DslHelp,
};
