type P = {
  description: string;
  pattern: string;
};

/**
 * Common Schema Patterns.
 */
export const Pattern = {
  /**
   * Reference to a CRDT document address.
   * Accepts either:
   * - "crdt:<base62-28>/[optional/path]"
   * - "urn:crdt:<base62-28>/[optional/path]"
   * - "crdt:create"
   */
  crdtRefPattern(): P {
    return {
      description: `Accepts "crdt:<uuid|base62-28>/[optional/path]" or "urn:crdt:<uuid|base62-28>/[optional/path]" or "crdt:create".`,
      pattern: `^(?:crdt:create|(?:urn:)?crdt:(?:[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}|[A-Za-z0-9]{28})(?:/[A-Za-z0-9._\\-/]*)?)$`,
    };
  },

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
  idPattern(): P {
    return {
      description: `Stable identifier. Must start with a lowercase letter or number; may contain lowercase letters, numbers, hyphens, and periods (e.g. "video.player-01").`,
      pattern: '^[a-z0-9][a-z0-9.-]*$',
    };
  },
} as const;
