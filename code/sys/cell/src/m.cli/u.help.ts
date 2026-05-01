import { FmtAgentHelp } from './u.help.agent.ts';
import { FmtInitHelp } from './u.help.init.ts';
import { FmtRootHelp } from './u.help.root.ts';

export const FmtHelp = {
  input: FmtRootHelp.input,
  output: FmtRootHelp.output,
  initOutput: FmtInitHelp.output,
  agentOutput: FmtAgentHelp.output,
} as const;
