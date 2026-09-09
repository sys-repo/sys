import type { t } from './common.ts';
import { start } from './u/u.start.ts';

/**
 * Inert loopback bootstrap-status host.
 */
export const BootstrapStatus: t.BootstrapStatus.Lib = Object.freeze({ start });
