import { type t, V } from './common.ts';

/**
 * Stable identifier: starts [a-z0-9], allows [a-z0-9.-]
 * Example: "video.player-01"
 */
const ID_DESC = 'Stable identifier (start: [a-z0-9]; allowed: [a-z0-9.-]).';
export const ID_PATTERN = '^[a-z0-9][a-z0-9.-]*$';

/**
 * CRDT ref:
 *   - "crdt:create"
 *   - crdt:<base62-28>[/path]
 *   - urn:crdt:<base62-28>[/path]
 */
const BASE62 = '[A-Za-z0-9]{28}';
const SEG = '[A-Za-z0-9][A-Za-z0-9._\\-]*';
const PATH = `(?:\\/${SEG}(?:\\/${SEG})*)?`;
const CRDT_DESC = 'CRDT reference ("crdt:create" or base62 id with optional /path).';
export const CRDT_PATTERN = `^(?:crdt:create|crdt:${BASE62}${PATH}|urn:crdt:${BASE62}${PATH})$`;

/** Ergonomic option alias for recipe string specs (pattern fixed in builders). */
type StrOpts = Omit<t.Schema.StrSpec, 'kind' | 'pattern'>;

/**
 * Legacy pattern surface (back-compat).
 * Return shape is { description, pattern }.
 */
export const idPattern: t.SlugSchemaPatternLib['idPattern'] = () => ({
  description: `${ID_DESC} e.g. "video.player-01".`,
  pattern: ID_PATTERN,
});

export const crdtRefPattern: t.SlugSchemaPatternLib['crdtRefPattern'] = () => ({
  description: CRDT_DESC,
  pattern: CRDT_PATTERN,
});

/**
 * Value-only recipe builders (compile later via @sys/schema/m.recipe: toSchema).
 * Keep tiny, side-effect free, and truthful (no unused options).
 */
export const idRecipe = (o: StrOpts = {}): t.Schema.StrSpec =>
  V.string({ pattern: ID_PATTERN, description: ID_DESC, ...o });

export const crdtRefRecipe = (o: StrOpts = {}): t.Schema.StrSpec =>
  V.string({ pattern: CRDT_PATTERN, description: CRDT_DESC, ...o });
