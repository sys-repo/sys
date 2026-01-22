import { Schema, type t } from './common.ts';
import { schema } from './u.manfest.schema.ts';

export const standard: t.TimecodePlaybackManifestSchemaLib['standard'] = (args) => {
  const sch = schema(args);
  return Schema.toStandardSchema(sch);
};

export const parse: t.TimecodePlaybackManifestSchemaLib['parse'] = <P = unknown>(
  input: unknown,
  args: { payload?: t.TSchema } = {},
) => {
  const sch = schema(args);
  if (Schema.Value.Check(sch, input)) {
    return { ok: true as const, value: input as t.PlaybackManifest<P> };
  }

  const errors = Array.from(Schema.Value.Errors(sch, input));
  return { ok: false as const, errors };
};
