import type { CellHelp as TCellHelp } from './t.ts';
import { DslHelp, InitHelp, RootHelp } from './u/u.load.ts';
export type * from './t.ts';

export const CellHelp: TCellHelp.Lib = {
  Root: RootHelp,
  Init: InitHelp,
  Dsl: DslHelp,
};
