import type { t } from './common.ts';

/**
 * Stable, unique identifier of the slug.
 * - Machine-oriented.
 * - Guaranteed unique across the containing document.
 */
export type SlugId = t.StringId;

/**
 * Identifier of a trait type expressed by the slug.
 * - Chosen from the registered trait library (e.g. "video", "image-sequence").
 */
export type TraitId = t.StringId;

/**
 * Local alias bound to a trait instance.
 * - Human-readable display key within a slug.
 * - Allows multiple instances of the same trait type under different aliases.
 */
export type TraitAlias = string;

/**
 * Definition of a registered trait type and its schema.
 */
export type TraitEntry = {
  readonly id: TraitId;
  readonly propsSchema: t.TSchema;
};

/**
 * Collection of trait definitions with lookup utilities.
 */
export type TraitRegistry = {
  readonly all: readonly TraitEntry[];
  get(id: TraitId): TraitEntry | undefined;
};
