import type { t } from './common.ts';
import { DistServerError } from './u.server/u.error.ts';
import { start, startLocal } from './u.server/u.start.ts';

/** Verified-or-refuse local Dist hosting. */
export const DistServer: t.DistServer.Lib = Object.freeze({
  start,
  startLocal,
  Error: DistServerError,
});
