/**
 * Canonical trait ids for this schema registry.
 */
export const TRAIT_IDS = [
  //
  'view-renderer',
  'slug-tree',
  'concept-layout',
  'file-list',
  'timecode-map',
  'video-player',
  'video-recorder',
] as const;

/**
 * Narrow union derived from the canonical list above.
 */
export type SchemaTraitId = (typeof TRAIT_IDS)[number];
