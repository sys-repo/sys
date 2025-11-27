import { type t } from './common.ts';

export function elapsedSince(t0: number): t.Msecs {
  return Math.max(0, Math.round(performance.now() - t0));
}
