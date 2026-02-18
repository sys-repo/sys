import { type t, Schema } from '../common.ts';

export const PullYamlSchema = {
  initial(docName = 'default'): t.PullTool.ConfigYaml.Doc {
    return { name: docName };
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(PullYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(PullYamlSchema.schema, value)];
    return { ok, errors } as const;
  },

  schema: Schema.Type.Object(
    {
      name: Schema.Type.String(),
    },
    { additionalProperties: false },
  ),
} as const;
