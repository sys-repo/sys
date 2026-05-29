import type { t } from './common.ts';
import { pid } from './u.pid.ts';

/** Process termination helpers. */
export const Terminate: t.Process.TerminateLib = {
  pid,
};
