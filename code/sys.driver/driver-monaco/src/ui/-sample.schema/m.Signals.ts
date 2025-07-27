import { type t, Signal } from './common.ts';

type S = t.SampleState;

export function createSignals() {
  const s = Signal.create;

  const api: t.SampleSignals = {
    io: { monaco: s<S['io']['monaco']>(), editor: s<S['io']['editor']>() },
    doc: s<S['doc']>(),
    path: {
      yaml: s<S['path']['yaml']>(['foo']),
    },
    listen() {
      Signal.toObject(api); // NB: walks and reads all values.
    },
  };

  return api;
}
