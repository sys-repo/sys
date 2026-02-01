import { Schema, SlugLintFacets, Yaml, type t } from './common.ts';
import { SchemaFacets } from './u.schema.facets.ts';
import { formatInlineInclude, formatRootSpacing } from './u.schema.u.ts';

/**
 * Lint profile YAML schema (authoritative config).
 * Runtime validated via JsonSchema (typebox) Value.Check/Errors.
 */
export const LintProfileSchema = {
  /**
   * Typed initial document.
   * (YAML can omit optionals; but having explicit defaults is fine.)
   */
  initial(): t.SlugLintProfile {
    return {
      facets: [...SlugLintFacets],
    };
  },

  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(LintProfileSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(LintProfileSchema.schema, value)];
    return { ok: errors.length === 0, errors } as const;
  },

  /**
   * Serialize a lint profile document to YAML.
   */
  stringify(doc: t.SlugLintProfile): string {
    const raw = Yaml.stringify(doc).data ?? '';
    return formatInlineInclude(formatRootSpacing(raw));
  },

  /**
   * Serialize the initial document to YAML.
   */
  initialYaml(): string {
    return LintProfileSchema.stringify(LintProfileSchema.initial());
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      facets: SchemaFacets,
    },
    { additionalProperties: false },
  ),
} as const;
