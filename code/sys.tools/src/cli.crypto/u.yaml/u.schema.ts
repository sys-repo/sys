import { type t, Schema } from '../common.ts';

export const CryptoYamlSchema = {
  initial(docName = 'default'): t.CryptoTool.ConfigYaml.Doc {
    return { name: docName };
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(CryptoYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(CryptoYamlSchema.schema, value)];
    return { ok, errors } as const;
  },

  schema: Schema.Type.Object({ name: Schema.Type.String() }, { additionalProperties: false }),
} as const;
