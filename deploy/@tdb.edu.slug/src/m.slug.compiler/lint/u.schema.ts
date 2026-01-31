import { Schema, Yaml } from './common.ts';
import { SlugLintFacets, type t } from './common.ts';
import { SchemaFacets } from './u.schema.facets.ts';
import { SchemaSlugTreeFs } from './u.schema.slug-tree.ts';
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
      'slug-tree:fs:bundle': {
        include: ['.md'],
        source: '.',
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
    if (ok) {
      errors.push(...validateSlugTreeFsConfig(value));
    }
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
      'slug-tree:fs:bundle': SchemaSlugTreeFs,
    },
    { additionalProperties: false },
  ),
} as const;

function validateSlugTreeFsConfig(value: unknown): t.ValueError[] {
  const errors: t.ValueError[] = [];
  const doc = value as Partial<t.SlugLintProfile> | null;
  const slugTree = doc?.['slug-tree:fs:bundle'];
  if (!slugTree || !slugTree.target) return errors;

  const target = slugTree.target;
  const hasSha256 = hasSha256Target(target.dir);
  const hasJsonManifest = hasJsonTarget(target.manifest);
  const hasRef = typeof target.crdt?.ref === 'string' && target.crdt.ref.length > 0;

  if (hasSha256 && hasJsonManifest && !hasRef) {
    errors.push({
      path: 'slug-tree:fs:bundle.target.crdt.ref',
      message: 'Required when slug-tree:fs:bundle emits a JSON manifest with sha256 outputs.',
    } as t.ValueError);
  }

  return errors;
}

function hasSha256Target(
  dir?: t.StringPath | t.LintSlugTreeTargetDir | readonly t.LintSlugTreeTargetDir[],
): boolean {
  if (!dir) return false;
  if (typeof dir === 'string') return false;
  const list = Array.isArray(dir) ? dir : [dir];
  return list.some((item) => item?.kind === 'sha256');
}

function hasJsonTarget(input?: t.StringPath | readonly t.StringPath[]): boolean {
  if (!input) return false;
  const list = Array.isArray(input) ? input : [input];
  return list.some((value) => String(value).trim().toLowerCase().endsWith('.json'));
}
