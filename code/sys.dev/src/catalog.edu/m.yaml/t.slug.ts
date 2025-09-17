/**
 * Types for the YAML → Schema pipeline.
 * - Shared contracts across parse/validate stages.
 */
import type { t } from './common.ts';

/**
 * Namespace: tools within the YAML pipeline related to slug interpretation.
 */
export type YamlSlugLib = {
  /** Extract and validate a slug from YAML */
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
 * - Structural only (no semantic rules).
 * - Keeps parser errors and schema errors distinct.
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
  readonly errors: SlugFromYamlErrors;
};

/**
 * Categorised errors from a YAML parse and validation pipeline of slugs.
 */
export type SlugFromYamlErrors = {
  /** Shape violations from schema validation (e.g. wrong types). Structural = "does it match the schema shape?". */
  readonly schema: readonly t.YamlPipelineError[];

  /** Higher-order semantic rule violations (e.g. alias collisions). Semantic = "is the object logically valid?". */
  readonly semantic: readonly t.YamlPipelineError[];

  /** Parser errors reported by the YAML library. Low-level syntax/parse issues before schema or semantic checks. */
  readonly yaml: readonly t.Yaml.Error[];
};

/**
 * Error object enriched with optional AST range for editor mapping.
 */
export type YamlPipelineError = {
  readonly path: t.ObjectPath;
  readonly message: string;
  readonly range?: t.Yaml.Range;
};
