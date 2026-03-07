import { type t, Schema } from './common.ts';

export const schema: t.TimecodePlaybackManifestSchemaLib['schema'] = (args) => {
  const Type = Schema.Type;
  const payload = args?.payload ?? Type.Unknown();

  /**
   * Brand only the static type surface.
   * Runtime validation still accepts plain string/number values.
   */
  const DocId = Type.Unsafe<t.StringId>(Type.String());
  const StringPath = Type.Unsafe<t.StringPath>(Type.String());
  const Msecs = Type.Unsafe<t.Msecs>(Type.Number());
  const SliceInput = Type.Unsafe<t.Timecode.Slice.StringInput>(Type.String());

  return Type.Object(
    {
      docid: DocId,
      composition: Type.Array(
        Type.Object({
          src: StringPath,
          slice: Type.Optional(SliceInput),
        }),
      ),
      beats: Type.Array(
        Type.Object({
          src: Type.Object({
            kind: Type.Union([Type.Literal('video'), Type.Literal('image')]),
            logicalPath: StringPath,
            time: Msecs,

            /** Optional authoring hint for debug/UX (no playback semantics). */
            slice: Type.Optional(SliceInput),
          }),
          pause: Type.Optional(Msecs),
          payload,
        }),
      ),
    },
    { additionalProperties: false },
  );
};
