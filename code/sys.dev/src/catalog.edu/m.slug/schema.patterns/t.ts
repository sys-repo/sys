import type { t } from './common.ts';

/**
 * Common schema patterns.
 */
export type SlugSchemaPatternLib = {
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

  /**
   * Reference to a CRDT document address.
   * Accepts either:
   * - "crdt:create"
   * - "crdt:<base62-28>/[optional/path]"
   * - "crdt:<uuid>/[optional/path]"                // 8-4-4-4-12 hex
   * - "urn:crdt:<base62-28>/[optional/path]"
   * - "urn:crdt:<uuid>/[optional/path]"
   */
  crdtRefPattern(): SlugSchemaPattern;
};

/**
 * Definition of a slug pattern.
 * Can define a single `pattern` or an `anyOf` variant (e.g. literal + regex).
 */
export type SlugSchemaPattern = {
  readonly description: string;
  readonly pattern: string;
};
