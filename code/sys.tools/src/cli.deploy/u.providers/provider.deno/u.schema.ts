import { type t, Schema } from '../common.ts';

/**
 * Deno provider runtime schema.
 *
 * Authoritative validation for `provider:` blocks in endpoint YAML.
 * Keep this strict and boring.
 */
export const DenoProviderSchema = {
  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(DenoProviderSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(DenoProviderSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * Typed initial value.
   * (Useful for scaffolding.)
   */
  initial(): t.DenoProvider {
    return { kind: 'deno', app: '' };
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      kind: Schema.Type.Literal('deno'),
      app: Schema.Type.String(),
      org: Schema.Type.Optional(Schema.Type.String()),
      tokenEnv: Schema.Type.Optional(Schema.Type.String()),
      verifyPreview: Schema.Type.Optional(Schema.Type.Boolean()),
    },
    { additionalProperties: false },
  ),
} as const;
