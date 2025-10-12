/**
 * Types for the YAML → Schema pipeline.
 */
import type { t } from './common.ts';
export type * from './t.Slug.Error.ts';

/**
 * Namespace: tools within the YAML pipeline related to slug interpretation.
 */
export type YamlSlugLib = {
  /** Semantic Slug domain tools (registry-aware validators, helpers). */
  readonly Domain: t.SlugDomainLib;

  /** Error helpers. */
  readonly Error: t.YamlSlugErrorLib;

  /** Extract and validate a slug from YAML. */
  readonly fromYaml: t.SlugFromYaml;
};

/**
 * Extract and validate a slug from YAML.
 * Returns the candidate slug, parse AST, and any errors.
 */
export type SlugFromYaml = (
  input: string | t.Yaml.Ast,
  path?: t.ObjectPath | string,
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
