/**
 * @module
 * Canonical schema system for TypeScript + JSON Schema.
 *
 * Purpose:
 * - Static type safety via TypeScript.
 * - Runtime reflection and validation via JSON Schema.
 *
 * Layered build pipeline:
 *   1. @sys/schema/recipe   →  pure value grammar (V.*) for declarative schema construction.
 *   2. @sys/schema/pattern  →  reusable composition units built from recipes or TypeBox.
 *   3. @sys/schema          →  finalized, published TypeBox schemas ($id, title, etc.).
 *
 * This module provides the canonical runtime entry points for schema creation,
 * introspection, and composition within the @sys ecosystem.
 */
export { pkg } from './pkg.ts';
/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { Schema, Type, Value } from './m.schema/mod.ts';
