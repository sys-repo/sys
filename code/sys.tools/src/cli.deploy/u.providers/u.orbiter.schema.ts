import { Schema } from '../common.ts';
import type { t } from '../common.ts';

/**
 * Orbiter provider runtime schema.
 *
 * Authoritative validation for `provider:` blocks in endpoint YAML.
 * Keep this strict and boring.
 */
export const OrbiterProviderSchema = {
  /**
   * TypeBox schema.
   */
  schema: Schema.Type.Object(
    {
      kind: Schema.Type.Literal('orbiter'),

      /** Stable site identifier used by Orbiter. */
      siteId: Schema.Type.String(),

      /** Logical domain / bucket name (eg "fs"). */
      domain: Schema.Type.String(),

      /**
       * Directory Orbiter serves from.
       * Relative to the endpoint staging dir.
       */
      buildDir: Schema.Type.String(),

      /**
       * Optional build command.
       * Commonly "echo no-op" when build is handled upstream.
       */
      buildCommand: Schema.Type.Optional(Schema.Type.String()),
    },
    {
      additionalProperties: false,
    },
  ),

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
    return {
      kind: 'orbiter',
      siteId: '',
      domain: '',
      buildDir: 'dist',
    };
  },
} as const;
