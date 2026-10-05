import { FmtInfo } from './u.info.ts';
import { FmtServices } from './u.services.ts';
import { FmtTask } from './u.task.ts';

export const Fmt = Object.freeze(
  {
    Info: FmtInfo,
    Services: FmtServices,
    Task: FmtTask,
  } as const,
);
