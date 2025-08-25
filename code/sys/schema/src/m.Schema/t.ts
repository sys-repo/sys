import type { Type } from '@sinclair/typebox';
import type { Value } from '@sinclair/typebox/value';
import type { t } from './common.ts';

export type * from './t.standard-schema.ts';

/**
 * "Standard Schema" (Typescript/JSONSchema) tools:
 */
export type SchemaLib = Readonly<{
  /** Type builder with static type inference. */
  Type: typeof Type;
  Value: typeof Value;

  /**
   * @example
   * ```ts
   * const value = Schema.try(() => Schema.Value.Parse(MySchema, { T }));
   * ```
   */
  try<T>(fn: () => T | undefined): SchemaTryResult<T>;

  /**
   * Wrap a JSON Schema (e.g. TypeBox) with a Standard Schema v1 adapter.
   * ref: https://standardschema.dev
   *
   * - Pure adapter: does not mutate the original schema.
   * - Strict semantics: mirrors Value.Check/Value.Errors (no coercion).
   * - `vendor` defaults to "sys" (override if needed).
   */
  toStandardSchema<S extends t.TSchema, TOut = t.Static<S>>(
    schema: S,
    vendor?: string,
  ): t.StandardSchemaV1<unknown, TOut>;
}>;

/** Response returned from the `Schema.try` method. */
export type SchemaTryResult<T> = { ok: true; value: T } | { ok: false; errors: t.ValueError[] };
