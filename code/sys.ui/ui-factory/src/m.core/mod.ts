/**
 * @module @sys/ui-factory/core
 *
 * Tiny primitives for declarative UI composition.
 * A factory is pure data (specs) plus a lazy view loader.
 *
 * Concepts:
 * - ViewId: stable identifier for a view implementation.
 * - ViewSpec: authoring contract (id, schema, slots).
 * - Registration: { spec, load } pair binding contract to code.
 * - Factory: read-only registry + late-bound getView(id).
 *
 * Notes:
 * - schema is TypeBox `TSchema` (i.e., JSON Schema at runtime).
 * - slots are named attachment points a view exposes for child views.
 * - Rendering, prop resolution, and validation live above this layer.
 */
export { Factory } from './m.Factory.ts';
