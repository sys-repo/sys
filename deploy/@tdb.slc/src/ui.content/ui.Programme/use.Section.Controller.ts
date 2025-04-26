import { type t } from './common.ts';

export function useSectionController(state: t.ProgrammeSignals) {
  const p = state.props;

  /**
   * API:
   */
  const api = {
    get index() {
      const section = state.props.section.value;
      return {
        section: section?.index ?? 0,
        child: section?.childIndex ?? 0,
      } as const;
    },

    get media() {
      const root = p.media.value;
      const index = api.index;
      const section = wrangle.child(root, index.section);
      const child = wrangle.child(section, index.child);
      return { root, section, child };
    },

    get player() {
      const media = api.media;
      return media.child?.video ?? media.root?.video;
    },

    get title() {
      const { section, child } = api.media;
      if (!section) return 'Untitled';
      return !child?.title ? section.title : `${section.title}: ${child.title}`;
    },

    /**
     * Event Actions:
     */
    onChildSelect(e: { index: t.Index }) {
      const childIndex = e.index;
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
