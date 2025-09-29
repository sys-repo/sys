import { type t, Rx } from './common.ts';
import { Filter } from './u.Filter.ts';
import { emit } from './u.emit.ts';

export const Bus: t.EditorBusLib = {
  Filter,
  emit,
  make: () => Rx.subject<t.EditorEvent>(),
};
