/**
 * Types for the YAML → Schema pipeline.
 */
import type { t } from './common.ts';

export type * from './t.Slug.err.ts';
export type * from './t.Slug.rules.ts';

/**
 * Namespace: tools within the YAML pipeline related to slug interpretation.
 */
export type YamlSlugLib = {
  /** Semantic Slug domain tools (registry-aware validators, helpers). */
  readonly Domain: t.SlugLib;
  /** Error helpers. */
  readonly Error: t.YamlSlugErrorLib;
  /** Extract and validate a slug from YAML. */
  readonly fromYaml: t.SlugFromYaml;
};

/**
 * Function that converts a trait's YAML authoring form into its canonical
 * schema shape before validation.
 *
 * Example:
 *   normalizeSlugTreeAuthoring(yamlValue) → { items: [...] }
 */
export type YamlTraitNormalizer = (input: unknown) => unknown;

/** A map of trait-normalizers. */
export type TraitNormalizers = Record<string, YamlTraitNormalizer>;

/**
 * Options for `YamlSlug.fromYaml`.
 *
 * These extend the normal validation context with:
 *  - `isKnown`: Registry predicate to test whether a trait ID exists.
 *  - `normalizers`: Optional map of trait-specific YAML → canonical normalizers,
 *    keyed by trait id (e.g. `'slug-tree'`).
 *
 * Each normalizer runs on its corresponding `slug.data[as]` block
 * before schema validation, allowing concise authoring DSLs.
 */
export type SlugFromYamlOptions = {
  /** Trait ID registry check. */
  isKnown?: t.SlugIsKnown;
  /** Trait-specific authoring→canonical transforms, keyed by trait id. */
  normalizers?: t.TraitNormalizers;
};

/**
 * Extract and validate a slug from YAML.
 *
 * Performs parse → normalize (if provided) → schema → semantic validation.
 * Returns the parsed AST, candidate slug, and categorized diagnostics.
 */
export type SlugFromYaml = (
  input: string | t.Yaml.Ast,
  path?: t.ObjectPath | string,
  opts?: SlugFromYamlOptions,
) => SlugFromYamlResult;

/**
 * Result of extracting + validating a slug from YAML.
 */
export type SlugFromYamlResult = {
  /** Overall structural check outcome. */
  readonly ok: boolean;
  /** Path used to locate the slug within the YAML doc. */
  readonly path: t.ObjectPath;
  /** The parsed YAML AST (hand back to editor for decoration mapping). */
  readonly ast: t.Yaml.Ast;
  /** Candidate slug value (only present when ok=true). */
  readonly slug?: unknown;
  /** Categorised errors */
  readonly errors: t.SlugYamlErrors;
};
