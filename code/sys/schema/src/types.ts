/**
 * @module types
 */
import type { t } from './common.ts';

/** Type-level inference helper. */
export type Infer<S extends t.TSchema> = t.Static<S>;

/**
 * Library:
 */
export type * from './m.core.recipe/t.ts';
export type * from './m.core.schema/t.ts';
export type * from './m.testing/t.ts';
export type * from './t.namespace.ts';
export type * from './t.typebox.ts';

export type * from './m.model.slug/t.ts';
export type * from './m.model.timecode.playback/t.ts';
