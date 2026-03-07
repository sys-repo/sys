/**
 * @module
 * Schema Recipes (core grammar layer)
 *
 * ---------------------------------------------------------------------------
 * Overview:
 * This module defines the *pure value grammar* used to describe schemas
 * without binding to any specific runtime library (e.g. TypeBox).
 * Recipes are plain JSON-compatible objects that can later be compiled
 * into concrete `t.TSchema` structures via `toSchema`.
 *
 * Layering (schema build pipeline):
 *
 *   @sys/schema/recipe   → Pure value constructors (V.*) and recipe grammar.
 *   @sys/schema/pattern  → Reusable schema "patterns" composed from recipes or TypeBox.
 *   @sys/schema          → Published concrete TypeBox schemas with $id, titles, etc.
 *
 * ---------------------------------------------------------------------------
 * Invariants:
 * - Recipes are side-effect-free, fully serializable, and JSX-safe.
 * - No `TypeBox` imports or bindings within this layer.
 * - Each option corresponds to an actual JSON Schema feature.
 * - Add new kinds or fields additively; never overload existing semantics.
 *
 * ---------------------------------------------------------------------------
 * Example:
 *   import { V, toSchema } from '@sys/schema/recipe';
 *
 *   const person = V.object({
 *     name: V.string({ minLength: 1 }),
 *     age:  V.number({ minimum: 0 }),
 *   });
 *
 *   const schema = toSchema(person);
 *   // → TypeBox TSchema equivalent
 */
export { Value as V, Value } from './m.Value.ts';
export { toSchema } from './u.toSchema.ts';
