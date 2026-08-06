import type { t } from './common.ts';
import { DistServerError } from './u/u.server.error.ts';
import { start } from './u/u.server.start.ts';

/** Verified-or-refuse local Dist hosting. */
export const DistServer: t.DistServer.Lib = Object.freeze({
  start,
  Error: DistServerError,
});
