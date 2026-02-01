import { Schema, SlugLintFacets, Yaml, type t } from './common.ts';
import { SchemaFacets } from './u.schema.facets.ts';
import { SchemaSlugTreeFs, SchemaSlugTreeMediaSeqBundle } from './u.schema.slug-tree.ts';
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
      'bundle:slug-tree:fs': {
        include: ['.md'],
        source: '.',
        crdt: { docid: '<docid>', path: '/slug' },
        target: { manifest: ['./manifest/slug-tree.json', './manifest/slug-tree.yaml'] },
      },
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
      'bundle:slug-tree:fs': SchemaSlugTreeFs,
      'bundle:slug-tree:media:seq': SchemaSlugTreeMediaSeqBundle,
    },
    { additionalProperties: false },
  ),
} as const;
