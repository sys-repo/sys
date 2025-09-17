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
  input: string | t.YamlAst,
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

  /** The parsed YAML AST (hand back for editor decoration mapping). */
  readonly ast: t.YamlAst;

  /** Candidate slug value (only present when ok=true). */
  readonly slug?: unknown;

  readonly errors: {
    /** Shape violations from schema validation (e.g. wrong types). Structural = "does it match the schema shape?". */
    readonly schema: readonly { path: t.ObjectPath; message: string }[];

    /** Higher-order semantic rule violations (e.g. alias collisions). Semantic = "is the object logically valid?". */
    readonly semantic: readonly { path: t.ObjectPath; message: string }[];

    /** Parser errors reported by the YAML library. Low-level syntax/parse issues before schema or semantic checks. */
    readonly yaml: readonly t.YamlError[];
  };
};
