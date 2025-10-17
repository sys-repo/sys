/**
 * @module Catalog-Types
 */
import type { t } from './common.ts';

/**
 * Library:
 */
export type * from './m.slug/t.ts';
export type * from './m.yaml/t.ts';
export type * from './ui/use.Slug/t.ts';

/** Catalog Id union. */
export type CatalogId = 'VideoRecorder:view';

/** Catalog Slot union. */
export type CatalogSlot = never;
export type * from './ui/ui.VideoRecorder/t.ts';
