import { type t, Schema } from '../common.ts';

/**
 * Orbiter provider runtime schema.
 *
 * Authoritative validation for `provider:` blocks in endpoint YAML.
 * Keep this strict and boring.
 *
 * Note:
 * - This schema reflects the YAML-authored provider config (what the user writes).
 * - Any derived/runtime execution fields (eg buildDir/buildCommand) belong to the
 *   push/runtime layer, not the authored provider config.
 */
export const OrbiterProviderSchema = {
  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(OrbiterProviderSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(OrbiterProviderSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * Typed initial value.
   * (Useful for scaffolding.)
   */
  initial(): t.OrbiterProvider {
    return { kind: 'orbiter', siteId: '', domain: '' };
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      kind: Schema.Type.Literal('orbiter'),

      /** Stable site identifier used by Orbiter. */
      siteId: Schema.Type.String(),

      /** Logical domain / bucket name. */
      domain: Schema.Type.String(),

      /** Optional shard deployment config. */
      shards: Schema.Type.Optional(
        Schema.Type.Object(
          {
            total: Schema.Type.Number(),
            enabled: Schema.Type.Optional(Schema.Type.Array(Schema.Type.Number())),
            siteIds: Schema.Type.Optional(
              Schema.Type.Record(Schema.Type.String(), Schema.Type.String()),
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;
