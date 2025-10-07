import type { MediaFiltersLib } from './t.ts';

import { D } from './common.ts';
import { toString, values } from './u.filter.ts';
import { List } from './ui.Filters.tsx';

export const Filters: MediaFiltersLib = {
  UI: { List },
  config: D.config,
  values,
  toString,
};
