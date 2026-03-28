/**
 * @module
 * Tools for managing Deno Deploy application resources.
 * An application is the named deployable unit in Deno Deploy.
 */
import type { t } from './common.ts';
import { create } from './m.create.ts';

export const DenoApp: t.DenoApp.Lib = {
  create,
};
