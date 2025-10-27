import { type t } from './common.ts';

/**
 * Common Schema Patterns.
 */
export const Pattern: t.SlugSchemaPatternLib = {
  crdtRefPattern() {
    return {
      description: `Accepts "crdt:<uuid|base62-28>/[optional/path]" or "urn:crdt:<uuid|base62-28>/[optional/path]" or "crdt:create".`,
      pattern: `^(?:crdt:create|(?:urn:)?crdt:(?:[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}|[A-Za-z0-9]{28})(?:/[A-Za-z0-9._\\-/]*)?)$`,
    };
  },

  idPattern() {
    return {
      description: `Stable identifier. Must start with a lowercase letter or number; may contain lowercase letters, numbers, hyphens, and periods (e.g. "video.player-01").`,
      pattern: '^[a-z0-9][a-z0-9.-]*$',
    };
  },
} as const;
