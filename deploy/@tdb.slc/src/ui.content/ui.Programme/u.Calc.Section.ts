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

  player(state: S) {
    const media = CalcSection.media(state);
    return media.child?.video ?? media.root?.video;
  },

  title(state: S, options: { long?: boolean } = {}) {
    const { section, child } = CalcSection.media(state);
    const UNTITLED = 'Untitled';
    if (!section) return UNTITLED;
    if (options.long ?? false) {
      return !child?.title ? section.title : `${section.title ?? UNTITLED}: ${child.title}`;
    } else {
      return section.title ?? UNTITLED;
    }
  },

  /**
   * Merges a media element into a "section" level playlist.
   */
  toPlaylist(media?: t.VideoMediaContent, options: { introTitle?: string } = {}) {
    if (!media) return [];
    const { introTitle = 'Introduction' } = options;

    const children = media.children ?? [];
    const hasChildren = children.length > 0;
    const title = hasChildren ? introTitle : media.title ?? 'Untitled';

    const res: t.VideoMediaContent[] = [{ ...media, title }];

    res.push(...children);
    return res.filter((m) => !Is.nil(m));
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
