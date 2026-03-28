import type { t } from './common.ts';
import { apply } from './u.apply.ts';
import { match } from './u.match.ts';
import { parse } from './u.parse.ts';

/**
 * Text filtering and matching utilities.
 * Pure helpers for parsing a query, matching it against a single text value, and applying it across a candidate set.
 *
 * Surface:
 * - parse(query) → normalized Query
 * - match(query, text) → { match, score, ranges? }
 * - apply(query, candidates) → scored results (optionally limited)
 */
export const Filter: t.TextFilter.Lib = {
  parse,
  match,
  apply,
};
