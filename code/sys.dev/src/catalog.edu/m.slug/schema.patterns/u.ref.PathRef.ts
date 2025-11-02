import { type t, V } from './common.ts';

type L = t.SlugPatternLib;

/**
 * Generic locator string: URL | filesystem path | CRDT path-ref (must include a "/path").
 * Examples:
 *   - URL: "https://example.com/a/b"
 *   - FS : "/abs/path/file.txt", "relative/file.txt"
 *   - CRDT path-ref: "crdt:create/some/path", "crdt:self/foo", "urn:crdt:<id>/bar/baz"
 * Note: plain CRDT ids without a path (e.g., "crdt:self", "urn:crdt:<id>") are NOT considered path-refs.
 */
export const PathRef: L['CrdtRef'] = (o = {}) => {
  return V.string({
    description: `Generic locator string (URL | filesystem path | CRDT path-ref like "crdt:self/...", or "urn:crdt:<id>/..."; CRDT must include a "/path").`,
    ...o,
  }) as ReturnType<L['CrdtRef']>;
};
