import { Traits } from '../mod.ts';
import { type t, Is as is, Slug, Value } from './common.ts';

export const Is: t.SlugTraitIsLib = {
  /** slug-tree: props schema */
  slugTreeProps: Slug.Tree.Is.props,

  /** video-recorder: binding with non-empty as */
  videoRecorderBinding(m: unknown): m is t.VideoRecorderBinding {
    return is.record(m) && m.id === 'video-recorder' && is.string(m.as) && m.as.length > 0;
  },

  /** video-recorder: props schema */
  videoRecorderProps(u: unknown): u is t.VideoRecorderProps {
    return Value.Check(Traits.Schema.VideoRecorder.Props, u as unknown);
  },

  /** video-player: binding with non-empty as */
  videoPlayerBinding(m: unknown): m is t.VideoPlayerBinding {
    return is.record(m) && m.id === 'video-player' && is.string(m.as) && m.as.length > 0;
  },

  /** video-player: props schema */
  videoPlayerProps(u: unknown): u is t.VideoPlayerProps {
    return Value.Check(Traits.Schema.VideoPlayer.Props, u as unknown);
  },

  /** concept-layout: props schema */
  conceptLayoutProps(u: unknown): u is t.ConceptLayoutProps {
    return Value.Check(Traits.Schema.ConceptLayout.Props, u as unknown);
  },
} as const;
