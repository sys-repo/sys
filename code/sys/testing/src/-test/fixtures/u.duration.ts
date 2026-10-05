import type { t } from '../common.ts';

export const FixtureDuration = {
  timerLeak: 1_000,
  timeoutStartupDelay: 150,
  timeoutHold: 60_000,
} as const satisfies Record<string, t.Msecs>;
