import { type t, V } from './common.ts';

/**
 * CRDT reference:
 *   - "crdt:create"
 *   - crdt:<base62-28>[/path]
 *   - urn:crdt:<base62-28>[/path]
 */
const BASE62 = '[A-Za-z0-9]{28}';
const SEG = '[A-Za-z0-9][A-Za-z0-9._\\-]*';
const PATH = `(?:\\/${SEG}(?:\\/${SEG})*)?`;

export const CRDT_PATTERN = `^(?:crdt:create|crdt:${BASE62}${PATH}|urn:crdt:${BASE62}${PATH})$`;

const CRDT_DESC = 'CRDT reference ("crdt:create" or base62 id with optional /path).';

/** Ergonomic option alias for recipe string specs (pattern fixed). */
type StrOpts = Omit<t.Schema.StrSpec, 'kind' | 'pattern'>;

/**
 * Legacy pattern surface (back-compat).
 * Returns { description, pattern }.
 */
export const crdtRefPattern: t.SlugSchemaPatternLib['crdtRefPattern'] = () => ({
  description: CRDT_DESC,
  pattern: CRDT_PATTERN,
});

/**
 * Value-only recipe builder (compile later via @sys/schema/m.recipe: toSchema).
 * Pure, declarative, and side-effect free.
 */
export const crdtRefRecipe = (o: StrOpts = {}): t.Schema.StrSpec =>
  V.string({
    pattern: CRDT_PATTERN,
    description: CRDT_DESC,
    ...o,
  });
