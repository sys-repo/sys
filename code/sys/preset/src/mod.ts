/**
 * @module
 * Curated dependency preset aliases for @sys projects.
 *
 * Groups stable @sys import mappings into named preset surfaces.
 * Reduces import-map churn while keeping dependency composition explicit.
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * All Presets
 */
export * from './m.ui.ts';
export * from './m.testing.ts';
export * from './m.core.ts';
export * from './m.build.ts';

import * as Ext from './m.ext.ts';
export { Ext };
