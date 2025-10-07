import type { t } from './common.ts';

/**
 * Tools for handling YAML slug errors.
 */
export type YamlSlugErrorLib = {
  /** Normalize schema/semantic YAML diagnostics. */
  readonly normalize: (
    yaml: t.SlugFromYamlResult,
    opts: t.YamlSlugErrorNormalizeOptions | t.PathMode,
  ) => readonly t.Yaml.Diagnostic[];

  /** Enrich validation errors with AST node ranges (mutates array in-place). */
  readonly attachSemanticRanges: (ast: t.Yaml.Ast, errs: t.Schema.ValidationError[]) => void;
};

/** Options passed to `Error.normalise` method. */
export type YamlSlugErrorNormalizeOptions = { pathMode?: t.PathMode };

/**
 * Categorised errors from the YAML parse + validation pipeline of slugs.
 */
export type SlugYamlErrors = {
  /** Parser errors reported by the YAML library. Low-level syntax/parse issues before schema or semantic checks. */
  readonly yaml: readonly t.Schema.YamlError[];

  /** Shape violations from schema validation (e.g. wrong types). Structural = "does it match the schema shape?". */
  readonly schema: readonly t.Schema.ValidationError[];

  /** Higher-order semantic rule violations (e.g. alias collisions). Semantic = "is the object logically valid?". */
  readonly semantic: readonly t.Schema.ValidationError[];
};
