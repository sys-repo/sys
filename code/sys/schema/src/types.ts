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

/**
 * Schema common namespace:
 */
export namespace Schema {
  export type Infer<S extends t.TSchema> = t.Static<S>;
  export type ValueError = t.ValueError;
}
