import type { t } from './common.ts';
import { listeners } from './u/u.port.ts';

/**
 * Local port inspection helpers.
 */
export const Port: t.Process.Port.Lib = Object.freeze({
  listeners,
});
