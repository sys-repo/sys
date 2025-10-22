import type * as Y from 'yaml';

/**
 * Primitive scalar values representable in YAML.
 * Mirrors the JSON scalar domain plus null.
 */
export type YamlPrimitive = null | string | number | boolean;

/**
 * Parsed YAML Abstract Syntax Tree (AST).
 * Uses the upstream YAML library's typed document representation.
 */
export type YamlAst = Y.Document.Parsed;

/**
 * Composite (container) node: either a mapping (object) or a sequence (array).
 * Intentionally loose to accommodate untyped YAML while remaining semantically precise.
 *
 * - Mapping: a string-keyed object carrying <unknown> values.
 * - Sequence: a readonly array carrying <unknown> values.
 *
 * Prefer providing a concrete generic `T` to `YamlValue<T>` when the shape is known.
 */
export type YamlComposite = { readonly [k: string]: unknown } | readonly unknown[];

/**
 * A value produced by parsing YAML.
 *
 * - Defaults to a composite container when no schema is provided (`YamlComposite`).
 * - Accepts a concrete `T` when you have a known schema (e.g., `YamlValue<MySchema>`).
 * - Excludes `undefined` by design; model absence at the field site via `?`.
 */
export type YamlValue<T = YamlComposite> = T | YamlPrimitive;
