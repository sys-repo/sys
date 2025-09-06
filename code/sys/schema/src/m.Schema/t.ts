import type { Type } from '@sinclair/typebox';
import type { Value } from '@sinclair/typebox/value';
import type { t } from './common.ts';

export type * from './t.StdSchema.ts';

/**
 * "Standard Schema" (Typescript/JSONSchema) tools:
 */
export type SchemaLib = {
  /** Type builder with static type inference. */
  readonly Type: typeof Type;
  readonly Value: typeof Value;

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

  /**
   * Type guard: returns true if the value is a Standard Schema v1 object.
   */
  isStandardSchema(x: unknown): x is t.StandardSchemaV1;

  /**
   * Ensure a schema is wrapped as a Standard Schema v1 adapter.
   * (Idempotent — returns the same object if already wrapped.)
   */
  asStandardSchema(schema: unknown, vendor?: string): t.StandardSchemaV1;
};

/** Response returned from the `Schema.try` method. */
export type SchemaTryResult<T> = { ok: true; value: T } | { ok: false; errors: t.ValueError[] };
