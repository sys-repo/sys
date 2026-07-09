import type { t } from './common.ts';
import { pid } from './u/u.pid.ts';
import { port } from './u/u.port.ts';

/**
 * Process termination helpers.
 */
export const Terminate: t.Process.Terminate.Lib = {
  pid,
  port,
};
