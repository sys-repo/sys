import { type t, Signal } from './common.ts';

type S = t.SampleState;

export function createSignals() {
  const s = Signal.create;

  const paths: t.SamplePathsSignals = {
    yaml: s(['foo']),
    parsed: s(['foo.parsed']),
    meta: s(['.']),
  };

  const api: t.SampleSignals = {
    io: { monaco: s(), editor: s() },

    paths,
    doc: s(),
    yaml: s(),
    main: s<S['main']>(),

    listen() {
      Signal.listen(api, true);
    },
  };

  return api;
}
