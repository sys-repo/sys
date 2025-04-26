import { type t, Signal } from './common.ts';

export function createProgrammeSignals(): t.ProgrammeSignals {
  const s = Signal.create;
  const api: t.ProgrammeSignals = {
    props: {
      debug: s(false),
      align: s('Center'),
      media: s(),
      section: s(),
    },
    listen() {
      const p = api.props;
      p.debug.value;
      p.align.value;
      p.media.value;
      p.section.value;
    },
  };
  return api;
}
