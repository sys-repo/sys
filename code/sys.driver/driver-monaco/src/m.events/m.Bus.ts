import { type t, emitFor, filterFor, Rx } from './common.ts';

export const Bus: t.EditorBusLib = {
  make: () => Rx.subject<t.EditorEvent>(),
  emit: emitFor<t.EditorEvent>(),
  Filter: filterFor<t.EditorEvent>(),
};
