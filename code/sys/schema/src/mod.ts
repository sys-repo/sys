/**
 * "Standard Schema" (Typescript/JSONSchema) tools.
 * Runtime type builder for:
 *  - Static type checking with Typescript.
 *  - Runtime reflection via JSONSchema.
 * @module
 */
export { pkg } from './pkg.ts';
/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { Schema, Type, Value } from './m.Schema/mod.ts';
