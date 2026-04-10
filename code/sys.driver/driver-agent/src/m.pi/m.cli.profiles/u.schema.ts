import { type t, Schema, Yaml } from './common.ts';

const Type = Schema.Type;

/**
 * Environment profile YAML schema.
 */
export const ProfileSetSchema = {
  initial(): t.PiCliProfiles.Yaml.ProfileSet {
    return { profiles: [{ name: 'default', args: [], read: [], env: {} }] };
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(ProfileSetSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(ProfileSetSchema.schema, value)];
    return { ok, errors } as const;
  },

  stringify(doc: t.PiCliProfiles.Yaml.ProfileSet): string {
    const res = Yaml.stringify(doc);
    if (res.error || !res.data) return '';
    return res.data;
  },

  schema: Type.Object(
    {
      profiles: Type.Array(
        Type.Object(
          {
            name: Type.String({ minLength: 1 }),
            args: Type.Optional(Type.Array(Type.String())),
            read: Type.Optional(Type.Array(Type.String())),
            env: Type.Optional(Type.Record(Type.String(), Type.String())),
          },
          { additionalProperties: false },
        ),
        { minItems: 1 },
      ),
    },
    { additionalProperties: false },
  ),
} as const;
