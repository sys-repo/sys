import { type t, filterFor, Rx } from './common.ts';
import { emit } from './u.emit.ts';
import { ping, pong } from './u.ping.ts';

export const Bus: t.EditorBus.Lib = {
  Filter: filterFor<t.EditorEvent.Shape>(),
  make: () => Rx.subject<t.EditorEvent.Shape>(),
  emit,
  ping,
  pong,
};
