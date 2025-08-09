import type { Type } from '@sinclair/typebox';
import type { AssertError, Value } from '@sinclair/typebox/value';

/**
 * "Standard Schema" (Typescript/JSONSchema) tools:
 * ```
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
}>;

/** Response returned from the `Schema.try` method. */
export type SchemaTryResult<T> = { ok: boolean; value?: T; error?: AssertError['error'] };
