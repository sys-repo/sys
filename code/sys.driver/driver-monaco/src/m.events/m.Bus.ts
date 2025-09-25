import { type t, Schedule, rx } from './common.ts';

export const Bus: t.EventBusLib = {
  make: () => rx.subject<t.EditorEvent>(),
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
