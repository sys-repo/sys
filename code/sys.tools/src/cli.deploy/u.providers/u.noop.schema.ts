import { Schema } from '../common.ts';
import type { t } from '../common.ts';

/**
 * No-op provider runtime schema.
 *
 * Authoritative validation for `provider:` blocks in endpoint YAML.
 * This provider is intentionally inert.
 */
export const NoopProviderSchema = {
  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(NoopProviderSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(NoopProviderSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * Typed initial value.
   * (Useful for scaffolding.)
   */
  initial(): t.NoopProvider {
    return { kind: 'noop' };
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    { kind: Schema.Type.Literal('noop') },
    { additionalProperties: false },
  ),
} as const;
