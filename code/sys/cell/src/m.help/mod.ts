import type { CellHelp as TCellHelp } from './t.ts';
import { AgentHelp, InitHelp, RootHelp } from './u/u.load.ts';
export type * from './t.ts';

export const CellHelp: TCellHelp.Lib = {
  Root: RootHelp,
  Init: InitHelp,
  Agent: AgentHelp,
};
