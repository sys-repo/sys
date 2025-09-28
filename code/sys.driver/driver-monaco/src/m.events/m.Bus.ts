import { type t, Rx, Schedule } from './common.ts';
import { Filter } from './u.Filter.ts';

export const Bus: t.EventBusLib = {
  Filter,
  make: () => Rx.subject<t.EditorEvent>(),
  emit,
};

export function emit(
  bus$: t.EditorEventBus,
  evt: t.EditorEvent,
  schedule: t.EmitSchedule = 'micro',
) {
  if (schedule === 'sync') {
    bus$.next(evt);
    return;
  }
  const fire = () => bus$.next(evt);
  if (schedule === 'micro') return Schedule.micro(fire);
  if (schedule === 'macro') return Schedule.macro(fire);
  return Schedule.raf(fire); // "raf"
}
