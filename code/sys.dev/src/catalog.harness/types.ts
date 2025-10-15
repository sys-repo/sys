/**
 * @module
 * Catalog Types
 */
import type { t } from './common.ts';

/** Catalog Id union. */
export type CatalogId = 'Harness:view';

/** Catalog Slot union. */
export type CatalogSlot = 'left' | 'right';

/**
 * UI:
 */
export type * from './ui/Harness/t.ts';
