import { type t, V } from './common.ts';

type L = t.SlugPatternLib['Ref'];

const BASE62 = '[A-Za-z0-9]{28}';
const SEG = '[A-Za-z0-9][A-Za-z0-9._\\-]*';
const PATH = `(?:\\/${SEG}(?:\\/${SEG})*)?`;
export const CRDT_PATTERN = `^(?:crdt:create|(?:crdt|urn:crdt):(self|${BASE62})${PATH})$`;

/**
 * CRDT reference:
 *   - "crdt:create"
 *   - "crdt:self"           // no path (legacy)        ← still matched via optional PATH
 *   - "crdt:self[/path]"    // self behaves like an id
 *   - crdt:<base62-28>[/path]
 *   - urn:crdt:self[/path]
 *   - urn:crdt:<base62-28>[/path]
 */
export const CrdtRef: L['Crdt'] = (o = {}) => {
  return V.string({
    pattern: CRDT_PATTERN,
    description: `CRDT reference ("crdt:create" or "self"/base62 id with optional /path).`,
    ...o,
  }) as ReturnType<L['Crdt']>;
};
