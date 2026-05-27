import { FmtDslHelp } from './dsl.ts';
import { FmtInitHelp } from './init.ts';
import { FmtMigrateHelp } from './migrate.ts';
import { FmtRootHelp } from './root.ts';
import { FmtStartHelp } from './start.ts';
import { FmtTaskHelp } from './task.ts';

export const FmtHelp = {
  input: FmtRootHelp.input,
  output: FmtRootHelp.output,
  initOutput: FmtInitHelp.output,
  migrateOutput: FmtMigrateHelp.output,
  taskOutput: FmtTaskHelp.output,
  startOutput: FmtStartHelp.output,
  dslOutput: FmtDslHelp.output,
} as const;
