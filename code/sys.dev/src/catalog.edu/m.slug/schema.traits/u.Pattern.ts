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
  refCrdt: {
    description: `Accepts "crdt:<uuid|base62-28>/[optional/path]" or "urn:crdt:<uuid|base62-28>/[optional/path]" or "crdt:create".`,
    pattern: `^(?:crdt:create|(?:urn:)?crdt:(?:[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}|[A-Za-z0-9]{28})(?:/[A-Za-z0-9._\\-/]*)?)$`,
  },
} as const;
