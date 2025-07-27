import type { Type } from '@sinclair/typebox';
import type { Value } from '@sinclair/typebox/value';

export type { Static } from '@sinclair/typebox';

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
 *
 */
export type SchemaLib = Readonly<{
  /** Type builder with static type inference. */
  Type: typeof Type;
  Value: typeof Value;
}>;
