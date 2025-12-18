import { type t } from './common.ts';
import { parse } from './u.parse.ts';

export const matchContains: t.Filter.MatchFn = (query, text, options = {}) => {
  const q = typeof query === 'string' ? parse(query, options) : query;
  const qText = q.text;
  const qTokens = q.tokens;

  // Empty query matches everything (like CMD+P baseline).
  if (!qText) return { match: true, score: 0 };

  const caseSensitive = options.caseSensitive ?? false;
  const hay = normalize(text, caseSensitive);

  const tokens = qTokens?.length ? qTokens : [qText];
  const ranges: t.Filter.Range[] = [];

  for (const tokenRaw of tokens) {
    const token = normalize(tokenRaw, caseSensitive);
    const start = hay.indexOf(token);
    if (start < 0) return { match: false, score: 0 };

    const end = start + token.length;
    ranges.push({ start: start as t.Index, end: end as t.Index });
  }

  ranges.sort((a, b) => a.start - b.start);

  // Simple, stable scoring: more tokens + earlier matches score higher.
  const score = scoreContains(hay.length, ranges);
  const res: t.Filter.MatchResult = {
    match: true,
    score,
    ranges: ranges.length ? ranges : undefined,
  };
  return res;
};

/**
 * Helpers
 */

function normalize(input: string, caseSensitive: boolean): string {
  return caseSensitive ? input : input.toLowerCase();
}

function scoreContains(hayLen: number, ranges: readonly t.Filter.Range[]): number {
  if (ranges.length === 0) return 0;
  const denom = Math.max(1, hayLen);
  let s = ranges.length; // token-count baseline
  for (const r of ranges) {
    s += (denom - r.start) / denom; // earlier start → slightly higher
  }
  return s;
}
