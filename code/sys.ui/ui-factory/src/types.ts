/**
 * Module types.
 * @module
 */
import type { t } from './common.ts';

export type * from './m.core/t.ts';
export type * from './m.react/t.ts';
export type * from './m.schema/t.ts';
export type * from './m.tmpl/t.ts';

/**
 * User Interface:
 */
export type * from './ui/-sample.react/t.ts';
export type * from './ui/-sample.tmpl/t.ts';
export type * from './ui/ui.Error.Validation/t.ts';

/**
 * Namespace:
 */
export namespace UiFactory {
  /** Type-level inference helper (Schema → Static type). */
  export type Infer<S extends t.TSchema> = t.Infer<S>;
}
