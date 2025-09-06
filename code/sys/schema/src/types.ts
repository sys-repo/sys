/**
 * Module types.
 * @module
 */
import type { t } from './common.ts';

/**
 * Library:
 */
export type * from './m.Schema/t.ts';
export type * from './t.typebox.ts';

/** Type-level inference helper. */
export type Infer<S extends t.TSchema> = t.Static<S>;
