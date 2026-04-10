import { type t, Schema, Yaml } from './common.ts';

const Type = Schema.Type;

/**
 * Profile config YAML schema.
 */
export const ProfileSchema = {
  initial(): t.PiCliProfiles.Yaml.Profile {
    return { args: [], read: [], env: {} };
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(ProfileSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(ProfileSchema.schema, value)];
    return { ok, errors } as const;
  },

  stringify(doc: t.PiCliProfiles.Yaml.Profile): string {
    const res = Yaml.stringify(doc);
    if (res.error || !res.data) return '';
    return res.data;
  },

  schema: Type.Object(
    {
      args: Type.Optional(Type.Array(Type.String())),
      read: Type.Optional(Type.Array(Type.String())),
      env: Type.Optional(Type.Record(Type.String(), Type.String())),
    },
    { additionalProperties: false },
  ),
} as const;
