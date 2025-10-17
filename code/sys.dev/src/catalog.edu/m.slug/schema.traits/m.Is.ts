import { type t, Is as is, Value } from './common.ts';
import { VideoPlayerPropsSchema } from './m.video.player.ts';
import { VideoRecorderPropsSchema } from './m.video.recorder.ts';

export const Is: t.SlugTraitIsLib = {
  /**
   * True iff the value is a valid "video-recorder" trait binding
   * with a non-empty `as` alias.
   */
  videoRecorderBinding(m: unknown): m is t.VideoRecorderBinding {
    return is.record(m) && m.id === 'video-recorder' && is.string(m.as) && m.as.length > 0;
  },

  /**
   * True iff value conforms to the video-recorder props schema.
   * (Schema-truthful; aligns with generated `t.VideoRecorderProps`.)
   */
  videoRecorderProps(u: unknown): u is t.VideoRecorderProps {
    return Value.Check(VideoRecorderPropsSchema, u as unknown);
  },

  /**
   * True iff value conforms to the video-player props schema.
   * (Schema-truthful; aligns with generated `t.VideoPlayerProps`.)
   */
  videoPlayerProps(u: unknown): u is t.VideoPlayerProps {
    return Value.Check(VideoPlayerPropsSchema, u as unknown);
  },
} as const;
