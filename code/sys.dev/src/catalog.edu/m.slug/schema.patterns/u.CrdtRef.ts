import { type t, V } from './common.ts';

type L = t.SlugPatternLib;

const BASE62 = '[A-Za-z0-9]{28}';
const SEG = '[A-Za-z0-9][A-Za-z0-9._\\-]*';
const PATH = `(?:\\/${SEG}(?:\\/${SEG})*)?`;
export const CRDT_PATTERN = `^(?:crdt:create|crdt:${BASE62}${PATH}|urn:crdt:${BASE62}${PATH})$`;

/**
 * CRDT reference:
 *   - "crdt:create"
 *   - crdt:<base62-28>[/path]
 *   - urn:crdt:<base62-28>[/path]
 */
export const CrdtRef: L['CrdtRef'] = (o = {}) => {
  return V.string({
    pattern: CRDT_PATTERN,
    description: `CRDT reference ("crdt:create" or base62 id with optional /path).`,
    ...o,
  }) as ReturnType<L['CrdtRef']>;
};
