import { Schema, type t, Yaml } from './common.ts';

const Type = Schema.Type;

/**
 * Profile config YAML schema.
 */
export const ProfileSchema = {
  initial(): t.PiCliProfiles.Yaml.Profile {
    return {
      prompt: { system: null },
      sandbox: {
        capability: { read: [], write: [], env: {} },
        context: { append: [] },
      },
    };
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
      prompt: Type.Optional(
        Type.Object(
          { system: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])) },
          { additionalProperties: false },
        ),
      ),
      sandbox: Type.Optional(
        Type.Object(
          {
            capability: Type.Optional(
              Type.Object(
                {
                  read: Type.Optional(Type.Array(Type.String())),
                  write: Type.Optional(Type.Array(Type.String())),
                  env: Type.Optional(Type.Record(Type.String(), Type.String())),
                },
                { additionalProperties: false },
              ),
            ),
            context: Type.Optional(
              Type.Object(
                { append: Type.Optional(Type.Array(Type.String())) },
                { additionalProperties: false },
              ),
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;
