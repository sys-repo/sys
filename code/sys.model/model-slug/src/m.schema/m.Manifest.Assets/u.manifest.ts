import { Schema, type t } from './common.ts';
import { schema } from './u.manifest.schema.ts';

export const standard: t.SlugAssetsManifestSchemaLib['standard'] = () => {
  const sch = schema();
  return Schema.toStandardSchema(sch);
};

export const parse: t.SlugAssetsManifestSchemaLib['parse'] = (input, args) => {
  const sch = schema();
  if (Schema.Value.Check(sch, input)) {
    return { ok: true, value: input as t.SlugAssetsManifest };
  }

  const errors = Array.from(Schema.Value.Errors(sch, input));
  return { ok: false as const, errors };
};
