import { type t, filterFor, Rx } from './common.ts';
import { emit } from './u.emit.ts';
import { ping, pong } from './u.ping.ts';

export const Bus: t.EditorBusLib = {
  Filter: filterFor<t.EditorEvent>(),
  make: () => Rx.subject<t.EditorEvent>(),
  emit,
  ping,
  pong,
};
