import { type t, Signal } from './common.ts';

/**
 * Tools for creating and manipulating the state/signals
 * for the Programme content.
 */
export const ProgrammeSignals = {
  /**
   * Initialize the state/signals object.
   */
  init(props: { state?: t.ProgrammeSignals; content: t.ProgrammeContent }) {
    const state = props.state ?? ProgrammeSignals.create();
    const p = state.props;
    if (!p.media.value) p.media.value = props.content.media;
    return state;
  },

  /**
   * Create the state/signals object.
   */
  create(): t.ProgrammeSignals {
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
  },
} as const;
