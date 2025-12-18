import { type t } from './common.ts';
import { match } from './u.match.ts';
import { parse } from './u.parse.ts';

type ApplyResultWithIndex<T> = t.TextFilter.Result<T> & { readonly __index: t.Index };

/**
 * Apply a query across a set of candidates.
 *
 * - Normalizes the query once (for string input).
 * - Drops non-matching candidates.
 * - Sorts by score (desc), stable by original order.
 * - Applies `options.limit` if provided.
 */
export const apply = <T>(
  query: t.TextFilter.QueryInput | t.TextFilter.Query,
  candidates: readonly t.TextFilter.Candidate<T>[],
  options?: t.TextFilter.Options,
): readonly t.TextFilter.Result<T>[] => {
  const q = typeof query === 'string' ? parse(query, options) : query;

  const results = candidates
    .map((item, index): ApplyResultWithIndex<T> => {
      const r = match(q, item.text, options);
      return {
        text: item.text,
        value: item.value,
        match: r.match,
        score: r.score,
        ranges: r.ranges,
        __index: index as t.Index,
      };
    })
    .filter((r): r is ApplyResultWithIndex<T> => r.match);

  results.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score; // higher first
    return a.__index - b.__index; // stable tie-breaker
  });

  const limit = options?.limit;
  const sliced = typeof limit === 'number' ? results.slice(0, Math.max(0, limit)) : results;

  return sliced.map((r) => {
    const { __index: _i, ...rest } = r;
    return rest;
  });
};
// 🌸 ---------- /ADDED: filter-apply ----------
