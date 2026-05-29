import type { t } from './common.ts';
import { pid } from './u.pid.ts';
import { port } from './u.port.ts';

/**
 * Process termination helpers.
 */
export const Terminate: t.Process.Terminate.Lib = {
  pid,
  port,
};
