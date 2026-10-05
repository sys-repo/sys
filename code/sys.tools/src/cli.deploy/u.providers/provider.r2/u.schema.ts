import { type t, Schema } from '../common.ts';

const nonEmpty = Schema.Type.String({ minLength: 1, pattern: '\\S' });

/**
 * R2 provider runtime schema.
 *
 * Authoritative validation for `provider:` blocks in endpoint YAML.
 * Keep this strict and R2-shaped; S3-compatible details stay below the driver seam.
 */
export const R2ProviderSchema = {
  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(R2ProviderSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(R2ProviderSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * Typed initial value.
   * (Useful for scaffolding.)
   */
  initial(): t.R2Provider {
    return {
      kind: 'r2',
      accountId: '',
      bucket: '',
      prefix: '',
      credentials: { accessKeyId: '', secretAccessKey: '' },
    };
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      kind: Schema.Type.Literal('r2'),
      accountId: nonEmpty,
      bucket: nonEmpty,
      prefix: nonEmpty,
      readOrigin: Schema.Type.Optional(nonEmpty),
      credentials: Schema.Type.Object(
        {
          accessKeyId: nonEmpty,
          secretAccessKey: nonEmpty,
          sessionToken: Schema.Type.Optional(nonEmpty),
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
} as const;
