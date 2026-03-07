import { type t } from './common.ts';
import { parse } from './u.parse.ts';

export const matchFuzzy: t.TextFilter.MatchFn = (query, text, options = {}) => {
  const q = typeof query === 'string' ? parse(query, options) : query;
  const tokens = q.tokens?.length ? q.tokens : q.text ? [q.text] : [];

  // Empty query matches everything (like CMD+P baseline).
  if (tokens.length === 0) return { match: true, score: 0 };

  const caseSensitive = options.caseSensitive ?? false;
  const hay = caseSensitive ? text : text.toLowerCase();

  let searchFrom = 0;
  let firstStart = -1;
  let lastEnd = -1;
  const ranges: t.TextFilter.Range[] = [];

  for (const tokenRaw of tokens) {
    const token = caseSensitive ? tokenRaw : tokenRaw.toLowerCase();
    if (!token) continue;

    let ti = searchFrom;
    let qi = 0;
    let start = -1;
    let last = -1;

    while (ti < hay.length && qi < token.length) {
      if (hay[ti] === token[qi]) {
        if (start === -1) start = ti;
        last = ti;
        qi++;
      }
      ti++;
    }

    if (qi !== token.length || start === -1 || last === -1) {
      return { match: false, score: 0 };
    }

    if (firstStart === -1) firstStart = start;
    lastEnd = last + 1;

    // Contract (per tests): fuzzy highlights the whole candidate text.
    ranges.push({ start: 0, end: text.length });
    searchFrom = last + 1; // tokens must match in order
  }

  const span = Math.max(1, lastEnd - firstStart);
  const total = tokens.join('').length;

  return {
    match: true,
    score: total / span,
    ranges: ranges.length ? ranges : undefined,
  };
};
