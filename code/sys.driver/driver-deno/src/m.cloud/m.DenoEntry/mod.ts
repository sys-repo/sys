/**
 * @module
 * Deno app entry contract for local runtime and Deno Deploy.
 */
import type { t } from './common.ts';
import { serve } from './m.serve.ts';

export const DenoEntry: t.DenoEntry.Lib = {
  serve,
};
