import { CrdtIs } from './m.Is.ts';
import type { t } from './common.ts';

const URI_PREFIX = 'crdt:';

/**
 * Helpers for recognising, parsing, formatting, and normalising CRDT Ids/URIs.
 */
export const CrdtId: t.CrdtIdLib = {
  /**
   * Extract a CRDT Id from a URI string; returns undefined if not valid.
   * Expects a string of the form "crdt:<id>" where <id> is a valid document id.
   */
  fromUri(value) {
    if (typeof value !== 'string') return undefined;
    if (!value.startsWith(URI_PREFIX)) return undefined;

    const id = value.slice(URI_PREFIX.length);
    return CrdtIs.id(id) ? id : undefined;
  },

  /**
   * Format a CRDT Id as a URI string ("crdt:<id>").
   * Assumes the given id is already valid.
   */
  toUri(id) {
    return `${URI_PREFIX}${id}`;
  },

  /**
   * Normalise / "clean" an incoming Id or URI to a bare Id.
   * - Accepts either a bare id or a "crdt:<id>" URI.
   * - Throws if the input is not a valid id or URI.
   */
  clean(value) {
    if (typeof value !== 'string') {
      throw new Error('CrdtId.clean: value must be a string.');
    }

    const fromUri = CrdtId.fromUri(value);
    if (fromUri) return fromUri;
    if (CrdtIs.id(value)) return value;

    throw new Error(`CrdtId.clean: invalid CRDT id or uri: "${value}"`);
  },
};
