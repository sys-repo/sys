import type { Type } from '@sinclair/typebox';
import type { Value, AssertError } from '@sinclair/typebox/value';

export type { Static } from '@sinclair/typebox';
export type { AssertError } from '@sinclair/typebox/value';

/**
 * "Standard Schema" (Typescript/JSONSchema) tools:
 * runtime type builder for:
 *
 *    - Static type checking with Typescript.
 *    - Runtime reflection via JSONSchema.
 *
 * Refs:
 *    - https://standardschema.dev
 *    - https://json-schema.org
 *    - https://github.com/sinclairzx81/typebox
 *
 * @example
 * ```ts
 *    import { Schema, type Static } from '@sys/std/schema';
 *
 *    // Define the type:                                   // ← (is an augmented valid JSONSchema object)
 *    const T = Type.Object({
 *      id: Type.Integer(),
 *      name: Type.Optional(Type.String()),
 *    });
 *
 *    // Infer TS type:
 *    type T = Static<T>
 *
 *    // Runtime:
 *    const cleaned = Value.Clean(T, Value.Clone(value));   // ← (remove values not in the type)
 *    const isValid = Value.Check(T, { id: 0 });            // ← true
 *    Value.Assert(T, { foo: 'fail' });                     // ← throws
 * ```
 */
export type SchemaLib = Readonly<{
  /** Type builder with static type inference. */
  Type: typeof Type;
  Value: typeof Value;

  /**
   * @example
   * ```ts
   *    const value = Schema.try(() => Schema.Value.Parse(MySchema, { T }));
   * ```
   */
  try<T>(fn: () => T | undefined): SchemaTryResult<T>;
}>;

/** Response returned from the `Schema.try` method. */
export type SchemaTryResult<T> = { ok: boolean; value?: T; error?: AssertError['error'] };
