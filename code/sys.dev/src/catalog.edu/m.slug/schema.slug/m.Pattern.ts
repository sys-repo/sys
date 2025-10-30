import { type t } from './common.ts';

/**
 * Common Schema Patterns.
 */
export const Pattern: t.SlugSchemaPatternLib = {
  idPattern() {
    return {
      description: `Stable identifier. Must start with a lowercase letter or number; may contain lowercase letters, numbers, hyphens, and periods (e.g. "video.player-01").`,
      pattern: '^[a-z0-9][a-z0-9.-]*$',
    };
  },

  crdtRefPattern() {
    const BASE62 = '[A-Za-z0-9]{28}';
    const SEG = '[A-Za-z0-9][A-Za-z0-9._\\-]*';
    const PATH = `(?:\\/${SEG}(?:\\/${SEG})*)?`;
    const pattern =
      `^(?:` + `crdt:create` + `|crdt:${BASE62}${PATH}` + `|urn:crdt:${BASE62}${PATH}` + `)$`;
    return {
      description: `CRDT reference: "crdt:create" | crdt:<uuid|base62-28>[/path] | urn:crdt:<uuid|base62-28>[/path]`,
      pattern,
    };
  },
} as const;
