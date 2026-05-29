import type { t } from './common.ts';
import { listeners } from './u.port.ts';

/**
 * Local port inspection helpers.
 */
export const Port: t.Process.Port.Lib = {
  listeners,
};
