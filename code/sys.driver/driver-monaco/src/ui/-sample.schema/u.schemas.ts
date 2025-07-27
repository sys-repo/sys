import { type t, Schema } from './common.ts';
const { Type } = Schema;

/**
 * Meta-data:
 */
export const Meta = Type.Object({
  dev: Type.Optional(
    Type.Boolean({
      description: 'Flag indicating if the dev/debug column should be showing.',
      default: false,
    }),
  ),

  /** Main */
  main: Type.Optional(
    Type.Object({
      component: Type.Optional(Type.String({ description: 'URI passed to the view-factory.' })),
      props: Type.Optional(
        Type.String({
          description: `String that resolves to an object-path pointing locally to the 'props' data in the document.`,
        }),
      ),
    }),
  ),
});

/**
 * Video:
 */
export const Video = Type.Object({
  src: Type.Optional(Type.String({ description: 'Href to the video source file.' })),
  width: Type.Optional(Type.Number({ description: 'Width in pixels.' })),
  cornerRadius: Type.Optional(Type.Number({ description: 'Corner border radius.' })),
  crop: Type.Optional(
    Type.Union([
      // { start, end } object form:
      Type.Object({
        start: Type.Number(), // t.Secs
        end: Type.Number(), // t.Secs
      }),
      // [start, end] tuple form:
      Type.Tuple([
        Type.Number(), // t.Secs
        Type.Number(), // t.Secs
      ]),
    ]),
  ),
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

/**
 * File-share:
 */
export const Fileshare = Type.Object({});

/**
 * Library:
 */
export type Meta = t.Static<typeof Meta>;
export type Video = t.Static<typeof Video>;
export type Fileshare = t.Static<typeof Fileshare>;
export const SampleSchema = {
  Meta,
  Video,
  Fileshare,
} as const;
