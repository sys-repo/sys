import type { t } from './common.ts';

/**
 * Tools for converting raw parser/validator errors
 * into structured `SchemaValidationError` objects
 * with normalized paths and optional source ranges.
 */
export type ErrorMapperLib = {
  /** Map schema errors to validation errors with optional ranges. */
  schema(ast: t.Yaml.Ast, errors: Iterable<t.Schema.ValueError>): t.SchemaValidationError[];

  /** Map raw YAML parser errors to validation errors. */
  yaml(errors: t.Yaml.Error[]): t.SchemaValidationError[];
};

/**
 * Generic validation error object.
 * - `path`:    logical object path (decoded JSON Pointer).
 * - `message`: human-readable description of the failure.
 * - `range`:   optional source range when available (e.g. YAML AST).
 */
export type SchemaValidationError = {
  readonly path: t.ObjectPath;
  readonly message: string;
  readonly range?: t.Yaml.Range;
};
