import { FmtDslHelp } from './u.dsl.ts';
import { FmtInfoHelp } from './u.info.ts';
import { FmtInitHelp } from './u.init.ts';
import { FmtKillHelp } from './u.kill.ts';
import { FmtMigrateHelp } from './u.migrate.ts';
import { FmtRootHelp } from './u.root.ts';
import { FmtStartHelp } from './u.start.ts';
import { FmtTaskHelp } from './u.task.ts';

export const FmtHelp = Object.freeze(
  {
    input: FmtRootHelp.input,
    output: FmtRootHelp.output,
    infoOutput: FmtInfoHelp.output,
    initOutput: FmtInitHelp.output,
    migrateOutput: FmtMigrateHelp.output,
    taskOutput: FmtTaskHelp.output,
    startOutput: FmtStartHelp.output,
    killOutput: FmtKillHelp.output,
    dslOutput: FmtDslHelp.output,
  } as const,
);
