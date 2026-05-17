import { FmtDslHelp } from './u.help.dsl.ts';
import { FmtRootHelp } from './u.help.root.ts';

export const FmtHelp = {
  input: FmtRootHelp.input,
  output: FmtRootHelp.output,
  dslOutput: FmtDslHelp.output,
} as const;
