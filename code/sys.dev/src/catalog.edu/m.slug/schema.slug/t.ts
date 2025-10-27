import type { t } from './common.ts';
import { TraitBindingSchema } from './schema.trait.ts';

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
export type SlugTraitId = t.StringId;

/**
 * Local alias bound to a trait instance.
 * - Human-readable display key within a slug.
 * - Allows multiple instances of the same trait type under different aliases.
 */
export type SlugTraitAlias = string;

/**
 * Canonical trait-binding type.
 */
export type SlugTraitBinding = t.Infer<typeof TraitBindingSchema>;

/**
 * Utility: Narrowed binding for a specific trait-id.
 */
export type SlugTraitBindingOf<K extends SlugTraitBinding['of']> = Omit<SlugTraitBinding, 'of'> & {
  readonly of: K;
};

/**
 * Common schema patterns.
 */
export type SlugSchemaPatternLib = {
  /**
   * Reference to a CRDT document address.
   * Accepts either:
   * - "crdt:<base62-28>/[optional/path]"
   * - "urn:crdt:<base62-28>/[optional/path]"
   * - "crdt:create"
   */
  crdtRefPattern(): SlugSchemaPattern;

  /**
   * Stable identifier for traits, aliases, or other named entities.
   * Accepts strings such as:
   * - "video"
   * - "video-player"
   * - "video.player-01"
   *
   * Must begin with a lowercase letter or number,
   * and may contain lowercase letters, numbers, hyphens, or periods.
   */
  idPattern(): SlugSchemaPattern;
};

/** Definition of a slug pattern */
export type SlugSchemaPattern = {
  readonly description: string;
  readonly pattern: string;
};
