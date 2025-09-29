import { type t, Schedule } from './common.ts';

/**
 * Emit to the bus with a chosen schedule.
 */
export const emit: t.EmitEvent = (bus$, evt, schedule = 'micro') => {
  if (schedule === 'sync') return void bus$.next(evt);

  const fire = () => bus$.next(evt);
  if (schedule === 'micro') return Schedule.micro(fire);
  if (schedule === 'macro') return Schedule.macro(fire);
  return Schedule.raf(fire); // "raf"
};
