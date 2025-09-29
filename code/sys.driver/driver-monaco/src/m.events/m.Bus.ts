import { type t, FilterFor, Rx } from './common.ts';
import { emit } from './u.emit.ts';

export const Bus: t.EditorBusLib = {
  emit,
  make: () => Rx.subject<t.EditorEvent>(),
  Filter: FilterFor<t.EditorEvent>(),
};
