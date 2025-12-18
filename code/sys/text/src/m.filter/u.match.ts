import { type t } from './common.ts';
import { matchContains } from './u.match.contains.ts';
import { matchFuzzy } from './u.match.fuzzy.ts';

export const match: t.TextFilter.MatchFn = (query, text, options) => {
  const mode = options?.mode ?? 'contains';

  switch (mode) {
    case 'fuzzy':
      return matchFuzzy(query, text, options);

    case 'contains':
    default:
      return matchContains(query, text, options);
  }
};
