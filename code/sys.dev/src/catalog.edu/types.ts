/**
 * @module Catalog-Types
 */

/** Catalog Id union. */
export type CatalogId = 'VideoRecorder:view';

/** Catalog Slot union. */
export type CatalogSlot = never;

/**
 * Library:
 */
export type * from './m.slug.traits/t.ts';
export type * from './m.slug/t.ts';
export type * from './m.yaml/t.ts';
export type * from './ui/-dev/t.ts';
export type * from './ui/ui.SlugHarness/t.ts';
export type * from './ui/ui.VideoRecorder/t.ts';
export type * from './ui/use.Slug/t.ts';
