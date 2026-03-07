import { type t, Schedule } from './common.ts';

/**
 * Emit to the bus with a chosen schedule.
 * (generic implementation).
 */
export function emit<E extends t.EventWithKind>(
  bus$: t.Subject<E>,
  evt: E,
  schedule: t.EmitEventSchedule = 'micro',
): void {
  if (schedule === 'sync') return void bus$.next(evt);

  const fire = () => bus$.next(evt);
  if (schedule === 'micro') return void Schedule.micro(fire);
  if (schedule === 'macro') return void Schedule.macro(fire);
  return void Schedule.raf(fire);
}

/**
 * Factory returning a union-specialized emitter (symmetry with FilterFor).
 */
export const emitFor: t.EmitForFactory = <E extends t.EventWithKind>() => {
  return ((bus$, evt, schedule) => emit(bus$, schedule, evt)) as t.EmitEvent<E>;
};
