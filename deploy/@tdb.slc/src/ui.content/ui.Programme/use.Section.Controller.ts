import { type t } from './common.ts';

type S = t.ProgrammeSignals;

/**
 * The property calculations as pure functions.
 */
export const Calc = {
  index(state: S) {
    const section = state.props.section.value;
    return {
      section: section?.index ?? 0,
      child: section?.childIndex ?? 0,
    } as const;
  },

  media(state: S) {
    const root = state.props.media.value;
    const index = Calc.index(state);
    const section = wrangle.child(root, index.section);
    const child = wrangle.child(section, index.child);
    return { root, section, child };
  },

  player(state: S) {
    const media = Calc.media(state);
    return media.child?.video ?? media.root?.video;
  },

  title(state: S) {
    const { section, child } = Calc.media(state);
    if (!section) return 'Untitled';
    return !child?.title ? section.title : `${section.title}: ${child.title}`;
  },
} as const;

/**
 * Controls an individual section
 */
export function useSectionController(state: S) {
  const p = state.props;

  /**
   * API:
   */
  const api = {
    get index() {
      return Calc.index(state);
    },

    get media() {
      return Calc.media(state);
    },

    get player() {
      return Calc.player(state);
    },

    get title() {
      return Calc.title(state);
    },

    /**
     * Event Actions:
     */
    onSelectChild(childIndex: t.Index) {
      const section = p.section;
      if (section.value) section.value = { ...section.value, childIndex };
    },
  } as const;
  return api;
}

/**
 * Helpers:
 */
const wrangle = {
  child(parent?: t.VideoMediaContent, index = -1) {
    if (!parent || index < 0) return undefined;
    return (parent.children ?? [])[index];
  },
} as const;
