/**
 * Canonical trait ids for this schema registry.
 */
export const TRAIT_IDS = [
  //
  'slug-tree',
  'video-player',
  'video-recorder',
  'view-renderer',
  'concept-layout',
  'file-list',
] as const;

/**
 * Narrow union derived from the canonical list above.
 */
export type SchemaTraitId = (typeof TRAIT_IDS)[number];
