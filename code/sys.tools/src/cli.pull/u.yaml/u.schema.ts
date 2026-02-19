import { type t, Schema } from '../common.ts';

export const PullYamlSchema = {
  initial(): t.PullTool.ConfigYaml.Doc {
    return { dir: '.' };
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(PullYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(PullYamlSchema.schema, value)];
    return { ok, errors } as const;
  },

  schema: Schema.Type.Object(
    {
      dir: Schema.Type.Union([Schema.Type.Literal('.'), Schema.Type.String()]),
      remoteBundles: Schema.Type.Optional(
        Schema.Type.Array(
          Schema.Type.Object(
            {
              remote: Schema.Type.Object(
                { dist: Schema.Type.String() },
                { additionalProperties: false },
              ),
              local: Schema.Type.Object(
                { dir: Schema.Type.String() },
                { additionalProperties: false },
              ),
              lastUsedAt: Schema.Type.Optional(Schema.Type.Number()),
            },
            { additionalProperties: false },
          ),
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;
