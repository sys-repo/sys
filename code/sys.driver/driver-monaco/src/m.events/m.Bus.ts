import { type t, emitFor, filterFor, Rx } from './common.ts';

export const Bus: t.EditorBusLib = {
  Filter: filterFor<t.EditorEvent>(),
  make: () => Rx.subject<t.EditorEvent>(),
  emit: emitFor<t.EditorEvent>(),
};
