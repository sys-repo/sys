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
    const UUID = '[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}';
    const ID = `(?:${BASE62}|${UUID})`;
    const SEG = '[A-Za-z0-9][A-Za-z0-9._\\-]*'; //    Each segment must start with [A-Za-z0-9] (prevents "." and "..")
    const PATH = `(?:\\/${SEG}(?:\\/${SEG})*)?`; //   (optional) "/seg(/seg)*"
    const pattern =
      `^(?:` +
      `crdt:create` + //              literal create
      `|crdt:${ID}${PATH}` + //       crdt:<id>[/path]
      `|urn:crdt:${ID}${PATH}` + //   urn:crdt:<id>[/path]
      `)$`;

    return {
      description: `CRDT ref: "crdt:create" | crdt:<uuid|base62-28>[/path] | urn:crdt:<uuid|base62-28>[/path]`,
      pattern,
    };
  },
} as const;
