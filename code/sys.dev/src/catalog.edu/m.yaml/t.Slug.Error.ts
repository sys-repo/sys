import type { t } from './common.ts';

/**
 * Tools for handling YAML slug errors.
 */
export type YamlSlugErrorLib = {
  /** Normalize schema/semantic YAML diagnostics. */
  readonly normalize: (args: NormalizeSlugErrorsArgs) => readonly t.Yaml.Diagnostic[];
};

type NormalizeSlugErrorsArgs = {
  result: t.SlugFromYamlResult;
  pathMode?: t.PathMode;
};

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
