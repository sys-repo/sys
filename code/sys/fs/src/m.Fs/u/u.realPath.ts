import type { t } from '../common.ts';

/**
 * Resolve the native canonical path.
 * Observations remain subject to concurrent path changes.
 */
export const realPath: t.Fs.Lib['realPath'] = Deno.realPath;
