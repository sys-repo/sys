import { type t, Is } from './common.ts';

type S = t.ProgrammeSignals;

/**
 * The property calculations as pure functions.
 */
export const CalcSection = {
  index(state: S) {
    const section = state.props.section.value;
    return {
      section: section?.index ?? 0,
      child: section?.childIndex ?? 0,
    } as const;
  },

  media(state: S) {
    const root = state.props.media.value;
    const index = CalcSection.index(state);
    const section = wrangle.child(root, index.section);
    const child = wrangle.child(section, index.child);
    return { root, section, child };
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  child(parent?: t.VideoMediaContent, index = -1) {
    if (!parent || index < 0) return undefined;
    return (parent.children ?? [])[index];
  },
} as const;
