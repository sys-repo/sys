import { FmtDslHelp } from './u.help.dsl.ts';
import { FmtInitHelp } from './u.help.init.ts';
import { FmtMigrateHelp } from './u.help.migrate.ts';
import { FmtRootHelp } from './u.help.root.ts';
import { FmtStartHelp } from './u.help.start.ts';
import { FmtTaskHelp } from './u.help.task.ts';

export const FmtHelp = {
  input: FmtRootHelp.input,
  output: FmtRootHelp.output,
  initOutput: FmtInitHelp.output,
  migrateOutput: FmtMigrateHelp.output,
  taskOutput: FmtTaskHelp.output,
  startOutput: FmtStartHelp.output,
  dslOutput: FmtDslHelp.output,
} as const;
