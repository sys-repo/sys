import { FmtActionHelp } from './u.help.action.ts';
import { FmtDslHelp } from './u.help.dsl.ts';
import { FmtInitHelp } from './u.help.init.ts';
import { FmtRootHelp } from './u.help.root.ts';
import { FmtStartHelp } from './u.help.start.ts';

export const FmtHelp = {
  input: FmtRootHelp.input,
  output: FmtRootHelp.output,
  initOutput: FmtInitHelp.output,
  actionOutput: FmtActionHelp.output,
  startOutput: FmtStartHelp.output,
  dslOutput: FmtDslHelp.output,
} as const;
