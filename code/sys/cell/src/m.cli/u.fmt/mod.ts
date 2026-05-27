import { FmtServices } from './services.ts';
import { FmtTask } from './task.ts';

export const Fmt = {
  Services: FmtServices,
  Task: FmtTask,
} as const;
