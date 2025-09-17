import type { t } from './common.ts';

/**
 * Tools for converting raw parser/validator errors
 * into structured error objects with normalized paths.
 */
export type ErrorMapLib = {
  /** Map schema errors to validation errors with optional ranges. */
  schema(ast: t.Yaml.Ast, errors: Iterable<t.Schema.ValueError>): t.SchemaValidationError[];

  /** Map raw YAML parser errors to structured YAML errors. */
  yaml(errors: t.Yaml.Error[]): t.SchemaYamlError[];
};

/**
 * Base diagnostic shape shared by all error kinds.
 */
type ErrorBase = {
  readonly path: t.ObjectPath;
  readonly message: string;
  readonly range?: t.Yaml.Range;
};

/**
 * Schema/semantic validation error.
 */
export type SchemaValidationError = ErrorBase & { readonly kind: 'schema' | 'semantic' };

/**
 * YAML parse error (low-level syntax).
 * - Preserves all original fields from `Yaml.Error`
 *   while still projecting onto the common diagnostic surface.
 */
export type SchemaYamlError = ErrorBase & {
  readonly kind: 'yaml';
  readonly yaml: t.Yaml.Error;
};

/**
 * Unified diagnostic error type.
 */
export type SchemaError = SchemaValidationError | SchemaYamlError;
