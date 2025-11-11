import { Timecode, Type } from '../common.ts';

/**
 * Video:
 */
export const Video = Type.Object({
  src: Type.Optional(Type.String({ description: 'Href to the video source file.' })),
  width: Type.Optional(Type.Number({ description: 'Width in pixels.' })),
  cornerRadius: Type.Optional(Type.Number({ description: 'Corner border radius.' })),
  // 🌸 ---------- CHANGED: crop-to-slice-string-only ----------
  slice: Type.Optional(
    Type.String({
      pattern: Timecode.Pattern.slice,
      description:
        'Canonical time slice "<from>..<to>" (MM:SS|HH:MM:SS(.mmm), open "", or -relEnd).',
    }),
  ),
  // 🌸 ---------- /CHANGED ----------
  muted: Type.Optional(Type.Boolean({ description: 'Muted (audio) state of the player.' })),
  jumpTo: Type.Optional(
    Type.Object({
      /** Positive → absolute seconds, negative → from end (e.g. -5 = 5 s before end). */
      second: Type.Number(), // t.Secs
      /** Play after seeking?  Omit = leave play/pause unchanged. */
      play: Type.Optional(Type.Boolean()),
    }),
  ),
});
