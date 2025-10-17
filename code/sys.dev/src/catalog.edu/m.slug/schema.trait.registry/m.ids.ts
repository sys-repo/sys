/** Canonical trait id union for this catalog. */
export const TRAIT_IDS = ['video-player', 'video-recorder'] as const;
export type CatalogTraitId = (typeof TRAIT_IDS)[number];
