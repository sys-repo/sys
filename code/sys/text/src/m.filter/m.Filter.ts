import type { t } from './common.ts';
import { match } from './u.match.ts';
import { parse } from './u.parse.ts';

export const Filter: t.Filter.Lib = {
  parse,
  match,
};
