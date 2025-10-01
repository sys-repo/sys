import { type t, emitFor, filterFor, Rx } from './common.ts';
import { singleton } from './u.singleton.ts';

export const Bus: t.EditorBusLib = {
  Filter: filterFor<t.EditorEvent>(),
  singleton,
  make: () => Rx.subject<t.EditorEvent>(),
  emit: emitFor<t.EditorEvent>(),
};
