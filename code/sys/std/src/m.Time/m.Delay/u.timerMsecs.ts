import { Is, Num, type t } from '../common.ts';

/**
 * Canonical ceiling for delays backed by host timeout and interval queues.
 * The maximum is 2³¹−1, before Deno's current timer substrate overflows to a 1ms delay.
 */
export const MAX = 2_147_483_647 as t.Msecs;

/**
 * Normalize an arbitrary duration into the canonical timer-backed delay domain.
 * Invalid or negative values become zero; valid integers above `Time.Delay.MAX` are clamped.
 */
export function timerMsecs(input: number): t.Msecs {
  if (!Is.num(input) || !Num.Is.safeInt(input)) return 0;
  return Num.clamp(0, MAX, input);
}
